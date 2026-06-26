# 📦 Order — Đơn hàng

> Bounded context **Commerce / Order**. Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section *Commerce Context* + *Order State Machine*.

---

## 🎯 Mục đích

Quản lý **đơn hàng — tài liệu pháp lý immutable** của 1 giao dịch. Đây là **điểm chuyển tiền** của hệ thống. Order chứa snapshot tất cả thông tin biến động (giá, địa chỉ, tên sản phẩm) tại thời điểm checkout.

Order **không bao giờ tham chiếu Cart hay Product mới nhất** — luôn đọc từ `productSnapshot` JSONB. Cũ là bất biến.

---

## 📦 Key Entities

| Entity      | Định nghĩa                                                                                          |
| :---------- | :-------------------------------------------------------------------------------------------------- |
| Order       | Header giao dịch: `orderNumber` (format `ORD-YYYY-{6digit}`, sinh từ Postgres sequence), `userId`, `status`, `subtotal`, `discountAmount`, `vatTotal`, `shippingFee`, `grandTotal` (tất cả `BigInt` đồng VND), `customerEmailSnapshot`, `shippingAddressSnapshot` (JSONB). |
| OrderItem   | Dòng đã chốt: `productSnapshot` (JSONB inline), `quantity`, `unitPrice`, `vatRate` (Int 1/10000, MVP=0), `vatAmount` (BigInt, MVP=0), `lineTotal` (BigInt). |
| Order State | Enum `PENDING / PAID / SHIPPING / DELIVERED / CANCELLED / REFUNDED`.                                |
| Snapshot    | Bản sao "đông cứng" của Product/Address/Price/Email tại thời điểm checkout. **JSON inline, không FK.** |
| OrderStateChangeLog | Audit log mọi state transition: `orderId`, `fromState`, `toState`, `changedBy`, `reason?`, `isForceOverride`, `createdAt`. |

### Order Math Formula (bắt buộc theo thứ tự)

```
lineTotal[i]     = unitPrice[i] * quantity[i]
subtotal         = sum(lineTotal)
afterDiscount    = max(0, subtotal - discountAmount)            // discount cap = subtotal
vatTotal         = (afterDiscount * vatRate) / (10000 + vatRate) // MVP: 0
grandTotal       = afterDiscount + shippingFee
```

**Discount trừ TRƯỚC VAT** (đúng luật thuế VN).

---

## 🔌 Public API (high-level)

| Endpoint                              | Vai trò                                       |
| :------------------------------------ | :-------------------------------------------- |
| `POST   /orders`                      | Checkout từ Cart (atomic transaction)         |
| `GET    /orders/me`                   | List Order của User hiện tại                  |
| `GET    /orders/:id`                  | Detail (chỉ owner hoặc admin)                 |
| `PATCH  /orders/:id/cancel`           | Hủy (owner, nếu state cho phép)               |
| `PATCH  /orders/:id/status` (admin/staff) | Đổi state theo state machine (validate transition) |
| `PATCH  /orders/:id/force-status` (admin) | Force override state machine — bắt buộc `reason`, audit-logged |
| `GET    /orders/stats` (admin)        | Thống kê (TASK-211)                           |

---

## ⚖️ Key Invariants

1. **Order tạo từ Cart phải atomic**: validate stock + trừ stock + tạo Order + tạo OrderItem + xóa Cart, **tất cả trong cùng `prisma.$transaction`**. Lỗi bất kỳ bước nào → rollback toàn bộ.
2. **OrderItem.productSnapshot là JSONB inline, không phải FK**. Xóa/sửa Product gốc không ảnh hưởng Order cũ.
3. **State transition tuân Order State Machine** (xem `CONTEXT.md`). Transition ngược (DELIVERED → SHIPPING) hoặc skip (PENDING → DELIVERED) → reject `400`.
4. **`orderNumber` duy nhất, format `ORD-YYYY-NNNNNN`**. Dùng cho hiển thị + support. **Không expose `Order.id` (UUID)** ra UI.
5. **Mỗi state transition emit 1 Order Lifecycle Event** (TASK-222): `order.paid`, `order.shipped`, `order.delivered`, `order.cancelled`, `order.refunded`.
6. **Trừ kho EAGER tại `POST /orders` (PENDING)** trong cùng transaction checkout. Dùng row-level lock (`SELECT ... FOR UPDATE` hoặc Prisma `update where stockQty >= qty`) để chống oversell. Order PENDING quá 15 phút chưa PAID → cleanup job set CANCELLED + hoàn stock.
7. **Cancel Order PAID**: user tự cancel chỉ trong **30 phút** sau checkout (`Self-Cancel Window`). Sau đó cần admin force. Set `REFUNDED` + hoàn stock + emit `order.refunded`. Refund VNPay = **manual** trong MVP (log note + admin xử lý portal). Không cho cancel khi `DELIVERED`. Refund scope = **full only** (partial → giai đoạn scale sau).
8. **User soft-deleted (`deletedAt`)** → Order vẫn tồn tại, dùng `customerEmailSnapshot` để liên hệ.
9. **Idempotency**: `POST /orders` BẮT BUỘC header `Idempotency-Key` (UUID FE sinh khi mở trang checkout). Cùng key trong 24h → trả Order cũ. Body khác key cũ → `409 IDEMPOTENCY_KEY_REUSED`. Chống double-click + mobile retry.
10. **Money type**: mọi field tiền `BigInt` đơn vị đồng VND. Không float.
11. **Address Snapshot**: User chọn `Address` từ profile (xem [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — Address Context). Server đọc Address → snapshot toàn bộ vào `shippingAddressSnapshot` JSONB. Sau đó sửa/xóa Address gốc KHÔNG ảnh hưởng Order.
12. **VAT MVP = 0**: schema có `vatRate`, `vatAmount`, `vatTotal` nhưng MVP set `0`. Bật VAT sau qua flag, không cần migration historical.

---

## 📋 Tasks

| ID       | Topic                          | File                                                   |
| :------- | :----------------------------- | :----------------------------------------------------- |
| TASK-111 | Order & OrderItem entities     | [link](./01-order-entities.md)                   |
| TASK-209 | Order creation (checkout)      | [link](./02-order-creation.md)         |
| TASK-210 | Order management               | [link](./03-order-mgmt.md)                 |
| TASK-211 | Order statistics               | [link](./05-order-stats.md)                 |
| TASK-222 | Order lifecycle events         | [link](./04-order-events.md)   |

---

## 🔗 Liên hệ

- **Payment**: payment success → đổi `PENDING → PAID` + trừ stock + emit event. Xem [`../05-payment/`](../05-payment/README.md).
- **Cart**: source data cho checkout. Xem [`../03-cart/`](../03-cart/README.md).
- **Catalog**: đọc Product info để snapshot, **không tham chiếu sau snapshot**.
