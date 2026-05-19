# TASK-110: Đặc tả Cart & CartItem Entities

## 📋 Metadata

- **Task ID**: TASK-110
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Customer Experience)
- **Phụ thuộc**: TASK-109 (Product), TASK-218 (Variants)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section _Commerce Context_

---

## 🎯 Business Intent

Cart là **bằng chứng ý định mua** — không phải đơn hàng. Một số bất biến:

- **1 User active = 1 Cart** tại một thời điểm. Guest có Cart riêng định danh bằng `sessionId` cookie.
- **CartItem tham chiếu Variant nếu có** (TASK-218), fallback Product nếu Product không có Variant.
- **`priceAtAdded` ≠ tổng thanh toán**: dùng để **so sánh & cảnh báo** nếu giá đổi trước checkout. Tổng thanh toán = giá hiện tại × quantity (xem TASK-208).

---

## 📄 Domain Specification

### Cart

| Trường                   | Ràng buộc                                      |
| :----------------------- | :--------------------------------------------- |
| `id`                     | UUID v4                                        |
| `userId`                 | FK User, nullable (guest cart)                 |
| `sessionId`              | String, indexed; required khi `userId IS NULL` |
| `lastActivity`           | Timestamp, indexed (cho abandoned cart job)    |
| `createdAt`, `updatedAt` | Timestamps                                     |

### CartItem

| Trường         | Ràng buộc                                                     |
| :------------- | :------------------------------------------------------------ |
| `id`           | UUID                                                          |
| `cartId`       | FK Cart                                                       |
| `productId`    | FK Product                                                    |
| `variantId`    | FK Variant, nullable (chỉ null khi Product không có variants) |
| `quantity`     | Integer, ≥ 1                                                  |
| `priceAtAdded` | `BigInt` đơn vị đồng VND, snapshot giá lúc add                |

### Quan hệ ràng buộc

- Unique `(cartId, productId, variantId)`: thêm lần 2 cùng combo → **cộng dồn quantity**, không tạo row mới.
- CASCADE delete: User soft-deleted → Cart bị xoá (CASCADE từ TASK-106).

---

## ✅ Acceptance Criteria

**AC-1: 1 User = 1 Cart active**

- **Given** User A đăng nhập trên 2 thiết bị
- **When** cả hai cùng GET `/cart`
- **Then** cả 2 thiết bị thấy cùng 1 Cart (cùng `id`)

**AC-2: Guest cart định danh qua sessionId**

- **Given** Guest (chưa login) lần đầu thêm item
- **When** thêm vào Cart
- **Then** server set cookie `session_id`; Cart row có `userId=null, sessionId=<value>`

**AC-3: Add same product → cộng quantity**

- **Given** Cart có item `{productId: P, variantId: V, quantity: 2}`
- **When** add thêm `{productId: P, variantId: V, quantity: 3}`
- **Then** Cart có đúng 1 row với `quantity = 5`

**AC-4: Variant required nếu Product có variants**

- **Given** Product P có 3 Variant
- **When** add `{productId: P}` không có `variantId`
- **Then** `422 VARIANT_REQUIRED` (đồng bộ TASK-218 AC-3)

**AC-5: priceAtAdded snapshot lúc add, không tự update**

- **Given** thêm Product giá 100 vào Cart → `priceAtAdded = 100`
- **When** Admin đổi Product giá thành 120
- **Then** `CartItem.priceAtAdded` vẫn = 100; nhưng response GET /cart có flag `priceChanged: true, currentPrice: 120`

---

## 🚫 Out of Scope

- Calculation logic (subtotal, tax, shipping) → TASK-208.
- Merge guest cart on login → TASK-207.
- Abandoned cart email campaign → backlog (marketing).
- Soft-lock stock when adding to cart → backlog.
