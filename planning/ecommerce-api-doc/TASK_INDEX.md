# E-commerce API: Master Task Index (Refined Phased Organization)

This roadmap organizes all 80 tasks into three sequentially numbered phases, plus a separate **Engineering Foundation** track for setup/convention/tooling tasks.

> 📜 Tài liệu khung: [`./01-Phase-1-Foundation/CHARTER.md`](./01-Phase-1-Foundation/CHARTER.md) · Glossary domain: [`./CONTEXT.md`](./CONTEXT.md)

---

## 🛠️ 00. Engineering Foundation (Setup · Convention · Tooling)

_Các task không phải nghiệp vụ — đã tách ra khỏi Phase 1 để giữ phase business tinh gọn._
Đặt tại [`../engineering/phase-1-foundation/`](../engineering/phase-1-foundation/README.md).

| Task ID  | Description                                | Link                                                                                                 |
| :------- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| TASK-101 | Khởi tạo Project NestJS                    | [TASK-101](../engineering/phase-1-foundation/TASK-101-Khởi-tạo-Project-NestJS.md)                    |
| TASK-102 | Setup Environment Configuration            | [TASK-102](../engineering/phase-1-foundation/TASK-102-Setup-Environment-Configuration.md)            |
| TASK-103 | Setup Database PostgreSQL                  | [TASK-103](../engineering/phase-1-foundation/TASK-103-Setup-Database-PostgreSQL.md)                  |
| TASK-104 | Kết nối NestJS với PostgreSQL              | [TASK-104](../engineering/phase-1-foundation/TASK-104-Kết-nối-NestJS-với-PostgreSQL.md)              |
| TASK-105 | Setup Global Validation & Error Handling   | [TASK-105](../engineering/phase-1-foundation/TASK-105-Setup-Global-Validation-Error-Handling.md)     |
| TASK-112 | Generate & Run Migrations                  | [TASK-112](../engineering/phase-1-foundation/TASK-112-Generate-Run-Migrations.md)                    |
| TASK-113 | Migration Best Practices Strategy          | [TASK-113](../engineering/phase-1-foundation/TASK-113-Migration-Best-Practices-Strategy.md)          |
| TASK-117 | Guards & Decorators (Mechanism)            | [TASK-117](../engineering/phase-1-foundation/TASK-117-Tạo-Guards-Decorators.md)                      |
| TASK-121 | README & Project Documentation Convention  | [TASK-121](../engineering/phase-1-foundation/TASK-121-Create-README-Documentation.md)                |
| TASK-122 | Shared Base Classes & Utilities            | [TASK-122](../engineering/phase-1-foundation/TASK-122-Shared-Base-Classes-Utilities.md)              |
| TASK-125 | Seed Data & Demo Mode                      | [TASK-125](../engineering/phase-1-foundation/TASK-125-Seed-Data-Demo-Mode.md)                        |

---

## 🏗️ 01. Phase 1: Foundation & Identity (Business)

_Bounded context **Identity**: User entity, authentication, authorization, account lifecycle._
Entity Catalog/Commerce (TASK-108..111) đã chuyển sang Phase 2 — nơi chúng được dùng đến.

| Task ID  | Description                              | Link                                                                                   |
| :------- | :--------------------------------------- | :------------------------------------------------------------------------------------- |
| TASK-106 | Thiết kế Database Schema (Strategy)      | [TASK-106](./01-Phase-1-Foundation/TASK-106-Thiết-kế-Database-Schema.md)               |
| TASK-107 | Tạo User Entity                          | [TASK-107](./01-Phase-1-Foundation/TASK-107-Tạo-User-Entity.md)                        |
| TASK-114 | Setup JWT Authentication                 | [TASK-114](./01-Phase-1-Foundation/TASK-114-Setup-JWT-Authentication.md)               |
| TASK-115 | Tạo Auth DTOs                            | [TASK-115](./01-Phase-1-Foundation/TASK-115-Tạo-Auth-DTOs.md)                          |
| TASK-116 | Implement Register & Login               | [TASK-116](./01-Phase-1-Foundation/TASK-116-Implement-Register-Login.md)               |
| TASK-118 | Implement Users CRUD                     | [TASK-118](./01-Phase-1-Foundation/TASK-118-Implement-Users-CRUD.md)                   |
| TASK-119 | Implement User Profile                   | [TASK-119](./01-Phase-1-Foundation/TASK-119-Implement-User-Profile.md)                 |
| TASK-120 | Implement Change Password                | [TASK-120](./01-Phase-1-Foundation/TASK-120-Implement-Change-Password.md)              |
| TASK-123 | Refresh Token & Session Management       | [TASK-123](./01-Phase-1-Foundation/TASK-123-Refresh-Token-Session-Management.md)       |
| TASK-124 | Account Verification & Password Recovery | [TASK-124](./01-Phase-1-Foundation/TASK-124-Account-Verification-Password-Recovery.md) |

## 🛠️ Engineering Foundation — Phase 2 (Setup · Middleware · Tooling)

_Cross-cutting concerns đã tách khỏi Phase 2 business._
Đặt tại [`../engineering/phase-2-revenue/`](../engineering/phase-2-revenue/README.md).

| Task ID  | Description                            | Link                                                                                       |
| :------- | :------------------------------------- | :----------------------------------------------------------------------------------------- |
| TASK-212 | Global Error Handling (Exception Filter) | [TASK-212](../engineering/phase-2-revenue/TASK-212-Global-Error-Handling.md)             |
| TASK-213 | Request Logging Interceptor            | [TASK-213](../engineering/phase-2-revenue/TASK-213-Request-Logging-Interceptor.md)         |
| TASK-214 | Response Transform Interceptor         | [TASK-214](../engineering/phase-2-revenue/TASK-214-Response-Transform-Interceptor.md)      |
| TASK-215 | Swagger / OpenAPI Documentation        | [TASK-215](../engineering/phase-2-revenue/TASK-215-Complete-Swagger-Documentation.md)      |
| TASK-223 | File Upload Service (Storage Adapter)  | [TASK-223](../engineering/phase-2-revenue/TASK-223-File-Upload-Service.md)                 |

---

## 🛒 02. Phase 2: Commercial Operations & Revenue (Business)

_Bounded contexts: **Catalog** + **Commerce** + **Engagement**._
📜 Charter: [`./02-Phase-2-Revenue/CHARTER.md`](./02-Phase-2-Revenue/CHARTER.md)

| Task ID  | Description                      | Link                                                                        |
| :------- | :------------------------------- | :-------------------------------------------------------------------------- |
| TASK-108 | Tạo Category Entity              | [TASK-108](./02-Phase-2-Revenue/TASK-108-Tạo-Category-Entity.md)            |
| TASK-109 | Tạo Product Entity               | [TASK-109](./02-Phase-2-Revenue/TASK-109-Tạo-Product-Entity.md)             |
| TASK-110 | Tạo Cart & CartItem Entities     | [TASK-110](./02-Phase-2-Revenue/TASK-110-Tạo-Cart-CartItem-Entities.md)     |
| TASK-111 | Tạo Order & OrderItem Entities   | [TASK-111](./02-Phase-2-Revenue/TASK-111-Tạo-Order-OrderItem-Entities.md)   |
| TASK-201 | Implement Categories CRUD        | [TASK-201](./02-Phase-2-Revenue/TASK-201-Implement-Categories-CRUD.md)      |
| TASK-202 | Category Tree & Filtering        | [TASK-202](./02-Phase-2-Revenue/TASK-202-Category-Tree-Filtering.md)        |
| TASK-203 | Implement Products CRUD          | [TASK-203](./02-Phase-2-Revenue/TASK-203-Implement-Products-CRUD.md)        |
| TASK-204 | Product Filtering & Search       | [TASK-204](./02-Phase-2-Revenue/TASK-204-Product-Filtering-Search.md)       |
| TASK-205 | Product Stock Management         | [TASK-205](./02-Phase-2-Revenue/TASK-205-Product-Stock-Management.md)       |
| TASK-206 | Product Images & File Upload     | [TASK-206](./02-Phase-2-Revenue/TASK-206-Product-Images-File-Upload.md)     |
| TASK-207 | Implement Shopping Cart          | [TASK-207](./02-Phase-2-Revenue/TASK-207-Implement-Shopping-Cart.md)        |
| TASK-208 | Cart Calculations                | [TASK-208](./02-Phase-2-Revenue/TASK-208-Cart-Calculations.md)              |
| TASK-209 | Implement Order Creation         | [TASK-209](./02-Phase-2-Revenue/TASK-209-Implement-Order-Creation.md)       |
| TASK-210 | Order Management                 | [TASK-210](./02-Phase-2-Revenue/TASK-210-Order-Management.md)               |
| TASK-211 | Order Statistics                 | [TASK-211](./02-Phase-2-Revenue/TASK-211-Order-Statistics.md)               |
| TASK-217 | Implement QA System              | [TASK-217](./02-Phase-2-Revenue/TASK-217-Implement-QA-System.md)            |
| TASK-218 | Product Variants & Attributes    | [TASK-218](./02-Phase-2-Revenue/TASK-218-Product-Variants-Attributes.md)    |
| TASK-219 | Reviews & Ratings                | [TASK-219](./02-Phase-2-Revenue/TASK-219-Reviews-Ratings.md)                |
| TASK-220 | Wishlist & Favorites             | [TASK-220](./02-Phase-2-Revenue/TASK-220-Wishlist-Favorites.md)             |
| TASK-221 | Payment Integration Advanced     | [TASK-221](./02-Phase-2-Revenue/TASK-221-Payment-Integration-Advanced.md)   |
| TASK-222 | Order Lifecycle Event Handling   | [TASK-222](./02-Phase-2-Revenue/TASK-222-Order-Lifecycle-Event-Handling.md) |
| TASK-224 | Discount & Coupon System         | [TASK-224](./02-Phase-2-Revenue/TASK-224-Discount-Coupon-System.md)         |
| TASK-225 | Multiple Shipping Methods        | [TASK-225](./02-Phase-2-Revenue/TASK-225-Multiple-Shipping-Methods.md)      |
| TASK-226 | Inventory Alerts & Notifications | [TASK-226](./02-Phase-2-Revenue/TASK-226-Inventory-Alerts-Notifications.md) |

> ⚠️ **TASK-216** (Rating System) trùng lặp với TASK-219 (Reviews & Ratings) — chờ user quyết định xóa/merge.

## 🚀 03. Phase 3: Ecosystem, Scale & Reliability

_Performance, security, microservices, and AI._

| Task ID  | Description                           | Link                                                                             |
| :------- | :------------------------------------ | :------------------------------------------------------------------------------- |
| TASK-301 | Write Unit Tests                      | [TASK-301](./03-Phase-3-Scale/TASK-301-Write-Unit-Tests.md)                      |
| TASK-302 | Write E2E Tests                       | [TASK-302](./03-Phase-3-Scale/TASK-302-Write-E2E-Tests.md)                       |
| TASK-303 | Implement Loyalty/Membership System   | [TASK-303](./03-Phase-3-Scale/TASK-303-Implement-Loyalty-Membership-System.md)   |
| TASK-304 | Database Optimization                 | [TASK-304](./03-Phase-3-Scale/TASK-304-Database-Optimization.md)                 |
| TASK-305 | Implement AI Recommendation Engine    | [TASK-305](./03-Phase-3-Scale/TASK-305-Implement-AI-Recommendation-Engine.md)    |
| TASK-306 | Add Caching                           | [TASK-306](./03-Phase-3-Scale/TASK-306-Add-Caching.md)                           |
| TASK-307 | Security Enhancements                 | [TASK-307](./03-Phase-3-Scale/TASK-307-Security-Enhancements.md)                 |
| TASK-308 | Setup CI/CD                           | [TASK-308](./03-Phase-3-Scale/TASK-308-Setup-CICD.md)                            |
| TASK-309 | Production Deployment                 | [TASK-309](./03-Phase-3-Scale/TASK-309-Production-Deployment.md)                 |
| TASK-310 | Enforce Clean Architecture Boundaries | [TASK-310](./03-Phase-3-Scale/TASK-310-Enforce-Clean-Architecture-Boundaries.md) |
| TASK-311 | Advanced Caching Strategy             | [TASK-311](./03-Phase-3-Scale/TASK-311-Advanced-Caching-Strategy.md)             |
| TASK-312 | Logging, Monitoring, Tracing          | [TASK-312](./03-Phase-3-Scale/TASK-312-Logging-Monitoring-Tracing.md)            |
| TASK-313 | Rate Limiting & Abuse Protection      | [TASK-313](./03-Phase-3-Scale/TASK-313-Rate-Limiting-Abuse-Protection.md)        |
| TASK-314 | API Versioning                        | [TASK-314](./03-Phase-3-Scale/TASK-314-API-Versioning.md)                        |
| TASK-315 | Feature Flags & Config Toggle         | [TASK-315](./03-Phase-3-Scale/TASK-315-Feature-Flags-Config-Toggle.md)           |
| TASK-316 | Elasticsearch Integration             | [TASK-316](./03-Phase-3-Scale/TASK-316-Elasticsearch-Integration.md)             |
| TASK-317 | Admin Dashboard Statistics            | [TASK-317](./03-Phase-3-Scale/TASK-317-Admin-Dashboard-Statistics.md)            |
| TASK-318 | Real-time Notifications (WS)          | [TASK-318](./03-Phase-3-Scale/TASK-318-Real-time-Notifications-WebSocket.md)     |
| TASK-319 | Two-Factor Authentication (2FA)       | [TASK-319](./03-Phase-3-Scale/TASK-319-Two-Factor-Authentication-2FA.md)         |
| TASK-320 | Role-Based Access Control (RBAC)      | [TASK-320](./03-Phase-3-Scale/TASK-320-Role-Based-Access-Control-RBAC.md)        |
| TASK-321 | Docker & Kubernetes                   | [TASK-321](./03-Phase-3-Scale/TASK-321-Docker-Kubernetes-Configuration.md)       |
| TASK-322 | GraphQL API Alternative               | [TASK-322](./03-Phase-3-Scale/TASK-322-GraphQL-API-Alternative-to-REST.md)       |
| TASK-323 | Microservices Architecture            | [TASK-323](./03-Phase-3-Scale/TASK-323-Microservices-Architecture.md)            |
| TASK-324 | Message Queue (RabbitMQ/Kafka)        | [TASK-324](./03-Phase-3-Scale/TASK-324-Message-Queue-RabbitMQKafka.md)           |
| TASK-325 | Multi-language Support (i18n)         | [TASK-325](./03-Phase-3-Scale/TASK-325-Multi-language-Support-i18n.md)           |
| TASK-326 | Multi-currency Support                | [TASK-326](./03-Phase-3-Scale/TASK-326-Multi-currency-Support.md)                |
| TASK-327 | Social Login (OAuth)                  | [TASK-327](./03-Phase-3-Scale/TASK-327-Social-Login-OAuth.md)                    |
| TASK-328 | Product Recommendations (ML)          | [TASK-328](./03-Phase-3-Scale/TASK-328-Product-Recommendations-ML.md)            |
| TASK-329 | Analytics Dashboard                   | [TASK-329](./03-Phase-3-Scale/TASK-329-Analytics-Dashboard-Google-Analytics.md)  |
