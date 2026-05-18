# 🛠️ Engineering — Phase 2 Revenue Tasks

Engineering primitives & cross-cutting concerns được tách khỏi `02-Phase-2-Revenue/` business tasks.

> Tham chiếu phase business gốc: [`../../ecommerce-api-doc/02-Phase-2-Revenue/CHARTER.md`](../../ecommerce-api-doc/02-Phase-2-Revenue/CHARTER.md)

---

## 📑 Index

### A. HTTP Middleware Stack
| Task | Mô tả | Canonical doc |
| :--- | :--- | :--- |
| [TASK-212](./TASK-212-Global-Error-Handling.md) | Global Exception Filter | [`../project-conventions.vi.md §5, §14`](../project-conventions.vi.md) |
| [TASK-213](./TASK-213-Request-Logging-Interceptor.md) | Request Logging + Correlation ID | [`../project-conventions.vi.md §7`](../project-conventions.vi.md) |
| [TASK-214](./TASK-214-Response-Transform-Interceptor.md) | Response Envelope Wrapper | [`../project-conventions.vi.md §4, §5`](../project-conventions.vi.md) |

### B. Documentation & Tooling
| Task | Mô tả |
| :--- | :--- |
| [TASK-215](./TASK-215-Complete-Swagger-Documentation.md) | OpenAPI / Swagger Living Documentation |

### C. Infrastructure Service
| Task | Mô tả | Consumer business |
| :--- | :--- | :--- |
| [TASK-223](./TASK-223-File-Upload-Service.md) | Storage adapter + Image processing pipeline | Product images (TASK-206), Review media (TASK-219), Avatar |

---

## ⚠️ Lưu ý

- **Task ID giữ nguyên** (212, 213, 214, 215, 223) — không renumber.
- TASK-212/213/214 thực thi **trước** business feature đầu tiên của Phase 2 (TASK-201) vì là cross-cutting.
- TASK-215 (Swagger) có thể song song với business tasks nhưng phải hoàn tất trước khi đóng Phase 2.
- TASK-223 (File Upload) là dependency của TASK-206 (Product Images) — schedule trước.
