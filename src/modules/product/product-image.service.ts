import { FileUploadService } from '@common/file-upload/file-upload.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ImageSize, ProductImage } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export const MAX_IMAGES = 10;

@Injectable()
export class ProductImageService {
  private readonly storagePublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUploadService,
    private readonly config: ConfigService,
  ) {
    this.storagePublicUrl = config.getOrThrow('STORAGE_PUBLIC_URL');
  }

  async upload(productId: string, buffer: Buffer): Promise<ProductImage[]> {
    const existing = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true, position: true, size: true },
      orderBy: { position: 'asc' },
    });

    const mediumCount = existing.filter((i) => i.size === ImageSize.MEDIUM).length;
    if (mediumCount >= MAX_IMAGES) {
      throw new ConflictException({ code: 'IMAGE_LIMIT_EXCEEDED', message: `Max ${MAX_IMAGES} images per product` });
    }

    const nextPosition = mediumCount;
    const uploaded = await this.fileUpload.uploadProductImages(buffer, productId);

    return this.prisma.$transaction(
      uploaded.map((img) =>
        this.prisma.productImage.create({
          data: {
            productId,
            key: img.key,
            url: img.url,
            size: img.size,
            width: img.width,
            height: img.height,
            position: img.size === ImageSize.MEDIUM ? nextPosition : 0,
          },
        }),
      ),
    );
  }

  async findAll(productId: string): Promise<ProductImage[]> {
    return this.prisma.productImage.findMany({
      where: { productId, size: ImageSize.MEDIUM },
      orderBy: { position: 'asc' },
    });
  }

  async delete(productId: string, imageId: string): Promise<void> {
    const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException({ code: 'IMAGE_NOT_FOUND' });

    // Delete all 3 sizes sharing same uuid (key prefix up to size suffix)
    const keyPrefix = image.key.replace(/_\w+\.webp$/, '');
    const siblings = await this.prisma.productImage.findMany({
      where: { productId, key: { startsWith: keyPrefix } },
    });

    await Promise.all(siblings.map((s) => this.fileUpload.deleteFile(s.key)));
    await this.prisma.productImage.deleteMany({ where: { id: { in: siblings.map((s) => s.id) } } });
  }

  async confirm(productId: string, key: string): Promise<ProductImage> {
    const existing = await this.prisma.productImage.findMany({
      where: { productId, size: ImageSize.MEDIUM },
    });
    if (existing.length >= MAX_IMAGES) {
      throw new ConflictException({ code: 'IMAGE_LIMIT_EXCEEDED', message: `Max ${MAX_IMAGES} images per product` });
    }
    const url = `${this.storagePublicUrl}/${key}`;
    const position = existing.length;
    return this.prisma.productImage.create({
      data: {
        productId,
        key,
        url,
        size: ImageSize.MEDIUM,
        width: 0,
        height: 0,
        position,
      },
    });
  }

  async reorder(productId: string, items: { id: string; position: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.productImage.updateMany({
          where: { id: item.id, productId },
          data: { position: item.position },
        }),
      ),
    );
  }
}
