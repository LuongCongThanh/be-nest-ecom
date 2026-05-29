# 📜 Phase 2 Charter — Commercial Operations & Revenue

> Tài liệu khung Phase 2. Mọi task phải tracr về mục tiêu / scope / success criteria trong file này.

---

## 🎯 Mục tiêu Phase

Phase 2 mở 2 bounded context kinh doanh cốt lõi và đạt **Minimum Viable Revenue Flow** — User có thể tìm sản phẩm, thêm vào Cart, checkout và trả tiền.

- **Catalog** — Category, Product, Variant, Stock, Search.
- **Commerce** — Cart, Order, Payment, Shipping, Coupon, Order Lifecycle Events.
- **Engagement** (nhánh phụ trợ doanh thu) — Review, QA, Wishlist, Inventory Alert.

### Lý do tồn tại của Phase

1. **Phase 1 đã đóng băng Identity** → mọi tính năng Phase 2 đều giả định User entity ổn định.
2. **Schema chiến lược (TASK-106)** đã chốt snapshot pattern + delete strategy — Phase 2 chỉ áp dụng, không thay đổi nguyên tắc.
3. **Doanh thu thực sự xuất hiện ở Phase 2** — đây là điểm hệ thống đi từ "có người dùng" sang "có giao dịch".

---

## 📦 Scope của Phase 2

### ✅ TRONG SCOPE

| Bounded Context | Tasks | Mô tả |
| :--- | :--- | :--- |
| **Catalog — Entities** | TASK-108, 109, 218 | Category, Product, Variants/Attributes |
| **Catalog — Features** | TASK-201, 202, 203, 204, 205 | CRUD, Tree, Search/Filter, Stock |
| **Catalog — Media** | TASK-206 | Product Images (dùng infra TASK-223) |
| **Commerce — Entities** | TASK-110, 111 | Cart, Order |
| **Commerce — Cart** | TASK-207, 208 | Cart operations, calculations |
| **Commerce — Order** | TASK-209, 210, 211, 222 | Creation, Management, Statistics, Lifecycle Events |
| **Commerce — Money** | TASK-221, 224, 225 | Payment integration, Coupons, Shipping methods |
| **Engagement** | TASK-217, 219, 220, 226 | QA, Reviews, Wishlist, Inventory alerts |

### ❌ NGOÀI SCOPE (đã tách)

| Nhóm | Đã chuyển đến |
| :--- | :--- |
| Global Error Handler, Logging/Response Interceptors, Swagger, File Upload Service | [`planning/setup/04-cross-cutting/`](../setup/README.md) |

### 🚫 NGOÀI SCOPE (đẩy sang Phase 3)

- Unit/E2E test coverage hệ thống → TASK-301, 302.
- Caching strategy → TASK-306, 311.
- Elasticsearch (TASK-204 dùng PostgreSQL full-text trước) → TASK-316.
- Real-time notifications (WebSocket) → TASK-318.
- Multi-language / multi-currency → TASK-325, 326.

---

## 🎯 Success Criteria (Phase Exit Gates)

Phase 2 chỉ được đóng khi **TẤT CẢ** điều kiện sau được đáp ứng:

1. ✅ User có thể tìm thấy Product qua search/filter và xem detail.
2. ✅ User có thể thêm Product vào Cart, sửa quantity, xóa item.
3. ✅ Checkout flow atomic: trừ kho + tạo Order + clear Cart trong cùng transaction; fail ở bất kỳ bước nào → rollback.
4. ✅ Order snapshot bất biến: thay đổi Product giá/tên không ảnh hưởng Order cũ.
5. ✅ Order state machine: chỉ transition theo định nghĩa (xem `CONTEXT.md`); attempt sai trả `400`.
6. ✅ Ít nhất 1 payment provider tích hợp end-to-end (ví dụ VNPay sandbox).
7. ✅ Order lifecycle events được emit và có ít nhất 1 subscriber (email notification).
8. ✅ Reviews chỉ chấp nhận từ User đã `DELIVERED` Product đó.
9. ✅ Coupon: validate quy tắc áp dụng (min order, expiry, usage limit) trước khi tính tổng.
10. ✅ Stock alert kích hoạt khi `stockQuantity` xuống dưới `lowStockThreshold`.

---

## 🔗 Phụ thuộc Outbound

Phase 2 require các engineering primitive sau hoàn tất trước:
- [`TASK-212`](../setup/04-cross-cutting/01-error-filter.md) — global error filter.
- [`TASK-213`](../setup/04-cross-cutting/02-logging.md) — correlation ID cho debug.
- [`TASK-214`](../setup/04-cross-cutting/03-response-transform.md) — response envelope.
- [`TASK-223`](../setup/04-cross-cutting/05-file-upload.md) — trước TASK-206 (Product Images).

Phase 1 dependency: Identity hoàn tất, User entity stable, Auth guards hoạt động.

---

## 🗣️ Ngôn ngữ thống nhất

Glossary domain: [`../docs/CONTEXT.md`](../docs/CONTEXT.md) — sections **Catalog Context**, **Commerce Context**, **Order State Machine**.

---

## 📊 Phase Sequencing (đề xuất)

```
Wave 1 (Engineering primitives, parallel-able):
  TASK-212, 213, 214, 223

Wave 2 (Catalog foundation):
  TASK-108 → 201, 202
  TASK-109 → 203, 205, 206 (need 223)
  TASK-218 (variants) → 204 (search uses variants)

Wave 3 (Commerce core):
  TASK-110 → 207, 208
  TASK-111 → 209, 210, 211, 222

Wave 4 (Money & Engagement, parallel):
  TASK-221, 224, 225
  TASK-217, 219, 220, 226

Wave 5 (Docs):
  TASK-215 (Swagger — gather all endpoints)
```
