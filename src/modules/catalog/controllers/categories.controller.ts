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
import { CreateCategoryDto } from '../dto/create-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { ReorderCategoryDto } from '../dto/reorder-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryService } from '../services/category.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  // ─── Public endpoints ─────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Flat list of active categories' })
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query, false);
  }

  // MUST be before :id to avoid matching "tree" as an id param
  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Nested category tree (active only)' })
  getTree() {
    return this.categoryService.getTree(false);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by id' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  // ─── Write endpoints (STAFF / ADMIN) ─────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  // MUST be before :id to avoid matching "reorder" as an id param
  @Patch('reorder')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk reorder categories (same parent)' })
  reorder(@Body() dto: ReorderCategoryDto) {
    return this.categoryService.reorder(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update category (name and slug are independent)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  // ─── Admin-only endpoints ─────────────────────────────────────────────────

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete category (blocked if has children)' })
  softDelete(@Param('id') id: string) {
    return this.categoryService.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted category' })
  restore(@Param('id') id: string) {
    return this.categoryService.restore(id);
  }
}
