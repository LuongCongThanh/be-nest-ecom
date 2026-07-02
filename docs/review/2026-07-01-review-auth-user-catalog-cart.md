# Code Review Report — Auth, User, Catalog, Cart

**Date:** 2026-07-01  
**Reviewer:** Claude Code (automated two-axis review)  
**Fixed point:** `9dea3c2` (before shopping cart branch)  
**Scope:** `src/modules/auth`, `src/modules/user`, `src/modules/category`, `src/modules/product`, `src/modules/cart`

---

## Axis 1 — Standards

### Hard Violations

| # | File | Line | Issue |
|---|------|------|-------|
| ST-1 | `cart.controller.ts` | 13–14 | `type Req = Record<string, any>` and `type Res = Record<string, any>` shadow the `@Req()` / `@Res()` decorator symbols imported from `@nestjs/common` on line 1. The parameter decorators bind to the wrong symbols at runtime. |
| ST-2 | `cart.service.ts` | `mergeGuestCart` | No `$transaction` wrapper. The merge loop issues individual `findFirst` + `update`/`create` calls per guest item. A crash mid-loop leaves the cart in a partially-merged state. Also an unbounded N+1 query pattern. |
| ST-3 | `cart.controller.ts` | 5 | `@CurrentUser` decorator imported but never used — dead import. |
| ST-4 | `product.service.ts` | `serialize()` | `Number(product.price)` converts BigInt to JS Number, losing precision for values > 2^53. VND amounts in the millions are safe today but the pattern is fragile and inconsistent with the rest of the codebase which uses `.toString()`. |

### Judgement Calls

| # | File | Issue |
|---|------|-------|
| ST-5 | `cart.service.ts` | Four places use raw `HttpException(message, status)` instead of typed NestJS exceptions (`ConflictException`, `NotFoundException`, etc.), inconsistent with every other module. |
| ST-6 | `product.service.ts` | `serialize(product: any): any` discards Prisma's generated type information. All other services use typed Prisma payloads. |
| ST-7 | `user.controller.ts`, `product.controller.ts` | Several endpoints missing `@ApiResponse` decorators — Swagger docs incomplete and inconsistent with `auth.controller.ts` and `category.controller.ts`. |
| ST-8 | `user.service.ts` | `findAll` hardcodes `isActive: true`, silently hiding suspended (inactive but not deleted) accounts from the admin list. |

---

## Axis 2 — Spec Compliance

### Cart (TASK-207)

| # | Verdict | Spec Reference | Detail |
|---|---------|---------------|--------|
| SP-C1 | **Wrong** | AC-4 | `updateItem` throws `409 PRODUCT_UNAVAILABLE` for soft-deleted products. Spec says deleted products stay in cart with `unavailable: true` — user must still be able to reduce quantity or remove via PATCH. |
| SP-C2 | **Wrong** | AC-3 | `mergeGuestCart` caps merged quantity to `product.stockQuantity`. Spec says "cộng dồn quantity" — the stock cap belongs in the pre-check on add/update, not at merge time. |
| SP-C3 | **Ambiguous** | — | On merge into an existing user cart item, `priceAtAdded` is not recalculated. The merged item may retain the guest's stale price, causing a false `priceChanged` flag. |

### Category (TASK-201, TASK-202)

| # | Verdict | Spec Reference | Detail |
|---|---------|---------------|--------|
| SP-CA1 | **Wrong** | TASK-201 AC-2 | `PATCH /:id` with a new `name` and no `slug` field: implementation explicitly does NOT regenerate slug. Spec requires auto-update and `slugChanged: true` in response. |
| SP-CA2 | **Wrong** | TASK-202 AC-5 | `buildTree` spreads the full `Category` row (`{ ...c, children }`). Spec says tree nodes must contain only `{ id, name, slug, image, sortOrder, children }`. |
| SP-CA3 | **Wrong** | TASK-202 AC-2 | `isActive` inheritance not enforced: an active child under an inactive parent can still appear in the tree. Spec says the entire subtree must be excluded. |
| SP-CA4 | **Missing** | TASK-202 §Query | `depth` and `rootId` query params for the tree endpoint not implemented. |

### User (TASK-118, TASK-120)

| # | Verdict | Spec Reference | Detail |
|---|---------|---------------|--------|
| SP-U1 | **Wrong** | TASK-120 AC-1 | `changePassword` returns HTTP 400 for wrong current password; spec requires HTTP 401 with code `INVALID_CURRENT_PASSWORD`. |
| SP-U2 | **Missing** | TASK-120 steps 4–5 | `confirmPassword` field and `422 CONFIRM_MISMATCH` check absent. Password reuse check (`422 PASSWORD_REUSE`) absent. |
| SP-U3 | **Missing** | TASK-118 | Admin user endpoints entirely absent: `GET /admin/users/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/reactivate`, `PATCH /admin/users/:id/role`. |
| SP-U4 | **Missing** | TASK-118 | `softDelete` does not anonymize email to `deleted_<uuid>@anonymized.local`. |
| SP-U5 | **Missing** | TASK-118 | `GET /users` (admin list) has no pagination or filter params (role, isActive). |

### Product (TASK-203, TASK-204, TASK-205)

| # | Verdict | Spec Reference | Detail |
|---|---------|---------------|--------|
| SP-P1 | **Wrong** | TASK-203, TASK-205 | All admin product and stock routes use `/products/...` prefix instead of `/admin/products/...`. Breaking API contract. |
| SP-P2 | **Wrong** | TASK-204 | Search param named `search` in code; spec defines `q`. `q` must also search `description` and `sku`, not just `name`. |
| SP-P3 | **Wrong** | TASK-203 | `findOne` (public) includes `isActive: true` in where clause — admin viewing a draft/inactive product gets 404. |
| SP-P4 | **Missing** | TASK-203 AC-1 | `POST /admin/products/:id/publish` and `POST /admin/products/:id/unpublish` endpoints do not exist. |
| SP-P5 | **Missing** | TASK-203 AC-4 | `softDelete` does not check for existing `OrderItem`s; spec requires `409 PRODUCT_HAS_ORDER_HISTORY`. |
| SP-P6 | **Missing** | TASK-205 AC-6 | `commitStock` does not emit `inventory.low_stock` when stock drops to `lowStockThreshold`. |
| SP-P7 | **Missing** | TASK-206 AC-5 | `softDelete` does not emit `product.assets.cleanup` event. |

### Auth (TASK-116, TASK-123, TASK-114)

| # | Verdict | Spec Reference | Detail |
|---|---------|---------------|--------|
| SP-A1 | **Missing** | TASK-116 step 5 | Welcome email not dispatched after registration (TASK-124 deferred — low priority). |
| SP-A2 | **Missing** | TASK-123 §3 | 5-second RT replay tolerance window absent. `replacedByTokenId` field also missing from schema. Any replay unconditionally kills the family. |
| SP-A3 | **Missing** | TASK-114 §2 | `JwtStrategy` does not set `clockTolerance: 30` for the 30-second clock skew allowance. |

---

## Action Plan

### Group A — Fix before Order Creation (correctness bugs in recently shipped code)

| Ref | Fix |
|-----|-----|
| ST-1 | Replace `type Req/Res` aliases with Express types or rename to avoid shadowing |
| ST-2 | Wrap `mergeGuestCart` in `prisma.$transaction`; batch product lookups |
| ST-3 | Remove unused `@CurrentUser` import from `cart.controller.ts` |
| ST-4 | Replace `Number(price)` with `.toString()` in `product.service.ts` `serialize()` |
| SP-C1 | Allow `updateItem` on unavailable products (only block quantity _increase_ above stock) |
| SP-C2 | Remove stock cap from `mergeGuestCart` — let post-merge add/update handle stock validation |

### Group B — Separate task (scope of unimplemented tasks)

- SP-U3 (admin user endpoints), SP-P4 (publish/unpublish), SP-A1 (email dispatch)

### Group C — Systemic refactor (own PR)

- SP-P1: `/admin` route prefix across all admin modules (breaking change)

### Group D — Quick fixes on merged code (next maintenance PR)

- SP-CA1: Category slug auto-regen on name PATCH + `slugChanged` flag
- SP-CA2: Tree node shape — expose only spec-required fields
- SP-CA3: `isActive` subtree inheritance in `getTree`
- SP-U1: `changePassword` HTTP 400 → 401
- SP-P2: `search` param → `q`, extend to `description` + `sku`
- SP-P3: `findOne` — separate public vs admin lookup logic

---

*Generated by `/review` skill — two-axis review (Standards + Spec).*
