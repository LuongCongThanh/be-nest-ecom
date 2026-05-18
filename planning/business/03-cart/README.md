# 🛒 Cart — Giỏ hàng

> Bounded context **Commerce / Cart**. Glossary: [`../../CONTEXT.md`](../../CONTEXT.md) — section *Commerce Context*.

---

## 🎯 Mục đích

Quản lý **giỏ hàng mutable** của User. Cart là trạng thái trung gian giữa "browsing" và "checkout".

Cart **chưa phải giao dịch** — chưa trừ kho, chưa khóa giá. Snapshot pattern (`priceAtAdded`) chỉ dùng để **báo thay đổi giá** trước checkout.

---

## 📦 Key Entities

| Entity         | Định nghĩa                                                                                      |
| :------------- | :---------------------------------------------------------------------------------------------- |
| Cart           | Trạng thái mua sắm của 1 User. **1 User ↔ ≤ 1 Cart active** tại một thời điểm.                  |
| CartItem       | Dòng trong Cart: `productId + quantity + priceAtAdded + lastActivity`.                          |
| Price At Added | Giá Product tại thời điểm thêm vào Cart, dùng để báo `priceChanged` khi giá hiện tại khác.      |

---

## 🔌 Public API (high-level)

| Endpoint                          | Vai trò                                          |
| :-------------------------------- | :----------------------------------------------- |
| `GET    /cart`                    | Lấy cart hiện tại của User (auth)                |
| `POST   /cart/items`              | Thêm item — idempotent theo productId            |
| `PATCH  /cart/items/:id`          | Cập nhật quantity                                |
| `DELETE /cart/items/:id`          | Xóa item                                         |
| `DELETE /cart`                    | Xóa toàn bộ cart                                 |

---

## ⚖️ Key Invariants

1. **1 User chỉ có 1 Cart active**. POST items vào Cart không tồn tại → tạo Cart tự động.
2. POST cùng `productId` 2 lần → cộng dồn `quantity`, KHÔNG tạo dòng mới.
3. `quantity ≥ 1`. Set `quantity = 0` không hợp lệ — phải dùng DELETE.
4. `quantity ≤ stockQuantity` tại thời điểm add/update. Vượt → `400`.
5. Snapshot `priceAtAdded` **không tự động cập nhật** khi giá Product thay đổi. Khi GET cart → so sánh với giá hiện tại, gắn cờ `priceChanged: true`.
6. Cart **không tự xóa** khi `lastActivity` cũ — chỉ flag `abandoned` để marketing remind (Phase nâng cao).
7. Cart Merge (Phase 2 — Guest → User login): cùng `productId` → cộng `quantity`, KHÔNG ghi đè.

---

## 📋 Tasks

| ID       | Topic                | File                                          |
| :------- | :------------------- | :-------------------------------------------- |
| TASK-110 | Cart entities        | [link](./TASK-110-cart-entities.md)           |
| TASK-207 | Shopping cart        | [link](./TASK-207-shopping-cart.md) |
| TASK-208 | Cart calculations    | [link](./TASK-208-cart-calc.md)       |

---

## 🔗 Liên hệ với Order

Cart **không tham chiếu Order**. Checkout (`POST /orders`) đọc Cart → tạo Order độc lập + xóa Cart. Sau đó Cart không còn tồn tại — Order chứa snapshot. Xem [`../04-order/README.md`](../04-order/README.md).
