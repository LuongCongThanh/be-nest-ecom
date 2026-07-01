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
    const subtotal = items.filter((i) => !i.unavailable).reduce((sum, i) => sum + Number(i.currentPrice) * i.quantity, 0);

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

    if (product?.deletedAt !== null) {
      throw new HttpException({ code: 'PRODUCT_UNAVAILABLE', message: 'Product is no longer available' }, HttpStatus.CONFLICT);
    }
    if ((product?.stockQuantity ?? 0) < dto.quantity) {
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

    const userCart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId, lastActivity: new Date() },
      update: { lastActivity: new Date() },
    });

    for (const guestItem of guestCart.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: guestItem.productId, deletedAt: null, isActive: true },
      });
      if (!product) continue;

      const existingUserItem = await this.prisma.cartItem.findFirst({
        where: { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId },
      });

      if (existingUserItem) {
        const mergedQty = Math.min(existingUserItem.quantity + guestItem.quantity, product.stockQuantity);
        await this.prisma.cartItem.update({ where: { id: existingUserItem.id }, data: { quantity: mergedQty } });
      } else {
        const qty = Math.min(guestItem.quantity, product.stockQuantity);
        if (qty > 0) {
          await this.prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: qty,
              priceAtAdded: product.price,
            },
          });
        }
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.getCart(userId, undefined);
  }
}
