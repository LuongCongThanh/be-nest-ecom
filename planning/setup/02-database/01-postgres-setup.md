# TASK-103: Setup PostgreSQL Local (Docker)

> ⚠️ **STUB** — Hướng dẫn cài đầy đủ: [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) (Step 1)

---

## 🎯 Intent

Chạy PostgreSQL 16 local qua Docker Compose để dev không cần cài Postgres trực tiếp lên máy. Đảm bảo môi trường dev đồng nhất giữa các máy.

---

## ✅ Acceptance Criteria

- [ ] `docker-compose.yml` ở root chứa service `postgres` image `postgres:16-alpine`.
- [ ] Biến `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` đọc từ `.env`.
- [ ] Port `5432` expose ra host.
- [ ] Volume `pgdata` mount để data persist qua restart.
- [ ] Healthcheck `pg_isready` định kỳ — app chờ DB ready trước khi connect.
- [ ] `docker compose up -d postgres` chạy, `docker compose ps` thấy state `(healthy)`.
- [ ] DBeaver/TablePlus connect được tới `localhost:5432`.

---

## 🔗 Canonical references

- [`../DATABASE_SETUP.md`](../DATABASE_SETUP.md) — Hướng dẫn step-by-step.
- [`../COMMANDS.md`](../COMMANDS.md) — Lệnh `docker compose up/down/logs`.
- [`./README.md`](./README.md) — Group DoD + invariants.
