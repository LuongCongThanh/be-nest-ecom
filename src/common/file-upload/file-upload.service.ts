import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IStorageAdapter } from '@common/storage/storage.interface';
import { STORAGE_ADAPTER } from '@common/storage/storage.interface';
import { ImageProcessingService, ProcessedImage } from './image-processing.service';

const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ALLOWED_UPLOAD_FOLDERS = ['products', 'categories', 'users'] as const;
type AllowedUploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

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
      (Object.entries(sizes) as Array<['THUMB' | 'MEDIUM' | 'ORIGINAL', ProcessedImage]>).map(async ([size, img]) => {
        const key = `products/${productId}/${uuid}_${size.toLowerCase()}.webp`;
        const url = await this.storage.upload(key, img.buffer, 'image/webp');
        return { key, url, width: img.width, height: img.height, size };
      }),
    );
  }

  async deleteFile(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  async createPresignedUrl(folder: string, contentType: string, expiresIn = 300): Promise<PresignedUploadResult> {
    const ext = ALLOWED_UPLOAD_TYPES[contentType];
    if (!ext) {
      throw new BadRequestException({ code: 'UNSUPPORTED_CONTENT_TYPE', message: `Unsupported content type: ${contentType}` });
    }

    const sanitized = folder.toLowerCase().replace(/[^a-z0-9-]/g, '') as AllowedUploadFolder;
    if (!(ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(sanitized)) {
      throw new BadRequestException({ code: 'INVALID_UPLOAD_FOLDER', message: `Invalid folder "${folder}". Allowed: ${ALLOWED_UPLOAD_FOLDERS.join(', ')}` });
    }

    const key = `${sanitized}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, contentType, expiresIn);
    const publicUrl = uploadUrl.split('?')[0];
    return { uploadUrl, key, publicUrl, expiresIn };
  }

  async createPresignedUrls(folder: string, contentTypes: string[], expiresIn = 300): Promise<PresignedUploadResult[]> {
    return Promise.all(contentTypes.map((contentType) => this.createPresignedUrl(folder, contentType, expiresIn)));
  }
}
