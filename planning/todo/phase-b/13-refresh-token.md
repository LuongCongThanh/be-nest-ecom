# Task 13 — Refresh Token Rotation

**Phase**: B — Foundation
**Ước lượng**: 3 giờ
**Phụ thuộc**: Task 12
**Ưu tiên**: 🔴 CAO (Security — UX không thể dùng nếu thiếu, và thiếu thì có lỗ hổng bảo mật)
**Trạng thái**: ⏳ Not started
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

## 📄 Luồng nghiệp vụ

### Refresh Flow — `POST /api/v1/auth/refresh`

| # | Bước | Hành động | Lỗi có thể trả về |
| :- | :--- | :--- | :--- |
| 1 | Lookup | Hash RT nhận vào rồi tìm trong DB theo `tokenHash` | `401 INVALID_REFRESH_TOKEN` |
| 2 | Replay check | `usedAt != null`? → kill toàn family | `401 REFRESH_TOKEN_REPLAY_DETECTED` |
| 3 | Revoke check | `revokedAt != null`? | `401 REFRESH_TOKEN_REVOKED` |
| 4 | Expiry check | `expiresAt < now`? | `401 REFRESH_TOKEN_EXPIRED` |
| 5 | Mark used | Set `usedAt = now` trên token cũ | — |
| 6 | Issue mới | Tạo RT mới cùng `familyId`, sinh AT mới | — |
| 7 | Return | `{ accessToken, refreshToken }` mới | — |

### Revocation Triggers

| Trigger | Phạm vi revoke |
| :--- | :--- |
| `POST /auth/logout` | Chỉ RT hiện tại |
| `POST /auth/logout-all` | Mọi RT của user |
| Đổi password (Task 14) | Mọi RT của user |
| Admin suspend (Task 14) | Mọi RT của user |

---

## 🛠️ Các bước thực hiện

### 1. Thêm RefreshDto

Tạo `src/modules/identity/dto/refresh.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### 2. Thêm methods vào TokenService

Mở `src/modules/identity/services/token.service.ts`, thêm:

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

async logout(userId: string, refreshTokenValue: string): Promise<void> {
  const tokenHash = this.hashRefreshToken(refreshTokenValue);
  await this.prisma.refreshToken.updateMany({
    where: { tokenHash, userId },
    data: { revokedAt: new Date() },
  });
}

async logoutAll(userId: string): Promise<void> {
  await this.prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

### 3. Thêm endpoints vào AuthController

```typescript
import { RefreshDto } from '../dto/refresh.dto';
import { CurrentUser } from '../../../common/decorators';

// Thêm vào AuthController:

@Public()
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Body() dto: RefreshDto) {
  return this.tokenService.refresh(dto.refreshToken);
}

@Post('logout')
@HttpCode(HttpStatus.NO_CONTENT)
async logout(@CurrentUser('id') userId: string, @Body() dto: RefreshDto) {
  await this.tokenService.logout(userId, dto.refreshToken);
}

@Post('logout-all')
@HttpCode(HttpStatus.NO_CONTENT)
async logoutAll(@CurrentUser('id') userId: string) {
  await this.tokenService.logoutAll(userId);
}
```

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
{ "refreshToken": "<token cũ>" }
```
Phải trả `401 REFRESH_TOKEN_REPLAY_DETECTED`. Mọi token trong family bị revoke.

### Test 3 — Logout
```http
POST http://localhost:3000/api/v1/auth/logout
Authorization: Bearer <access_token>
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
