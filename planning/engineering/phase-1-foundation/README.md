# 🛠️ Engineering — Phase 1 Foundation Tasks

Thư mục này chứa **các task engineering** đã được tách khỏi `01-Phase-1-Foundation/` (business). Nội dung tập trung vào **HOW** (setup, tooling, convention, mechanism tái sử dụng) thay vì **WHAT** (domain/feature).

> Tham chiếu phase business gốc: [`../../ecommerce-api-doc/01-Phase-1-Foundation/CHARTER.md`](../../ecommerce-api-doc/01-Phase-1-Foundation/CHARTER.md)

---

## 📑 Index

### A. Project Setup

| Task                                                      | Mô tả                     | Liên kết kế thừa |
| :-------------------------------------------------------- | :------------------------ | :--------------- |
| [TASK-101](./TASK-101-Khởi-tạo-Project-NestJS.md)         | Khởi tạo Project NestJS   | —                |
| [TASK-102](./TASK-102-Setup-Environment-Configuration.md) | Environment Configuration | —                |

### B. Database & Migration

| Task                                                        | Mô tả                               | Tài liệu kỹ thuật chính                                        |
| :---------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------------- |
| [TASK-103](./TASK-103-Setup-Database-PostgreSQL.md)         | Setup PostgreSQL                    | [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md)                 |
| [TASK-104](./TASK-104-Kết-nối-NestJS-với-PostgreSQL.md)     | Kết nối NestJS ↔ PostgreSQL         | [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md)                 |
| [TASK-112](./TASK-112-Generate-Run-Migrations.md)           | Generate & Run Migrations           | [`../COMMANDS.md`](../COMMANDS.md)                             |
| [TASK-113](./TASK-113-Migration-Best-Practices-Strategy.md) | Migration Strategy & Best Practices | [`../project-conventions.vi.md`](../project-conventions.vi.md) |

### C. Convention & Quality Gate

| Task                                                             | Mô tả                              | Hợp nhất vào                                                   |
| :--------------------------------------------------------------- | :--------------------------------- | :------------------------------------------------------------- |
| [TASK-105](./TASK-105-Setup-Global-Validation-Error-Handling.md) | Global Validation & Error Handling | [`../project-conventions.vi.md`](../project-conventions.vi.md) |
| [TASK-117](./TASK-117-Tạo-Guards-Decorators.md)                  | Guards & Decorators (Mechanism)    | [`../project-conventions.vi.md`](../project-conventions.vi.md) |
| [TASK-122](./TASK-122-Shared-Base-Classes-Utilities.md)          | Shared Base Classes & Utilities    | [`../project-conventions.vi.md`](../project-conventions.vi.md) |

### D. Documentation & Data Bootstrap

| Task                                                  | Mô tả                                     |
| :---------------------------------------------------- | :---------------------------------------- |
| [TASK-121](./TASK-121-Create-README-Documentation.md) | README & Project Documentation Convention |
| [TASK-125](./TASK-125-Seed-Data-Demo-Mode.md)         | Seed Data & Demo Mode                     |

---

## ⚠️ Lưu ý

- **Single source of truth**: nếu nội dung trùng với `DATABASE_SETUP.md`, `DATABASE_SCHEMA.md`, `COMMANDS.md`, `project-conventions.vi.md` thì các file kia là chuẩn — task ở đây chỉ giữ **intent + acceptance criteria + reference link**.
- **Task ID giữ nguyên** (101→125) để truy vết lịch sử lên kế hoạch ban đầu. KHÔNG renumber.
- **Lộ trình refactor tiếp theo** (chưa làm — chờ approval):
  1. Trích phần _Strategic Context_ trùng lặp → gom vào `../engineering-charter.md`.
  2. Hợp nhất TASK-103/104 → `DATABASE_SETUP.md` (xóa task, giữ pointer).
  3. Hợp nhất TASK-105/113/117/122 → các section mới của `project-conventions.vi.md`.
