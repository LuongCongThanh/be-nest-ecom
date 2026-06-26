# TASK-104: Connect NestJS to PostgreSQL via Prisma

> ⚠️ **STUB** — Hướng dẫn wiring đầy đủ: [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) (Step 2) · ORM rules: [`../CONVENTIONS.md §8`](../CONVENTIONS.md)

---

## 🎯 Intent

Wire Prisma ORM vào NestJS DI container. Tạo `PrismaService` để mọi module inject DB client thay vì tự khởi tạo Prisma client.

---

## ✅ Acceptance Criteria

- [ ] `npm i @prisma/client @prisma/adapter-pg && npm i -D prisma` cài xong.
- [ ] `npx prisma init` tạo `prisma/schema.prisma`.
- [ ] **Prisma 7 driver adapters**: datasource block KHÔNG có `url` field khi dùng `@prisma/adapter-pg`. Connection string truyền qua `PrismaPg({ connectionString: process.env.DATABASE_URL })` trong constructor của `PrismaService`.
- [ ] `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy` ở `src/common/prisma/`.
- [ ] `PrismaModule` global (`@Global()`), export `PrismaService`.
- [ ] `onModuleInit` gọi `await this.$connect()`. `onModuleDestroy` gọi `await this.$disconnect()`.
- [ ] App start → log `Prisma connected`.
- [ ] Test: inject `PrismaService` vào `HealthService`, query `SELECT 1` trả OK.
- [ ] `prisma generate` script trong `package.json` chạy tự động sau `npm install` (postinstall hook).

> ⚠️ **Build sẽ fail nếu thiếu**: `@prisma/adapter-pg` phải được cài (`npm install`) VÀ client phải được generate (`npx prisma generate`) trước khi `npm run build`. Thiếu một trong hai → `TS2305: Module '@prisma/client' has no exported member 'PrismaClient'`.

---

## 🔗 Canonical references

- [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) — Setup steps.
- [`../CONVENTIONS.md §8`](../CONVENTIONS.md) — Prisma best practices (selective fetching, transactions, indexes).
- [`./README.md`](./README.md) — Group DoD.
