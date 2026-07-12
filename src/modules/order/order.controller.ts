import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderService } from './order.service';

type OrderWithItems = Awaited<ReturnType<OrderService['checkout']>>;

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
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryOrderDto) {
    const result = await this.orderService.findAllForUser(userId, query);
    return { ...result, data: result.data.map((order) => this.formatOrder(order)) };
  }

  @Post()
  @ApiOperation({ summary: 'Checkout current cart into an Order (idempotent via idempotencyKey)' })
  async checkout(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.checkout(userId, dto);
    return this.formatOrder(order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail (owner only)' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const order = await this.orderService.findOneForUser(userId, id);
    return this.formatOrder(order);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Self-cancel an order — PENDING any time, or PAID within the 30-minute self-cancel window' })
  async cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const order = await this.orderService.cancelByUser(userId, id);
    return this.formatOrder(order);
  }
}
