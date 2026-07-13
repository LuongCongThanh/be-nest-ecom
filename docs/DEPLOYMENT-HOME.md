# 🏠 Deploy tại nhà (PC làm server) qua ngrok + tự host MinIO

> Biến thể của [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) khi bạn dùng chính máy tính của mình (không thuê VPS) làm server, public ra Internet qua [ngrok](https://ngrok.com/) — không cần domain riêng, không cần port-forward router, không cần certbot. Vẫn phù hợp cho demo/portfolio/học tập — không phải setup production-scale, và **rủi ro hơn VPS**: máy tắt/mất mạng là service down, không có SLA.

Kiến trúc: PC của bạn chạy Docker Compose gồm `postgres` + `redis` + `app` + `nginx` (như bản VPS, nhưng **không cần** `certbot`) **cộng thêm** `minio` (tự host ảnh, thay Cloudflare R2) + `ngrok` (giữ tunnel outbound ra ngrok edge, ngrok tự lo TLS). Router nhà bạn **không cần chỉnh gì** — ngrok chỉ tạo kết nối đi ra (outbound), không cần mở port vào.

---

## 0. Chuẩn bị

- PC chạy 24/7 được (hoặc ít nhất trong lúc demo) — Windows 11 + Docker Desktop (WSL2 backend).
- Tài khoản [ngrok](https://dashboard.ngrok.com/signup) (miễn phí, không cần thẻ).

## 1. Cài Docker Desktop

```powershell
winget install Docker.DockerDesktop
```

Mở Docker Desktop 1 lần, đảm bảo dùng **WSL2 backend** (Settings → General). Kiểm tra trong PowerShell:

```powershell
docker --version
docker compose version
```

## 2. Lấy authtoken + đặt static domain miễn phí trên ngrok

1. Đăng ký/đăng nhập [dashboard.ngrok.com](https://dashboard.ngrok.com/).
2. Vào **Your Authtoken** — copy token, dùng cho `NGROK_AUTHTOKEN` ở bước 5.
3. Vào **Domains** → **+ Create Domain** — free plan cho 1 domain tĩnh dạng `xxx.ngrok-free.app`, bạn tự đặt phần `xxx`. Đây là domain cố định, **không đổi** mỗi lần restart container (khác với chạy `ngrok http 3000` tay không có domain, sẽ ra domain ngẫu nhiên đổi liên tục).
4. Ghi lại domain đầy đủ (VD: `myecom.ngrok-free.app`) — dùng cho `NGROK_DOMAIN`.

> Lưu ý free plan: người xem mở domain này bằng trình duyệt lần đầu sẽ thấy 1 trang cảnh báo interstitial ("You are about to visit...") — bấm **Visit Site** để qua. Gọi API bằng Postman/code thì thêm header `ngrok-skip-browser-warning: true` để bỏ qua hẳn trang này.

## 3. Đưa code lên PC

```powershell
git clone https://github.com/<your-username>/be-nest-ecom.git
cd be-nest-ecom
git checkout main
```

## 4. Cấu hình biến môi trường production

```powershell
Copy-Item .env.production.example .env.production
notepad .env.production
```

Điền thật (khác bản VPS ở 2 điểm: domain là ngrok, storage là MinIO tự host):

- `POSTGRES_PASSWORD` — random mạnh.
- `DATABASE_URL` — giữ nguyên host `postgres`.
- `JWT_SECRET` — random ≥32 ký tự.
- `CORS_ORIGINS` — origin frontend thật của bạn.
- Bỏ comment khối **"Home-server deploy"** ở cuối file, comment lại khối R2:
  - `NGROK_AUTHTOKEN` — token lấy ở bước 2.
  - `NGROK_DOMAIN=myecom.ngrok-free.app` — domain tĩnh đã tạo ở bước 2.
  - `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` — tự đặt random (đây chính là MinIO root user/password, không phải R2 credentials).
  - Giữ nguyên `STORAGE_ENDPOINT` / `STORAGE_PUBLIC_URL` dùng đúng domain ngrok của bạn.

## 5. Cấu hình nginx (không cần certbot)

```powershell
Move-Item nginx/conf.d/app.home.conf.example nginx/conf.d/app.conf
Remove-Item nginx/conf.d/bootstrap.conf
Remove-Item nginx/conf.d/app.conf.example   # bản VPS (có SSL/certbot), không dùng ở đây
```

## 6. Build & chạy

Mọi lệnh `docker compose` đều cần thêm `-f docker-compose.home.yml` so với bản VPS:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build postgres redis minio
# đợi healthcheck pass, rồi:
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build app nginx ngrok
```

Kiểm tra config đã merge đúng:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml config
```

Chạy migration:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml exec app npx prisma migrate deploy
```

Xem log ngrok để lấy URL/kiểm tra tunnel đã lên chưa:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml logs -f ngrok
```

## 7. Kiểm tra

```powershell
curl https://myecom.ngrok-free.app/health -H "ngrok-skip-browser-warning: true"
curl https://myecom.ngrok-free.app/docs-json -H "ngrok-skip-browser-warning: true"
```

Mở `https://myecom.ngrok-free.app/docs` trên trình duyệt (bấm qua trang cảnh báo interstitial 1 lần) để thấy Swagger UI.

Test upload ảnh (nếu dùng presigned URL flow) — quan trọng nhất vì app container tự gọi ra domain public của chính nó (qua ngrok) để ký presigned URL. Vì ngrok là dịch vụ ngoài (không phải IP nhà bạn), sẽ không gặp vấn đề NAT hairpin như cách port-forward truyền thống — nhưng nếu lỗi timeout, kiểm tra lại container `ngrok` còn sống (`docker compose ... logs ngrok`) và `NGROK_DOMAIN` khớp đúng domain đã tạo.

## 8. Update / redeploy sau này

```powershell
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build app
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.home.yml exec app npx prisma migrate deploy
```

## 9. Backup database

Giống bản VPS (`docs/DEPLOYMENT.md` mục 12), chỉ thêm `-f docker-compose.home.yml` vào lệnh cron.

## 10. Checklist bảo mật + rủi ro riêng của home-server

- [ ] `NGROK_AUTHTOKEN` không commit, không chia sẻ — ai có token này chạy tunnel dưới domain của bạn được.
- [ ] Container `ngrok` phải luôn chạy (`restart: unless-stopped`) — nếu nó chết, domain không phản hồi dù `app`/`nginx` vẫn sống bình thường.
- [ ] `.env.production` quyền hạn chế, không commit.
- [ ] Hiểu rõ: mất điện/mất mạng nhà = service down, không có failover. Không dùng cho dữ liệu quan trọng thật.
- [ ] Free plan ngrok có giới hạn băng thông/kết nối — không hợp cho traffic thật, chỉ demo.
- [ ] Backup database định kỳ ra **ngoài máy** (khác ổ đĩa/cloud) — nếu ổ cứng PC hỏng, volume Docker mất theo.
