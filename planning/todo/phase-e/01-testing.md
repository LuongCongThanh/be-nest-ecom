# Task E-01 — Unit Tests + E2E Tests

**Phase**: E — Verification
**Ước lượng**: 10 giờ
**Phụ thuộc**: Phase D hoàn thành
**Ưu tiên**: 🔴 BLOCKING (ship gate — không ship code chưa có test coverage)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [01-unit-tests.md](../../setup/05-scale-infra/01-unit-tests.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Viết unit tests cho service layer (coverage ≥ 60%) và E2E tests cho full flow.

- **Test sau khi code chạy được** (không TDD ở phase này): self-learner cần "see it work" trước — tests confirm behavior đúng, không phải drive design. Sau MVP, áp dụng TDD cho feature mới.
- **`CartService.calculate()` và `OrderService.createOrder()` — 100% branch**: hai hàm này chứa business logic quan trọng nhất (price calculation, stock check, atomic transaction). Bug ở đây = money issue.
- **`@golevelup/ts-jest` để mock Prisma**: mock PrismaService mà vẫn có type-safety. Không dùng `jest.fn()` raw vì mất type hints. Prior art: xem `CONVENTIONS.md §9`.
- **E2E test 1 happy path**: `POST /auth/register → /auth/login → /products → /cart/items → /orders` — đủ để confirm integration không bị broken. Không cần test mọi edge case ở E2E level.
- **Coverage target Phase E**: service layer ≥ 60%, controllers không tính (test ở E2E level đủ rồi).

---

## Các bước thực hiện

### 1. Cấu hình Jest (đã có sẵn trong NestJS)

Kiểm tra `package.json` có sẵn:
```json
{
  "jest": {
    "moduleNameMapper": {
      "@common/(.*)": "<rootDir>/common/$1",
      "@modules/(.*)": "<rootDir>/modules/$1",
      "@shared/(.*)": "<rootDir>/shared/$1"
    }
  }
}
```

### 2. Unit Test — CartService.calculate()

Tạo `src/modules/cart/services/cart.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaServiceMock = {
      cart: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      cartItem: {
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get(CartService);
    prisma = module.get(PrismaService) as any;
  });

  describe('calculate', () => {
    it('returns zero totals for empty cart', async () => {
      prisma.cart.findUnique.mockResolvedValue(null as any);
      const result = await service.calculate('cart-id');
      expect(result).toEqual({ subtotal: 0, total: 0, items: [] });
    });

    it('calculates correct subtotal for multiple items', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          { id: 'item-1', productId: 'p1', quantity: 2, product: { basePrice: 100000 } },
          { id: 'item-2', productId: 'p2', quantity: 1, product: { basePrice: 50000 } },
        ],
      } as any);

      const result = await service.calculate('cart-1');

      expect(result.subtotal).toBe(250000);
      expect(result.total).toBe(250000);
      expect(result.items).toHaveLength(2);
    });

    it('calculates lineTotal per item correctly', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          { id: 'item-1', productId: 'p1', quantity: 3, product: { basePrice: 99000 } },
        ],
      } as any);

      const result = await service.calculate('cart-1');
      expect(result.items[0].lineTotal).toBe(297000);
    });
  });
});
```

### 3. Unit Test — AuthService

Tạo `src/modules/identity/services/auth.service.spec.ts`:

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('throws ConflictException when email exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' } as any);
      await expect(service.register({ email: 'exists@test.com', ... }))
        .rejects.toThrow(ConflictException);
    });

    it('hashes password before saving', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new', email: 'test@test.com', role: 'USER' } as any);
      tokenService.issueTokenPair.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

      await service.register({ email: 'test@test.com', password: 'Password@123', ... });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('Password@123');
      expect(createCall.data.password).toMatch(/^\$2b\$/); // bcrypt hash
    });
  });

  describe('login', () => {
    it('throws same error for wrong email and wrong password (no email enumeration)', async () => {
      prisma.user.findFirst.mockResolvedValue(null); // email không tồn tại
      await expect(service.login({ email: 'notfound@test.com', password: 'any' }))
        .rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });

      // Email tồn tại nhưng password sai
      prisma.user.findFirst.mockResolvedValue({ id: '1', password: 'hashed', isActive: true } as any);
      await expect(service.login({ email: 'found@test.com', password: 'wrong' }))
        .rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });
    });
  });
});
```

### 4. E2E Tests

Tạo `test/auth.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    // Áp dụng cùng pipes/filters như main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /auth/register → 201 với tokens', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'e2e@test.com', password: 'Test@123456', firstName: 'E2E', lastName: 'Test' })
      .expect(201)
      .expect(res => {
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.user.password).toBeUndefined();
      });
  });

  it('POST /auth/login sai password → 401 INVALID_CREDENTIALS', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e@test.com', password: 'WrongPass' })
      .expect(401)
      .expect(res => {
        expect(res.body.code).toBe('INVALID_CREDENTIALS');
      });
  });
});
```

Cần file `test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

### 5. Chạy tests

```bash
# Unit tests
npm run test

# Unit tests với coverage
npm run test:cov

# E2E tests (cần DB đang chạy)
npm run test:e2e
```

---

## Verify hoàn thành

```bash
npm run test:cov
# Service layer coverage phải ≥ 60%
# CartService coverage: 100% branches
# OrderService coverage: 100% branches

npm run test:e2e
# All e2e tests pass
```

---

## Xong thì làm gì?

→ [02-ship.md](./02-ship.md)
