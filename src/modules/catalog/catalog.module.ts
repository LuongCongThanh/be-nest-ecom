import { FileUploadModule } from '@common/file-upload/file-upload.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoryService } from './services/category.service';
import { ProductImageService } from './services/product-image.service';
import { ProductService } from './services/product.service';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [CategoriesController, ProductsController],
  providers: [CategoryService, ProductService, ProductImageService],
})
export class CatalogModule {}
