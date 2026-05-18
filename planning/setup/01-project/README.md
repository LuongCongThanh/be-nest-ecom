# 🛠️ 01-project — Khởi tạo NestJS

> Canonical convention: [`../CONVENTIONS.md`](../CONVENTIONS.md) §1 (Module structure)

## 🎯 Mục đích

Bootstrap dự án NestJS với cấu trúc thư mục chuẩn + biến môi trường có validate. Sau khi xong nhóm này, app phải `npm run start:dev` chạy được mà chưa cần DB.

## 📋 Tasks

| ID       | Topic                          | File                                            | Canonical |
| :------- | :----------------------------- | :---------------------------------------------- | :-------- |
| TASK-101 | Bootstrap NestJS               | [link](./01-bootstrap-nestjs.md)          | `../CONVENTIONS.md §1` |
| TASK-102 | Environment Configuration      | [link](./02-env-config.md) | — |

## ✅ Definition of Done cho nhóm

- `nest new` chạy xong, structure `src/{common,config,modules,migrations}/` đầy đủ.
- `npm run start:dev` log ra `Nest application successfully started`.
- `GET /health` (kể cả chưa có DB) trả `200`.
- `.env.example` có đủ biến, `ConfigModule` validate bằng `class-validator` `EnvSchema`, app crash khi thiếu biến bắt buộc.
- Path alias `@common`, `@modules` hoạt động trong tsconfig + ts-jest.
