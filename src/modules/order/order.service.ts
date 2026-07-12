import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PaginatedResult } from '@common/repositories/pagination.types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, Prisma } from '@prisma/client';
import { ProductService } from '../product/product.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ForceStatusOrderDto } from './dto/force-status-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { calculateGrandTotal, formatOrderNumber, isPastAutoCancelTimeout, isValidOrderTransition, isWithinRefundWindow, isWithinSelfCancelWindow } from './order-status.util';

// Flat rate placeholder — dynamic shipping calc by address/weight is TASK-225 (not built yet).
export const FLAT_SHIPPING_FEE_VND = 30_000n;

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Applies a state transition inside one transaction: updates Order, writes an
   * OrderStateChangeLog row, and releases stock for every item when requested.
   * The event is emitted only after the transaction commits.
   */
  private async transitionOrder(params: {
    order: OrderWithItems;
    to: OrderStatus;
    changedBy?: string;
    reason?: string;
    isForceOverride?: boolean;
    releaseStock?: boolean;
    extraData?: Prisma.OrderUpdateInput;
    eventName: string;
  }): Promise<OrderWithItems> {
    if (!params.isForceOverride && !isValidOrderTransition(params.order.status, params.to)) {
      throw new ConflictException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition order from ${params.order.status} to ${params.to}`,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: params.order.id },
        data: { status: params.to, ...params.extraData },
        include: { items: true },
      });

      await tx.orderStateChangeLog.create({
        data: {
          orderId: order.id,
          fromState: params.order.status,
          toState: params.to,
          changedBy: params.changedBy,
          reason: params.reason,
          isForceOverride: params.isForceOverride ?? false,
        },
      });

      if (params.releaseStock) {
        for (const item of order.items) {
          await this.productService.releaseStock(item.productId, item.quantity, item.id, tx);
        }
      }

      return order;
    });

    this.eventEmitter.emit(params.eventName, {
      orderId: updated.id,
      from: params.order.status,
      to: params.to,
      reason: params.reason,
    });

    return updated;
  }

  private async findOrderOrThrow(orderId: string): Promise<OrderWithItems> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return order;
  }

  async findAllForUser(userId: string, query: QueryOrderDto): Promise<PaginatedResult<Prisma.OrderGetPayload<{ include: { items: true } }>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { userId, ...(query.status && { status: query.status }) };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOneForUser(userId: string, orderId: string): Promise<OrderWithItems> {
    const order = await this.findOrderOrThrow(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You do not own this order' });
    }
    return order;
  }

  async cancelByUser(userId: string, orderId: string): Promise<OrderWithItems> {
    const order = await this.findOneForUser(userId, orderId);

    if (order.status === 'PENDING') {
      return this.transitionOrder({
        order,
        to: 'CANCELLED',
        changedBy: userId,
        reason: 'USER_SELF_CANCEL',
        releaseStock: true,
        extraData: { cancelledAt: new Date() },
        eventName: 'order.cancelled',
      });
    }

    if (order.status === 'PAID' && isWithinSelfCancelWindow(order.placedAt, new Date())) {
      return this.transitionOrder({
        order,
        to: 'REFUNDED',
        changedBy: userId,
        reason: 'USER_SELF_CANCEL',
        releaseStock: true,
        extraData: { paymentStatus: 'REFUNDED' },
        eventName: 'order.refunded',
      });
    }

    throw new ConflictException({ code: 'INVALID_TRANSITION', message: 'Order cannot be self-cancelled in its current state' });
  }

  async findAllAdmin(query: QueryOrderDto): Promise<PaginatedResult<OrderWithItems>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { ...(query.status && { status: query.status }) };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async adminPay(orderId: string, actorId: string): Promise<OrderWithItems> {
    const order = await this.findOrderOrThrow(orderId);
    return this.transitionOrder({
      order,
      to: 'PAID',
      changedBy: actorId,
      reason: 'ADMIN_CONFIRM_COD',
      extraData: { paymentStatus: 'PAID' },
      eventName: 'order.paid',
    });
  }

  async adminShip(orderId: string, actorId: string, dto: ShipOrderDto): Promise<OrderWithItems> {
    if (!dto.trackingNumber || !dto.carrier) {
      throw new UnprocessableEntityException({ code: 'TRACKING_REQUIRED', message: 'trackingNumber and carrier are required' });
    }

    const order = await this.findOrderOrThrow(orderId);
    return this.transitionOrder({
      order,
      to: 'SHIPPING',
      changedBy: actorId,
      extraData: { trackingNumber: dto.trackingNumber, carrier: dto.carrier },
      eventName: 'order.shipped',
    });
  }

  async adminDeliver(orderId: string, actorId: string): Promise<OrderWithItems> {
    const order = await this.findOrderOrThrow(orderId);
    return this.transitionOrder({
      order,
      to: 'DELIVERED',
      changedBy: actorId,
      extraData: { deliveredAt: new Date() },
      eventName: 'order.delivered',
    });
  }

  async adminCancel(orderId: string, actorId: string, dto: CancelOrderDto): Promise<OrderWithItems> {
    const order = await this.findOrderOrThrow(orderId);
    return this.transitionOrder({
      order,
      to: 'CANCELLED',
      changedBy: actorId,
      reason: dto.reason,
      releaseStock: true,
      extraData: { cancelledAt: new Date() },
      eventName: 'order.cancelled',
    });
  }

  async adminRefund(orderId: string, actorId: string, dto: RefundOrderDto): Promise<OrderWithItems> {
    if (dto.partial) {
      throw new UnprocessableEntityException({ code: 'PARTIAL_REFUND_NOT_SUPPORTED', message: 'Partial refund is not supported in MVP — full refund only' });
    }

    const order = await this.findOrderOrThrow(orderId);

    if (order.status === 'DELIVERED') {
      if (!order.deliveredAt || !isWithinRefundWindow(order.deliveredAt, new Date())) {
        throw new ConflictException({ code: 'REFUND_WINDOW_EXPIRED', message: 'Refund window (7 days after delivery) has expired' });
      }
    }

    return this.transitionOrder({
      order,
      to: 'REFUNDED',
      changedBy: actorId,
      reason: dto.reason,
      releaseStock: true,
      extraData: { paymentStatus: 'REFUNDED' },
      eventName: 'order.refunded',
    });
  }

  async forceStatus(orderId: string, actorId: string, dto: ForceStatusOrderDto): Promise<OrderWithItems> {
    const order = await this.findOrderOrThrow(orderId);
    return this.transitionOrder({
      order,
      to: dto.status,
      changedBy: actorId,
      reason: dto.reason,
      isForceOverride: true,
      eventName: 'order.force-status-changed',
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCancelExpiredPendingOrders(): Promise<void> {
    const pendingOrders = await this.prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { items: true },
    });

    const now = new Date();
    for (const order of pendingOrders) {
      if (isPastAutoCancelTimeout(order.placedAt, now)) {
        await this.transitionOrder({
          order,
          to: 'CANCELLED',
          reason: 'AUTO_TIMEOUT',
          releaseStock: true,
          extraData: { cancelledAt: now },
          eventName: 'order.cancelled',
        });
      }
    }
  }

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
