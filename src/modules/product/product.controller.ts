import { Public } from '@common/decorators/public/public.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Storefront product listing: paginated, searchable, filterable by category/price/featured.
  // Only returns active, in-stock (by default), non-deleted products.
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Browse active products with pagination & search',
    description:
      'Public storefront listing. Supports text search, category/price filters, sorting, and pagination. Excludes inactive, out-of-stock (by default), and soft-deleted products. Also returns facets for filter UIs.',
  })
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  // Product detail page: returns a single active product, or 404 if inactive/deleted/missing.
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get product detail',
    description: 'Public product detail lookup by id. Returns 404 if the product is inactive, soft-deleted, or does not exist.',
  })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // Admin/staff creates a new catalog entry. Slug auto-generated from name if omitted.
  // Images already uploaded via POST /media/presigned can be attached in the same call
  // (see CreateProductDto.images) — no separate confirm step needed at creation time.
  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Admin/staff only. Validates unique slug and SKU, comparePrice >= price, and that categoryId (if given) exists. Auto-generates slug from name when not provided. Optionally attaches images uploaded via POST /media/presigned — pass their storage keys in `images`, in display order (first = primary), created atomically with the product.',
  })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  // Partial update — only fields present in the body are changed.
  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Update product',
    description: 'Admin/staff only. Partial update — only provided fields are changed. Re-validates slug/SKU uniqueness and comparePrice/category when those fields are touched.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  // Soft delete: sets deletedAt, product disappears from public/admin queries but row is kept for FK integrity.
  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete product',
    description: 'Admin only. Sets deletedAt instead of a hard delete, so existing OrderItem/CartItem references stay intact.',
  })
  softDelete(@Param('id') id: string) {
    return this.productService.softDelete(id);
  }
}
