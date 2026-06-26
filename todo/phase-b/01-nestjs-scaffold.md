# Task 01 — Khởi tạo NestJS Project

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 00 (tools)
**Ưu tiên**: 🔴 CAO (Foundation — sai ở đây phải refactor toàn bộ)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [planning/setup/01-project/01-bootstrap-nestjs.md](../../planning/setup/01-project/01-bootstrap-nestjs.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Project structure được thiết lập ở task này là **DNA của toàn bộ dự án** — mọi module sau đều kế thừa quyết định ở đây.

- **Strict TypeScript**: `strict: true` bắt lỗi null/undefined ngay lúc compile thay vì runtime. Phase B gõ nền cho mọi feature sau — nếu không strict từ đầu, mọi người sẽ lazy-type `any` và bugs sẽ trốn đến production.
- **Domain-driven folder structure**: `src/modules/identity/`, `src/modules/catalog/` thay vì flat `src/controllers/`. Khi mỗi domain có module riêng, 2 developer không va nhau khi làm 2 domain song song.
- **Path aliases** (`@common/*`, `@modules/*`): tránh địa ngục `../../../common/...` 5 tầng thư mục. Rename thư mục không làm vỡ toàn bộ import.
- **Health endpoint** ngoài `/api/v1`: cho phép load balancer và Docker healthcheck gọi `/health` mà không cần auth token.

> Nếu làm sai cấu trúc thư mục hay tsconfig ở đây → phải rename/move file trên toàn codebase sau. Làm đúng ngay từ đầu.

---

## 🛠️ Các bước thực hiện

### 1. Tạo project NestJS

Đứng tại thư mục `E:\my-pj\be-nest-ecom\` (thư mục đã tồn tại), scaffold vào thư mục hiện tại:

```powershell
nest new . --strict --skip-git --package-manager npm
```

> NestJS CLI sẽ hỏi tên package — nhập `be-nest-ecom`.

### 2. Tạo cấu trúc thư mục domain-driven

```powershell
mkdir src/common, src/config, src/modules, src/shared, src/migrations
mkdir src/common/filters, src/common/guards, src/common/decorators
mkdir src/common/interceptors, src/common/pipes, src/common/repositories
```

Cấu trúc cuối cùng:
```
src/
  common/           ← filters, guards, decorators, interceptors, pipes, repositories
  config/           ← ConfigModule, validation schema (Task 02)
  modules/          ← domain modules: identity/, catalog/, cart/, order/, payment/
  migrations/       ← Prisma migration files (Task 06)
  shared/           ← utils, constants, types dùng chung
  app.module.ts
  main.ts
```

### 3. Cấu hình tsconfig.json — strict mode

Mở `tsconfig.json`, đảm bảo có:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

> `noUnusedLocals/Parameters` tắt có chủ ý — NestJS decorators và DI constructors thường có param chưa dùng ngay.

### 4. Cài thêm package hỗ trợ path alias

```powershell
npm install --save-dev tsconfig-paths
```

Thêm vào `tsconfig.json` (phần `compilerOptions`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

> `tsconfig.build.json` chưa cần sửa — Phase B chỉ dùng `start:dev`. Sẽ cấu hình build production sau.

### 5. Cập nhật main.ts

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // CORS sẽ được cấu hình đúng ở Task 02 sau khi có ConfigService.
  // CONVENTIONS §6.1 cấm dùng process.env trực tiếp trong code.

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on port ${port}`, 'Bootstrap');
}
bootstrap();
```

### 6. Tạo Health endpoint

```powershell
nest generate module health
nest generate controller health --no-spec
```

Trong `health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

> Endpoint này nằm ở `/health` (ngoài prefix `/api/v1`) nhờ `exclude: ['health']` ở bước 5.
> Task 07 sẽ nâng cấp lên `@nestjs/terminus` với `/health/live` và `/health/ready` sau khi có DB.

### 7. Tạo .env.example

Tạo file `.env.example` ở root:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ecom_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3001
LOG_FORMAT=pretty
LOG_LEVEL=debug
```

Tạo `.env` từ example (PowerShell):
```powershell
Copy-Item .env.example .env
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Health endpoint phản hồi đúng**

- **Given** app đang chạy với `npm run start:dev`
- **When** gọi `GET http://localhost:3000/health`
- **Then** response `200 { "status": "ok", "timestamp": "..." }` — **không có** prefix `/api/v1/`

**AC-2: TypeScript strict mode hoạt động**

- **Given** tsconfig.json có `strict: true`
- **When** chạy `npx tsc --noEmit`
- **Then** không có TypeScript error nào

**AC-3: Global prefix `/api/v1` được set**

- **Given** app đang chạy
- **When** gọi `GET http://localhost:3000/api/v1/health` (có prefix)
- **Then** response `404` — health nằm ngoài prefix, xác nhận prefix đang hoạt động

**AC-4: Folder structure đúng**

- **Given** project đã scaffold
- **When** kiểm tra cấu trúc `src/`
- **Then** tồn tại các thư mục: `common/`, `config/`, `modules/`, `shared/`, `migrations/`

---

## Verify hoàn thành

```powershell
npm run start:dev
```

Phải thấy log:
```
[Nest] LOG [NestApplication] Nest application successfully started
[Bootstrap] Application running on port 3000
```

Mở browser hoặc REST Client, gọi:
```
GET http://localhost:3000/health
```

Phải trả:
```json
{ "status": "ok", "timestamp": "..." }
```

> Lưu ý: `/health` — **không có** `/api/v1/` prefix.

---

## 🚫 Ngoài phạm vi

- Cấu hình CORS đầy đủ (origin whitelist) → Task 02 (sau khi có ConfigService)
- Swagger/OpenAPI setup → Phase D Task 02
- Docker container cho NestJS app → Phase E (shipping)
- PM2 / production process manager → Phase E
- CI/CD pipeline → Phase E
- `tsconfig.build.json` production build optimization → Phase E

---

## Xong thì làm gì?

→ Mở task tiếp theo: [02-env-config.md](./02-env-config.md)
