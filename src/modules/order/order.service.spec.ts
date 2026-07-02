import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { FLAT_SHIPPING_FEE_VND, OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const productService = new ProductService(prisma, new ConfigService());
const orderService = new OrderService(prisma, productService);

const VALID_CHECKOUT_DTO: CreateOrderDto = {
  shippingAddress: {
    recipient: 'Nguyen Van A',
    phone: '0900000000',
    line1: '123 Le Loi',
    ward: 'Ben Nghe',
    district: 'District 1',
    province: 'Ho Chi Minh City',
  },
  shippingMethod: 'standard',
  paymentProvider: 'vnpay',
  idempotencyKey: 'unused-override-per-test',
};

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createTestUser() {
  return prisma.user.create({ data: { email: `checkout-${uniqueSuffix()}@test.local`, password: 'x' } });
}

async function createTestProduct(overrides: Partial<{ price: bigint; stockQuantity: number; deletedAt: Date | null }> = {}) {
  const suffix = uniqueSuffix();
  return prisma.product.create({
    data: {
      sku: `SKU-${suffix}`,
      name: 'Test Product',
      slug: `test-product-${suffix}`,
      price: overrides.price ?? 100_000n,
      stockQuantity: overrides.stockQuantity ?? 10,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
}

describe('OrderService.checkout', () => {
  const createdUserIds: string[] = [];
  const createdProductIds: string[] = [];

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { order: { userId: { in: createdUserIds } } } });
    await prisma.order.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: createdUserIds } } } });
    await prisma.cart.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  it('rejects checkout with an empty cart (EMPTY_CART)', async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    await prisma.cart.create({ data: { userId: user.id } });

    await expect(orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey: `key-${user.id}` })).rejects.toMatchObject({
      response: { code: 'EMPTY_CART' },
    });
  });

  it('rejects checkout when every cart item is unavailable (ALL_ITEMS_UNAVAILABLE)', async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const product = await createTestProduct({ deletedAt: new Date() });
    createdProductIds.push(product.id);
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1, priceAtAdded: product.price } });

    await expect(orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey: `key-${user.id}` })).rejects.toMatchObject({
      response: { code: 'ALL_ITEMS_UNAVAILABLE' },
    });
  });

  it('creates an Order snapshotting the current product price, not the cart priceAtAdded', async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const product = await createTestProduct({ price: 120_000n, stockQuantity: 5 });
    createdProductIds.push(product.id);
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    // priceAtAdded (100_000) is stale — product price has since changed to 120_000
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 2, priceAtAdded: 100_000n } });

    const order = await orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey: `key-${user.id}` });

    expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{6,}$/);
    expect(order.subtotal).toBe(240_000n); // 2 * current price 120_000, not priceAtAdded 100_000
    expect(order.shippingFee).toBe(FLAT_SHIPPING_FEE_VND);
    expect(order.grandTotal).toBe(240_000n + FLAT_SHIPPING_FEE_VND);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].unitPrice).toBe(120_000n);
    expect((order.items[0].productSnapshot as { name: string }).name).toBe('Test Product');

    const remainingCart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    expect(remainingCart?.items).toHaveLength(0);

    const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(updatedProduct.stockQuantity).toBe(3); // 5 - 2
  });

  it('rolls back the whole checkout when stock is insufficient (AC-1 atomicity)', async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const product = await createTestProduct({ stockQuantity: 1 });
    createdProductIds.push(product.id);
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 2, priceAtAdded: product.price } });

    await expect(orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey: `key-${user.id}` })).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });

    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    expect(orderCount).toBe(0);

    const remainingCart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    expect(remainingCart?.items).toHaveLength(1);

    const untouchedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(untouchedProduct.stockQuantity).toBe(1);
  });

  it('replays the same Order on duplicate idempotencyKey instead of creating a new one (AC-2)', async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const product = await createTestProduct({ stockQuantity: 5 });
    createdProductIds.push(product.id);
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 2, priceAtAdded: product.price } });

    const idempotencyKey = `key-${user.id}`;
    const firstOrder = await orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey });
    // Cart is now empty; a naive re-check would hit EMPTY_CART instead of replaying.
    const secondOrder = await orderService.checkout(user.id, { ...VALID_CHECKOUT_DTO, idempotencyKey });

    expect(secondOrder.id).toBe(firstOrder.id);

    const orderCount = await prisma.order.count({ where: { idempotencyKey } });
    expect(orderCount).toBe(1);

    const product2 = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(product2.stockQuantity).toBe(3); // decremented once, not twice
  });
});
