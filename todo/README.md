# Todo — Hướng dẫn thực thi dự án

Mỗi file trong folder này là **1 task bạn cần tự thực hiện**.

## Cách làm việc

1. Làm theo thứ tự số — `01-`, `02-`, `03-`...
2. Đọc file task → làm theo từng bước
3. Tick checkbox khi xong từng bước nhỏ
4. Hoàn thành task → báo Claude để mở task tiếp theo

## Cấu trúc

```
todo/
  README.md              ← file này
  phase-b/               ← Foundation (tuần 1-4) — LÀM TRƯỚC
    00-tools-setup.md
    01-nestjs-scaffold.md
    02-env-config.md
    03-docker-postgres.md
    04-prisma-connect.md
    05-prisma-schema.md
    06-migrations.md
    07-base-classes.md
    08-seed-data.md
    09-validation-pipe.md
    10-exception-filter.md
    11-jwt-redis.md
    12-guards-decorators.md
    13-auth-dtos.md
    14-register-login.md
    15-refresh-token.md
    16-users-crud.md
    17-exit-gate.md
  phase-c/               ← Core MVP (tuần 5-9) — mở sau khi Phase B done
  phase-d/               ← Polish (tuần 10-11)
  phase-e/               ← Verification & Ship (tuần 12)
```

## Quy tắc

- **Không skip task** — mỗi task phụ thuộc task trước
- **Đọc spec gốc** — link `planning/` trong mỗi task file
- **Verify trước khi tick Done** — chạy lệnh verify ở cuối mỗi task
