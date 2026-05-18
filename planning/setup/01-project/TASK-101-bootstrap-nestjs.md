# TASK-101: Bootstrap NestJS Project

> ⚠️ **STUB** — Nội dung kiến trúc canonical: [`../CONVENTIONS.md §1`](../CONVENTIONS.md) (Module structure & DI rules)

---

## 🎯 Intent

Khởi tạo dự án NestJS strict-mode với cấu trúc thư mục chuẩn, path alias, và bootstrap pipeline tối thiểu chạy được.

Đây là **System Seed** — quyết định cấu trúc DNA toàn project. Sai ở đây phải refactor toàn bộ.

---

## ✅ Acceptance Criteria

- [ ] `nest new ecom-api --strict --skip-git --package-manager npm` chạy xong.
- [ ] Thư mục `src/{common,config,modules,migrations,shared}/` đầy đủ.
- [ ] `tsconfig.json` strict: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- [ ] Path alias `@common/*`, `@modules/*`, `@shared/*` hoạt động trong cả `tsc` và `ts-jest`.
- [ ] `main.ts` bootstrap: tạo app, log port, listen `process.env.PORT ?? 3000`.
- [ ] `.env.example` tồn tại với ít nhất `NODE_ENV`, `PORT`, `DATABASE_URL`.
- [ ] `npm run start:dev` chạy, log `Nest application successfully started`.
- [ ] `GET /health` (dù chưa có DB) trả `200 { status: "ok" }`.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §1`](../CONVENTIONS.md) — Module/DI rules.
- [`../CONVENTIONS.md §2`](../CONVENTIONS.md) — Naming conventions.
- [`./README.md`](./README.md) — Group DoD.
