# 📑 Master Task Index

> 📜 Glossary: [`CONTEXT.md`](./docs/CONTEXT.md) · Convention: [`setup/CONVENTIONS.md`](./setup/CONVENTIONS.md) · Roadmap self-learn: [`ROADMAP.md`](./docs/ROADMAP.md)

Tài liệu chia 2 nhánh:

- **`setup/`** — hạ tầng, công cụ, quy ước (HOW)
- **`business/`** — domain, feature (WHAT)

---

## 🛠️ Setup (Infrastructure & Conventions)

### `setup/01-project/` — Khởi tạo
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-101 | Khởi tạo Project NestJS | [link](./setup/01-project/) |
| TASK-102 | Environment Configuration | [link](./setup/01-project/) |

### `setup/02-database/` — DB & Migration
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-103 | Setup PostgreSQL | [link](./setup/02-database/) |
| TASK-104 | Kết nối NestJS ↔ PostgreSQL | [link](./setup/02-database/) |
| TASK-106 | Database Schema Strategy | [link](./setup/02-database/) |
| TASK-112 | Generate & Run Migrations | [link](./setup/02-database/) |
| TASK-113 | Migration Best Practices | [link](./setup/02-database/) |

### `setup/03-conventions/` — Convention & Mechanism
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-105 | Global Validation & Error Handling | [link](./setup/03-conventions/) |
| TASK-117 | Guards & Decorators | [link](./setup/03-conventions/) |
| TASK-121 | README Convention | [link](./setup/03-conventions/) |
| TASK-122 | Shared Base Classes & Utilities | [link](./setup/03-conventions/) |
| TASK-125 | Seed Data & Demo Mode | [link](./setup/03-conventions/) |

### `setup/04-cross-cutting/` — Middleware
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-212 | Global Error Handling (Filter) | [link](./setup/04-cross-cutting/) |
| TASK-213 | Request Logging Interceptor | [link](./setup/04-cross-cutting/) |
| TASK-214 | Response Transform Interceptor | [link](./setup/04-cross-cutting/) |
| TASK-215 | Swagger / OpenAPI | [link](./setup/04-cross-cutting/) |
| TASK-223 | File Upload Service | [link](./setup/04-cross-cutting/) |

### `setup/05-scale-infra/` — Post-MVP Infrastructure
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-301 | Unit Tests | [link](./setup/05-scale-infra/) |
| TASK-302 | E2E Tests | [link](./setup/05-scale-infra/) |
| TASK-304 | Database Optimization | [link](./setup/05-scale-infra/) |
| TASK-306 | Add Caching | [link](./setup/05-scale-infra/) |
| TASK-307 | Security Enhancements | [link](./setup/05-scale-infra/) |
| TASK-308 | Setup CI/CD | [link](./setup/05-scale-infra/) |
| TASK-309 | Production Deployment | [link](./setup/05-scale-infra/) |
| TASK-310 | Clean Architecture Boundaries | [link](./setup/05-scale-infra/) |
| TASK-311 | Advanced Caching Strategy | [link](./setup/05-scale-infra/) |
| TASK-312 | Logging, Monitoring, Tracing | [link](./setup/05-scale-infra/) |
| TASK-313 | Rate Limiting & Abuse Protection | [link](./setup/05-scale-infra/) |
| TASK-314 | API Versioning | [link](./setup/05-scale-infra/) |
| TASK-315 | Feature Flags | [link](./setup/05-scale-infra/) |
| TASK-316 | Elasticsearch Integration | [link](./setup/05-scale-infra/) |
| TASK-320 | RBAC | [link](./setup/05-scale-infra/) |
| TASK-321 | Docker & Kubernetes | [link](./setup/05-scale-infra/) |

---

## 🛒 Business (Domain Features)

### `business/01-identity/` — Người dùng & Auth
> 📜 Charter: [`./business/01-identity/CHARTER.md`](./business/01-identity/CHARTER.md)

| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-107 | User Entity | [link](./business/01-identity/) |
| TASK-114 | JWT Authentication | [link](./business/01-identity/) |
| TASK-115 | Auth DTOs | [link](./business/01-identity/) |
| TASK-116 | Register & Login | [link](./business/01-identity/) |
| TASK-118 | Users CRUD | [link](./business/01-identity/) |
| TASK-119 | User Profile | [link](./business/01-identity/) |
| TASK-120 | Change Password | [link](./business/01-identity/) |
| TASK-123 | Refresh Token & Session | [link](./business/01-identity/) |
| TASK-124 | Email Verify & Password Recovery | [link](./business/01-identity/) |

### `business/02-catalog/` — Sản phẩm & Danh mục
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-108 | Category Entity | [link](./business/02-catalog/) |
| TASK-109 | Product Entity | [link](./business/02-catalog/) |
| TASK-201 | Categories CRUD | [link](./business/02-catalog/) |
| TASK-202 | Category Tree & Filtering | [link](./business/02-catalog/) |
| TASK-203 | Products CRUD | [link](./business/02-catalog/) |
| TASK-204 | Product Filtering & Search | [link](./business/02-catalog/) |
| TASK-205 | Product Stock Management | [link](./business/02-catalog/) |
| TASK-206 | Product Images & Upload | [link](./business/02-catalog/) |
| TASK-218 | Product Variants & Attributes | [link](./business/02-catalog/) |

### `business/03-cart/` — Giỏ hàng
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-110 | Cart & CartItem Entities | [link](./business/03-cart/) |
| TASK-207 | Shopping Cart | [link](./business/03-cart/) |
| TASK-208 | Cart Calculations | [link](./business/03-cart/) |

### `business/04-order/` — Đơn hàng
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-111 | Order & OrderItem Entities | [link](./business/04-order/) |
| TASK-209 | Order Creation | [link](./business/04-order/) |
| TASK-210 | Order Management | [link](./business/04-order/) |
| TASK-211 | Order Statistics | [link](./business/04-order/) |
| TASK-222 | Order Lifecycle Events | [link](./business/04-order/) |

### `business/05-payment/` — Thanh toán
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-221 | Payment Integration (VNPay) | [link](./business/05-payment/) |

### `business/06-engagement/` — Tương tác
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-217 | Q&A System | [link](./business/06-engagement/) |
| TASK-219 | Reviews & Ratings | [link](./business/06-engagement/) |
| TASK-220 | Wishlist & Favorites | [link](./business/06-engagement/) |
| TASK-224 | Discount & Coupon | [link](./business/06-engagement/) |
| TASK-225 | Multiple Shipping Methods | [link](./business/06-engagement/) |
| TASK-226 | Inventory Alerts | [link](./business/06-engagement/) |
| ~~TASK-216~~ | ⚠️ Deprecated — gộp vào TASK-219 | — |

### `business/07-future/` — Post-MVP Features
| Task | Mô tả | Link |
| :--- | :--- | :--- |
| TASK-303 | Loyalty/Membership | [link](./business/07-future/) |
| TASK-305 | AI Recommendation Engine | [link](./business/07-future/) |
| TASK-317 | Admin Dashboard Statistics | [link](./business/07-future/) |
| TASK-318 | Real-time Notifications (WS) | [link](./business/07-future/) |
| TASK-319 | Two-Factor Authentication | [link](./business/07-future/) |
| TASK-322 | GraphQL API | [link](./business/07-future/) |
| TASK-323 | Microservices Architecture | [link](./business/07-future/) |
| TASK-324 | Message Queue (RabbitMQ/Kafka) | [link](./business/07-future/) |
| TASK-325 | Multi-language (i18n) | [link](./business/07-future/) |
| TASK-326 | Multi-currency | [link](./business/07-future/) |
| TASK-327 | OAuth Social Login | [link](./business/07-future/) |
| TASK-328 | Product Recommendations (ML) | [link](./business/07-future/) |
| TASK-329 | Analytics Dashboard | [link](./business/07-future/) |

---

**Tổng: 79 task active + 1 deprecated** (TASK-216 merged into TASK-219).

> Self-learn không làm toàn bộ 79 task. Theo `ROADMAP.md`: MVP ≈ 35 task chính, còn lại là backlog/cut.
