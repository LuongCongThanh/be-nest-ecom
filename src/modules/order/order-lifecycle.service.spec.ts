import 'dotenv/config';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@common/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { OrderService } from './order.service';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const productService = new ProductService(prisma, new ConfigService());
const eventEmitter = new EventEmitter2();
const orderService = new OrderService(prisma, productService, eventEmitter);

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createTestUser() {
  return prisma.user.create({ data: { email: `lifecycle-${uniqueSuffix()}@test.local`, password: 'x' } });
}

async function createTestProduct(overrides: Partial<{ stockQuantity: number }> = {}) {
  const suffix = uniqueSuffix();
  return prisma.product.create({
    data: {
      sku: `SKU-${suffix}`,
      name: 'Test Product',
      slug: `test-product-${suffix}`,
      price: 100_000n,
      stockQuantity: overrides.stockQuantity ?? 10,
    },
  });
}

async function createTestOrder(userId: string, overrides: Partial<{ status: OrderStatus; placedAt: Date; deliveredAt: Date }> = {}) {
  const suffix = uniqueSuffix();
  return prisma.order.create({
    data: {
      orderNumber: `ORD-TEST-${suffix}`,
      idempotencyKey: `idem-${suffix}`,
      userId,
      customerEmailSnapshot: 'test@test.local',
      status: overrides.status ?? 'PENDING',
      subtotal: 100_000n,
      shippingFee: 30_000n,
      grandTotal: 130_000n,
      shippingAddressSnapshot: { recipient: 'Test' },
      shippingMethod: 'standard',
      paymentProvider: 'cod',
      placedAt: overrides.placedAt ?? new Date(),
      deliveredAt: overrides.deliveredAt,
    },
  });
}

async function createTestOrderItem(orderId: string, product: { id: string }, quantity = 1) {
  return prisma.orderItem.create({
    data: {
      orderId,
      productId: product.id,
      productSnapshot: { name: 'Test Product' },
      unitPrice: 100_000n,
      quantity,
      lineTotal: 100_000n * BigInt(quantity),
    },
  });
}

describe('OrderService lifecycle operations', () => {
  const createdUserIds: string[] = [];
  const createdProductIds: string[] = [];

  afterAll(async () => {
    await prisma.orderStateChangeLog.deleteMany({ where: { order: { userId: { in: createdUserIds } } } });
    await prisma.orderItem.deleteMany({ where: { order: { userId: { in: createdUserIds } } } });
    await prisma.order.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  describe('findOneForUser', () => {
    it('rejects access to another user order (AC-1)', async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      createdUserIds.push(owner.id, stranger.id);
      const order = await createTestOrder(owner.id);

      await expect(orderService.findOneForUser(stranger.id, order.id)).rejects.toMatchObject({ response: { code: 'FORBIDDEN' } });
    });
  });

  describe('cancelByUser', () => {
    it('cancels a PENDING order and releases stock', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const product = await createTestProduct({ stockQuantity: 5 });
      createdProductIds.push(product.id);
      const order = await createTestOrder(user.id, { status: 'PENDING' });
      await createTestOrderItem(order.id, product, 2);

      const result = await orderService.cancelByUser(user.id, order.id);

      expect(result.status).toBe('CANCELLED');
      const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updatedProduct.stockQuantity).toBe(7); // 5 + 2 released
    });

    it('self-cancels a PAID order into REFUNDED within the 30-minute window', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PAID', placedAt: new Date(Date.now() - 5 * 60 * 1000) });

      const result = await orderService.cancelByUser(user.id, order.id);

      expect(result.status).toBe('REFUNDED');
    });

    it('rejects self-cancel of a PAID order outside the 30-minute window (AC-2)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PAID', placedAt: new Date(Date.now() - 40 * 60 * 1000) });

      await expect(orderService.cancelByUser(user.id, order.id)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
    });
  });

  describe('adminPay', () => {
    it('confirms COD payment: PENDING -> PAID', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PENDING' });

      const result = await orderService.adminPay(order.id, 'admin-actor');

      expect(result.status).toBe('PAID');
      expect(result.paymentStatus).toBe('PAID');
    });
  });

  describe('adminShip', () => {
    it('rejects ship without trackingNumber/carrier (AC-4)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PAID' });

      await expect(orderService.adminShip(order.id, 'admin-actor', {})).rejects.toMatchObject({ response: { code: 'TRACKING_REQUIRED' } });
    });

    it('ships PAID -> SHIPPING with trackingNumber + carrier', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PAID' });

      const result = await orderService.adminShip(order.id, 'admin-actor', { trackingNumber: 'TRACK123', carrier: 'GHTK' });

      expect(result.status).toBe('SHIPPING');
      expect(result.trackingNumber).toBe('TRACK123');
      expect(result.carrier).toBe('GHTK');
    });
  });

  describe('adminDeliver', () => {
    it('delivers SHIPPING -> DELIVERED and sets deliveredAt', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'SHIPPING' });

      const result = await orderService.adminDeliver(order.id, 'admin-actor');

      expect(result.status).toBe('DELIVERED');
      expect(result.deliveredAt).not.toBeNull();
    });
  });

  describe('adminCancel', () => {
    it('force-cancels and releases stock + logs OrderStateChangeLog (AC-3)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const product = await createTestProduct({ stockQuantity: 10 });
      createdProductIds.push(product.id);
      const order = await createTestOrder(user.id, { status: 'PAID' });
      await createTestOrderItem(order.id, product, 3);

      const result = await orderService.adminCancel(order.id, 'admin-actor', { reason: 'Customer requested by phone' });

      expect(result.status).toBe('CANCELLED');
      const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updatedProduct.stockQuantity).toBe(13);

      const log = await prisma.orderStateChangeLog.findFirstOrThrow({ where: { orderId: order.id } });
      expect(log.fromState).toBe('PAID');
      expect(log.toState).toBe('CANCELLED');
      expect(log.reason).toBe('Customer requested by phone');
      expect(log.isForceOverride).toBe(false);
    });
  });

  describe('adminRefund', () => {
    it('rejects partial refund (MVP is full-only)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'PAID' });

      await expect(orderService.adminRefund(order.id, 'admin-actor', { reason: 'x', partial: 50_000 })).rejects.toMatchObject({
        response: { code: 'PARTIAL_REFUND_NOT_SUPPORTED' },
      });
    });

    it('rejects refund past the 7-day window after delivery (AC-6)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'DELIVERED', deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });

      await expect(orderService.adminRefund(order.id, 'admin-actor', { reason: 'late request' })).rejects.toMatchObject({
        response: { code: 'REFUND_WINDOW_EXPIRED' },
      });
    });

    it('refunds a DELIVERED order within the 7-day window', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'DELIVERED', deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) });

      const result = await orderService.adminRefund(order.id, 'admin-actor', { reason: 'defective item' });

      expect(result.status).toBe('REFUNDED');
      expect(result.paymentStatus).toBe('REFUNDED');
    });
  });

  describe('forceStatus', () => {
    it('bypasses the normal state machine and logs isForceOverride=true', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const order = await createTestOrder(user.id, { status: 'DELIVERED' });

      const result = await orderService.forceStatus(order.id, 'admin-actor', { status: 'PAID', reason: 'Customer typo undo' });

      expect(result.status).toBe('PAID');
      const log = await prisma.orderStateChangeLog.findFirstOrThrow({ where: { orderId: order.id } });
      expect(log.isForceOverride).toBe(true);
      expect(log.reason).toBe('Customer typo undo');
    });
  });

  describe('autoCancelExpiredPendingOrders', () => {
    it('cancels PENDING orders placed over 15 minutes ago and releases stock (AC-5)', async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);
      const product = await createTestProduct({ stockQuantity: 4 });
      createdProductIds.push(product.id);
      const staleOrder = await createTestOrder(user.id, { status: 'PENDING', placedAt: new Date(Date.now() - 20 * 60 * 1000) });
      await createTestOrderItem(staleOrder.id, product, 1);
      const freshOrder = await createTestOrder(user.id, { status: 'PENDING', placedAt: new Date() });

      await orderService.autoCancelExpiredPendingOrders();

      const updatedStale = await prisma.order.findUniqueOrThrow({ where: { id: staleOrder.id } });
      const updatedFresh = await prisma.order.findUniqueOrThrow({ where: { id: freshOrder.id } });
      expect(updatedStale.status).toBe('CANCELLED');
      expect(updatedFresh.status).toBe('PENDING');

      const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updatedProduct.stockQuantity).toBe(5);

      const log = await prisma.orderStateChangeLog.findFirstOrThrow({ where: { orderId: staleOrder.id } });
      expect(log.reason).toBe('AUTO_TIMEOUT');
    });
  });
});
