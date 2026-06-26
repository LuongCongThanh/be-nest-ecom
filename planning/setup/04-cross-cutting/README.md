# 🛠️ 04-cross-cutting — Middleware Stack

> Canonical: [`../CONVENTIONS.md`](../CONVENTIONS.md) §5 (error), §7 (logging), §14 (validation)

## 🎯 Mục đích

**Middleware xuyên suốt** — không thuộc 1 module nghiệp vụ nào nhưng chạm mọi request. Format response, log, handle error, expose docs, upload file.

## 🧱 Request pipeline (thứ tự bắt buộc)

```
HTTP request
  ↓
1. Helmet                        — security headers
  ↓
2. CORS                          — cross-origin policy
  ↓
3. Global ValidationPipe         — DTO check (whitelist + transform)
  ↓
4. Correlation ID middleware     — gắn requestId vào ctx
  ↓
5. RequestLoggingInterceptor     — log [method] path - duration
  ↓
6. JwtAuthGuard (global)         — verify token (skip @Public)
  ↓
7. RolesGuard                    — check @Roles()
  ↓
8. Controller handler            — service call
  ↓
9. ResponseTransformInterceptor  — wrap { data, meta }
  ↓
10. GlobalExceptionFilter        — catch + format error JSON
  ↓
HTTP response
```

## 📋 Tasks

| ID       | Topic                          | File                                                            |
| :------- | :----------------------------- | :-------------------------------------------------------------- |
| TASK-212 | Global Error Filter            | [link](./01-error-filter.md)                     |
| TASK-213 | Request Logging Interceptor    | [link](./02-logging.md)               |
| TASK-214 | Response Transform Interceptor | [link](./03-response-transform.md)            |
| TASK-215 | Swagger / OpenAPI              | [link](./04-swagger.md)            |
| TASK-223 | File Upload Service            | [link](./05-file-upload.md)                       |

## ⚖️ Bất biến

1. **Error response schema đóng băng** (xem `CONVENTIONS.md §14`). FE parse theo `code` (UPPER_SNAKE), không parse `message`.
2. **Mọi request có `requestId`** trong log + response header `x-request-id`. Dùng để truy vết.
3. **Response wrap `{ data, meta }`** trừ healthcheck (return raw OK). Đảm bảo client parser thống nhất.
4. **Swagger publish ở `/docs`** trong môi trường local/dev; production chỉ mở khi có chủ đích và kiểm soát truy cập.
5. **File upload qua adapter pattern**: local disk dev, S3 production. Service không biết storage backend.

## ✅ Definition of Done cho nhóm

- Test gọi sai DTO → response đúng schema, có `errors[]`, `code`, `requestId`.
- Throw `NotFoundException` từ service → filter catch, format đúng.
- `curl /docs` thấy Swagger UI list mọi endpoint với DTO + response example.
- Upload file 5MB ảnh → trả URL, file tồn tại trên storage.
