# Learning Log

---

## Task 00 — Cài đặt Tools

**Date:** 2026-05-22
**Phase:** B — Foundation

### Task 00 — Kết quả verify

- Node.js v24.11.1 (yêu cầu v20+) ✅
- npm 11.13.0 ✅
- NestJS CLI 11.0.21 ✅
- Docker 29.1.3 + Compose v2.40.3 ✅
- Docker Desktop WSL2 backend, DBeaver, Postman — xác nhận thủ công ✅

### Task 00 — Ghi chú

- Tất cả tools đã cài sẵn trước khi bắt đầu Phase B — task này được verify nhanh, không cần cài mới.
- Node.js v24 (mới hơn v20 LTS) hoàn toàn tương thích với NestJS 11.

---

## Task 01 — Khởi tạo NestJS Project

**Date:** 2026-05-23
**Phase:** B — Foundation

### Task 01 — Kết quả verify

- `GET /health` → `200 { status: "ok", timestamp: "..." }` ✅
- `GET /api/v1/health` → `404` (prefix hoạt động đúng) ✅
- `npx tsc --noEmit` → 0 errors ✅
- Folder structure: `common/`, `config/`, `modules/`, `shared/`, `migrations/`, `health/` ✅

### Task 01 — Điều đã học

- `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` — `/health` nằm ngoài prefix để load balancer và Docker healthcheck gọi được mà không cần auth.
- `noUnusedLocals` và `noUnusedParameters` tắt có chủ ý — NestJS DI inject qua constructor, TypeScript sẽ báo false positive nếu bật 2 flag này.
- URL phải có đầy đủ `http://` — thiếu chữ `h` sẽ báo "Invalid protocol: ttp".

### Task 01 — Ghi chú

- Phần lớn code đã có sẵn từ commit trước — task này chủ yếu là verify và hiểu lý do thiết kế.

---
