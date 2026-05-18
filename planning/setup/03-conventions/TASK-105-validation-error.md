# TASK-105: Global Validation & Error Handling

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §3, §5, §14`](../CONVENTIONS.md) (Type safety, Error strategy, Validation pipeline)

---

## 🎯 Intent

Bật **ValidationPipe global** + **GlobalExceptionFilter** để mọi DTO sai và mọi exception đều trả response theo **schema đóng băng** mà FE có thể parse theo `code` (UPPER_SNAKE).

Không có 2 thứ này thì FE bị break vô tội vạ khi BE deploy.

---

## ✅ Acceptance Criteria

- [ ] `main.ts` đăng ký `ValidationPipe` global với options:
      - `whitelist: true` (drop field không có decorator).
      - `forbidNonWhitelisted: true` (reject request có field thừa — chống Mass Assignment).
      - `transform: true` + `transformOptions.enableImplicitConversion: true`.
- [ ] `GlobalExceptionFilter` (file ở `src/common/filters/`) catch:
      - `HttpException` (NestJS built-in).
      - `PrismaClientKnownRequestError` (P2002 unique, P2025 not found...).
      - `Error` (unknown — log + trả 500 generic, không leak stack).
- [ ] Response error schema đóng băng — xem `CONVENTIONS.md §14`:
      ```json
      { "statusCode", "code", "message", "errors": [...], "timestamp", "path", "requestId" }
      ```
- [ ] Mã `code` UPPER_SNAKE bắt buộc (ví dụ `VALIDATION_FAILED`, `USER_NOT_FOUND`). FE parse `code`, KHÔNG parse `message`.
- [ ] Test: POST sai body → response status `422`, có `errors[]` đầy đủ field-level error.
- [ ] Test: route không tồn tại → `404` cùng schema (không leak Express HTML).
- [ ] Test: throw `new NotFoundException('User not found')` → filter format đúng schema.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §3`](../CONVENTIONS.md) — Type safety + DTO rules.
- [`../CONVENTIONS.md §5`](../CONVENTIONS.md) — Error handling strategy.
- [`../CONVENTIONS.md §14`](../CONVENTIONS.md) — Validation pipe config + error response schema chi tiết + custom validators.
- [`./README.md`](./README.md) — Group DoD.
