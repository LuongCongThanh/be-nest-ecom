import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ProductModule } from '@modules/product/product.module';
import { AdminOrderController } from './admin-order.controller';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [PrismaModule, ProductModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
