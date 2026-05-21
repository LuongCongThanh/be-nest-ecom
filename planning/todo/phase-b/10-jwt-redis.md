# Task 10 — JWT + Redis Setup

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 09
**Ưu tiên**: 🔴 CAO (Security architecture — mọi auth logic sau phụ thuộc vào task này)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [02-jwt-auth.md](../../business/01-identity/02-jwt-auth.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Thiết lập JWT strategy và Redis module — **nền tảng bảo mật cho toàn bộ API**.

- **Stateless access token (JWT)**: server không cần lưu session — horizontal scale không cần sticky session. Trade-off: không thể revoke trước TTL → giải quyết bằng access token TTL ngắn (30 phút) + refresh token.
- **Stateful refresh token (DB)**: lưu metadata trong DB để revoke được ngay lập tức (logout, change password, admin suspend). Redis được setup từ sớm để dùng cho denylist, rate-limit, cache và các security flows ở phase sau.
- **HS256 thuật toán ký**: đủ cho Phase B single service. Nếu sau này tách microservices cần RS256 (public key verify). Quyết định này đã cân nhắc.
- **Payload tối thiểu `{ sub, email, role, iat, exp }`**: không nhét thêm thông tin. Data nhạy cảm không bao giờ vào JWT — token có thể decode client-side mà không cần secret.
- **Không lưu raw refresh token trong DB**: chỉ lưu hash (`sha256`) của refresh token. Nếu DB bị lộ thì attacker không thể dùng trực tiếp refresh token đã phát hành.
- **Identity re-check trong validate()**: sau khi decode JWT hợp lệ, vẫn phải check `isActive = true` và `deletedAt IS NULL`. Token còn TTL nhưng user bị suspend → reject ngay.

---

## 📋 Chính sách JWT

| Mục | Quyết định | Ghi chú |
| :--- | :--- | :--- |
| Thuật toán ký | **HS256** | Phase B single service. Migrate RS256 khi tách microservices |
| Access Token TTL | **30 phút** | Ngắn để giảm risk nếu bị leak |
| Refresh Token TTL | **7 ngày** | Stateful, lưu DB — chi tiết Task 13 |
| Payload chuẩn | `{ sub, email, role, iat, exp }` | Cấm thêm field không có trong danh sách |
| Clock skew | **30 giây** | Tolerance cho server time drift |
| Secret storage | `JWT_SECRET` env var | Validate min 32 chars tại boot (Task 02) |

---

## 🛠️ Các bước thực hiện

### 1. Cài packages

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt ioredis
npm install --save-dev @types/passport-jwt
```

### 2. Tạo RedisModule

Tạo `src/common/redis/redis.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.config.get<string>('REDIS_URL')!);
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
}
```

Tạo `src/common/redis/redis.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### 3. Tạo JWT Strategy

Tạo `src/modules/identity/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
      clockTolerance: 30, // 30s clock skew tolerance
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive or not found',
      });
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
```

### 4. Tạo TokenService

Tạo `src/modules/identity/services/token.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueTokenPair(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m',
    });

    const familyId = randomUUID();
    const refreshTokenValue = randomUUID();
    const refreshTokenHash = this.hashRefreshToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
```

### 5. Đăng ký trong AppModule

```typescript
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') ?? '30m' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Redis kết nối thành công khi startup**

- **Given** Redis container đang healthy, `REDIS_URL` trong `.env` đúng
- **When** chạy `npm run start:dev`
- **Then** log `[RedisService] Redis connected` xuất hiện — không có Redis error

**AC-2: JWT Strategy reject token đã hết hạn**

- **Given** access token đã expired (`exp < now - 30s`)
- **When** dùng token đó để gọi protected endpoint
- **Then** response `401 TOKEN_EXPIRED` (sau Task 11 — Guards)

**AC-3: JWT Strategy reject user bị suspend dù token còn hạn**

- **Given** User đang có valid token còn TTL, nhưng `isActive = false` trong DB
- **When** gọi protected endpoint với token đó
- **Then** response `401 ACCOUNT_INACTIVE` — token hợp lệ về signature nhưng user state không pass

**AC-4: JWT payload chỉ chứa field được approve**

- **Given** token vừa được issue
- **When** decode base64 phần payload (không cần verify)
- **Then** payload chỉ chứa `{ sub, email, role, iat, exp }` — không có `password`, `phone`, `firstName`, hoặc bất kỳ PII nào khác

---

## Verify hoàn thành

```bash
npm run start:dev
# Phải thấy log:
# Redis connected
# Prisma connected
# Nest application successfully started
```

---

## 🚫 Ngoài phạm vi

- RS256 (asymmetric signing) → khi tách microservices, ngoài scope Phase B
- Redis Sentinel / Cluster → production infrastructure
- Access token blacklist (revocation tức thì) → Phase D/E; AC-5 trong TASK-123 chấp nhận trade-off này
- Refresh token trong cookie (httpOnly) thay vì body → UX decision, có thể thay đổi sau khi có FE requirements
- Social login / OAuth2 (Google, Facebook) → backlog

---

## Xong thì làm gì?

→ Mở task tiếp theo: [11-guards-decorators.md](./11-guards-decorators.md)
