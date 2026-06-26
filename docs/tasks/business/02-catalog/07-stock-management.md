# TASK-205: Stock Movement & Inventory Integrity

## 📋 Metadata

- **Task ID**: TASK-205
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Financial Impact)
- **Phụ thuộc**: TASK-203 (Products CRUD)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Stock là tài sản. Sai 1 đơn vị = mất doanh thu HOẶC overselling (giận khách). Mọi thay đổi `stockQuantity` phải qua **Stock Movement entity** — không UPDATE trực tiếp.

- **Atomic & versioned**: dùng optimistic locking (`version` column) hoặc `SELECT ... FOR UPDATE` để chống race condition.
- **Audit trail bắt buộc**: mỗi movement có `reason`, `referenceType`, `referenceId` (ví dụ `OrderItem`, `Inbound`, `Adjustment`).
- **MVP dùng eager deduction tại checkout**: chưa có reservation/soft-lock. Cart KHÔNG giữ stock; Stock trừ ngay trong `POST /orders` cùng transaction tạo Order. Nếu Order timeout/cancel/refund → hoàn stock theo rule của Order context.

---

## 📄 Stock Movement

### Movement types

| Type         | `delta` | Trigger          | Reference            |
| :----------- | :------ | :--------------- | :------------------- |
| `INBOUND`    | `+N`    | Nhập kho từ NCC  | Manual / PO          |
| `OUTBOUND`   | `-N`    | Order created / checkout commit | OrderItem |
| `RETURN`     | `+N`    | Order cancelled / refunded      | OrderItem |
| `ADJUSTMENT` | `±N`    | Kiểm kê / hư hao | Manual + reason text |

### Endpoint

| Endpoint                            | Method | Quyền        | Mô tả                                                            |
| :---------------------------------- | :----- | :----------- | :--------------------------------------------------------------- |
| `/admin/products/:id/stock`         | POST   | ADMIN, STAFF | Tạo manual movement (`INBOUND`, `ADJUSTMENT`) — phải có `reason` |
| `/admin/products/:id/stock/history` | GET    | ADMIN        | List movements                                                   |

### Internal API (gọi từ Order service)

- `reserveStock(productId, qty)` — chỉ là tên compatibility nếu cần; MVP không có reservation thực.
- `commitStock(productId, qty, orderItemId)` — Atomic decrement với guard `stockQuantity >= qty`.
- `releaseStock(productId, qty, orderItemId)` — Hoàn lại stock khi cancel/refund.

---

## ✅ Acceptance Criteria

**AC-1: Concurrency — chỉ 1 winner cho stock cuối**

- **Given** Product có `stockQuantity = 1`
- **When** 10 request đồng thời gọi `commitStock(productId, 1, ...)`
- **Then** đúng 1 request thành công, 9 request còn lại nhận `409 INSUFFICIENT_STOCK`; final `stockQuantity = 0`

**AC-2: Không bao giờ có stock âm**

- **Given** Product `stockQuantity = 5`
- **When** request `commitStock(productId, 10)`
- **Then** response `409 INSUFFICIENT_STOCK`; stock vẫn = 5; KHÔNG có movement nào được tạo

**AC-3: Manual adjustment require reason**

- **Given** Admin POST `/admin/products/:id/stock` với `delta = -3` nhưng không gửi `reason`
- **When** xử lý
- **Then** `422 REASON_REQUIRED`

**AC-4: History audit trail đầy đủ**

- **Given** Product có 1 INBOUND (+10), 2 OUTBOUND (-1, -2), 1 ADJUSTMENT (-1, reason: "damaged")
- **When** GET stock history
- **Then** trả về 4 entries theo thứ tự thời gian, mỗi entry có `type, delta, balanceAfter, reason, referenceType, referenceId, performedBy, createdAt`

**AC-5: Order rollback restore stock**

- **Given** Order tạo xong → `commitStock(prod, 3)` chạy → Order tạo lỗi ở bước sau → rollback transaction
- **When** kiểm tra
- **Then** không có movement nào được persist; stock không đổi

**AC-6: Low-stock alert trigger**

- **Given** Product `lowStockThreshold = 5`, `stockQuantity = 6`
- **When** commit OUTBOUND `-1` → `stockQuantity = 5`
- **Then** event `inventory.low_stock` được emit (subscriber TASK-226 handle)

---

## 🚫 Out of Scope

- Reservation / soft-lock trong Cart → backlog (post-MVP).
- Multi-warehouse → backlog.
- Inbound PO management → backlog (ERP territory).
- Notification handling cho low-stock → TASK-226.
