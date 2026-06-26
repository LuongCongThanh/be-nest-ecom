# TASK-104: Connect NestJS to PostgreSQL via Prisma

> ⚠️ **STUB** — Hướng dẫn wiring đầy đủ: [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) (Step 2) · ORM rules: [`../CONVENTIONS.md §8`](../CONVENTIONS.md)

---

## 🎯 Intent

Wire Prisma ORM vào NestJS DI container. Tạo `PrismaService` để mọi module inject DB client thay vì tự khởi tạo Prisma client.

---

## ✅ Acceptance Criteria

- [ ] `npm i @prisma/client && npm i -D prisma` cài xong.
- [ ] `npx prisma init` tạo `prisma/schema.prisma` + thêm `DATABASE_URL` vào `.env`.
- [ ] `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy` ở `src/common/prisma/`.
- [ ] `PrismaModule` global (`@Global()`), export `PrismaService`.
- [ ] `onModuleInit` gọi `await this.$connect()`. `onModuleDestroy` gọi `await this.$disconnect()`.
- [ ] App start → log `Prisma connected`.
- [ ] Test: inject `PrismaService` vào `HealthService`, query `SELECT 1` trả OK.
- [ ] `prisma generate` script trong `package.json` chạy tự động sau `npm install`.

---

## 🔗 Canonical references

- [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) — Setup steps.
- [`../CONVENTIONS.md §8`](../CONVENTIONS.md) — Prisma best practices (selective fetching, transactions, indexes).
- [`./README.md`](./README.md) — Group DoD.
