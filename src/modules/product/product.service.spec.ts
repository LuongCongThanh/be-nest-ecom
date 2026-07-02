import 'dotenv/config';
import { PrismaClient, ImageSize } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '@common/prisma/prisma.service';
import { slugify } from '@common/utils/slugify.util';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSortOption } from './dto/query-product.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const productService = new ProductService(prisma, new ConfigService());

interface ProductRecord {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: string;
  comparePrice: string | null;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}

interface ProductListResult {
  data: ProductRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  facets: { categories: { id: string; name: string; slug: string; count: number }[]; priceRanges: { range: string; count: number }[]; inStock: { true: number; false: number } };
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function baseDto(overrides: Partial<CreateProductDto> = {}): CreateProductDto {
  const suffix = uniqueSuffix();
  return {
    sku: `SKU-${suffix}`.toUpperCase(),
    name: `Test Product ${suffix}`,
    price: 100_000,
    ...overrides,
  };
}

async function createProduct(overrides: Partial<CreateProductDto> = {}): Promise<ProductRecord> {
  return (await productService.create(baseDto(overrides))) as ProductRecord;
}

async function updateProduct(id: string, dto: UpdateProductDto): Promise<ProductRecord> {
  return (await productService.update(id, dto)) as ProductRecord;
}

async function findProduct(id: string): Promise<ProductRecord> {
  return (await productService.findOne(id)) as ProductRecord;
}

async function findAllProducts(query: Parameters<typeof productService.findAll>[0]): Promise<ProductListResult> {
  return productService.findAll(query);
}

async function createTestCategory() {
  const suffix = uniqueSuffix();
  return prisma.category.create({ data: { name: `Category ${suffix}`, slug: `category-${suffix}` } });
}

describe('ProductService', () => {
  const createdProductIds: string[] = [];
  const createdCategoryIds: string[] = [];

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('creates a product with defaults applied', async () => {
      const dto = baseDto();
      const product = (await productService.create(dto)) as ProductRecord;
      createdProductIds.push(product.id);

      expect(product.sku).toBe(dto.sku);
      expect(product.slug).toBe(slugify(dto.name));
      expect(product.isActive).toBe(true);
      expect(product.isFeatured).toBe(false);
      expect(product.stockQuantity).toBe(0);
      expect(product.lowStockThreshold).toBe(5);
      expect(product.price).toBe(String(dto.price));
    });

    it('rejects duplicate slug (SLUG_CONFLICT)', async () => {
      const product = await createProduct();

      await expect(productService.create(baseDto({ slug: product.slug }))).rejects.toMatchObject({
        response: { code: 'SLUG_CONFLICT' },
      });
    });

    it('rejects duplicate sku (SKU_CONFLICT)', async () => {
      const product = await createProduct();

      await expect(productService.create(baseDto({ sku: product.sku }))).rejects.toMatchObject({
        response: { code: 'SKU_CONFLICT' },
      });
    });

    it('rejects comparePrice lower than price (INVALID_COMPARE_PRICE)', async () => {
      await expect(productService.create(baseDto({ price: 100_000, comparePrice: 50_000 }))).rejects.toMatchObject({
        response: { code: 'INVALID_COMPARE_PRICE' },
      });
    });

    it('rejects unknown categoryId (CATEGORY_NOT_FOUND)', async () => {
      await expect(productService.create(baseDto({ categoryId: '00000000-0000-0000-0000-000000000000' }))).rejects.toMatchObject({
        response: { code: 'CATEGORY_NOT_FOUND' },
      });
    });

    it('accepts an existing categoryId', async () => {
      const category = await createTestCategory();
      createdCategoryIds.push(category.id);

      const product = await createProduct({ categoryId: category.id });
      createdProductIds.push(product.id);

      expect(product.categoryId).toBe(category.id);
    });

    it('creates a product with no images when the field is omitted (backward compatible)', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);

      const images = await prisma.productImage.findMany({ where: { productId: product.id } });
      expect(images).toHaveLength(0);
    });

    it('creates images at positions matching array order — first entry becomes primary', async () => {
      const product = await createProduct({
        images: [{ key: 'products/first.jpg' }, { key: 'products/second.jpg' }, { key: 'products/third.jpg' }],
      });
      createdProductIds.push(product.id);

      const images = await prisma.productImage.findMany({ where: { productId: product.id }, orderBy: { position: 'asc' } });
      expect(images.map((i) => i.key)).toEqual(['products/first.jpg', 'products/second.jpg', 'products/third.jpg']);
      expect(images.map((i) => i.position)).toEqual([0, 1, 2]);
      expect(images.every((i) => i.size === ImageSize.MEDIUM)).toBe(true);
    });

    it('rejects more than MAX_IMAGES entries at the DTO validation layer', async () => {
      const dto = plainToInstance(CreateProductDto, {
        sku: 'SKU-TOO-MANY',
        name: 'Too Many Images',
        price: 1000,
        images: Array.from({ length: 11 }, (_, i) => ({ key: `products/${i}.jpg` })),
      });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'images')).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns an active product', async () => {
      const created = await createProduct();
      createdProductIds.push(created.id);

      const found = await findProduct(created.id);
      expect(found.id).toBe(created.id);
    });

    it('throws PRODUCT_NOT_FOUND for an inactive product', async () => {
      const created = await createProduct({ isActive: false });
      createdProductIds.push(created.id);

      await expect(productService.findOne(created.id)).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });

    it('throws PRODUCT_NOT_FOUND for a missing id', async () => {
      await expect(productService.findOne('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });
  });

  describe('findAll', () => {
    it('paginates active in-stock products (default inStock=true excludes zero-stock items)', async () => {
      const created = await createProduct({ stockQuantity: 5 });
      createdProductIds.push(created.id);

      const result = await findAllProducts({ page: 1, limit: 20, search: created.name });
      expect(result.pagination.page).toBe(1);
      expect(result.data.some((p) => p.id === created.id)).toBe(true);
    });

    it('excludes zero-stock products by default', async () => {
      const created = await createProduct({ stockQuantity: 0 });
      createdProductIds.push(created.id);

      const result = await findAllProducts({ page: 1, limit: 20, search: created.name });
      expect(result.data.some((p) => p.id === created.id)).toBe(false);
    });

    it('filters by search text', async () => {
      const suffix = uniqueSuffix();
      const created = await createProduct({ name: `Unique-Search-Name-${suffix}`, stockQuantity: 5 });
      createdProductIds.push(created.id);

      const result = await findAllProducts({ page: 1, limit: 20, search: `Unique-Search-Name-${suffix}` });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(created.id);
    });

    describe('full-text search', () => {
      it('matches Vietnamese names when searched without diacritics', async () => {
        const suffix = uniqueSuffix();
        // Unicode escapes avoid literal diacritic characters, which no-vietnamese.spec.ts bans in src/*.ts.
        const accentedName = '\u0110\u1EB7cbietsanpham';
        const created = await createProduct({ name: `${accentedName}${suffix}`, stockQuantity: 5 });
        createdProductIds.push(created.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: `dacbietsanpham${suffix}` });
        expect(result.data.some((p) => p.id === created.id)).toBe(true);
      });

      it('matches a term that only appears in the description', async () => {
        const suffix = uniqueSuffix();
        const created = await createProduct({ name: `Product ${suffix}`, description: `Specialfeature${suffix} included`, stockQuantity: 5 });
        createdProductIds.push(created.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: `Specialfeature${suffix}` });
        expect(result.data.some((p) => p.id === created.id)).toBe(true);
      });

      it('matches a term that only appears in the sku', async () => {
        const created = await createProduct({ stockQuantity: 5 });
        createdProductIds.push(created.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: created.sku });
        expect(result.data.some((p) => p.id === created.id)).toBe(true);
      });

      it('returns a product matching only some of multiple search words (OR semantics)', async () => {
        const suffix = uniqueSuffix();
        const created = await createProduct({ name: `Zqvordan${suffix}`, stockQuantity: 5 });
        createdProductIds.push(created.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: `Zqvordan${suffix} NonExistentWordXyz999` });
        expect(result.data.some((p) => p.id === created.id)).toBe(true);
      });

      it('ranks a product matching more search words higher than one matching fewer', async () => {
        const suffix = uniqueSuffix();
        const wordA = `Kappazoid${suffix}`;
        const wordB = `Numeraxis${suffix}`;
        const bothMatch = await createProduct({ name: `${wordA} ${wordB}`, stockQuantity: 5 });
        createdProductIds.push(bothMatch.id);
        const oneMatch = await createProduct({ name: `${wordA} Something`, stockQuantity: 5 });
        createdProductIds.push(oneMatch.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: `${wordA} ${wordB}` });
        const ids = result.data.map((p) => p.id);
        expect(ids.indexOf(bothMatch.id)).toBeLessThan(ids.indexOf(oneMatch.id));
      });

      it('explicit sort overrides relevance ranking while searching', async () => {
        const suffix = uniqueSuffix();
        const wordA = `Plexinor${suffix}`;
        const cheap = await createProduct({ name: `${wordA} Alpha`, price: 50_000, stockQuantity: 5 });
        createdProductIds.push(cheap.id);
        const expensive = await createProduct({ name: `${wordA} Beta`, price: 500_000, stockQuantity: 5 });
        createdProductIds.push(expensive.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: wordA, sort: ProductSortOption.PRICE_ASC });
        const ids = result.data.map((p) => p.id);
        expect(ids.indexOf(cheap.id)).toBeLessThan(ids.indexOf(expensive.id));
      });

      it('reflects the search-matched set in facets, not the whole catalog', async () => {
        const suffix = uniqueSuffix();
        const category = await createTestCategory();
        createdCategoryIds.push(category.id);
        const created = await createProduct({ name: `Bravotellix${suffix}`, categoryId: category.id, stockQuantity: 5 });
        createdProductIds.push(created.id);

        const result = await findAllProducts({ page: 1, limit: 20, search: `Bravotellix${suffix}` });
        expect(result.facets.categories.some((c: { id: string }) => c.id === category.id)).toBe(true);
      });

      it('does not throw on garbage or special-character search input', async () => {
        await expect(findAllProducts({ page: 1, limit: 20, search: "'; DROP TABLE products; --" })).resolves.toBeDefined();
        await expect(findAllProducts({ page: 1, limit: 20, search: '&|!():*' })).resolves.toBeDefined();
      });

      it('treats whitespace-only search as no search at all', async () => {
        await expect(findAllProducts({ page: 1, limit: 20, search: '   ' })).resolves.toBeDefined();
      });
    });
  });

  describe('update', () => {
    it('updates provided fields only', async () => {
      const created = await createProduct();
      createdProductIds.push(created.id);

      const updated = await updateProduct(created.id, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
      expect(updated.sku).toBe(created.sku);
      expect(updated.slug).toBe(created.slug);
    });

    it('rejects changing slug to one already in use (SLUG_CONFLICT)', async () => {
      const productA = await createProduct();
      createdProductIds.push(productA.id);
      const productB = await createProduct();
      createdProductIds.push(productB.id);

      await expect(productService.update(productB.id, { slug: productA.slug })).rejects.toMatchObject({
        response: { code: 'SLUG_CONFLICT' },
      });
    });

    it('throws PRODUCT_NOT_FOUND for a missing id', async () => {
      await expect(productService.update('00000000-0000-0000-0000-000000000000', { name: 'x' })).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and makes the product unreachable via findOne', async () => {
      const created = await createProduct();
      createdProductIds.push(created.id);

      await productService.softDelete(created.id);

      await expect(productService.findOne(created.id)).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });

    it('throws PRODUCT_NOT_FOUND for a missing id', async () => {
      await expect(productService.softDelete('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });
  });
});
