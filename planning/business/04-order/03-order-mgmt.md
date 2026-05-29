# TASK-210: Order Management (Lifecycle Operations)

## 📋 Metadata

- **Task ID**: TASK-210
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Operations)
- **Phụ thuộc**: TASK-209 (Order Creation)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — *Order State Machine*

---

## 🎯 Business Intent

Vận hành Order sau khi đã tạo. State machine enforce ở mọi API.

- **Customer scope**: xem orders của chính mình; cancel chỉ khi `PENDING`.
- **Admin scope**: xem all, transition state, refund.
- **Mọi transition emit event**: subscriber (notification, inventory release, analytics) lo phần ngoại biên (TASK-222).
- **Auto-cancel PENDING > 24h**: scheduler job — release stock.

---

## 📄 Endpoints

### Customer scope

| Endpoint | Method | Mô tả |
| :--- | :--- | :--- |
| `/orders` | GET | List orders của user (filter status, pagination) |
| `/orders/:id` | GET | Detail (chỉ owner) |
| `/orders/:id/cancel` | POST | Customer cancel — chỉ `PENDING` |

### Admin scope

| Endpoint | Method | Quyền | Transition |
| :--- | :--- | :--- | :--- |
| `/admin/orders` | GET | ADMIN, STAFF | List all (filter) |
| `/admin/orders/:id/pay` | POST | ADMIN, STAFF | `PENDING → PAID` (manual, e.g. COD confirm) |
| `/admin/orders/:id/ship` | POST | ADMIN, STAFF | `PAID → SHIPPING`; body `{ trackingNumber, carrier }` |
| `/admin/orders/:id/deliver` | POST | ADMIN, STAFF | `SHIPPING → DELIVERED` |
| `/admin/orders/:id/cancel` | POST | ADMIN | Force cancel; body `{ reason }`; release stock |
| `/admin/orders/:id/refund` | POST | ADMIN | `PAID/DELIVERED → REFUNDED`; body `{ reason, partial?: number }` |

### Auto-cancel job
- Cron mỗi 5 phút: scan `Order status=PENDING AND placedAt < now - 24h` → set `CANCELLED`, release stock, emit event.

---

## ✅ Acceptance Criteria

**AC-1: User chỉ thấy orders của mình**
- **Given** User A: 3 orders, User B: 5 orders
- **When** A gọi GET `/orders`
- **Then** trả về 3 orders của A; gọi `/orders/<B_order_id>` → `403`

**AC-2: Customer cancel chỉ ở PENDING**
- **Given** Order ở `PAID`
- **When** customer POST `/orders/:id/cancel`
- **Then** `409 INVALID_TRANSITION`

**AC-3: Cancel/Refund auto-release stock**
- **Given** Order với 1 item qty=3 đang ở `PAID`; Product stock hiện tại = 10
- **When** Admin cancel hoặc refund
- **Then** Product stock = 13; có stock movement `RETURN` được tạo (TASK-205)

**AC-4: Ship require tracking info**
- **Given** Admin POST `/admin/orders/:id/ship` với body rỗng
- **When** xử lý
- **Then** `422 TRACKING_REQUIRED`

**AC-5: Auto-cancel PENDING > 24h**
- **Given** Order PENDING tạo lúc T-25h, chưa pay
- **When** scheduler chạy
- **Then** Order chuyển CANCELLED; stock được release; event `order.cancelled` emit; reason = `AUTO_TIMEOUT`

**AC-6: Refund window 7 ngày sau DELIVERED**
- **Given** Order DELIVERED cách đây 10 ngày
- **When** Admin refund
- **Then** `409 REFUND_WINDOW_EXPIRED` (đồng bộ TASK-111 AC-6)

---

## 🚫 Out of Scope

- Partial refund money flow → TASK-221 (payment provider).
- Notification email per transition → TASK-222 + downstream subscribers.
- Return logistics (RMA) → backlog.
- Order analytics → TASK-211.
