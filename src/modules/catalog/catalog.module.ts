import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, ProductsController],
  providers: [CategoryService, ProductService],
})
export class CatalogModule {}
