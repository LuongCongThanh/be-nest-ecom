# Task 06 — Generate & Chạy Migrations

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 05
**Ưu tiên**: 🟡 TRUNG BÌNH (Structural — cần để có DB tables, nhưng dễ redo)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [planning/setup/02-database/04-run-migrations.md](../../planning/setup/02-database/04-run-migrations.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Tạo migration đầu tiên từ schema và áp dụng lên PostgreSQL.

- **Migration là source of truth về schema history**: mọi thay đổi DB được track trong git qua file migration. Không bao giờ sửa DB bằng tay rồi để developer khác bị out-of-sync.
- **`prisma migrate dev` vs `prisma migrate deploy`**: `dev` dùng khi phát triển (tạo migration mới từ schema changes), `deploy` dùng trong CI/CD production (chỉ apply migration đã có, không tạo mới). Không bao giờ dùng `dev` trên production.
- **Rollback bằng cách tạo migration mới**: Prisma không có built-in rollback. Cách đúng là viết migration mới để undo thay đổi. Task này dạy pattern đó qua `migrate reset` → `migrate dev`.
- **`prisma generate` sau mỗi schema change**: sync Prisma Client TypeScript types với schema mới — không generate thì TypeScript không biết model mới tồn tại.
- **`prisma migrate reset` chỉ dùng cho local development**: lệnh này xóa toàn bộ data. Không bao giờ chạy trên shared DB hay production.

---

## 🛠️ Các bước thực hiện

### 1. Đảm bảo Docker đang chạy

```bash
docker compose ps
# ecom_postgres phải ở trạng thái (healthy)
```

### 2. Tạo migration đầu tiên

```bash
npx prisma migrate dev --name init
```

Lệnh này sẽ:

- Tạo file migration trong `prisma/migrations/`
- Chạy migration lên DB
- Generate lại Prisma Client

### 3. Verify bảng đã tạo

Mở DBeaver → kết nối tới `localhost:5432` → mở database `ecom_db`:

- [ ] Bảng `users` tồn tại với đúng columns
- [ ] Bảng `addresses` tồn tại
- [ ] Bảng `refresh_tokens` tồn tại

Hoặc dùng Prisma Studio:

```bash
npx prisma studio
# Mở browser tại http://localhost:5555
```

### 4. Thêm scripts vào package.json

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:generate": "prisma generate"
  }
}
```

### 5. Test rollback (thực hành)

```bash
# Reset DB về empty (xóa toàn bộ data + migration)
npx prisma migrate reset
# Confirm: Y

# Chạy lại migrations
npx prisma migrate dev
# Phải chạy thành công
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Migration được apply thành công**

- **Given** Docker postgres healthy, schema đã viết ở Task 05
- **When** chạy `npx prisma migrate dev --name init`
- **Then** output không có error; file migration tồn tại trong `prisma/migrations/`; lệnh `npx prisma migrate status` trả `All migrations have been applied`

**AC-2: Tất cả bảng tồn tại với đúng cấu trúc**

- **Given** migration đã apply
- **When** mở DBeaver hoặc Prisma Studio
- **Then** tồn tại 3 bảng: `users`, `addresses`, `refresh_tokens` với đủ columns theo schema Task 05

**AC-3: Idempotent — migrate lại không tạo bảng trùng**

- **Given** migration đã apply lần đầu
- **When** chạy `npx prisma migrate dev` lần nữa (không có schema changes)
- **Then** output `Already in sync, no schema changes found` — không tạo migration file mới

**AC-4: Reset + re-apply hoạt động**

- **Given** migration đã apply
- **When** chạy `npx prisma migrate reset` → confirm Y → `npx prisma migrate dev`
- **Then** DB trở về empty → migration apply lại thành công → các bảng tồn tại như cũ

---

## Verify hoàn thành

```bash
npx prisma migrate status
# Phải output: All migrations have been applied
```

---

## 🚫 Ngoài phạm vi

- Migration cho Phase C schemas (catalog, cart, order) → Phase C Task 01
- Blue-green deployment migration strategy → production DevOps
- Automatic rollback on deploy failure → CI/CD, ngoài scope
- Migration testing in CI → Phase E
- `prisma migrate diff` để compare environments → advanced workflow

---

## Xong thì làm gì?

→ Mở task tiếp theo: [07-base-classes.md](./07-base-classes.md)
