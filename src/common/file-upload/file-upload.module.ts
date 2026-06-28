import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { ImageProcessingService } from './image-processing.service';

@Module({
  providers: [ImageProcessingService, FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
