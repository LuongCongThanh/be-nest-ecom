import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { slugify } from '@common/utils/slugify.util';
import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    const slug = dto.slug ?? slugify(dto.name);

    await this.assertSlugAvailable(slug);
    await this.assertSkuAvailable(dto.sku);

    if (dto.comparePrice !== undefined && dto.comparePrice < dto.price) {
      throw new BadRequestException({
        code: 'INVALID_COMPARE_PRICE',
        message: 'comparePrice must be greater than or equal to price',
      });
    }

    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        slug,
        description: dto.description,
        price: BigInt(dto.price),
        comparePrice: dto.comparePrice !== undefined ? BigInt(dto.comparePrice) : null,
        stockQuantity: dto.stockQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        categoryId: dto.categoryId ?? null,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    return this.serialize(product);
  }

  // ─── Find all (public — active only) ─────────────────────────────────────

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, isFeatured, minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      isActive: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: BigInt(minPrice) } : {}),
              ...(maxPrice !== undefined ? { lte: BigInt(maxPrice) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: data.map((p) => this.serialize(p)), total, page, limit };
  }

  // ─── Find one (public) ────────────────────────────────────────────────────

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    return this.serialize(product);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    if (dto.sku && dto.sku !== existing.sku) {
      await this.assertSkuAvailable(dto.sku, id);
    }

    const newPrice = dto.price !== undefined ? BigInt(dto.price) : existing.price;
    const newComparePrice = dto.comparePrice !== undefined ? BigInt(dto.comparePrice) : existing.comparePrice;

    if (newComparePrice !== null && newComparePrice < newPrice) {
      throw new BadRequestException({
        code: 'INVALID_COMPARE_PRICE',
        message: 'comparePrice must be greater than or equal to price',
      });
    }

    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const updateData: Record<string, unknown> = {};
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = BigInt(dto.price);
    if (dto.comparePrice !== undefined) updateData.comparePrice = BigInt(dto.comparePrice);
    if (dto.stockQuantity !== undefined) updateData.stockQuantity = dto.stockQuantity;
    if (dto.lowStockThreshold !== undefined) updateData.lowStockThreshold = dto.lowStockThreshold;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return this.serialize(product);
  }

  // ─── Soft delete ─────────────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ─── Stock management (atomic) ────────────────────────────────────────────

  async adjustStock(id: string, delta: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, stockQuantity: true },
      });
      if (!product) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const newQty = product.stockQuantity + delta;
      if (newQty < 0) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock. Available: ${product.stockQuantity}, requested: ${Math.abs(delta)}`,
        });
      }
      await tx.product.update({
        where: { id },
        data: { stockQuantity: newQty },
      });
    });
  }

  // ─── Admin: find all (includes inactive) ─────────────────────────────────

  async findAllAdmin(query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, isFeatured } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: data.map((p) => this.serialize(p)), total, page, limit };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private serialize(product: any): any {
    return {
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice !== null ? Number(product.comparePrice) : null,
    };
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existing) {
      throw new UnprocessableEntityException({ code: 'SLUG_CONFLICT', message: `Slug "${slug}" already exists` });
    }
  }

  private async assertSkuAvailable(sku: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: { sku, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existing) {
      throw new UnprocessableEntityException({ code: 'SKU_CONFLICT', message: `SKU "${sku}" already exists` });
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const cat = await this.prisma.category.findFirst({ where: { id: categoryId, deletedAt: null } });
    if (!cat) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
  }
}
