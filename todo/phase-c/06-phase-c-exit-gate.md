# Task C-06 — Phase C Exit Gate

**Phase**: C — Core MVP  
**Ước lượng**: 2 giờ  

---

## Nhiệm vụ

Test thủ công full flow end-to-end trước khi chuyển Phase D.

---

## Full Flow Test (làm tuần tự)

- [ ] **Register** → `POST /auth/register` → nhận tokens
- [ ] **Browse products** → `GET /products?search=iphone` → thấy danh sách
- [ ] **Add to cart** → `POST /cart/items` → cart có items
- [ ] **View cart** → `GET /cart` → thấy subtotal đúng
- [ ] **Create order** → `POST /orders` với `Idempotency-Key` → order PENDING, stock bị trừ
- [ ] **Pay** → `POST /payments/vnpay/create` → lấy URL → thanh toán sandbox → order PENDING → PAID
- [ ] **View order** → `GET /orders` → thấy order với status PAID

## Các edge cases cần test

- [ ] Đặt hàng sản phẩm hết stock → `400 INSUFFICIENT_STOCK`
- [ ] Replay Idempotency-Key → trả cùng order, không tạo mới
- [ ] Replay VNPay webhook → không xử lý 2 lần (idempotent)
- [ ] Order pending > 15 phút → cron job tự cancel + hoàn stock

## Code Quality
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — thành công

---

## Ghi audit log vào STATUS.md

```
[YYYY-MM-DD HH:MM] [Phase C] [EXIT GATE]
- ✅ Full flow: register → browse → cart → order → pay
- ✅ Idempotency, stock management, VNPay webhook
- ✅ Cleanup job cancel expired orders
Signed-off: self · Next: Phase D open.
```

---

## Xong thì làm gì?

Phase C DONE. MVP demo-able. Chuyển sang **phase-d/** — Polish.

→ [../phase-d/01-error-logging.md](../phase-d/01-error-logging.md)
