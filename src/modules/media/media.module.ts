import { FileUploadModule } from '@common/file-upload/file-upload.module';
import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';

@Module({
  imports: [FileUploadModule],
  controllers: [MediaController],
})
export class MediaModule {}
