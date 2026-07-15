# Checklist — Task TASK-222: Order Lifecycle Event Handling (MVP scope, xem Scope note trong task file)

**Branch:** feat/order/order-lifecycle-notifications
**Started:** 2026-07-15

## Steps

- [ ] Step 1: Tạo `NotificationModule` skeleton (`src/modules/notification/notification.module.ts`), đăng ký vào `app.module.ts`
- [ ] Step 2: Tạo `OrderNotificationListener` (provider trong `NotificationModule`) với 5 method `@OnEvent('order.paid'|'shipped'|'delivered'|'cancelled'|'refunded')`, mỗi method query lại Order+User qua `PrismaService`, log qua `Logger` (không `console.log` — CONVENTIONS.md §Logger)
- [ ] Step 3: Verify cả 5 event trigger đúng log line (order number, email, trạng thái mới)
- [ ] Step 4: Verify listener throw lỗi (giả lập Order/User không tìm thấy) không làm crash request gốc — `@OnEvent` mặc định `suppressErrors: true`

## Acceptance criteria

- [ ] AC-1: Mỗi 1 trong 5 event → `NotificationListener` query lại Order+User, log 1 dòng chứa order number, email, trạng thái mới
- [ ] AC-2: Listener throw lỗi → không crash request gốc, response vẫn trả bình thường cho client

## Verification evidence

- [ ] AC-1 — evidence:
- [ ] AC-2 — evidence:

## Ship

- [ ] git add + commit
- [ ] git push
- [ ] PR opened

## Notes

- Scope thu hẹp qua phiên `/grill-with-docs` 2026-07-15 — xem "Scope note" đầu file `05-order-events.md` và [ADR-0003](../../../adr/0003-notification-listener-at-most-once.md). Bỏ Inventory/Analytics/Shipping listener, bỏ event `order.force-status-changed`, bỏ Retry Logic scenario, bỏ idempotency guard — lý do chi tiết nằm trong Scope note + ADR.
