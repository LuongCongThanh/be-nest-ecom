import { FileUploadModule } from '@common/file-upload/file-upload.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductImageService } from './product-image.service';
import { ProductStockService } from './product-stock.service';
import { ProductService } from './product.service';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [ProductController],
  providers: [ProductService, ProductImageService, ProductStockService],
  exports: [ProductService],
})
export class ProductModule {}
