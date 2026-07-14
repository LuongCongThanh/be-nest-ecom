import { Public } from '@common/decorators/public/public.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ConfirmImageDto } from './dto/confirm-image.dto';
import { ProductImageService } from './product-image.service';

const PRODUCT_IMAGE_EXAMPLE = {
  id: 'uuid-image-id',
  productId: 'uuid-product-id',
  key: 'products/uuid-product-id/uuid_medium.webp',
  url: 'https://cdn.example.com/products/uuid-product-id/uuid_medium.webp',
  size: 'MEDIUM',
  width: 800,
  height: 800,
  position: 0,
};

@ApiTags('products')
@Controller('products')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  // Direct multipart upload: server resizes into thumb/medium/original and converts to webp.
  // Rejects once the product already has MAX_IMAGES (10) medium images.
  @Post(':id/images')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload product image (3 sizes: thumb/medium/original, webp)',
    description:
      'Admin/staff only. Server-side resize pipeline: generates thumb (200px), medium (800px), and original (capped 2000px) sizes, all converted to webp. Max 5MB input, max 10 images per product.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: '3 ProductImage rows created (thumb/medium/original)', schema: { example: [PRODUCT_IMAGE_EXAMPLE] } })
  @ApiResponse({ status: 409, description: 'IMAGE_LIMIT_EXCEEDED — product already has 10 medium images' })
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.productImageService.upload(id, file.buffer);
  }

  // Second half of the presigned-URL flow: client already uploaded the file straight to storage
  // using a key from POST /media/presigned; this just records that key against the product.
  // Use this to add images to an EXISTING product — to attach images while creating a new
  // product in one call, pass the keys in CreateProductDto.images (POST /products) instead.
  @Post(':id/images/confirm')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Confirm presigned upload — save key to DB after direct upload to storage',
    description:
      'Admin/staff only. For adding images to an existing product. Use after the client has uploaded a file directly to storage via a presigned URL (see POST /media/presigned). Trusts the given key and creates a MEDIUM-size ProductImage row at the next position. To attach images at product-creation time in one call, use `images` on POST /products instead.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 201, description: 'ProductImage row created', schema: { example: PRODUCT_IMAGE_EXAMPLE } })
  @ApiResponse({ status: 409, description: 'IMAGE_LIMIT_EXCEEDED — product already has 10 medium images' })
  confirmImage(@Param('id') id: string, @Body() dto: ConfirmImageDto) {
    return this.productImageService.confirm(id, dto.key);
  }

  // Storefront gallery: medium-size images only, ordered by position (position 0 = primary image).
  @Get(':id/images')
  @Public()
  @ApiOperation({
    summary: 'List product images (medium size, ordered by position)',
    description: 'Public. Returns only the MEDIUM-size variant of each image, sorted by position ascending — position 0 is the primary/cover image.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Array of images (empty if none)', schema: { example: [PRODUCT_IMAGE_EXAMPLE] } })
  listImages(@Param('id') id: string) {
    return this.productImageService.findAll(id);
  }

  // Deletes an image and all its sibling sizes (thumb/medium/original share the same uuid prefix).
  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product image (removes all 3 sizes)',
    description: 'Admin/staff only. Deletes the given image plus its thumb/medium/original siblings from both the database and storage.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({ name: 'imageId', description: 'ProductImage UUID (any sibling size)' })
  @ApiResponse({ status: 204, description: 'Image and its siblings deleted' })
  @ApiResponse({ status: 404, description: 'IMAGE_NOT_FOUND' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productImageService.delete(id, imageId);
  }

  // Bulk-update the display order of a product's images in a single atomic call.
  @Patch(':id/images/reorder')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reorder product images',
    description:
      'Admin/staff only. Applies the given list of { id, position } pairs atomically. Position 0 becomes the new primary/cover image. Entries whose `id` does not belong to this product are silently ignored (no error) rather than failing the whole batch.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, position: { type: 'number' } } } } } } })
  @ApiResponse({ status: 204, description: 'Images reordered' })
  reorderImages(@Param('id') id: string, @Body() body: { items: { id: string; position: number }[] }) {
    return this.productImageService.reorder(id, body.items);
  }
}
