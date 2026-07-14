import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ForceStatusOrderDto } from './dto/force-status-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { OrderService } from './order.service';

type OrderWithItems = Awaited<ReturnType<OrderService['adminPay']>>;

const ORDER_EXAMPLE = {
  id: 'uuid-order-id',
  orderNumber: 'ORD-2026-000123',
  userId: 'uuid-user-id',
  status: 'PAID',
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

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminOrderController {
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
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List all orders (filter by status, paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated orders', schema: { example: { data: [ORDER_EXAMPLE], total: 1, page: 1, limit: 20 } } })
  async findAll(@Query() query: QueryOrderDto) {
    const result = await this.orderService.findAllAdmin(query);
    return { ...result, data: result.data.map((order) => this.formatOrder(order)) };
  }

  @Post(':id/pay')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Confirm payment (e.g. COD): PENDING -> PAID',
    description: 'MVP payment is COD-only (ADR-0001) — this is how an order becomes PAID; there is no online gateway callback yet.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order marked PAID', schema: { example: ORDER_EXAMPLE } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION — order is not PENDING' })
  async pay(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    const order = await this.orderService.adminPay(id, actorId);
    return this.formatOrder(order);
  }

  @Post(':id/ship')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Mark as shipped: PAID -> SHIPPING (requires trackingNumber + carrier)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order marked SHIPPING', schema: { example: { ...ORDER_EXAMPLE, status: 'SHIPPING' } } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION — order is not PAID' })
  @ApiResponse({ status: 422, description: 'TRACKING_REQUIRED — trackingNumber and carrier are required' })
  async ship(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: ShipOrderDto) {
    const order = await this.orderService.adminShip(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Post(':id/deliver')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Mark as delivered: SHIPPING -> DELIVERED', description: 'Sets `deliveredAt`, which starts the 7-day refund window used by `POST /admin/orders/:id/refund`.' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order marked DELIVERED', schema: { example: { ...ORDER_EXAMPLE, status: 'DELIVERED' } } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION — order is not SHIPPING' })
  async deliver(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    const order = await this.orderService.adminDeliver(id, actorId);
    return this.formatOrder(order);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Force cancel (releases stock); requires reason' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order marked CANCELLED, stock released', schema: { example: { ...ORDER_EXAMPLE, status: 'CANCELLED' } } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION' })
  async cancel(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    const order = await this.orderService.adminCancel(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Refund PAID/DELIVERED -> REFUNDED (full only, 7-day window after delivery)',
    description:
      'MVP is manual/full-only (ADR-0001): sets the Order to REFUNDED, releases stock, and emits `order.refunded` — the admin still has to process the actual money refund on the payment provider portal. Partial (per-item) refund is not supported.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 201, description: 'Order marked REFUNDED, stock released', schema: { example: { ...ORDER_EXAMPLE, status: 'REFUNDED' } } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION | REFUND_WINDOW_EXPIRED — more than 7 days since deliveredAt' })
  @ApiResponse({ status: 422, description: 'PARTIAL_REFUND_NOT_SUPPORTED — dto.partial=true is rejected in MVP' })
  async refund(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: RefundOrderDto) {
    const order = await this.orderService.adminRefund(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Patch(':id/force-status')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Bypass the state machine and force a status transition (audit-logged, requires reason)',
    description:
      'For support edge cases only (e.g. customer confirms received, COD reject, typo undo) — does NOT validate that `to` is a legal transition from the current state. Every call is written to `OrderStateChangeLog` with `isForceOverride=true`. Does not release/commit stock automatically; the admin is responsible for reconciling stock manually if the forced status implies it.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order status forced', schema: { example: ORDER_EXAMPLE } })
  @ApiResponse({ status: 404, description: 'ORDER_NOT_FOUND' })
  async forceStatus(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: ForceStatusOrderDto) {
    const order = await this.orderService.forceStatus(id, actorId, dto);
    return this.formatOrder(order);
  }
}
