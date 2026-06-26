# TASK-122: Shared Base Classes & Utilities

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §11`](../CONVENTIONS.md) (Base Classes & Shared Utilities)

---

## 🎯 Intent

Chuẩn hóa **BaseEntity** + **BaseRepository** + utilities chung. Mọi entity domain kế thừa BaseEntity → không bao giờ thiếu `createdAt/updatedAt/deletedAt`. Mọi repository kế thừa BaseRepository → có sẵn 5 method chuẩn, service mock được cho unit test.

---

## ✅ Acceptance Criteria

### BaseEntity (interface/mixin cho Prisma model)

- [ ] Mọi model trong `schema.prisma` có 4 field bắt buộc:
      - `id String @id @default(uuid())` — UUID v4, không auto-increment.
      - `createdAt DateTime @default(now())`.
      - `updatedAt DateTime @updatedAt`.
      - `deletedAt DateTime?` — soft-delete; default query lọc `deletedAt IS NULL`.

### BaseRepository<T>

- [ ] Abstract class ở `src/common/repositories/base.repository.ts`.
- [ ] Method chuẩn (mọi repo concrete kế thừa):
      - `findById(id: string): Promise<T | null>` — auto-filter soft-deleted.
      - `findMany(filter, pagination): Promise<{ data, total }>`.
      - `create(data): Promise<T>`.
      - `update(id, data): Promise<T>`.
      - `softDelete(id): Promise<void>` — set `deletedAt = now()`.
- [ ] Cấm dùng `prisma` trực tiếp trong service nếu có repository tương ứng. Lint rule hoặc code-review enforce.

### Shared utilities (ở `src/shared/utils/`)

- [ ] `slugify(text: string): string` — URL-safe, lowercase, ASCII fold.
- [ ] `formatCurrency(amount: number, locale?: string): string` — default `vi-VN` VND.
- [ ] `generateId(prefix: string): string` — chỉ dùng cho ID nghiệp vụ (vd `ORD-2026-000123`), không thay UUID.

### Tests

- [ ] Soft-delete user → `findById` trả `null`, raw `SELECT *` thấy `deletedAt` set.
- [ ] `slugify("Điện Thoại 15 Pro")` → `"dien-thoai-15-pro"`.
- [ ] BaseRepository mock được bằng `jest.fn()` cho unit test service.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §11`](../CONVENTIONS.md) — Base classes & utilities reference.
- [`../CONVENTIONS.md §8`](../CONVENTIONS.md) — Prisma best practices.
- [`./README.md`](./README.md) — Group DoD.
