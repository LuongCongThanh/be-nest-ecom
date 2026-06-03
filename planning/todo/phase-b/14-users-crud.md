# Task 14 — Users CRUD & Profile

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 13
**Ưu tiên**: 🟡 SHOULD (Operations + UX — cần cho admin quản lý và user tự quản lý profile)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [05-users-crud.md](../../business/01-identity/05-users-crud.md) · [06-user-profile.md](../../business/01-identity/06-user-profile.md) · [07-change-password.md](../../business/01-identity/07-change-password.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Implement hai nhóm endpoints riêng biệt:

1. **Self-service (user)**: `GET/PATCH /users/me`, `PATCH /users/me/change-password`
2. **Admin governance**: `GET /users`, `DELETE /users/:id`

Bốn nguyên tắc cốt lõi:

- **`password` không bao giờ trả về response**: dùng `select` field trong Prisma query để exclude tại tầng DB — không chỉ xóa sau khi query. Một developer quên điều này là lỗi security nghiêm trọng.
- **Change password phải revoke tất cả refresh tokens**: sau khi đổi password, mọi phiên cũ invalid — attacker đang giữ token cũ bị log out. Không làm điều này thì old session vẫn active.
- **Soft delete, không hard delete**: `deletedAt` timestamp được set, record vẫn tồn tại trong DB — Order history của user đó vẫn truy vấn được.
- **Admin không được tự xóa chính mình**: tránh tự khóa tài khoản admin cuối cùng của hệ thống.

---

## 📍 Current Repo State

Repo hiện tại đã có **một phần nền tảng** cho Task 14:

- **Đã có:**
  - `src/modules/identity/dto/update-profile.dto.ts` — file rỗng (placeholder)
  - `src/modules/identity/dto/change-password.dto.ts` — file rỗng (placeholder)
  - `src/modules/identity/repositories/user.repository.ts` — có `findActiveById()`, `findByEmail()`
  - `@Roles` decorator tại `src/common/decorators/roles/roles.decorator.ts`
  - `RolesGuard` tại `src/common/guards/roles/roles.guard.ts`
  - `@CurrentUser` decorator tại `src/common/decorators/current-user/current-user.decorator.ts`
  - `IdentityModule` tại `src/modules/identity.module.ts` — cần thêm `UsersController` + `UserService`

- **Chưa có:**
  - Nội dung trong 2 DTO files
  - `UserService` tại `src/modules/identity/services/user.service.ts`
  - `UsersController` tại `src/modules/identity/controllers/users.controller.ts`

---

## 📄 Luồng nghiệp vụ

### Self-service — User tự quản lý

| Endpoint                    | Method | Auth          | Mô tả                               |
| :-------------------------- | :----- | :------------ | :---------------------------------- |
| `/users/me`                 | GET    | Authenticated | Xem profile bản thân                |
| `/users/me`                 | PATCH  | Authenticated | Cập nhật firstName, lastName, phone |
| `/users/me/change-password` | PATCH  | Authenticated | Đổi password (cần currentPassword)  |

### Admin governance

| Endpoint     | Method | Auth  | Mô tả                            |
| :----------- | :----- | :---- | :------------------------------- |
| `/users`     | GET    | ADMIN | List tất cả users                |
| `/users/:id` | DELETE | ADMIN | Soft delete user + revoke tokens |

### Change Password Flow — `PATCH /users/me/change-password`

| #   | Bước            | Hành động                                        | Lỗi có thể trả về         |
| :-- | :-------------- | :----------------------------------------------- | :------------------------ |
| 1   | Lookup          | Tìm user theo userId từ JWT payload              | `404 USER_NOT_FOUND`      |
| 2   | Verify hiện tại | `bcrypt.compare(currentPassword, user.password)` | `401 INVALID_CREDENTIALS` |
| 3   | Hash mới        | `bcrypt.hash(newPassword, 12)`                   | —                         |
| 4   | Transaction     | Update password + revoke tất cả refresh tokens   | —                         |
| 5   | Return          | `204 No Content`                                 | —                         |

---

## 🧠 Trước khi code — Pseudo-code flow

**Bài tập**: Viết bằng tiếng Việt (không dùng TypeScript), mô tả từng bước của hàm `changePassword()`. Sau đó đối chiếu với bảng Change Password Flow ở trên.

```text
// HÀM changePassword(userId, currentPassword, newPassword):
// 1. ...
// 2. ...
// 3. ...
// 4. ...
// 5. Trả về ...
```

> Chỉ đọc tiếp sau khi đã tự viết xong pseudo-code.

---

## 🛠️ Các bước thực hiện

> **Nguyên tắc**: DTO → Service → Controller → Module. Đọc từng lớp độc lập — đừng đọc lớp sau khi chưa hiểu lớp trước.

---

### Lớp 1 — DTOs

#### 1a. `UpdateProfileDto`

**File cần điền**: `src/modules/identity/dto/update-profile.dto.ts`

**3-câu phân tích** (tự trả lời trước khi code):

- Nhận input gì từ request body?
- Tại sao tất cả fields đều `@IsOptional()`?
- Validation gì cần thiết cho `phone`?

**Skeleton** — copy cái này, tự điền decorator:

```typescript
// src/modules/identity/dto/update-profile.dto.ts

export class UpdateProfileDto {
  // ??? — optional string, max 50 chars
  firstName?: string;

  // ??? — optional string, max 50 chars
  lastName?: string;

  // ??? — optional, phải match pattern số VN
  phone?: string;
}
```

<details>
<summary>💡 Hint 1 — Ý tưởng</summary>

`UpdateProfileDto` là partial update — không có field nào bắt buộc. Tất cả optional nhưng nếu được gửi thì phải hợp lệ. Phone VN bắt đầu bằng `+84` hoặc `0`, theo sau 9 chữ số.

</details>

<details>
<summary>💡 Hint 2 — Decorator/API cần dùng</summary>

Import từ `class-validator`:

- `@IsOptional()` — cho phép undefined/null
- `@IsString()` — phải là chuỗi nếu có
- `@MinLength(1)` / `@MaxLength(50)` — ràng buộc độ dài
- `@Matches(/regex/, { message })` — regex validation

</details>

<details>
<summary>💡 Hint 3 — Full code (chỉ xem khi đã thử)</summary>

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

</details>

---

#### 1b. `ChangePasswordDto`

**File cần điền**: `src/modules/identity/dto/change-password.dto.ts`

**3-câu phân tích**:

- Cần 2 fields gì?
- Tại sao `currentPassword` không cần validate độ dài/complexity?
- Password mới cần quy tắc gì để đủ mạnh?

**Skeleton**:

```typescript
// src/modules/identity/dto/change-password.dto.ts

export class ChangePasswordDto {
  // ??? — chỉ cần @IsString()
  currentPassword: string;

  // ??? — string, min 8, max 64, phải có uppercase + lowercase + digit
  newPassword: string;
}
```

<details>
<summary>💡 Full code (chỉ xem khi đã thử)</summary>

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

</details>

---

### Lớp 2 — Service: `UserService`

**File cần tạo**: `src/modules/identity/services/user.service.ts`

**3-câu phân tích cho từng method** (tự điền):

| Method                          | Nhận input gì? | Gọi sang đâu? | Trả output gì? |
| :------------------------------ | :------------- | :------------ | :------------- |
| `getMe(userId)`                 |                |               |                |
| `updateProfile(userId, dto)`    |                |               |                |
| `changePassword(userId, dto)`   |                |               |                |
| `findAll()`                     |                |               |                |
| `softDelete(targetId, adminId)` |                |               |                |

#### 2a. Method `getMe()`

**Câu hỏi quan trọng** — trả lời trước khi xem hint:

> Tại sao dùng `select` để loại trừ `password` thay vì query toàn bộ rồi `delete user.password`?

**Skeleton**:

```typescript
async getMe(userId: string) {
  const user = await this.prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      // ??? — list các field cần thiết, KHÔNG có password
    },
  });

  if (!user) throw new NotFoundException(/* ??? */);
  return user;
}
```

<details>
<summary>💡 Hint — Tại sao dùng select</summary>

`delete user.password` vẫn fetch password từ DB — chỉ xóa ở tầng application. Nếu dev quên một endpoint khác, password bị leak. `select` loại trừ tại tầng DB query — không bao giờ lên đến application code, an toàn hơn.

</details>

<details>
<summary>💡 Full code `getMe()`</summary>

```typescript
async getMe(userId: string) {
  const user = await this.prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
  return user;
}
```

</details>

---

#### 2b. Method `changePassword()`

Đây là method phức tạp nhất — phải dùng `prisma.$transaction` vì update password và revoke tokens phải atomic.

**Pseudo-code trước** (viết bằng tiếng Việt):

```text
async changePassword(userId, dto):
  1. tìm user theo userId
  2. nếu không tìm thấy: throw ...
  3. so sánh dto.currentPassword với user.password → nếu sai: throw ...
  4. hash dto.newPassword
  5. transaction: ...
  6. trả về void (204)
```

**Skeleton**:

```typescript
async changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException(/* ??? */);

  const valid = await bcrypt.compare(/* ??? */);
  if (!valid) throw new UnauthorizedException(/* ??? */);

  const hashedNew = await bcrypt.hash(/* ??? */);

  await this.prisma.$transaction([
    // ??? — update password
    // ??? — revoke tất cả refresh tokens (revokedAt = now)
  ]);
}
```

> **Câu hỏi**: Tại sao dùng `$transaction` ở đây? Điều gì xảy ra nếu update password thành công nhưng revoke tokens thất bại?

<details>
<summary>💡 Hint — Về transaction</summary>

Nếu password đã đổi nhưng refresh tokens chưa revoke (service crash giữa chừng), attacker vẫn dùng được token cũ. `$transaction` đảm bảo cả hai thay đổi commit cùng lúc hoặc cùng rollback — không có trạng thái trung gian.

</details>

<details>
<summary>💡 Full code `changePassword()`</summary>

```typescript
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
```

</details>

---

#### 2c. Methods `findAll()` và `softDelete()`

**`findAll()`** — đơn giản: query users chưa bị soft delete, `select` không có `password`.

**`softDelete(targetId, adminId)`** — cần guard trước khi delete:

**Câu hỏi**: Tại sao phải truyền `adminId` vào `softDelete` — service cần nó để làm gì?

**Skeleton**:

```typescript
async findAll() {
  return this.prisma.user.findMany({
    where: { deletedAt: null },
    select: { /* ??? — không có password */ },
  });
}

async softDelete(targetId: string, adminId: string) {
  // ??? — guard: admin không được tự xóa mình
  if (/* ??? */) throw new ForbiddenException(/* ??? */);

  await this.prisma.$transaction([
    // ??? — set deletedAt + isActive = false
    // ??? — revoke tất cả refresh tokens của targetId
  ]);
}
```

<details>
<summary>💡 Full code `findAll()` và `softDelete()`</summary>

```typescript
async findAll() {
  return this.prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async softDelete(targetId: string, adminId: string) {
  if (targetId === adminId) {
    throw new ForbiddenException({
      code: 'CANNOT_DELETE_SELF',
      message: 'Admin cannot delete their own account',
    });
  }

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date(), isActive: false },
    }),
    this.prisma.refreshToken.updateMany({
      where: { userId: targetId },
      data: { revokedAt: new Date() },
    }),
  ]);
}
```

</details>

---

### Lớp 3 — Controller: `UsersController`

**File cần tạo**: `src/modules/identity/controllers/users.controller.ts`

**3-câu phân tích trước**:

| Endpoint                     | Nhận input                | Gọi sang đâu                   | Status code trả về |
| :--------------------------- | :------------------------ | :----------------------------- | :----------------- |
| `GET /users/me`              | AT header                 | `userService.getMe()`          | 200                |
| `PATCH /users/me`            | AT header + body          | `userService.updateProfile()`  | 200                |
| `PATCH /users/me/change-pwd` | AT header + body          | `userService.changePassword()` | 204                |
| `GET /users`                 | AT header (ADMIN)         | `userService.findAll()`        | 200                |
| `DELETE /users/:id`          | AT header (ADMIN) + param | `userService.softDelete()`     | 204                |

**Câu hỏi về guard** — trả lời trước khi xem hint:

- `GET /users/me` — cần `@Roles()` không? Tại sao?
- `DELETE /users/:id` — cần decorator gì thêm ngoài `@Roles(Role.ADMIN)`?

**Skeleton**:

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    // ???
  }

  @Patch('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    // ???
  }

  @Patch('me/change-password')
  @HttpCode(HttpStatus.???)
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    // ???
  }

  @Get()
  @Roles(???)
  findAll() {
    // ???
  }

  @Delete(':id')
  @Roles(???)
  @HttpCode(HttpStatus.???)
  remove(@Param('id') targetId: string, @CurrentUser('id') adminId: string) {
    // ???
  }
}
```

<details>
<summary>💡 Hint — Về guard và @Roles()</summary>

- `GET /users/me`: JWT guard đã apply global, không cần `@Roles()` — mọi authenticated user đều được.
- `DELETE /users/:id`: cần `@Roles(Role.ADMIN)` để chỉ ADMIN được gọi. Cần truyền cả `adminId` để service kiểm tra "admin không xóa chính mình".

</details>

<details>
<summary>💡 Full code `UsersController`</summary>

```typescript
import { Controller, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user/current-user.decorator';
import { Roles } from '../../../common/decorators/roles/roles.decorator';
import { UserService } from '../services/user.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth()
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
  remove(@Param('id') targetId: string, @CurrentUser('id') adminId: string) {
    return this.userService.softDelete(targetId, adminId);
  }
}
```

</details>

---

### Lớp 4 — Module wiring

**File cần sửa**: `src/modules/identity.module.ts`

Thêm `UsersController` vào `controllers` và `UserService` vào `providers`:

```typescript
// Trước:
controllers: [AuthController],
providers: [AuthService, TokenService, JwtStrategy],

// Sau:
controllers: [AuthController, UsersController],
providers: [AuthService, TokenService, JwtStrategy, UserService],
```

Chạy `nest build` để xác nhận không có lỗi DI.

---

## ✍️ Reflection — Viết lại bằng lời của bạn

Sau khi task xong, **đóng hết file lại** và tự điền bảng này:

| File                                          | Vai trò trong 1 câu |
| :-------------------------------------------- | :------------------ |
| `update-profile.dto.ts`                       |                     |
| `change-password.dto.ts`                      |                     |
| `user.service.ts` — method `getMe()`          |                     |
| `user.service.ts` — method `changePassword()` |                     |
| `user.service.ts` — method `softDelete()`     |                     |
| `users.controller.ts`                         |                     |

> Nếu điền được mà không cần mở file → bạn đã hiểu thật sự. Nếu phải mở lại → đọc thêm 1 lần rồi thử lại.

---

## ✅ Tiêu chí nghiệm thu

**AC-1: `password` không bao giờ xuất hiện trong response**

- **Given** user đã login có access token hợp lệ
- **When** gọi `GET /api/v1/users/me`
- **Then** response JSON không chứa field `password` — kể cả dạng hash

**AC-2: Change password revoke tất cả refresh tokens**

- **Given** user có 2 refresh token active trên 2 thiết bị
- **When** gọi `PATCH /api/v1/users/me/change-password` với `currentPassword` đúng
- **Then** response `204`; cả 2 RT trong DB đều có `revokedAt != null`; refresh trên cả 2 thiết bị fail với `401`

**AC-3: Change password từ chối nếu currentPassword sai**

- **Given** user đang login
- **When** gọi `PATCH /api/v1/users/me/change-password` với `currentPassword` không đúng
- **Then** response `401 INVALID_CREDENTIALS` — không thay đổi password, không revoke tokens

**AC-4: Admin list users — User thường bị từ chối**

- **Given** User role `USER` có valid token
- **When** gọi `GET /api/v1/users`
- **Then** response `403 FORBIDDEN`

**AC-5: Admin list users — Admin được phép và response không có password**

- **Given** Admin có valid token
- **When** gọi `GET /api/v1/users`
- **Then** response `200` với array users — không có `password` field trong bất kỳ user object nào

**AC-6: Soft delete giữ nguyên record trong DB**

- **Given** User tồn tại trong DB
- **When** Admin gọi `DELETE /api/v1/users/:id`
- **Then** response `204`; user record vẫn tồn tại trong DB với `deletedAt != null`; user không còn login được

**AC-7: Admin không tự xóa được chính mình**

- **Given** Admin đang login
- **When** gọi `DELETE /api/v1/users/<admin-own-id>`
- **Then** response `403 CANNOT_DELETE_SELF`

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

```http
PATCH http://localhost:3000/api/v1/users/me/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{ "currentPassword": "OldPass1", "newPassword": "NewPass1" }
```

### Test 3 — Admin list users

Login với `admin@ecom.dev`, gọi:

```http
GET http://localhost:3000/api/v1/users
Authorization: Bearer <admin_token>
```

Phải trả danh sách users, không có `password` field.

### Test 4 — User thường không được list users

```http
GET http://localhost:3000/api/v1/users
Authorization: Bearer <user_token>
# Phải trả 403 FORBIDDEN
```

### Test 5 — Admin không xóa được chính mình

```http
DELETE http://localhost:3000/api/v1/users/<admin-own-id>
Authorization: Bearer <admin_token>
# Phải trả 403 CANNOT_DELETE_SELF
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
