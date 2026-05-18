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

1. **Reviews**: chỉ User có Order `DELIVERED` chứa Product đó mới được review. 1 User ↔ 1 Review per Product. Update OK, không tạo dòng mới.
2. **Coupon**: validate **trước khi tính total** ở Order creation. Coupon expired/used-up → reject `400`. Coupon đã apply vào Order → atomic increment `usedCount` trong cùng transaction.
3. **Wishlist**: 1 User ↔ N Product, không duplicate. Xóa Product → tự động xóa khỏi wishlist (CASCADE).
4. **Shipping**: phí tính tại checkout time, snapshot vào Order. Đổi pricing rule sau không ảnh hưởng Order cũ.
5. **Q&A**: spam protection — rate limit `POST /qa` ở mức user (TASK-313 từ scale-infra).
6. **Inventory alert**: idempotent — không gửi email 100 lần khi stock bằng 0 vài giờ. Dùng cooldown window 24h.

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
