import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IStorageAdapter } from '../storage/storage.interface';
import { STORAGE_ADAPTER } from '../storage/storage.interface';
import { ImageProcessingService, ProcessedImage } from './image-processing.service';

const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface UploadedImage {
  key: string;
  url: string;
  width: number;
  height: number;
}

export interface UploadedProductImage extends UploadedImage {
  size: 'THUMB' | 'MEDIUM' | 'ORIGINAL';
}

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  async uploadCategoryImage(buffer: Buffer, categoryId: string): Promise<UploadedImage> {
    await this.imageProcessing.validate(buffer);
    const processed = await this.imageProcessing.processForCategory(buffer);
    const key = `categories/${categoryId}/${randomUUID()}_medium.webp`;
    const url = await this.storage.upload(key, processed.buffer, 'image/webp');
    return { key, url, width: processed.width, height: processed.height };
  }

  async uploadProductImages(buffer: Buffer, productId: string): Promise<UploadedProductImage[]> {
    await this.imageProcessing.validate(buffer);
    const sizes = await this.imageProcessing.processForProduct(buffer);
    const uuid = randomUUID();

    return Promise.all(
      (Object.entries(sizes) as Array<['THUMB' | 'MEDIUM' | 'ORIGINAL', ProcessedImage]>).map(
        async ([size, img]) => {
          const key = `products/${productId}/${uuid}_${size.toLowerCase()}.webp`;
          const url = await this.storage.upload(key, img.buffer, 'image/webp');
          return { key, url, width: img.width, height: img.height, size };
        },
      ),
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  async createPresignedUrl(
    folder: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<PresignedUploadResult> {
    const ext = ALLOWED_UPLOAD_TYPES[contentType];
    if (!ext) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    const key = `${folder}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, contentType, expiresIn);
    // public URL = same base as upload URL but without query params
    const publicUrl = uploadUrl.split('?')[0];
    return { uploadUrl, key, publicUrl, expiresIn };
  }
}
