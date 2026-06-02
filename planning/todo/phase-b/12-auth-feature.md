# Task 12 — Auth Feature: Register & Login

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 11
**Ưu tiên**: 🔴 BLOCKING (Core Business — tất cả feature sau đều cần user đã login)
**Trạng thái**: ✅ Done (theo cập nhật tiến độ hiện tại; doc đã được sync với code thật trong repo)
**Spec gốc**: [04-register-login.md](../../business/01-identity/04-register-login.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Implement `POST /auth/register` và `POST /auth/login` — **2 luồng quan trọng nhất Phase B**.

- **Password = one-way hash**: plaintext password không bao giờ được lưu sau khi rời tay client. Bcrypt cost 12 = ~250ms hash time → chấp nhận được về UX nhưng làm brute force cực kỳ tốn kém.
- **Login error message phải mơ hồ**: `INVALID_CREDENTIALS` cho cả trường hợp "email không tồn tại" lẫn "sai password" — không tiết lộ email có tồn tại hay không (chống enumeration attack).
- **Timing attack prevention**: dù email không tồn tại, vẫn chạy `bcrypt.compare` với dummy hash — đảm bảo response time tương đương với trường hợp email tồn tại. Không làm điều này thì attacker đo thời gian response để biết email có tồn tại không.
- **Registration cleanup on token-issue failure**: nếu user đã tạo mà token issue fail, phải rollback hoặc xóa user vừa tạo — không để orphan account.
- **`emailVerified: false`**: user mới chưa verify email — cho phép login nhưng một số tính năng nhạy cảm sẽ bị limit (Phase D).

---

## 📄 Luồng nghiệp vụ

### 1. Registration Flow — `POST /api/v1/auth/register`

| # | Bước | Hành động | Lỗi có thể trả về |
| :- | :--- | :--- | :--- |
| 1 | Validate | Áp dụng `RegisterDto` | `422 VALIDATION_FAILED` |
| 2 | Conflict check | Email đã tồn tại? (case-insensitive) | `409 EMAIL_ALREADY_EXISTS` |
| 3 | Hash password | `bcrypt.hash(password, 12)` | — |
| 4 | Persist | Insert User với `emailVerified=false`, `isActive=true` | — |
| 5 | Issue tokens | Cấp `accessToken` + `refreshToken` (Task 10 TokenService) | — |
| 6 | Return | `{ user: sanitized, accessToken, refreshToken }` | — |

### 2. Login Flow — `POST /api/v1/auth/login`

| # | Bước | Hành động | Lỗi có thể trả về |
| :- | :--- | :--- | :--- |
| 1 | Validate | Áp dụng `LoginDto` | `422 VALIDATION_FAILED` |
| 2 | Identity lookup | `findByEmail(lower(email))` | — |
| 3 | Secure compare | `bcrypt.compare` dù email không tồn tại (dummy hash) | Bước 2+3 fail → `401 INVALID_CREDENTIALS` (cùng message) |
| 4 | State check | `isActive == true`, `deletedAt IS NULL` | `401 ACCOUNT_INACTIVE` |
| 5 | Issue tokens | Như register | — |
| 6 | Return | `{ user: sanitized, accessToken, refreshToken }` | — |

---

## 🛠️ Các bước thực hiện

### 0. Tạo thư mục và file trước

Repo hiện tại **đã có sẵn** các file/chỗ wiring chính của Task 12:

- `src/modules/identity/controllers/auth.controller.ts`
- `src/modules/identity/services/auth.service.ts`
- `src/modules/identity/dto/login.dto/login.dto.ts`
- `src/modules/identity/dto/register.dto/register.dto.ts`
- `src/modules/identity/strategies/jwt.strategy.ts`
- `src/modules/identity/services/token.service.ts`
- `src/modules/identity.module.ts`

Nest CLI:

```powershell
nest g mo modules/identity --flat --no-spec
nest g co modules/identity/controllers/auth --flat --no-spec
nest g s modules/identity/services/auth --flat --no-spec
nest g class modules/identity/dto/register.dto --no-spec
nest g class modules/identity/dto/login.dto --no-spec
```

> Lưu ý: với Nest CLI hiện đã chạy trong repo này, DTO đang nằm ở **nested path** `dto/register.dto/register.dto.ts` và `dto/login.dto/login.dto.ts`, không phải flat file một cấp như một số ví dụ cũ.

**Giải thích:**

- `nest g mo ...` tạo module để gom controller, service và dependency của feature identity.
- `nest g co ...` tạo controller, tức lớp nhận HTTP request và trả response.
- `nest g s ...` tạo service, tức nơi đặt business logic của register/login.
- `nest g class ...dto` tạo DTO class để làm contract input cho request body.
- `--flat` giúp file được tạo đúng ngay tại path mong muốn, không lồng thêm thư mục con không cần thiết.
- `--no-spec` bỏ qua file test scaffold ở bước này để task tập trung vào luồng auth trước.

### 1. Auth DTOs hiện tại

File thật: `src/modules/identity/dto/register.dto/register.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain uppercase, lowercase, and number',
  })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;
}
```

**Giải thích `RegisterDto`:**

- DTO là lớp mô tả dữ liệu đầu vào mà endpoint chấp nhận.
- Nhờ Global ValidationPipe của Task 09, request sai format sẽ bị chặn trước khi chạy vào service.
- `@IsEmail()` kiểm tra email có đúng format cơ bản không.
- `@MinLength(8)` và `@MaxLength(64)` giữ password trong ngưỡng hợp lý.
- Regex trong `@Matches(...)` buộc password có chữ thường, chữ hoa và số, để tránh mật khẩu quá yếu.
- `firstName` và `lastName` cũng được validate từ boundary thay vì để dữ liệu bẩn chui vào DB.
- Dấu `!` là `definite assignment assertion`: DTO property sẽ được Nest map dữ liệu vào ở runtime, nên không cần khởi tạo trong constructor nhưng vẫn an toàn với TypeScript strict mode.

File thật: `src/modules/identity/dto/login.dto/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
```

**Giải thích `LoginDto`:**

- Login không cần kiểm tra password strength như register, vì đây là bước xác thực chứ không phải bước tạo mật khẩu mới.
- Chỉ cần bảo đảm `email` đúng format và `password` là chuỗi không rỗng.

### 2. AuthService hiện tại

File thật: `src/modules/identity/services/auth.service.ts`

```typescript
import { PrismaService } from '@common/prisma/prisma.service';
import { LoginDto } from '@modules/identity/dto/login.dto/login.dto';
import { RegisterDto } from '@modules/identity/dto/register.dto/register.dto';
import { TokenService } from '@modules/identity/services/token.service';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing-attack-mitigation', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    // Conflict check
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    // Hash password — bcrypt cost 12
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user first; if token issue fails, cleanup user vừa tạo
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'USER',
        emailVerified: false,
        isActive: true,
      },
    });

    try {
      const tokens = await this.tokenService.issueTokenPair(user.id, user.email, user.role);
      return { user: this.sanitizeUser(user), ...tokens };
    } catch (error) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw error;
    }
  }

  async login(dto: LoginDto) {
    // Lookup user
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });

    // Secure compare — same error regardless of email exists or not
    const passwordMatch = user
      ? await bcrypt.compare(dto.password, user.password)
      : await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // State check
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email, user.role);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  private sanitizeUser<T extends { password: string } & Record<string, unknown>>(user: T): Omit<T, 'password'> {
    return Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'password')) as Omit<T, 'password'>;
  }
}
```

**Giải thích phần đầu `AuthService`:**

- `@Injectable()` cho Nest biết class này là provider và có thể được inject qua DI container.
- `PrismaService` dùng để truy cập database.
- `TokenService` là phần đã có từ Task 10, chịu trách nhiệm cấp access token và refresh token.
- `DUMMY_PASSWORD_HASH` là kỹ thuật chống timing attack: nếu email không tồn tại mà mình fail ngay, attacker có thể đo thời gian response để đoán email nào có trong hệ thống.
- `sanitizeUser()` hiện không dùng destructuring `const { password, ...safe } = user` nữa, vì repo này đang bật rule ESLint `@typescript-eslint/no-unused-vars`; cách filter bằng `Object.entries(...).filter(...)` giúp loại `password` mà không phát sinh warning.

### 3. AuthController hiện tại

File thật: `src/modules/identity/controllers/auth.controller.ts`

```typescript
import { Public } from '@common/decorators/public/public.decorator';
import { AuthService } from '@modules/identity/services/auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto/login.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

**Giải thích `AuthController`:**

- `@Controller('auth')` tạo route prefix `auth`, khi ghép với global prefix hiện tại sẽ thành `/api/v1/auth/...`.
- `@Public()` là bắt buộc vì repo đang theo mô hình protected-by-default: route nào không đánh dấu public thì `JwtAuthGuard` global sẽ chặn.
- `@Body() dto` lấy request body và map vào DTO tương ứng.
- Controller nên mỏng: chỉ nhận request, gọi service, trả kết quả. Business logic nằm ở service.
- `@HttpCode(HttpStatus.OK)` đổi status của login về `200`; còn register giữ default `201 Created`.

### 4. Tạo IdentityModule

File thật hiện tại: `src/modules/identity.module.ts`

```typescript
import { PrismaModule } from '@common/prisma/prisma.module';
import { AuthController } from '@modules/identity/controllers/auth.controller';
import { AuthService } from '@modules/identity/services/auth.service';
import { TokenService } from '@modules/identity/services/token.service';
import { JwtStrategy } from '@modules/identity/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [TokenService],
})
export class IdentityModule {}
```

**Giải thích `IdentityModule`:**

- Module là ranh giới feature trong NestJS, giúp gom controller, service và dependency cùng một chỗ.
- `imports: [PrismaModule, PassportModule.register(...)]` cho phép các provider trong module dùng được `PrismaService` và tích hợp Passport/JWT.
- `controllers: [AuthController]` đăng ký lớp nhận request của feature auth.
- `providers: [AuthService, TokenService, JwtStrategy]` đăng ký các provider để Nest inject khi cần.
- `exports: [TokenService]` chỉ export những gì module khác thực sự cần dùng, đúng với convention encapsulation của repo.

Đăng ký trong `AppModule`:
```typescript
import { IdentityModule } from './modules/identity.module';

@Module({
  imports: [
    // ...
    IdentityModule,
  ],
})
export class AppModule {}
```

**Giải thích phần wiring vào `AppModule`:**

- Dù đã viết controller và service đúng, nếu không import `IdentityModule` vào `AppModule` thì Nest vẫn không biết feature này tồn tại.
- Hậu quả thường gặp nhất là route bị `404` vì controller chưa được register vào dependency graph của app.
- Đây cũng là lý do khi debug auth route, luôn kiểm tra wiring module trước khi nghi ngờ guard hoặc strategy.
- Trong repo hiện tại, `AppModule` còn giữ `JwtStrategy` ở `providers: [...]` cấp app và `IdentityModule` cũng đăng ký `JwtStrategy` trong `providers`. Đây là wiring đang tồn tại thật trong code; nếu muốn tối giản sau này thì có thể gom strategy về một chỗ, nhưng task doc này nên phản ánh hiện trạng trước.

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Password không bao giờ được lưu plaintext**

- **Given** User đăng ký với `password = "Strong@Pass123"`
- **When** query `SELECT password FROM users WHERE email = ...` trong DB
- **Then** giá trị là bcrypt hash bắt đầu bằng `$2b$12$`, dài ≥ 60 ký tự — không phải plaintext

**AC-2: Login error không tiết lộ email có tồn tại hay không**

- **Given** Request 1: email tồn tại + password sai. Request 2: email không tồn tại + password bất kỳ
- **When** gửi cả hai request và so sánh response
- **Then** cả hai trả cùng `401 INVALID_CREDENTIALS`, cùng `message` — không có sự khác biệt giúp attacker biết email nào đã đăng ký

**AC-3: Email trùng bị từ chối (case-insensitive)**

- **Given** đã có user với email `Bob@Example.COM`
- **When** đăng ký với `bob@example.com` (khác case)
- **Then** response `409 EMAIL_ALREADY_EXISTS` — không tạo user mới

**AC-4: Register trả 201 với đúng cấu trúc**

- **Given** email chưa tồn tại, credentials hợp lệ
- **When** `POST /api/v1/auth/register` với body đúng format
- **Then** response `201` chứa `{ user: {...}, accessToken: "...", refreshToken: "..." }` — `user` object **không có** `password` field

**AC-5: Tài khoản inactive không login được**

- **Given** User tồn tại trong DB nhưng `isActive = false`
- **When** login với đúng credentials
- **Then** response `401 ACCOUNT_INACTIVE` — phân biệt với `INVALID_CREDENTIALS`

---

## Verify hoàn thành

### Test 1 — Register thành công
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123456",
  "firstName": "Test",
  "lastName": "User"
}
```
Phải trả `201` với `accessToken`, `refreshToken`, và `user` (không có `password`).

### Test 2 — Đăng ký email trùng
Gửi lại request trên → phải trả `409 EMAIL_ALREADY_EXISTS`.

### Test 3 — Login thành công
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{ "email": "test@example.com", "password": "Test@123456" }
```
Phải trả `200` với tokens.

### Test 4 — Login sai password
```http
{ "email": "test@example.com", "password": "WrongPass" }
```
Phải trả `401 INVALID_CREDENTIALS`.

---

## 🚫 Ngoài phạm vi

- Email verification token generation và verification flow → Phase D Task 03
- Welcome email gửi khi register → Phase D (sau khi có email service)
- Rate limiting trên auth endpoints → Phase D Task 01 (`@nestjs/throttler`)
- OAuth / social login (Google, Facebook) → backlog
- `POST /auth/logout` và refresh token rotation → Task 13
- 2FA / TOTP → backlog

---

## Xong thì làm gì?

→ Mở task tiếp theo: [13-refresh-token.md](./13-refresh-token.md)
