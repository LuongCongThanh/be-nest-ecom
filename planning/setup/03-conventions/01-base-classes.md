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

- [ ] Nếu module có query logic phức tạp, tạo repository concrete riêng cho module đó (`users.repository.ts`, `orders.repository.ts`, ...).
- [ ] Không bắt buộc `BaseRepository<T>` generic. Nếu có shared contract/helper thì nó phải giữ được type-safety, không dùng dynamic model lookup mù mờ.
- [ ] Với module rất mỏng, service có thể dùng Prisma trực tiếp nếu code vẫn rõ ràng và dễ test.

### Shared utilities (ở `src/shared/utils/`)

- [ ] `slugify(text: string): string` — URL-safe, lowercase, ASCII fold.
- [ ] `formatCurrency(amount: number, locale?: string): string` — default `vi-VN` VND.
- [ ] `generateId(prefix: string): string` — chỉ dùng cho ID nghiệp vụ (vd `ORD-2026-000123`), không thay UUID.

### Tests

- [ ] Soft-delete user → `findById` trả `null`, raw `SELECT *` thấy `deletedAt` set.
- [ ] `slugify("Điện Thoại 15 Pro")` → `"dien-thoai-15-pro"`.
- [ ] Repository concrete hoặc Prisma dependency mock được rõ ràng cho unit test service.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §11`](../CONVENTIONS.md) — Base classes & utilities reference.
- [`../CONVENTIONS.md §8`](../CONVENTIONS.md) — Prisma best practices.
- [`./README.md`](./README.md) — Group DoD.
