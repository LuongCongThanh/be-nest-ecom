# Task E-02 — Ship: UAT + Release v1.0.0

**Phase**: E — Verification  
**Ước lượng**: 3 giờ  
**Phụ thuộc**: Task E-01  

---

## Nhiệm vụ

Manual UAT checklist, cập nhật README, tạo CHANGELOG, tag release v1.0.0.

---

## Manual UAT Checklist

Chạy toàn bộ flow này một lần từ đầu đến cuối:

### Flow 1 — Happy Path
- [ ] Register user mới → nhận email verify
- [ ] Login → nhận tokens
- [ ] Browse products → tìm kiếm theo tên
- [ ] Add 2-3 sản phẩm vào cart
- [ ] Xem cart → subtotal đúng
- [ ] Tạo order → order PENDING, stock bị trừ
- [ ] Thanh toán VNPay sandbox → order PAID
- [ ] Xem order list → thấy order PAID

### Flow 2 — Auth Security
- [ ] Login sai password → error message không tiết lộ email có tồn tại không
- [ ] Dùng access token hết hạn → 401 TOKEN_EXPIRED
- [ ] Dùng refresh token đã used → 401 REFRESH_TOKEN_REPLAY_DETECTED
- [ ] Đổi password → tokens cũ bị revoke

### Flow 3 — Business Rules
- [ ] Tạo order với sản phẩm hết stock → 400 INSUFFICIENT_STOCK
- [ ] Replay Idempotency-Key → trả cùng order
- [ ] Admin soft-delete product có order → 409 PRODUCT_HAS_ORDER_HISTORY
- [ ] Forgot password → reset → login với password mới

---

## Cập nhật README.md

Mở `README.md` ở root, cập nhật:

```markdown
# E-Commerce API

NestJS + Prisma + PostgreSQL + Redis

## Tech Stack
- NestJS 10 (TypeScript strict)
- Prisma ORM + PostgreSQL 16
- Redis (refresh token management)
- JWT (HS256, 30m access + 7d refresh)
- VNPay payment gateway

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup
\`\`\`bash
# Clone + install
npm install

# Start services
docker compose up -d

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run start:dev
\`\`\`

### API Documentation
Open http://localhost:3000/api for Swagger UI.

## Architecture
Domain-driven NestJS: `src/modules/{identity,catalog,cart,order,payment}/`

## Testing
\`\`\`bash
npm run test        # unit tests
npm run test:cov    # coverage
npm run test:e2e    # e2e tests
\`\`\`
```

---

## Tạo CHANGELOG.md

Tạo `CHANGELOG.md` ở root:

```markdown
# Changelog

## [1.0.0] - 2026-XX-XX

### Added
- User registration + login with JWT (HS256) + refresh token rotation
- Replay attack detection → kill token family
- Product catalog with categories (tree structure) + full-text search
- Shopping cart (guest + user, auto-merge on login)
- Order creation with stock management (atomic transaction)
- Order state machine with auto-cancel after 15 minutes
- VNPay payment integration with HMAC verification
- Global error handling with standardized response format
- Swagger/OpenAPI documentation at /api
- Account recovery (email verification + forgot password)
```

---

## Tag Release

```bash
# Đảm bảo lint + build pass
npm run lint
npm run build

# Commit final
git add -A
git commit -m "feat: MVP v1.0.0 - ecom backend complete"

# Tag
git tag -a v1.0.0 -m "MVP release"
```

---

## Ghi audit log vào STATUS.md

```
[YYYY-MM-DD HH:MM] [Phase E] [EXIT GATE — SHIP]
- ✅ Unit tests: service layer ≥ 60% coverage
- ✅ CartService.calculate() + OrderService.createOrder(): 100% branches
- ✅ E2E: happy path + edge cases pass
- ✅ Manual UAT: all flows verified
- ✅ npm run build pass, npm run lint pass
- ✅ README + CHANGELOG updated
- ✅ git tag v1.0.0
Signed-off: self · MVP SHIPPED 🚀
```

---

## DONE. Dự án hoàn thành.

Sau khi ship, có thể tiếp tục với **Phase F — Post-MVP** theo thứ tự ưu tiên:
1. `business/06-engagement/` — Coupons, Reviews, Wishlist
2. `setup/05-scale-infra/` — Caching, RBAC, CI/CD
3. `business/07-future/` — Loyalty, OAuth, Analytics
