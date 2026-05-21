# Task 15 — Phase B Exit Gate

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 00 → 14 đều phải DONE
**Ưu tiên**: 🔴 CAO — KHÔNG được bỏ qua
**Trạng thái**: ⏳ Not started

---

## 🎯 Mục tiêu & Ý nghĩa

Phase B là **nền tảng của toàn bộ dự án**. Phase C (Catalog, Cart, Order) sẽ build trực tiếp trên những gì Phase B thiết lập. Nếu Phase B có lỗi âm ỉ, Phase C sẽ thừa hưởng bugs đó và chúng sẽ ngày càng khó tìm hơn.

Exit Gate này không phải formality — đây là kiểm tra toàn diện để đảm bảo:
- Infrastructure ổn định (Docker, DB, Redis)
- Auth flow hoạt động đúng (register, login, refresh, logout)
- Security mechanisms hoạt động (replay detection, RBAC)
- Code quality đủ để build tiếp (lint, build pass)

> **Quy tắc**: nếu bất kỳ checkbox nào chưa pass, **không chuyển sang Phase C**.

---

## Checklist Exit Gate

### 🏗️ Infrastructure

- [ ] `npm run start:dev` chạy, log `Nest application successfully started`
- [ ] `GET /health` → `200 { "status": "ok" }`
- [ ] `GET /health/ready` → `200 { "db": "connected" }`
- [ ] `docker compose ps` → cả `ecom_postgres` và `ecom_redis` đều `(healthy)`
- [ ] `npx prisma migrate status` → `All migrations have been applied`
- [ ] `npx prisma db seed` chạy thành công, log `Seeding done!`
- [ ] DBeaver kết nối được, bảng `users`, `addresses`, `refresh_tokens` tồn tại

### 🔐 Auth Endpoints

- [ ] `POST /api/v1/auth/register` → `201` với `accessToken`, `refreshToken`, `user` (không có `password`)
- [ ] `POST /api/v1/auth/register` email trùng → `409 EMAIL_ALREADY_EXISTS`
- [ ] `POST /api/v1/auth/register` body không hợp lệ → `422 VALIDATION_FAILED` với `errors` array
- [ ] `POST /api/v1/auth/login` đúng credentials → `200` với tokens
- [ ] `POST /api/v1/auth/login` sai password → `401 INVALID_CREDENTIALS`
- [ ] `POST /api/v1/auth/login` email không tồn tại → `401 INVALID_CREDENTIALS` (cùng message với sai password)
- [ ] `POST /api/v1/auth/refresh` với valid RT → cặp token mới, RT cũ có `usedAt != null` trong DB, DB chỉ lưu `tokenHash` chứ không lưu raw token
- [ ] `POST /api/v1/auth/refresh` với RT đã used → `401 REFRESH_TOKEN_REPLAY_DETECTED`, toàn family bị revoke
- [ ] `POST /api/v1/auth/logout` → `204`, refresh sau đó fail `401`
- [ ] `POST /api/v1/auth/logout-all` → `204`, tất cả RT của user bị revoke

### 👤 Users Endpoints

- [ ] `GET /api/v1/users/me` với valid token → user info, **không có `password`**
- [ ] `GET /api/v1/users/me` không có token → `401 TOKEN_INVALID`
- [ ] `GET /api/v1/users/me` với expired token → `401 TOKEN_EXPIRED` (khác với `TOKEN_INVALID`)
- [ ] `PATCH /api/v1/users/me` → update thành công, trả user mới
- [ ] `PATCH /api/v1/users/me/change-password` đúng password → `204`, tokens cũ bị revoke
- [ ] `PATCH /api/v1/users/me/change-password` sai currentPassword → `401 INVALID_CREDENTIALS`
- [ ] `GET /api/v1/users` với admin token → danh sách users (không có `password`)
- [ ] `GET /api/v1/users` với user token → `403 FORBIDDEN`

### 🔒 Security Checks

- [ ] Response 404 trả JSON, không phải HTML Express default
- [ ] Response 500 không leak stack trace trong response body
- [ ] JWT payload không chứa `password`, `phone`, hay PII ngoài `{ sub, email, role, iat, exp }`
- [ ] Bảng `refresh_tokens` không chứa raw refresh token; chỉ chứa giá trị hash
- [ ] Login error message giống nhau cho "email không tồn tại" và "sai password"

### 🧹 Code Quality

- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → build thành công, không có TypeScript errors
- [ ] `npx tsc --noEmit` → không có type errors

---

## Cách verify nhanh

Tạo file `test.http` ở root và chạy từng request:

```http
### Health
GET http://localhost:3000/health

### Health Ready
GET http://localhost:3000/health/ready

### Register
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "gate-test@example.com",
  "password": "Test@123456",
  "firstName": "Gate",
  "lastName": "Test"
}

### Login
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "gate-test@example.com",
  "password": "Test@123456"
}

### Get Me (thay YOUR_TOKEN bằng accessToken từ login)
GET http://localhost:3000/api/v1/users/me
Authorization: Bearer YOUR_TOKEN

### Refresh (thay YOUR_REFRESH_TOKEN)
POST http://localhost:3000/api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "YOUR_REFRESH_TOKEN" }

### Admin List Users (thay ADMIN_TOKEN bằng token từ admin@ecom.dev login)
GET http://localhost:3000/api/v1/users
Authorization: Bearer ADMIN_TOKEN
```

---

## ✅ Tiêu chí hoàn thành Phase B

**AC-1: Tất cả checklist items pass**

- **Given** đã hoàn thành Tasks 00-14
- **When** thực hiện từng checkpoint trong Exit Gate
- **Then** 100% checkbox được tick — không có exception nào

**AC-2: Build production thành công**

- **Given** toàn bộ code Phase B
- **When** chạy `npm run build`
- **Then** build thành công, output trong `dist/`, không có TypeScript error

**AC-3: Không có regression khi restart**

- **Given** app đã verify xong
- **When** stop app và start lại (`Ctrl+C` rồi `npm run start:dev`)
- **Then** tất cả endpoints vẫn hoạt động như trước — không có state dependency bị mất khi restart

---

## Ghi vào STATUS.md sau khi xong

Mở [STATUS.md](../../docs/STATUS.md) → cuộn xuống `Daily Audit Log` → thêm entry:

```
[2026-XX-XX HH:MM] [Phase B] [EXIT GATE PASSED]
- ✅ Infrastructure: Health endpoints, Docker healthy, migrations applied, seed done
- ✅ Auth: register, login, refresh rotation, replay detection, logout, logout-all
- ✅ Users: me, change-password (tokens revoked), admin list, RBAC 403
- ✅ Security: no password leak, same error for enumeration, no stack trace leak
- ✅ Build: lint pass, tsc pass, build pass
Signed-off: self · Next: Phase C open.
```

---

## 🚫 Ngoài phạm vi của Exit Gate

- Performance testing / load testing → Phase E
- Security penetration testing → Phase E
- End-to-end automated tests → Phase E
- Phase C feature verification → Phase C Exit Gate riêng

---

## Xong thì làm gì?

Phase B DONE. Chuyển sang **phase-c/** — Core MVP Implementation.

→ [../phase-c/01-catalog-schema.md](../phase-c/01-catalog-schema.md)
