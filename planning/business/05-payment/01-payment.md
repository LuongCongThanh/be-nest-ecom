# TASK-221: Payment Integration

## 📋 Metadata

- **Task ID**: TASK-221
- **Độ ưu tiên**: 🔴 KHẨN CẤP (Financial Integrity)
- **Phụ thuộc**: TASK-209 (Order Creation), TASK-222 (Lifecycle Events)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Tích hợp ≥ 1 payment provider end-to-end (Phase 2 mục tiêu: **VNPay** cho thị trường VN; **COD** đơn giản; Stripe optional).

- **PCI compliance**: server KHÔNG bao giờ nhận PAN/CVV. Mọi dữ liệu thẻ qua iframe/SDK của provider.
- **Webhook signature verify**: tuyệt đối không trust webhook chưa verify signature.
- **Idempotent webhook**: 1 webhook chạy nhiều lần KHÔNG được làm Order chuyển trạng thái sai (ví dụ trừ stock 2 lần).
- **Reconciliation daily**: cron đối soát số tiền `paymentRef` từ provider vs `Order.totalAmount`.

---

## 📄 Provider Abstraction

```
interface PaymentProvider {
  initiate(order): { redirectUrl | clientToken, providerRef }
  verifyWebhook(rawBody, signature): boolean
  parseEvent(payload): { providerRef, status, amount }
  refund(providerRef, amount): RefundResult
}
```

### Endpoints

| Endpoint | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/payment/:provider/initiate` | POST | User | Sinh redirectUrl / token cho client |
| `/payment/:provider/webhook` | POST | Provider signature | Receive provider callback |
| `/orders/:id/payment-status` | GET | Owner | Poll status (fallback nếu webhook trễ) |
| `/admin/orders/:id/refund` | POST | ADMIN | Refund full/partial |

### Webhook flow

1. Provider POST → verify signature (raw body) → reject ngay nếu sai.
2. Lookup Order theo `providerRef`.
3. Idempotency check: nếu `Order.paymentStatus` đã = `PAID` → skip side-effects, return 200.
4. Update Order `paymentStatus=PAID, status=PAID`.
5. Emit event `order.paid` (TASK-222).
6. Return 200 (provider sẽ retry nếu non-200).

---

## ✅ Acceptance Criteria

**AC-1: Webhook signature invalid bị reject**
- **Given** POST `/payment/vnpay/webhook` với signature giả
- **When** xử lý
- **Then** `401 INVALID_SIGNATURE`; Order không đổi; log warning cho security

**AC-2: Webhook idempotent**
- **Given** Order đã `PAID`; provider retry webhook cùng `providerRef`
- **When** webhook đến lần 2
- **Then** response `200`; KHÔNG emit `order.paid` lần 2; stock không bị trừ 2 lần

**AC-3: Server không nhận card data**
- **Given** Audit code paths của Order/Payment
- **When** grep search keywords (`cardNumber`, `cvv`, `panNumber`)
- **Then** không tìm thấy field nào lưu dữ liệu thẻ trong DB hoặc log

**AC-4: Amount mismatch reject**
- **Given** Order `totalAmount = 100,000`; webhook báo `amount = 90,000`
- **When** xử lý
- **Then** Order **không** đổi sang PAID; flag `PAYMENT_AMOUNT_MISMATCH` để Admin review; alert Slack/email

**AC-5: COD flow đơn giản**
- **Given** Customer chọn provider `cod`
- **When** POST `/orders` với `paymentProvider=cod`
- **Then** Order tạo với `paymentStatus=UNPAID, status=PENDING`; không gọi external; Admin xác nhận thanh toán sau khi giao (TASK-210 `/admin/orders/:id/pay`)

**AC-6: Refund cập nhật cả Order và Stock**
- **Given** Order PAID với 2 item
- **When** Admin refund full
- **Then** provider `refund()` thành công → Order chuyển REFUNDED → Stock restore (TASK-205) → event `order.refunded` emit

**AC-7: Daily reconciliation flag mismatch**
- **Given** Cuối ngày, provider báo total settled = 10M VND; sum local PAID Orders = 9.8M
- **When** reconciliation job chạy
- **Then** alert log + email Admin với danh sách Order khả nghi

---

## 🚫 Out of Scope

- Saved payment methods (tokenization) → backlog (cần PCI level 1).
- Recurring/subscription → backlog.
- Multi-provider routing logic → Phase 3.
- Currency conversion → Phase 3 TASK-326.
