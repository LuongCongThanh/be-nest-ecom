# Task 02 — Environment Configuration

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 01
**Ưu tiên**: 🔴 CAO (Fail-fast safety — thiếu là crash ngay khi boot)
**Trạng thái**: ✅ Done
**Spec gốc**: [02-env-config.md](../../setup/01-project/02-env-config.md)

> **Repo snapshot 2026-05-21:** `ConfigModule`, Joi validation schema, typed config factories, `.env`/`.env.example` đã có. `main.ts` đã chuyển sang lấy port qua `ConfigService`; `process.env` hiện được giữ trong `src/config/**`.

---

## 📚 Bạn Sẽ Học Được Gì?

> **Sau task này, bạn sẽ có thể:** Thiết lập hệ thống config an toàn cho NestJS app — app crash ngay khi boot nếu thiếu env, thay vì crash lúc có traffic thật.

### 🧠 1. Tư Duy "Fail-Fast"

**Vấn đề thực tế:** App deploy xong, chạy được 30 phút, user gọi API đầu tiên → crash vì thiếu `JWT_SECRET`. Downtime, mất data, xấu hổ.

**Giải pháp:** Validate toàn bộ config **ngay khi boot** — nếu thiếu bất kỳ biến nào thì crash ngay, không cho app chạy. Đây là pattern chống một class lỗi phổ biến nhất khi deploy production.

### 🛠️ 2. Kỹ Năng Cụ Thể

| Bạn Học                      | Bạn Làm Được                                                         |
| ---------------------------- | -------------------------------------------------------------------- |
| **Joi validation schema**    | Khai báo contract rõ ràng: biến nào bắt buộc, kiểu gì, default là gì |
| **`ConfigModule.forRoot()`** | Đăng ký config global — không cần import lại ở từng module con       |
| **`registerAs()` factory**   | Nhóm config theo domain (`app`, `jwt`) thay vì flat object           |
| **Path alias** (`@config/`)  | Import sạch, không bị vỡ khi move file                               |
| **`process.env` isolation**  | Quy tắc kiến trúc: chỉ được dùng trong `src/config/**`               |

### 🔐 3. Security Mindset

- `JWT_SECRET` phải **tối thiểu 32 ký tự** — Joi enforce tự động, không cần nhớ
- Developer mới vào team chỉ cần đọc schema là biết cần set biến gì — không phải grep cả codebase

### 🏗️ 4. Pattern Kiến Trúc

```
.env file
   ↓ (đọc khi boot)
Joi validation schema  ← crash ngay nếu sai/thiếu
   ↓ (pass)
ConfigModule (global)
   ↓ (inject)
ConfigService → dùng trong bất kỳ service nào
```

> **Quy tắc:** Không bao giờ dùng `process.env.X` trực tiếp trong business logic — luôn inject `ConfigService`.

### ✅ 5. Cách Verify Bạn Đã Hiểu

Task này có **3 test case thực tế** để tự kiểm tra:

1. App chạy bình thường khi `.env` đầy đủ
2. App crash với message rõ ràng khi thiếu `JWT_SECRET`
3. App từ chối `JWT_SECRET` ngắn hơn 32 ký tự

### 🔭 6. Ngoài Phạm Vi Task Này

- Secret rotation (Vault, AWS Secrets Manager) → Phase E
- Config theo từng environment (`.env.staging`) → DevOps
- CORS config → Task 11

---

## 🎯 Mục tiêu & Ý nghĩa

Nguyên tắc: **app phải crash ngay khi khởi động nếu thiếu biến môi trường bắt buộc**, không để app chạy với config thiếu rồi crash lúc runtime (sau khi đã có traffic).

- **Fail-fast at boot**: lỗi config xuất hiện ngay khi deploy, không phải 30 phút sau khi user gọi API đầu tiên.
- **Joi validation schema**: đặt contract rõ ràng — developer mới biết chính xác cần set biến gì, không phải đọc toàn bộ codebase để tìm `process.env.X`.
- **Không dùng `process.env` trực tiếp ngoài `src/config/**`**: toàn bộ runtime config truy cập qua `ConfigService` được inject — testable, mockable, type-safe.
- **JWT_SECRET min 32 chars**: Joi enforce luôn — tránh deploy với secret yếu.

> Pattern này ngăn class lỗi "missing env in production" — một trong những lý do outage phổ biến nhất khi deploy lần đầu.

---

## 🛠️ Các bước thực hiện

### 1. Cài packages

```bash
npm install @nestjs/config joi
```

### 2. Tạo file validation schema

Tạo `src/config/env.validation.ts`:

```typescript
import Joi from 'joi';

// Validated at app startup — missing or invalid values will crash the process immediately.
export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(), // e.g. postgresql://user:pass@localhost:5432/ecom_db

  // JWT — min 32 chars on secret to ensure signing strength
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('30m'), // access token lifetime
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'), // refresh token lifetime

  // Redis
  REDIS_URL: Joi.string().required(), // e.g. redis://localhost:6379
});
```

### 3. Đăng ký ConfigModule trong AppModule

Mở `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // loads .env and exposes ConfigService app-wide
import { envValidationSchema } from '@config/env.validation';
import { HealthModule } from '@health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // no need to re-import ConfigModule in child modules
      validationSchema: envValidationSchema, // validate .env on startup; missing required vars crash the process
      validationOptions: {
        abortEarly: true, // stop at first invalid var instead of collecting all errors
      },
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

> **Tại sao dùng alias (`@config/`, `@health/`) thay vì relative import?**
> Relative import (`'./config/env.validation'`) hoạt động nhưng dễ vỡ: khi move file sang thư mục khác, phải tìm và sửa tất cả nơi import nó. Alias được khai báo một lần trong `tsconfig.json` — rename thư mục không làm vỡ import nào. Alias cũng dễ đọc hơn trong file sâu nhiều tầng thư mục.

### 4. Tạo typed config factories (nên có)

Tạo `src/config/app.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
}));
```

> `process.env` chỉ được phép xuất hiện trong `src/config/**` như ở file này. Các nơi khác phải đọc qua `ConfigService`.

### 5. Nạp config factories vào ConfigModule

Mở `src/app.module.ts`:

```typescript
import { appConfig, jwtConfig } from '@config/app.config';

ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, jwtConfig],
  validationSchema: envValidationSchema,
  validationOptions: {
    abortEarly: true,
  },
});
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: App crash rõ ràng nếu thiếu biến bắt buộc**

- **Given** file `.env` bị xóa hoặc thiếu `JWT_SECRET`
- **When** chạy `npm run start:dev`
- **Then** app crash ngay khi khởi động với error message rõ ràng: `"JWT_SECRET" is required` — **không** chạy tiếp rồi crash lúc sau

**AC-2: App khởi động bình thường với .env đầy đủ**

- **Given** `.env` có đủ tất cả biến bắt buộc
- **When** chạy `npm run start:dev`
- **Then** log `Nest application successfully started`, không có warning về config

**AC-3: JWT_SECRET yếu bị từ chối**

- **Given** `.env` có `JWT_SECRET=short` (ít hơn 32 ký tự)
- **When** chạy `npm run start:dev`
- **Then** app crash với message liên quan đến độ dài JWT_SECRET tối thiểu

**AC-4: `process.env` không được dùng trực tiếp ngoài `src/config/`**

- **Given** codebase sau Task 02
- **When** grep toàn bộ `src/` tìm `process.env`
- **Then** chỉ được phép xuất hiện trong `src/config/` — không có file nào khác dùng `process.env` trực tiếp

---

## Verify hoàn thành

### Test 1 — App chạy bình thường với .env đầy đủ

```bash
npm run start:dev
# Phải log: Nest application successfully started
```

### Test 2 — App crash nếu thiếu biến bắt buộc

Xóa tạm `JWT_SECRET` khỏi `.env`, rồi chạy:

```bash
npm run start:dev
# Phải crash với error: "JWT_SECRET" is required
```

Nhớ thêm lại `JWT_SECRET` vào `.env` sau khi test.

---

## 🚫 Ngoài phạm vi

- Secret rotation tự động (Vault, AWS Secrets Manager) → Phase E / ngoài scope
- Per-environment config file (`.env.staging`, `.env.production`) → DevOps, không phải dev task
- CORS origin configuration (cần ConfigService) → sẽ hoàn thiện trong Task 11 khi add Guards
- Feature flags / dynamic config → không trong Phase B

---

## Xong thì làm gì?

→ Mở task tiếp theo: [03-docker-postgres.md](./03-docker-postgres.md)
