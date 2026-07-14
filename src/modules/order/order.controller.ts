import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderService } from './order.service';

type OrderWithItems = Awaited<ReturnType<OrderService['checkout']>>;

const ORDER_EXAMPLE = {
  id: 'uuid-order-id',
  orderNumber: 'ORD-2026-000123',
  userId: 'uuid-user-id',
  status: 'PENDING',
  customerEmailSnapshot: 'user@example.com',
  subtotal: '50000000',
  shippingFee: '30000',
  discountAmount: '0',
  vatTotal: '0',
  grandTotal: '50030000',
  shippingAddressSnapshot: { recipient: 'Nguyen Van A', phone: '0900000000', line1: '123 Le Loi', ward: 'Ben Nghe', district: 'District 1', province: 'Ho Chi Minh City' },
  shippingMethod: 'standard',
  paymentProvider: 'vnpay',
  placedAt: '2026-01-01T00:00:00.000Z',
  items: [
    {
      id: 'uuid-order-item-id',
      productId: 'uuid-product-id',
      productSnapshot: { name: 'iPhone 15 Pro', sku: 'IPHONE-15-PRO-BLK', image: null },
      unitPrice: '25000000',
      quantity: 2,
      lineTotal: '50000000',
    },
  ],
};

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private formatOrder(order: OrderWithItems) {
    return {
      ...order,
      subtotal: order.subtotal.toString(),
      shippingFee: order.shippingFee.toString(),
      discountAmount: order.discountAmount.toString(),
      vatTotal: order.vatTotal.toString(),
      grandTotal: order.grandTotal.toString(),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
    };
  }

  @Get()
  @ApiOperation({ summary: "List current user's orders (filter by status, paginated)" })
  @ApiResponse({ status: 200, description: 'Paginated orders', schema: { example: { data: [ORDER_EXAMPLE], total: 1, page: 1, limit: 20 } } })
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryOrderDto) {
    const result = await this.orderService.findAllForUser(userId, query);
    return { ...result, data: result.data.map((order) => this.formatOrder(order)) };
  }

  @Post()
  @ApiOperation({
    summary: 'Checkout current cart into an Order (idempotent via idempotencyKey)',
    description:
      "Atomic: validates stock, snapshots product/address into the Order, commits stock, and clears the user's cart. Replaying the same `idempotencyKey` in the body returns the original Order instead of creating a duplicate — it does not need to be sent as a header. MVP trim: `discountAmount` is always 0 (coupons not built) and `shippingFee` is a flat rate (dynamic calc not built).",
  })
  @ApiResponse({ status: 201, description: 'Order created (or original returned if idempotencyKey replayed)', schema: { example: ORDER_EXAMPLE } })
  @ApiResponse({ status: 409, description: 'ALL_ITEMS_UNAVAILABLE — every cart item points at a soft-deleted product' })
  @ApiResponse({ status: 422, description: 'EMPTY_CART' })
  async checkout(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.checkout(userId, dto);
    return this.formatOrder(order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail (owner only)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order detail', schema: { example: ORDER_EXAMPLE } })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — order belongs to a different user' })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const order = await this.orderService.findOneForUser(userId, id);
    return this.formatOrder(order);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Self-cancel an order — PENDING any time, or PAID within the 30-minute self-cancel window',
    description:
      'PENDING → CANCELLED anytime. PAID → REFUNDED only within 30 minutes of `placedAt`. Any other state (or an expired window) is rejected — state machine wins even inside the window. Releases stock on success.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order cancelled/refunded, stock released', schema: { example: { ...ORDER_EXAMPLE, status: 'CANCELLED' } } })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — order belongs to a different user' })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION — order is not PENDING, or PAID outside the 30-minute self-cancel window' })
  async cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const order = await this.orderService.cancelByUser(userId, id);
    return this.formatOrder(order);
  }
}
