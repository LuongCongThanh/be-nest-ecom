# 💬 Engagement — Tương tác khách hàng

> Bounded context **Engagement** (phụ trợ doanh thu). Glossary: [`../../CONTEXT.md`](../../CONTEXT.md).

---

## 🎯 Mục đích

Các feature **tăng tương tác và retention** quanh Catalog/Order: Q&A, Review, Wishlist, Coupon, Shipping methods, Inventory alert. Không phải core revenue nhưng đẩy conversion + giảm churn.

---

## 📦 Sub-features

| Feature        | Mục đích                                                                       |
| :------------- | :----------------------------------------------------------------------------- |
| Q&A System     | User hỏi về Product, admin/staff trả lời. Hiển thị public.                     |
| Reviews & Ratings | User đã `DELIVERED` Product mới được review. Star 1–5 + comment.            |
| Wishlist       | User lưu Product yêu thích để mua sau. Khác Cart (Cart có quantity).           |
| Coupon         | Mã giảm giá: percent/fixed amount, min order, expiry, usage limit.             |
| Shipping       | Multiple methods (standard/express/COD), tính phí theo zone.                   |
| Inventory Alert | Background job kiểm tra `stock < lowStockThreshold` → notify admin.            |

---

## ⚖️ Key Invariants (cross-feature)

1. **Reviews**: chỉ User có Order `DELIVERED` chứa Product đó mới được review. 1 User ↔ 1 Review per Product. Update OK, không tạo dòng mới. User soft-delete → Review **ANONYMIZE** (`userId=NULL`, `authorName="Người dùng đã xóa"`) — xem [`../../CONTEXT.md`](../../CONTEXT.md) cascade policy.
2. **Coupon**:
   - Validate **trước khi tính total** ở Order creation (xem Order Math Formula).
   - **Discount trừ TRƯỚC VAT** (luật thuế VN): `afterDiscount = subtotal - discountAmount` → `vatTotal = afterDiscount * vatRate / (10000 + vatRate)`.
   - Coupon expired/used-up/min order không đạt → reject `400`.
   - Coupon apply vào Order → atomic increment `usedCount` trong cùng `$transaction` checkout.
   - `discountAmount` cap = `subtotal`, không cho âm.
3. **Wishlist**: 1 User ↔ N Product, không duplicate. Xóa Product → CASCADE remove khỏi wishlist. User soft-delete → CASCADE wishlist.
4. **Shipping**: `shippingFee` (BigInt) tính tại checkout, snapshot vào Order. Đổi pricing rule sau không ảnh hưởng Order cũ. KHÔNG cộng VAT vào shipping fee (VAT shipping 0% trong MVP).
5. **Q&A**:
   - Spam protection — rate limit `POST /qa` ở mức **5 req/phút/user** (tier `strict-user`, xem `CONVENTIONS.md §11b`).
   - User soft-delete → ANONYMIZE Q&A (giữ thread context).
6. **Inventory alert**: idempotent — không gửi email 100 lần khi stock bằng 0 vài giờ. Dùng **cooldown window 24h** per product. Provider: theo `EMAIL_PROVIDER` env (Mailtrap dev / Resend prod).
7. **Money type**: mọi field tiền (discount, shipping fee, ...) là `BigInt` đơn vị đồng VND.

---

## 📋 Tasks

| ID       | Topic                       | File                                                |
| :------- | :-------------------------- | :-------------------------------------------------- |
| TASK-217 | Q&A System                  | [link](./06-qa.md)           |
| TASK-219 | Reviews & Ratings           | [link](./02-reviews.md)               |
| TASK-220 | Wishlist & Favorites        | [link](./03-wishlist.md)            |
| TASK-224 | Discount & Coupon System    | [link](./01-coupons.md)        |
| TASK-225 | Multiple Shipping Methods   | [link](./05-shipping.md)     |
| TASK-226 | Inventory Alerts            | [link](./04-inventory-alerts.md) |
| ~~TASK-216~~ | ⚠️ DEPRECATED — gộp vào TASK-219 | [link](./99-rating-system.DEPRECATED.md) |

---

## 📅 Ưu tiên cho self-learn track

Engagement **không nằm trong MVP** ([`../../ROADMAP-SELF-LEARN.md`](../../ROADMAP-SELF-LEARN.md)). Chỉ làm sau Tuần 12 nếu muốn mở rộng. Thứ tự đề xuất nếu làm:

1. Coupon (TASK-224) — học transaction lồng nhau.
2. Reviews (TASK-219) — học foreign business rule (chỉ DELIVERED mới review).
3. Wishlist (TASK-220) — đơn giản, làm để khởi động lại nếu nghỉ lâu.
4. Inventory Alert (TASK-226) — học background job + email.
5. Shipping (TASK-225) — business rule heavy.
6. Q&A (TASK-217) — moderation phức tạp.
