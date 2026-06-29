import { FileUploadModule } from '@common/file-upload/file-upload.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  imports: [PrismaModule, FileUploadModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
