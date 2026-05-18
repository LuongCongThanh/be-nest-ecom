# 🛠️ 03-conventions — Convention & Mechanism

> Canonical: [`../CONVENTIONS.md`](../CONVENTIONS.md) (toàn bộ §1–§14)

## 🎯 Mục đích

Đóng gói các **cơ chế dùng chung** (validation, guards, base classes, seed) và **convention** (naming, structure). Sau khi xong nhóm này, mọi feature mới chỉ cần làm theo template, không phải quyết định lại.

## 📋 Tasks

| ID       | Topic                          | File                                                            | Canonical |
| :------- | :----------------------------- | :-------------------------------------------------------------- | :-------- |
| TASK-105 | Global Validation & Error      | [link](./TASK-105-validation-error.md)    | `../CONVENTIONS.md §3, §14` |
| TASK-117 | Guards & Decorators            | [link](./TASK-117-guards-decorators.md)                         | `../CONVENTIONS.md §12` |
| TASK-121 | README convention              | [link](./TASK-121-readme-convention.md)               | — |
| TASK-122 | Base classes & utilities       | [link](./TASK-122-base-classes.md)             | `../CONVENTIONS.md §11` |
| TASK-125 | Seed data & demo mode          | [link](./TASK-125-seed-data.md)                       | — |

## ⚖️ Bất biến

1. **Fail-by-default Auth**: mọi route require JWT trừ khi `@Public()` đánh dấu rõ.
2. **DTO bắt buộc** ở mọi endpoint nhận input. `whitelist: true`, `forbidNonWhitelisted: true`.
3. **No `any`**: type explicit, dùng `Pick<T>`, `Partial<T>`, hoặc interface riêng.
4. **No `process.env` trực tiếp**: dùng `ConfigService`.
5. **No `console.log`**: dùng `Logger` từ `@nestjs/common` kèm correlation ID.
6. **BaseEntity bắt buộc**: mọi entity domain có `id (UUID) / createdAt / updatedAt / deletedAt`.

## ✅ Definition of Done cho nhóm

- Global ValidationPipe đăng ký ở `main.ts` (xem template trong CONVENTIONS §14).
- Global AuthGuard ở `APP_GUARD`. `@Public()`, `@CurrentUser()`, `@Roles()` chạy đúng.
- `BaseRepository<T>` có sẵn `findById`, `findMany`, `create`, `update`, `softDelete`.
- `slugify()` + `formatCurrency()` + `generateId(prefix)` ở `src/shared/utils/`.
- Seed script tạo 1 admin + 5 category + 20 product, idempotent.
