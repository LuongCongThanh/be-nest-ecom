import { PrismaService } from '@common/prisma/prisma.service';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, StockMovementType } from '@prisma/client';
import 'dotenv/config';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const productService = new ProductService(prisma);

interface ProductRecord {
  id: string;
  stockQuantity: number;
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
    stockQuantity: 10,
    ...overrides,
  };
}

async function createProduct(overrides: Partial<CreateProductDto> = {}): Promise<ProductRecord> {
  return (await productService.create(baseDto(overrides))) as ProductRecord;
}

async function createTestUser() {
  return prisma.user.create({ data: { email: `stock-${uniqueSuffix()}@test.local`, password: 'x' } });
}

describe('ProductService — stock management', () => {
  const createdProductIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  describe('manualAdjust', () => {
    it('increases stock for an INBOUND movement and records it', async () => {
      const product = await createProduct({ stockQuantity: 10 });
      createdProductIds.push(product.id);
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await productService.manualAdjust(product.id, { type: StockMovementType.INBOUND, delta: 5, reason: 'Supplier delivery' }, user.id);

      const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updated.stockQuantity).toBe(15);

      const movements = await prisma.stockMovement.findMany({ where: { productId: product.id } });
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({ type: StockMovementType.INBOUND, delta: 5, balanceAfter: 15, performedById: user.id });
    });

    it('decreases stock for an ADJUSTMENT movement', async () => {
      const product = await createProduct({ stockQuantity: 10 });
      createdProductIds.push(product.id);
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await productService.manualAdjust(product.id, { type: StockMovementType.ADJUSTMENT, delta: -3, reason: 'Damaged goods' }, user.id);

      const updated = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updated.stockQuantity).toBe(7);
    });

    it('rejects an adjustment that would result in negative stock (INSUFFICIENT_STOCK)', async () => {
      const product = await createProduct({ stockQuantity: 2 });
      createdProductIds.push(product.id);
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await expect(productService.manualAdjust(product.id, { type: StockMovementType.ADJUSTMENT, delta: -5, reason: 'Stocktake' }, user.id)).rejects.toMatchObject({
        response: { code: 'INSUFFICIENT_STOCK' },
      });

      const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(unchanged.stockQuantity).toBe(2);
    });

    it('rejects a movement without a reason (REASON_REQUIRED)', async () => {
      const product = await createProduct({ stockQuantity: 10 });
      createdProductIds.push(product.id);
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await expect(productService.manualAdjust(product.id, { type: StockMovementType.INBOUND, delta: 5 }, user.id)).rejects.toMatchObject({
        response: { code: 'REASON_REQUIRED' },
      });
    });

    it('throws PRODUCT_NOT_FOUND for a missing product', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await expect(productService.manualAdjust('00000000-0000-0000-0000-000000000000', { type: StockMovementType.INBOUND, delta: 5, reason: 'x' }, user.id)).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });
  });

  describe('getStockHistory', () => {
    it('returns paginated movements ordered oldest first', async () => {
      const product = await createProduct({ stockQuantity: 10 });
      createdProductIds.push(product.id);
      const user = await createTestUser();
      createdUserIds.push(user.id);

      await productService.manualAdjust(product.id, { type: StockMovementType.INBOUND, delta: 1, reason: 'first' }, user.id);
      await productService.manualAdjust(product.id, { type: StockMovementType.INBOUND, delta: 2, reason: 'second' }, user.id);

      const history = await productService.getStockHistory(product.id, 1, 20);
      expect(history.total).toBe(2);
      expect(history.data.map((m) => m.delta)).toEqual([1, 2]);
    });

    it('throws PRODUCT_NOT_FOUND for a missing product', async () => {
      await expect(productService.getStockHistory('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        response: { code: 'PRODUCT_NOT_FOUND' },
      });
    });
  });
});
