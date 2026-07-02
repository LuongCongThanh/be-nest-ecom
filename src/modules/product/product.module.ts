import { FileUploadModule } from '@common/file-upload/file-upload.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductImageController } from './product-image.controller';
import { ProductImageService } from './product-image.service';
import { ProductStockController } from './product-stock.controller';
import { ProductStockService } from './product-stock.service';
import { ProductService } from './product.service';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [ProductController, ProductImageController, ProductStockController],
  providers: [ProductService, ProductImageService, ProductStockService],
  exports: [ProductService],
})
export class ProductModule {}
