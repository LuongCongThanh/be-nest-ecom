# COD-only payment for MVP; defer online gateway integration

**Status**: accepted (2026-07-05)

Phase C Exit Gate originally required a real online gateway integration (TASK-221, VNPay: HMAC webhook verify, idempotent `providerTxId`, `PENDING → PAID` via webhook). We decided to ship the MVP with **Cash on Delivery (COD) only**: `Order.paymentProvider = "cod"`, `paymentStatus` stays `UNPAID` until an Admin manually confirms via `POST /admin/orders/:id/pay` (TASK-210, Order Management). TASK-221 (VNPay or any other online gateway) moves to the Phase F backlog.

**Why**: reaching a demoable MVP (register → browse → cart → checkout → pay) matters more right now than learning webhook signature verification, which TASK-221 exists to teach. COD needs no external provider, no webhook, no signature scheme, and no new `Payment` table — it reuses the `paymentProvider`/`paymentStatus`/`paymentRef` fields already on `Order`.

**Consequences**:

- The separate `Payment` table design (provider record with `providerTxId` UNIQUE, `rawCallback` JSONB, its own status enum) discussed for TASK-221 is **not built now** — it's deferred until VNPay/online-gateway work actually resumes, since COD has no callback to record.
- Phase C Exit Gate wording is updated: the "VNPay IPN/return verify HMAC" criterion is replaced by "Admin confirms COD payment via `POST /admin/orders/:id/pay` → Order `PENDING → PAID` atomic".
- Nothing about the `Order` schema needs to change to add a real gateway later — `paymentProvider` is already a free-form string, `paymentStatus`/`paymentRef` are already generic.
