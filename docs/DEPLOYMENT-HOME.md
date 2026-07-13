# 🏠 Deploy tại nhà (PC làm server) + DuckDNS + tự host MinIO

> Biến thể của [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) khi bạn dùng chính máy tính của mình (không thuê VPS) làm server, public ra Internet qua domain miễn phí DuckDNS. Vẫn phù hợp cho demo/portfolio/học tập — không phải setup production-scale, và **rủi ro hơn VPS**: máy tắt/mất mạng/đổi IP là service down, không có SLA.

Kiến trúc: PC của bạn chạy Docker Compose gồm `postgres` + `redis` + `app` + `nginx` + `certbot` (như bản VPS) **cộng thêm** `minio` (tự host ảnh, thay vì Cloudflare R2) + `duckdns` (giữ DNS record trỏ đúng IP nhà bạn). Router nhà bạn port-forward 80/443 vào PC.

---

## 0. Chuẩn bị

- PC chạy 24/7 được (hoặc ít nhất trong lúc demo) — Windows 11 + Docker Desktop (WSL2 backend).
- Quyền truy cập trang quản trị router (thường `192.168.1.1` hoặc `192.168.0.1`).
- Tài khoản [DuckDNS](https://www.duckdns.org/) (đăng nhập bằng GitHub/Google, miễn phí, không cần thẻ).

## 1. Cài Docker Desktop

```powershell
winget install Docker.DockerDesktop
```

Mở Docker Desktop 1 lần, đảm bảo dùng **WSL2 backend** (Settings → General). Kiểm tra trong PowerShell:

```powershell
docker --version
docker compose version
```

## 2. Tạo subdomain DuckDNS

1. Vào [duckdns.org](https://www.duckdns.org/), đăng nhập.
2. Ở ô "sub domain", đặt tên (VD: `myecom` → domain đầy đủ là `myecom.duckdns.org`) → **add domain**.
3. Ghi lại **token** hiển thị ở đầu trang — dùng cho container `duckdns` ở bước 6.
4. DuckDNS tự điền IP hiện tại của bạn vào record — chưa cần chỉnh gì thêm, container `duckdns` sẽ tự cập nhật định kỳ sau này khi IP đổi.

## 3. Mở port trên router (port forwarding)

Vào trang quản trị router (thường `192.168.1.1`), tìm mục **Port Forwarding / Virtual Server**, thêm 2 rule trỏ về **IP LAN của PC** (xem bằng `ipconfig`, tìm IPv4 Address):

| External Port | Internal Port | Internal IP | Protocol |
|---|---|---|---|
| 80 | 80 | `<IP LAN của PC>` | TCP |
| 443 | 443 | `<IP LAN của PC>` | TCP |

> Nên đặt IP LAN của PC thành **static/reserved** trong router (DHCP reservation theo MAC) — nếu không, PC đổi IP nội bộ là port-forward trỏ sai máy.

Kiểm tra sau khi port-forward xong (từ mạng 4G/ngoài LAN, không dùng wifi nhà): `https://canyouseeme.org/` nhập port 80 → phải thấy "success" (dù chưa có gì chạy, sẽ báo connection refused chứ không phải timeout — timeout nghĩa là port-forward sai).

## 4. Đưa code lên PC

```powershell
git clone https://github.com/<your-username>/be-nest-ecom.git
cd be-nest-ecom
git checkout main
```

## 5. Cấu hình biến môi trường production

```powershell
Copy-Item .env.production.example .env.production
notepad .env.production
```

Điền thật (khác bản VPS ở 2 điểm: domain là DuckDNS, storage là MinIO tự host):

- `POSTGRES_PASSWORD` — random mạnh.
- `DATABASE_URL` — giữ nguyên host `postgres`.
- `JWT_SECRET` — random ≥32 ký tự.
- `CORS_ORIGINS` — origin frontend thật của bạn.
- Bỏ comment khối **"Home-server deploy"** ở cuối file, comment lại khối R2:
  - `PUBLIC_DOMAIN=myecom.duckdns.org`
  - `DUCKDNS_SUBDOMAIN=myecom`
  - `DUCKDNS_TOKEN=` — token lấy ở bước 2.
  - `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` — tự đặt random (đây chính là MinIO root user/password, không phải R2 credentials).
  - Giữ nguyên `STORAGE_ENDPOINT` / `STORAGE_PUBLIC_URL` dùng đúng domain DuckDNS của bạn.

## 6. Build & chạy

Từ bước này, **mọi lệnh `docker compose` đều cần thêm `-f docker-compose.home.yml`** so với bản VPS:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build postgres redis minio
# đợi healthcheck pass, rồi:
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build app
```

Kiểm tra config đã merge đúng (đặc biệt là network alias của domain trỏ vào nginx):

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml config
```

Chạy migration:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml exec app npx prisma migrate deploy
```

## 7. Nginx + SSL (2 bước) — dùng file config bản home

**Bước 1 — bootstrap HTTP-only:**

```powershell
(Get-Content nginx/conf.d/bootstrap.conf) -replace 'YOUR_DOMAIN', 'myecom.duckdns.org' | Set-Content nginx/conf.d/bootstrap.conf

docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d nginx duckdns
```

Xin chứng chỉ:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml run --rm certbot certonly `
  --webroot -w /var/www/certbot `
  -d myecom.duckdns.org `
  --email you@example.com --agree-tos --no-eff-email
```

> DuckDNS chỉ cấp 1 domain (không có `www.` con riêng) — không cần `-d www...` như bản VPS.

**Bước 2 — chuyển sang config HTTPS bản home (`app.home.conf.example`, có thêm location `/storage/` cho MinIO):**

```powershell
(Get-Content nginx/conf.d/app.home.conf.example) -replace 'YOUR_DOMAIN', 'myecom.duckdns.org' | Set-Content nginx/conf.d/app.home.conf.example
Move-Item nginx/conf.d/app.home.conf.example nginx/conf.d/app.conf
Remove-Item nginx/conf.d/bootstrap.conf
Remove-Item nginx/conf.d/app.conf.example   # bản VPS, không dùng ở đây

docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml restart nginx
```

## 8. Kiểm tra

```powershell
curl https://myecom.duckdns.org/health
curl https://myecom.duckdns.org/docs-json
```

Test upload ảnh (nếu dùng presigned URL flow) — quan trọng nhất vì đây là chỗ dễ vỡ nhất trong setup này: app container tự gọi ra domain public của chính nó để ký presigned URL. Nếu lỗi timeout/connection refused khi upload, kiểm tra lại network alias ở bước 6 (`docker compose ... config` phải thấy nginx có alias đúng domain).

## 9. Update / redeploy sau này

```powershell
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build app
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml exec app npx prisma migrate deploy
```

## 10. Gia hạn SSL

Giống bản VPS (`docs/DEPLOYMENT.md` mục 11), chỉ thêm `-f docker-compose.home.yml` vào lệnh cron.

## 11. Backup database

Giống bản VPS (`docs/DEPLOYMENT.md` mục 12), chỉ thêm `-f docker-compose.home.yml` vào lệnh cron.

## 12. Checklist bảo mật + rủi ro riêng của home-server

- [ ] Router: **chỉ** forward đúng 2 port 80/443 vào IP LAN của PC — không mở thêm port MinIO (9000/9001) ra ngoài, MinIO chỉ lộ qua nginx `/storage/`.
- [ ] DHCP reservation cho IP LAN của PC, tránh port-forward trỏ sai máy sau khi PC khởi động lại.
- [ ] Tắt UPnP trên router nếu không cần — tránh phần mềm khác tự mở thêm port ngoài ý muốn.
- [ ] `.env.production` quyền hạn chế, không commit.
- [ ] Hiểu rõ: mất điện/mất mạng nhà = service down, không có failover. Không dùng cho dữ liệu quan trọng thật.
- [ ] Backup database định kỳ ra **ngoài máy** (khác ổ đĩa/cloud) — nếu ổ cứng PC hỏng, volume Docker mất theo.
