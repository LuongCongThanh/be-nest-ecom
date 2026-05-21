# Task 02b — Swagger UI Setup

**Phase**: B — Foundation
**Ước lượng**: 30 phút
**Phụ thuộc**: Task 02
**Ưu tiên**: 🔴 CAO (Developer experience — cần ngay khi setup project để test API trong suốt quá trình build)
**Trạng thái**: ✅ Done

> **Repo snapshot 2026-05-21:** Swagger đã được bootstrap ở `/docs` với `addBearerAuth()`. Bootstrap hiện đã lấy port qua `ConfigService`, khớp với hướng dẫn task.

---

## 🎯 Mục tiêu & Ý nghĩa

Setup Swagger UI ngay từ đầu để có thể test API endpoint trực tiếp trên browser trong suốt quá trình phát triển.

- **Không cần Postman collection**: Swagger tự generate UI từ code — luôn đồng bộ với implementation, không bao giờ outdated.
- **`addBearerAuth()`**: cho phép nhập JWT token trong Swagger UI để test protected endpoints — không phải copy-paste thủ công vào header.
- **Đặt ở `/docs`** (ngoài prefix `api/v1`): URL ngắn, dễ nhớ, không bị ảnh hưởng khi thay đổi API version prefix.

> Phase D Task 02 (`todo/phase-d/02-swagger.md`) sẽ bổ sung decorator `@ApiProperty`, `@ApiOperation` cho từng DTO và controller sau khi các feature đã implement. Task này chỉ setup nền.

---

## 🛠️ Các bước thực hiện

### 1. Cài package

```bash
npm install @nestjs/swagger
```

### 2. Cập nhật main.ts

```typescript
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('NestJS e-commerce backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
```

> Task này kế thừa Task 02, nên từ đây trở đi không dùng `process.env` trực tiếp trong bootstrap nữa.

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Swagger UI accessible**

- **Given** app đang chạy
- **When** mở `http://localhost:3000/docs`
- **Then** Swagger UI load thành công, hiển thị danh sách endpoints

**AC-2: Bearer auth button hiển thị**

- **Given** Swagger UI đang mở
- **When** nhìn vào góc phải trên
- **Then** có nút "Authorize" để nhập JWT token

---

## Verify hoàn thành

Mở browser:
```
http://localhost:3000/docs
```

Phải thấy Swagger UI với title "E-Commerce API".

---

## Xong thì làm gì?

→ Mở task tiếp theo: [03-docker-postgres.md](./03-docker-postgres.md)
