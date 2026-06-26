# Task 04 — Kết nối Prisma với NestJS

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 03
**Ưu tiên**: 🔴 CAO (Data layer — mọi task sau đều cần)
**Trạng thái**: ✅ Done
**Spec gốc**: [02-connect-postgres.md](../../setup/02-database/02-connect-postgres.md)

> **Repo snapshot 2026-05-21:** repo chưa có thư mục `prisma/`, chưa có `@prisma/client`, `prisma` package, `PrismaModule`, `PrismaService`, hay `/health/ready`.

---

## 🎯 Mục tiêu & Ý nghĩa

Thiết lập Prisma ORM và inject vào NestJS DI container qua `PrismaService`.

- **Single PrismaClient instance**: `@Global()` + `PrismaModule` đảm bảo chỉ có 1 client duy nhất — tránh connection pool exhaustion khi nhiều module cùng khởi tạo `new PrismaClient()`.
- **Lifecycle hooks** (`OnModuleInit`, `OnModuleDestroy`): connect khi app start, disconnect khi app stop — không leak connection khi app restart.
- **Health contract rõ ràng**: phân biệt "app alive" (`/health/live`) với "app ready to serve traffic" (`/health/ready`). Giữ `GET /health` như alias của readiness để các tool cũ không gãy. Load balancer nên dùng `/health/ready`.
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

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected' };
  }

  @Get()
  async health() {
    return this.ready();
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

**AC-2: `/health/live` và `/health/ready` tách đúng trách nhiệm**

- **Given** app đang chạy
- **When** gọi `GET http://localhost:3000/health/live`
- **Then** response `200` dù downstream chưa được check

**AC-3: `/health/ready` phản biệt DB state**

- **Given** app đang chạy, DB connected
- **When** gọi `GET http://localhost:3000/health/ready`
- **Then** response `200 { "status": "ok", "db": "connected" }`

**AC-4: `/health/ready` fail khi DB down**

- **Given** postgres container bị stop (`docker compose stop postgres`)
- **When** gọi `GET http://localhost:3000/health/ready`
- **Then** response không phải `200` — app báo hiệu chưa ready (status 500 hoặc 503)

**AC-5: Không có multiple PrismaClient instances**

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

---

## 📚 Nội dung học sau task này

### Mục tiêu học rõ ràng

Sau task này, bạn **có thể**:
- **Giải thích** tại sao phải dùng `@Global()` PrismaModule thay vì `new PrismaClient()` trực tiếp
- **Phân biệt** `OnModuleInit` vs `OnModuleDestroy` và khi nào chúng được gọi
- **Phân biệt** liveness vs readiness health check — load balancer dùng cái nào
- **Giải thích** tại sao cần `postinstall: prisma generate` trong `package.json`
- **Trace** luồng từ `schema.prisma` → `prisma generate` → `PrismaClient`

---

### Concept 1 — Tại sao `PrismaService extends PrismaClient`

`PrismaService` không chỉ *wrap* `PrismaClient` — nó **là** `PrismaClient`, nhờ đó mọi nơi inject `PrismaService` có thể gọi `this.prisma.user.findMany()` trực tiếp.

```typescript
// PrismaService extends PrismaClient
// → có đầy đủ method: prisma.user.findMany(), prisma.$queryRaw, v.v.
// → ĐỒNG THỜI có thể thêm lifecycle hooks của NestJS

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();   // $connect() là method của PrismaClient
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Nếu không extend mà dùng composition:**
```typescript
// ❌ Cách này phải expose từng method hoặc dùng getter
export class PrismaService {
  private client = new PrismaClient();
  get user() { return this.client.user; } // phải viết cho từng model
}
```

---

### Concept 2 — `@Global()` và connection pool exhaustion

**Vấn đề:** Mỗi `new PrismaClient()` tạo 1 connection pool mới (mặc định 10 connections). 10 module × 10 connections = 100 connections — vượt quá giới hạn thông thường của PostgreSQL.

```
Không dùng @Global():
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ UserModule   │    │ ProductModule│    │ OrderModule  │
│ new Client() │    │ new Client() │    │ new Client() │
│ pool: 10     │    │ pool: 10     │    │ pool: 10     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       └────────────────────┴────────────────────┘
                    30 connections tới DB

Dùng @Global() PrismaModule:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ UserModule   │    │ ProductModule│    │ OrderModule  │
│ inject       │    │ inject       │    │ inject       │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       └────────────────────┴────────────────────┘
                    PrismaService (1 instance)
                         pool: 10
                    10 connections tới DB ✅
```

**`@Global()` có nghĩa là:** import `PrismaModule` 1 lần ở `AppModule`, các module con không cần import lại mà vẫn inject được `PrismaService`.

---

### Concept 3 — NestJS lifecycle hooks

```
App start:
NestFactory.create() → modules khởi tạo → onModuleInit() → app.listen()

App stop (Ctrl+C):
SIGTERM nhận → onModuleDestroy() → process exit
```

| Hook | Gọi khi | Dùng để |
|------|---------|---------|
| `OnModuleInit` | Sau khi module được khởi tạo | Connect DB, warm up cache |
| `OnModuleDestroy` | Trước khi module bị destroy | Disconnect DB, flush buffer |

> **Tại sao quan trọng:** Nếu không gọi `$disconnect()`, connection vẫn mở sau khi app tắt. Với container orchestration (K8s), app restart liên tục → connection leak tích lũy.

---

### Concept 4 — Liveness vs Readiness

```
Load balancer hỏi:               App trả lời:
─────────────────────────────────────────────────────
GET /health/live   →  "Tao còn sống không?"  →  200 { status: 'ok' }
                       (chỉ check process alive)

GET /health/ready  →  "Tao sẵn sàng nhận traffic chưa?"
                       (check DB connected)        →  200 nếu DB OK
                                                   →  500 nếu DB down
```

**Quy tắc:** Load balancer dùng `/health/ready` để route traffic. `/health/live` để K8s biết có nên restart container không.

| Endpoint | Check gì | Fail khi |
|----------|---------|---------|
| `/health/live` | Process running | Process crash (không check DB) |
| `/health/ready` | `SELECT 1` tới DB | DB down, network issue |
| `/health` | Alias của `/ready` | Giữ để backward compat |

**Tại sao `SELECT 1`?**
- Query nhẹ nhất có thể — không đọc/ghi data thật
- Chỉ verify connection pool hoạt động

---

### Concept 5 — `postinstall: prisma generate` và tại sao cần

```
npm install
    │
    └── postinstall script chạy tự động
            │
            └── prisma generate
                    │
                    └── đọc prisma/schema.prisma
                            │
                            └── generate TypeScript types vào node_modules/@prisma/client
```

**Vấn đề nếu thiếu:**
```bash
# Dev clone repo mới → npm install → chạy app
Error: Cannot find module '@prisma/client'
# hoặc: Type 'User' does not exist
```

`@prisma/client` chỉ là shell package — type thật được generate ra từ schema vào `node_modules`. Không có `postinstall`, mỗi dev mới phải nhớ chạy `npx prisma generate` thủ công.

---

### Bài tập thực hành

**Bài 1 — Verify lifecycle (3 phút)**
1. Chạy `npm run start:dev` → xác nhận log `Prisma connected`
2. Dừng app bằng `Ctrl+C` → không có error về unclosed connection

**Bài 2 — Test health endpoints (5 phút)**
```bash
# Liveness — luôn 200
curl http://localhost:3000/health/live

# Readiness — 200 khi DB OK
curl http://localhost:3000/health/ready

# Simulate DB down
docker compose stop postgres
curl http://localhost:3000/health/ready
# → phải fail (500) không phải timeout

# Khởi động lại
docker compose start postgres
curl http://localhost:3000/health/ready
# → 200 trở lại
```

**Bài 3 — Debug challenge (5 phút)**

Code dưới đây có 2 vấn đề — tìm và fix:

```typescript
// ❌ Vấn đề 1 và 2
@Module({
  providers: [PrismaService],
  // thiếu gì?
})
export class PrismaModule {}

// Trong ProductModule:
@Injectable()
export class ProductService {
  private prisma = new PrismaClient(); // vấn đề 2
}
```

<details>
<summary>Đáp án</summary>

**Vấn đề 1:** `PrismaModule` thiếu `exports: [PrismaService]` — module khác không inject được dù PrismaModule đã global.

**Vấn đề 2:** `new PrismaClient()` trực tiếp → tạo connection pool riêng → có thể dẫn đến connection exhaustion. Phải inject `PrismaService` qua constructor.

</details>

---

### Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|-------------|------------|-----|
| `Cannot find module '@prisma/client'` | Chưa chạy `prisma generate` | `npx prisma generate` |
| `[PrismaService] Prisma connected` không xuất hiện | `PrismaModule` chưa import vào `AppModule` | Thêm vào `AppModule.imports` |
| `/health/ready` timeout thay vì 500 | `$queryRaw` không có timeout | Thêm `{ timeout: 3000 }` hoặc dùng `@nestjs/terminus` |
| Module khác không inject được `PrismaService` | Thiếu `exports` trong `PrismaModule` | Thêm `exports: [PrismaService]` |
| Connection pool exhaustion | Nhiều module dùng `new PrismaClient()` | Chỉ dùng `PrismaService` được inject |

---

### Liên kết sang task tiếp theo

- **Task 05 (Prisma Schema):** Định nghĩa model User, Product, Order trong `schema.prisma` → chạy `prisma migrate dev`
- **Phase D (Observability):** Thêm Prisma query logging, slow query monitoring
- **Production:** Prisma connection pool tuning, read replica, Prisma Accelerate
