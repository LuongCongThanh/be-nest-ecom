# 🛠️ 01-project — Khởi tạo NestJS

> Canonical convention: [`../CONVENTIONS.md`](../CONVENTIONS.md) §1 (Module structure)

## 🎯 Mục đích

Bootstrap dự án NestJS với **cấu trúc thư mục chuẩn theo [`../PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md)** + biến môi trường có validate. Sau khi xong nhóm này, app phải `npm run start:dev` chạy được mà chưa cần DB.

⚠️ **TRƯỚC khi code Tuần 1**: đọc [`../PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md) — biết tạo `src/{common, config, shared, modules, infrastructure, jobs}/` từ đầu, không refactor sau.

## 📋 Tasks

| ID       | Topic                          | File                                            | Canonical |
| :------- | :----------------------------- | :---------------------------------------------- | :-------- |
| TASK-101 | Bootstrap NestJS               | [link](./01-bootstrap-nestjs.md)          | `../CONVENTIONS.md §1` |
| TASK-102 | Environment Configuration      | [link](./02-env-config.md) | — |

## ✅ Definition of Done cho nhóm

- `nest new` chạy xong, structure `src/{common,config,shared,modules,infrastructure,jobs}/` đầy đủ.
- `npm run start:dev` log ra `Nest application successfully started`.
- `GET /health` (kể cả chưa có DB) trả `200`.
- `.env.example` có đủ biến, `ConfigModule` validate tập trung trong `src/config/**`, app crash khi thiếu biến bắt buộc.
- Path alias `@common`, `@modules` hoạt động trong tsconfig + ts-jest.
