# 📚 Planning — E-Commerce API

Tài liệu dự án chia **2 nhánh rõ ràng**:

- **`setup/`** — hạ tầng, công cụ, quy ước code (HOW)
- **`business/`** — domain, feature, nghiệp vụ (WHAT)

---

## 🚀 Bắt đầu từ đây

| Bạn muốn...                                       | Đọc file                                                                  |
| :------------------------------------------------ | :------------------------------------------------------------------------ |
| **Tự học BE từ 0 — lộ trình 12 tuần**             | [`ROADMAP-SELF-LEARN.md`](./ROADMAP-SELF-LEARN.md) 👈 **người mới đọc trước** |
| Tra thuật ngữ domain (User, Cart, Order, Snapshot, Money type, VAT, Idempotency, Refresh family, Address...) | [`CONTEXT.md`](./CONTEXT.md) — đã lock 28 design decisions |
| Hiểu yêu cầu nghiệp vụ tổng thể                   | [`BUSINESS_REQUIREMENTS.md`](./BUSINESS_REQUIREMENTS.md)                  |
| Biết task nào nên làm tiếp                        | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)                                |
| Index toàn bộ task                                | [`TASK_INDEX.md`](./TASK_INDEX.md)                                        |
| Quy ước code (naming, validation, pagination, rate limit, logging, healthcheck, CORS, money, FTS) | [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md) |
| Lệnh dev / migration / seed                       | [`setup/COMMANDS.md`](./setup/COMMANDS.md)                                |
| Schema database                                   | [`setup/DATABASE_SCHEMA.md`](./setup/DATABASE_SCHEMA.md)                  |
| Cài PostgreSQL local                              | [`setup/DATABASE_SETUP.md`](./setup/DATABASE_SETUP.md)                    |

---

## 🗂️ Cấu trúc tài liệu

```text
planning/
├── README.md                     ← bạn đang ở đây
├── ROADMAP-SELF-LEARN.md         ← lộ trình 12 tuần (self-learn)
├── CONTEXT.md                    ← glossary domain (Ubiquitous Language)
├── BUSINESS_REQUIREMENTS.md      ← BRD
├── PROJECT_STATUS.md             ← trạng thái + ưu tiên
├── TASK_INDEX.md                 ← index 80 task
│
├── setup/                        ← 🛠️  Hạ tầng & quy ước (HOW)
│   ├── README.md
│   ├── CONVENTIONS.md            ← quy ước code
│   ├── COMMANDS.md               ← lệnh dev
│   ├── DATABASE_SCHEMA.md        ← ER + schema
│   ├── DATABASE_SETUP.md         ← cài Postgres
│   ├── 01-project/               ← TASK-101, 102 (NestJS init, env)
│   ├── 02-database/              ← TASK-103, 104, 106, 112, 113 (DB connect, schema, migration)
│   ├── 03-conventions/           ← TASK-105, 117, 121, 122, 125 (validation, guards, base classes, seed)
│   ├── 04-cross-cutting/         ← TASK-212–215, 223 (filter, logging, swagger, file upload)
│   └── 05-scale-infra/           ← TASK-301, 302, 304, 306–316, 320, 321 (test, cache, CI/CD, RBAC, k8s)
│
└── business/                     ← 🛒 Domain & feature (WHAT)
    ├── README.md
    ├── CHARTER-revenue.md        ← charter Phase 2 (legacy reference)
    ├── 01-identity/              ← TASK-107, 114–116, 118–120, 123, 124 + CHARTER
    ├── 02-catalog/               ← TASK-108, 109, 201–206, 218
    ├── 03-cart/                  ← TASK-110, 207, 208
    ├── 04-order/                 ← TASK-111, 209–211, 222
    ├── 05-payment/               ← TASK-221
    ├── 06-engagement/            ← TASK-217, 219, 220, 224–226 (+ TASK-216 DEPRECATED)
    └── 07-future/                ← TASK-303, 305, 317–319, 322–329 (post-MVP)
```

---

## 🧭 Nguyên tắc tổ chức

1. **Setup vs Business**: nếu task nói về **mechanism/infrastructure** (cách hệ thống chạy) → `setup/`. Nếu task nói về **feature người dùng** (cái hệ thống làm) → `business/`.
2. **Bounded context**: trong `business/`, mỗi thư mục = 1 bounded context (Identity, Catalog, Cart, Order, Payment, Engagement, Future).
3. **Source of truth**: nội dung trùng giữa task và `CONVENTIONS.md`/`DATABASE_SCHEMA.md` → file canonical là chuẩn, task chỉ giữ intent + acceptance.
4. **Glossary**: mọi thuật ngữ domain định nghĩa ở `CONTEXT.md`. Đụng từ mới → cập nhật ở đó trước.

---

## 🛠️ Cách dùng task file (với AI pair hoặc tự code)

1. Vào `PROJECT_STATUS.md` → chọn task tiếp.
2. Mở task file tương ứng (đường dẫn ở `TASK_INDEX.md`).
3. Đọc codebase trước khi gõ — task file là **spec mục tiêu**, không phải state hiện tại.
4. Implement theo acceptance criteria.
5. Update `PROJECT_STATUS.md` sau khi xong.

> Với AI: paste task file + `git status` + file liên quan → AI dùng task làm spec.
