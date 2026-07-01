import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_ITEM_SELECT = {
  id: true,
  productId: true,
  variantId: true,
  quantity: true,
  priceAtAdded: true,
  product: {
    select: {
      name: true,
      slug: true,
      price: true,
      stockQuantity: true,
      deletedAt: true,
      images: {
        where: { size: 'THUMB' as const, position: 0 },
        select: { url: true },
        take: 1,
      },
    },
  },
} satisfies Prisma.CartItemSelect;

type CartItemFull = Prisma.CartItemGetPayload<{ select: typeof CART_ITEM_SELECT }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private formatItems(items: CartItemFull[]) {
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtAdded: item.priceAtAdded.toString(),
      currentPrice: item.product.price.toString(),
      lineTotal: (item.product.price * BigInt(item.quantity)).toString(),
      priceChanged: item.priceAtAdded.toString() !== item.product.price.toString(),
      unavailable: item.product.deletedAt !== null,
      availableStock: item.product.stockQuantity,
    }));
  }

  private buildCartResponse(cartId: string, items: ReturnType<CartService['formatItems']>) {
    const subtotal = items.filter((i) => !i.unavailable).reduce((sum, i) => sum + BigInt(i.currentPrice) * BigInt(i.quantity), 0n);

    return {
      id: cartId,
      items,
      subtotal: subtotal.toString(),
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (userId) {
      return this.prisma.cart.upsert({
        where: { userId },
        create: { userId, lastActivity: new Date() },
        update: { lastActivity: new Date() },
        include: { items: { select: CART_ITEM_SELECT } },
      });
    }

    if (sessionId) {
      const existing = await this.prisma.cart.findFirst({
        where: { sessionId, userId: null },
        include: { items: { select: CART_ITEM_SELECT } },
      });
      if (existing) {
        await this.prisma.cart.update({ where: { id: existing.id }, data: { lastActivity: new Date() } });
        return existing;
      }
    }

    return this.prisma.cart.create({
      data: { sessionId: sessionId ?? null, lastActivity: new Date() },
      include: { items: { select: CART_ITEM_SELECT } },
    });
  }

  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    return this.buildCartResponse(cart.id, this.formatItems(cart.items));
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, dto: AddCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null, isActive: true },
    });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found or unavailable' });

    if (product.stockQuantity < dto.quantity) {
      throw new HttpException({ code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available', available: product.stockQuantity }, HttpStatus.CONFLICT);
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: dto.productId, variantId: dto.variantId ?? null },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (product.stockQuantity < newQty) {
        throw new HttpException({ code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available', available: product.stockQuantity }, HttpStatus.CONFLICT);
      }
      await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId ?? null,
          quantity: dto.quantity,
          priceAtAdded: product.price,
        },
      });
    }

    return this.getCart(userId, sessionId);
  }

  async updateItem(itemId: string, userId: string | undefined, sessionId: string | undefined, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException({ code: 'CART_ITEM_NOT_FOUND', message: 'Cart item not found' });
    if (item.cartId !== cart.id) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You do not own this cart item' });

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return this.getCart(userId, sessionId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
      select: { stockQuantity: true, deletedAt: true },
    });

    // Only enforce stock check for available products; unavailable ones stay in cart per spec AC-4
    if (product?.deletedAt === null && (product?.stockQuantity ?? 0) < dto.quantity) {
      throw new HttpException({ code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available', available: product?.stockQuantity ?? 0 }, HttpStatus.CONFLICT);
    }

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.getCart(userId, sessionId);
  }

  async removeItem(itemId: string, userId: string | undefined, sessionId: string | undefined) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException({ code: 'CART_ITEM_NOT_FOUND', message: 'Cart item not found' });
    if (item.cartId !== cart.id) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You do not own this cart item' });

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId, sessionId);
  }

  async clearCart(userId: string | undefined, sessionId: string | undefined) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId, sessionId);
  }

  async mergeGuestCart(sessionId: string, userId: string) {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId, userId: null },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userId, undefined);
    }

    // Batch-fetch all referenced products in one query to avoid N+1
    const productIds = [...new Set(guestCart.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
      select: { id: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    await this.prisma.$transaction(async (tx) => {
      const userCart = await tx.cart.upsert({
        where: { userId },
        create: { userId, lastActivity: new Date() },
        update: { lastActivity: new Date() },
      });

      // Batch-fetch existing user cart items for the same products
      const existingItems = await tx.cartItem.findMany({
        where: { cartId: userCart.id, productId: { in: productIds } },
      });
      const existingMap = new Map(existingItems.map((i) => [`${i.productId}:${i.variantId ?? ''}`, i]));

      for (const guestItem of guestCart.items) {
        const product = productMap.get(guestItem.productId);
        if (!product) continue;

        const key = `${guestItem.productId}:${guestItem.variantId ?? ''}`;
        const existing = existingMap.get(key);

        if (existing) {
          // Accumulate quantities — stock validation happens at checkout, not merge
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + guestItem.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
              priceAtAdded: product.price,
            },
          });
        }
      }

      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    return this.getCart(userId, undefined);
  }
}
