import { Roles } from '@common/decorators/roles/roles.decorator';
import { FileUploadService } from '@common/file-upload/file-upload.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PresignedUrlDto } from './dto/presigned-url.dto';

const PRESIGNED_EXAMPLE = {
  files: [
    {
      uploadUrl: 'https://storage.example.com/products/uuid.jpg?X-Amz-Signature=...',
      key: 'products/uuid.jpg',
      publicUrl: 'https://storage.example.com/products/uuid.jpg',
      expiresIn: 300,
    },
  ],
};

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly fileUpload: FileUploadService) {}

  // One call for N files: returns one presigned URL per requested file, same order as the input.
  // Keys are not tied to any resource id yet — the client uploads directly to storage, then
  // attaches the confirmed keys to a resource afterwards (e.g. POST /products with `images`).
  @Post('presigned')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Get presigned URLs for direct upload to MinIO/R2',
    description:
      'Batch endpoint: pass one entry per file you intend to upload. Returns one presigned URL/key per entry, in the same order as `files`. Upload each file directly to its `uploadUrl` (each URL expires in `expiresIn` seconds), then reference the `key` when creating/updating the owning resource.',
  })
  @ApiResponse({ status: 201, description: 'One presigned URL per requested file', schema: { example: PRESIGNED_EXAMPLE } })
  @ApiResponse({ status: 422, description: 'VALIDATION_FAILED — folder must be one of products/categories/users, contentType must be one of image/jpeg/png/webp' })
  async getPresignedUrls(@Body() dto: PresignedUrlDto) {
    const files = await this.fileUpload.createPresignedUrls(
      dto.folder,
      dto.files.map((f) => f.contentType),
    );
    return { files };
  }
}
