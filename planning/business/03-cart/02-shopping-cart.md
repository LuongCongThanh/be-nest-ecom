# TASK-207: Shopping Cart Operations

## 📋 Metadata

- **Task ID**: TASK-207
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Conversion)
- **Phụ thuộc**: TASK-110 (Cart Entity), TASK-205 (Stock)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

CRUD operations cho Cart + merge logic khi guest login.

- **Stock pre-check là soft validation**, không reserve: thông báo "Còn N item" — nhưng nếu cuối cùng có người check-out trước, vẫn fail tại TASK-209 (commit stock).
- **Soft-deleted Product không xóa khỏi Cart**: hiển thị flag `unavailable: true` để user thấy điều gì đã xảy ra; checkout sẽ skip item này.
- **Merge khi login**: cộng dồn quantity cho cùng `(productId, variantId)`; guest cart xóa sau merge.

---

## 📄 Endpoints

| Method | Route | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/cart` | User OR Guest session | Lấy Cart + flag từng item |
| POST | `/cart/items` | User OR Guest | Add item (auto-merge nếu trùng combo) |
| PATCH | `/cart/items/:itemId` | Owner only | Update quantity |
| DELETE | `/cart/items/:itemId` | Owner only | Xóa item |
| DELETE | `/cart` | Owner only | Clear toàn bộ Cart |
| POST | `/cart/merge` | Vừa login | Internal call sau login — merge guest cart |

### GET /cart response shape

```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid", "productId": "...", "variantId": "...",
      "name": "...", "image": "...", "quantity": 2,
      "priceAtAdded": 100000, "currentPrice": 100000,
      "lineTotal": 200000,
      "unavailable": false, "priceChanged": false,
      "availableStock": 8
    }
  ],
  "subtotal": 200000,
  "totalItems": 2
}
```

---

## ✅ Acceptance Criteria

**AC-1: Add same combo → tăng quantity**
- **Given** Cart có item `(P, V, qty=2)`
- **When** POST `/cart/items` với `(P, V, qty=3)`
- **Then** Cart có đúng 1 item `(P, V, qty=5)`; không tạo row mới

**AC-2: Quantity vượt stock bị reject**
- **Given** Product có `stockQuantity = 5`
- **When** add item `quantity = 10`
- **Then** `409 INSUFFICIENT_STOCK` với body `{ available: 5 }`

**AC-3: Merge khi login**
- **Given** Guest cart: `[(P1, 2), (P2, 3)]`; User cart sau login: `[(P1, 1), (P3, 1)]`
- **When** POST `/cart/merge` được trigger
- **Then** User cart cuối: `[(P1, 3), (P2, 3), (P3, 1)]`; guest cart bị xóa

**AC-4: Soft-deleted Product hiển thị unavailable**
- **Given** Cart có item của Product P; Admin soft-delete P
- **When** GET `/cart`
- **Then** item P xuất hiện với `unavailable: true`; `subtotal` không bao gồm item này

**AC-5: Cross-user access bị chặn**
- **Given** User A có Cart `cart_a`; User B đăng nhập có token B
- **When** User B gọi `PATCH /cart/items/<item-thuộc-cart_a>`
- **Then** `403 FORBIDDEN`

**AC-6: PATCH quantity = 0 → xóa item**
- **Given** Cart có item `(P, qty=2)`
- **When** PATCH `quantity = 0`
- **Then** item bị xóa khỏi Cart (idempotent với DELETE)

---

## 🚫 Out of Scope

- Cart total/tax/shipping calculation → TASK-208.
- Checkout flow → TASK-209.
- Abandoned cart marketing → backlog.
