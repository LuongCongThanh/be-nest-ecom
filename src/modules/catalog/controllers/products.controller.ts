import { Public } from '@common/decorators/public/public.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ConfirmImageDto } from '../dto/confirm-image.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductImageService } from '../services/product-image.service';
import { ProductService } from '../services/product.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
  ) {}

  // ─── Public endpoints ─────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse active products with pagination & search' })
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product detail' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // ─── Write endpoints (STAFF / ADMIN) ─────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  // ─── Admin-only endpoints ─────────────────────────────────────────────────

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete product' })
  softDelete(@Param('id') id: string) {
    return this.productService.softDelete(id);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product image (3 sizes: thumb/medium/original, webp)' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.productImageService.upload(id, file.buffer);
  }

  @Post(':id/images/confirm')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Confirm presigned upload — save key to DB after direct upload to storage' })
  confirmImage(@Param('id') id: string, @Body() dto: ConfirmImageDto) {
    return this.productImageService.confirm(id, dto.key);
  }

  @Get(':id/images')
  @Public()
  @ApiOperation({ summary: 'List product images (medium size, ordered by position)' })
  listImages(@Param('id') id: string) {
    return this.productImageService.findAll(id);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product image (removes all 3 sizes)' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productImageService.delete(id, imageId);
  }

  @Patch(':id/images/reorder')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder product images' })
  @ApiBody({ schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, position: { type: 'number' } } } } } } })
  reorderImages(@Param('id') id: string, @Body() body: { items: { id: string; position: number }[] }) {
    return this.productImageService.reorder(id, body.items);
  }
}
