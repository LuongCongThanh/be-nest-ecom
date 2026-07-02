import { Roles } from '@common/decorators/roles/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ProductStockService } from './product-stock.service';

@ApiTags('products')
@Controller('products')
export class ProductStockController {
  constructor(private readonly productStockService: ProductStockService) {}

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
