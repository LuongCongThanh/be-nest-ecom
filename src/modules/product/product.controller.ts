import { Public } from '@common/decorators/public/public.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ConfirmImageDto } from './dto/confirm-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ProductImageService } from './product-image.service';
import { ProductStockService } from './product-stock.service';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
    private readonly productStockService: ProductStockService,
  ) {}

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

  @Post(':id/stock')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Manual stock adjustment (INBOUND or ADJUSTMENT)',
    description:
      'Creates a stock movement record and updates `stockQuantity` atomically. `reason` is required for all manual movements. Use `type=INBOUND` for new stock received; `type=ADJUSTMENT` for corrections (e.g. damaged goods, stocktake).',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 204, description: 'Stock adjusted' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INSUFFICIENT_STOCK — adjustment would result in negative stock' })
  @ApiResponse({ status: 422, description: 'REASON_REQUIRED' })
  manualAdjust(@Param('id') id: string, @Body() dto: AdjustStockDto, @CurrentUser('id') userId: string) {
    return this.productStockService.manualAdjust(id, dto, userId);
  }

  @Get(':id/stock/history')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Stock movement history for a product (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of stock movements' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  getStockHistory(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productStockService.getStockHistory(id, page ? +page : 1, limit ? +limit : 20);
  }
}
