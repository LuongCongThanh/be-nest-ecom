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
- **`@CurrentUser()` param decorator**: extract user từ `request.user` đã được strategy attach sẵn thay vì đọc `req.user` raw khắp nơi — type-safe, reusable, không phụ thuộc Express request object shape.
- **`JwtAuthGuard.handleRequest`**: customize error message — `TokenExpiredError` trả `TOKEN_EXPIRED` (khác với `TOKEN_INVALID`) để client biết cần refresh, không cần re-login.

---

## 🧭 Đọc để hiểu trước khi làm

Giữ 5 ý này trong đầu là đủ để bắt đầu làm:

- `@Public()` = route ngoại lệ, không cần token
- `JwtAuthGuard` = chặn route không public và xác thực JWT
- `JwtStrategy` = map JWT payload thành `request.user`
- `RolesGuard` = kiểm tra role sau khi đã xác thực
- `@CurrentUser('id')` = lấy từ `request.user.id`, không đọc raw payload

Nếu muốn hiểu kỹ hơn:

- cơ chế hoạt động: [04-guards-decorators.md](../../setup/03-conventions/04-guards-decorators.md#-cách-hoạt-động)
- vì sao thiết kế như vậy: [04-guards-decorators.md](../../setup/03-conventions/04-guards-decorators.md#-vì-sao-phải-code-như-vậy)
- cách đọc implementation: [04-guards-decorators.md](../../setup/03-conventions/04-guards-decorators.md#-cách-đọc-implementation)

---

## 🛠️ Các bước thực hiện

### 0. Scaffold bằng NestJS CLI

Chạy lần lượt các lệnh sau để tạo boilerplate (thay nội dung ở các bước sau):

```powershell
# Decorators
nest g decorator common/decorators/public --no-spec
nest g decorator common/decorators/roles --no-spec
nest g decorator common/decorators/current-user --no-spec

# Guards
nest g guard common/guards/jwt-auth --no-spec
nest g guard common/guards/roles --no-spec
```

> `--no-spec` bỏ qua file test; `nest g` tự cập nhật barrel export nếu có.

### CLI nên chạy trước hay sau khi sửa file?

Nên chạy CLI **trước**.

Thứ tự làm đúng cho task này là:

1. Chạy các lệnh `nest g ...`
2. Để Nest tạo đúng file/folder khung
3. Mở các file đó lên và thay nội dung theo task này
4. Sửa `AppModule`
5. Sửa `HealthController`
6. Chạy app và verify

Lý do:

- CLI giúp tạo đúng cấu trúc thư mục mà repo đang dùng
- bạn đỡ bị lệch path import
- bạn không phải đoán tên file/nơi đặt file
- sau này nhìn lại cũng đúng pattern của Nest CLI

Bạn có thể xem CLI như bước "dựng khung nhà", còn phần code trong file là bước "lắp logic thật vào bên trong".

---

### 1. Tạo decorators

Repo này đang dùng cấu trúc thư mục lồng theo từng decorator/guard. Sau khi scaffold, hãy điền nội dung vào đúng các file sau:

- `src/common/decorators/public/public.decorator.ts`
- `src/common/decorators/roles/roles.decorator.ts`
- `src/common/decorators/current-user/current-user.decorator.ts`
- `src/common/guards/jwt-auth/jwt-auth.guard.ts`
- `src/common/guards/roles/roles.guard.ts`

Điền nội dung vào `src/common/decorators/public/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Code này đang làm gì:

- tạo ra một metadata key tên là `isPublic`
- `@Public()` không tự mở route, nó chỉ gắn nhãn `isPublic = true` lên route hoặc controller
- sau đó `JwtAuthGuard` sẽ đọc nhãn này để biết route nào được bỏ qua bước kiểm tra JWT

Bạn nên hiểu file này như một "cây cờ đánh dấu", không phải một nơi xử lý request.

Tạo `src/common/decorators/roles/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Code này đang làm gì:

- tạo metadata key tên là `roles`
- `@Roles(...)` dùng để gắn danh sách role được phép lên route
- decorator này không tự kiểm tra quyền; nó chỉ khai báo rule để `RolesGuard` đọc lại sau

Ví dụ:

- `@Roles(Role.ADMIN)` nghĩa là route này yêu cầu role `ADMIN`
- nếu route không có `@Roles(...)`, `RolesGuard` sẽ hiểu là "đã đăng nhập rồi thì user nào cũng được"

Tạo `src/common/decorators/current-user/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Record<string, unknown> }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

Code này đang làm gì:

- lấy `request` từ `ExecutionContext`
- lấy `request.user` mà `JwtStrategy` đã attach từ trước
- nếu bạn gọi `@CurrentUser()` thì trả về toàn bộ `user`
- nếu bạn gọi `@CurrentUser('id')` thì trả về riêng `user.id`

Điểm quan trọng:

- decorator này không tạo ra `request.user`
- nếu `request.user` bị sai hoặc `undefined`, lỗi thật thường nằm ở `JwtStrategy` hoặc `JwtAuthGuard`, không phải ở decorator này

> Không cần tạo `src/common/decorators/index.ts` ở bước này. Repo hiện tại đang import trực tiếp từng file decorator, nên cứ bám theo pattern đó để tránh tự tạo thêm barrel export rồi lại phải sửa import ở nhiều chỗ.

### 2. Tạo JwtAuthGuard

Điền nội dung vào `src/common/guards/jwt-auth/jwt-auth.guard.ts` (đã scaffold ở bước 0):

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/public/public.decorator';

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

Code này đang làm gì:

- `extends AuthGuard('jwt')` nghĩa là guard này tái sử dụng JWT auth flow chuẩn của NestJS/Passport
- `constructor(...reflector)` để guard có thể đọc metadata từ `@Public()`
- `canActivate()` trả lời câu hỏi đầu tiên: route này có cần auth không?
- nếu route có `@Public()` -> trả `true`, request đi qua luôn
- nếu route không public -> gọi `super.canActivate(context)` để Passport xử lý JWT

Phần `handleRequest()` là chỗ bạn custom cách trả lỗi:

- token hết hạn -> trả `TOKEN_EXPIRED`
- token sai hoặc không có user -> trả `TOKEN_INVALID`
- nếu mọi thứ ổn -> trả `user`

Bạn nên đọc guard này như một người gác cổng có 2 bước:

1. nhìn xem route có được miễn kiểm tra không
2. nếu không được miễn thì dùng JWT auth flow chuẩn để kiểm tra

Vì sao không tự verify token trong file này?

- vì `AuthGuard('jwt')` đã có sẵn flow chuẩn rồi
- việc của mình chỉ là thêm luật riêng của app: `@Public()` và custom error code

### 3. Tạo RolesGuard

Điền nội dung vào `src/common/guards/roles/roles.guard.ts` (đã scaffold ở bước 0):

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles/roles.decorator';
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

Code này đang làm gì:

- đọc metadata `roles` mà `@Roles(...)` đã gắn lên route
- nếu route không có `@Roles(...)` -> cho qua luôn
- nếu route có role yêu cầu -> lấy `request.user.role` ra so
- nếu role không khớp -> ném `403 FORBIDDEN`

Điểm rất quan trọng:

- guard này không lo chuyện "đăng nhập chưa"; việc đó là của `JwtAuthGuard`
- guard này chỉ lo chuyện "đã đăng nhập rồi, nhưng có đúng quyền không"

Vì vậy:

- `401` = fail ở tầng authentication
- `403` = qua authentication rồi nhưng fail ở tầng authorization

### 4. Đăng ký global trong AppModule

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles/roles.guard';
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

Code này đang làm gì:

- `PassportModule` được import để auth flow của Passport hoạt động đúng
- `APP_GUARD` biến `JwtAuthGuard` và `RolesGuard` thành global guards
- nghĩa là mọi request trong app đều đi qua 2 guard này, không cần gắn thủ công từng controller

Thứ tự ở đây có ý nghĩa:

- `JwtAuthGuard` nên chạy trước để xác thực user
- `RolesGuard` chạy sau vì nó cần `request.user` đã tồn tại rồi mới kiểm tra role được

### 5. Đánh dấu Health endpoint là Public

Trong `health.controller.ts`:

```typescript
import { Public } from '../common/decorators/public/public.decorator';

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

Code này đang làm gì:

- gắn `@Public()` lên các health endpoints
- nhờ vậy `JwtAuthGuard` nhìn thấy metadata `isPublic = true` và không bắt token ở các route này

Tại sao health route nên public?

- load balancer, monitoring tool, hoặc platform health check thường không gửi JWT
- nếu health endpoint cũng yêu cầu token thì hệ thống khó kiểm tra tình trạng sống/chết của service

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
- **Then** `userId` đúng với user id cuối cùng sau khi `JwtStrategy.validate()` map `payload.sub -> request.user.id`

> Lưu ý để tránh nhầm: JWT payload gốc có field `sub`, nhưng sau khi qua `JwtStrategy`, object gắn vào `request.user` trong repo này là `{ id, email, role }`. Vì vậy `@CurrentUser('id')` là đúng với shape runtime của `request.user`, không phải đang đọc trực tiếp raw payload.

---

## Verify hoàn thành

Mục tiêu của phần này là: sau mỗi bước bạn đều tự xác nhận được mình đang đúng ở đâu, sai ở đâu, thay vì code xong mới phát hiện mọi thứ fail cùng lúc.

### Trước khi verify

- Chạy app lên bình thường.
- Xác nhận `AppModule` đã đăng ký 2 global guards.
- Xác nhận `HealthController` đã có `@Public()`.
- Nếu chưa có auth feature hoàn chỉnh để phát access token, bạn vẫn verify được 2 thứ đầu tiên: public route và protected route không có token.

### Test 1 — Public route không cần token
```
GET http://localhost:3000/health
# Phải trả 200 dù không có Authorization header
```

Nếu test này fail `401`, kiểm tra theo thứ tự:

- `JwtAuthGuard.canActivate()` có đọc đúng `IS_PUBLIC_KEY` chưa
- import `Public` trong `health.controller.ts` có đúng path repo hiện tại chưa
- `JwtAuthGuard` có đang được đăng ký bằng `APP_GUARD` không

### Test 2 — Protected route cần token
```
GET http://localhost:3000/api/v1/users/me
# Không có token → phải trả 401 { code: "TOKEN_INVALID" }
```

Nếu repo ở thời điểm bạn làm chưa có `/api/v1/users/me`, dùng bất kỳ endpoint non-public nào hiện có để verify cùng hành vi:

- route không có `@Public()`
- request không gửi Bearer token
- kết quả phải là `401`, không phải `200`

### Test 3 — Expired token và role mismatch

Chỉ làm test này khi bạn đã có auth feature hoặc đã tự tạo được token test:

- Token hết hạn → protected route phải trả `401 { code: "TOKEN_EXPIRED" }`
- Token hợp lệ nhưng sai role → endpoint `@Roles(Role.ADMIN)` phải trả `403 { code: "FORBIDDEN" }`

Nếu test role bị trả `401` thay vì `403`, nghĩa là request chưa qua được tầng authentication; hãy debug `JwtStrategy` hoặc Bearer token trước, chưa nên debug `RolesGuard`.

### Test 4 — `@CurrentUser()` hoạt động đúng

Khi đã có một protected endpoint để thử nghiệm, tạm log hoặc return giá trị từ:

```typescript
@Get('me')
getMe(@CurrentUser() user: { id: string; email: string; role: string }) {
  return user;
}
```

Sau đó thử tiếp:

```typescript
@Get('me/id')
getMyId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

Kỳ vọng:

- `@CurrentUser()` trả về toàn bộ object `request.user`
- `@CurrentUser('id')` trả về đúng `request.user.id`
- nếu `request.user` không có `id`, quay lại kiểm tra `JwtStrategy.validate()`

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
