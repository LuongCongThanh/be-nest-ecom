import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OptionalAuth } from '@common/decorators/optional-auth/optional-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const SESSION_COOKIE = 'session_id';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const CART_EXAMPLE = {
  id: 'uuid-cart-id',
  items: [
    {
      id: 'uuid-cart-item-id',
      productId: 'uuid-product-id',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      image: 'https://cdn.example.com/products/uuid_thumb.webp',
      variantId: null,
      quantity: 2,
      priceAtAdded: '25000000',
      currentPrice: '25000000',
      lineTotal: '50000000',
      priceChanged: false,
      unavailable: false,
      availableStock: 10,
    },
  ],
  subtotal: '50000000',
  totalItems: 2,
};

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private resolveSession(req: Request, res: Response): { userId?: string; sessionId: string } {
    const user: { id?: string } | undefined = req['user'];
    if (user?.id) {
      return { userId: user.id, sessionId: '' };
    }
    let sessionId: string = (req['cookies'] as Record<string, string>)?.[SESSION_COOKIE] ?? '';
    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_MAX_AGE });
    }
    return { sessionId };
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({
    summary: 'Get current cart (guest or authenticated)',
    description:
      'With a valid `Authorization: Bearer` header, returns the user cart. Otherwise resolves by the `session_id` cookie, creating one (30-day, httpOnly) if absent. Always creates a cart row if none exists yet, so this endpoint never 404s.',
  })
  @ApiResponse({ status: 200, description: 'Current cart', schema: { example: CART_EXAMPLE } })
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.getCart(userId, sessionId);
  }

  @Post('items')
  @OptionalAuth()
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'If the same `productId`+`variantId` already exists in the cart, quantities are summed (idempotent add) instead of creating a duplicate line. Snapshots `priceAtAdded` from the current `Product.price`.',
  })
  @ApiResponse({ status: 201, description: 'Item added, full cart returned', schema: { example: CART_EXAMPLE } })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND — product missing, soft-deleted, or inactive' })
  @ApiResponse({ status: 409, description: 'INSUFFICIENT_STOCK — requested quantity exceeds available stock' })
  async addItem(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: AddCartItemDto) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.addItem(userId, sessionId, dto);
  }

  @Patch('items/:itemId')
  @OptionalAuth()
  @ApiOperation({
    summary: 'Update cart item quantity',
    description:
      'Setting `quantity` to 0 removes the item. Stock is only re-checked when the product is still active — an item pointing at an unavailable (soft-deleted) product can still have its quantity edited or be removed, per AC-4.',
  })
  @ApiParam({ name: 'itemId', description: 'CartItem UUID' })
  @ApiResponse({ status: 200, description: 'Updated cart', schema: { example: CART_EXAMPLE } })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — item belongs to a different cart' })
  @ApiResponse({ status: 404, description: 'CART_ITEM_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INSUFFICIENT_STOCK — requested quantity exceeds available stock' })
  async updateItem(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.updateItem(itemId, userId, sessionId, dto);
  }

  @Delete('items/:itemId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'itemId', description: 'CartItem UUID' })
  @ApiResponse({ status: 200, description: 'Item removed, remaining cart returned', schema: { example: CART_EXAMPLE } })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — item belongs to a different cart' })
  @ApiResponse({ status: 404, description: 'CART_ITEM_NOT_FOUND' })
  async removeItem(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('itemId') itemId: string) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.removeItem(itemId, userId, sessionId);
  }

  @Delete()
  @OptionalAuth()
  @ApiOperation({ summary: 'Clear all items from cart', description: 'Removes every CartItem but keeps the Cart row itself for reuse on the next visit.' })
  @ApiResponse({ status: 200, description: 'Empty cart returned', schema: { example: { ...CART_EXAMPLE, items: [], subtotal: '0', totalItems: 0 } } })
  async clearCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.clearCart(userId, sessionId);
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Merge guest cart into authenticated user cart (call after login)',
    description:
      "Reads the `session_id` cookie, folds its guest CartItems into the caller's user cart (same `productId`+`variantId` → quantities summed), deletes the guest cart row, and clears the cookie. No-op if there is no guest cart or it is empty. Stock is NOT validated during merge — that happens at checkout.",
  })
  @ApiResponse({ status: 201, description: 'Merged cart returned', schema: { example: CART_EXAMPLE } })
  async mergeCart(@CurrentUser('id') userId: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId: string = (req['cookies'] as Record<string, string>)?.[SESSION_COOKIE] ?? '';
    const result = await this.cartService.mergeGuestCart(sessionId, userId);
    if (sessionId) {
      res.clearCookie(SESSION_COOKIE);
    }
    return result;
  }
}
