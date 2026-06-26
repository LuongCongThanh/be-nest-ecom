# 👋 Docs — E-Commerce API (NestJS)

Chào bạn. Repo này có **~100 tài liệu**. Đừng hoảng — bạn không cần đọc hết. File này là **bản đồ chỉ đường**.

---

## 🎯 Lộ trình đọc cho người MỚI BẮT ĐẦU

Đọc tuần tự **5 bước này**, tổng khoảng **75–85 phút**. Sau bước 5 bạn sẽ biết phải gõ phím gì đầu tiên.

### Bước 1 — Đọc `docs/README.md` (file này) ⏱ 5 phút

Bạn đang ở đây. Mục tiêu: biết repo chia 3 nhánh (`conventions/`, `tasks/setup/`, `tasks/business/`) và lộ trình đọc.

### Bước 2 — Hiểu dự án này bán cái gì ⏱ 10 phút

→ Mở [`REQUIREMENTS.md`](./REQUIREMENTS.md)

Yêu cầu nghiệp vụ: ai dùng, mua gì, flow đặt hàng. Đọc lướt cũng được, **không cần thuộc**.

### Bước 3 — Học vocabulary domain ⏱ 20 phút

→ Mở [`/CONTEXT.md`](../CONTEXT.md) — **file quan trọng nhất**

Đọc lướt 1 lượt để **biết có những thuật ngữ gì**: `Snapshot`, `Money Type (BigInt)`, `Idempotency Key`, `Order State Machine`, `Refresh Token Family`, `Soft-delete Cascade`, ...

**Không cần thuộc lòng** — chỉ cần biết "có file này, khi cần tra ở đây". Đọc xong bạn sẽ hiểu vì sao project rule có những điểm nghiêm ngặt.

### Bước 4 — Hiểu lộ trình 12 tuần ⏱ 30 phút

→ Mở [`ROADMAP.md`](./ROADMAP.md) — **lộ trình self-learn chính**

- Đọc **kỹ** phần **Tuần 0** (pre-flight: cài tool) + **Tuần 1** (hello NestJS).
- Đọc **lướt** Tuần 2–12 để biết mình sẽ đi đâu.

### Bước 5 — Đọc quy ước code ⏱ 15 phút

→ Mở [`conventions/git-workflow.md`](./conventions/git-workflow.md) — git flow, branch naming, commit format

---

## ✅ Hết bước 5 → Bắt đầu code

Bây giờ bạn:

1. **Theo Tuần 0** trong `ROADMAP.md` — cài Node, Docker, VSCode, DBeaver, Postman.
2. **Khi xong Tuần 0** → mở thư mục tương ứng tuần đang làm:
   - Tuần 1 → [`tasks/setup/01-project/README.md`](./tasks/setup/01-project/README.md) → tasks `01-bootstrap-nestjs.md`, `02-env-config.md`
   - Tuần 2 → [`tasks/setup/02-database/README.md`](./tasks/setup/02-database/README.md) + [`tasks/business/01-identity/CHARTER.md`](./tasks/business/01-identity/CHARTER.md)
   - Tuần 3+ → tiếp tục theo ROADMAP

---

## 🗂️ Cấu trúc docs/

```text
/ (repo root)
└── CONTEXT.md                    ← 📖 glossary + 28 design decisions (đọc bước 3)

docs/
├── README.md                     ← bạn đang ở đây
├── REQUIREMENTS.md               ← BRD (đọc bước 2)
├── ROADMAP.md                    ← lộ trình 12 tuần (đọc bước 4)
├── STATUS.md                     ← tiến độ hiện tại
│
├── agents/                       ← cấu hình AI agent (domain, issue-tracker)
├── adr/                          ← Architecture Decision Records
│
├── conventions/                  ← quy ước làm việc
│   ├── git-workflow.md           ← git flow, branch naming, commit format
│   ├── husky-setup.md            ← git hooks setup
│   └── context-optimization.md  ← token budget cho Claude Code
│
└── tasks/                        ← task specs theo bounded context
    ├── INDEX.md                  ← tra task ID
    ├── setup/                    ← 🛠️ HOW (hạ tầng + quy ước)
    │   ├── 01-project/           ← Tuần 1: bootstrap, env
    │   ├── 02-database/          ← Tuần 1–2: DB, migration
    │   ├── 03-conventions/       ← Tuần 2–3: validation, guards, base
    │   └── 04-cross-cutting/     ← Tuần 10: filter, log, swagger, upload
    └── business/                 ← 🛒 WHAT (domain feature)
        ├── 01-identity/          ← Tuần 2–4: User, Auth, Address
        ├── 02-catalog/           ← Tuần 5–6: Category, Product, Search
        ├── 03-cart/              ← Tuần 7: Cart (User + Guest)
        ├── 04-order/             ← Tuần 8: Order, Checkout, State
        ├── 05-payment/           ← Tuần 9: VNPay
        ├── 06-engagement/        ← Post-MVP: Reviews, Coupons, ...
        └── 07-future/            ← Post-MVP nâng cao (ML, microservices...)
```

---

## 🔎 Tra cứu nhanh (khi đã quen repo)

| "Tôi muốn..."                                      | Mở file                                              |
| -------------------------------------------------- | ---------------------------------------------------- |
| Tra thuật ngữ (Money, Snapshot, Idempotency, ...)  | [`/CONTEXT.md`](../CONTEXT.md)                       |
| Biết nên làm task nào tiếp theo                    | [`STATUS.md`](./STATUS.md)                           |
| Tra task ID cụ thể                                 | [`tasks/INDEX.md`](./tasks/INDEX.md)                 |
| Quy trình git, commit format                       | [`conventions/git-workflow.md`](./conventions/git-workflow.md) |
| Yêu cầu nghiệp vụ                                  | [`REQUIREMENTS.md`](./REQUIREMENTS.md)               |
| Lộ trình 12 tuần                                   | [`ROADMAP.md`](./ROADMAP.md)                         |

---

## 🧭 Nguyên tắc tổ chức

1. **Single source of truth**: `/CONTEXT.md` = glossary + invariants. Task/spec file chỉ giữ intent + acceptance + link canonical.
2. **Bounded context**: `tasks/business/<context>/` mỗi thư mục là 1 domain độc lập.
3. **Glossary first**: thuật ngữ mới → cập nhật `/CONTEXT.md` TRƯỚC, code sau.
4. **Conventions**: quy ước git, hooks, token budget nằm trong `conventions/`.
5. **ADRs**: quyết định kiến trúc quan trọng ghi vào `adr/` theo format `000N-title.md`.

---

## 🛠️ Cách dùng task file (mỗi lần code)

1. Mở `STATUS.md` → xem phase/task tiếp theo.
2. Tra task ID ở `tasks/INDEX.md` → mở file spec tương ứng.
3. Đọc README của subdir chứa task (vd `tasks/business/04-order/README.md`) để hiểu context + invariants.
4. Implement theo acceptance criteria.
5. Update `STATUS.md` sau khi xong.

> Với AI pair-programmer: paste task file + subdir README + `git status` + file liên quan → AI dùng task làm spec.

---

## 💡 Tip

- **Đừng đọc hết 1 lần**. Đọc theo nhu cầu — bước 1–5 ở trên đủ để start.
- **`/CONTEXT.md` là cuốn từ điển** — sẽ tra suốt project.
- **`ROADMAP.md` là cuốn map** — mỗi tuần quay lại check "đang ở đâu, đi đâu tiếp".
- **Mỗi `tasks/business/<context>/README.md`** chứa **invariants** quan trọng — đọc trước khi code feature đó.
