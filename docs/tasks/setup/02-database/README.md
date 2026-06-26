# 🛠️ 02-database — DB & Migration

> Canonical: [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) (cài Postgres) · [`../DATABASE_SCHEMA.md`](../DATABASE_SCHEMA.md) (ER) · [`../CONVENTIONS.md`](../CONVENTIONS.md) §8 (Prisma) + §13 (Migration)

## 🎯 Mục đích

Kết nối NestJS ↔ PostgreSQL qua Prisma, thiết lập **chiến lược migration một chiều** an toàn cho production.

## 📋 Tasks

| ID       | Topic                          | File                                                            | Canonical |
| :------- | :----------------------------- | :-------------------------------------------------------------- | :-------- |
| TASK-103 | Setup PostgreSQL local         | [link](./01-postgres-setup.md)                 | `../DATABASE_SETUP.md` |
| TASK-104 | Connect NestJS to Postgres     | [link](./02-connect-postgres.md)                          | `../DATABASE_SETUP.md` |
| TASK-106 | Database schema strategy       | [link](./03-schema-strategy.md)                           | `../DATABASE_SCHEMA.md` |
| TASK-112 | Run migrations                 | [link](./04-run-migrations.md)                   | `../COMMANDS.md` |
| TASK-113 | Migration best practices       | [link](./05-migration-strategy.md)         | `../CONVENTIONS.md §13` |

## ⚖️ Bất biến

1. **Migration là 1 chiều**. Không sửa file đã merge; sai → tạo migration mới revert.
2. **DDL tách khỏi DML**: schema migration chỉ `ALTER`, data update chạy script riêng.
3. **Pre-deploy check**: `npx prisma migrate status` phải clean.
4. **Drop column/table phải 2 deploy**: deprecate trước, drop sau.

## ✅ Definition of Done cho nhóm

- Docker Postgres 16 chạy, app connect được.
- `prisma migrate dev` chạy thành công, bảng tạo trong DB.
- Test rollback: tạo migration sai → `migrate reset` không lỗi.
- Naming convention `<YYYYMMDDHHMMSS>_<verb>_<entity>` enforced.
