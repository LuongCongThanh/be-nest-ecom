# Task 00 — Cài đặt Tools

**Phase**: B — Foundation
**Ước lượng**: 1-2 giờ
**Phụ thuộc**: không có
**Ưu tiên**: 🟢 THẤP (Prerequisites)
**Trạng thái**: ⏳ Not started
**OS**: Windows 11

---

## 🎯 Mục tiêu & Ý nghĩa

Đây là task "unlock" — không tạo ra code nhưng thiếu bất kỳ tool nào ở đây thì **toàn bộ các task tiếp theo bị block** hoàn toàn.

- **WSL2 + Docker**: không có WSL2 thì Docker Desktop không chạy được trên Windows 11 — không có PostgreSQL, không có Redis.
- **NestJS CLI**: không có thì không scaffold được project ở Task 01.
- **DBeaver + Postman**: không bắt buộc về mặt technical nhưng nếu thiếu thì verify ở mọi task sau rất khó (không xem được DB, không test được API thủ công).
- Cài một lần, dùng suốt toàn bộ dự án.

---

## 🛠️ Các bước thực hiện

### 1. Bật WSL2 (bắt buộc trên Windows — Docker cần cái này)

WSL2 = Windows Subsystem for Linux — cho phép Docker Desktop chạy container trên Windows.

Mở **PowerShell với quyền Administrator** (chuột phải → Run as Administrator):

```powershell
wsl --install
```

Khởi động lại máy khi được yêu cầu.

Sau khi restart, mở PowerShell và verify:
```powershell
wsl --version
# Phải ra: WSL version 2.x.x
```

> Nếu máy đã có WSL2 rồi thì bỏ qua bước này.

---

### 2. Node.js 20 LTS

- [ ] Tải và cài Node.js 20 LTS từ https://nodejs.org (chọn bản **LTS**, không chọn Current)
- [ ] Verify trong PowerShell/Terminal:
```bash
node -v   # phải ra v20.x.x
npm -v    # phải ra 10.x.x
```

---

### 3. NestJS CLI

```bash
npm install -g @nestjs/cli
```

Verify:
```bash
nest --version   # ra version là OK
```

---

### 4. Docker Desktop

- [ ] Tải Docker Desktop từ https://www.docker.com/products/docker-desktop (chọn **Windows**)
- [ ] Cài xong → mở Docker Desktop
- [ ] Vào **Settings → General** → đảm bảo **"Use WSL 2 based engine"** được tick ✅
- [ ] Chờ Docker Desktop status chuyển sang **"Engine running"** (icon xanh ở taskbar)

Verify trong terminal:
```bash
docker --version          # Docker version 24.x.x
docker compose version    # Docker Compose version v2.x.x
```

> **Lưu ý:** Docker Desktop phải đang chạy mỗi khi bạn làm việc với project. Nếu Docker không chạy thì PostgreSQL và Redis sẽ không start được.

---

### 5. DBeaver (xem dữ liệu PostgreSQL bằng UI)

- [ ] Tải DBeaver Community (miễn phí) từ https://dbeaver.io/download → chọn **Windows Installer**
- [ ] Cài xong, mở được app là OK

DBeaver dùng để: xem bảng, xem data, chạy SQL query trực tiếp — không cần dùng terminal.

---

### 6. Postman (test API)

- [ ] Tải Postman từ https://www.postman.com/downloads → chọn **Windows 64-bit**
- [ ] Cài xong, mở app
- [ ] Tạo tài khoản miễn phí (hoặc skip, vẫn dùng được offline)

Postman dùng để: gọi các API endpoint, xem request/response, lưu thành collection để test lại.

---

### 7. VSCode Extensions

Mở VSCode → Extensions (`Ctrl+Shift+X`) → tìm và cài:

- [ ] **ESLint** — publisher: Microsoft
- [ ] **Prettier - Code formatter** — publisher: Prettier
- [ ] **Prisma** — publisher: Prisma
- [ ] **NestJS Snippets** — tùy chọn, giúp tạo boilerplate nhanh

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Tất cả tools cài thành công và respond đúng version**

- **Given** Windows 11 với WSL2 đã enable
- **When** chạy các lệnh verify bên dưới trong PowerShell
- **Then** mỗi lệnh đều trả version đúng, không có error

**AC-2: Docker Desktop chạy với WSL2 backend**

- **Given** Docker Desktop đã cài và khởi động
- **When** mở Settings → General
- **Then** checkbox "Use WSL 2 based engine" được tick; status bar ở dưới cùng hiện "Engine running" màu xanh

**AC-3: DBeaver và Postman mở được**

- **Given** đã cài cả hai ứng dụng
- **When** double-click icon để mở
- **Then** cả hai launch thành công, không crash

---

## Verify hoàn thành

Mở PowerShell/Terminal, chạy tất cả lệnh sau — tất cả phải thành công:

```bash
node -v           # v20.x.x
npm -v            # 10.x.x
nest --version    # x.x.x
docker --version  # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

Và kiểm tra thêm:
- [ ] Docker Desktop đang chạy (icon ở taskbar)
- [ ] DBeaver mở được
- [ ] Postman mở được
- [ ] VSCode có các extensions đã cài

---

## 🚫 Ngoài phạm vi

- Cấu hình WSL2 distro nâng cao (Ubuntu version, memory limit) → không cần thiết cho dev
- Cấu hình Docker Desktop cho team-shared (registry, org settings) → ngoài phạm vi cá nhân
- Cài thêm tool CI/CD (GitHub Actions runner, Jenkins) → Phase E
- Cấu hình git hooks → Task setup riêng

---

## Xong thì làm gì?

→ Mở task tiếp theo: [01-nestjs-scaffold.md](./01-nestjs-scaffold.md)
