import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Order snapshot invariant (AC-1)', () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let productId: string;
  let orderId: string;

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it('keeps OrderItem snapshot unchanged after the source Product changes', async () => {
    const product = await prisma.product.create({
      data: {
        sku: `TEST-SKU-${Date.now()}`,
        name: 'iPhone 15',
        slug: `iphone-15-${Date.now()}`,
        price: 25_000_000n,
        stockQuantity: 10,
      },
    });
    productId = product.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}`,
        idempotencyKey: `test-key-${Date.now()}`,
        customerEmailSnapshot: 'buyer@example.com',
        subtotal: 25_000_000n,
        shippingFee: 0n,
        grandTotal: 25_000_000n,
        shippingAddressSnapshot: { recipient: 'A', phone: '0900000000', line1: 'x', ward: 'x', district: 'x', province: 'x' },
        shippingMethod: 'standard',
        paymentProvider: 'vnpay',
        items: {
          create: [
            {
              productId: product.id,
              productSnapshot: { name: product.name, sku: product.sku, image: null },
              unitPrice: product.price,
              quantity: 1,
              lineTotal: product.price,
            },
          ],
        },
      },
      include: { items: true },
    });
    orderId = order.id;

    // Source Product changes after the Order was placed.
    await prisma.product.update({
      where: { id: product.id },
      data: { name: 'iPhone 15 Pro', price: 27_000_000n },
    });

    const persistedItem = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } });

    expect((persistedItem.productSnapshot as { name: string }).name).toBe('iPhone 15');
    expect(persistedItem.unitPrice).toBe(25_000_000n);
  });
});
