# TASK-103: Setup PostgreSQL Local (Docker)

## 🎯 Intent

Chạy PostgreSQL 16 + Redis 7 local qua Docker Compose để dev không cần cài trực tiếp lên máy. Đảm bảo môi trường dev đồng nhất giữa các máy.

---

## ✅ Acceptance Criteria

- [ ] `docker-compose.yml` ở root chứa service `postgres` image `postgres:16-alpine`.
- [ ] Biến `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` đọc từ `.env`.
- [ ] Port `5432` expose ra host.
- [ ] Volume `pgdata` mount để data persist qua restart.
- [ ] Healthcheck `pg_isready` định kỳ — app chờ DB ready trước khi connect.
- [ ] `docker compose up -d` chạy, `docker compose ps` thấy state `(healthy)`.
- [ ] DBeaver/TablePlus connect được tới `localhost:5432`.

---

## 📖 Giải thích `docker-compose.yml`

### Cấu trúc tổng quan

`services:` liệt kê các container cần chạy. Project này có 2: `postgres` và `redis`.

`volumes:` ở cuối file khai báo các named volume — Docker quản lý, data tồn tại qua restart.

---

### Service `postgres`

```yaml
image: postgres:16-alpine
```
Dùng PostgreSQL version 16, bản `alpine` — nhẹ hơn bản thường (~50MB vs ~300MB).

```yaml
container_name: ecom_postgres
```
Đặt tên cố định cho container thay vì Docker tự sinh tên ngẫu nhiên — dễ nhận ra khi chạy `docker ps`.

```yaml
restart: unless-stopped
```
Container tự khởi động lại nếu crash, trừ khi bạn tự tay `docker compose stop`.

```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER:-ecom_user}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ecom_pass}
  POSTGRES_DB: ${POSTGRES_DB:-ecom_db}
```
Cú pháp `${BIẾN:-mặc_định}` — đọc từ `.env` nếu có, nếu không thì dùng giá trị mặc định. Tách config ra `.env` để không hardcode password trong code.

```yaml
ports:
  - '${POSTGRES_PORT:-5432}:5432'
```
Format `host:container` — cổng `5432` bên trong container được map ra cổng `5432` của máy. DBeaver kết nối qua cổng này.

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```
Data Postgres lưu trong named volume `pgdata`. `docker compose down` rồi `up` lại vẫn còn data. Chỉ mất khi `docker compose down -v`.

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-ecom_user}']
  interval: 10s
  timeout: 5s
  retries: 5
```
Cứ 10 giây Docker chạy `pg_isready` để kiểm tra Postgres đã nhận kết nối được chưa. Sau 5 lần thất bại mới báo `unhealthy`.

> **Tại sao cần healthcheck?** Prisma kết nối DB ngay khi app start. Nếu không có healthcheck, app có thể connect vào Postgres đang khởi động và bị lỗi ngay từ đầu.

---

### Service `redis`

Cấu trúc tương tự Postgres. Healthcheck đơn giản hơn — chạy `redis-cli ping`, Redis trả `PONG` là healthy.

---

### `volumes:` (cuối file)

```yaml
volumes:
  pgdata:
  redisdata:
```
Khai báo 2 named volume. Docker tự quản lý vị trí lưu trữ trên máy — bạn không cần quan tâm path cụ thể.

---

## 🔧 Các lệnh hay dùng

```bash
docker compose up -d          # khởi động background
docker compose ps             # xem trạng thái (cần thấy healthy)
docker compose down           # dừng + xoá container, data vẫn còn
docker compose down -v        # dừng + xoá cả data volume (RESET TOÀN BỘ)
docker compose logs postgres  # xem logs postgres
docker compose restart        # restart tất cả
```

---

## 🔗 Liên quan

- [02-connect-postgres.md](./02-connect-postgres.md) — Kết nối Prisma vào PostgreSQL này.
