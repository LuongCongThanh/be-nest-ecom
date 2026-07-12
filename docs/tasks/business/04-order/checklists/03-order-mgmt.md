# Checklist — Task TASK-210: Order Management (Lifecycle Operations)

**Branch:** feat/order/order-management
**Started:** 2026-07-12

## Steps

- [x] Step 1: User scope — `GET /orders` (list own orders, filter by status, pagination) — QueryOrderDto, OrderService.findAllForUser, 3 test mới (AC-1 ownership, status filter, pagination), lint+tsc sạch
- [x] Step 2: User scope — `GET /orders/:id` (detail, 403 if not owner) — findOneForUser + test, verified via HTTP
- [x] Step 3: User scope — `POST /orders/:id/cancel` (self-cancel: PENDING or PAID within self-cancel window) — PENDING→CANCELLED, PAID within 30min→REFUNDED, else 409 INVALID_TRANSITION; verified via HTTP
- [x] Step 4: Admin scope — `GET /admin/orders` (list all, filter) + RBAC (ADMIN, STAFF) — verified via HTTP + 403 for USER role
- [x] Step 5: Admin scope — `POST /admin/orders/:id/pay` (PENDING → PAID) — sets paymentStatus=PAID too; verified via HTTP
- [x] Step 6: Admin scope — `POST /admin/orders/:id/ship` (PAID → SHIPPING, requires trackingNumber+carrier) — migration `20260712042437_add_order_tracking_and_state_log`; 422 TRACKING_REQUIRED verified via HTTP
- [x] Step 7: Admin scope — `POST /admin/orders/:id/deliver` (SHIPPING → DELIVERED) — sets deliveredAt; verified via HTTP
- [x] Step 8: Admin scope — `POST /admin/orders/:id/cancel` (force cancel + release stock, body: reason) — ADMIN only; test covers stock release + log
- [x] Step 9: Admin scope — `POST /admin/orders/:id/refund` (PAID/DELIVERED → REFUNDED, respects 7-day refund window) — partial rejected (422 PARTIAL_REFUND_NOT_SUPPORTED, MVP full-only); verified via HTTP
- [x] Step 10: Auto-cancel cron job — `@nestjs/schedule` + `@nestjs/event-emitter` installed, `@Cron(EVERY_5_MINUTES)` in OrderService.autoCancelExpiredPendingOrders, unit-tested (real cron schedule not observed live — logic verified directly)
- [x] Step 11: `OrderStateChangeLog` Prisma model + migration (orderId, fromState, toState, changedBy, reason?, isForceOverride, createdAt) — same migration as step 6
- [x] Step 12: Admin scope — `PATCH /orders/:id/force-status` (bypass state machine, bắt buộc `reason`, log OrderStateChangeLog isForceOverride=true, chỉ ADMIN không cho STAFF) — verified via HTTP (DELIVERED→PAID bypass)

## Acceptance criteria

- [x] AC-1: User chỉ thấy orders của mình (GET /orders trả đúng scope, /orders/:otherId → 403) — test + HTTP verified
- [x] AC-2: User self-cancel ngoài self-cancel window → 409 INVALID_TRANSITION (window = 30 phút TRONG state PAID, không phải từ lúc đặt hàng — xem CONTEXT.md dòng "Self-Cancel Window") — unit test
- [x] AC-3: Cancel/Refund auto-release stock + tạo StockMovement RETURN (TASK-205) — unit test verifies stockQuantity + reuses ProductService.releaseStock
- [x] AC-4: Ship thiếu trackingNumber/carrier → 422 TRACKING_REQUIRED — unit test + HTTP verified
- [x] AC-5: Auto-cancel PENDING > 15 phút → CANCELLED, release stock, emit order.cancelled, reason=AUTO_TIMEOUT — unit test
- [x] AC-6: Refund quá 7 ngày sau DELIVERED → 409 REFUND_WINDOW_EXPIRED — unit test
- [x] AC-7 (bổ sung, từ CONTEXT.md + Phase C exit gate): force-status transition bất kỳ (kể cả invalid theo state machine thường) chỉ cần `reason`, tạo đúng 1 row OrderStateChangeLog với isForceOverride=true — unit test + HTTP verified

## Ship

- [ ] git add + commit
- [ ] git push
- [ ] PR opened

## Verification summary (2026-07-12)

- 37/37 Jest tests pass (`npx jest src/modules/order`), incl. 14 new lifecycle tests + 4 new util tests.
- `npx tsc --noEmit` clean, `npx eslint` clean on all touched files, `npm run build` pass.
- Manual smoke test via real HTTP against local dev server + Postgres/Redis/MinIO docker containers: full flow register→login→cart→checkout→list→detail→self-cancel (user token) and admin login→list→pay→ship (422 then success)→deliver→refund→force-status (admin token), plus RBAC 403 (USER on admin route) and ownership 403 (non-owner on GET /orders/:id). Swagger `/docs-json` confirms all 11 order-related paths registered.
- Auto-cancel cron (`@Cron(EVERY_5_MINUTES)`) verified by calling the handler method directly in a unit test (AC-5) — not observed running on its live 5-minute schedule.

## Notes

- Reused from TASK-111: `isValidOrderTransition`, `isWithinRefundWindow` in `src/modules/order/order-status.util.ts` (already unit-tested).
- Gaps to close before coding: exact self-cancel window value (README says 30 min, task file just points to CONTEXT.md — confirm), whether `OrderStateChangeLog` audit table (mentioned in README invariant #3 and Phase C exit-gate bullet) is in scope for this task or deferred.
- `docs/STATUS.md` tracker row was corrected 2026-07-12: was mismarked "🔵 In progress" with no code; actual state was "⏳ Not started" (0/6 endpoints, no cron installed).
