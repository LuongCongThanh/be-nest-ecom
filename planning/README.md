# 📚 Planning — E-Commerce API

Tài liệu dự án chia **3 nhánh rõ ràng**:

- **`docs/`** — spec, glossary, roadmap, status (WHAT IS / WHERE WE ARE)
- **`setup/`** — hạ tầng, công cụ, quy ước code (HOW)
- **`business/`** — domain, feature, nghiệp vụ (WHAT)

---

## 🚀 Bắt đầu từ đây

| Bạn muốn...                                       | Đọc file                                                                  |
| :------------------------------------------------ | :------------------------------------------------------------------------ |
| **Tự học BE từ 0 — lộ trình 12 tuần**             | [`docs/ROADMAP.md`](./docs/ROADMAP.md) 👈 **người mới đọc trước**         |
| Tra thuật ngữ domain (Money type, VAT, Idempotency, Refresh family, Address...) | [`docs/CONTEXT.md`](./docs/CONTEXT.md) — đã lock 28 design decisions |
| Hiểu yêu cầu nghiệp vụ tổng thể                   | [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md)                          |
| Biết task nào nên làm tiếp                        | [`docs/STATUS.md`](./docs/STATUS.md)                                      |
| Index toàn bộ task                                | [`docs/TASK_INDEX.md`](./docs/TASK_INDEX.md)                              |
| Hướng dẫn dùng `docs/`                            | [`docs/README.md`](./docs/README.md)                                      |
| Quy ước code (naming, validation, pagination, rate limit, logging, healthcheck, CORS, money, FTS) | [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md) |
| Lệnh dev / migration / seed                       | [`setup/COMMANDS.md`](./setup/COMMANDS.md)                                |
| Schema database                                   | [`setup/DATABASE_SCHEMA.md`](./setup/DATABASE_SCHEMA.md)                  |
| Cài PostgreSQL local                              | [`setup/DATABASE_SETUP.md`](./setup/DATABASE_SETUP.md)                    |

---

## 🗂️ Cấu trúc tài liệu

```text
planning/
├── README.md                     ← bạn đang ở đây (entry duy nhất ở root)
│
├── docs/                         ← 📚 Spec, glossary, meta
│   ├── README.md                 ← hướng dẫn dùng các file trong docs/
│   ├── CONTEXT.md                ← glossary + 28 design decisions đã lock
│   ├── REQUIREMENTS.md           ← BRD (Business Requirements)
│   ├── ROADMAP.md                ← lộ trình 12 tuần self-learn
│   ├── STATUS.md                 ← trạng thái + ưu tiên
│   └── TASK_INDEX.md             ← index 79 task
│
├── setup/                        ← 🛠️  Hạ tầng & quy ước (HOW)
│   ├── README.md
│   ├── CONVENTIONS.md            ← quy ước code
│   ├── COMMANDS.md               ← lệnh dev
│   ├── DATABASE_SCHEMA.md        ← ER + schema
│   ├── DATABASE_SETUP.md         ← cài Postgres
│   ├── 01-project/               ← bootstrap, env
│   ├── 02-database/              ← DB connect, schema, migration
│   ├── 03-conventions/           ← validation, guards, base, seed
│   ├── 04-cross-cutting/         ← filter, logging, swagger, upload
│   └── 05-scale-infra/           ← test, cache, CI/CD, RBAC, k8s (post-MVP)
│
└── business/                     ← 🛒 Domain & feature (WHAT)
    ├── README.md
    ├── CHARTER-revenue.md        ← charter Phase 2 (legacy reference)
    ├── 01-identity/              ← User, Auth, Address + CHARTER
    ├── 02-catalog/               ← Category, Product, Stock, Search
    ├── 03-cart/                  ← Cart (User + Guest)
    ├── 04-order/                 ← Order, Checkout, State machine
    ├── 05-payment/               ← VNPay webhook
    ├── 06-engagement/            ← Reviews, Wishlist, Coupons, Shipping
    └── 07-future/                ← Post-MVP features
```

---

## 🧭 Nguyên tắc tổ chức

1. **3 nhánh**: `docs/` = spec/meta (đọc), `setup/` = HOW (cấu hình hệ thống), `business/` = WHAT (feature).
2. **Bounded context**: trong `business/`, mỗi thư mục = 1 bounded context.
3. **Source of truth**: nội dung trùng giữa task và `CONVENTIONS.md`/`DATABASE_SCHEMA.md`/`CONTEXT.md` → file canonical là chuẩn, task chỉ giữ intent + acceptance.
4. **Glossary**: mọi thuật ngữ domain định nghĩa ở `docs/CONTEXT.md`. Đụng từ mới → cập nhật ở đó trước.

---

## 🛠️ Cách dùng task file (với AI pair hoặc tự code)

1. Vào `docs/STATUS.md` → chọn task tiếp.
2. Mở task file tương ứng (đường dẫn ở `docs/TASK_INDEX.md`).
3. Đọc codebase trước khi gõ — task file là **spec mục tiêu**, không phải state hiện tại.
4. Implement theo acceptance criteria.
5. Update `docs/STATUS.md` sau khi xong.

> Với AI: paste task file + `git status` + file liên quan → AI dùng task làm spec.
