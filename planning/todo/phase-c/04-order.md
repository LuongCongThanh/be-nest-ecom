# Task C-04 — Order Creation & Management

**Phase**: C — Core MVP
**Ước lượng**: 7 giờ
**Phụ thuộc**: Task C-03
**Ưu tiên**: 🔴 BLOCKING (MVP milestone — đây là tính năng cốt lõi nhất của e-commerce)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [02-order-creation.md](../../business/04-order/02-order-creation.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Implement Order system: tạo order atomic (trừ stock + snapshot giá), state machine, cleanup job.

- **Atomic transaction = all or nothing**: khi checkout, phải đồng thời (1) kiểm tra stock đủ, (2) trừ stock, (3) tạo Order + OrderItem với snapshot, (4) xóa cart. Nếu bất kỳ bước nào fail thì rollback toàn bộ — không có tình trạng "tiền đã trừ nhưng stock không giảm".
- **`productSnapshot` JSONB**: lưu toàn bộ thông tin product (tên, giá, sku) vào OrderItem tại thời điểm order. Order là tài liệu pháp lý — không được thay đổi khi product gốc bị edit/xóa sau này.
- **State machine**: chỉ cho phép transition hợp lệ (`PENDING → PAID`, `PENDING → CANCELLED`, v.v.). Service phải có `assertCanTransition(from, to)` để throw lỗi rõ ràng thay vì để invalid state vào DB.
- **Cleanup job**: order PENDING quá 15 phút tự động CANCELLED + restore stock. Tránh stock bị giữ vô thời hạn bởi abandoned checkout.
- **`orderNumber` không phải UUID**: dùng format `ORD-2026-000001` cho support team tra cứu dễ. Dùng Postgres sequence (`CREATE SEQUENCE`) để sinh số atomic, không race condition.

> ⚠️ **Concurrency**: Không dùng `count() + 1` để sinh `orderNumber` — race condition khi 2 request checkout cùng lúc sẽ tạo trùng orderNumber. Dùng Postgres native sequence.

---

## Các bước thực hiện

### 1. Thêm Order models vào schema.prisma

```prisma
enum OrderStatus {
  PENDING
  PAID
  SHIPPING
  DELIVERED
  CANCELLED
  REFUNDED
}

model Order {
  id                      String      @id @default(uuid())
  orderNumber             String      @unique
  userId                  String
  status                  OrderStatus @default(PENDING)
  subtotal                BigInt
  grandTotal              BigInt
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
  variantId            String?
  productNameSnapshot  String
  productSkuSnapshot   String?
  priceSnapshot        BigInt
  quantity             Int
  lineTotal            BigInt

  order   Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

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
// Không import randomUUID — orderNumber sinh bằng Postgres sequence
import { PrismaService } from '../../../common/prisma/prisma.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['SHIPPING', 'CANCELLED', 'REFUNDED'],
  SHIPPING:  ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED:  [],
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
      include: { items: { include: { product: true, variant: true } } },
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
        const variant = item.variantId
          ? await tx.productVariant.findUnique({ where: { id: item.variantId } })
          : null;
        const availableStock = variant ? variant.stock : product?.stock;

        if (!product || availableStock == null || availableStock < item.quantity) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: `Product "${item.product.name}" has insufficient stock`,
          });
        }

        if (variant) {
          await tx.productVariant.update({
            where: { id: item.variantId! },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Postgres sequence — atomic, không collision, không cần retry
      const [{ nextval }] = await tx.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('order_number_seq')`;
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(nextval).padStart(6, '0')}`;

      const subtotal = cart.items.reduce(
        (sum, item) => sum + (item.variant?.price ?? item.product.basePrice) * BigInt(item.quantity),
        0n
      );

      // Tạo order + items (snapshot giá tại thời điểm đặt hàng)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          grandTotal: subtotal,
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
              variantId: item.variantId,
              productNameSnapshot: item.product.name,
              productSkuSnapshot: item.variant?.sku ?? null,
              priceSnapshot: item.variant?.price ?? item.product.basePrice,
              quantity: item.quantity,
              lineTotal: (item.variant?.price ?? item.product.basePrice) * BigInt(item.quantity),
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

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true },
    });
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
    return this.orderService.findMyOrders(userId);
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
