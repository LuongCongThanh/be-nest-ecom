# Task 14 — Users CRUD & Profile

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 13
**Ưu tiên**: 🟡 TRUNG BÌNH (Operations + UX — cần cho admin quản lý và user tự quản lý profile)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [05-users-crud.md](../../business/01-identity/05-users-crud.md) · [06-user-profile.md](../../business/01-identity/06-user-profile.md) · [07-change-password.md](../../business/01-identity/07-change-password.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Implement hai nhóm endpoints riêng biệt:
1. **Self-service (user)**: `GET/PATCH /users/me`, `PATCH /users/me/change-password`
2. **Admin governance**: `GET /users`, `DELETE /users/:id`

Các nguyên tắc quan trọng:

- **`password` field không bao giờ được trả về response**: dùng `select` field hoặc destructure để exclude. Một developer quên điều này là lỗi security nghiêm trọng.
- **Change password phải revoke tất cả refresh tokens**: sau khi đổi password, mọi phiên cũ đều invalid — attacker đang giữ token cũ bị log out. Không làm điều này thì old session vẫn active.
- **Soft delete, không hard delete**: Admin xóa user vẫn giữ `deletedAt`, không xóa record — Order history của user đó vẫn truy vấn được.
- **Admin không được tự xóa chính mình qua endpoint quản trị**: tránh tự khóa tài khoản admin cuối cùng của hệ thống.

---

## 📄 Endpoints

### Self-service (User tự quản lý)

| Endpoint | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/users/me` | GET | Authenticated | Xem profile bản thân |
| `/users/me` | PATCH | Authenticated | Cập nhật firstName, lastName, phone |
| `/users/me/change-password` | PATCH | Authenticated | Đổi password (cần currentPassword) |

### Admin governance

| Endpoint | Method | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| `/users` | GET | ADMIN | List tất cả users |
| `/users/:id` | DELETE | ADMIN | Soft delete user + revoke tokens |

---

## 🛠️ Các bước thực hiện

### 1. Tạo User DTOs

Tạo `src/modules/identity/dto/update-profile.dto.ts`:

```typescript
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @Matches(/^(\+84|0)\d{9}$/, { message: 'Invalid Vietnamese phone number' })
  phone?: string;
}
```

Tạo `src/modules/identity/dto/change-password.dto.ts`:

```typescript
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'newPassword must contain uppercase, lowercase, and number',
  })
  newPassword: string;
}
```

### 2. Tạo UserService

Tạo `src/modules/identity/services/user.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TokenService } from './token.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, emailVerified: true,
        createdAt: true, updatedAt: true,
        // password KHÔNG được select
      },
    });

    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Current password is incorrect',
      });
    }

    const hashedNew = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNew },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
      },
    });
  }

  async softDelete(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), isActive: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
```

> Nên bổ sung guard ở service/controller để chặn admin tự xóa chính mình:
> `if (currentUserId === userId) throw new ForbiddenException(...)`

### 3. Tạo UsersController

Tạo `src/modules/identity/controllers/users.controller.ts`:

```typescript
import { Controller, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '@prisma/client';
import { UserService } from '../services/user.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Patch('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }
}
```

### 4. Đăng ký vào IdentityModule

```typescript
// Thêm UsersController và UserService vào IdentityModule
controllers: [AuthController, UsersController],
providers: [AuthService, TokenService, JwtStrategy, UserService],
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: `password` field không bao giờ xuất hiện trong response**

- **Given** user đã login có access token hợp lệ
- **When** gọi `GET /api/v1/users/me`
- **Then** response JSON không chứa field `password` — kể cả dạng hash

**AC-2: Change password revoke tất cả refresh tokens**

- **Given** user có 2 refresh token active trên 2 thiết bị
- **When** gọi `PATCH /users/me/change-password` với `currentPassword` đúng
- **Then** response `204`; cả 2 RT trong DB đều có `revokedAt != null`; refresh trên cả 2 thiết bị fail với `401`

**AC-3: Change password từ chối nếu currentPassword sai**

- **Given** user đang login
- **When** gọi `PATCH /users/me/change-password` với `currentPassword` không đúng
- **Then** response `401 INVALID_CREDENTIALS` — không thay đổi password, không revoke tokens

**AC-4: Admin list users — User thường bị từ chối**

- **Given** User role `USER` có valid token
- **When** gọi `GET /api/v1/users`
- **Then** response `403 FORBIDDEN` — không leak số lượng hay thông tin users

**AC-5: Admin list users — Admin được phép và response không có password**

- **Given** Admin có valid token
- **When** gọi `GET /api/v1/users`
- **Then** response `200` với array users — không có `password` field trong bất kỳ user object nào

**AC-6: Soft delete giữ nguyên record trong DB**

- **Given** User tồn tại trong DB
- **When** Admin gọi `DELETE /api/v1/users/:id`
- **Then** response `204`; User record vẫn tồn tại trong DB với `deletedAt != null` — không bị xóa vật lý; user không còn login được

---

## Verify hoàn thành

### Test 1 — GET /users/me
```http
GET http://localhost:3000/api/v1/users/me
Authorization: Bearer <access_token>
```
Phải trả user info, **không có** `password` field.

### Test 2 — Change password revokes tokens
Đổi password → thử refresh với token cũ → phải fail `401`.

### Test 3 — Admin list users
Login với `admin@ecom.dev`, gọi:
```http
GET http://localhost:3000/api/v1/users
Authorization: Bearer <admin_token>
```
Phải trả danh sách users.

### Test 4 — User thường không được list users
```http
GET http://localhost:3000/api/v1/users
Authorization: Bearer <user_token>
# Phải trả 403 FORBIDDEN
```

---

## 🚫 Ngoài phạm vi

- Address management (thêm/sửa/xóa địa chỉ giao hàng) → Phase D Task 03
- Profile photo upload → Phase D (cần file storage)
- Email change flow (cần verify email mới) → Phase D
- Admin suspend/reactivate user (chỉ set `isActive`) → có thể thêm sau
- Admin audit log (who did what) → Phase D (Observability)
- Pagination cho admin list users → thêm khi có nhiều users

---

## Xong thì làm gì?

→ Mở task tiếp theo: [15-phase-b-exit-gate.md](./15-phase-b-exit-gate.md)
