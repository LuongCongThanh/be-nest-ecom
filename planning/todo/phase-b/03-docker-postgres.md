# Task 03 — Docker + PostgreSQL Setup

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 02
**Ưu tiên**: 🟡 TRUNG BÌNH (Infrastructure — thiếu thì không có DB, nhưng dễ sửa)
**Trạng thái**: ✅ Done
**Spec gốc**: [01-postgres-setup.md](../../setup/02-database/01-postgres-setup.md)

> **Repo snapshot 2026-05-21:** `.env` đã chuẩn bị `DATABASE_URL` và `REDIS_URL`, nhưng repo chưa có `docker-compose.yml`.

---

## 🎯 Mục tiêu & Ý nghĩa

Chạy PostgreSQL 16 + Redis qua Docker Compose thay vì cài trực tiếp lên máy.

- **Môi trường nhất quán**: mọi developer dùng cùng version PostgreSQL 16-alpine, không có "works on my machine" do version khác nhau.
- **Healthcheck là bắt buộc**: Prisma (`Task 04`) sẽ connect sớm khi app start — nếu không có healthcheck, Prisma có thể connect vào container đang khởi động và fail. Healthcheck đảm bảo Postgres `pg_isready` trả OK trước khi app kết nối.
- **Named volumes** (`pgdata`, `redisdata`): data tồn tại qua `docker compose down/up`, chỉ mất khi `docker compose down -v`.
- **Redis song song Postgres**: Redis cho refresh token và cache. Cài cùng lúc để không phải quay lại sau.

---

## 🛠️ Các bước thực hiện

### 1. Tạo docker-compose.yml ở root project

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ecom_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-ecom_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ecom_pass}
      POSTGRES_DB: ${POSTGRES_DB:-ecom_db}
    ports:
      - '${POSTGRES_PORT:-5432}:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-ecom_user}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ecom_redis
    restart: unless-stopped
    ports:
      - '${REDIS_PORT:-6379}:6379'
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

### 2. Thêm biến DB vào .env

```
POSTGRES_USER=ecom_user
POSTGRES_PASSWORD=ecom_pass
POSTGRES_DB=ecom_db
POSTGRES_PORT=5432
REDIS_PORT=6379
DATABASE_URL=postgresql://ecom_user:ecom_pass@localhost:${POSTGRES_PORT}/ecom_db
REDIS_URL=redis://localhost:${REDIS_PORT}
```

### 3. Chạy containers

```bash
docker compose up -d
```

### 4. Kiểm tra status

```bash
docker compose ps
# Cả 2 service phải ở trạng thái (healthy)
```

### 5. Kết nối DBeaver để verify

Mở DBeaver → New Connection → PostgreSQL:
- Host: `localhost`
- Port: `5432`
- Database: `ecom_db`
- Username: `ecom_user`
- Password: `ecom_pass`

Click "Test Connection" → phải thành công.

---

## Các lệnh Docker hay dùng

```bash
docker compose up -d          # khởi động background
docker compose down           # dừng và xóa container (data vẫn còn trong volume)
docker compose down -v        # dừng và xóa cả data volume (RESET TOÀN BỘ)
docker compose logs postgres  # xem logs
docker compose ps             # xem trạng thái
docker compose restart        # restart tất cả
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Cả hai containers ở trạng thái healthy**

- **Given** Docker Desktop đang chạy, đã chạy `docker compose up -d`
- **When** chạy `docker compose ps`
- **Then** cả `ecom_postgres` và `ecom_redis` đều hiển thị status `(healthy)`, không phải `starting` hay `unhealthy`

**AC-2: DBeaver kết nối PostgreSQL thành công**

- **Given** container postgres đang healthy
- **When** tạo kết nối trong DBeaver với host/port/user/pass như trên
- **Then** "Test Connection" trả "Connected" — có thể browse tables (dù chưa có table nào)

**AC-3: Data tồn tại qua restart**

- **Given** đã có data trong DB (sau Task 08 seed)
- **When** chạy `docker compose down` rồi `docker compose up -d`
- **Then** data vẫn còn — không bị mất khi restart containers (nhờ named volumes)

**AC-4: Redis phản hồi PING**

- **Given** container redis đang chạy
- **When** chạy `docker compose exec redis redis-cli ping`
- **Then** output là `PONG`

---

## Verify hoàn thành

```bash
docker compose ps
# NAME            STATUS          PORTS
# ecom_postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
# ecom_redis      Up (healthy)    0.0.0.0:6379->6379/tcp
```

---

## 🚫 Ngoài phạm vi

- PostgreSQL replication, read replica → production infra, ngoài scope
- Redis Sentinel / Redis Cluster → production infra, ngoài scope
- Database backup automation → ngoài scope Phase B
- Docker network tách biệt (microservices networking) → architecture sau
- SSL/TLS cho DB connection → production hardening, Phase E

---

## Xong thì làm gì?

→ Mở task tiếp theo: [04-prisma-connect.md](./04-prisma-connect.md)
