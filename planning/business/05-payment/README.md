# 💳 Payment — Thanh toán

> Bounded context **Commerce / Payment**. Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md).

---

## 🎯 Mục đích

Tích hợp **provider thanh toán bên ngoài** (VNPay, Stripe, MoMo...) và đồng bộ trạng thái về Order. Đây là **edge** của hệ thống — nơi tiền chuyển động và nơi attacker target nhiều nhất.

---

## 📦 Key Entities

| Entity        | Định nghĩa                                                                  |
| :------------ | :-------------------------------------------------------------------------- |
| Payment       | Bản ghi giao dịch với provider: `orderId`, `provider`, `providerTxId`, `amount`, `status`, `rawCallback` (JSONB). |
| PaymentStatus | Enum `PENDING / SUCCESS / FAILED / REFUNDED`.                                |

---

## 🔌 Public API (high-level)

| Endpoint                                  | Vai trò                                         |
| :---------------------------------------- | :---------------------------------------------- |
| `POST   /payments/:provider/checkout/:orderId` | Tạo URL redirect tới provider              |
| `POST   /payments/:provider/webhook`      | Nhận callback từ provider (public, verify HMAC) |
| `GET    /payments/:orderId`               | Trạng thái payment của Order (auth)             |

---

## ⚖️ Key Invariants

1. **Webhook endpoint là public** (không cần auth) NHƯNG bắt buộc verify **chữ ký HMAC** từ provider. Sai chữ ký → log + `403`, không xử lý.
2. **Idempotent webhook**: cùng `providerTxId` gọi nhiều lần → kết quả như gọi 1 lần. Lưu `providerTxId UNIQUE`. Duplicate → trả `200` không update lại.
3. **Idempotent checkout init**: `POST /payments/:provider/checkout/:orderId` dùng header `Idempotency-Key` (xem [`CONTEXT.md`](../../docs/CONTEXT.md) — Idempotency Key). Cùng key 2 lần → trả URL redirect cũ, không tạo Payment mới.
4. **Stock ĐÃ trừ ở PENDING** (eager deduction tại `POST /orders` — xem [`../04-order/`](../04-order/README.md) invariant 6). Payment SUCCESS **CHỈ** đổi `Order.status PENDING → PAID` + emit `order.paid`, **KHÔNG trừ stock lần nữa**.
5. **Tất cả thao tác sau SUCCESS atomic** (cùng `prisma.$transaction`): update Payment status SUCCESS + đổi Order.status = PAID + emit `order.paid`. Lỗi giữa chừng → rollback Payment về FAILED, Order giữ PENDING.
6. **Payment FAILED** sau khi Order PENDING → KHÔNG tự hoàn stock. Đợi cleanup job 15 phút timeout (xem `PENDING Order Timeout` ở CONTEXT.md) hoặc user cancel thủ công.
7. **Không bao giờ log thông tin nhạy cảm** (số thẻ, CVV). Provider gửi `rawCallback` → lưu JSONB nhưng phải có redact filter (xem `CONVENTIONS.md §7.5`).
8. **Replay attack**: webhook đến với timestamp cũ quá ngưỡng (5 phút) → reject `403`.
9. **Refund flow tách**: MVP **manual** — chỉ set state REFUNDED + log "Manual VNPay refund needed for txId XXX". Admin xử lý refund qua VNPay portal. Phase 3 mới auto-call refund API.
10. **Money type**: `amount` lưu `BigInt` đơn vị đồng VND (xem [`CONTEXT.md`](../../docs/CONTEXT.md) — Money Type). Không bao giờ float.

---

## 📋 Tasks

| ID       | Topic                       | File                                                  |
| :------- | :-------------------------- | :---------------------------------------------------- |
| TASK-221 | Payment integration (VNPay) | [link](./01-payment.md)    |

---

## ⚠️ Security checklist (phải pass trước khi production)

- [ ] HMAC verify ở webhook.
- [ ] Idempotency key (`providerTxId`) DB-level UNIQUE constraint.
- [ ] Timestamp tolerance window 5 phút.
- [ ] Rate limit `/webhook` endpoint riêng (TASK-313).
- [ ] Không log payload có PII / card data.
- [ ] HTTPS bắt buộc (Helmet + reverse proxy).
- [ ] Audit log mọi state change của Payment.
