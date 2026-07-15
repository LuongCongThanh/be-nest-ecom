# Notification listener accepts at-most-once delivery (no durable queue)

**Status**: accepted (2026-07-15)

TASK-222 (Order Lifecycle Event Orchestration) originally called for 4 listeners (Notification, Inventory, Analytics, Shipping) on the `order.*` events already emitted by `OrderService.transitionOrder` (TASK-210), plus a "Retry Logic" scenario assuming a persisted backlog that resumes processing after a listener outage. We scoped TASK-222 MVP down to **one listener: Notification**, implemented as a structured-log placeholder (no real email send — that's TASK-124/Phase D, not yet built). Inventory is dropped because stock release already happens synchronously inside the same DB transaction in `transitionOrder`. Analytics is dropped because audit already happens synchronously via `OrderStateChangeLog`, and order stats (TASK-211) re-derive directly from the `Order`/`OrderItem` tables by design (no denormalized store to update). Shipping is dropped because no shipment/logistics module exists yet.

We also decided to accept **at-most-once** delivery for the Notification listener rather than build a durable queue. `app.module.ts` wires `EventEmitterModule.forRoot()` — an in-memory, fire-and-forget `EventEmitter2` with no persistence (the repo has `ioredis` for auth, but no BullMQ or other durable queue). `@OnEvent()`'s default `suppressErrors: true` means a throwing listener won't crash the emitter or other listeners, but the event itself is not retried or replayed — if the listener throws, or the process crashes between the Order transaction commit and listener execution, that notification is lost permanently.

**Why**: Notification is a non-critical side-effect (an email notice, not yet even real), not a financial or inventory operation — those already commit synchronously and don't depend on this event bus. Building a durable queue now, before there's a real failure-rate problem or a real email being sent, is premature infrastructure; TASK-124 (Phase D) itself defers "queue + retry infrastructure" as out of scope.

**Consequences**:

- The "Retry Logic" TDD scenario in TASK-222's original spec does not apply to `EventEmitter2` and is dropped from this task's acceptance criteria.
- If the business later needs guaranteed notification delivery, that requires introducing a real queue (e.g. BullMQ on the existing Redis instance) as its own deliberate piece of work — not something `EventEmitter2` grows into.
- A crash or listener exception silently drops the notification with no dead-letter queue or replay tool in MVP.
