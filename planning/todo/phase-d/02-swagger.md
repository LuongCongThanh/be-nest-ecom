# Task D-02 — Swagger / OpenAPI

**Phase**: D — Polish  
**Ước lượng**: 2 giờ  
**Phụ thuộc**: Task D-01  
**Spec gốc**: [planning/setup/04-cross-cutting/04-swagger.md](../../planning/setup/04-cross-cutting/04-swagger.md)

---

## Nhiệm vụ

Hoàn thiện Swagger UI tại `/docs`. Mọi endpoint phải có documentation, DTO phải có examples, và phải khớp với response envelope thực tế của project.

---

## Các bước thực hiện

### 1. Cài packages

```bash
npm install @nestjs/swagger
```

### 2. Cấu hình Swagger trong main.ts

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ... setup khác

  const configService = app.get(ConfigService);

  // Swagger — chỉ enable khi không phải production
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('NestJS E-Commerce Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('categories', 'Product categories')
      .addTag('products', 'Product catalog')
      .addTag('cart', 'Shopping cart')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(configService.get<number>('app.port') ?? 3000);
}
```

### 3. Thêm decorators vào Controllers

Ví dụ cho AuthController:

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post('register')
  register(@Body() dto: RegisterDto) { ... }

  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  login(@Body() dto: LoginDto) { ... }
}
```

### 4. Thêm ApiProperty vào DTOs và response examples

Ví dụ RegisterDto:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Min 8 chars, uppercase + lowercase + number' })
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nguyen' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Van A' })
  @IsString()
  lastName: string;
}
```

Thêm tương tự vào **tất cả** DTO files.

> Vì project đã có response envelope `{ success, data, timestamp }`, nên Swagger examples cũng nên phản ánh đúng shape này thay vì chỉ mô tả raw payload.

### 5. Thêm @ApiBearerAuth cho protected routes

```typescript
@ApiBearerAuth()
@Controller('users')
export class UsersController { ... }
```

---

## Verify hoàn thành

Mở browser: `http://localhost:3000/docs`

- [ ] Swagger UI hiển thị
- [ ] Tất cả endpoints có documentation
- [ ] Có thể Authorize bằng Bearer token trong UI
- [ ] Thử gọi `POST /auth/login` trực tiếp từ Swagger UI → thành công

---

## Xong thì làm gì?

→ [03-account-recovery.md](./03-account-recovery.md)
