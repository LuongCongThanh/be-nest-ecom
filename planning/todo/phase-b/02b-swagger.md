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

---

## 📚 Nội dung học sau task này

### Mục tiêu học rõ ràng

Sau task này, bạn **có thể**:
- **Giải thích** tại sao Swagger tốt hơn Postman collection trong quá trình phát triển
- **Phân biệt** vai trò của `DocumentBuilder` vs `SwaggerModule`
- **Quyết định** đặt Swagger ở path nào và tại sao tách ra khỏi global prefix
- **Enable** Bearer auth trong Swagger UI để test protected endpoint

---

### Concept 1 — Swagger là "living documentation"

> **Analogy:** Swagger giống bảng điều khiển tự sinh ra từ code — không bao giờ lỗi thời vì nó đọc trực tiếp từ decorator, không phải file riêng ai đó phải maintain.

| | Swagger UI | Postman Collection |
|--|--|--|
| Nguồn dữ liệu | Đọc từ decorator trong code | File JSON/YAML riêng |
| Đồng bộ với API | Luôn đúng | Dễ outdated |
| Cần maintain thủ công | Không | Có |

---

### Concept 2 — Luồng khởi tạo Swagger trong NestJS

```
DocumentBuilder               SwaggerModule
      │                             │
 .setTitle()              .createDocument(app, config)
 .setVersion()                      │
 .addBearerAuth()           → OpenAPI JSON spec
 .build()                           │
      │                     .setup('docs', app, document)
  config object                     │
                              mount tại /docs
```

Giải thích từng dòng quan trọng:

```typescript
// DocumentBuilder = builder pattern để cấu hình metadata cho UI
const config = new DocumentBuilder()
  .setTitle('E-Commerce API')   // Tên hiển thị trên UI
  .setVersion('1.0')            // Version API, không phải package version
  .addBearerAuth()              // Thêm nút "Authorize" để nhập JWT
  .build();                     // Tạo ra config object

// createDocument = đọc toàn bộ app → generate OpenAPI JSON
const document = SwaggerModule.createDocument(app, config);

// setup = mount UI tại /docs (không phải /api/v1/docs)
SwaggerModule.setup('docs', app, document);
```

---

### Concept 3 — Tại sao `/docs` nằm ngoài prefix `api/v1`

```typescript
app.setGlobalPrefix('api/v1', { exclude: ['health'] });
// prefix này KHÔNG ảnh hưởng đến Swagger vì:
// SwaggerModule.setup() mount trực tiếp lên Express layer,
// không đi qua NestJS routing pipeline
```

| Path | Bị prefix? | Lý do |
|------|-----------|-------|
| `GET /api/v1/products` | ✅ Có | NestJS controller |
| `GET /docs` | ❌ Không | Swagger mount ngoài router |
| `GET /health` | ❌ Không | Excluded explicitly |

**Lợi ích thiết kế:** Khi bump lên `api/v2`, URL `/docs` vẫn giữ nguyên.

---

### Concept 4 — `addBearerAuth()` làm gì chính xác

1. Thêm security scheme `bearerAuth` vào OpenAPI spec
2. UI render nút **Authorize** ở góc phải trên
3. User nhập JWT token → Swagger lưu trong session
4. Mỗi request sau đó → tự thêm header `Authorization: Bearer <token>`

> **Lưu ý:** Phase D Task 02 mới thêm `@ApiBearerAuth()` vào từng controller. Hiện tại nút Authorize hiển thị nhưng chưa có endpoint nào yêu cầu token — đó là đúng, không phải bug.

---

### Bài tập thực hành

**Bài 1 — Verify cơ bản (2 phút)**
1. Chạy `npm run start:dev`
2. Mở `http://localhost:3000/docs`
3. Xác nhận thấy title "E-Commerce API" và nút "Authorize"

**Bài 2 — Thử thay đổi để hiểu (5 phút)**

Thử lần lượt từng thay đổi, quan sát kết quả, rồi revert:

```typescript
// Thử 1: Đổi path → URL đổi theo
SwaggerModule.setup('swagger', app, document);
// → http://localhost:3000/swagger

// Thử 2: Bỏ .addBearerAuth()
// → Nút "Authorize" biến mất

// Thử 3: Quan sát /docs không bị ảnh hưởng bởi setGlobalPrefix
// → Truy cập /api/v1/docs → 404, /docs → vẫn OK
```

**Bài 3 — Debug challenge (5 phút)**

Tìm lỗi trong đoạn code sau:

```typescript
// ❌ Có lỗi — tìm và fix
const config = new DocumentBuilder()
  .setTitle('My API')
  .build();

SwaggerModule.setup('docs', app, config); // lỗi ở đây
```

<details>
<summary>Gợi ý</summary>

`setup()` nhận `document` (output của `createDocument`), không nhận `config` trực tiếp. Thiếu dòng `const document = SwaggerModule.createDocument(app, config)`.

</details>

---

### Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|-------------|------------|-----|
| `/docs` trả về 404 | `SwaggerModule.setup()` chưa được gọi | Kiểm tra `main.ts` |
| `/api/v1/docs` có, `/docs` 404 | Nhầm swagger bị ảnh hưởng bởi prefix | Dùng đúng path `/docs` |
| Nút Authorize không xuất hiện | Thiếu `.addBearerAuth()` | Thêm vào builder chain |
| Swagger UI trắng/lỗi JS | Thiếu package | `npm install @nestjs/swagger` |

---

### Liên kết sang task tiếp theo

- **Phase D Task 02:** Thêm `@ApiProperty()` vào DTO, `@ApiOperation()` vào controller → Swagger hiển thị đầy đủ schema và mô tả từng field
- **Sâu hơn:** OpenAPI spec là JSON thuần — có thể dùng để generate client SDK (TypeScript, Python...) bằng `openapi-generator`
