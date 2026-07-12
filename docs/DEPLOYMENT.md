# 🚀 Deploy lên VPS (hướng dẫn từ đầu)

> Mục tiêu: có 1 VPS chạy app này thật, qua domain riêng, HTTPS. Phù hợp cho demo/portfolio — **không** phải setup production-scale (load balancer, auto-scaling, read replica) — đó là scope `TASK-309` (Phase F, chưa cần tới).

Kiến trúc: 1 VPS chạy Docker Compose gồm `postgres` + `redis` + `app` (NestJS, container tự build từ `Dockerfile`) + `nginx` (reverse proxy, terminate SSL) + `certbot` (lấy chứng chỉ Let's Encrypt miễn phí). Ảnh/media dùng **Cloudflare R2** (không tự host MinIO trên VPS — đỡ phải mở thêm domain/policy cho bucket).

---

## 0. Chuẩn bị

- 1 thẻ thanh toán (hầu hết nhà cung cấp VPS tính theo giờ/tháng, vài đô/tháng).
- 1 domain đã mua (Namecheap, Godaddy, Matbao, PA Vietnam... — cái nào cũng được, chỉ cần chỉnh được DNS).

## 1. Tạo VPS

Gợi ý nhà cung cấp rẻ, đủ dùng cho demo (1 vCPU / 1-2GB RAM là đủ):

- **Hetzner Cloud** (rẻ nhất, ~€4/tháng) — cần xác minh danh tính kỹ hơn.
- **DigitalOcean** ($6/tháng Droplet) — UI dễ dùng nhất cho người mới.
- **Vultr / Contabo** — tương đương DigitalOcean.

Khi tạo:

- OS: **Ubuntu 24.04 LTS**.
- Thêm SSH key của bạn lúc tạo (đừng dùng password login).
- Ghi lại **IP public** của VPS.

## 2. Trỏ domain về VPS

Vào trang quản lý DNS của domain, thêm 2 record:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `<IP VPS>` |
| A | `www` | `<IP VPS>` |

Đợi DNS propagate (thường vài phút đến 1 giờ). Kiểm tra: `ping yourdomain.com` phải ra đúng IP VPS.

## 3. SSH vào VPS lần đầu + hardening cơ bản

```bash
ssh root@<IP_VPS>

# Tạo user thường, không dùng root cho việc hàng ngày
adduser deploy
usermod -aG sudo deploy

# Copy SSH key sang user mới
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Firewall — chỉ mở SSH, HTTP, HTTPS
apt update && apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Từ đây, SSH lại bằng `ssh deploy@<IP_VPS>` cho các bước sau.

## 4. Cài Docker + Docker Compose plugin

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # để không cần sudo cho lệnh docker
docker --version
docker compose version
```

## 5. Đưa code lên VPS

```bash
git clone https://github.com/<your-username>/be-nest-ecom.git
cd be-nest-ecom
git checkout main   # hoặc branch bạn muốn deploy
```

> Repo cần push lên GitHub (hoặc GitLab) trước — VPS pull code qua git, không copy tay từ máy local.

## 6. Cấu hình biến môi trường production

```bash
cp .env.production.example .env.production
nano .env.production
```

Điền thật:
- `POSTGRES_PASSWORD` — random mạnh (`openssl rand -base64 24`).
- `DATABASE_URL` — thay đúng password vừa đặt (giữ nguyên host `postgres`, đó là tên service trong Docker network, không phải `localhost`).
- `JWT_SECRET` — random ≥32 ký tự (`openssl rand -base64 32`).
- `CORS_ORIGINS` — domain frontend thật của bạn (không để `*` ở production).
- `STORAGE_*` — tạo bucket + API token trên [Cloudflare R2 dashboard](https://dash.cloudflare.com/), điền vào.

File `.env.production` **không được commit** — đã có trong `.dockerignore`, nhưng cũng nên thêm vào `.gitignore` nếu chưa có.

## 7. Build & chạy

```bash
docker compose -f docker-compose.prod.yml up -d --build postgres redis
# đợi vài giây cho healthcheck pass, rồi:
docker compose -f docker-compose.prod.yml up -d --build app
```

Chạy migration (1 lần, và mỗi lần sau này có migration mới):

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Kiểm tra app sống (chưa qua Nginx, gọi thẳng container):

```bash
docker compose -f docker-compose.prod.yml exec app wget -qO- http://localhost:3000/health
```

## 8. Nginx + SSL (2 bước)

**Bước 1 — bootstrap HTTP-only** để certbot verify domain lần đầu (chưa có cert thì không thể bật HTTPS ngay):

```bash
# sửa YOUR_DOMAIN trong file thành domain thật
sed -i 's/YOUR_DOMAIN/yourdomain.com/' nginx/conf.d/bootstrap.conf

docker compose -f docker-compose.prod.yml up -d nginx
```

Xin chứng chỉ:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email you@example.com --agree-tos --no-eff-email
```

**Bước 2 — chuyển sang config HTTPS thật**:

```bash
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx/conf.d/app.conf.example
mv nginx/conf.d/app.conf.example nginx/conf.d/app.conf
rm nginx/conf.d/bootstrap.conf

docker compose -f docker-compose.prod.yml restart nginx
```

## 9. Kiểm tra

```bash
curl https://yourdomain.com/health
curl https://yourdomain.com/docs-json | head -c 200   # Swagger JSON
```

Mở `https://yourdomain.com/docs` trên trình duyệt để thấy Swagger UI.

## 10. Update / redeploy sau này

```bash
cd be-nest-ecom
git pull
docker compose -f docker-compose.prod.yml up -d --build app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## 11. Gia hạn SSL

Chứng chỉ Let's Encrypt hết hạn sau 90 ngày. Thêm cron trên VPS:

```bash
# crontab -e
0 3 * * 1 cd /home/deploy/be-nest-ecom && docker compose -f docker-compose.prod.yml run --rm certbot renew --webroot -w /var/www/certbot && docker compose -f docker-compose.prod.yml restart nginx
```

## 12. Backup database (tối thiểu)

```bash
# crontab -e — backup hàng ngày, giữ 7 bản gần nhất
0 2 * * * cd /home/deploy/be-nest-ecom && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ecom_user ecom_db | gzip > /home/deploy/backups/db-$(date +\%Y\%m\%d).sql.gz && find /home/deploy/backups -mtime +7 -delete
```

(Tạo thư mục `/home/deploy/backups` trước.)

## 13. Checklist bảo mật cơ bản

- [ ] SSH chỉ dùng key, không password (`PasswordAuthentication no` trong `/etc/ssh/sshd_config`).
- [ ] `postgres`/`redis` **không** publish port ra host (đã đúng trong `docker-compose.prod.yml` — chỉ `app` và `nginx` mới expose).
- [ ] `.env.production` chỉ tồn tại trên VPS, không commit, quyền file `600`.
- [ ] `CORS_ORIGINS` là domain thật, không phải `*`.
- [ ] UFW chỉ mở 22/80/443.
- [ ] `STORAGE_*` dùng credentials R2 riêng cho production, khác với credentials MinIO dev.
