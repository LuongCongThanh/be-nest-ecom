# 💳 Payment — Thanh toán

> Bounded context **Commerce / Payment**. Glossary: [`../../CONTEXT.md`](../../CONTEXT.md).

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
2. **Idempotent**: cùng `providerTxId` gọi nhiều lần → kết quả như gọi 1 lần. Lưu `providerTxId UNIQUE`. Duplicate → trả `200` không update lại.
3. **Trừ stock & đổi state Order CHỈ ở callback SUCCESS** — không đoán trước từ checkout endpoint. Tránh oversell + race.
4. **Tất cả thao tác sau SUCCESS phải atomic**: update Payment + trừ stock + đổi Order state + emit `order.paid`. Lỗi giữa chừng → rollback Payment cũng phải `FAILED`.
5. **Không bao giờ log thông tin nhạy cảm** (số thẻ, CVV). Provider gửi `rawCallback` → lưu JSONB nhưng phải có filter trước khi log.
6. **Replay attack**: webhook đến với timestamp cũ quá ngưỡng (ví dụ 5 phút) → reject.
7. **Refund**: tách flow riêng — không trigger từ webhook của giao dịch gốc.

---

## 📋 Tasks

| ID       | Topic                       | File                                                  |
| :------- | :-------------------------- | :---------------------------------------------------- |
| TASK-221 | Payment integration (VNPay) | [link](./TASK-221-payment.md)    |

---

## ⚠️ Security checklist (phải pass trước khi production)

- [ ] HMAC verify ở webhook.
- [ ] Idempotency key (`providerTxId`) DB-level UNIQUE constraint.
- [ ] Timestamp tolerance window 5 phút.
- [ ] Rate limit `/webhook` endpoint riêng (TASK-313).
- [ ] Không log payload có PII / card data.
- [ ] HTTPS bắt buộc (Helmet + reverse proxy).
- [ ] Audit log mọi state change của Payment.
