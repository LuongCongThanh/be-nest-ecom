# 📚 `docs/` — Spec, Glossary & Meta

Thư mục này chứa **5 file spec/meta** của dự án. Mọi tài liệu nhánh (`setup/`, `business/`) đều tham chiếu về đây.

`docs/` là lớp trả lời:

- dự án này đang giải bài toán gì,
- thuật ngữ nào đã được khóa,
- trạng thái execution hiện tại đang ở đâu.

`docs/` **không** nên ôm walkthrough triển khai hằng ngày. Phần đó thuộc `../todo/`.

> 📍 Entry chính: [`../README.md`](../README.md)

---

## 📑 5 file trong `docs/`

| File                                   | Loại                             | Khi nào đọc                                                                                                                | Cập nhật khi nào                                                                                  |
| -------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`CONTEXT.md`](./CONTEXT.md)           | **Glossary + Design Decisions**  | Khi gặp thuật ngữ lạ (Money type, Snapshot, Refresh Family...) hoặc cần tra rule design đã lock. **File quan trọng nhất.** | Mỗi khi thêm/đổi 1 thuật ngữ domain hoặc lock 1 quyết định kiến trúc mới.                         |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | **BRD — Business Requirements**  | Khi cần hiểu yêu cầu nghiệp vụ tổng thể (mục tiêu kinh doanh, user persona, value proposition).                            | Khi stakeholder đổi yêu cầu nghiệp vụ. Rất hiếm.                                                  |
| [`ROADMAP.md`](./ROADMAP.md)           | **Self-learn track 12 tuần**     | Người mới bắt đầu — đây là **map đi từ Tuần 0 → MVP**. Có cả "What you learn" + step-by-step + checklist.                  | Khi chiến lược học/scope MVP đổi.                                                                 |
| [`STATUS.md`](./STATUS.md)             | **Waterfall Tracking Dashboard** | Khi mở session code mới — xem Phase hiện tại, task tiếp, exit gate sắp đạt. Có audit log + sign-off template.              | Sau mỗi task: cập nhật task status + append audit log entry. **File cập nhật thường xuyên nhất.** |
| [`TASK_INDEX.md`](./TASK_INDEX.md)     | **Master Task Index**            | Khi cần tìm spec của 1 TASK ID cụ thể.                                                                                     | Khi thêm/xóa/move task file.                                                                      |

---

## 🔄 Vòng đời mỗi file

```
                      ┌─────────────────────┐
                      │   REQUIREMENTS.md   │  (đầu vào — gần như không đổi)
                      └──────────┬──────────┘
                                 ▼
                      ┌─────────────────────┐
                      │     CONTEXT.md      │  (chốt thuật ngữ + design rule)
                      └──────────┬──────────┘
                                 ▼
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      │  ROADMAP.md  │   │   STATUS.md  │   │TASK_INDEX.md │
      │  (12-week)   │   │   (live)     │   │  (lookup)    │
      └──────────────┘   └──────────────┘   └──────────────┘
                                 │
                                 ▼
                    ../setup/ + ../business/  (impl task files)
```

---

## 🧭 Quy tắc khi sửa

1. **`CONTEXT.md` là single source of truth cho thuật ngữ + design**. Sửa ở đây trước, sau đó task file mới được dùng thuật ngữ.
2. **`STATUS.md` cập nhật thường xuyên** — sau mỗi checkpoint execution trong `../todo/`. Đừng đợi cuối tuần.
3. **`TASK_INDEX.md` rebuild** khi rename/move file task. Đừng để link chết.
4. **`ROADMAP.md` là learning map** — đổi khi scope MVP/order tuần đổi căn bản, không dùng thay cho execution checklist sống.
5. **`REQUIREMENTS.md` gần như đóng băng** — đầu vào từ stakeholder.
6. Nếu `planning/` và `todo/` có vẻ khác nhau:
   - **thuật ngữ, invariant, rule dài hạn** → tin `planning/`
   - **thứ tự làm, checkpoint, exit gate** → tin `todo/`

---

## 🎯 Use case lookup nhanh

| "Tôi muốn..."                                     | Mở file                               |
| ------------------------------------------------- | ------------------------------------- |
| "Snapshot pattern là gì?"                         | `CONTEXT.md` — section Commerce       |
| "Money type lưu kiểu nào?"                        | `CONTEXT.md` — Money Type             |
| "Tuần này code gì?"                               | `ROADMAP.md` + `STATUS.md`            |
| "TASK-209 nằm ở đâu?"                             | `TASK_INDEX.md`                       |
| "Mục tiêu kinh doanh dự án là gì?"                | `REQUIREMENTS.md`                     |
| "Stock deduct khi nào?"                           | `CONTEXT.md` — Stock Deduction Timing |
| "Idempotency key dùng sao?"                       | `CONTEXT.md` — Idempotency Key        |
| "Order state machine có gì?"                      | `CONTEXT.md` — Order State Machine    |
| "Soft-delete user thì Cart/Order/Review thế nào?" | `CONTEXT.md` — Cross-context cascade  |
| "Pagination kiểu gì?"                             | `../setup/CONVENTIONS.md §8.6`        |
| "Rate limit endpoint nào?"                        | `../setup/CONVENTIONS.md §11b`        |
| "Nên làm phase nào tiếp theo?"                    | `../../todo/README.md` + `STATUS.md`  |

---

## ⚠️ Lưu ý cross-ref

Khi viết task file ở `business/` hoặc `setup/`, link về `docs/`:

```markdown
Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)
Roadmap: [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md)
```

Depth quan trọng:

- Từ root `README.md` → `./docs/CONTEXT.md`
- Từ `setup/<XX>/` hoặc `business/<XX>/` → `../../docs/CONTEXT.md`
- Từ `business/CHARTER-revenue.md` (depth 2) → `../docs/CONTEXT.md`
