import { PrismaService } from '@common/prisma/prisma.service';
import { ImageSize, Prisma } from '@prisma/client';
import { slugify } from '@common/utils/slugify.util';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto, ProductSortOption } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  private readonly storagePublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.storagePublicUrl = config.getOrThrow('STORAGE_PUBLIC_URL');
  }

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

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
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

      if (dto.images?.length) {
        await tx.productImage.createMany({
          data: dto.images.map((image, position) => ({
            productId: created.id,
            key: image.key,
            url: `${this.storagePublicUrl}/${image.key}`,
            size: ImageSize.MEDIUM,
            width: 0,
            height: 0,
            position,
          })),
        });
      }

      return created;
    });

    return this.serialize(product);
  }

  // ─── Find all (public — with filtering, sorting, facets) ─────────────────

  async findAll(query: QueryProductDto) {
    const { page = 1, sort, search, categorySlug, categoryId, isFeatured, minPrice, maxPrice } = query;
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

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      return this.findAllBySearch({ search: trimmedSearch, sort, page, limit, skip, categoryIds: resolvedCategoryIds, isFeatured, minPrice, maxPrice, inStock });
    }

    // No search term → default sort is `featured`. When searching, the default is
    // relevance instead (see findAllBySearch), unless the caller picks an explicit sort.
    const effectiveSort = sort ?? ProductSortOption.FEATURED;
    const where = this.buildPublicWhere({ categoryIds: resolvedCategoryIds, isFeatured, minPrice, maxPrice, inStock });
    const orderBy = this.buildOrderBy(effectiveSort);

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

  private buildPublicWhere({ categoryIds, isFeatured, minPrice, maxPrice, inStock }: { categoryIds?: string[]; isFeatured?: boolean; minPrice?: number; maxPrice?: number; inStock: boolean }) {
    return {
      deletedAt: null,
      isActive: true,
      ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
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

  // ─── Full-text search (Postgres tsvector + GIN expression index) ─────────
  // Isolated raw-SQL path used only when `search` is present. The browsing
  // path above (buildPublicWhere/buildOrderBy/computeFacets) is untouched.

  private readonly SEARCH_VECTOR_SQL = Prisma.sql`(
    setweight(to_tsvector('simple', immutable_unaccent(p.name)), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(p.description, ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(p.sku)), 'C')
  )`;

  private buildSearchTsQuery(search: string): Prisma.Sql {
    const words = search.split(/\s+/).filter(Boolean).slice(0, 10);
    const fragments = words.map((word) => Prisma.sql`plainto_tsquery('simple', immutable_unaccent(${word}))`);
    // OR between words — a product matching more words ranks higher via ts_rank,
    // but isn't excluded just for missing one (fixes "too few results").
    return Prisma.sql`(${Prisma.join(fragments, ' || ')})`;
  }

  private buildSearchOrderBy(sort: ProductSortOption | undefined, rankSql: Prisma.Sql): Prisma.Sql {
    switch (sort) {
      case ProductSortOption.PRICE_ASC:
        return Prisma.sql`p.price ASC`;
      case ProductSortOption.PRICE_DESC:
        return Prisma.sql`p.price DESC`;
      case ProductSortOption.NEWEST:
        return Prisma.sql`p."createdAt" DESC`;
      case ProductSortOption.BESTSELLER:
        return Prisma.sql`p."createdAt" DESC`;
      case ProductSortOption.FEATURED:
        return Prisma.sql`p."isFeatured" DESC, p."createdAt" DESC`;
      default:
        // No explicit sort while searching → default to relevance.
        return Prisma.sql`${rankSql} DESC`;
    }
  }

  private async findAllBySearch(params: {
    search: string;
    sort?: ProductSortOption;
    page: number;
    limit: number;
    skip: number;
    categoryIds?: string[];
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock: boolean;
  }) {
    const { search, sort, page, limit, skip, categoryIds, isFeatured, minPrice, maxPrice, inStock } = params;

    const tsquery = this.buildSearchTsQuery(search);

    const baseConditions: Prisma.Sql[] = [Prisma.sql`p."deletedAt" IS NULL`, Prisma.sql`p."isActive" = true`, Prisma.sql`${this.SEARCH_VECTOR_SQL} @@ ${tsquery}`];
    if (categoryIds?.length) baseConditions.push(Prisma.sql`p."categoryId" IN (${Prisma.join(categoryIds)})`);
    if (isFeatured !== undefined) baseConditions.push(Prisma.sql`p."isFeatured" = ${isFeatured}`);
    if (minPrice !== undefined) baseConditions.push(Prisma.sql`p.price >= ${BigInt(minPrice)}`);
    if (maxPrice !== undefined) baseConditions.push(Prisma.sql`p.price <= ${BigInt(maxPrice)}`);

    const whereSql = Prisma.join(inStock ? [...baseConditions, Prisma.sql`p."stockQuantity" > 0`] : baseConditions, ' AND ');
    const rankSql = Prisma.sql`ts_rank(${this.SEARCH_VECTOR_SQL}, ${tsquery})`;
    const orderBySql = this.buildSearchOrderBy(sort, rankSql);

    const [rows, countRows, facets] = await Promise.all([
      this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT p.*, c.id as "categoryTableId", c.name as "categoryName", c.slug as "categorySlug"
        FROM products p
        LEFT JOIN categories c ON c.id = p."categoryId"
        WHERE ${whereSql}
        ORDER BY ${orderBySql}
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint as count FROM products p WHERE ${whereSql}`,
      this.computeFacetsRaw(baseConditions, inStock),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    return {
      data: rows.map((row) => this.serializeSearchRow(row)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      facets,
    };
  }

  private serializeSearchRow(row: Record<string, unknown>) {
    const { categoryTableId, categoryName, categorySlug, ...product } = row;
    return this.serialize({
      ...product,
      category: categoryTableId ? { id: categoryTableId, name: categoryName, slug: categorySlug } : null,
    });
  }

  private async computeFacetsRaw(baseConditions: Prisma.Sql[], inStock: boolean) {
    const PRICE_BUCKETS = [
      { range: '0-1M', gte: 0, lt: 1_000_000 },
      { range: '1M-5M', gte: 1_000_000, lt: 5_000_000 },
      { range: '5M-10M', gte: 5_000_000, lt: 10_000_000 },
      { range: '10M-20M', gte: 10_000_000, lt: 20_000_000 },
      { range: 'over-20M', gte: 20_000_000, lt: undefined },
    ];

    const whereSql = Prisma.join(inStock ? [...baseConditions, Prisma.sql`p."stockQuantity" > 0`] : baseConditions, ' AND ');
    const baseWhereSql = Prisma.join(baseConditions, ' AND ');

    const [categoryGroups, priceRangeCounts, inStockRows] = await Promise.all([
      this.prisma.$queryRaw<{ categoryId: string; count: bigint }[]>`
        SELECT p."categoryId" as "categoryId", COUNT(*)::bigint as count
        FROM products p
        WHERE ${whereSql} AND p."categoryId" IS NOT NULL
        GROUP BY p."categoryId"
      `,
      Promise.all(
        PRICE_BUCKETS.map(async (b) => {
          const priceCondition = b.lt !== undefined ? Prisma.sql`p.price >= ${BigInt(b.gte)} AND p.price < ${BigInt(b.lt)}` : Prisma.sql`p.price >= ${BigInt(b.gte)}`;
          const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint as count FROM products p WHERE ${whereSql} AND ${priceCondition}
          `;
          return { range: b.range, count: Number(rows[0]?.count ?? 0) };
        }),
      ),
      this.prisma.$queryRaw<{ inStock: boolean; count: bigint }[]>`
        SELECT (p."stockQuantity" > 0) as "inStock", COUNT(*)::bigint as count
        FROM products p
        WHERE ${baseWhereSql}
        GROUP BY (p."stockQuantity" > 0)
      `,
    ]);

    const catIds = categoryGroups.map((g) => g.categoryId);
    const categories = catIds.length ? await this.prisma.category.findMany({ where: { id: { in: catIds }, deletedAt: null }, select: { id: true, name: true, slug: true } }) : [];
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const inStockMap = new Map(inStockRows.map((r) => [r.inStock, Number(r.count)]));

    return {
      categories: categoryGroups.map((g) => ({ ...catMap.get(g.categoryId), count: Number(g.count) })).filter((g) => g.slug),
      priceRanges: priceRangeCounts,
      inStock: { true: inStockMap.get(true) ?? 0, false: inStockMap.get(false) ?? 0 },
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
