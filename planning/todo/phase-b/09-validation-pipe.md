# Task 09 — Global Validation Pipe & Exception Filter

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 08
**Ưu tiên**: 🔴 CAO (API contract — tất cả endpoint sau cần validation và error format nhất quán)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [03-validation-error.md](../../setup/03-conventions/03-validation-error.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Thiết lập `GlobalValidationPipe` + `GlobalExceptionFilter` — **boundary của toàn bộ API**.

- **Validation pipe là tuyến phòng thủ đầu tiên**: request sai DTO bị từ chối ngay tại controller boundary, trước khi logic nghiệp vụ nhìn thấy data. Không validate tại boundary thì business logic phải tự handle null/undefined.
- **`whitelist: true`**: drop mọi field không có `@IsX()` decorator — prevent mass assignment attack. Client gửi thêm field nào cũng bị ignore.
- **`forbidNonWhitelisted: true`**: reject hẳn request có field không biết — strict contract enforcement.
- **`GlobalExceptionFilter` = API speaks one language**: mọi exception (HTTP, Prisma, uncaught) đều được format thành cùng `{ success, statusCode, code, message, errors, timestamp, path }`. FE parse theo `code` field, không parse `message` (vì message có thể thay đổi, code thì không).
- **`code` field trong mọi error**: `TOKEN_EXPIRED`, `EMAIL_ALREADY_EXISTS`, `VALIDATION_FAILED` — machine-readable, dùng để i18n sau này. FE switch trên `code`, không switch trên `message` string.

---

## 🛠️ Các bước thực hiện

### 1. Cài packages

```bash
npm install class-validator class-transformer
```

### 2. Tạo error response interface

Tạo `src/common/interfaces/error-response.interface.ts`:

```typescript
export interface ErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface FieldError {
  field: string;
  message: string;
}
```

### 3. Tạo GlobalExceptionFilter

Tạo `src/common/filters/global-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ErrorResponse, FieldError } from '../interfaces/error-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object') {
        code = exceptionResponse.code ?? this.statusToCode(statusCode);
        message = exceptionResponse.message ?? exception.message;
        if (Array.isArray(exceptionResponse.message)) {
          // class-validator hoặc exceptionFactory có thể trả array message/object
          errors = exceptionResponse.message.map((item: string | FieldError) => {
            if (typeof item === 'string') {
              return {
                field: item.split(' ')[0],
                message: item,
              };
            }

            return item;
          });
          message = 'Validation failed';
          code = 'VALIDATION_FAILED';
        }
      } else {
        message = exceptionResponse;
        code = this.statusToCode(statusCode);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      code,
      message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_FAILED',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
```

### 4. Đăng ký trong main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HttpStatus, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Validation pipe — reject bad requests tự động
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // drop fields không có decorator
      forbidNonWhitelisted: true,   // reject request có field thừa
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors) =>
        new UnprocessableEntityException({
          code: 'VALIDATION_FAILED',
          message: validationErrors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value',
          })),
        }),
    }),
  );

  // Exception filter — format lỗi chuẩn
  app.useGlobalFilters(new GlobalExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
}
bootstrap();
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Request sai DTO trả 422 với danh sách lỗi**

- **Given** endpoint `POST /api/v1/auth/register` (sau Task 12) đã setup
- **When** gửi body thiếu `email` hoặc `password` quá ngắn
- **Then** response `422 VALIDATION_FAILED` với `errors` array liệt kê từng field lỗi; response là JSON, không phải HTML

**AC-2: Field không có trong DTO bị strip/reject**

- **Given** DTO chỉ có `email` và `password`
- **When** gửi body có thêm field `adminFlag: true`
- **Then** response `422 VALIDATION_FAILED` — mass assignment prevented

**AC-3: 404 trả JSON đúng format, không phải HTML**

- **Given** server đang chạy với GlobalExceptionFilter
- **When** gọi `GET http://localhost:3000/api/v1/nonexistent-endpoint`
- **Then** response là JSON `{ "success": false, "statusCode": 404, "code": "NOT_FOUND", ... }` — không phải HTML error page của Express

**AC-4: Prisma duplicate key error được handle gracefully**

- **Given** đã có user `test@example.com` trong DB
- **When** tạo thêm user với cùng email (Prisma P2002 error)
- **Then** response `409 CONFLICT` với `code: "EMAIL_ALREADY_EXISTS"` hoặc `DUPLICATE_ENTRY` — không phải 500 Internal Server Error

**AC-5: Unhandled exception không leak stack trace**

- **Given** có một đoạn code throw Error không catch
- **When** trigger exception đó
- **Then** response `500 INTERNAL_SERVER_ERROR` không chứa stack trace hay internal error details trong response body — chỉ log nội bộ

---

## Verify hoàn thành

### Test 1 — Validation hoạt động
Gửi request sai body (sau khi có Auth DTO ở task sau), phải trả:
```json
{
  "success": false,
  "statusCode": 422,
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "errors": [...],
  "timestamp": "...",
  "path": "/api/v1/..."
}
```

### Test 2 — 404 đúng format
```
GET http://localhost:3000/api/v1/nonexistent
```
Phải trả JSON đúng format, không phải HTML của Express.

---

## 🚫 Ngoài phạm vi

- Rate limiting / throttling trên auth endpoints → Phase D Task 01 (`@nestjs/throttler`)
- Request ID tracing (correlation ID header) → Phase D (Observability)
- Response interceptor (wrap thành `{ success: true, data: ... }`) → optional, có thể thêm sau
- `i18n` error messages (tiếng Việt/tiếng Anh) → Phase D hoặc backlog
- Custom validation decorator → thêm khi có nhu cầu cụ thể

---

## Xong thì làm gì?

→ Mở task tiếp theo: [10-jwt-redis.md](./10-jwt-redis.md)
