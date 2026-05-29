# Task C-03 — Shopping Cart

**Phase**: C — Core MVP  
**Ước lượng**: 4 giờ  
**Phụ thuộc**: Task C-02  
**Spec gốc**: [planning/business/03-cart/02-shopping-cart.md](../../planning/business/03-cart/02-shopping-cart.md)

---

## Nhiệm vụ

Implement Shopping Cart với guest cart (cookie) và user cart (JWT). Khi guest login → merge cart.

---

## Các bước thực hiện

### 1. Thêm Cart models vào schema.prisma

```prisma
model Cart {
  id         String     @id @default(uuid())
  userId     String?    @unique
  guestId    String?    @unique
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items      CartItem[]

  @@index([userId])
  @@index([guestId])
  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  productId String
  variantId String?
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId, variantId])
  @@index([cartId])
  @@map("cart_items")
}
```

Chạy migration:
```bash
npx prisma migrate dev --name add-cart
```

### 2. Thêm relation Cart vào User model

```prisma
model User {
  // ... fields cũ
  cart   Cart?
}
```

### 3. CartService

Tạo `src/modules/cart/services/cart.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId?: string, guestId?: string) {
    if (userId) {
      return this.prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        include: { items: { include: { product: true } } },
      });
    }

    if (guestId) {
      return this.prisma.cart.upsert({
        where: { guestId },
        create: { guestId },
        update: {},
        include: { items: { include: { product: true } } },
      });
    }

    throw new Error('userId or guestId required');
  }

  async addItem(cartId: string, productId: string, quantity: number, variantId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, isActive: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId,
          productId,
          variantId: variantId ?? null,
        },
      },
      create: { cartId, productId, variantId, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  async updateItem(cartId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.prisma.cartItem.delete({ where: { id: itemId } });
    }
    return this.prisma.cartItem.update({
      where: { id: itemId, cartId },
      data: { quantity },
    });
  }

  async removeItem(cartId: string, itemId: string) {
    return this.prisma.cartItem.delete({ where: { id: itemId, cartId } });
  }

  async calculate(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) return { subtotal: 0, total: 0, items: [] };

    const items = cart.items.map(item => ({
      ...item,
      unitPrice: Number(item.product.basePrice),
      lineTotal: Number(item.product.basePrice) * item.quantity,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return { subtotal, total: subtotal, items };
  }

  async mergeGuestCart(userId: string, guestId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) return { mergeWarnings: [] };

    const userCart = await this.getOrCreateCart(userId);
    const mergeWarnings: string[] = [];

    for (const guestItem of guestCart.items) {
      try {
        await this.addItem(userCart.id, guestItem.productId, guestItem.quantity, guestItem.variantId ?? undefined);
      } catch (e) {
        mergeWarnings.push(`Failed to merge item ${guestItem.productId}`);
      }
    }

    await this.prisma.cart.delete({ where: { guestId } });

    return { mergeWarnings };
  }
}
```

### 4. CartController

Tạo `src/modules/cart/controllers/cart.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { CurrentUser, Public } from '../../../common/decorators';
import { randomUUID } from 'crypto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser('id') userId?: string) {
    const guestId = this.getOrSetGuestId(req, res);
    const cart = await this.cartService.getOrCreateCart(userId, userId ? undefined : guestId);
    return this.cartService.calculate(cart.id);
  }

  @Post('items')
  async addItem(
    @Body() body: { productId: string; quantity: number; variantId?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const guestId = this.getOrSetGuestId(req, res);
    const cart = await this.cartService.getOrCreateCart(userId, userId ? undefined : guestId);
    return this.cartService.addItem(cart.id, body.productId, body.quantity, body.variantId);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const guestId = this.getOrSetGuestId(req, res);
    const cart = await this.cartService.getOrCreateCart(userId, userId ? undefined : guestId);
    return this.cartService.updateItem(cart.id, itemId, body.quantity);
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const guestId = this.getOrSetGuestId(req, res);
    const cart = await this.cartService.getOrCreateCart(userId, userId ? undefined : guestId);
    return this.cartService.removeItem(cart.id, itemId);
  }

  private getOrSetGuestId(req: Request, res: Response): string {
    let guestId = req.cookies?.['gsid'];
    if (!guestId) {
      guestId = randomUUID();
      res.cookie('gsid', guestId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    }
    return guestId;
  }
}
```

### 5. Cài cookie-parser

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

Trong `main.ts`:
```typescript
import * as cookieParser from 'cookie-parser';
app.use(cookieParser());
```

---

## Verify hoàn thành

```http
### Xem cart (không cần login)
GET http://localhost:3000/api/v1/cart

### Thêm item vào cart
POST http://localhost:3000/api/v1/cart/items
Content-Type: application/json

{ "productId": "<id>", "quantity": 2 }

### Xem cart với tính tiền
GET http://localhost:3000/api/v1/cart
# Phải trả: { subtotal, total, items: [...] }
```

---

## Xong thì làm gì?

→ [04-order.md](./04-order.md)
