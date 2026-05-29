# Task 07 — Base Classes & Shared Utilities

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 06
**Ưu tiên**: 🟡 TRUNG BÌNH (Architecture — tạo nền abstraction, nhưng có thể add sau)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [planning/setup/03-conventions/01-base-classes.md](../../planning/setup/03-conventions/01-base-classes.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Tạo `BaseRepository` abstract class và shared utilities. Mục tiêu là **không bao giờ gọi Prisma trực tiếp trong Service**.

- **Repository pattern**: Service không nên biết về Prisma — nó chỉ biết về "lấy user", "tạo product". Khi cần swap ORM sau này, chỉ cần thay repository layer, không đụng service.
- **Auto soft-delete filter**: `BaseRepository.findById()` và `findMany()` tự thêm `WHERE deletedAt IS NULL` — developer không cần nhớ thêm condition này mỗi lần query. Quên thêm là query lấy cả record đã xóa.
- **`PaginatedResult<T>`**: mọi list endpoint trả cùng shape `{ data, total, page, limit }` — FE không cần handle format khác nhau cho mỗi endpoint.
- **`slugify` với Vietnamese support**: NestJS không có built-in — URL-safe slug cho product/category name tiếng Việt. Không có util này thì mỗi developer viết lại mỗi kiểu.
- **`generateOrderId`**: business format `ORD-2026-000001` — không phải UUID ngẫu nhiên, dễ support team tra cứu.

---

## 🛠️ Các bước thực hiện

### 1. Tạo BaseRepository

Tạo `src/common/repositories/base.repository.ts`:

```typescript
import { PrismaService } from '../prisma/prisma.service';

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

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  async findById(id: string): Promise<T | null> {
    const model = (this.prisma as any)[this.modelName];
    return model.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findMany(
    filter: Record<string, any> = {},
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const model = (this.prisma as any)[this.modelName];

    const where = { ...filter, deletedAt: null };
    const [data, total] = await Promise.all([
      model.findMany({ where, skip, take: limit }),
      model.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async create(data: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    const model = (this.prisma as any)[this.modelName];
    await model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### 2. Tạo shared utilities

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

**AC-3: `BaseRepository.findMany` tự filter soft-deleted records**

- **Given** DB có 3 User: 2 active, 1 có `deletedAt != null`
- **When** gọi `userRepository.findMany({})`
- **Then** chỉ trả 2 User active — User đã soft-delete không xuất hiện trong kết quả

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
- Generic type safety cho `BaseRepository` (tránh `as any`) → refactor sau khi có đủ models
- `generateOrderId` với sequence từ DB (atomic) → Phase C khi implement Order feature
- Thêm util cho định dạng ngày tháng, số điện thoại → thêm khi có nhu cầu cụ thể

---

## Xong thì làm gì?

→ Mở task tiếp theo: [08-seed-data.md](./08-seed-data.md)
