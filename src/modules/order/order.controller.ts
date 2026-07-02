import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
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

  @Post()
  @ApiOperation({ summary: 'Checkout current cart into an Order (idempotent via idempotencyKey)' })
  async checkout(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.checkout(userId, dto);
    return this.formatOrder(order);
  }
}
