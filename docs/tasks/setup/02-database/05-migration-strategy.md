# TASK-113: Migration Strategy & Best Practices

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §13`](../CONVENTIONS.md) (Migration Strategy & Best Practices)

---

## 🎯 Intent

Thiết lập **kỷ luật migration một chiều** cho production. Migration đã merge vào main = bất biến; sửa = tạo migration mới revert.

Đây không phải task code — đây là **convention enforcement**. Sai migration ở production có thể mất data.

---

## ✅ Acceptance Criteria

- [ ] Quy tắc bất di bất dịch viết rõ trong `CONVENTIONS.md §13`.
- [ ] Naming convention `<YYYYMMDDHHMMSS>_<verb>_<entity>` (ví dụ `20260518123000_add_email_verified_to_users`).
- [ ] Pre-deploy check: `npx prisma migrate status` không có pending.
- [ ] DDL và DML tách file: schema migration chỉ `ALTER`, data update viết script riêng idempotent.
- [ ] Drop column/table phải 2 deploy: deprecate trước, drop sau.
- [ ] Mọi PR đụng `prisma/schema.prisma` phải kèm migration file mới (kiểm tra trong code review).
- [ ] Team document hóa quy tắc revert: tạo migration mới, không edit file cũ.

---

## ⚖️ Bất biến (trích từ canonical)

1. **Migration 1 chiều**: không edit file đã merge.
2. **DDL ≠ DML**: schema khác data.
3. **2-phase drop**: deprecate → drop ở deploy sau.
4. **Idempotent data scripts**: chạy lại không hỏng.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §13`](../CONVENTIONS.md) — Full migration rules.
- [`../COMMANDS.md`](../COMMANDS.md) — `prisma migrate dev/deploy/status/reset`.
- [`./README.md`](./README.md) — Group DoD.
