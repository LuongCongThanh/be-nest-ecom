# TASK-211: Order Statistics (Reporting)

## 📋 Metadata

- **Task ID**: TASK-211
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Management)
- **Phụ thuộc**: TASK-210 (Order Lifecycle)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)

---

## 🎯 Business Intent

Báo cáo cho Admin/Manager đưa ra quyết định kinh doanh.

- **Source of truth là Order**: stats luôn re-derive từ Order, không lưu denormalized total để tránh drift.
- **Phase 2 đủ dùng aggregate query**: PostgreSQL `GROUP BY` + index. Materialized view / cube chỉ Phase 3 (TASK-329).
- **Time bucket cố định**: day/week/month/quarter/year. Custom range cho phép nhưng cap 366 ngày.

---

## 📄 Endpoints

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/stats/revenue` | GET | ADMIN | Doanh thu theo bucket |
| `/admin/stats/orders/velocity` | GET | ADMIN, STAFF | Số đơn theo bucket |
| `/admin/stats/best-sellers` | GET | ADMIN, STAFF | Top N Product theo qty sold |
| `/admin/stats/conversion` | GET | ADMIN | Conversion rate (cần TASK-329 traffic data, Phase 3) |

### Common query params
- `from`, `to` (ISO date)
- `bucket` (`day|week|month|quarter|year`, default `day`)
- `status` (mảng) — default `["DELIVERED", "PAID", "SHIPPING"]` cho revenue

### Revenue calculation rule
- **Gross Revenue** = SUM(`totalAmount`) trên Order status `DELIVERED` (đã hoàn thành).
- **Pipeline Revenue** = thêm cả `PAID, SHIPPING` (đã thu tiền nhưng chưa giao).
- **Refunded** trừ ra khỏi cả 2.

---

## ✅ Acceptance Criteria

**AC-1: Date range filter chính xác**
- **Given** 100 Order trong tháng, 30 ngày 1-15 và 70 ngày 16-30
- **When** GET `?from=2026-01-16&to=2026-01-30&bucket=day`
- **Then** sum chỉ 70 Order; có 15 buckets (1 per day)

**AC-2: Status filter tách bạch**
- **Given** 50 DELIVERED, 20 PAID, 5 REFUNDED
- **When** GET revenue mặc định
- **Then** = SUM(50 DELIVERED + 20 PAID) - SUM(5 REFUNDED)

**AC-3: Zero data không lỗi**
- **Given** ngày X không có Order
- **When** GET `?from=X&to=X`
- **Then** response trả về `data: [{ bucket: X, revenue: 0, orderCount: 0 }]` — KHÔNG `404`

**AC-4: Range cap 366 ngày**
- **Given** `from = 2024-01-01, to = 2026-01-01` (730 ngày)
- **When** GET
- **Then** `422 DATE_RANGE_EXCEEDED: max 366 days`

**AC-5: Performance trên 100K Orders**
- **Given** Dataset 100K Orders trong DB
- **When** GET revenue cả năm
- **Then** response < 1s (yêu cầu index trên `placedAt, status`)

**AC-6: Best-sellers count theo OrderItem qty**
- **Given** Product P trong 10 Order, mỗi Order qty=2
- **When** GET best-sellers
- **Then** P có `unitsSold = 20`; không phải `orderCount = 10`

---

## 🚫 Out of Scope

- Conversion rate (cần traffic data) → Phase 3 TASK-329.
- Export to CSV/Excel → backlog.
- Drilldown UI (admin dashboard) → Phase 3 TASK-317.
- Customer cohort analysis → Phase 3.
