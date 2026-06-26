# TASK-122: Shared Base Classes & Utilities

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §11`](../CONVENTIONS.md) (Base Classes & Shared Utilities)

---

## 🎯 Intent

Chuẩn hóa **base fields** + **shared utilities** + định hướng tách lớp data access khi cần. Mọi entity domain cần thống nhất `createdAt/updatedAt/deletedAt`; repository chỉ nên được trừu tượng hóa tới mức còn giữ được type-safety và readability.

---

## ✅ Acceptance Criteria

### BaseEntity (interface/mixin cho Prisma model)

- [ ] Mọi model trong `schema.prisma` có 4 field bắt buộc:
      - `id String @id @default(uuid())` — UUID v4, không auto-increment.
      - `createdAt DateTime @default(now())`.
      - `updatedAt DateTime @updatedAt`.
      - `deletedAt DateTime?` — soft-delete; default query lọc `deletedAt IS NULL`.

### Repository boundary

- [ ] Nếu module có query logic phức tạp (soft-delete filter, eager load, pagination), tạo repository concrete riêng (`users.repository.ts`, `orders.repository.ts`, ...).
- [ ] Không bắt buộc `BaseRepository<T>` generic — dynamic model lookup (`prisma[modelName]`) làm mất type-safety vốn là lợi thế lớn nhất của Prisma. Phase B không tạo generic base.
- [ ] Với module rất mỏng, service có thể dùng Prisma trực tiếp nếu code vẫn rõ ràng và dễ test.

  > **Quyết định thực tế (Phase B)**: `UserRepository` được tạo với 2 methods — `findActiveById` và `findByEmail` — để encapsulate soft-delete filter. Các module mỏng hơn (Address) dùng Prisma trực tiếp trong service.

### Shared utilities (ở `src/shared/utils/`)

- [ ] `slugify(text: string): string` — URL-safe, lowercase, ASCII fold.
- [ ] `formatCurrency(amount: number, locale?: string): string` — default `vi-VN` VND.
- [ ] `generateOrderId(sequence: number): string` — chỉ dùng cho ID nghiệp vụ human-readable (vd `ORD-2026-000001`), không thay UUID. Prefix và year được hard-code trong util; `sequence` lấy từ DB counter khi implement Order feature (Phase C).

  > **Quyết định thực tế**: tên `generateOrderId` rõ ràng hơn `generateId(prefix)` vì util này chỉ dùng cho Order. Nếu sau này cần ID nghiệp vụ cho entity khác, tạo util riêng (vd `generateInvoiceId`) thay vì generic prefix-based util.

### Tests

- [ ] Soft-delete user → `findById` trả `null`, raw `SELECT *` thấy `deletedAt` set.
- [ ] `slugify("Điện Thoại 15 Pro")` → `"dien-thoai-15-pro"`.
- [ ] `generateOrderId(1)` → `"ORD-2026-000001"`.
- [ ] Repository concrete hoặc Prisma dependency mock được rõ ràng cho unit test service.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §11`](../CONVENTIONS.md) — Base classes & utilities reference.
- [`../CONVENTIONS.md §8`](../CONVENTIONS.md) — Prisma best practices.
- [`./README.md`](./README.md) — Group DoD.
