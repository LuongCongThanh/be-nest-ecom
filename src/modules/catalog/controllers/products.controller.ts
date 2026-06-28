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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductService } from '../services/product.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

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
}
