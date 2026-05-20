# Task 04 — Kết nối Prisma với NestJS

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 03
**Ưu tiên**: 🔴 CAO (Data layer — mọi task sau đều cần)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [planning/setup/02-database/02-connect-postgres.md](../../planning/setup/02-database/02-connect-postgres.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Thiết lập Prisma ORM và inject vào NestJS DI container qua `PrismaService`.

- **Single PrismaClient instance**: `@Global()` + `PrismaModule` đảm bảo chỉ có 1 client duy nhất — tránh connection pool exhaustion khi nhiều module cùng khởi tạo `new PrismaClient()`.
- **Lifecycle hooks** (`OnModuleInit`, `OnModuleDestroy`): connect khi app start, disconnect khi app stop — không leak connection khi app restart.
- **`/health/ready` endpoint**: phân biệt "app alive" (`/health`) với "app ready to serve traffic" (`/health/ready`). Load balancer dùng `/health/ready` để biết lúc nào route traffic vào — nếu DB chưa connect, `/health/ready` trả lỗi.
- **`postinstall: prisma generate`**: tự generate Prisma Client sau `npm install` — tránh lỗi "Cannot find module '@prisma/client'" trên môi trường mới.
- **PrismaModule chỉ cung cấp client dùng chung**: business logic không `new PrismaClient()` ở bất kỳ đâu khác.

---

## 🛠️ Các bước thực hiện

### 1. Cài packages

```bash
npm install @prisma/client
npm install --save-dev prisma
```

### 2. Khởi tạo Prisma

```bash
npx prisma init
```

Lệnh này tạo:
- `prisma/schema.prisma` — file định nghĩa schema
- Thêm `DATABASE_URL` gợi ý vào `.env`

### 3. Cập nhật prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Tạo PrismaService

Tạo `src/common/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 5. Tạo PrismaModule (Global)

Tạo `src/common/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 6. Đăng ký PrismaModule trong AppModule

```typescript
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ ... }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 7. Cập nhật Health endpoint để check DB

Trong `health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected' };
  }
}
```

### 8. Thêm prisma generate vào package.json

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Prisma kết nối thành công và log rõ ràng**

- **Given** Docker postgres đang healthy, `.env` có `DATABASE_URL` đúng
- **When** chạy `npm run start:dev`
- **Then** log `[PrismaService] Prisma connected` xuất hiện trong console

**AC-2: `/health/ready` phản biệt DB state**

- **Given** app đang chạy, DB connected
- **When** gọi `GET http://localhost:3000/health/ready`
- **Then** response `200 { "status": "ok", "db": "connected" }`

**AC-3: `/health/ready` fail khi DB down**

- **Given** postgres container bị stop (`docker compose stop postgres`)
- **When** gọi `GET http://localhost:3000/health/ready`
- **Then** response không phải `200` — app báo hiệu chưa ready (status 500 hoặc 503)

**AC-4: Không có multiple PrismaClient instances**

- **Given** nhiều module import PrismaService
- **When** chạy app và kiểm tra connection pool
- **Then** chỉ có 1 PrismaClient instance (đảm bảo qua `@Global()` PrismaModule)

---

## Verify hoàn thành

```bash
npm run start:dev
# Phải thấy log: Prisma connected
```

Gọi API:
```
GET http://localhost:3000/health/ready
```

Phải trả:
```json
{ "status": "ok", "db": "connected" }
```

---

## 🚫 Ngoài phạm vi

- Prisma query logging / slow query monitoring → Phase D (Observability)
- Database connection pool tuning → production optimization, ngoài scope
- Prisma middleware (soft-delete middleware, audit logging) → nếu cần sẽ thêm sau
- Multiple datasource (read replica) → architecture sau khi có load requirements
- Prisma Accelerate / Edge client → production optimization

---

## Xong thì làm gì?

→ Mở task tiếp theo: [05-prisma-schema.md](./05-prisma-schema.md)
