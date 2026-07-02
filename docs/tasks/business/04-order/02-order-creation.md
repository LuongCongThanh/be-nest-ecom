# TASK-209: Order Creation (Checkout Flow)

## 📋 Metadata

- **Task ID**: TASK-209
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Revenue Path)
- **Phụ thuộc**: TASK-208 (Calculation), TASK-205 (Stock), TASK-111 (Order Entity)
- **Trạng thái**: 🔵 In progress — AC-1,2,4,5 done (OrderService.checkout + POST /orders, TDD, 5 integration test + manual smoke test qua HTTP thật). MVP trim: bỏ coupon/discount (TASK-224) và tính ship động (TASK-225, dùng flat fee), bỏ event `order.created` (TASK-222) và payment thật (TASK-221). AC-3 (race condition 10 client đồng thời) dời — cần load-test tooling, không hợp Jest unit test; cơ chế `SELECT FOR UPDATE` ở `commitStock` (TASK-205) đã đảm bảo đúng invariant, nhưng chưa có test tải thật xác nhận. AC-6 (placedAt=createdAt) đúng theo thiết kế (cùng `@default(now())` trong 1 INSERT) nhưng chưa assert riêng.

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Checkout là **transaction quan trọng nhất của commerce flow**. Bất biến:

- **All-or-nothing**: 5 bước (calc → stock commit → snapshot create → cart clear → emit event) phải atomic. Lỗi ở bước nào → rollback toàn bộ.
- **Idempotency-Key**: client phải gửi key duy nhất; duplicate POST trong window 10 phút → trả lại Order cũ, không tạo mới.
- **Stock commit ngay**: MVP không có reservation; commit luôn lúc tạo Order. Nếu payment fail hoặc Order timeout/cancel → release stock theo rule của Order context.

---

## 📄 Checkout Flow — `POST /orders`

### Request
```json
{
  "shippingAddress": { ... },
  "shippingMethod": "standard",
  "couponCode": "SUMMER10",
  "paymentProvider": "vnpay",
  "idempotencyKey": "uuid-v4-from-client"
}
```

### Server flow (transactional)

| # | Bước | Lỗi → action |
| :- | :--- | :--- |
| 1 | Validate Cart non-empty + items available | `422 EMPTY_CART` / `409 ALL_ITEMS_UNAVAILABLE` |
| 2 | Re-calculate (TASK-208) ở server | — |
| 3 | Idempotency lookup | Trùng key → return existing Order |
| 4 | `commitStock` cho từng item (TASK-205) | Fail → rollback, `409 INSUFFICIENT_STOCK` |
| 5 | Tạo Order + OrderItem với snapshots | DB fail → rollback stock (Step 4 reverse) |
| 6 | Clear Cart (delete items) | DB fail → rollback Order + stock |
| 7 | Emit `order.created` event (TASK-222) | Async, non-blocking |
| 8 | Initiate payment flow (TASK-221) | — |
| 9 | Return Order + payment instructions | — |

### Order Number generation

- Format: `ORD-{YYYY}-{6 chữ số padded}` (vd `ORD-2026-000123`).
- Sinh bằng **Postgres sequence** `order_number_seq` — atomic, không collision, không cần retry.
- Migration tạo sequence: `CREATE SEQUENCE order_number_seq START 1;`
- Trong transaction: `SELECT nextval('order_number_seq')` → format thành `ORD-${year}-${val.toString().padStart(6, '0')}`.

---

## ✅ Acceptance Criteria

**AC-1: Atomic — fail at step N rollback steps 1..N-1**
- **Given** Cart 3 item; force-fail tại step 5 (DB constraint)
- **When** POST /orders
- **Then** response `500`; KHÔNG có Order/OrderItem nào persist; stock của 3 Product không đổi; Cart không bị clear

**AC-2: Idempotency-Key chống double-submit**
- **Given** Client gửi 2 POST liên tiếp với cùng `idempotencyKey`
- **When** 2 request đến trong window 10 phút
- **Then** response 2 trả về cùng Order với response 1; chỉ 1 Order trong DB; stock commit 1 lần

**AC-3: Race condition stock**
- **Given** Product `stockQuantity = 1`; 10 client cùng POST /orders với product này
- **When** xử lý đồng thời
- **Then** chính xác 1 Order thành công; 9 còn lại nhận `409 INSUFFICIENT_STOCK`

**AC-4: Snapshot tại Order Item từ Product hiện tại**
- **Given** Product P giá hiện tại = 120 (Cart `priceAtAdded` = 100, đã thay đổi)
- **When** checkout
- **Then** `OrderItem.unitPrice = 120` (giá lúc checkout, không phải lúc add to cart); `productSnapshot` lưu name/sku/image **tại thời điểm checkout**

**AC-5: Cart empty sau checkout thành công**
- **Given** Cart 3 item, checkout thành công
- **When** GET /cart sau đó
- **Then** Cart rỗng (`items: []`)

**AC-6: Order.placedAt = thời điểm commit thành công**
- **Given** Order vừa tạo
- **When** kiểm tra
- **Then** `placedAt = createdAt = transaction commit time` (timezone UTC)

---

## 🚫 Out of Scope

- Payment processing detail → TASK-221.
- Order status updates sau khi tạo → TASK-210.
- Auto-cancel PENDING orders sau X phút → TASK-210 / scheduler.
- Order lifecycle events handler → TASK-222.
