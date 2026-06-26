# 📑 Master Task Index

> 📜 Glossary: [`/CONTEXT.md`](../../CONTEXT.md) · Convention: [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md) · Roadmap self-learn: [`../ROADMAP.md`](../ROADMAP.md)

File này dùng để **tra task/spec gốc** trong `docs/tasks/`.

- Muốn **tra cứu theo domain / task ID / tài liệu gốc** → dùng file này
- Muốn **biết task nào tiếp theo** → mở [`../STATUS.md`](../STATUS.md)

Tài liệu chia 2 nhánh:

- **`setup/`** — hạ tầng, công cụ, quy ước (HOW)
- **`business/`** — domain, feature (WHAT)

---

## 🛠️ Setup (Infrastructure & Conventions)

### `setup/01-project/` — Khởi tạo

| Task     | Mô tả                     | Link                         |
| :------- | :------------------------ | :--------------------------- |
| TASK-101 | Khởi tạo Project NestJS   | [01-bootstrap-nestjs.md](../setup/01-project/01-bootstrap-nestjs.md) |
| TASK-102 | Environment Configuration | [02-env-config.md](../setup/01-project/02-env-config.md) |

### `setup/02-database/` — DB & Migration

| Task     | Mô tả                       | Link                          |
| :------- | :-------------------------- | :---------------------------- |
| TASK-103 | Setup PostgreSQL            | [01-postgres-setup.md](../setup/02-database/01-postgres-setup.md) |
| TASK-104 | Kết nối NestJS ↔ PostgreSQL | [02-connect-postgres.md](../setup/02-database/02-connect-postgres.md) |
| TASK-106 | Database Schema Strategy    | [03-schema-strategy.md](../setup/02-database/03-schema-strategy.md) |
| TASK-112 | Generate & Run Migrations   | [04-run-migrations.md](../setup/02-database/04-run-migrations.md) |
| TASK-113 | Migration Best Practices    | [05-migration-strategy.md](../setup/02-database/05-migration-strategy.md) |

### `setup/03-conventions/` — Convention & Mechanism

| Task     | Mô tả                              | Link                             |
| :------- | :--------------------------------- | :------------------------------- |
| TASK-105 | Global Validation & Error Handling | [03-validation-error.md](../setup/03-conventions/03-validation-error.md) |
| TASK-117 | Guards & Decorators                | [04-guards-decorators.md](../setup/03-conventions/04-guards-decorators.md) |
| TASK-121 | README Convention                  | [05-readme-convention.md](../setup/03-conventions/05-readme-convention.md) |
| TASK-122 | Shared Base Classes & Utilities    | [01-base-classes.md](../setup/03-conventions/01-base-classes.md) |
| TASK-125 | Seed Data & Demo Mode              | [02-seed-data.md](../setup/03-conventions/02-seed-data.md) |

### `setup/04-cross-cutting/` — Middleware

| Task     | Mô tả                          | Link                               |
| :------- | :----------------------------- | :--------------------------------- |
| TASK-212 | Global Error Handling (Filter) | [01-error-filter.md](../setup/04-cross-cutting/01-error-filter.md) |
| TASK-213 | Request Logging Interceptor    | [02-logging.md](../setup/04-cross-cutting/02-logging.md) |
| TASK-214 | Response Transform Interceptor | [03-response-transform.md](../setup/04-cross-cutting/03-response-transform.md) |
| TASK-215 | Swagger / OpenAPI              | [04-swagger.md](../setup/04-cross-cutting/04-swagger.md) |
| TASK-223 | File Upload Service            | [05-file-upload.md](../setup/04-cross-cutting/05-file-upload.md) |

### `setup/05-scale-infra/` — Post-MVP Infrastructure

| Task     | Mô tả                            | Link                             |
| :------- | :------------------------------- | :------------------------------- |
| TASK-301 | Unit Tests                       | [01-unit-tests.md](../setup/05-scale-infra/01-unit-tests.md) |
| TASK-302 | E2E Tests                        | [02-e2e-tests.md](../setup/05-scale-infra/02-e2e-tests.md) |
| TASK-304 | Database Optimization            | [09-db-optimization.md](../setup/05-scale-infra/09-db-optimization.md) |
| TASK-306 | Add Caching                      | [10-caching.md](../setup/05-scale-infra/10-caching.md) |
| TASK-307 | Security Enhancements            | [04-security.md](../setup/05-scale-infra/04-security.md) |
| TASK-308 | Setup CI/CD                      | [06-cicd.md](../setup/05-scale-infra/06-cicd.md) |
| TASK-309 | Production Deployment            | [07-prod-deploy.md](../setup/05-scale-infra/07-prod-deploy.md) |
| TASK-310 | Clean Architecture Boundaries    | [11-clean-arch.md](../setup/05-scale-infra/11-clean-arch.md) |
| TASK-311 | Advanced Caching Strategy        | [12-caching-advanced.md](../setup/05-scale-infra/12-caching-advanced.md) |
| TASK-312 | Logging, Monitoring, Tracing     | [08-observability.md](../setup/05-scale-infra/08-observability.md) |
| TASK-313 | Rate Limiting & Abuse Protection | [03-rate-limit.md](../setup/05-scale-infra/03-rate-limit.md) |
| TASK-314 | API Versioning                   | [13-api-versioning.md](../setup/05-scale-infra/13-api-versioning.md) |
| TASK-315 | Feature Flags                    | [14-feature-flags.md](../setup/05-scale-infra/14-feature-flags.md) |
| TASK-316 | Elasticsearch Integration        | [15-elasticsearch.md](../setup/05-scale-infra/15-elasticsearch.md) |
| TASK-320 | RBAC                             | [05-rbac.md](../setup/05-scale-infra/05-rbac.md) |
| TASK-321 | Docker & Kubernetes              | [16-docker-k8s.md](../setup/05-scale-infra/16-docker-k8s.md) |

---

## 🛒 Business (Domain Features)

### `business/01-identity/` — Người dùng & Auth

> 📜 Charter: [`../business/01-identity/CHARTER.md`](../business/01-identity/CHARTER.md)

| Task     | Mô tả                            | Link                             |
| :------- | :------------------------------- | :------------------------------- |
| TASK-107 | User Entity                      | [01-user-entity.md](../business/01-identity/01-user-entity.md) |
| TASK-114 | JWT Authentication               | [02-jwt-auth.md](../business/01-identity/02-jwt-auth.md) |
| TASK-115 | Auth DTOs                        | [03-auth-dtos.md](../business/01-identity/03-auth-dtos.md) |
| TASK-116 | Register & Login                 | [04-register-login.md](../business/01-identity/04-register-login.md) |
| TASK-118 | Users CRUD                       | [05-users-crud.md](../business/01-identity/05-users-crud.md) |
| TASK-119 | User Profile                     | [06-user-profile.md](../business/01-identity/06-user-profile.md) |
| TASK-120 | Change Password                  | [07-change-password.md](../business/01-identity/07-change-password.md) |
| TASK-123 | Refresh Token & Session          | [08-refresh-token.md](../business/01-identity/08-refresh-token.md) |
| TASK-124 | Email Verify & Password Recovery | [09-account-recovery.md](../business/01-identity/09-account-recovery.md) |

### `business/02-catalog/` — Sản phẩm & Danh mục

| Task     | Mô tả                         | Link                            |
| :------- | :---------------------------- | :------------------------------ |
| TASK-108 | Category Entity               | [01-category-entity.md](../business/02-catalog/01-category-entity.md) |
| TASK-109 | Product Entity                | [02-product-entity.md](../business/02-catalog/02-product-entity.md) |
| TASK-201 | Categories CRUD               | [03-categories-crud.md](../business/02-catalog/03-categories-crud.md) |
| TASK-202 | Category Tree & Filtering     | [05-category-tree.md](../business/02-catalog/05-category-tree.md) |
| TASK-203 | Products CRUD                 | [04-products-crud.md](../business/02-catalog/04-products-crud.md) |
| TASK-204 | Product Filtering & Search    | [06-products-search.md](../business/02-catalog/06-products-search.md) |
| TASK-205 | Product Stock Management      | [07-stock-management.md](../business/02-catalog/07-stock-management.md) |
| TASK-206 | Product Images & Upload       | [08-product-images.md](../business/02-catalog/08-product-images.md) |
| TASK-218 | Product Variants & Attributes | [09-product-variants.md](../business/02-catalog/09-product-variants.md) |

### `business/03-cart/` — Giỏ hàng

| Task     | Mô tả                    | Link                         |
| :------- | :----------------------- | :--------------------------- |
| TASK-110 | Cart & CartItem Entities | [01-cart-entities.md](../business/03-cart/01-cart-entities.md) |
| TASK-207 | Shopping Cart            | [02-shopping-cart.md](../business/03-cart/02-shopping-cart.md) |
| TASK-208 | Cart Calculations        | [03-cart-calc.md](../business/03-cart/03-cart-calc.md) |

### `business/04-order/` — Đơn hàng

| Task     | Mô tả                      | Link                          |
| :------- | :------------------------- | :---------------------------- |
| TASK-111 | Order & OrderItem Entities | [01-order-entities.md](../business/04-order/01-order-entities.md) |
| TASK-209 | Order Creation             | [02-order-creation.md](../business/04-order/02-order-creation.md) |
| TASK-210 | Order Management           | [03-order-mgmt.md](../business/04-order/03-order-mgmt.md) |
| TASK-211 | Order Statistics           | [05-order-stats.md](../business/04-order/05-order-stats.md) |
| TASK-222 | Order Lifecycle Events     | [04-order-events.md](../business/04-order/04-order-events.md) |

### `business/05-payment/` — Thanh toán

| Task     | Mô tả                       | Link                            |
| :------- | :-------------------------- | :------------------------------ |
| TASK-221 | Payment Integration (VNPay) | [01-payment.md](../business/05-payment/01-payment.md) |

### `business/06-engagement/` — Tương tác

| Task         | Mô tả                            | Link                               |
| :----------- | :------------------------------- | :--------------------------------- |
| TASK-217     | Q&A System                       | [06-qa.md](../business/06-engagement/06-qa.md) |
| TASK-219     | Reviews & Ratings                | [02-reviews.md](../business/06-engagement/02-reviews.md) |
| TASK-220     | Wishlist & Favorites             | [03-wishlist.md](../business/06-engagement/03-wishlist.md) |
| TASK-224     | Discount & Coupon                | [01-coupons.md](../business/06-engagement/01-coupons.md) |
| TASK-225     | Multiple Shipping Methods        | [05-shipping.md](../business/06-engagement/05-shipping.md) |
| TASK-226     | Inventory Alerts                 | [04-inventory-alerts.md](../business/06-engagement/04-inventory-alerts.md) |
| ~~TASK-216~~ | ⚠️ Deprecated — gộp vào TASK-219 | —                                  |

### `business/07-future/` — Post-MVP Features

| Task     | Mô tả                          | Link                           |
| :------- | :----------------------------- | :----------------------------- |
| TASK-303 | Loyalty/Membership             | [01-loyalty.md](../business/07-future/01-loyalty.md) |
| TASK-305 | AI Recommendation Engine       | [02-ai-recommendation.md](../business/07-future/02-ai-recommendation.md) |
| TASK-317 | Admin Dashboard Statistics     | [03-admin-dashboard.md](../business/07-future/03-admin-dashboard.md) |
| TASK-318 | Real-time Notifications (WS)   | [04-realtime-ws.md](../business/07-future/04-realtime-ws.md) |
| TASK-319 | Two-Factor Authentication      | [05-2fa.md](../business/07-future/05-2fa.md) |
| TASK-322 | GraphQL API                    | [06-graphql.md](../business/07-future/06-graphql.md) |
| TASK-323 | Microservices Architecture     | [07-microservices.md](../business/07-future/07-microservices.md) |
| TASK-324 | Message Queue (RabbitMQ/Kafka) | [08-message-queue.md](../business/07-future/08-message-queue.md) |
| TASK-325 | Multi-language (i18n)          | [09-i18n.md](../business/07-future/09-i18n.md) |
| TASK-326 | Multi-currency                 | [10-multi-currency.md](../business/07-future/10-multi-currency.md) |
| TASK-327 | OAuth Social Login             | [11-oauth.md](../business/07-future/11-oauth.md) |
| TASK-328 | Product Recommendations (ML)   | [12-ml-recommendation.md](../business/07-future/12-ml-recommendation.md) |
| TASK-329 | Analytics Dashboard            | [13-analytics.md](../business/07-future/13-analytics.md) |

---

**Tổng: 79 task active + 1 deprecated** (TASK-216 merged into TASK-219).

> Self-learn không làm toàn bộ 79 task. Theo `ROADMAP.md`: MVP ≈ 35 task chính, còn lại là backlog/cut.
