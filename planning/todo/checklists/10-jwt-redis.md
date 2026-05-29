# Checklist — Task 10: JWT + Redis Setup

## Steps

- [ ] 1. Cài packages (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `ioredis`, `@types/passport-jwt`)
- [ ] 2. Tạo `RedisService` + `RedisModule` tại `src/common/redis/`
- [ ] 3. Tạo `JwtStrategy` tại `src/modules/identity/strategies/jwt.strategy.ts`
- [ ] 4. Tạo `TokenService` tại `src/modules/identity/services/token.service.ts`
- [ ] 5. Đăng ký `RedisModule` + `JwtModule` vào `AppModule`

## Acceptance Criteria

- [ ] AC-1: Log `Redis connected` khi `npm run start:dev`
- [ ] AC-2: JWT Strategy reject token hết hạn → 401
- [ ] AC-3: JWT Strategy reject user bị suspend dù token còn hạn → 401 ACCOUNT_INACTIVE
- [ ] AC-4: JWT payload chỉ chứa `{ sub, email, role, iat, exp }`
