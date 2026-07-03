import 'dotenv/config';
import { PrismaClient, ImageSize } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { PrismaService } from '@common/prisma/prisma.service';
import { FileUploadService } from '@common/file-upload/file-upload.service';
import { ImageProcessingService } from '@common/file-upload/image-processing.service';
import { R2Adapter } from '@common/storage/r2.adapter';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';
import { CreateProductDto } from './dto/create-product.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaService;
const config = new ConfigService();
const productService = new ProductService(prisma, config);

const storageAdapter = new R2Adapter(config);
const fileUpload = new FileUploadService(storageAdapter, new ImageProcessingService());
const productImageService = new ProductImageService(prisma, fileUpload, config);

const MAX_IMAGES = 10;

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createProduct(): Promise<{ id: string }> {
  const suffix = uniqueSuffix();
  const dto: CreateProductDto = { sku: `SKU-${suffix}`.toUpperCase(), name: `Test Product ${suffix}`, price: 100_000 };
  return (await productService.create(dto)) as { id: string };
}

async function seedMediumImages(productId: string, count: number) {
  for (let i = 0; i < count; i++) {
    await prisma.productImage.create({
      data: { productId, key: `products/${productId}/seed-${i}_medium.webp`, url: 'http://example.local/seed.webp', size: ImageSize.MEDIUM, width: 800, height: 800, position: i },
    });
  }
}

async function realImageBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 20, height: 20, channels: 3, background: { r: 200, g: 50, b: 50 } } })
    .png()
    .toBuffer();
}

describe('ProductImageService', () => {
  const createdProductIds: string[] = [];

  afterAll(async () => {
    await prisma.productImage.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.$disconnect();
  });

  describe('upload', () => {
    // Skipped: ImageProcessingService.validate() dynamically imports the ESM-only
    // `file-type` package, which Jest's CommonJS transform cannot load without
    // --experimental-vm-modules. Pre-existing environment limitation, not
    // introduced by this refactor — the guard-clause test below still covers
    // upload()'s own logic without going through validate().
    it.skip('uploads a real image and creates thumb/medium/original rows', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      const buffer = await realImageBuffer();

      const images = await productImageService.upload(product.id, buffer);

      expect(images).toHaveLength(3);
      expect(images.map((i) => i.size).sort()).toEqual([ImageSize.MEDIUM, ImageSize.ORIGINAL, ImageSize.THUMB].sort());
      const medium = images.find((i) => i.size === ImageSize.MEDIUM)!;
      expect(medium.position).toBe(0);

      await productImageService.delete(product.id, medium.id);
      const remaining = await prisma.productImage.findMany({ where: { productId: product.id } });
      expect(remaining).toHaveLength(0);
    });

    it('rejects once MAX_IMAGES medium images already exist (IMAGE_LIMIT_EXCEEDED)', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      await seedMediumImages(product.id, MAX_IMAGES);
      const buffer = await realImageBuffer();

      await expect(productImageService.upload(product.id, buffer)).rejects.toMatchObject({
        response: { code: 'IMAGE_LIMIT_EXCEEDED' },
      });
    });
  });

  describe('findAll', () => {
    it('returns only MEDIUM images ordered by position', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      await seedMediumImages(product.id, 3);
      await prisma.productImage.create({
        data: { productId: product.id, key: `products/${product.id}/seed_thumb.webp`, url: 'http://example.local/thumb.webp', size: ImageSize.THUMB, width: 200, height: 200, position: 0 },
      });

      const images = await productImageService.findAll(product.id);

      expect(images.every((i) => i.size === ImageSize.MEDIUM)).toBe(true);
      expect(images.map((i) => i.position)).toEqual([0, 1, 2]);
    });
  });

  describe('confirm', () => {
    it('creates a MEDIUM image at the next position', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);

      const first = await productImageService.confirm(product.id, `products/${product.id}/confirmed-1.webp`);
      const second = await productImageService.confirm(product.id, `products/${product.id}/confirmed-2.webp`);

      expect(first.position).toBe(0);
      expect(second.position).toBe(1);
    });

    it('rejects once MAX_IMAGES medium images already exist (IMAGE_LIMIT_EXCEEDED)', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      await seedMediumImages(product.id, MAX_IMAGES);

      await expect(productImageService.confirm(product.id, `products/${product.id}/overflow.webp`)).rejects.toMatchObject({
        response: { code: 'IMAGE_LIMIT_EXCEEDED' },
      });
    });
  });

  describe('delete', () => {
    it('removes all sibling sizes sharing the same key prefix', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      const uuid = uniqueSuffix();
      const medium = await prisma.productImage.create({
        data: { productId: product.id, key: `products/${product.id}/${uuid}_medium.webp`, url: 'x', size: ImageSize.MEDIUM, width: 800, height: 800, position: 0 },
      });
      await prisma.productImage.create({
        data: { productId: product.id, key: `products/${product.id}/${uuid}_thumb.webp`, url: 'x', size: ImageSize.THUMB, width: 200, height: 200, position: 0 },
      });
      await prisma.productImage.create({
        data: { productId: product.id, key: `products/${product.id}/${uuid}_original.webp`, url: 'x', size: ImageSize.ORIGINAL, width: 2000, height: 2000, position: 0 },
      });

      await productImageService.delete(product.id, medium.id);

      const remaining = await prisma.productImage.findMany({ where: { productId: product.id } });
      expect(remaining).toHaveLength(0);
    });

    it('throws IMAGE_NOT_FOUND for an unknown image id', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);

      await expect(productImageService.delete(product.id, '00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        response: { code: 'IMAGE_NOT_FOUND' },
      });
    });
  });

  describe('reorder', () => {
    it('applies the given positions atomically', async () => {
      const product = await createProduct();
      createdProductIds.push(product.id);
      const images = await Promise.all([
        prisma.productImage.create({ data: { productId: product.id, key: 'a', url: 'x', size: ImageSize.MEDIUM, width: 1, height: 1, position: 0 } }),
        prisma.productImage.create({ data: { productId: product.id, key: 'b', url: 'x', size: ImageSize.MEDIUM, width: 1, height: 1, position: 3 } }),
      ]);

      await productImageService.reorder(product.id, [
        { id: images[0].id, position: 5 },
        { id: images[1].id, position: 6 },
      ]);

      const updated = await prisma.productImage.findMany({ where: { productId: product.id }, orderBy: { key: 'asc' } });
      expect(updated.map((i) => i.position)).toEqual([5, 6]);
    });
  });
});
