import { Injectable, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

@Injectable()
export class ImageProcessingService {
  async validate(buffer: Buffer): Promise<void> {
    if (buffer.length > MAX_BYTES) {
      throw new PayloadTooLargeException({ code: 'FILE_TOO_LARGE', message: 'Max file size is 5MB' });
    }
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !ALLOWED_MIME.includes(type.mime)) {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: `Only jpeg, png, webp are allowed. Got: ${type?.mime ?? 'unknown'}`,
      });
    }
  }

  async processForCategory(buffer: Buffer): Promise<ProcessedImage> {
    const { data, info } = await sharp(buffer).resize(800, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height };
  }

  async processForProduct(buffer: Buffer): Promise<Record<'THUMB' | 'MEDIUM' | 'ORIGINAL', ProcessedImage>> {
    const [thumb, medium, original] = await Promise.all([
      sharp(buffer).resize(200, null, { fit: 'inside' }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
      sharp(buffer).resize(800, null, { fit: 'inside' }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }),
      sharp(buffer).resize(2000, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true }),
    ]);
    return {
      THUMB: { buffer: thumb.data, width: thumb.info.width, height: thumb.info.height },
      MEDIUM: { buffer: medium.data, width: medium.info.width, height: medium.info.height },
      ORIGINAL: { buffer: original.data, width: original.info.width, height: original.info.height },
    };
  }
}
