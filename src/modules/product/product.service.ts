import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { slugify } from '@common/utils/slugify.util';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto, ProductSortOption } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

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

  // ─── Find all (public — with filtering, sorting, facets) ─────────────────

  async findAll(query: QueryProductDto) {
    const { page = 1, sort = ProductSortOption.FEATURED, search, categorySlug, categoryId, isFeatured, minPrice, maxPrice } = query;
    const limit = Math.min(query.limit ?? 20, 100);
    // inStock defaults to true (public browsing shows only in-stock products)
    const inStock = query.inStock ?? true;
    const skip = (page - 1) * limit;

    // Resolve category filter — slug takes priority; descendant-inclusive
    let resolvedCategoryIds: string[] | undefined;
    if (categorySlug) {
      resolvedCategoryIds = await this.getCategoryDescendantIds(categorySlug);
      // slug not found → empty result rather than crash
      if (!resolvedCategoryIds.length) {
        const empty = { data: [], pagination: { page, limit, total: 0, totalPages: 0 }, facets: this.emptyFacets() };
        return empty;
      }
    } else if (categoryId) {
      resolvedCategoryIds = [categoryId];
    }

    const where = this.buildPublicWhere({ search, categoryIds: resolvedCategoryIds, isFeatured, minPrice, maxPrice, inStock });
    const orderBy = this.buildOrderBy(sort);

    const [[data, total], facets] = await Promise.all([
      this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: { category: { select: { id: true, name: true, slug: true } } },
        }),
        this.prisma.product.count({ where }),
      ]),
      this.computeFacets(where),
    ]);

    return {
      data: data.map((p) => this.serialize(p)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      facets,
    };
  }

  private buildPublicWhere({
    search,
    categoryIds,
    isFeatured,
    minPrice,
    maxPrice,
    inStock,
  }: {
    search?: string;
    categoryIds?: string[];
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock: boolean;
  }) {
    return {
      deletedAt: null,
      isActive: true,
      ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
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
  }

  private buildOrderBy(sort: ProductSortOption) {
    switch (sort) {
      case ProductSortOption.PRICE_ASC:
        return [{ price: 'asc' as const }];
      case ProductSortOption.PRICE_DESC:
        return [{ price: 'desc' as const }];
      case ProductSortOption.NEWEST:
        return [{ createdAt: 'desc' as const }];
      case ProductSortOption.BESTSELLER:
        // No order data yet — fall back to newest
        return [{ createdAt: 'desc' as const }];
      case ProductSortOption.FEATURED:
      default:
        return [{ isFeatured: 'desc' as const }, { createdAt: 'desc' as const }];
    }
  }

  private async getCategoryDescendantIds(slug: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE descendants AS (
        SELECT id FROM categories WHERE slug = ${slug} AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id FROM categories c
        JOIN descendants d ON c."parentId" = d.id
        WHERE c."deletedAt" IS NULL
      )
      SELECT id FROM descendants
    `;
    return rows.map((r) => r.id);
  }

  private async computeFacets(where: ReturnType<typeof this.buildPublicWhere>) {
    const PRICE_BUCKETS = [
      { range: '0-1M', gte: 0, lt: 1_000_000 },
      { range: '1M-5M', gte: 1_000_000, lt: 5_000_000 },
      { range: '5M-10M', gte: 5_000_000, lt: 10_000_000 },
      { range: '10M-20M', gte: 10_000_000, lt: 20_000_000 },
      { range: 'over-20M', gte: 20_000_000, lt: undefined },
    ];

    const [categoryGroups, priceRangeCounts, inStockCount, outOfStockCount] = await Promise.all([
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: { ...where, categoryId: { not: null } },
        _count: { _all: true },
      }),
      Promise.all(
        PRICE_BUCKETS.map((b) =>
          this.prisma.product
            .count({
              where: {
                ...where,
                price: {
                  gte: BigInt(b.gte),
                  ...(b.lt !== undefined ? { lt: BigInt(b.lt) } : {}),
                },
              },
            })
            .then((count) => ({ range: b.range, count })),
        ),
      ),
      this.prisma.product.count({ where: { ...where, stockQuantity: { gt: 0 } } }),
      this.prisma.product.count({ where: { ...where, stockQuantity: { lte: 0 } } }),
    ]);

    // Enrich category groups with slug/name
    const catIds = categoryGroups.map((g) => g.categoryId).filter(Boolean) as string[];
    const categories =
      catIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: catIds }, deletedAt: null },
            select: { id: true, name: true, slug: true },
          })
        : [];
    const catMap = new Map(categories.map((c) => [c.id, c]));

    return {
      categories: categoryGroups.map((g) => ({ ...catMap.get(g.categoryId!), count: g._count._all })).filter((g) => g.slug),
      priceRanges: priceRangeCounts,
      inStock: { true: inStockCount, false: outOfStockCount },
    };
  }

  private emptyFacets() {
    return { categories: [], priceRanges: [], inStock: { true: 0, false: 0 } };
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

  /**
   * Deduct stock when an order is created. Uses SELECT FOR UPDATE to prevent
   * overselling under concurrent checkouts. Accepts an external tx so
   * OrderService can bundle this in the same checkout transaction.
   */
  async commitStock(productId: string, qty: number, orderItemId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (client: Prisma.TransactionClient) => {
      const rows = await client.$queryRaw<{ id: string; stockQuantity: number }[]>`
        SELECT id, "stockQuantity" FROM products
        WHERE id = ${productId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (!rows.length) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const product = rows[0];
      const newQty = product.stockQuantity - qty;
      if (newQty < 0) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock. Available: ${product.stockQuantity}, requested: ${qty}`,
        });
      }
      await client.product.update({ where: { id: productId }, data: { stockQuantity: newQty } });
      await client.stockMovement.create({
        data: {
          productId,
          type: 'OUTBOUND' as const,
          delta: -qty,
          balanceAfter: newQty,
          referenceType: 'OrderItem',
          referenceId: orderItemId,
        },
      });
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  /**
   * Restore stock when an order is cancelled or refunded.
   */
  async releaseStock(productId: string, qty: number, orderItemId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (client: Prisma.TransactionClient) => {
      const rows = await client.$queryRaw<{ id: string; stockQuantity: number }[]>`
        SELECT id, "stockQuantity" FROM products
        WHERE id = ${productId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (!rows.length) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const newQty = rows[0].stockQuantity + qty;
      await client.product.update({ where: { id: productId }, data: { stockQuantity: newQty } });
      await client.stockMovement.create({
        data: {
          productId,
          type: 'RETURN' as const,
          delta: qty,
          balanceAfter: newQty,
          referenceType: 'OrderItem',
          referenceId: orderItemId,
        },
      });
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  /**
   * Admin manual stock adjustment (INBOUND or ADJUSTMENT type).
   * Always requires a reason.
   */
  async manualAdjust(productId: string, dto: AdjustStockDto, performedById: string): Promise<void> {
    if (!dto.reason?.trim()) {
      throw new UnprocessableEntityException({ code: 'REASON_REQUIRED', message: 'reason is required for manual stock movements' });
    }

    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; stockQuantity: number }[]>`
        SELECT id, "stockQuantity" FROM products
        WHERE id = ${productId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (!rows.length) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const newQty = rows[0].stockQuantity + dto.delta;
      if (newQty < 0) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `Adjustment would result in negative stock. Current: ${rows[0].stockQuantity}, delta: ${dto.delta}`,
        });
      }
      await tx.product.update({ where: { id: productId }, data: { stockQuantity: newQty } });
      await tx.stockMovement.create({
        data: {
          productId,
          type: dto.type,
          delta: dto.delta,
          balanceAfter: newQty,
          reason: dto.reason,
          performedById,
        },
      });
    });
  }

  /**
   * Admin stock movement history for a product.
   */
  async getStockHistory(productId: string, page = 1, limit = 20) {
    const existing = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!existing) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: { performedBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);

    return { data, total, page, limit };
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
      price: (product.price as bigint).toString(),
      comparePrice: product.comparePrice !== null ? (product.comparePrice as bigint).toString() : null,
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
