# 🛒 Cart — Giỏ hàng

> Bounded context **Commerce / Cart**. Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section _Commerce Context_.

---

## 🎯 Mục đích

Quản lý **giỏ hàng mutable** của User. Cart là trạng thái trung gian giữa "browsing" và "checkout".

Cart **chưa phải giao dịch** — chưa trừ kho, chưa khóa giá. Snapshot pattern (`priceAtAdded`) chỉ dùng để **báo thay đổi giá** trước checkout.

---

## 📦 Key Entities

| Entity           | Định nghĩa                                                                                                                                           |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cart             | Trạng thái mua sắm của 1 User **HOẶC** 1 Guest. CHECK: `userId XOR guestSessionId`. 1 User active ↔ ≤ 1 Cart. 1 Guest (`guestSessionId`) ↔ ≤ 1 Cart. |
| CartItem         | Dòng trong Cart: `productId + quantity + priceAtAdded`. `priceAtAdded` là `BigInt` đơn vị đồng VND.                                                  |
| Guest Session ID | UUID lưu cookie `gsid` (HttpOnly, SameSite=Lax, Max-Age=30 ngày). Server set khi non-auth client gọi `GET /cart` lần đầu.                            |
| Price At Added   | Giá Product tại thời điểm thêm. So với `Product.price` hiện tại → flag `priceChanged: true` khi GET cart.                                            |
| Cart Lifecycle   | Guest cart: `expiresAt = createdAt + 30 ngày`. Cron daily hard-delete khi expired. User cart: soft-delete CASCADE theo User.                         |

---

## 🔌 Public API (high-level)

| Endpoint                        | Vai trò                                                                                           |
| :------------------------------ | :------------------------------------------------------------------------------------------------ |
| `GET    /cart`                  | Lấy cart hiện tại — auth (User) hoặc cookie `gsid` (Guest). Tự tạo Cart + set cookie nếu chưa có. |
| `POST   /cart/items`            | Thêm item — idempotent theo `productId` (cùng productId → cộng quantity)                          |
| `PATCH  /cart/items/:id`        | Cập nhật quantity                                                                                 |
| `DELETE /cart/items/:id`        | Xóa item                                                                                          |
| `DELETE /cart`                  | Xóa toàn bộ cart                                                                                  |
| `POST   /cart/merge` (internal) | Gọi tự động sau login — gộp Guest cart vào User cart với `mergeWarnings[]`                        |

---

## ⚖️ Key Invariants

1. **1 owner ↔ 1 Cart active**: 1 User ≤ 1 Cart, 1 Guest (gsid) ≤ 1 Cart. POST items vào không có Cart → tạo Cart tự động (User cart nếu auth, Guest cart nếu có cookie `gsid`, tạo cookie mới nếu chưa).
2. POST cùng `productId` 2 lần → **cộng dồn `quantity`**, KHÔNG tạo dòng mới (idempotent theo productId).
3. `quantity ≥ 1`. Set `quantity = 0` không hợp lệ — phải dùng DELETE.
4. `quantity ≤ stockQuantity` tại thời điểm add/update. Vượt → `400 STOCK_INSUFFICIENT`.
5. **`priceAtAdded` snapshot**: không tự update khi `Product.price` đổi. GET cart → compare → flag `priceChanged: true` per item.
6. **Cart Merge** (Guest → User login) — **best-effort cap/overwrite**:
   - Cùng `productId` → cộng `quantity`. Nếu vượt `stockQty` → cap về stockQty + warning `CAPPED_QUANTITY`.
   - `priceAtAdded` khác giữa 2 cart → overwrite bằng giá hiện tại + warning `PRICE_CHANGED`.
   - Product đã `deletedAt` → skip item + warning `PRODUCT_DELETED`.
   - Trả `mergeWarnings[]` cho FE hiện toast.
   - Guest cart hard-delete sau merge xong.
7. **Cart KHÔNG trừ stock** — chỉ Order (`POST /orders`) trừ eager. Cart chỉ là "intent".
8. **Money type**: mọi field tiền trong Cart (`priceAtAdded`, `subtotal`, ...) là `BigInt` đơn vị đồng VND.

---

## 📋 Tasks

| ID       | Topic             | File                          |
| :------- | :---------------- | :---------------------------- |
| TASK-110 | Cart entities     | [link](./01-cart-entities.md) |
| TASK-207 | Shopping cart     | [link](./02-shopping-cart.md) |
| TASK-208 | Cart calculations | [link](./03-cart-calc.md)     |

---

## 🔗 Liên hệ với Order

Cart **không tham chiếu Order**. Checkout (`POST /orders`) đọc Cart → tạo Order độc lập + xóa Cart. Sau đó Cart không còn tồn tại — Order chứa snapshot. Xem [`../04-order/README.md`](../04-order/README.md).
