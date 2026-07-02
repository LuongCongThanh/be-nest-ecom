import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ProductModule } from '@modules/product/product.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [PrismaModule, ProductModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
