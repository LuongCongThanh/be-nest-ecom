# 🛠️ Quy chuẩn Dự án & Tiêu chuẩn Tài liệu (Professional Edition)

Tài liệu này định nghĩa các tiêu chuẩn lập trình, mẫu tài liệu và kiến trúc hệ thống cho dự án Ecommerce API.

---

## 🏗️ 1. Kiến trúc Module & Dependency Injection (DI)

### Bố cục Module Chuẩn

Mọi tính năng phải được đóng gói tại `src/modules/[module-name]/`.

```text
src/modules/[module-name]/
├── controllers/          # Xử lý request HTTP
├── services/             # Logic nghiệp vụ (Business Logic)
├── dto/                  # Validation (Class-Validator)
├── interfaces/           # Type nội bộ
├── guards/               # Access Control
├── decorators/           # Custom Decorators
├── [module-name].module.ts
└── [module-name].service.spec.ts
```

### Quy tắc Dependency Injection

1.  **Circular Dependency**: Hạn chế tối đa sử dụng `forwardRef()`. Nếu hai module phụ thuộc lẫn nhau, hãy tách logic dùng chung ra một `CommonModule` hoặc `SharedModule`.
2.  **Explicit Exports**: Chỉ export các **Service** cần thiết, không bao giờ export toàn bộ Module trừ khi đó là Global Module.
3.  **Scopes**: Mặc định sử dụng `DEFAULT` scope (Singleton). Chỉ dùng `REQUEST` scope khi thực sự cần thiết vì lý do hiệu năng.

---

## 📐 2. Quy ước Đặt tên & Cấu trúc Dữ liệu

| Mục                   | Quy ước              | Ví dụ                                      |
| :-------------------- | :------------------- | :----------------------------------------- |
| **Classes**           | PascalCase           | `AuthService`, `UserController`            |
| **Interfaces**        | PascalCase           | `JwtPayload`, `UserWithRelations`          |
| **Files**             | kebab-case           | `auth.service.ts`, `get-user.decorator.ts` |
| **Variables/Methods** | camelCase            | `getUserById`, `updatedAt`                 |
| **Constants**         | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS`                       |

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
2.  **Environment Validation**: Mọi biến môi trường phải được xác thực (dùng Joi hoặc Zod) trong `ConfigModule` để đảm bảo ứng dụng không khởi động nếu thiếu cấu hình quan trọng.
3.  **`.env.example`**: Luôn cập nhật file này khi thêm biến môi trường mới.

---

## 📊 7. Logging & Giám sát (Observability)

1.  **Correlation ID**: Mọi request phải đính kèm một `request-id` duy nhất trong log để dễ dàng truy vết (sử dụng middleware hoặc interceptor).
2.  **Log Levels**:
    - `Error`: Lỗi nghiêm trọng cần can thiệp ngay.
    - `Warn`: Các tình huống bất thường nhưng ứng dụng vẫn chạy được.
    - `Info`: Luồng xử lý chính của hệ thống.
3.  **No `console.log`**: Chỉ sử dụng `Logger` từ `@nestjs/common`.

---

## 💎 8. Tối ưu hóa Database (Prisma Best Practices)

1.  **Selective Fetching**: Luôn sử dụng `select` để lấy các trường cần thiết. Tránh lấy toàn bộ object nếu không dùng tới.
2.  **Transactions**: Bắt buộc sử dụng Prisma Transactions (`$transaction`) cho các thao tác liên quan đến Order, Inventory hoặc các chuỗi thay đổi dữ liệu phụ thuộc lẫn nhau.
3.  **Indexes**: Kiểm tra và đảm bảo các trường hay dùng để lọc (Filter/Sort) đã được đánh Index trong schema.

---

## 🧪 9. Tiêu chuẩn Kiểm thử (Testing)

- **Unit Tests**: Tập trung vào Service logic. Sử dụng `@golevelup/ts-jest` để mock dependencies.
- **E2E Tests**: Tập trung vào các luồng nghiệp vụ quan trọng (Checkout, Auth flow).
- **Mẫu**: Arrange-Act-Assert.

---

## 🚀 10. Quy trình Git & Merge

- **Commits**: Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/).
- **Quality Gate**: PR chỉ được merge khi vượt qua `npm run lint` và `npm run build`.

---

**Triết lý**: Code được đọc nhiều hơn khi được viết. Hãy viết code cho người sẽ bảo trì nó sau bạn.

---

## 🧱 11. Base Classes & Shared Utilities

> Hợp nhất từ [`TASK-122`](./03-conventions/TASK-122-base-classes.md).

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

## 🛡️ 12. Auth Middleware Stack (Guards & Decorators)

> Hợp nhất từ [`TASK-117`](./03-conventions/TASK-117-guards-decorators.md).

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

---

## 🔄 13. Migration Strategy & Best Practices

> Hợp nhất từ [`TASK-113`](./02-database/TASK-113-migration-strategy.md).

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

> Hợp nhất từ [`TASK-105`](./03-conventions/TASK-105-validation-error.md). Bổ sung cho §3 và §5 ở trên.

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
| `@IsStrongPassword` | password fields | ≥ 8 ký tự, có chữ hoa, số, ký tự đặc biệt |
| `@IsVietnamesePhone` | phone fields | regex `^(?:\+84|0)[0-9]{9,10}$` |
| `@IsTrimmedNotEmpty` | text input | reject `"   "` và empty string |
