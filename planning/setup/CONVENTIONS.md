# 🛠️ Quy chuẩn Dự án & Tiêu chuẩn Tài liệu (Professional Edition)

Tài liệu này định nghĩa các tiêu chuẩn lập trình, mẫu tài liệu và kiến trúc hệ thống cho dự án Ecommerce API.

---

## 🏗️ 1. Kiến trúc Module & Dependency Injection (DI)

> **Canonical project structure**: [`./PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) — toàn bộ layout `src/`, `test/`, module folder, path aliases, file suffix, import order. File CONVENTIONS.md này chỉ giữ DI rules.

### Quy tắc Dependency Injection

1.  **Circular Dependency**: Hạn chế tối đa sử dụng `forwardRef()`. Nếu hai module phụ thuộc lẫn nhau, hãy tách logic dùng chung ra một `CommonModule` hoặc `SharedModule`.
2.  **Explicit Exports**: Chỉ export các **Service** cần thiết. KHÔNG export Repository/Controller/DTO ra ngoài module (encapsulation).
3.  **Scopes**: Mặc định `DEFAULT` scope (Singleton). Chỉ dùng `REQUEST` scope khi thực sự cần thiết vì lý do hiệu năng.
4.  **Cross-module reference**: dùng path alias `@modules/<feature>` (xem PROJECT_STRUCTURE §Path aliases). CẤM `../../`.
5.  **Common ↛ Modules**: code trong `src/common/` cấm import từ `src/modules/` (1-chiều, tránh circular).
6.  **Infrastructure adapter pattern**: external service (email/storage/payment) phải qua interface ở `src/infrastructure/<service>/<service>.service.ts`. Service code phụ thuộc interface, không phụ thuộc provider impl.
7.  **Jobs gọi service, không Prisma trực tiếp**: `src/jobs/*` inject service tương ứng.

---

## 📐 2. Quy ước Đặt tên & Cấu trúc Dữ liệu

> **Canonical naming + file suffix table đầy đủ**: [`./PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) §File suffix + §Naming. Bảng dưới chỉ tóm tắt.

| Mục                   | Quy ước              | Ví dụ                                      |
| :-------------------- | :------------------- | :----------------------------------------- |
| **Classes**           | PascalCase           | `AuthService`, `UsersController`           |
| **Interfaces (contract)** | PascalCase, prefix `I` | `IEmailSender`, `IStorageAdapter`     |
| **Type alias**        | PascalCase           | `JwtPayload`, `OrderState`                 |
| **Enums**             | PascalCase, value SCREAMING_SNAKE | `Role.ADMIN`, `OrderStatus.PENDING` |
| **Files**             | kebab-case + suffix  | `auth.service.ts`, `current-user.decorator.ts` |
| **Folders**           | kebab-case, plural cho modules | `users/`, `order-items/`         |
| **Variables/Methods** | camelCase            | `getUserById`, `updatedAt`                 |
| **Constants**         | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS`, `JWT_EXPIRES_IN`     |
| **DB table**          | snake_case plural    | `users`, `order_items`                     |
| **DB column**         | snake_case (map qua Prisma `@map`) | `created_at`, `email_verified` |
| **API endpoint**      | kebab-case plural    | `/users`, `/order-items`                   |
| **JSON field (response)** | camelCase        | `{ "createdAt": "..." }`                   |
| **Query param**       | camelCase            | `?page=1&limit=20`                         |

---

## 🔒 3. An toàn Kiểu dữ liệu & Bảo mật

1.  **Strict Mode**: Bắt buộc `strict: true`. Không sử dụng `any` hoặc `unknown`. Phải khai báo type rõ ràng (ví dụ dùng `interface`, `Pick<T>`, hoặc cụ thể hóa DTO).
2.  **DTO Validation**:
    - Bắt buộc mọi API input phải có DTO.
    - Global Pipe phải bật `whitelist: true` và `forbidNonWhitelisted: true`.
3.  **Sensitive Data**: Sử dụng `class-transformer` (`@Exclude()`) hoặc Interceptor để xóa bỏ các trường nhạy cảm (`password`, `salt`) trước khi trả về cho client.
4.  **Enums**: Ưu tiên sử dụng `enum` cho các giá trị hằng số cố định (Role, Status).

---

## 📝 4. Tài liệu Code (JSDoc) & API

### JSDoc Standards

- **Classes**: Mô tả trách nhiệm của class.
- **Methods**: Phải có `@param`, `@returns` và `@throws`. Giải thích **TẠI SAO** (Why) thay vì **CÁI GÌ** (What).

### Swagger (OpenAPI)

- Tất cả endpoint phải có `@ApiTags`, `@ApiOperation`, và `@ApiResponse`.
- DTO phải dùng `@ApiProperty` để mô tả ý nghĩa và ví dụ dữ liệu.

---

## ⚠️ 5. Chiến lược Xử lý Lỗi (Error Handling)

1.  **Custom Exceptions**: Không trả về chuỗi text thuần túy. Luôn sử dụng `HttpException` hoặc các class kế thừa (`NotFoundException`, `BadRequestException`).
2.  **Global Filters**: Mọi lỗi không mong đợi phải được bắt tại Global Exception Filter để format response chuẩn: `{ statusCode, message, timestamp, path }`.

---

## ⚙️ 6. Quản lý Môi trường (Environment Management)

1.  **ConfigService**: Tuyệt đối không sử dụng `process.env` trực tiếp trong code. Luôn truy cập thông qua `ConfigService`.
2.  **Environment Validation**: Mọi biến môi trường phải được xác thực qua **`class-validator` `EnvSchema` class** trong `ConfigModule` (callback `validate`) để đảm bảo ứng dụng không khởi động nếu thiếu cấu hình quan trọng. CẤM dùng Zod/Joi để tránh trộn 2 lib validation.
3.  **`.env.example`**: Luôn cập nhật file này khi thêm biến môi trường mới.

---

## 📊 7. Logging & Giám sát (Observability)

1.  **Logger lib**: `nestjs-pino` (drop-in replace Nest Logger). Lý do: fast hơn Winston/built-in ~5x, structured JSON native, có HTTP middleware tự log request.
2.  **Format dual-mode** qua env `LOG_FORMAT`:
    - **`pretty`** (dev local): `pino-pretty` transport, colorized, single-line. Đẹp đọc.
    - **`json`** (production/staging): raw JSON. Parse được bởi Datadog/Loki/CloudWatch.
3.  **Correlation ID**: Mọi request có `requestId` (UUID) trong log + response header `x-request-id`. `nestjs-pino` `customProps` inject `req.id`. Service tự tạo Logger qua `Logger(context)` → log tự gắn requestId.
4.  **Log Levels**:
    - `error`: Lỗi nghiêm trọng cần can thiệp (DB down, payment fail, unhandled exception).
    - `warn`: Bất thường nhưng app vẫn chạy (token expired, retry succeed, slow query).
    - `info`: Luồng chính (request start/end, order created, payment success).
    - `debug`: Chi tiết flow (chỉ bật `LOG_LEVEL=debug` khi đang debug).
    - `trace`: Cực chi tiết, hiếm dùng.
5.  **Redact secrets**: cấu hình `redact` pino strip `req.headers.authorization`, `password`, `*.password`, `creditCard`, `cvv`, `apiKey`. KHÔNG bao giờ log raw token/password dù dev.
6.  **No `console.log`**: Cấm. Dùng `Logger` từ `@nestjs/common` (auto bind vào pino).

---

## 💎 8. Tối ưu hóa Database (Prisma Best Practices)

1.  **Selective Fetching**: Luôn sử dụng `select` để lấy các trường cần thiết. Tránh lấy toàn bộ object nếu không dùng tới.
2.  **Transactions**: Bắt buộc sử dụng Prisma Transactions (`$transaction`) cho các thao tác liên quan đến Order, Inventory hoặc các chuỗi thay đổi dữ liệu phụ thuộc lẫn nhau.
3.  **Indexes**: Kiểm tra và đảm bảo các trường hay dùng để lọc (Filter/Sort) đã được đánh Index trong schema.
4.  **Money type**: Mọi field tiền dùng `BigInt` đơn vị nhỏ nhất của currency (VND → đồng). CẤM `Decimal(N,2)` và `Float`. Lý do: integer math = không bao giờ sai precision. Convert string ở serialize boundary qua `formatCurrency()` (xem §11 utilities). Detail: [`../docs/CONTEXT.md`](../docs/CONTEXT.md) — *Money Type*.
5.  **Row-level lock cho stock/inventory**: dùng `prisma.$queryRaw` `SELECT ... FOR UPDATE` hoặc atomic update `where: { stockQty: { gte: qty } }` trong cùng `$transaction`. Không bao giờ read-then-write rời rạc khi đụng tồn kho.
6.  **Pagination — offset only (MVP)**: mọi list endpoint dùng `PaginationDto { page, limit }` ở `src/shared/dto/`. Response wrap `PaginatedResponse<T> { data, meta: { page, limit, total, totalPages } }`. `limit` default 20, max 100. CẤM endpoint tự cook params (`?p=`, `?per_page=`, ...). Migrate cursor sau khi dataset >50K record + có tracing đo thật.
7.  **API Base Path & Versioning**: `app.setGlobalPrefix('api/v1', { exclude: ['health', 'metrics'] })`. Mọi business endpoint dưới `/api/v1/*`. Healthcheck/metrics ở root (convention K8s/Prometheus probe). Khi cần v2 → thêm prefix mới, KHÔNG sửa v1 in-place. CẤM versioning qua header hoặc query param.

---

## 🧪 9. Tiêu chuẩn Kiểm thử (Testing)

- **Unit Tests**: Tập trung vào Service logic. Sử dụng `@golevelup/ts-jest` để mock dependencies.
- **E2E Tests**: Tập trung vào các luồng nghiệp vụ quan trọng (Checkout, Auth flow).
- **Mẫu**: Arrange-Act-Assert.
- **E2E Test DB**: dùng Postgres test riêng (`docker-compose.test.yml` hoặc `TEST_DATABASE_URL`). Reset state qua **`TRUNCATE ... RESTART IDENTITY CASCADE`** trong `beforeEach`. KHÔNG dùng transaction rollback (Prisma 5 không support nested transaction).
- **Test isolation**: mỗi test file dùng chung 1 DB nhưng truncate giữa các test → state hoàn toàn sạch. Parallel test files OK nếu Jest set `maxWorkers=1` cho e2e (tránh share DB conflict).

---

## 🚀 10. Quy trình Git & Merge

- **Commits**: Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/).
- **Quality Gate**: PR chỉ được merge khi vượt qua `npm run lint` và `npm run build`.

---

**Triết lý**: Code được đọc nhiều hơn khi được viết. Hãy viết code cho người sẽ bảo trì nó sau bạn.

---

## 🧱 11. Base Classes & Shared Utilities

> Hợp nhất từ [`TASK-122`](./03-conventions/01-base-classes.md).

### BaseEntity (bắt buộc kế thừa cho mọi domain entity)

| Thuộc tính chuẩn | Kiểu | Ràng buộc |
| :--- | :--- | :--- |
| `id` | UUID v4 | PK, không bao giờ dùng auto-increment |
| `createdAt` | DateTime | Tự động set khi tạo |
| `updatedAt` | DateTime | Tự động cập nhật khi save |
| `deletedAt` | DateTime? | Soft-delete; query mặc định phải lọc `deletedAt IS NULL` |

### BaseRepository pattern

- Mọi repository concrete kế thừa `BaseRepository<T>` với các method chuẩn: `findById`, `findMany`, `create`, `update`, `softDelete`.
- Cấm dùng `prisma` trực tiếp trong service nếu có repository tương ứng — đảm bảo có thể mock cho unit test.

### Shared utilities (đặt tại `src/shared/utils/`)

- `slugify(text)` — sinh slug URL-safe.
- `formatCurrency(amount, locale)` — chuẩn hóa hiển thị tiền tệ.
- `generateId(prefix)` — sinh ID có prefix theo domain (chỉ dùng cho ID nghiệp vụ, không thay UUID).

---

## 🚦 11b. Rate Limiting (Cross-cutting)

> Lib: `@nestjs/throttler` memory storage (MVP). Migrate Redis storage Phase 3 cho multi-instance.

### Tier defaults (req/phút)

| Tier | Áp dụng | Limit | Scope |
|------|---------|-------|-------|
| **strict** | `/auth/login`, `/auth/forgot`, `/auth/reset`, `/auth/refresh` | **5/phút** | IP |
| **strict-user** | `POST /orders`, `POST /payments/checkout` | **3/phút** | userId |
| **medium** | `GET /products?q=`, `GET /categories` | **60/phút** | IP |
| **default** | Mọi endpoint authenticated khác | **120/phút** | userId |
| **webhook** | `/payments/:provider/webhook` | **30/phút** | IP |
| **public** | Mọi endpoint public không match trên | **30/phút** | IP |

### Quy tắc

- Decorator `@Throttle({ <tier>: { limit, ttl } })` ở controller method.
- `NODE_ENV=test` → skip throttler (`skipIf` callback).
- Response 429 dùng schema error chuẩn (xem §14), `code: "RATE_LIMIT_EXCEEDED"`, header `Retry-After: <seconds>`.
- KHÔNG bypass cho admin role — admin cũng có limit (chống admin account leak làm attack vector).

---

## 🛡️ 12. Auth Middleware Stack (Guards & Decorators)

> Hợp nhất từ [`TASK-117`](./03-conventions/04-guards-decorators.md).

### Nguyên tắc Fail-by-Default

- Mặc định: **mọi route đều require JWT**. Chỉ route được đánh dấu `@Public()` mới truy cập được không token.
- Global Auth Guard phải đăng ký ở `APP_GUARD`, KHÔNG khai báo từng controller.

### Decorator chuẩn

| Decorator | Mục đích |
| :--- | :--- |
| `@Public()` | Đánh dấu route không cần auth |
| `@Roles(Role.ADMIN, Role.STAFF)` | Yêu cầu role cụ thể |
| `@CurrentUser()` | Inject User từ request context |

### Thứ tự thực thi middleware

1. **Helmet** (security headers) → 2. **CORS** → 3. **Global ValidationPipe** → 4. **JwtAuthGuard** → 5. **RolesGuard** → 6. **Controller handler** → 7. **ResponseInterceptor** → 8. **GlobalExceptionFilter**.

### CORS allow-list (từ env, không hard-code)

- `CORS_ORIGINS` env = comma-separated list, ví dụ `https://shop.com,https://www.shop.com`.
- Callback function check origin:
  - Request không có `Origin` header (mobile native, curl) → **allow** (không bị CSRF).
  - Origin trong list → allow.
  - Khác → reject.
- `credentials: true`, `maxAge: 86400` (preflight cache 24h).
- Allowed headers: `Content-Type`, `Authorization`, `X-Request-Id`, `Idempotency-Key`.
- Exposed headers: `X-Request-Id`.
- CẤM `origin: '*'` — không tương thích `credentials: true` + insecure.

---

## 🔄 13. Migration Strategy & Best Practices

> Hợp nhất từ [`TASK-113`](./02-database/05-migration-strategy.md).

### Quy tắc bất di bất dịch

1. **Migration là 1 chiều**. Không bao giờ chỉnh sửa file migration đã merge vào main — luôn tạo migration mới để rollback.
2. **Naming convention**: `<YYYYMMDDHHMMSS>_<verb>_<entity>` (ví dụ `20260518123000_add_email_verified_to_users`).
3. **Không destructive change trong 1 step**: drop column/table phải qua 2 deploy:
   - Deploy N: code không còn đọc/ghi column → chạy migration đặt cờ deprecated.
   - Deploy N+1: chạy migration drop column.
4. **Data migration tách riêng**: schema migration chỉ DDL. Mọi UPDATE/INSERT chạy ở script riêng hoặc job idempotent.
5. **Pre-deploy check**: `npx prisma migrate status` phải clean trước mọi deploy.

### Khi nào cần ADR

Mọi quyết định schema có dấu hiệu sau phải có ADR đi kèm (xem [`../../docs/adr/`](../../docs/adr/) nếu tồn tại):
- Thay đổi PK strategy.
- Thêm/đổi delete strategy (CASCADE ↔ RESTRICT ↔ SET NULL).
- Đưa ra denormalization vì performance.

---

## 🚧 14. Global Validation & Error Handling Detail

> Hợp nhất từ [`TASK-105`](./03-conventions/03-validation-error.md). Bổ sung cho §3 và §5 ở trên.

### Validation Pipe global config

```ts
// main.ts (tham khảo)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // §3.2
  forbidNonWhitelisted: true,   // chống Mass Assignment
  transform: true,              // tự động ép kiểu URL params
  transformOptions: { enableImplicitConversion: true },
}));
```

### Error Response Schema (đóng băng)

```json
{
  "statusCode": 422,
  "code": "VALIDATION_FAILED",
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "email", "rule": "isEmail", "message": "Email không hợp lệ" }
  ],
  "timestamp": "2026-05-18T10:00:00Z",
  "path": "/api/v1/auth/register",
  "requestId": "req_abc123"
}
```

- Mã `code` (UPPER_SNAKE) bắt buộc — frontend xử lý dựa trên `code`, không parse `message`.
- `requestId` lấy từ correlation ID middleware (§7.1).

### Custom validators chuẩn

| Validator | Áp dụng | Quy tắc |
| :--- | :--- | :--- |
| `@IsStrongPassword` | password fields | ≥ 8 ký tự **+** không nằm trong top 100 common (VN list: `123456`, `password`, `matkhau`, `iloveyou`...) **+** HaveIBeenPwned breach check qua k-anonymity (gửi 5 ký tự đầu SHA1 hash). KHÔNG bắt buộc chữ hoa/số/đặc biệt (NIST 2024: length quan trọng hơn complexity). KHÔNG bắt đổi định kỳ. |
| `@IsVietnamesePhone` | phone fields | Regex chính xác: `^(?:\+84|0)(3|5|7|8|9|2)[0-9]{8}$`. `(3\|5\|7\|8\|9)` đầu = mobile (03/05/07/08/09), `2` đầu = cố định (02x). Tổng 10 số (sau prefix `0`) hoặc 11 ký tự với `+84`. **Normalize trước validate** qua `@Transform`: strip space/dash. **Lưu DB E.164**: `+84901234567` (convert prefix `0` thành `+84`). Display UI là FE responsibility. |
| `@IsTrimmedNotEmpty` | text input | reject `"   "` và empty string |

---

## 🏥 15. Healthcheck Endpoints

> Lib: **`@nestjs/terminus`** (official). Endpoints **ngoài** prefix `/api/v1` (xem §11.7).

### Hai endpoint K8s-style

| Endpoint | Mục đích | Check gì |
|----------|----------|----------|
| `GET /health/live` | Liveness probe | App có chạy không. **KHÔNG check downstream.** Trả 200 nếu Nest respond được. |
| `GET /health/ready` | Readiness probe | App ready phục vụ traffic. Check DB + (Phase 3: Redis, S3, email service). Trả 503 nếu downstream fail. |
| `GET /health` | Alias cho `/health/ready` | Convention cũ — giữ để các tool legacy không break. |

### Phân biệt liveness vs readiness

- **Liveness fail** → K8s restart container.
- **Readiness fail** → K8s rút khỏi load balancer pool (KHÔNG restart). App sẽ tự rejoin khi readiness pass lại.

→ CẤM `/health/live` check DB — DB chết mà restart container không sửa được, chỉ gây cascade restart loop.

### Response shape (chuẩn terminus)

```json
// 200 OK
{ "status": "ok", "info": { "db": { "status": "up" } }, "error": {}, "details": {...} }

// 503 Service Unavailable
{ "status": "error", "info": {}, "error": { "db": { "status": "down", "message": "..." } }, "details": {...} }
```
