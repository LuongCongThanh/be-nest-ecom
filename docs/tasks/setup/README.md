# 🛠️ Setup — Hạ tầng & Quy ước

Mọi task **không phải nghiệp vụ**: cài đặt, công cụ, quy ước code, middleware xuyên suốt, hạ tầng scale.

`setup/` là nơi giữ **engineering standards có tính enforce**. File ở đây nên trả lời:

- project nên được tổ chức thế nào,
- bootstrap/config/logging/validation nên theo rule nào,
- và các cơ chế dùng chung nên được chuẩn hóa tới mức nào.

`setup/` **không nên** trở thành execution checklist theo ngày; phần đó thuộc `../todo/`.

## 📑 Tài liệu canonical (source of truth)

| File                                     | Nội dung                                        |
| :--------------------------------------- | :---------------------------------------------- |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | **Cấu trúc thư mục chuẩn** (src/, test/, module layout, path aliases, file suffix, naming). Đọc TRƯỚC khi code Tuần 1. |
| [`CONVENTIONS.md`](./CONVENTIONS.md)     | Quy ước code: DI rules, error, log, test, base classes, guards, migration, validation, pagination, rate limit |
| [`COMMANDS.md`](./COMMANDS.md)           | Lệnh dev / migration / seed thường dùng         |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) | Sơ đồ ER + thiết kế bảng                     |
| [`DATABASE_SETUP.md`](./DATABASE_SETUP.md)   | Cài PostgreSQL + Prisma local                |

## 📂 Task theo nhóm

### 01-project — Khởi tạo dự án
| Task | Mô tả |
| :--- | :--- |
| TASK-101 | Khởi tạo Project NestJS |
| TASK-102 | Environment Configuration |

### 02-database — DB & Migration
| Task | Mô tả |
| :--- | :--- |
| TASK-103 | Setup PostgreSQL |
| TASK-104 | Kết nối NestJS ↔ PostgreSQL |
| TASK-106 | Thiết kế Database Schema (strategy) |
| TASK-112 | Generate & Run Migrations |
| TASK-113 | Migration Best Practices |

### 03-conventions — Quy ước & cơ chế dùng chung
| Task | Mô tả |
| :--- | :--- |
| TASK-105 | Global Validation & Error Handling |
| TASK-117 | Guards & Decorators (mechanism) |
| TASK-121 | README & Documentation Convention |
| TASK-122 | Shared Base Classes & Utilities |
| TASK-125 | Seed Data & Demo Mode |

### 04-cross-cutting — Middleware xuyên suốt
| Task | Mô tả |
| :--- | :--- |
| TASK-212 | Global Error Handling (Exception Filter) |
| TASK-213 | Request Logging Interceptor |
| TASK-214 | Response Transform Interceptor |
| TASK-215 | Swagger / OpenAPI Documentation |
| TASK-223 | File Upload Service (Storage Adapter) |

### 05-scale-infra — Hạ tầng scale (post-MVP)
| Task | Mô tả |
| :--- | :--- |
| TASK-301 | Write Unit Tests |
| TASK-302 | Write E2E Tests |
| TASK-313 | Rate Limiting & Abuse Protection |
| TASK-307 | Security Enhancements |
| TASK-320 | Role-Based Access Control (RBAC) |
| TASK-308 | Setup CI/CD |
| TASK-309 | Production Deployment |
| TASK-312 | Logging, Monitoring, Tracing |
| TASK-304 | Database Optimization |
| TASK-306 | Add Caching |
| TASK-310 | Enforce Clean Architecture Boundaries |
| TASK-311 | Advanced Caching Strategy |
| TASK-314 | API Versioning |
| TASK-315 | Feature Flags & Config Toggle |
| TASK-316 | Elasticsearch Integration |
| TASK-321 | Docker & Kubernetes |

## ⚠️ Lưu ý

- **Single source of truth**: nội dung trùng với `CONVENTIONS.md` / `DATABASE_*.md` → các file canonical là chuẩn. Task chỉ giữ **intent + acceptance criteria + link**.
- **Task ID giữ nguyên** (101→321) để truy vết lịch sử lên kế hoạch ban đầu. KHÔNG renumber.
- Với người tự học: bám `../docs/ROADMAP.md`, các task `05-scale-infra` chỉ làm sau khi xong MVP.
- Khi một lựa chọn implementation còn đang mở, file canonical nên mô tả **default khuyến nghị + trade-off**, không khóa cứng một biến thể quá sớm nếu repo chưa thật sự cần.
