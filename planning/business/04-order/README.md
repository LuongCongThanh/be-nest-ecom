# 📦 Order — Đơn hàng

> Bounded context **Commerce / Order**. Glossary: [`../../CONTEXT.md`](../../CONTEXT.md) — section *Commerce Context* + *Order State Machine*.

---

## 🎯 Mục đích

Quản lý **đơn hàng — tài liệu pháp lý immutable** của 1 giao dịch. Đây là **điểm chuyển tiền** của hệ thống. Order chứa snapshot tất cả thông tin biến động (giá, địa chỉ, tên sản phẩm) tại thời điểm checkout.

Order **không bao giờ tham chiếu Cart hay Product mới nhất** — luôn đọc từ `productSnapshot` JSONB. Cũ là bất biến.

---

## 📦 Key Entities

| Entity      | Định nghĩa                                                                                          |
| :---------- | :-------------------------------------------------------------------------------------------------- |
| Order       | Header giao dịch: `orderNumber`, `userId`, `status`, `total`, `customerEmailSnapshot`, `shippingAddressSnapshot`. |
| OrderItem   | Dòng đã chốt: `productSnapshot` (JSONB inline), `quantity`, `unitPrice`, `lineTotal`.               |
| Order State | Enum `PENDING / PAID / SHIPPING / DELIVERED / CANCELLED / REFUNDED`.                                |
| Snapshot    | Bản sao "đông cứng" của Product/Address/Price/Email tại thời điểm checkout. **JSON inline, không FK.** |

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
7. **Cancel Order PAID**: user tự cancel chỉ trong **30 phút** sau checkout (`Self-Cancel Window`). Sau đó cần admin force. Set `REFUNDED` + hoàn stock + emit `order.refunded`. Refund VNPay = **manual** trong MVP (log note + admin xử lý portal). Không cho cancel khi `DELIVERED`. Refund scope = **full only** (partial → Phase 3).
8. **User soft-deleted (`deletedAt`)** → Order vẫn tồn tại, dùng `customerEmailSnapshot` để liên hệ.

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
