# Task 11 — Guards & Decorators

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 10
**Ưu tiên**: 🔴 BLOCKING (Security — default-deny, mọi endpoint sau đây cần guards này)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [04-guards-decorators.md](../../setup/03-conventions/04-guards-decorators.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Tạo `JwtAuthGuard`, `RolesGuard` và các decorators chuẩn. Đăng ký global theo **nguyên tắc default-deny**.

- **Default-deny là nguyên tắc bảo mật cốt lõi**: mọi route mặc định cần auth — developer phải chủ động đánh dấu `@Public()` để opt-out. Ngược lại (default-allow, developer phải nhớ thêm `@UseGuards(JwtAuthGuard)` mỗi route) thì một route quên là leak production.
- **`@Public()` là opt-in whitelist**: chỉ auth endpoints và health endpoint được public. Mọi thứ khác bị protected by default.
- **`@Roles(Role.ADMIN)` vs không có**: không có `@Roles()` → authenticated user bất kỳ được phép. Có `@Roles(Role.ADMIN)` → chỉ ADMIN. Hai tầng bảo vệ: authentication (ai?) + authorization (có quyền gì?).
- **`@CurrentUser()` param decorator**: extract user từ request JWT payload thay vì `req.user` raw — type-safe, reusable, không phụ thuộc Express request object shape.
- **`JwtAuthGuard.handleRequest`**: customize error message — `TokenExpiredError` trả `TOKEN_EXPIRED` (khác với `TOKEN_INVALID`) để client biết cần refresh, không cần re-login.

---

## 🛠️ Các bước thực hiện

### 1. Tạo decorators

Tạo `src/common/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Tạo `src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Tạo `src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

Tạo `src/common/decorators/index.ts`:
```typescript
export * from './public.decorator';
export * from './roles.decorator';
export * from './current-user.decorator';
```

### 2. Tạo JwtAuthGuard

Tạo `src/common/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Token has expired' });
    }
    if (err || !user) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Invalid token' });
    }
    return user;
  }
}
```

### 3. Tạo RolesGuard

Tạo `src/common/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!requiredRoles.includes(user?.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }

    return true;
  }
}
```

### 4. Đăng ký global trong AppModule

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    // ... các module khác
    PassportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

### 5. Đánh dấu Health endpoint là Public

Trong `health.controller.ts`:

```typescript
import { Public } from '../common/decorators';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() { ... }

  @Public()
  @Get('ready')
  async ready() { ... }
}
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Public route không cần token**

- **Given** guards đã đăng ký global
- **When** gọi `GET http://localhost:3000/health` không có Authorization header
- **Then** response `200` — không bị chặn bởi JwtAuthGuard

**AC-2: Protected route từ chối khi không có token**

- **Given** một endpoint không có `@Public()`
- **When** gọi không có `Authorization: Bearer` header
- **Then** response `401 { code: "TOKEN_INVALID", message: "Invalid token" }`

**AC-3: Expired token trả TOKEN_EXPIRED (khác TOKEN_INVALID)**

- **Given** access token đã expired
- **When** dùng token đó để gọi protected endpoint
- **Then** response `401 { code: "TOKEN_EXPIRED" }` — client biết cần refresh, không cần re-login

**AC-4: Role mismatch trả 403 (không phải 401)**

- **Given** User role `USER` có valid token, endpoint yêu cầu `@Roles(Role.ADMIN)`
- **When** gọi endpoint đó với token của USER
- **Then** response `403 { code: "FORBIDDEN" }` — authentication pass, authorization fail; phân biệt rõ 401 vs 403

**AC-5: `@CurrentUser('id')` extract đúng userId**

- **Given** authenticated user với token hợp lệ
- **When** controller method dùng `@CurrentUser('id') userId: string`
- **Then** `userId` đúng với `sub` trong JWT payload

---

## Verify hoàn thành

### Test 1 — Public route không cần token
```
GET http://localhost:3000/health
# Phải trả 200 dù không có Authorization header
```

### Test 2 — Protected route cần token
```
GET http://localhost:3000/api/v1/users/me
# Không có token → phải trả 401 { code: "TOKEN_INVALID" }
```

---

## 🚫 Ngoài phạm vi

- RBAC với permissions granular (không chỉ roles) → nếu cần sẽ thêm PermissionsGuard sau
- Attribute-based access control (ABAC) → ngoài scope Phase B
- Rate limiting per-user sau authentication → Phase D (`@nestjs/throttler`)
- API key authentication (cho third-party) → backlog
- WebSocket guards → sẽ thêm khi có WebSocket feature

---

## Xong thì làm gì?

→ Mở task tiếp theo: [12-auth-feature.md](./12-auth-feature.md)
