import { Roles } from '@common/decorators/roles/roles.decorator';
import { FileUploadService } from '@common/file-upload/file-upload.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PresignedUrlDto } from './dto/presigned-url.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly fileUpload: FileUploadService) {}

  @Post('presigned')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get presigned URL for direct upload to MinIO/R2' })
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.fileUpload.createPresignedUrl(dto.folder, dto.contentType);
  }
}
