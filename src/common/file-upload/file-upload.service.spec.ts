import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { R2Adapter } from '@common/storage/r2.adapter';
import { FileUploadService } from './file-upload.service';
import { ImageProcessingService } from './image-processing.service';

const config = new ConfigService();
const storageAdapter = new R2Adapter(config);
const fileUpload = new FileUploadService(storageAdapter, new ImageProcessingService());

describe('FileUploadService.createPresignedUrl', () => {
  it('generates a key scoped to the folder, independent of any resource id', async () => {
    const result = await fileUpload.createPresignedUrl('products', 'image/jpeg');

    expect(result.key).toMatch(/^products\/[0-9a-f-]{36}\.jpg$/);
    expect(result.uploadUrl).toContain(result.key);
    expect(result.publicUrl.endsWith(result.key)).toBe(true);
    expect(result.expiresIn).toBe(300);
  });

  it('maps content types to the correct file extension', async () => {
    const jpeg = await fileUpload.createPresignedUrl('products', 'image/jpeg');
    const png = await fileUpload.createPresignedUrl('products', 'image/png');
    const webp = await fileUpload.createPresignedUrl('products', 'image/webp');

    expect(jpeg.key.endsWith('.jpg')).toBe(true);
    expect(png.key.endsWith('.png')).toBe(true);
    expect(webp.key.endsWith('.webp')).toBe(true);
  });

  it('rejects an unsupported content type', async () => {
    await expect(fileUpload.createPresignedUrl('products', 'application/pdf')).rejects.toThrow('Unsupported content type');
  });

  it('rejects a folder outside the allowlist', async () => {
    await expect(fileUpload.createPresignedUrl('secrets', 'image/jpeg')).rejects.toThrow('Invalid folder');
  });
});
