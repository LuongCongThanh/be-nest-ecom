import { FileUploadService } from '@common/file-upload/file-upload.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { slugify } from '@common/utils/slugify.util';
import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { ReorderCategoryDto } from './dto/reorder-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const MAX_DEPTH = 5;

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUploadService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateCategoryDto): Promise<Category> {
    const baseSlug = dto.slug ?? slugify(dto.name);

    await this.assertSlugAvailable(baseSlug);

    if (dto.parentId) {
      await this.assertParentExists(dto.parentId);
      const parentDepth = await this.getDepth(dto.parentId);
      if (parentDepth + 1 > MAX_DEPTH) {
        throw new UnprocessableEntityException({
          code: 'CATEGORY_MAX_DEPTH_EXCEEDED',
          message: `Category tree cannot exceed ${MAX_DEPTH} levels deep`,
        });
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: baseSlug,
        description: dto.description,
        parentId: dto.parentId ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  // ─── Find all (flat list) ─────────────────────────────────────────────────

  async findAll(query: QueryCategoryDto, includeInactive = false) {
    const { page = 1, limit = 20, parentId, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
      ...(parentId !== undefined ? { parentId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Tree ─────────────────────────────────────────────────────────────────

  async getTree(includeInactive = false): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return this.buildTree(categories, null);
  }

  private buildTree(categories: Category[], parentId: string | null): any[] {
    return categories.filter((c) => c.parentId === parentId).map((c) => ({ ...c, children: this.buildTree(categories, c.id) }));
  }

  // ─── Find one (by ID or slug) ─────────────────────────────────────────────

  async findOne(id: string): Promise<Category> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id, deletedAt: null } : { slug: id, deletedAt: null };
    const category = await this.prisma.category.findFirst({ where });
    if (!category) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    return category;
  }

  // ─── Find by slug (public detail + direct children) ──────────────────────

  async findBySlug(slug: string, includeInactive = false) {
    const activeFilter = includeInactive ? {} : { isActive: true };
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null, ...activeFilter },
      include: {
        children: {
          where: { deletedAt: null, ...activeFilter },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, name: true, slug: true, image: true, sortOrder: true, isActive: true },
        },
      },
    });
    if (!category) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    return category;
  }

  // ─── Breadcrumb (root → node) ─────────────────────────────────────────────

  async getBreadcrumb(slug: string): Promise<{ id: string; name: string; slug: string }[]> {
    const rows = await this.prisma.$queryRaw<{ id: string; name: string; slug: string; depth: number }[]>`
      WITH RECURSIVE ancestors AS (
        SELECT id, name, slug, "parentId", 0 AS depth
        FROM categories
        WHERE slug = ${slug} AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id, c.name, c.slug, c."parentId", a.depth + 1
        FROM categories c
        JOIN ancestors a ON c.id = a."parentId"
        WHERE c."deletedAt" IS NULL
      )
      SELECT id, name, slug, depth FROM ancestors
      ORDER BY depth DESC
    `;
    if (!rows.length) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    return rows.map(({ id, name, slug: s }) => ({ id, name, slug: s }));
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const existing = await this.findOne(id);

    // Slug is independent of name — only update if explicitly provided
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new UnprocessableEntityException({
          code: 'CIRCULAR_PARENT_REFERENCE',
          message: 'A category cannot be its own parent',
        });
      }
      if (dto.parentId !== null) {
        await this.assertParentExists(dto.parentId);
        const isCircular = await this.isCircular(id, dto.parentId);
        if (isCircular) {
          throw new UnprocessableEntityException({
            code: 'CIRCULAR_PARENT_REFERENCE',
            message: 'This parent assignment would create a circular reference',
          });
        }
        // Check that moving this subtree doesn't exceed max depth
        const newParentDepth = await this.getDepth(dto.parentId);
        const subtreeHeight = await this.getSubtreeHeight(id);
        if (newParentDepth + subtreeHeight > MAX_DEPTH) {
          throw new UnprocessableEntityException({
            code: 'CATEGORY_MAX_DEPTH_EXCEEDED',
            message: `Moving this category would exceed the maximum depth of ${MAX_DEPTH}`,
          });
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  // ─── Soft delete ─────────────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);

    const childCount = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new BadRequestException({
        code: 'CATEGORY_HAS_CHILDREN',
        message: 'Cannot delete a category that still has child categories. Re-parent or delete children first.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.product.updateMany({
        where: { categoryId: id, deletedAt: null },
        data: { categoryId: null },
      }),
    ]);
  }

  // ─── Restore ─────────────────────────────────────────────────────────────

  async restore(id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({ where: { id } });
    if (!category) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    if (!category.deletedAt) {
      throw new BadRequestException({ code: 'CATEGORY_NOT_DELETED', message: 'Category is not deleted' });
    }

    if (category.parentId) {
      const parent = await this.prisma.category.findFirst({ where: { id: category.parentId } });
      if (parent?.deletedAt) {
        throw new BadRequestException({
          code: 'CATEGORY_PARENT_DELETED',
          message: 'Cannot restore: parent category is also deleted. Restore the parent first.',
        });
      }
    }

    // Slug conflict: check if another active category now has the same slug
    const slugConflict = await this.prisma.category.findFirst({
      where: { slug: category.slug, deletedAt: null, id: { not: id } },
    });
    if (slugConflict) {
      const suggestedSlug = await this.findNextAvailableSlug(category.slug, id);
      throw new UnprocessableEntityException({
        code: 'SLUG_CONFLICT',
        message: `Slug "${category.slug}" is already taken`,
        meta: { suggestedSlug },
      });
    }

    return this.prisma.category.update({ where: { id }, data: { deletedAt: null } });
  }

  // ─── Bulk reorder ─────────────────────────────────────────────────────────

  async reorder(dto: ReorderCategoryDto): Promise<void> {
    const ids = dto.items.map((i) => i.id);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, parentId: true },
    });

    if (categories.length !== ids.length) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'One or more categories not found' });
    }

    const uniqueParents = new Set(categories.map((c) => c.parentId));
    if (uniqueParents.size > 1) {
      throw new UnprocessableEntityException({
        code: 'REORDER_MIXED_PARENTS',
        message: 'All categories in a reorder request must share the same parent',
      });
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  // ─── Image ───────────────────────────────────────────────────────────────

  async uploadImage(id: string, buffer: Buffer): Promise<Category> {
    const category = await this.findOne(id);
    if (category.image) {
      const oldKey = this.extractKey(category.image);
      if (oldKey) await this.fileUpload.deleteFile(oldKey);
    }
    const { url } = await this.fileUpload.uploadCategoryImage(buffer, id);
    return this.prisma.category.update({ where: { id }, data: { image: url } });
  }

  async deleteImage(id: string): Promise<void> {
    const category = await this.findOne(id);
    if (!category.image) return;
    const key = this.extractKey(category.image);
    if (key) await this.fileUpload.deleteFile(key);
    await this.prisma.category.update({ where: { id }, data: { image: null } });
  }

  private extractKey(url: string): string | null {
    try {
      return new URL(url).pathname.slice(1);
    } catch {
      return null;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existing) {
      const suggestedSlug = await this.findNextAvailableSlug(slug, excludeId);
      throw new UnprocessableEntityException({
        code: 'SLUG_CONFLICT',
        message: `Slug "${slug}" already exists`,
        meta: { suggestedSlug },
      });
    }
  }

  private async findNextAvailableSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = `${baseSlug}-2`;
    let counter = 3;
    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      });
      if (!existing) return slug;
      slug = `${baseSlug}-${counter++}`;
    }
  }

  private async assertParentExists(parentId: string): Promise<void> {
    const parent = await this.prisma.category.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!parent) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Parent category not found' });
  }

  private async getDepth(categoryId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ depth: bigint }]>`
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentId", 0 AS depth
        FROM categories
        WHERE id = ${categoryId}::uuid AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id, c."parentId", a.depth + 1
        FROM categories c
        JOIN ancestors a ON c.id = a."parentId"
        WHERE c."deletedAt" IS NULL
      )
      SELECT COALESCE(MAX(depth), 0) AS depth FROM ancestors
    `;
    return Number(result[0]?.depth ?? 0);
  }

  private async getSubtreeHeight(categoryId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ height: bigint }]>`
      WITH RECURSIVE subtree AS (
        SELECT id, "parentId", 1 AS height
        FROM categories
        WHERE id = ${categoryId}::uuid AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id, c."parentId", s.height + 1
        FROM categories c
        JOIN subtree s ON c."parentId" = s.id
        WHERE c."deletedAt" IS NULL
      )
      SELECT COALESCE(MAX(height), 1) AS height FROM subtree
    `;
    return Number(result[0]?.height ?? 1);
  }

  private async isCircular(categoryId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId;
    while (currentId) {
      if (currentId === categoryId) return true;
      const id: string = currentId;
      const cat: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id },
        select: { parentId: true },
      });
      currentId = cat?.parentId ?? null;
    }
    return false;
  }
}
