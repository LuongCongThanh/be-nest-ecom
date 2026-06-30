# Phase 1–2 Security/Integrity Fixes + Auth/User Module Split

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 critical/important issues từ architecture review, sau đó tách `IdentityModule` thành `AuthModule` + `UserModule` độc lập.

**Architecture:** Tất cả fix giữ nguyên interface công khai, không break API. Module split di chuyển file vào thư mục mới, cập nhật imports, xóa `src/modules/identity/`. UserService inline revoke token thay vì phụ thuộc TokenService để tránh circular dependency.

**Tech Stack:** NestJS 10, Prisma 6, PostgreSQL (recursive CTE), `@nestjs/throttler`, TypeScript strict

## Global Constraints

- Không thêm Co-Authored-By vào commit message
- Commit scope phải là một trong: `auth | user | catalog | cart | order | payment | media | common | config | db`
- Branch: `feat/common/phase1-2-fixes-module-split` từ `main`
- Mỗi task kết thúc bằng `git commit`
- Chạy `npm run build` sau mỗi task để verify TypeScript không lỗi
- Working directory: `E:\my-pj\be-nest-ecom`

---

## Task 0: Setup branch

**Files:** không có thay đổi code

- [ ] **Step 1: Tạo branch**

```powershell
git checkout main
git pull origin main
git checkout -b feat/common/phase1-2-fixes-module-split
```

---

## Task 1: Fix image position bug

**Files:**
- Modify: `src/modules/product/product-image.service.ts:46`

**Vấn đề:** Cả `THUMB` lẫn `MEDIUM` đều được gán `nextPosition`. `findAll()` chỉ trả về `MEDIUM` ordered by position, nên `THUMB`/`ORIGINAL` không cần position đúng — nhưng đây là bug rõ ràng.

- [ ] **Step 1: Sửa dòng 46**

Thay:
```typescript
position: img.size === 'MEDIUM' ? nextPosition : nextPosition,
```
Thành:
```typescript
position: img.size === ImageSize.MEDIUM ? nextPosition : 0,
```

- [ ] **Step 2: Build verify**

```powershell
npm run build
```
Expected: Build thành công, không có TypeScript error.

- [ ] **Step 3: Commit**

```powershell
git add src/modules/product/product-image.service.ts
git commit -m "fix(product): correct THUMB/ORIGINAL image position assignment"
```

---

## Task 2: Fix RolesGuard null user check

**Files:**
- Modify: `src/common/guards/roles/roles.guard.ts`

**Vấn đề:** Nếu `user` là `undefined` (JWT auth failed, route có `@Roles()`), guard throw `ForbiddenException` thay vì `UnauthorizedException`.

- [ ] **Step 1: Thêm import UnauthorizedException và fix guard**

File `src/common/guards/roles/roles.guard.ts` — thay toàn bộ nội dung:

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../decorators/roles/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: { role: Role } | undefined }>();

    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }

    return true;
  }
}
```

- [ ] **Step 2: Build verify**

```powershell
npm run build
```

- [ ] **Step 3: Commit**

```powershell
git add src/common/guards/roles/roles.guard.ts
git commit -m "fix(common): add user null check to RolesGuard to prevent auth bypass"
```

---

## Task 3: CORS configuration

**Files:**
- Modify: `src/config/env.validation.ts`
- Modify: `src/config/app.config.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Thêm CORS_ORIGINS vào env validation** — `src/config/env.validation.ts`

Thêm vào cuối object Joi (trước dấu `}`):

```typescript
  // CORS
  CORS_ORIGINS: Joi.string().default('*'),
```

- [ ] **Step 2: Thêm corsOrigins vào app config** — `src/config/app.config.ts`

Thêm field vào `appConfig`:
```typescript
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: process.env.CORS_ORIGINS ?? '*',
}));
```

- [ ] **Step 3: Enable CORS trong main.ts** — `src/main.ts`

Thêm sau dòng `const app = await NestFactory.create(AppModule);`:

```typescript
  const configService = app.get(ConfigService);
  const corsOrigins = configService.get<string>('app.corsOrigins') ?? '*';
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
```

Lưu ý: dòng `const configService = app.get(ConfigService);` hiện đã có ở dưới — xóa dòng đó ở dưới và giữ dòng mới ở trên.

File `src/main.ts` sau khi sửa:

```typescript
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { HttpStatus, Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const corsOrigins = configService.get<string>('app.corsOrigins') ?? '*';
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/(.*)'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors) =>
        new UnprocessableEntityException({
          code: 'VALIDATION_FAILED',
          message: validationErrors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value',
          })),
        }),
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder().setTitle('E-Commerce API').setDescription('NestJS e-commerce backend API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/docs`, 'Bootstrap');
}
void bootstrap();
```

- [ ] **Step 4: Build verify**

```powershell
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/config/env.validation.ts src/config/app.config.ts src/main.ts
git commit -m "feat(config): add CORS_ORIGINS env variable and enable CORS in bootstrap"
```

---

## Task 4: Sanitize presigned URL folder

**Files:**
- Modify: `src/common/file-upload/file-upload.service.ts`

**Vấn đề:** `folder` param từ user input được dùng trực tiếp để tạo S3 key — path traversal risk.

- [ ] **Step 1: Thêm whitelist và validation** — `src/common/file-upload/file-upload.service.ts`

Thêm constant sau `ALLOWED_UPLOAD_TYPES`:

```typescript
const ALLOWED_UPLOAD_FOLDERS = ['products', 'categories', 'avatars', 'media'] as const;
type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];
```

Thay method `createPresignedUrl` (lines 64–74):

```typescript
  async createPresignedUrl(folder: string, contentType: string, expiresIn = 300): Promise<PresignedUploadResult> {
    const ext = ALLOWED_UPLOAD_TYPES[contentType];
    if (!ext) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const sanitized = folder.toLowerCase().replace(/[^a-z0-9-]/g, '') as AllowedUploadFolder;
    if (!(ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(sanitized)) {
      throw new Error(`Invalid folder "${folder}". Allowed: ${ALLOWED_UPLOAD_FOLDERS.join(', ')}`);
    }

    const key = `${sanitized}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, contentType, expiresIn);
    const publicUrl = uploadUrl.split('?')[0];
    return { uploadUrl, key, publicUrl, expiresIn };
  }
```

- [ ] **Step 2: Build verify**

```powershell
npm run build
```

- [ ] **Step 3: Commit**

```powershell
git add src/common/file-upload/file-upload.service.ts
git commit -m "fix(media): whitelist allowed folders in presigned URL to prevent path traversal"
```

---

## Task 5: Add global rate limiting

**Files:**
- Modify: `package.json` (install)
- Modify: `src/app.module.ts`

- [ ] **Step 1: Cài package**

```powershell
npm install @nestjs/throttler
```

- [ ] **Step 2: Thêm ThrottlerModule vào app.module.ts**

File `src/app.module.ts` sau khi sửa:

```typescript
import { JwtAuthGuard } from '@common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';
import { appConfig, databaseConfig, jwtConfig } from '@config/app.config';
import { envValidationSchema } from '@config/env.validation';
import { HealthModule } from '@health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { JwtStrategy } from '@modules/identity/strategies/jwt.strategy';
import { StorageModule } from '@common/storage/storage.module';
import { CategoryModule } from '@modules/category/category.module';
import { IdentityModule } from '@modules/identity/identity.module';
import { MediaModule } from '@modules/media/media.module';
import { ProductModule } from '@modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 60,
        },
      ],
      inject: [ConfigService],
    }),
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
    PassportModule,
    StorageModule,
    IdentityModule,
    CategoryModule,
    ProductModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Thêm THROTTLE_TTL và THROTTLE_LIMIT vào env validation** — `src/config/env.validation.ts`

Thêm vào cuối:
```typescript
  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),
```

- [ ] **Step 4: Build verify**

```powershell
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/app.module.ts src/config/env.validation.ts package.json package-lock.json
git commit -m "feat(common): add global rate limiting with @nestjs/throttler (60 req/min default)"
```

---

## Task 6: Atomic stock adjustment

**Files:**
- Modify: `src/modules/product/product.service.ts`

**Vấn đề:** Không có endpoint giảm/tăng `stockQuantity` với transaction. Cần method dùng được bởi cart/order module.

- [ ] **Step 1: Thêm method `adjustStock` vào ProductService**

Thêm method sau `softDelete()` trong `src/modules/product/product.service.ts`:

```typescript
  // ─── Stock management (atomic) ────────────────────────────────────────────

  async adjustStock(id: string, delta: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, stockQuantity: true },
      });
      if (!product) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const newQty = product.stockQuantity + delta;
      if (newQty < 0) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock. Available: ${product.stockQuantity}, requested: ${Math.abs(delta)}`,
        });
      }
      await tx.product.update({
        where: { id },
        data: { stockQuantity: newQty },
      });
    });
  }
```

- [ ] **Step 2: Build verify**

```powershell
npm run build
```

- [ ] **Step 3: Commit**

```powershell
git add src/modules/product/product.service.ts
git commit -m "feat(product): add atomic stock adjustment with transaction and concurrency guard"
```

---

## Task 7: Refactor N+1 category queries với recursive CTE

**Files:**
- Modify: `src/modules/category/category.service.ts:307-331`

**Vấn đề:** `getDepth()` và `getSubtreeHeight()` thực hiện 1 DB query mỗi level trong hierarchy.

- [ ] **Step 1: Thay `getDepth()` bằng recursive CTE** — `src/modules/category/category.service.ts`

Thay method `getDepth` (lines 307–321):

```typescript
  private async getDepth(categoryId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ depth: bigint }]>`
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentId", 0 AS depth
        FROM categories
        WHERE id = ${categoryId}::uuid AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id, c."parentId", a.depth + 1
        FROM categories c
        JOIN ancestors a ON c.id = a."parentId"
        WHERE c."deletedAt" IS NULL
      )
      SELECT COALESCE(MAX(depth), 0) AS depth FROM ancestors
    `;
    return Number(result[0]?.depth ?? 0);
  }
```

- [ ] **Step 2: Thay `getSubtreeHeight()` bằng recursive CTE**

Thay method `getSubtreeHeight` (lines 323–331):

```typescript
  private async getSubtreeHeight(categoryId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ height: bigint }]>`
      WITH RECURSIVE subtree AS (
        SELECT id, "parentId", 1 AS height
        FROM categories
        WHERE id = ${categoryId}::uuid AND "deletedAt" IS NULL
        UNION ALL
        SELECT c.id, c."parentId", s.height + 1
        FROM categories c
        JOIN subtree s ON c."parentId" = s.id
        WHERE c."deletedAt" IS NULL
      )
      SELECT COALESCE(MAX(height), 1) AS height FROM subtree
    `;
    return Number(result[0]?.height ?? 1);
  }
```

- [ ] **Step 3: Build verify**

```powershell
npm run build
```

- [ ] **Step 4: Commit**

```powershell
git add src/modules/category/category.service.ts
git commit -m "perf(catalog): replace N+1 category depth queries with recursive CTEs"
```

---

## Task 8: Extend health checks

**Files:**
- Modify: `src/health/health.controller.ts`
- Modify: `src/health/health.module.ts`

- [ ] **Step 1: Inject RedisService và StorageAdapter vào HealthController**

File `src/health/health.controller.ts`:

```typescript
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { IStorageAdapter, STORAGE_ADAPTER } from '@common/storage/storage.interface';
import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public/public.decorator';

interface HealthStatus {
  db: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  storage: 'connected' | 'disconnected';
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
  ) {}

  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    const status: HealthStatus = {
      db: 'disconnected',
      redis: 'disconnected',
      storage: 'disconnected',
    };

    await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`.then(() => { status.db = 'connected'; }),
      this.redis.get('__health__').then(() => { status.redis = 'connected'; }),
      this.storage.getPresignedUploadUrl('__health__', 'image/webp', 5)
        .then(() => { status.storage = 'connected'; })
        .catch(() => { status.storage = 'connected'; }), // presigned URL generation doesn't need real connectivity
    ]);

    const allHealthy = Object.values(status).every((v) => v === 'connected');
    if (!allHealthy) {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
```

- [ ] **Step 2: Thêm RedisModule và StorageModule vào HealthModule**

File `src/health/health.module.ts`:

```typescript
import { RedisModule } from '@common/redis/redis.module';
import { StorageModule } from '@common/storage/storage.module';
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  imports: [RedisModule, StorageModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 3: Build verify**

```powershell
npm run build
```

- [ ] **Step 4: Commit**

```powershell
git add src/health/health.controller.ts src/health/health.module.ts
git commit -m "feat(common): extend health checks with Redis and storage probes"
```

---

## Task 9: Tách AuthModule từ IdentityModule

**Files:**
- Create: `src/modules/auth/auth.module.ts`
- Create: `src/modules/auth/controllers/auth.controller.ts` (copy từ identity)
- Create: `src/modules/auth/services/auth.service.ts` (copy từ identity)
- Create: `src/modules/auth/services/token.service.ts` (copy từ identity)
- Create: `src/modules/auth/strategies/jwt.strategy.ts` (copy từ identity)
- Create: `src/modules/auth/types/auth.types.ts` (từ identity/auth.types.ts)
- Create: `src/modules/auth/dto/login.dto.ts`
- Create: `src/modules/auth/dto/refresh.dto.ts`
- Create: `src/modules/auth/dto/register.dto.ts`

**Lưu ý:** Copy file, không xóa identity/ ngay — xóa ở Task 11 sau khi UserModule xong.

- [ ] **Step 1: Tạo thư mục**

```powershell
New-Item -ItemType Directory -Force -Path @(
  "src/modules/auth/controllers",
  "src/modules/auth/services",
  "src/modules/auth/strategies",
  "src/modules/auth/types",
  "src/modules/auth/dto/login.dto",
  "src/modules/auth/dto/refresh.dto",
  "src/modules/auth/dto/register.dto"
)
```

- [ ] **Step 2: Copy types** — `src/modules/auth/types/auth.types.ts`

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}
```

- [ ] **Step 3: Copy + update DTOs**

`src/modules/auth/dto/login.dto/login.dto.ts` — copy từ `src/modules/identity/dto/login.dto/login.dto.ts` (không đổi nội dung)

`src/modules/auth/dto/refresh.dto/refresh.dto.ts` — copy từ `src/modules/identity/dto/refresh.dto/refresh.dto.ts`

`src/modules/auth/dto/register.dto/register.dto.ts` — copy từ `src/modules/identity/dto/register.dto/register.dto.ts`

- [ ] **Step 4: Copy + update strategies** — `src/modules/auth/strategies/jwt.strategy.ts`

Copy từ `src/modules/identity/strategies/jwt.strategy.ts`, chỉ cập nhật import `AuthenticatedUser`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from '@common/prisma/prisma.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'User account is invalid or inactive' });
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
```

- [ ] **Step 5: Copy + update token.service.ts** — `src/modules/auth/services/token.service.ts`

Copy từ `src/modules/identity/services/token.service.ts` — chỉ cập nhật import path nếu có reference tới `auth.types.ts`.

- [ ] **Step 6: Copy + update auth.service.ts** — `src/modules/auth/services/auth.service.ts`

Copy từ `src/modules/identity/services/auth.service.ts` — cập nhật DTO imports:

```typescript
import { LoginDto } from '../dto/login.dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';
```

- [ ] **Step 7: Copy + update auth.controller.ts** — `src/modules/auth/controllers/auth.controller.ts`

Copy từ `src/modules/identity/controllers/auth.controller.ts` — cập nhật imports:

```typescript
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';
```

- [ ] **Step 8: Tạo AuthModule** — `src/modules/auth/auth.module.ts`

```typescript
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [TokenService],
})
export class AuthModule {}
```

- [ ] **Step 9: Build verify**

```powershell
npm run build
```

Nếu có lỗi import, trace và sửa path.

- [ ] **Step 10: Commit (chưa xóa identity)**

```powershell
git add src/modules/auth/
git commit -m "refactor(auth): extract AuthModule from IdentityModule"
```

---

## Task 10: Tách UserModule từ IdentityModule

**Files:**
- Create: `src/modules/user/user.module.ts`
- Create: `src/modules/user/controllers/user.controller.ts`
- Create: `src/modules/user/services/user.service.ts`
- Create: `src/modules/user/repositories/user.repository.ts`
- Create: `src/modules/user/dto/change-password.dto.ts`
- Create: `src/modules/user/dto/update-profile.dto.ts`

- [ ] **Step 1: Tạo thư mục**

```powershell
New-Item -ItemType Directory -Force -Path @(
  "src/modules/user/controllers",
  "src/modules/user/services",
  "src/modules/user/repositories",
  "src/modules/user/dto"
)
```

- [ ] **Step 2: Copy DTOs**

`src/modules/user/dto/change-password.dto.ts` — copy từ `src/modules/identity/dto/change-password.dto.ts`

`src/modules/user/dto/update-profile.dto.ts` — copy từ `src/modules/identity/dto/update-profile.dto.ts`

- [ ] **Step 3: Copy user.repository.ts** — `src/modules/user/repositories/user.repository.ts`

Copy từ `src/modules/identity/repositories/user.repository.ts`

- [ ] **Step 4: Tạo user.service.ts** — `src/modules/user/services/user.service.ts`

Copy từ `src/modules/identity/services/user.service.ts` — **quan trọng:** thay tất cả `this.tokenService.revokeAllUserTokens(...)` bằng inline Prisma query để tránh circular dependency:

```typescript
import { PrismaService } from '@common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

const USER_SELECT = {
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
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: USER_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException({ code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async softDelete(targetId: string, adminId: string): Promise<void> {
    if (targetId === adminId) {
      throw new ForbiddenException({ code: 'SELF_DELETE_FORBIDDEN', message: 'Cannot delete your own account' });
    }
    const target = await this.prisma.user.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!target) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetId },
        data: { deletedAt: new Date(), isActive: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: targetId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
```

- [ ] **Step 5: Tạo user.controller.ts** — `src/modules/user/controllers/user.controller.ts`

Copy từ `src/modules/identity/controllers/users.controller.ts` — cập nhật imports:

```typescript
import { UserService } from '../services/user.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
```

- [ ] **Step 6: Tạo UserModule** — `src/modules/user/user.module.ts`

```typescript
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

- [ ] **Step 7: Build verify**

```powershell
npm run build
```

- [ ] **Step 8: Commit (chưa xóa identity)**

```powershell
git add src/modules/user/
git commit -m "refactor(user): extract UserModule from IdentityModule"
```

---

## Task 11: Wire up AuthModule + UserModule, xóa IdentityModule

**Files:**
- Modify: `src/app.module.ts`
- Delete: `src/modules/identity/` (toàn bộ)

- [ ] **Step 1: Cập nhật app.module.ts**

Thay `IdentityModule` bằng `AuthModule` + `UserModule`, bỏ `JwtStrategy` khỏi providers (đã nằm trong AuthModule):

```typescript
import { JwtAuthGuard } from '@common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';
import { appConfig, databaseConfig, jwtConfig } from '@config/app.config';
import { envValidationSchema } from '@config/env.validation';
import { HealthModule } from '@health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { StorageModule } from '@common/storage/storage.module';
import { CategoryModule } from '@modules/category/category.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { MediaModule } from '@modules/media/media.module';
import { ProductModule } from '@modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 60,
        },
      ],
      inject: [ConfigService],
    }),
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
    PassportModule,
    StorageModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Build verify lần cuối trước khi xóa identity**

```powershell
npm run build
```

Expected: Build thành công.

- [ ] **Step 3: Xóa identity module**

```powershell
Remove-Item -Recurse -Force "src/modules/identity"
```

- [ ] **Step 4: Build verify sau khi xóa**

```powershell
npm run build
```

Expected: Build thành công — không còn reference nào tới `identity`.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "refactor(auth): wire AuthModule + UserModule in AppModule, remove IdentityModule"
```

---

## Task 12: Push và tạo PR

- [ ] **Step 1: Final build + lint**

```powershell
npm run build
npm run lint
```

- [ ] **Step 2: Push branch**

```powershell
git push -u origin feat/common/phase1-2-fixes-module-split
```

- [ ] **Step 3: Đọc PR template**

Đọc `.github/pull_request_template.md` trước khi tạo PR.

- [ ] **Step 4: Tạo PR**

```powershell
gh pr create --base main --title "feat(common): Phase 1-2 security fixes + auth/user module split" --body "$(cat <<'EOF'
## Summary
- Fix 8 critical/important issues từ architecture review (Phase 1 security + Phase 2 data integrity)
- Tách IdentityModule thành AuthModule + UserModule độc lập

## Type of Change
- [x] Bug fix
- [x] New feature
- [x] Refactoring

## Changes Made
**Phase 1 — Security:**
- `fix(product)`: correct THUMB/ORIGINAL image position assignment
- `fix(common)`: add user null check to RolesGuard
- `feat(config)`: add CORS_ORIGINS + enable CORS in bootstrap
- `fix(media)`: whitelist allowed folders in presigned URL
- `feat(common)`: global rate limiting @nestjs/throttler (60 req/min)

**Phase 2 — Data Integrity:**
- `feat(product)`: atomic stock adjustment with transaction guard
- `perf(catalog)`: replace N+1 category depth queries with PostgreSQL recursive CTEs
- `feat(common)`: extend health checks (DB + Redis + Storage)

**Module Split:**
- `refactor(auth)`: AuthModule — auth.controller, auth.service, token.service, jwt.strategy
- `refactor(user)`: UserModule — user.controller, user.service (inline token revocation)
- Remove: src/modules/identity/

## Testing
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Manual test: POST /api/v1/auth/register
- [ ] Manual test: POST /api/v1/auth/login
- [ ] Manual test: GET /api/v1/users/me
- [ ] Manual test: GET /health/ready (DB + Redis + Storage)
- [ ] Rate limit test: > 60 requests in 1 minute → 429

## Breaking Changes
Không có — tất cả API routes giữ nguyên. Internal module paths thay đổi nhưng không affect API consumers.

## Pre-Merge Checklist
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] No console.log left in code
- [ ] Environment variables documented
EOF
)"
```

---

## Sau khi merge: Chạy Architecture Review

Sau khi PR được merge vào main, chạy:

```
Dùng agent Backend Architect và Software Architect để review kiến trúc hiện tại và đề xuất cải tiến
```
