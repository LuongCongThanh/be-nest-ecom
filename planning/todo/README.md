# Todo — Execution Layer

Folder này là **lớp thực thi** của repo.

- `planning/` = knowledge base / spec gốc / glossary / conventions
- `todo/` = thứ tự làm việc thực tế theo phase

Khi `todo/` và `planning/` khác nhau:

1. **Rule / glossary / invariant** → tin `planning/`
2. **Thứ tự làm / checkpoint / exit gate thực thi** → tin `todo/`

Mỗi file trong folder này là **1 task bạn cần thực hiện hoặc giao cho AI pair-programmer thực hiện**.

## Cách làm việc

1. Làm theo thứ tự số — `01-`, `02-`, `03-`...
2. Đọc file task → làm theo từng bước
3. Tick checkbox khi xong từng bước nhỏ
4. Hoàn thành task → cập nhật `planning/docs/STATUS.md`

## Cấu trúc

```
todo/
  README.md              ← file này
  phase-b/               ← Foundation (tuần 1-4) — LÀM TRƯỚC
    00-tools-setup.md
    01-nestjs-scaffold.md
    02-env-config.md
    02b-swagger.md
    03-docker-postgres.md
    04-prisma-connect.md
    05-prisma-schema.md
    06-migrations.md
    07-base-classes.md
    08-seed-data.md
    09-validation-pipe.md
    10-jwt-redis.md
    11-guards-decorators.md
    12-auth-feature.md
    13-refresh-token.md
    14-users-crud.md
    15-phase-b-exit-gate.md
  phase-c/               ← Core MVP (tuần 5-9) — mở sau khi Phase B done
    01-catalog-schema.md
    02-catalog-crud.md
    03-cart.md
    04-order.md
    05-payment.md
    06-phase-c-exit-gate.md
  phase-d/               ← Polish (tuần 10-11)
    01-error-logging.md
    02-swagger.md
    03-account-recovery.md
    04-phase-d-exit-gate.md
  phase-e/               ← Verification & Ship (tuần 12)
    01-testing.md
    02-ship.md
```

## Quy tắc

- **Không skip task** — mỗi task phụ thuộc task trước
- **Đọc spec gốc** — link `planning/` trong mỗi task file
- **Verify trước khi tick Done** — chạy lệnh verify ở cuối mỗi task
- **Không phát minh rule mới trong `todo/` nếu chưa phản chiếu lại về `planning/`** khi rule đó thuộc glossary / invariant / canonical convention
