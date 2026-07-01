import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OptionalAuth } from '@common/decorators/optional-auth/optional-auth.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const SESSION_COOKIE = 'session_id';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

type Req = Record<string, any>;
type Res = Record<string, any>;

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private resolveSession(req: Req, res: Res): { userId?: string; sessionId: string } {
    const user = req['user'] as { id?: string } | undefined;
    if (user?.id) {
      return { userId: user.id, sessionId: '' };
    }
    let sessionId: string = (req['cookies'] as Record<string, string>)?.[SESSION_COOKIE] ?? '';
    if (!sessionId) {
      sessionId = uuidv4();
      (res as any).cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_MAX_AGE });
    }
    return { sessionId };
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: 'Get current cart (guest or authenticated)' })
  async getCart(@Req() req: Req, @Res({ passthrough: true }) res: Res) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.getCart(userId, sessionId);
  }

  @Post('items')
  @OptionalAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Req() req: Req, @Res({ passthrough: true }) res: Res, @Body() dto: AddCartItemDto) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.addItem(userId, sessionId, dto);
  }

  @Patch('items/:itemId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(@Req() req: Req, @Res({ passthrough: true }) res: Res, @Param('itemId') itemId: string, @Body() dto: UpdateCartItemDto) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.updateItem(itemId, userId, sessionId, dto);
  }

  @Delete('items/:itemId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Req() req: Req, @Res({ passthrough: true }) res: Res, @Param('itemId') itemId: string) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.removeItem(itemId, userId, sessionId);
  }

  @Delete()
  @OptionalAuth()
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@Req() req: Req, @Res({ passthrough: true }) res: Res) {
    const { userId, sessionId } = this.resolveSession(req, res);
    return this.cartService.clearCart(userId, sessionId);
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into authenticated user cart (call after login)' })
  async mergeCart(@CurrentUser('id') userId: string, @Req() req: Req, @Res({ passthrough: true }) res: Res) {
    const sessionId: string = (req['cookies'] as Record<string, string>)?.[SESSION_COOKIE] ?? '';
    const result = await this.cartService.mergeGuestCart(sessionId, userId);
    if (sessionId) {
      (res as any).clearCookie(SESSION_COOKIE);
    }
    return result;
  }
}
