# TASK-111: Đặc tả Order & OrderItem Entities

## 📋 Metadata

- **Task ID**: TASK-111
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Revenue & Legal)
- **Phụ thuộc**: TASK-110 (Cart), TASK-106 (Snapshot strategy)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section *Commerce Context*, đặc biệt *Order State Machine*

---

## 🎯 Business Intent

Order là **tài liệu pháp lý** ràng buộc khách hàng và nhà bán. Bất biến cốt lõi:

- **Immutable sau create**: mọi field "động" (giá, tên, địa chỉ) phải snapshot. Thay đổi nguồn KHÔNG ảnh hưởng Order cũ.
- **State machine nghiêm ngặt**: chỉ transition theo sơ đồ ở `CONTEXT.md`. Sai → `400 INVALID_TRANSITION`.
- **`orderNumber` là contract giao tiếp**: format `ORD-YYYYMMDD-XXXXX` (5 ký tự uppercase alphanumeric).

---

## 📄 Domain Specification

### Order

| Trường | Ràng buộc |
| :--- | :--- |
| `id` | UUID v4 |
| `orderNumber` | String unique, format `ORD-\d{8}-[A-Z0-9]{5}` |
| `userId` | FK User (nullable nếu guest checkout — Phase 3) |
| `customerEmailSnapshot` | Snapshot — bảo toàn khi User đổi email |
| `status` | Enum: `PENDING`, `PAID`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `subtotal` | Decimal — tổng `unitPrice * qty` của OrderItem |
| `shippingFee` | Decimal |
| `discount` | Decimal — từ coupon (TASK-224) |
| `tax` | Decimal — VAT |
| `totalAmount` | Decimal — `subtotal + shippingFee + tax - discount` |
| `shippingAddressSnapshot` | JSONB: `{ recipient, phone, line1, line2, ward, district, province, postcode }` |
| `shippingMethod` | String key (xem TASK-225) |
| `paymentStatus` | Enum: `UNPAID`, `PAID`, `REFUNDED` |
| `paymentProvider` | String, e.g. `vnpay`, `stripe`, `cod` |
| `paymentRef` | Provider transaction id |
| `placedAt` | Timestamp |
| `cancelledAt`, `deliveredAt` | Optional timestamps |

### OrderItem

| Trường | Ràng buộc |
| :--- | :--- |
| `id` | UUID |
| `orderId` | FK Order |
| `productId` | FK Product (soft link, RESTRICT delete) |
| `variantId` | FK Variant, optional |
| `productSnapshot` | JSONB: `{ name, sku, image, attributes }` |
| `unitPrice` | Decimal — snapshot |
| `quantity` | Integer ≥ 1 |
| `lineTotal` | Decimal = `unitPrice × quantity` |

### Order State Transitions hợp lệ

```
PENDING   → PAID | CANCELLED
PAID      → SHIPPING | REFUNDED | CANCELLED
SHIPPING  → DELIVERED | REFUNDED
DELIVERED → REFUNDED   (chỉ cho phép trong 7 ngày, business rule)
CANCELLED → (terminal)
REFUNDED  → (terminal)
```

---

## ✅ Acceptance Criteria

**AC-1: Snapshot bảo toàn lịch sử**
- **Given** Order tạo với `productSnapshot.name = "iPhone 15"`, `unitPrice = 25,000,000`
- **When** Admin đổi Product name thành `"iPhone 15 Pro"` và `price = 27,000,000`
- **Then** GET Order vẫn trả về `productSnapshot.name = "iPhone 15"`, `unitPrice = 25,000,000`

**AC-2: Invalid transition bị reject**
- **Given** Order ở state `DELIVERED`
- **When** Admin cố set `status = PENDING`
- **Then** `400 INVALID_TRANSITION: DELIVERED → PENDING not allowed`

**AC-3: orderNumber format & unique**
- **Given** tạo 1000 Order liên tiếp
- **When** kiểm tra
- **Then** mọi `orderNumber` match regex `ORD-\d{8}-[A-Z0-9]{5}` và không trùng

**AC-4: User chỉ thấy Order của chính mình**
- **Given** User A có 3 Order; User B có 2 Order
- **When** User A gọi `GET /orders`
- **Then** chỉ trả về 3 Order của A; gọi `GET /orders/<B_order_id>` → `403 FORBIDDEN`

**AC-5: totalAmount tính đúng**
- **Given** subtotal=1000, shippingFee=50, tax=100, discount=200
- **When** tạo Order
- **Then** `totalAmount = 950`

**AC-6: DELIVERED → REFUNDED chỉ trong 7 ngày**
- **Given** Order `DELIVERED` cách đây 10 ngày
- **When** Admin set REFUNDED
- **Then** `409 REFUND_WINDOW_EXPIRED`

---

## 🚫 Out of Scope

- Order creation flow → TASK-209.
- Status transition operations (UI/API) → TASK-210.
- Payment integration → TASK-221.
- Coupon application → TASK-224.
- Shipping method selection → TASK-225.
- Order lifecycle events → TASK-222.
- Statistics / reporting → TASK-211.
