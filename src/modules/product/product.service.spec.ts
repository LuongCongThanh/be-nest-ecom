import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from '@common/prisma/prisma.service';
import { slugify } from '@common/utils/slugify.util';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const productService = new ProductService(prisma);

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

      const result = await findAllProducts({ page: 1, limit: 20 });
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
