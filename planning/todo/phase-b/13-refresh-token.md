# Task 13 — Refresh Token Rotation

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 12
**Ưu tiên**: 🔴 BLOCKING (Security — UX không thể dùng nếu thiếu, và thiếu thì có lỗ hổng bảo mật)
**Trạng thái**: 🔵 In progress (đã có nền `TokenService` + schema `refresh_tokens`, nhưng refresh rotation/replay detection chưa implement)
**Spec gốc**: [08-refresh-token.md](../../business/01-identity/08-refresh-token.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Implement refresh token rotation với replay detection. Cân bằng giữa UX (không bắt re-login mỗi 30 phút) và bảo mật (revocation instant khi cần).

- **Rotation**: mỗi lần `POST /auth/refresh` → sinh cặp token mới, token cũ bị mark `usedAt`. Không reuse token cũ — giảm window nếu token bị intercepted.
- **Replay detection**: nếu token đã có `usedAt != null` được dùng lại → **kill toàn bộ token family** và buộc re-login. Logic: nếu token cũ được dùng lại, attacker đã chiếm token và cả user lẫn attacker đang dùng — kill hết để force re-auth an toàn.
- **`familyId` group**: tất cả refresh token sinh ra từ cùng một phiên login (chain rotate) có cùng `familyId`. Kill family = đăng xuất phiên đó khỏi mọi thiết bị đang rotate trong chain đó.
- **Hash-based storage**: DB chỉ lưu `tokenHash`, còn raw refresh token chỉ tồn tại ở client. Lookup được thực hiện bằng cách hash token nhận vào rồi query theo hash đó.
- **Revocation triggers**: logout (chỉ token hiện tại), logout-all (toàn bộ token của user), change-password (toàn bộ), admin suspend (toàn bộ).
- **Access token vẫn hợp lệ đến hết TTL**: khi RT bị revoke, AT còn TTL vẫn pass — đây là trade-off chấp nhận được. Revoke AT tức thì cần blacklist Redis (Phase D).

---

## 📍 Current Repo State

Repo hiện tại mới có **một phần nền tảng** cho Task 13:

- Đã có bảng `refresh_tokens` trong schema/migrations với các field phục vụ rotation như `familyId`, `usedAt`, `revokedAt`, `expiresAt`
- Đã có `TokenService` tại `src/modules/identity/services/token.service.ts`
- `TokenService` hiện **mới có**:
  - `issueTokenPair(userId, email, role, db?)`
  - `revokeAllUserTokens(userId)`
  - `hashRefreshToken(token)` — private, đã có sẵn để tái dùng
- `AuthController` hiện chỉ inject `AuthService` — controller mỏng, mọi business logic nằm ở service layer
- `AuthService` là tầng trung gian giữa controller và `TokenService`

**Chưa có:**

- `RefreshDto`
- Method `refresh()`, `logout()`, `logoutAll()` trong `TokenService`
- Method bridge `refresh()`, `logout()`, `logoutAll()` trong `AuthService`
- Endpoint `POST /api/v1/auth/refresh`
- Endpoint `POST /api/v1/auth/logout`
- Endpoint `POST /api/v1/auth/logout-all`

---

## 📄 Luồng nghiệp vụ

### Refresh Flow — `POST /api/v1/auth/refresh`

| #   | Bước         | Hành động                                          | Lỗi có thể trả về                   |
| :-- | :----------- | :------------------------------------------------- | :---------------------------------- |
| 1   | Lookup       | Hash RT nhận vào rồi tìm trong DB theo `tokenHash` | `401 INVALID_REFRESH_TOKEN`         |
| 2   | Replay check | `usedAt != null`? → kill toàn family               | `401 REFRESH_TOKEN_REPLAY_DETECTED` |
| 3   | Revoke check | `revokedAt != null`?                               | `401 REFRESH_TOKEN_REVOKED`         |
| 4   | Expiry check | `expiresAt < now`?                                 | `401 REFRESH_TOKEN_EXPIRED`         |
| 5   | Mark used    | Set `usedAt = now` trên token cũ                   | —                                   |
| 6   | Issue mới    | Tạo RT mới cùng `familyId`, sinh AT mới            | —                                   |
| 7   | Return       | `{ accessToken, refreshToken }` mới                | —                                   |

### Revocation Triggers

| Trigger                 | Phạm vi revoke  |
| :---------------------- | :-------------- |
| `POST /auth/logout`     | Chỉ RT hiện tại |
| `POST /auth/logout-all` | Mọi RT của user |
| Đổi password (Task 14)  | Mọi RT của user |
| Admin suspend (Task 14) | Mọi RT của user |

---

## 🧠 Trước khi code — Pseudo-code flow

**Bài tập**: Viết bằng tiếng Việt (không dùng TypeScript), mô tả từng bước của hàm `refresh()`. Sau đó đối chiếu với bảng Luồng nghiệp vụ ở trên.

```
// HÀM refresh(rawRefreshToken):
// 1. ...
// 2. ...
// 3. ...
// 4. ...
// 5. ...
// 6. ...
// 7. Trả về ...
```

> Chỉ đọc tiếp sau khi đã tự viết xong pseudo-code.

---

## 🛠️ Các bước thực hiện

> **Nguyên tắc**: DTO → Service → Controller. Đọc từng lớp độc lập — đừng đọc lớp sau khi chưa hiểu lớp trước.

---

### Lớp 1 — DTO: `RefreshDto`

**File cần tạo**: `src/modules/identity/dto/refresh.dto/refresh.dto.ts`

**3-câu phân tích** (tự trả lời trước khi code):

- Nhận input gì từ request body?
- Gọi sang đâu?
- Trả output gì?

**Skeleton** — copy cái này, tự điền decorator:

```typescript
// src/modules/identity/dto/refresh.dto/refresh.dto.ts

export class RefreshDto {
  // ??? decorator nào cần ở đây?
  refreshToken!: string;
}
```

<details>
<summary>💡 Hint 1 — Ý tưởng</summary>

`RefreshDto` chỉ cần một field. Field đó phải là chuỗi, không được rỗng. Không cần validation phức tạp hơn.

</details>

<details>
<summary>💡 Hint 2 — Decorator/API cần dùng</summary>

Import từ `class-validator`:

- `@IsString()` — xác nhận đây là string
- `@IsNotEmpty()` — không cho phép string rỗng

</details>

<details>
<summary>💡 Hint 3 — Full code (chỉ xem khi đã thử)</summary>

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
```

</details>

---

### Lớp 2 — Service: methods mới trong `TokenService`

**File cần sửa**: `src/modules/identity/services/token.service.ts`

**3-câu phân tích cho từng method** (tự điền):

| Method                     | Nhận input gì? | Gọi sang đâu? | Trả output gì? |
| :------------------------- | :------------- | :------------ | :------------- |
| `refresh(rawToken)`        |                |               |                |
| `logout(userId, rawToken)` |                |               |                |
| `logoutAll(userId)`        |                |               |                |

#### 2a. Method `refresh()`

Đây là method phức tạp nhất — chứa toàn bộ 7 bước của Refresh Flow. Phải dùng `prisma.$transaction` vì bước 5 (mark used) và bước 6 (tạo token mới) phải atomic.

**Pseudo-code trước** (viết bằng tiếng Việt):

```
async refresh(rawToken):
  1. hash rawToken
  2. tìm trong DB theo hash → nếu không có: throw ...
  3. nếu usedAt != null: ...
  4. nếu revokedAt != null: ...
  5. nếu expiresAt < now: ...
  6. set usedAt = now trên token cũ
  7. tạo refresh token mới với familyId = (cũ hay mới?)
  8. ký access token mới
  9. trả về { accessToken, refreshToken }
```

**Skeleton** — copy cái này, tự viết phần bên trong:

```typescript
async refresh(refreshTokenValue: string) {
  const tokenHash = this.hashRefreshToken(refreshTokenValue);

  return this.prisma.$transaction(async (tx) => {
    // Bước 1: Lookup
    const tokenRecord = // ???

    // Bước 2: Replay check (usedAt)
    // ???

    // Bước 3: Revoke check (revokedAt)
    // ???

    // Bước 4: Expiry check
    // ???

    // Bước 5: Mark used
    // ???

    // Bước 6: Tạo refresh token mới (dùng lại familyId cũ!)
    // ???

    // Bước 7: Ký access token mới
    // ???

    return { accessToken, refreshToken: newRefreshTokenValue };
  });
}
```

> **Câu hỏi quan trọng**: Ở bước 6, `familyId` của token mới nên lấy từ đâu — `tokenRecord.familyId` hay `randomUUID()` mới? Tại sao?

<details>
<summary>💡 Hint 1 — Ý tưởng về replay detection</summary>

Khi `usedAt != null`, có nghĩa token này đã được dùng rồi — ai đó đang dùng lại token cũ. Phản ứng đúng là revoke **toàn bộ** token trong cùng `familyId` (không chỉ token đó), rồi throw `UnauthorizedException`.

</details>

<details>
<summary>💡 Hint 2 — Prisma API cần dùng</summary>

- Lookup: `tx.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })`
- Revoke family: `tx.refreshToken.updateMany({ where: { familyId: tokenRecord.familyId }, data: { revokedAt: new Date() } })`
- Mark used: `tx.refreshToken.update({ where: { id: tokenRecord.id }, data: { usedAt: new Date() } })`
- Tạo token mới: `tx.refreshToken.create({ data: { userId, familyId: tokenRecord.familyId, tokenHash, expiresAt } })`

</details>

<details>
<summary>💡 Hint 3 — Ký access token</summary>

Xem cách `issueTokenPair()` đang ký token. Pattern giống nhau:

```typescript
const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m' });
```

</details>

<details>
<summary>💡 Hint 4 — Full code `refresh()` (chỉ xem khi đã thử)</summary>

```typescript
async refresh(refreshTokenValue: string) {
  const tokenHash = this.hashRefreshToken(refreshTokenValue);

  return this.prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token not found',
      });
    }

    if (tokenRecord.usedAt !== null) {
      await tx.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REPLAY_DETECTED',
        message: 'Token reuse detected. All sessions revoked.',
      });
    }

    if (tokenRecord.revokedAt !== null) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Refresh token has been revoked',
      });
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    await tx.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    const { user } = tokenRecord;
    const newRefreshTokenValue = randomUUID();
    const newRefreshTokenHash = this.hashRefreshToken(newRefreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        familyId: tokenRecord.familyId,
        tokenHash: newRefreshTokenHash,
        expiresAt,
      },
    });

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m' },
    );

    return { accessToken, refreshToken: newRefreshTokenValue };
  });
}
```

</details>

#### 2b. Method `logout()`

**3-câu nhanh**: Nhận `userId` + `rawToken`. Gọi Prisma. Trả `void`.

**Skeleton**:

```typescript
async logout(userId: string, refreshTokenValue: string): Promise<void> {
  const tokenHash = // ???
  await this.prisma.refreshToken.updateMany({
    where: { /* ??? — cần filter cả userId lẫn tokenHash */ },
    data: { revokedAt: /* ??? */ },
  });
}
```

<details>
<summary>💡 Full code `logout()`</summary>

```typescript
async logout(userId: string, refreshTokenValue: string): Promise<void> {
  const tokenHash = this.hashRefreshToken(refreshTokenValue);
  await this.prisma.refreshToken.updateMany({
    where: { tokenHash, userId },
    data: { revokedAt: new Date() },
  });
}
```

</details>

#### 2c. Method `logoutAll()`

**3-câu nhanh**: Nhận `userId`. Gọi Prisma. Trả `void`.

> `revokeAllUserTokens()` đã có sẵn — `logoutAll()` có thể chỉ delegate sang nó.

**Skeleton**:

```typescript
async logoutAll(userId: string): Promise<void> {
  // Gọi method đã có sẵn trong cùng class?
  // hay viết lại updateMany trực tiếp?
}
```

<details>
<summary>💡 Full code `logoutAll()`</summary>

```typescript
async logoutAll(userId: string): Promise<void> {
  await this.revokeAllUserTokens(userId);
}
```

Hoặc viết thẳng `updateMany` nếu muốn tường minh hơn — cả hai đều đúng.

</details>

#### 2d. Optional refactor — `issueTokenPair()` nhận `familyId` optional

> Bỏ qua nếu chỉ muốn hoàn thành task. Làm nếu muốn DRY hơn.

Hiện tại `refresh()` phải tự tạo token mới inline vì `issueTokenPair()` hardcode `familyId = randomUUID()`. Nếu refactor để nhận `familyId` optional, `refresh()` có thể tái dùng nó:

```typescript
// Trước:
async issueTokenPair(userId: string, email: string, role: string, db = this.prisma) { ... }

// Sau:
async issueTokenPair(
  userId: string,
  email: string,
  role: string,
  db: Prisma.TransactionClient | PrismaService = this.prisma,
  familyId: string = randomUUID(), // ← thêm parameter với default
) { ... }
```

Khi `refresh()` gọi: `this.issueTokenPair(user.id, user.email, user.role, tx, tokenRecord.familyId)`

**Trade-off**: DRY hơn nhưng signature `issueTokenPair()` phức tạp hơn, và `familyId` là parameter thứ 5 dễ nhầm thứ tự. Task 13 không yêu cầu — inline là đủ và rõ ràng hơn.

---

### Lớp 3 — Service bridge: methods mới trong `AuthService`

**File cần sửa**: `src/modules/identity/services/auth.service.ts`

**Tại sao cần lớp bridge này?** Nhìn vào `AuthController` hiện tại: controller chỉ gọi `authService`, không biết `tokenService` tồn tại. Giữ pattern này để controller luôn mỏng.

**3-câu phân tích** (mỗi method là wrapper mỏng):

| Method                | Nhận input            | Gọi sang đâu               | Trả output |
| :-------------------- | :-------------------- | :------------------------- | :--------- |
| `refresh(dto)`        | `RefreshDto`          | `tokenService.refresh()`   | token pair |
| `logout(userId, dto)` | userId + `RefreshDto` | `tokenService.logout()`    | void       |
| `logoutAll(userId)`   | userId                | `tokenService.logoutAll()` | void       |

**Skeleton**:

```typescript
// Thêm vào AuthService — chỉ là thin wrapper, không chứa business logic

async refresh(dto: RefreshDto) {
  return this.tokenService.refresh(/* ??? */);
}

async logout(userId: string, dto: RefreshDto): Promise<void> {
  // ???
}

async logoutAll(userId: string): Promise<void> {
  // ???
}
```

<details>
<summary>💡 Full code bridge methods</summary>

```typescript
async refresh(dto: RefreshDto) {
  return this.tokenService.refresh(dto.refreshToken);
}

async logout(userId: string, dto: RefreshDto): Promise<void> {
  await this.tokenService.logout(userId, dto.refreshToken);
}

async logoutAll(userId: string): Promise<void> {
  await this.tokenService.logoutAll(userId);
}
```

Nhớ thêm import `RefreshDto` vào đầu file.

</details>

---

### Lớp 4 — Controller: 3 endpoints mới trong `AuthController`

**File cần sửa**: `src/modules/identity/controllers/auth.controller.ts`

**3-câu phân tích trước**:

| Endpoint           | Nhận input                     | Gọi sang đâu              | Status code trả về |
| :----------------- | :----------------------------- | :------------------------ | :----------------- |
| `POST /refresh`    | body: `RefreshDto`             | `authService.refresh()`   | 200                |
| `POST /logout`     | AT header + body: `RefreshDto` | `authService.logout()`    | 204                |
| `POST /logout-all` | AT header                      | `authService.logoutAll()` | 204                |

**Câu hỏi về guard** — trả lời trước khi xem hint:

- `/refresh` — cần `@Public()` không? Tại sao?
- `/logout` — cần `@Public()` không? Tại sao?

**Skeleton**:

```typescript
// Import cần thêm:
// import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
// import { RefreshDto } from '../dto/refresh.dto/refresh.dto';

@??? // public hay không?
@Post('refresh')
@HttpCode(HttpStatus.???)
async refresh(@Body() dto: RefreshDto) {
  // ???
}

@??? // guard?
@Post('logout')
@HttpCode(HttpStatus.???)
async logout(
  @CurrentUser('id') userId: string,
  @Body() dto: RefreshDto,
) {
  // ???
}

@Post('logout-all')
@HttpCode(HttpStatus.???)
async logoutAll(@CurrentUser('id') userId: string) {
  // ???
}
```

<details>
<summary>💡 Hint 1 — Về @Public() và guard</summary>

- `/refresh`: phải `@Public()` vì người gọi **chưa có** access token hợp lệ. Guard JWT sẽ block request này nếu không có `@Public()`.
- `/logout` và `/logout-all`: **không** `@Public()` — cần biết đây là user nào qua `@CurrentUser`. JWT guard xác thực AT, rồi `@CurrentUser('id')` lấy userId từ payload.

</details>

<details>
<summary>💡 Hint 2 — Full code 3 endpoints</summary>

```typescript
@Public()
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Body() dto: RefreshDto) {
  return this.authService.refresh(dto);
}

@Post('logout')
@HttpCode(HttpStatus.NO_CONTENT)
async logout(
  @CurrentUser('id') userId: string,
  @Body() dto: RefreshDto,
) {
  await this.authService.logout(userId, dto);
}

@Post('logout-all')
@HttpCode(HttpStatus.NO_CONTENT)
async logoutAll(@CurrentUser('id') userId: string) {
  await this.authService.logoutAll(userId);
}
```

</details>

---

### Lớp 5 — Module wiring check

**File cần kiểm tra**: `src/modules/identity/identity.module.ts`

Không cần thêm gì mới nếu `TokenService` đã được khai báo trong `providers` của module (đã làm ở Task 12). Chạy `nest build` để xác nhận không có lỗi DI.

---

## ✍️ Reflection — Viết lại bằng lời của bạn

Sau khi task xong, **đóng hết file lại** và tự điền bảng này:

| File                                    | Vai trò trong 1 câu |
| :-------------------------------------- | :------------------ |
| `refresh.dto.ts`                        |                     |
| `token.service.ts` — method `refresh()` |                     |
| `token.service.ts` — method `logout()`  |                     |
| `auth.service.ts` — 3 bridge methods    |                     |
| `auth.controller.ts` — 3 endpoints      |                     |

> Nếu điền được mà không cần mở file → bạn đã hiểu thật sự. Nếu phải mở lại → đọc thêm 1 lần rồi thử lại.

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Rotation cấp cặp token mới, token cũ bị mark usedAt**

- **Given** refresh token hợp lệ, chưa dùng
- **When** gọi `POST /auth/refresh` với token đó
- **Then** response chứa cặp `(accessToken, refreshToken)` mới; RT cũ trong DB có `usedAt != null`

**AC-2: Replay attack kill toàn bộ token family**

- **Given** RT_1 đã được dùng để refresh ra RT_2 (RT_1 có `usedAt`)
- **When** attacker thử dùng lại RT_1
- **Then** response `401 REFRESH_TOKEN_REPLAY_DETECTED`; cả RT_1, RT_2 và mọi token cùng family đều có `revokedAt != null`; user buộc re-login

**AC-3: Logout chỉ revoke token thuộc phiên hiện tại của chính user đó**

- **Given** user có token hợp lệ
- **When** gọi `POST /auth/logout` với refresh token
- **Then** response `204 No Content`; gọi `POST /auth/refresh` với token đó → `401 REFRESH_TOKEN_REVOKED`

**AC-4: Logout-all revoke tất cả sessions**

- **Given** user đang có 3 refresh token active (3 phiên trên 3 thiết bị khác nhau)
- **When** gọi `POST /auth/logout-all`
- **Then** cả 3 RT trong DB đều có `revokedAt != null`; refresh trên cả 3 thiết bị fail

**AC-5: Access token vẫn hợp lệ đến hết TTL sau khi RT bị revoke**

- **Given** RT đã bị revoke nhưng AT của phiên đó còn TTL 10 phút
- **When** gọi protected API với AT đó
- **Then** request vẫn pass — đây là trade-off chấp nhận được (AT stateless, không revoke được)

---

## Verify hoàn thành

### Test 1 — Refresh cấp token mới

```http
POST http://localhost:3000/api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "<token từ login>" }
```

Phải trả cặp token mới. Token cũ trong DB có `usedAt` set.

### Test 2 — Replay attack kill family

Dùng lại refresh token cũ (đã used):

```http
POST http://localhost:3000/api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "<token cũ>" }
```

Phải trả `401 REFRESH_TOKEN_REPLAY_DETECTED`. Mọi token trong family bị revoke.

### Test 3 — Logout

```http
POST http://localhost:3000/api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{ "refreshToken": "<refresh_token>" }
```

Phải trả `204`. Refresh sau đó fail.

---

## 🚫 Ngoài phạm vi

- Access token revocation tức thì (blacklist Redis) → Phase D khi có high-security requirements
- Device fingerprinting / device list management UI → backlog
- Session sharing qua multiple browser tabs (SSO) → ngoài phạm vi
- Refresh token trong httpOnly cookie → quyết định khi có FE requirements
- Automatic refresh token cleanup (expired tokens purge) → background job, Phase D

---

## Xong thì làm gì?

→ Mở task tiếp theo: [14-users-crud.md](./14-users-crud.md)
