# Task C-03b — Idempotency Key Middleware

**Phase**: C — Core MVP  
**Ước lượng**: 3 giờ  
**Phụ thuộc**: Task C-03  
**Spec gốc**: [planning/docs/CONTEXT.md — mục Idempotency Key](../../docs/CONTEXT.md)

---

## Nhiệm vụ

Implement cơ chế Idempotency Key dùng chung cho Order Creation và Payment Init. Client sinh UUID, gửi qua header `Idempotency-Key`. Server lưu `(key → resultId)` vào bảng Postgres `idempotency_keys` TTL 24h. Cùng key gửi lại → trả kết quả cũ. Khác body cùng key → `409 IDEMPOTENCY_KEY_REUSED`.

> Đây là cross-cutting concern — phải xong TRƯỚC khi implement Order (C-04) và Payment (C-05).

---

## Các bước thực hiện

### 1. Thêm model IdempotencyKey vào schema.prisma

```prisma
model IdempotencyKey {
  id         String   @id @default(uuid())
  key        String   @unique
  resultId   String
  bodyHash   String
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([key])
  @@index([expiresAt])
  @@map("idempotency_keys")
}
```

Chạy migration:
```bash
npx prisma migrate dev --name add-idempotency-keys
```

### 2. IdempotencyService

Tạo `src/common/idempotency/idempotency.service.ts`:

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  private hashBody(body: unknown): string {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }

  async check(key: string, body: unknown): Promise<{ resultId: string } | null> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!existing) return null;

    if (existing.bodyHash !== this.hashBody(body)) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency key đã dùng với body khác.',
      });
    }

    return { resultId: existing.resultId };
  }

  async save(key: string, body: unknown, resultId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.idempotencyKey.create({
      data: {
        key,
        resultId,
        bodyHash: this.hashBody(body),
        expiresAt,
      },
    });
  }
}
```

### 3. IdempotencyModule

Tạo `src/common/idempotency/idempotency.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

@Module({
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
```

### 4. Cách dùng trong Order / Payment service

Inject `IdempotencyService` vào bất kỳ service nào cần idempotency:

```typescript
// Trong OrderService.createOrder(dto, idempotencyKey)
const existing = await this.idempotencyService.check(idempotencyKey, dto);
if (existing) {
  return this.prisma.order.findUniqueOrThrow({ where: { id: existing.resultId } });
}

const order = await this.prisma.$transaction(async (tx) => { /* ... */ });
await this.idempotencyService.save(idempotencyKey, dto, order.id);
return order;
```

### 5. Cron cleanup — xóa key hết hạn

Tạo `src/common/idempotency/idempotency-cleanup.job.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyCleanupJob {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredKeys() {
    await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
```

Thêm `IdempotencyCleanupJob` vào `providers` của `IdempotencyModule`.

---

## Verify hoàn thành

```http
### Gửi lần 1 — tạo mới
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <token>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "addressId": "...", "items": [...] }
# Phải trả: 201 Created với order mới

### Gửi lại lần 2 — cùng key, cùng body
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <token>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "addressId": "...", "items": [...] }
# Phải trả: 200 OK với order cũ (KHÔNG tạo mới)

### Gửi lần 3 — cùng key, khác body
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <token>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "addressId": "different-id", "items": [...] }
# Phải trả: 409 IDEMPOTENCY_KEY_REUSED
```

---

## Xong thì làm gì?

→ [04-order.md](./04-order.md)
