import { Public } from '@common/decorators/public/public.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { ReorderCategoryDto } from './dto/reorder-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List categories — flat or nested tree',
    description:
      'Default (`format=flat`): paginated flat list. Use `parentId` to list direct children of a node, or omit it to get categories from all levels mixed together. Use `search` for a case-insensitive substring match on `name`.\n\n' +
      '`format=tree`: every category nested under its parent as `children[]`, starting from root nodes (`parentId = null`). No pagination — `parentId`/`search`/`page`/`limit` are ignored.\n\n' +
      'Both: returns only `isActive=true` categories by default — pass `includeInactive=true` to also include hidden ones. Never includes soft-deleted categories.',
  })
  @ApiResponse({
    status: 200,
    description: '`{ data, total, page, limit }` for format=flat, or `{ data: CategoryNode[] }` for format=tree',
    schema: {
      example: {
        data: [{ id: 'uuid', name: 'Home Appliances', slug: 'home-appliances', parentId: null, isActive: true, sortOrder: 0 }],
        total: 1,
        page: 1,
        limit: 20,
      },
    },
  })
  findAll(@Query() query: QueryCategoryDto) {
    const includeInactive = query.includeInactive ?? false;
    if (query.format === 'tree') {
      return this.categoryService.getTree(includeInactive).then((data) => ({ data }));
    }
    return this.categoryService.findAll(query, includeInactive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'If `slug` is omitted, it is auto-generated from `name` once at creation time — afterwards `name` and `slug` are independent fields. Set `parentId` to nest under an existing category (max depth: 5 levels).',
  })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND — parentId does not reference an existing category' })
  @ApiResponse({ status: 422, description: 'SLUG_CONFLICT (response includes `meta.suggestedSlug`) | CATEGORY_MAX_DEPTH_EXCEEDED' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  // MUST be before :id to avoid matching "reorder" as an id param
  @Patch('reorder')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bulk reorder categories (same parent)',
    description:
      'Atomically updates `sortOrder` for a batch of sibling categories in one transaction — use this instead of multiple `PATCH /:id` calls when reordering a list, ' +
      'so a partial failure cannot leave the list in an inconsistent order. All items in `items[]` must share the same `parentId`.',
  })
  @ApiBody({
    schema: {
      example: {
        items: [
          { id: 'uuid-1', sortOrder: 0 },
          { id: 'uuid-2', sortOrder: 1 },
        ],
      },
    },
  })
  @ApiResponse({ status: 204, description: 'Reordered successfully' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND — one or more ids do not exist' })
  @ApiResponse({ status: 422, description: 'REORDER_MIXED_PARENTS — items do not all share the same parentId' })
  reorder(@Body() dto: ReorderCategoryDto) {
    return this.categoryService.reorder(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Update category (name and slug are independent)',
    description:
      'Partial update — only send the fields you want to change. Changing `name` does NOT regenerate `slug` (would break indexed URLs); ' +
      'send `slug` explicitly to change it. Changing `parentId` re-validates circular reference and max depth (5 levels) for the moved subtree. ' +
      'This endpoint does not touch soft-delete state — use `DELETE /:id` / `PATCH /:id/restore` for that.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  @ApiResponse({ status: 422, description: 'SLUG_CONFLICT | CIRCULAR_PARENT_REFERENCE | CATEGORY_MAX_DEPTH_EXCEEDED' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete category (blocked if has children)',
    description:
      'Sets `deletedAt` — category disappears from every list, including admin. Refused if the category still has active children (re-parent or delete them first). ' +
      'Products assigned to this category have `categoryId` set to `null`, they are not deleted. Different from `isActive=false` (visibility toggle, reversible instantly via `PATCH /:id`) — this is the permanent-removal path.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  @ApiResponse({ status: 400, description: 'CATEGORY_HAS_CHILDREN' })
  softDelete(@Param('id') id: string) {
    return this.categoryService.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Restore a soft-deleted category',
    description:
      'Clears `deletedAt`. Refused if the parent category is also soft-deleted (restore the parent first). ' +
      'If another category has since taken this slug, fails with a suggested alternative rather than silently renaming.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category restored' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  @ApiResponse({ status: 400, description: 'CATEGORY_NOT_DELETED | CATEGORY_PARENT_DELETED' })
  @ApiResponse({ status: 422, description: 'SLUG_CONFLICT (response includes `meta.suggestedSlug`)' })
  restore(@Param('id') id: string) {
    return this.categoryService.restore(id);
  }

  @Post(':id/image')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload category image (medium 800px, webp)',
    description:
      'Replaces the existing image if one is set (old file is deleted from storage first). Output is always resized to 800px and converted to `.webp` regardless of input format. Max upload size: 5MB.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 200, description: 'Category with updated `image` URL' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  @ApiResponse({ status: 413, description: 'File exceeds 5MB limit' })
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.categoryService.uploadImage(id, file.buffer);
  }

  @Delete(':id/image')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete category image',
    description: 'Removes the file from storage and clears `image` on the category. No-op (still 204) if the category has no image.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Image deleted (or none existed)' })
  @ApiResponse({ status: 404, description: 'CATEGORY_NOT_FOUND' })
  deleteImage(@Param('id') id: string) {
    return this.categoryService.deleteImage(id);
  }
}
