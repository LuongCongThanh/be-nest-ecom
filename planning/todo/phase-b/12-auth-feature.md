# Task 12 — Auth Feature: Register & Login

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 11
**Ưu tiên**: 🔴 BLOCKING (Core Business — tất cả feature sau đều cần user đã login)
**Trạng thái**: ⏳ Not started
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

### 1. Tạo Auth DTOs

Tạo `src/modules/identity/dto/register.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;
}
```

Tạo `src/modules/identity/dto/login.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
```

### 2. Tạo AuthService

Tạo `src/modules/identity/services/auth.service.ts`:

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

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

  private sanitizeUser(user: any) {
    const { password, ...safe } = user;
    return safe;
  }
}
```

### 3. Tạo AuthController

Tạo `src/modules/identity/controllers/auth.controller.ts`:

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../../common/decorators';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

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

### 4. Tạo IdentityModule

Tạo `src/modules/identity/identity.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [TokenService],
})
export class IdentityModule {}
```

Đăng ký trong `AppModule`:
```typescript
import { IdentityModule } from './modules/identity/identity.module';

@Module({
  imports: [..., IdentityModule],
})
export class AppModule {}
```

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
