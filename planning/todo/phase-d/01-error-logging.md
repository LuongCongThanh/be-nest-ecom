# Task D-01 — Error Filter + Logging + Response Transform

**Phase**: D — Polish  
**Ước lượng**: 5 giờ  
**Phụ thuộc**: Phase C hoàn thành  
**Spec gốc**: [planning/setup/04-cross-cutting/](../../planning/setup/04-cross-cutting/)

---

## Nhiệm vụ

Nâng cấp GlobalExceptionFilter đầy đủ, thêm Request Logging Interceptor với correlation ID, và Response Transform Interceptor để wrap các JSON success response về format chuẩn.

---

## Các bước thực hiện

### 1. Nâng cấp GlobalExceptionFilter (đã làm ở Task 09, bổ sung thêm)

Thêm `requestId` (correlation ID) vào error response. Mở `src/common/filters/global-exception.filter.ts`, cập nhật:

```typescript
// Thêm requestId vào error response
const errorResponse: ErrorResponse = {
  success: false,
  statusCode,
  code,
  message,
  errors: errors.length > 0 ? errors : undefined,
  timestamp: new Date().toISOString(),
  path: request.url,
  requestId: request.headers['x-request-id'] as string ?? randomUUID(),
};
```

> Không generate `requestId` mới ở đây nếu middleware đã set sẵn; filter chỉ nên đọc lại giá trị hiện có từ request/res header.

### 2. Tạo Correlation ID Middleware

Tạo `src/common/middleware/correlation-id.middleware.ts`:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
```

Đăng ký trong `AppModule`:
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

### 3. Tạo Logging Interceptor

Tạo `src/common/interceptors/logging.interceptor.ts`:

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const requestId = req.headers['x-request-id'];
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.logger.log(`${method} ${url} ${statusCode} ${duration}ms [${requestId}]`);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} ERROR ${duration}ms [${requestId}] - ${error.message}`);
        },
      }),
    );
  }
}
```

### 4. Tạo Response Transform Interceptor

Tạo `src/common/interceptors/response-transform.interceptor.ts`:

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Nếu data đã có success field (error response) thì không wrap
        if (data && typeof data === 'object' && 'success' in data) return data;

        const response = context.switchToHttp().getResponse();
        if (response.statusCode === 204) return data;

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

> Không dùng response wrapper cho file download, stream, redirect, hoặc `204 No Content`. Với các route đặc biệt này, controller/interceptor nên explicit opt-out.

### 5. Đăng ký interceptors trong main.ts

```typescript
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new ResponseTransformInterceptor(),
);
```

---

## Verify hoàn thành

Gọi bất kỳ API JSON thành công, response phải có format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-..."
}
```

Gọi API lỗi, response phải có format:
```json
{
  "success": false,
  "statusCode": 404,
  "code": "USER_NOT_FOUND",
  "message": "...",
  "timestamp": "...",
  "path": "/api/v1/...",
  "requestId": "uuid"
}
```

Log terminal phải thấy:
```
[HTTP] GET /api/v1/health 200 5ms [request-uuid]
```

---

## Xong thì làm gì?

→ [02-swagger.md](./02-swagger.md)
