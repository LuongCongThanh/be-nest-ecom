# Checklist — Task TASK-210: Order Management (Lifecycle Operations)

**Branch:** feat/order/order-management
**Started:** 2026-07-12

## Steps

- [ ] Step 1: User scope — `GET /orders` (list own orders, filter by status, pagination)
- [ ] Step 2: User scope — `GET /orders/:id` (detail, 403 if not owner)
- [ ] Step 3: User scope — `POST /orders/:id/cancel` (self-cancel: PENDING or PAID within self-cancel window)
- [ ] Step 4: Admin scope — `GET /admin/orders` (list all, filter) + RBAC (ADMIN, STAFF)
- [ ] Step 5: Admin scope — `POST /admin/orders/:id/pay` (PENDING → PAID)
- [ ] Step 6: Admin scope — `POST /admin/orders/:id/ship` (PAID → SHIPPING, requires trackingNumber+carrier) — needs Order schema fields + migration
- [ ] Step 7: Admin scope — `POST /admin/orders/:id/deliver` (SHIPPING → DELIVERED)
- [ ] Step 8: Admin scope — `POST /admin/orders/:id/cancel` (force cancel + release stock, body: reason)
- [ ] Step 9: Admin scope — `POST /admin/orders/:id/refund` (PAID/DELIVERED → REFUNDED, respects 7-day refund window)
- [ ] Step 10: Auto-cancel cron job — install `@nestjs/schedule`, scan PENDING > 15 min every 5 min, release stock, emit event
- [ ] Step 11: `OrderStateChangeLog` Prisma model + migration (orderId, fromState, toState, changedBy, reason?, isForceOverride, createdAt) — gộp thêm từ Phase C exit gate + CONTEXT.md, không nằm trong bảng endpoint gốc của file task
- [ ] Step 12: Admin scope — `PATCH /orders/:id/force-status` (bypass state machine, bắt buộc `reason`, log OrderStateChangeLog isForceOverride=true, chỉ ADMIN không cho STAFF)

## Acceptance criteria

- [ ] AC-1: User chỉ thấy orders của mình (GET /orders trả đúng scope, /orders/:otherId → 403)
- [ ] AC-2: User self-cancel ngoài self-cancel window → 409 INVALID_TRANSITION (window = 30 phút TRONG state PAID, không phải từ lúc đặt hàng — xem CONTEXT.md dòng "Self-Cancel Window")
- [ ] AC-3: Cancel/Refund auto-release stock + tạo StockMovement RETURN (TASK-205)
- [ ] AC-4: Ship thiếu trackingNumber/carrier → 422 TRACKING_REQUIRED
- [ ] AC-5: Auto-cancel PENDING > 15 phút → CANCELLED, release stock, emit order.cancelled, reason=AUTO_TIMEOUT
- [ ] AC-6: Refund quá 7 ngày sau DELIVERED → 409 REFUND_WINDOW_EXPIRED
- [ ] AC-7 (bổ sung, từ CONTEXT.md + Phase C exit gate): force-status transition bất kỳ (kể cả invalid theo state machine thường) chỉ cần `reason`, tạo đúng 1 row OrderStateChangeLog với isForceOverride=true

## Ship

- [ ] git add + commit
- [ ] git push
- [ ] PR opened

## Notes

- Reused from TASK-111: `isValidOrderTransition`, `isWithinRefundWindow` in `src/modules/order/order-status.util.ts` (already unit-tested).
- Gaps to close before coding: exact self-cancel window value (README says 30 min, task file just points to CONTEXT.md — confirm), whether `OrderStateChangeLog` audit table (mentioned in README invariant #3 and Phase C exit-gate bullet) is in scope for this task or deferred.
- `docs/STATUS.md` tracker row was corrected 2026-07-12: was mismarked "🔵 In progress" with no code; actual state was "⏳ Not started" (0/6 endpoints, no cron installed).
