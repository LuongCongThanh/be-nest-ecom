# Learning Log

---

## Task 00 — Cài đặt Tools

**Date:** 2026-05-22
**Phase:** B — Foundation

### Task 00 — Kết quả verify

- Node.js v24.11.1 (yêu cầu v20+) ✅
- npm 11.13.0 ✅
- NestJS CLI 11.0.21 ✅
- Docker 29.1.3 + Compose v2.40.3 ✅
- Docker Desktop WSL2 backend, DBeaver, Postman — xác nhận thủ công ✅

### Task 00 — Ghi chú

- Tất cả tools đã cài sẵn trước khi bắt đầu Phase B — task này được verify nhanh, không cần cài mới.
- Node.js v24 (mới hơn v20 LTS) hoàn toàn tương thích với NestJS 11.

---

## Task 01 — Khởi tạo NestJS Project

**Date:** 2026-05-23
**Phase:** B — Foundation

### Task 01 — Kết quả verify

- `GET /health` → `200 { status: "ok", timestamp: "..." }` ✅
- `GET /api/v1/health` → `404` (prefix hoạt động đúng) ✅
- `npx tsc --noEmit` → 0 errors ✅
- Folder structure: `common/`, `config/`, `modules/`, `shared/`, `migrations/`, `health/` ✅

### Task 01 — Điều đã học

- `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` — `/health` nằm ngoài prefix để load balancer và Docker healthcheck gọi được mà không cần auth.
- `noUnusedLocals` và `noUnusedParameters` tắt có chủ ý — NestJS DI inject qua constructor, TypeScript sẽ báo false positive nếu bật 2 flag này.
- URL phải có đầy đủ `http://` — thiếu chữ `h` sẽ báo "Invalid protocol: ttp".

### Task 01 — Ghi chú

- Phần lớn code đã có sẵn từ commit trước — task này chủ yếu là verify và hiểu lý do thiết kế.

---

## Task 05 — Prisma Schema (User + Address + RefreshToken)

**Date:** 2026-05-25
**Phase:** B — Foundation

### Task 05 — Kết quả verify

- `npx prisma validate` → `The schema at prisma/schema.prisma is valid` ✅
- UUID dùng cho tất cả `id` field ✅
- `deletedAt DateTime?` soft delete trên User ✅
- `familyId`, `usedAt`, `revokedAt` trên RefreshToken đủ để detect replay attack ✅
- `@@index` trên mọi FK và query field ✅

### Task 05 — Điều đã học

- **UUID thay vì auto-increment**: tránh IDOR attack — attacker không thể enumerate `/users/1`, `/users/2`. Auto-increment còn leak quy mô business.
- **Soft delete (`deletedAt`)**: hard delete User có Order lịch sử sẽ tạo orphan records và vi phạm GDPR. Soft delete giữ nguyên data, chỉ filter `WHERE deletedAt IS NULL`.
- **`familyId` trên RefreshToken**: group token cùng phiên login để detect replay attack. Khi token cũ bị dùng lại sau khi đã revoke → kill toàn bộ family, buộc re-login.
- **`tokenHash @unique`**: không lưu raw refresh token — nếu DB bị leak thì hash không thể reverse. `@unique` tự tạo index, không cần `@@index` riêng.
- **PostgreSQL không tự tạo index cho FK**: phải khai báo `@@index` tường minh trên mọi FK và field hay dùng trong `WHERE`.

### Task 05 — Ghi chú

- `onDelete: Cascade` chỉ trigger khi hard delete, không trigger khi soft delete — thiết kế có chủ ý để giữ Address làm reference.
- Rule "1 địa chỉ mặc định per user" không enforce được ở schema level với Prisma — phải xử lý ở service layer.

---

## Task 06 — Generate & Chạy Migrations

**Date:** 2026-05-25
**Phase:** B — Foundation

### Task 06 — Kết quả verify

- `npx prisma migrate dev --name init` → migration apply thành công ✅
- 3 bảng `users`, `addresses`, `refresh_tokens` tồn tại trong DB ✅
- `npx prisma migrate dev` lần 2 → `Already in sync` ✅
- `npx prisma migrate reset` → re-apply thành công ✅
- Scripts `db:migrate`, `db:migrate:prod`, `db:studio`, `db:reset`, `db:generate` đã có trong `package.json` ✅

### Task 06 — Điều đã học

- **`prisma migrate dev` vs `prisma migrate deploy`**: `dev` tạo migration mới từ schema changes (chỉ dùng local), `deploy` chỉ apply migration đã có (dùng CI/CD production). Không bao giờ chạy `dev` trên production.
- **`prisma migrate reset` chỉ dùng local**: xóa toàn bộ data — chạy trên production là mất data user thật không lấy lại được.
- **Prisma không có built-in rollback**: cách đúng là tạo migration mới để undo thay đổi, không rollback ngược.

### Task 06 — Lỗi gặp phải

- **Prisma 7 breaking change**: `url = env("DATABASE_URL")` trong `datasource` block của `schema.prisma` không còn được hỗ trợ ở Prisma 7. Phải xóa dòng `url` khỏi `schema.prisma` — URL đã được config trong `prisma.config.ts` với `datasource: { url: env("DATABASE_URL") }`.

---

## Task 07 — Shared Contracts & Utilities

**Date:** 2026-05-26
**Phase:** B — Foundation

### Task 07 — Kết quả verify

- `PrismaService` extends generated `PrismaClient` với lifecycle hooks ✅
- `PrismaModule` global — inject được ở mọi module không cần import lại ✅
- `PaginatedResult<T>` và `PaginationOptions` shared contracts ✅
- `slugify`, `formatCurrency`, `generateOrderId` utils ✅
- `UserRepository` filter soft-delete tự động qua `deletedAt: null` ✅
- `@generated/*` alias thêm vào `tsconfig.json` ✅

### Task 07 — Điều đã học

- **Repository Pattern**: tách business query logic khỏi Service — rule `deletedAt: null` viết một lần trong repository, mọi nơi gọi đều tự động có, không sợ developer quên filter.
- **`@Global()` PrismaModule**: import 1 lần ở `AppModule`, các module con inject `PrismaService` trực tiếp mà không cần import `PrismaModule` lại — tránh tạo nhiều `PrismaClient` instance gây connection pool exhaustion.
- **Import alias vs relative path**: alias (`@common/*`, `@generated/*`) dễ đọc và không bị ảnh hưởng khi move file — relative path (`../../../`) dễ sai khi refactor.

### Task 07 — Lỗi gặp phải

- **Prettier indent conflict**: `.prettierrc` không khai báo `tabWidth` tường minh → VSCode editor dùng 4 spaces, Prettier dùng 2 spaces mặc định → conflict khi Format on Save. Fix: thêm `"tabWidth": 2` vào `.prettierrc` và tạo `.editorconfig` với `indent_size = 2`.
- **`prefer-string-replace-all` ESLint rule**: `String#replace()` với global regex bị flag — phải đổi sang `replaceAll()`. Với ký tự đơn như `đ` dùng `replaceAll('đ', 'd')` thay vì regex.
- **Prisma generated `PrismaClient` là `const` không phải class**: ESLint `@typescript-eslint/no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return` báo lỗi khi gọi `this.$connect()`, `this.prisma.user.findFirst()` — fix bằng cách thêm override trong `eslint.config.mjs` để tắt 3 rules này cho `src/**/*.ts`.
- **Prettier `{ }` với space**: constructor body rỗng phải là `{}` không phải `{ }`.

---
