# 👋 Planning — E-Commerce API (NestJS)

Chào bạn. Repo này có **~100 tài liệu**. Đừng hoảng — bạn không cần đọc hết. File này là **bản đồ chỉ đường**.

---

## 🎯 Lộ trình đọc cho người MỚI BẮT ĐẦU

Đọc tuần tự **6 bước này**, tổng khoảng **80–90 phút**. Sau bước 6 bạn sẽ biết phải gõ phím gì đầu tiên.

### Bước 1 — Đọc `README.md` (file này) ⏱ 5 phút
Bạn đang ở đây. Mục tiêu: biết repo chia 3 nhánh (`docs/`, `setup/`, `business/`) và lộ trình đọc.

### Bước 2 — Hướng dẫn dùng `docs/` ⏱ 3 phút
→ Mở [`docs/README.md`](./docs/README.md)

Biết 5 file trong `docs/` dùng vào việc gì. Có bảng "tôi muốn X → mở file Y".

### Bước 3 — Hiểu dự án này bán cái gì ⏱ 10 phút
→ Mở [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md)

Yêu cầu nghiệp vụ: ai dùng, mua gì, flow đặt hàng. Đọc lướt cũng được, **không cần thuộc**.

### Bước 4 — Học vocabulary domain ⏱ 20 phút
→ Mở [`docs/CONTEXT.md`](./docs/CONTEXT.md) — **file quan trọng nhất**

Đọc lướt 1 lượt để **biết có những thuật ngữ gì**: `Snapshot`, `Money Type (BigInt)`, `Idempotency Key`, `Order State Machine`, `Refresh Token Family`, `Soft-delete Cascade`, ...

**Không cần thuộc lòng** — chỉ cần biết "có file này, khi cần tra ở đây". Đọc xong bạn sẽ hiểu vì sao project rule có những điểm nghiêm ngặt.

### Bước 5 — Hiểu lộ trình 12 tuần ⏱ 30 phút
→ Mở [`docs/ROADMAP.md`](./docs/ROADMAP.md) — **lộ trình self-learn chính**

- Đọc **kỹ** phần **Tuần 0** (pre-flight: cài tool) + **Tuần 1** (hello NestJS).
- Đọc **lướt** Tuần 2–12 để biết mình sẽ đi đâu.

### Bước 6 — Liếc quy ước code ⏱ 10 phút
→ Mở [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md) §1–§3

3 mục đầu là đủ cho Tuần 1: module structure, naming, type safety. §4–§15 đọc khi gặp.

---

## ✅ Hết bước 6 → Bắt đầu code

Bây giờ bạn:

1. **Theo Tuần 0** trong `docs/ROADMAP.md` — cài Node, Docker, VSCode, DBeaver, Postman.
2. **Khi xong Tuần 0** → mở thư mục tương ứng tuần đang làm:
   - Tuần 1 → [`setup/01-project/README.md`](./setup/01-project/README.md) → tasks `01-bootstrap-nestjs.md`, `02-env-config.md`
   - Tuần 2 → [`setup/02-database/README.md`](./setup/02-database/README.md) + [`business/01-identity/CHARTER.md`](./business/01-identity/CHARTER.md)
   - Tuần 3+ → tiếp tục theo ROADMAP

---

## 🗂️ Cấu trúc repo

```text
planning/
├── README.md                     ← bạn đang ở đây (entry duy nhất ở root)
│
├── docs/                         ← 📚 Spec, glossary, meta — đọc ở bước 2–5
│   ├── README.md                 ← hướng dẫn dùng docs/
│   ├── REQUIREMENTS.md           ← BRD
│   ├── CONTEXT.md                ← glossary + 28 design decisions
│   ├── ROADMAP.md                ← lộ trình 12 tuần (chính)
│   ├── STATUS.md                 ← task tiếp theo + tiến độ
│   └── TASK_INDEX.md             ← lookup task ID
│
├── setup/                        ← 🛠️  HOW (hạ tầng + quy ước)
│   ├── README.md
│   ├── CONVENTIONS.md            ← quy ước code (đọc bước 6)
│   ├── COMMANDS.md               ← lệnh dev nhớ nhanh
│   ├── DATABASE_SCHEMA.md        ← ER diagram
│   ├── DATABASE_SETUP.md         ← cài Postgres local
│   ├── 01-project/               ← Tuần 1: bootstrap, env
│   ├── 02-database/              ← Tuần 1–2: DB, migration
│   ├── 03-conventions/           ← Tuần 2–3: validation, guards, base
│   ├── 04-cross-cutting/         ← Tuần 10: filter, log, swagger, upload
│   └── 05-scale-infra/           ← Tuần 12+: test, cache, CI/CD (post-MVP)
│
└── business/                     ← 🛒 WHAT (domain feature)
    ├── README.md
    ├── 01-identity/              ← Tuần 2–4: User, Auth, Address
    ├── 02-catalog/               ← Tuần 5–6: Category, Product, Search
    ├── 03-cart/                  ← Tuần 7: Cart (User + Guest)
    ├── 04-order/                 ← Tuần 8: Order, Checkout, State
    ├── 05-payment/               ← Tuần 9: VNPay
    ├── 06-engagement/            ← Post-MVP: Reviews, Coupons, ...
    └── 07-future/                ← Post-MVP nâng cao (ML, microservices...)
```

---

## 🔎 Tra cứu nhanh (khi đã quen repo)

| "Tôi muốn..."                                       | Mở file                                                          |
|-----------------------------------------------------|------------------------------------------------------------------|
| Tra thuật ngữ (Money, Snapshot, Idempotency, ...) | [`docs/CONTEXT.md`](./docs/CONTEXT.md)                           |
| Biết tuần này code gì                              | [`docs/ROADMAP.md`](./docs/ROADMAP.md) + [`docs/STATUS.md`](./docs/STATUS.md) |
| Tra task ID cụ thể                                  | [`docs/TASK_INDEX.md`](./docs/TASK_INDEX.md)                     |
| Quy ước code (naming, validation, pagination, ...) | [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md)                 |
| Lệnh `prisma migrate dev/deploy/...`                | [`setup/COMMANDS.md`](./setup/COMMANDS.md)                       |
| Schema ER diagram                                   | [`setup/DATABASE_SCHEMA.md`](./setup/DATABASE_SCHEMA.md)         |
| Cài PostgreSQL                                      | [`setup/DATABASE_SETUP.md`](./setup/DATABASE_SETUP.md)           |
| Yêu cầu nghiệp vụ                                   | [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md)                 |

---

## 🧭 Nguyên tắc tổ chức

1. **3 nhánh**:
   - `docs/` = **biết cái gì** (spec/meta, đọc trước khi code)
   - `setup/` = **làm thế nào** (infra, convention)
   - `business/` = **làm cái gì** (domain feature)
2. **Bounded context**: `business/<context>/` mỗi thư mục là 1 domain độc lập.
3. **Source of truth**: rule chính ở `docs/CONTEXT.md` + `setup/CONVENTIONS.md` + `setup/DATABASE_*.md`. Task file chỉ giữ intent + acceptance + link canonical.
4. **Glossary first**: thuật ngữ mới → cập nhật `docs/CONTEXT.md` TRƯỚC, code sau.

---

## 🛠️ Cách dùng task file (mỗi lần code)

1. Vào [`docs/STATUS.md`](./docs/STATUS.md) → chọn task tiếp theo.
2. Mở task file (đường dẫn ở [`docs/TASK_INDEX.md`](./docs/TASK_INDEX.md)).
3. Đọc README của subdir chứa task đó (vd `business/04-order/README.md`) để hiểu context + invariants.
4. Implement theo acceptance criteria.
5. Update [`docs/STATUS.md`](./docs/STATUS.md) sau khi xong.

> Với AI pair-programmer: paste task file + subdir README + `git status` + file liên quan → AI dùng task làm spec.

---

## 💡 Tip

- **Đừng đọc hết 1 lần**. Đọc theo nhu cầu — bước 1–6 ở trên đủ để start. Còn lại đọc khi gặp.
- **`docs/CONTEXT.md` là cuốn từ điển** — sẽ tra suốt project.
- **`docs/ROADMAP.md` là cuốn map** — mỗi tuần quay lại check "đang ở đâu, đi đâu tiếp".
- **Mỗi `business/<context>/README.md`** chứa **invariants** quan trọng — đọc trước khi code feature đó.
