import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateGrandTotal, formatOrderNumber } from './order-status.util';

// Flat rate placeholder — dynamic shipping calc by address/weight is TASK-225 (not built yet).
export const FLAT_SHIPPING_FEE_VND = 30_000n;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { items: true },
    });
    if (existingOrder) {
      return existingOrder;
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new UnprocessableEntityException({ code: 'EMPTY_CART', message: 'Cart is empty' });
    }

    const availableItems = cart.items.filter((item) => item.product.deletedAt === null);
    if (availableItems.length === 0) {
      throw new ConflictException({ code: 'ALL_ITEMS_UNAVAILABLE', message: 'All items in cart are unavailable' });
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq') as nextval`;
      const orderNumber = formatOrderNumber(Number(nextval), new Date().getFullYear());

      const subtotal = availableItems.reduce((sum, item) => sum + item.product.price * BigInt(item.quantity), 0n);
      const shippingFee = FLAT_SHIPPING_FEE_VND;
      const discountAmount = 0n;
      const grandTotal = calculateGrandTotal({ subtotal, shippingFee, discountAmount });

      const order = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: dto.idempotencyKey,
          userId,
          customerEmailSnapshot: user.email,
          subtotal,
          shippingFee,
          discountAmount,
          vatTotal: 0n,
          grandTotal,
          shippingAddressSnapshot: { ...dto.shippingAddress },
          shippingMethod: dto.shippingMethod,
          paymentProvider: dto.paymentProvider,
          items: {
            create: availableItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productSnapshot: { name: item.product.name, sku: item.product.sku, image: null },
              unitPrice: item.product.price,
              quantity: item.quantity,
              lineTotal: item.product.price * BigInt(item.quantity),
            })),
          },
        },
        include: { items: true },
      });

      for (const orderItem of order.items) {
        await this.productService.commitStock(orderItem.productId, orderItem.quantity, orderItem.id, tx);
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }
}
