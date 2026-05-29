# Task C-04 — Order Creation & Management

**Phase**: C — Core MVP  
**Ước lượng**: 7 giờ  
**Phụ thuộc**: Task C-03  
**Spec gốc**: [planning/business/04-order/02-order-creation.md](../../planning/business/04-order/02-order-creation.md)

---

## Nhiệm vụ

Implement Order system: tạo order atomic (trừ stock + snapshot giá), state machine, cleanup job cho order pending quá 15 phút.

---

## Các bước thực hiện

### 1. Thêm Order models vào schema.prisma

```prisma
enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model Order {
  id                      String      @id @default(uuid())
  orderNumber             String      @unique
  userId                  String
  status                  OrderStatus @default(PENDING)
  subtotal                Decimal     @db.Decimal(12, 2)
  total                   Decimal     @db.Decimal(12, 2)
  shippingAddressSnapshot Json
  customerEmailSnapshot   String
  idempotencyKey          String?     @unique
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  user       User              @relation(fields: [userId], references: [id])
  items      OrderItem[]
  statusLogs OrderStatusLog[]
  payment    Payment?

  @@index([userId])
  @@index([status])
  @@index([idempotencyKey])
  @@map("orders")
}

model OrderItem {
  id                   String  @id @default(uuid())
  orderId              String
  productId            String
  productNameSnapshot  String
  productSkuSnapshot   String?
  priceSnapshot        Decimal @db.Decimal(12, 2)
  quantity             Int
  lineTotal            Decimal @db.Decimal(12, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderStatusLog {
  id        String      @id @default(uuid())
  orderId   String
  fromStatus OrderStatus?
  toStatus  OrderStatus
  reason    String?
  actorId   String?
  createdAt DateTime    @default(now())

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_status_logs")
}
```

Chạy migration:
```bash
npx prisma migrate dev --name add-orders
```

### 2. OrderService — Tạo Order (atomic)

Tạo `src/modules/order/services/order.service.ts`:

```typescript
import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { generateOrderId } from '../../../shared/utils';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['PAID', 'CANCELLED'],
  PAID:       ['PROCESSING', 'REFUNDED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: { addressId: string; idempotencyKey?: string }) {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    // Lấy cart của user
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({ code: 'CART_EMPTY', message: 'Cart is empty' });
    }

    // Lấy địa chỉ
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException({ code: 'ADDRESS_NOT_FOUND', message: 'Address not found' });

    // User info
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Tạo order atomic trong 1 transaction
    return this.prisma.$transaction(async (tx) => {
      // Verify và trừ stock cho từng item
      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: `Product "${item.product.name}" has insufficient stock`,
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Tạo order number
      const orderCount = await tx.order.count();
      const orderNumber = generateOrderId(orderCount + 1);

      const subtotal = cart.items.reduce(
        (sum, item) => sum + Number(item.product.basePrice) * item.quantity,
        0
      );

      // Tạo order + items (snapshot giá tại thời điểm đặt hàng)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          total: subtotal,
          idempotencyKey: dto.idempotencyKey,
          customerEmailSnapshot: user!.email,
          shippingAddressSnapshot: {
            recipientName: address.recipientName,
            phone: address.phone,
            street: address.street,
            district: address.district,
            city: address.city,
          },
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              productNameSnapshot: item.product.name,
              priceSnapshot: item.product.basePrice,
              quantity: item.quantity,
              lineTotal: Number(item.product.basePrice) * item.quantity,
            })),
          },
          statusLogs: {
            create: { toStatus: 'PENDING', reason: 'Order created' },
          },
        },
        include: { items: true },
      });

      // Xóa cart sau khi đặt hàng
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  async transition(orderId: string, toStatus: string, actorId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot transition from ${order.status} to ${toStatus}`,
      });
    }

    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: toStatus as any },
      }),
      this.prisma.orderStatusLog.create({
        data: { orderId, fromStatus: order.status, toStatus: toStatus as any, actorId, reason },
      }),
    ]);
  }

  async cancelExpiredPendingOrders() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const expiredOrders = await this.prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: fifteenMinutesAgo } },
      include: { items: true },
    });

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Hoàn stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        // Cancel order
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });
        await tx.orderStatusLog.create({
          data: { orderId: order.id, fromStatus: 'PENDING', toStatus: 'CANCELLED', reason: 'Auto-cancelled: payment timeout' },
        });
      });
    }

    return expiredOrders.length;
  }
}
```

### 3. Tạo cron job cleanup

```bash
npm install @nestjs/schedule
```

Tạo `src/modules/order/tasks/order-cleanup.task.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from '../services/order.service';

@Injectable()
export class OrderCleanupTask {
  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelExpiredOrders() {
    const count = await this.orderService.cancelExpiredPendingOrders();
    if (count > 0) console.log(`Cancelled ${count} expired pending orders`);
  }
}
```

Đăng ký `ScheduleModule.forRoot()` trong `AppModule`.

### 4. OrderController

```typescript
@Controller('orders')
export class OrderController {
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
    @Headers('Idempotency-Key') idempotencyKey?: string,
  ) {
    return this.orderService.createOrder(userId, { ...dto, idempotencyKey });
  }

  @Get()
  findMyOrders(@CurrentUser('id') userId: string) {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id/status')
  forceStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }, @CurrentUser('id') actorId: string) {
    return this.orderService.transition(id, body.status, actorId, body.reason);
  }
}
```

---

## Verify hoàn thành

```http
### Tạo order (cần có cart items và địa chỉ)
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <user_token>
Idempotency-Key: unique-key-123
Content-Type: application/json

{ "addressId": "<address_id>" }

# Phải trả order với status PENDING, stock bị trừ
# Gửi lại với cùng Idempotency-Key → phải trả cùng order (không tạo mới)
```

---

## Xong thì làm gì?

→ [05-payment.md](./05-payment.md)
