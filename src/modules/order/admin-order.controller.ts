import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ForceStatusOrderDto } from './dto/force-status-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { OrderService } from './order.service';

type OrderWithItems = Awaited<ReturnType<OrderService['adminPay']>>;

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
  async findAll(@Query() query: QueryOrderDto) {
    const result = await this.orderService.findAllAdmin(query);
    return { ...result, data: result.data.map((order) => this.formatOrder(order)) };
  }

  @Post(':id/pay')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Confirm payment (e.g. COD): PENDING -> PAID' })
  async pay(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    const order = await this.orderService.adminPay(id, actorId);
    return this.formatOrder(order);
  }

  @Post(':id/ship')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Mark as shipped: PAID -> SHIPPING (requires trackingNumber + carrier)' })
  async ship(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: ShipOrderDto) {
    const order = await this.orderService.adminShip(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Post(':id/deliver')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Mark as delivered: SHIPPING -> DELIVERED' })
  async deliver(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    const order = await this.orderService.adminDeliver(id, actorId);
    return this.formatOrder(order);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Force cancel (releases stock); requires reason' })
  async cancel(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    const order = await this.orderService.adminCancel(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Refund PAID/DELIVERED -> REFUNDED (full only, 7-day window after delivery)' })
  async refund(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: RefundOrderDto) {
    const order = await this.orderService.adminRefund(id, actorId, dto);
    return this.formatOrder(order);
  }

  @Patch(':id/force-status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bypass the state machine and force a status transition (audit-logged, requires reason)' })
  async forceStatus(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: ForceStatusOrderDto) {
    const order = await this.orderService.forceStatus(id, actorId, dto);
    return this.formatOrder(order);
  }
}
