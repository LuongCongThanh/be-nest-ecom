# Task E-03 — CI/CD Pipeline (GitHub Actions)

**Phase**: E — Verification
**Ước lượng**: 3–4 giờ
**Phụ thuộc**: Task E-01 (tests phải pass trước khi setup CI)
**Ưu tiên**: 🟡 MEDIUM (quality gate — không blocking ship nhưng nên có trước v1.0.0)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [06-cicd.md](../../setup/05-scale-infra/06-cicd.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Mỗi lần push code lên GitHub, pipeline tự động chạy lint → test → build và chặn merge nếu có lỗi.

- **Không cần nhớ chạy test thủ công**: CI chạy thay bạn mỗi khi mở PR.
- **Fail Fast**: nếu lint lỗi thì test không chạy — tiết kiệm thời gian và credit.
- **Immutable build artifact**: Docker image build một lần, dùng cho mọi môi trường (staging, prod).

Task này chia làm 2 phần:
- **Phần 1 — CI** (Continuous Integration): bắt buộc, làm ngay.
- **Phần 2 — CD** (Continuous Deployment): làm sau khi chọn được platform deploy.

---

## PHẦN 1 — CI: GitHub Actions

### Bước 1 — Dockerfile

Tạo `Dockerfile` ở root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

> Multi-stage build: image production chỉ chứa `dist/` + `node_modules` prod (không có devDependencies, không có source).

### Bước 2 — .dockerignore

Tạo `.dockerignore` ở root:

```
node_modules
dist
.env
.env.*
!.env.example
coverage
.git
*.log
README.md
```

### Bước 3 — Tạo thư mục workflows

```powershell
New-Item -ItemType Directory -Force .github/workflows
```

### Bước 4 — CI Workflow

Tạo `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  quality:
    name: Lint + Test + Build
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: ecom_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/ecom_test

      - name: Run migrations (test DB)
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/ecom_test

      - name: Unit tests
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/ecom_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret-32-chars-minimum!!
          JWT_EXPIRES_IN: 30m
          REFRESH_TOKEN_EXPIRES_IN: 7d
          NODE_ENV: test

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/ecom_test
```

> **Lưu ý quan trọng**: Nếu project dùng `prisma migrate dev` (dev migration) thì CI dùng `prisma migrate deploy` (production-safe — chỉ apply pending migrations, không tạo migration mới).

### Bước 5 — Bảo vệ nhánh main

Vào **GitHub → repo → Settings → Branches → Add branch protection rule**:

- Branch name pattern: `main`
- ☑ Require status checks to pass before merging
- ☑ Require branches to be up to date before merging
- Status checks: chọn `quality` (tên job trong workflow)
- ☑ Require pull request reviews before merging (tùy chọn)

Sau bước này, không thể merge PR nếu CI đỏ.

### Verify CI hoạt động

```powershell
# Push một commit lên GitHub
git add .github/workflows/ci.yml Dockerfile .dockerignore
git commit -m "ci(config): add GitHub Actions CI pipeline and Dockerfile"
git push
```

Vào **GitHub → repo → Actions** → thấy workflow chạy.

Tạo thử 1 PR với code lỗi lint → CI phải báo đỏ và block merge.

---

## PHẦN 2 — CD: Continuous Deployment

> ⚠️ Phần này làm **sau** khi chọn được platform deploy. Xem 3 lựa chọn bên dưới và chọn 1.

### Lựa chọn A — Railway (Đơn giản nhất)

**Khi nào chọn**: học tập, MVP, muốn deploy nhanh không cần quản lý server.

1. Tạo tài khoản tại [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo** → chọn repo này
3. Railway tự detect NestJS và build bằng `npm run build`
4. Thêm services: **PostgreSQL** + **Redis** (kéo thả trong Railway dashboard)
5. Vào **Variables** → thêm các env vars từ `.env.example`
6. Railway tự động redeploy mỗi khi push lên `main`

Không cần sửa thêm gì trong `.github/workflows/` — Railway tự handle CD.

---

### Lựa chọn B — Render

**Khi nào chọn**: tương tự Railway, free tier rộng hơn với static sites.

1. Tạo tài khoản tại [render.com](https://render.com)
2. **New Web Service → Connect GitHub** → chọn repo
3. Runtime: **Docker** (dùng `Dockerfile` đã tạo ở Bước 1)
4. Thêm **PostgreSQL** và **Redis** services trong Render dashboard
5. Điền env vars trong **Environment** tab

---

### Lựa chọn C — VPS tự quản (DigitalOcean / Hetzner)

**Khi nào chọn**: muốn học DevOps thực sự, full control, production-grade.

Thêm job `deploy` vào `.github/workflows/ci.yml`:

```yaml
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: quality           # chỉ chạy nếu CI pass
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/ecom
            git pull origin main
            docker compose pull
            docker compose up -d --build
            docker compose exec app npx prisma migrate deploy
```

Cần thêm secrets trong **GitHub → Settings → Secrets and variables → Actions**:
- `SSH_HOST` — IP của VPS
- `SSH_USER` — user SSH (thường là `ubuntu` hoặc `root`)
- `SSH_PRIVATE_KEY` — nội dung file `~/.ssh/id_rsa`

---

## ✅ Tiêu chí nghiệm thu (CI bắt buộc)

- [ ] `Dockerfile` build thành công local: `docker build -t ecom-api .`
- [ ] `.github/workflows/ci.yml` đã push lên GitHub
- [ ] Tab **Actions** trên GitHub hiện workflow chạy xanh khi push
- [ ] Tạo PR với lint lỗi → CI đỏ → không merge được
- [ ] Branch protection rule đã bật trên `main`

---

## Ghi audit log vào STATUS.md

```
[YYYY-MM-DD] [Phase E] [Task E-03 — CI/CD]
- ✅ Dockerfile multi-stage (builder + production)
- ✅ .github/workflows/ci.yml: lint + test + build on PR
- ✅ Branch protection: require CI pass before merge
- ⏳ CD: chưa chọn platform (Railway / Render / VPS)
Signed-off: self
```

---

## Xong thì làm gì?

→ Nếu chưa ship: quay lại [02-ship.md](./02-ship.md)
→ Nếu muốn thêm CD: chọn 1 trong 3 lựa chọn ở Phần 2 và làm theo
