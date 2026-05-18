# TASK-117: Auth Guards & Decorators

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §12`](../CONVENTIONS.md) (Auth Middleware Stack)

---

## 🎯 Intent

Cơ chế **fail-by-default**: mọi route require JWT trừ khi đánh dấu `@Public()`. Cung cấp decorator chuẩn (`@Roles`, `@CurrentUser`) cho mọi feature module dùng — không cần tự re-implement.

Đây là **mechanism**, không phải feature Auth (Auth feature ở `business/01-identity/`).

---

## ✅ Acceptance Criteria

### Guards

- [ ] `JwtAuthGuard` đăng ký global ở `APP_GUARD` (trong `AppModule.providers`). KHÔNG khai báo từng controller.
- [ ] Guard đọc Bearer token, verify chữ ký + expiry, attach `user` vào `request.user`.
- [ ] `RolesGuard` đăng ký global sau `JwtAuthGuard`. Check `@Roles(...)` metadata.
- [ ] Token expired → `401` với code `TOKEN_EXPIRED`. Sai signature → `401` `TOKEN_INVALID`.

### Decorators (ở `src/common/decorators/`)

- [ ] `@Public()` — đánh dấu route không cần auth (set metadata `IS_PUBLIC: true`).
- [ ] `@Roles(...roles: Role[])` — yêu cầu role cụ thể.
- [ ] `@CurrentUser()` — param decorator inject `request.user` vào handler.

### Middleware order (theo CONVENTIONS §12)

```
1. Helmet → 2. CORS → 3. ValidationPipe → 4. JwtAuthGuard
→ 5. RolesGuard → 6. Controller → 7. ResponseInterceptor → 8. ExceptionFilter
```

### Tests

- [ ] `GET /health` có `@Public()` → không token vẫn `200`.
- [ ] `GET /me` không có `@Public()` → không token → `401`.
- [ ] Endpoint `@Roles(Role.ADMIN)` → user role USER → `403`.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §12`](../CONVENTIONS.md) — Full auth middleware stack.
- [`../../business/01-identity/TASK-114-jwt-auth.md`](../../business/01-identity/TASK-114-jwt-auth.md) — JWT strategy feature (dùng cơ chế này).
- [`./README.md`](./README.md) — Group DoD.
