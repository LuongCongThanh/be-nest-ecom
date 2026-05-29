# TASK-208: Cart Calculations (Pricing Engine)

## 📋 Metadata

- **Task ID**: TASK-208
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Financial Accuracy)
- **Phụ thuộc**: TASK-207 (Cart)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Tính tổng tiền checkout. Một sai số nhỏ = mất tiền hoặc kiện cáo.

- **Server-only calculation**: KHÔNG tin client tính tổng. Mọi total đều tính lại ở server trước khi tạo Order.
- **Decimal arithmetic**: dùng `Decimal` library — không dùng `number` JS (floating point).
- **Apply order**: `Subtotal → Discount → Shipping → Tax → Total`. Discount áp dụng trên subtotal, KHÔNG trên shipping.
- **Audit-ready**: lưu breakdown đầy đủ ở Order (không chỉ total cuối).

---

## 📄 Calculation Specification

### Formula

```
subtotal      = SUM(item.unitPrice * item.quantity) for available items only
discountValue = ApplyCoupon(coupon, subtotal)        // TASK-224
shippingFee   = CalcShipping(address, weight, total) // TASK-225
tax           = (subtotal - discountValue) * taxRate // taxRate đến từ config
totalAmount   = subtotal - discountValue + shippingFee + tax
```

### Endpoint

`POST /cart/calculate` — preview tính toán trước checkout

**Body:**

```json
{
  "shippingAddress": { ... },
  "shippingMethod": "standard",
  "couponCode": "SUMMER10"
}
```

**Response:**

```json
{
  "items": [...],
  "breakdown": {
    "subtotal": 1000000,
    "discount": { "couponCode": "SUMMER10", "amount": 100000 },
    "shipping": { "method": "standard", "fee": 30000 },
    "tax": { "rate": 0.1, "amount": 90000 },
    "totalAmount": 1020000
  },
  "warnings": ["item X giá đã tăng từ 100 lên 120"]
}
```

---

## ✅ Acceptance Criteria

**AC-1: Decimal precision (không floating point)**

- **Given** 3 item `0.10` mỗi cái
- **When** tính subtotal
- **Then** `subtotal = 0.30` exact (không phải `0.30000000000000004`)

**AC-2: Discount apply trên subtotal, không trên shipping**

- **Given** subtotal=1000, coupon 10%, shippingFee=100
- **When** calculate
- **Then** `discount = 100` (chỉ trên 1000), không phải 110

**AC-3: totalAmount không âm**

- **Given** subtotal=100, coupon `FREE100` (fixed 100), shipping=30, tax=0
- **When** calculate
- **Then** `discount` được cap tại `subtotal` → `totalAmount = 30` (≥ 0)

**AC-4: Unavailable items bị loại khỏi calculation**

- **Given** Cart có 3 item, 1 item `unavailable=true`
- **When** calculate
- **Then** subtotal chỉ tính 2 item; warnings có entry về item bị skip

**AC-5: Idempotent**

- **Given** cùng Cart + same params
- **When** gọi `/cart/calculate` 3 lần
- **Then** cả 3 response identical (giả sử Product giá không đổi giữa các call)

**AC-6: Warning khi giá thay đổi**

- **Given** CartItem `priceAtAdded=100`, Product hiện tại `price=120`
- **When** calculate
- **Then** `breakdown.subtotal` dùng giá hiện tại `120`; `warnings` chứa `"PRICE_CHANGED"` cho item đó

---

## 🚫 Out of Scope

- Multi-currency → Phase 3 TASK-326.
- Per-region tax rules → backlog (BRD §14 open).
- Loyalty points redemption → Phase 3 TASK-303.
