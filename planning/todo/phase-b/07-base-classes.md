# Task 07 — Shared Contracts & Utilities

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 06
**Ưu tiên**: 🟡 TRUNG BÌNH (Architecture — tạo nền abstraction, nhưng có thể add sau)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [01-base-classes.md](../../setup/03-conventions/01-base-classes.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Tạo shared contracts và utilities có giá trị dùng lại ngay, nhưng **không ép generic `BaseRepository` quá sớm**.

- **Không over-abstract Prisma**: generic repository kiểu `modelName: string` + `as any` làm mất type-safety vốn là lợi thế lớn nhất của Prisma. Phase B nên giữ repositories mỏng, theo từng aggregate.
- **`PaginatedResult<T>`**: mọi list endpoint trả cùng shape `{ data, total, page, limit }` — FE không cần handle format khác nhau cho mỗi endpoint.
- **`slugify` với Vietnamese support**: NestJS không có built-in — URL-safe slug cho product/category name tiếng Việt. Không có util này thì mỗi developer viết lại mỗi kiểu.
- **`generateOrderId`**: business format `ORD-2026-000001` — không phải UUID ngẫu nhiên, dễ support team tra cứu.

---

## 🛠️ Các bước thực hiện

### 1. Tạo shared pagination contracts

Tạo `src/common/repositories/pagination.types.ts`:

```typescript
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### 2. Nếu cần repository, viết theo từng aggregate

Ví dụ `src/modules/identity/repositories/user.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }
}
```

> Mỗi repository chỉ bọc phần query logic có business rule thật sự, ví dụ soft-delete filter, eager loading, pagination. Không tạo một base class chung chỉ để che Prisma API.

### 3. Tạo shared utilities

Tạo `src/shared/utils/slugify.util.ts`:

```typescript
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
```

Tạo `src/shared/utils/currency.util.ts`:

```typescript
export function formatCurrency(amount: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

Tạo `src/shared/utils/id.util.ts`:

```typescript
export function generateOrderId(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `ORD-${year}-${padded}`;
}
```

Tạo `src/shared/utils/index.ts`:

```typescript
export * from './slugify.util';
export * from './currency.util';
export * from './id.util';
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: `slugify` xử lý đúng tiếng Việt**

- **Given** chuỗi tiếng Việt `"Điện Thoại 15 Pro"`
- **When** gọi `slugify("Điện Thoại 15 Pro")`
- **Then** trả `"dien-thoai-15-pro"` — không còn dấu, không còn ký tự đặc biệt

**AC-2: `slugify` xử lý đúng ký tự đặc biệt và spaces**

- **Given** chuỗi `"Hello  World!!"` (2 spaces, dấu chấm than)
- **When** gọi `slugify("Hello  World!!")`
- **Then** trả `"hello-world"` — nhiều space → 1 gạch, ký tự đặc biệt bị loại

**AC-3: Repository theo domain encapsulate được business query rules**

- **Given** DB có 3 User: 2 active, 1 có `deletedAt != null`
- **When** gọi `userRepository.findActiveById(...)` hoặc `findByEmail(...)`
- **Then** repository không trả record đã soft-delete — rule được giữ ở một chỗ

**AC-4: Unit tests của `slugify` pass**

- **Given** file `slugify.util.spec.ts` đã viết
- **When** chạy `npm run test -- slugify`
- **Then** 2 tests pass, 0 failed

---

## Verify hoàn thành

Viết test nhanh trong `src/shared/utils/slugify.util.spec.ts`:

```typescript
import { slugify } from './slugify.util';

describe('slugify', () => {
  it('converts Vietnamese to ASCII slug', () => {
    expect(slugify('Điện Thoại 15 Pro')).toBe('dien-thoai-15-pro');
  });

  it('handles multiple spaces', () => {
    expect(slugify('Hello  World')).toBe('hello-world');
  });
});
```

Chạy:
```bash
npm run test -- slugify
# 2 tests passed
```

---

## 🚫 Ngoài phạm vi

- Caching trong Repository layer (Redis cache cho findById) → optimization sau khi có performance data
- Event sourcing / Repository pattern nâng cao → ngoài scope Phase B
- Generic `BaseRepository` kiểu reflection/dynamic model lookup → cố ý không làm ở Phase B
- `generateOrderId` với sequence từ DB (atomic) → Phase C khi implement Order feature
- Thêm util cho định dạng ngày tháng, số điện thoại → thêm khi có nhu cầu cụ thể

---

## Xong thì làm gì?

→ Mở task tiếp theo: [08-seed-data.md](./08-seed-data.md)
