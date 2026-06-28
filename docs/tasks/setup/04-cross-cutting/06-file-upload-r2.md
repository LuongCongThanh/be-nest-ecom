# TASK-223 + TASK-206: File Upload với Cloudflare R2

## Metadata

- **Task ID**: TASK-223 (infrastructure) + TASK-206 (product images)
- **Branch**: `ThanhLuongCong/feat/phase-d/file-upload`
- **Phụ thuộc**: TASK-203 ✅ (Products CRUD đã merge)
- **Trạng thái**: ⏳ Not started

---

## Tại sao Cloudflare R2?

| | AWS S3 | Cloudflare R2 |
|--|--------|---------------|
| Lưu trữ | $0.023/GB | **Free 10GB** |
| Egress (user xem ảnh) | $0.09/GB 🔴 | **$0** ✅ |
| API | S3 | **S3-compatible** (cùng SDK) |
| Migrate về S3 sau | Viết lại code | Đổi 2 dòng env |

Code `S3Adapter` viết cho R2 = chạy được trên AWS S3 thật, không đổi một dòng logic.

---

## Pipeline tổng thể

```
Client gửi multipart/form-data
  │
  ▼
FileInterceptor (multer) ──── trích ra Buffer
  │
  ▼
file-type ──────────────────── kiểm tra magic bytes (chặn exe giả jpg)
  │
  ▼
sharp ──────────────────────── resize + convert .webp
  │   category: 1 size (medium 800px)
  │   product:  3 sizes (thumb 200px / medium 800px / original 2000px)
  │
  ▼
R2Adapter.upload(key, buffer) ── đẩy lên Cloudflare R2
  │
  ▼
Lưu URL vào PostgreSQL ────── category.image hoặc product_images row
```

---

## Phase 0 — Setup Cloudflare R2 (không cần code)

### Bước 1: Tạo account

- Vào `cloudflare.com` → Sign Up → xác nhận email
- Không cần credit card cho free tier

### Bước 2: Tạo bucket

- Sidebar → **R2 Object Storage** → **Create bucket**
- Name: `ecom-dev`
- Region: Automatic → **Create bucket**

### Bước 3: Bật public URL

- Vào bucket → tab **Settings** → **Public Access** → **Allow Access** → Confirm
- Copy **Public bucket URL**: `https://pub-xxxx.r2.dev`

### Bước 4: Tạo API Token

- Sidebar R2 → **Manage R2 API Tokens** → **Create API Token**
- Token name: `ecom-dev-token`
- Permissions: **Object Read & Write**
- Specify bucket: `ecom-dev`
- **Create API Token** → copy ngay (chỉ hiện 1 lần):
  - Access Key ID
  - Secret Access Key
- Copy **Account ID** từ sidebar phải màn hình R2

### Bước 5: Thêm vào `.env`

```env
# Cloudflare R2
R2_ACCOUNT_ID=abc123...
R2_ACCESS_KEY_ID=xxx...
R2_SECRET_ACCESS_KEY=yyy...
R2_BUCKET_NAME=ecom-dev
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

---

## Phase 1 — Branch + packages

```powershell
git checkout main
git pull --rebase origin main
git checkout -b ThanhLuongCong/feat/phase-d/file-upload

npm install @aws-sdk/client-s3 sharp file-type
npm install --save-dev @types/multer
```

| Package | Vai trò |
|---------|---------|
| `@aws-sdk/client-s3` | SDK upload lên R2/S3 |
| `sharp` | Resize + convert webp (dùng libvips C++, không block event loop) |
| `file-type` | Đọc magic bytes — client không thể giả mạo |
| `@types/multer` | TypeScript types cho `req.file` |

> **Lưu ý:** `file-type` v20+ là ESM-only → import bằng `await import('file-type')`, không dùng `require`.

---

## Phase 2 — Prisma: thêm `ProductImage` model

### Sửa `schema.prisma`

Thêm enum và model mới, thêm relation vào `Product`:

```prisma
enum ImageSize {
  THUMB
  MEDIUM
  ORIGINAL
}

model ProductImage {
  id        String    @id @default(uuid())
  productId String
  key       String                          // storage key: "products/{id}/{uuid}_{size}.webp"
  url       String                          // public URL
  size      ImageSize
  width     Int
  height    Int
  position  Int       @default(0)
  altText   String?
  createdAt DateTime  @default(now())

  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, position])
  @@index([productId])
  @@map("product_images")
}
```

Thêm vào model `Product`:
```prisma
images    ProductImage[]
```

### Chạy migration

```powershell
npx prisma migrate dev --name add-product-images
npx prisma generate
```

---

## Phase 3 — Storage layer

### Cấu trúc file

```
src/common/storage/
  storage.interface.ts     ← IStorageAdapter + injection token
  r2.adapter.ts            ← impl dùng @aws-sdk/client-s3
  storage.module.ts        ← export R2Adapter
```

### `storage.interface.ts`

```typescript
export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

export interface IStorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>; // trả về URL public
  delete(key: string): Promise<void>;
}
```

### `r2.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageAdapter } from './storage.interface';

@Injectable()
export class R2Adapter implements IStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow('R2_PUBLIC_URL');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
```

### `storage.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { R2Adapter } from './r2.adapter';
import { STORAGE_ADAPTER } from './storage.interface';

@Global()
@Module({
  providers: [{ provide: STORAGE_ADAPTER, useClass: R2Adapter }],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
```

---

## Phase 4 — Image processing + FileUploadService

### Cấu trúc file

```
src/common/file-upload/
  image-processing.service.ts   ← sharp pipeline
  file-upload.service.ts        ← orchestrate: validate → process → upload
  file-upload.module.ts
```

### `image-processing.service.ts`

```typescript
import { Injectable, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import * as sharp from 'sharp';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

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

    // file-type là ESM → dynamic import
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
    const { data, info } = await sharp(buffer)
      .resize(800, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, width: info.width, height: info.height };
  }

  async processForProduct(buffer: Buffer): Promise<Record<'thumb' | 'medium' | 'original', ProcessedImage>> {
    const [thumb, medium, original] = await Promise.all([
      sharp(buffer).resize(200, null, { fit: 'inside' }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
      sharp(buffer).resize(800, null, { fit: 'inside' }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }),
      sharp(buffer).resize(2000, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true }),
    ]);

    return {
      thumb:    { buffer: thumb.data,    width: thumb.info.width,    height: thumb.info.height },
      medium:   { buffer: medium.data,   width: medium.info.width,   height: medium.info.height },
      original: { buffer: original.data, width: original.info.width, height: original.info.height },
    };
  }
}
```

### `file-upload.service.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IStorageAdapter, STORAGE_ADAPTER } from '../storage/storage.interface';
import { ImageProcessingService, ProcessedImage } from './image-processing.service';

export interface UploadedImage {
  key: string;
  url: string;
  width: number;
  height: number;
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

  async uploadProductImages(
    buffer: Buffer,
    productId: string,
  ): Promise<Array<UploadedImage & { size: 'THUMB' | 'MEDIUM' | 'ORIGINAL' }>> {
    await this.imageProcessing.validate(buffer);
    const sizes = await this.imageProcessing.processForProduct(buffer);
    const uuid = randomUUID();

    const results = await Promise.all(
      (Object.entries(sizes) as Array<[string, ProcessedImage]>).map(async ([sizeLabel, img]) => {
        const key = `products/${productId}/${uuid}_${sizeLabel}.webp`;
        const url = await this.storage.upload(key, img.buffer, 'image/webp');
        return { key, url, width: img.width, height: img.height, size: sizeLabel.toUpperCase() as 'THUMB' | 'MEDIUM' | 'ORIGINAL' };
      }),
    );

    return results;
  }

  async deleteFile(key: string): Promise<void> {
    await this.storage.delete(key);
  }
}
```

### `file-upload.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';
import { FileUploadService } from './file-upload.service';

@Module({
  providers: [ImageProcessingService, FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
```

---

## Phase 5a — Category image endpoint

### `CategoryService` — thêm 2 method

```typescript
async uploadImage(id: string, buffer: Buffer): Promise<Category> {
  const category = await this.findOne(id);

  // Xoá ảnh cũ trên R2 trước khi upload ảnh mới
  if (category.image) {
    const oldKey = this.extractKeyFromUrl(category.image);
    if (oldKey) await this.fileUpload.deleteFile(oldKey);
  }

  const { url } = await this.fileUpload.uploadCategoryImage(buffer, id);
  return this.prisma.category.update({ where: { id }, data: { image: url } });
}

async deleteImage(id: string): Promise<void> {
  const category = await this.findOne(id);
  if (!category.image) return;

  const key = this.extractKeyFromUrl(category.image);
  if (key) await this.fileUpload.deleteFile(key);
  await this.prisma.category.update({ where: { id }, data: { image: null } });
}

private extractKeyFromUrl(url: string): string | null {
  // url dạng: https://pub-xxx.r2.dev/categories/uuid_medium.webp
  // key là phần sau domain
  try {
    return new URL(url).pathname.slice(1); // bỏ dấu /
  } catch {
    return null;
  }
}
```

### `CategoriesController` — thêm 2 endpoint

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';

@Post(':id/image')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.STAFF)
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  return this.categoryService.uploadImage(id, file.buffer);
}

@Delete(':id/image')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.STAFF)
@HttpCode(HttpStatus.NO_CONTENT)
deleteImage(@Param('id') id: string) {
  return this.categoryService.deleteImage(id);
}
```

---

## Phase 5b — Product images endpoint

### `ProductImageService` — tạo mới

```typescript
// src/modules/catalog/services/product-image.service.ts

async upload(productId: string, buffer: Buffer): Promise<ProductImage[]> {
  // AC-1: max 10 images
  const count = await this.prisma.productImage.count({ where: { productId } });
  if (count >= 10) throw new ConflictException({ code: 'IMAGE_LIMIT_EXCEEDED' });

  // AC-4: auto-assign position
  const nextPosition = count; // 0-indexed

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
          position: img.size === 'MEDIUM' ? nextPosition : -1, // chỉ MEDIUM có position hiển thị
        },
      }),
    ),
  );
}

async delete(productId: string, imageId: string): Promise<void> {
  // xoá 3 sizes cùng uuid
  // ...
}
```

### `ProductsController` — thêm 3 endpoint

```typescript
@Post(':id/images')
@Roles(Role.ADMIN, Role.STAFF)
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  return this.productImageService.upload(id, file.buffer);
}

@Delete(':id/images/:imageId')
@Roles(Role.ADMIN, Role.STAFF)
@HttpCode(HttpStatus.NO_CONTENT)
deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
  return this.productImageService.delete(id, imageId);
}

@Post(':id/images/reorder')
@Roles(Role.ADMIN, Role.STAFF)
reorderImages(@Param('id') id: string, @Body() dto: ReorderImagesDto) {
  return this.productImageService.reorder(id, dto);
}
```

---

## Phase 6 — Env validation + Module wiring

### `env.validation.ts` — thêm R2 vars

```typescript
R2_ACCOUNT_ID:       Joi.string().required(),
R2_ACCESS_KEY_ID:    Joi.string().required(),
R2_SECRET_ACCESS_KEY: Joi.string().required(),
R2_BUCKET_NAME:      Joi.string().required(),
R2_PUBLIC_URL:       Joi.string().uri().required(),
```

### `app.module.ts` — thêm `StorageModule`

```typescript
import { StorageModule } from '@common/storage/storage.module';
// thêm vào imports: [... StorageModule ...]
```

### `catalog.module.ts` — thêm `FileUploadModule`

```typescript
import { FileUploadModule } from '@common/file-upload/file-upload.module';
// thêm vào imports: [... FileUploadModule ...]
```

---

## Checklist thực hiện

### Phase 0 — R2 Dashboard
- [ ] Tạo Cloudflare account
- [ ] Tạo bucket `ecom-dev`
- [ ] Bật Public Access → copy Public URL
- [ ] Tạo API Token → copy Account ID + Access Key + Secret Key
- [ ] Điền `.env`

### Phase 1 — Setup
- [ ] `git checkout -b ThanhLuongCong/feat/phase-d/file-upload`
- [ ] `npm install @aws-sdk/client-s3 sharp file-type`
- [ ] `npm install -D @types/multer`

### Phase 2 — Prisma
- [ ] Thêm `ImageSize` enum + `ProductImage` model vào `schema.prisma`
- [ ] Thêm `images ProductImage[]` vào model `Product`
- [ ] `npx prisma migrate dev --name add-product-images`
- [ ] `npx prisma generate`

### Phase 3 — Storage layer
- [ ] Tạo `src/common/storage/storage.interface.ts`
- [ ] Tạo `src/common/storage/r2.adapter.ts`
- [ ] Tạo `src/common/storage/storage.module.ts`
- [ ] Thêm `StorageModule` vào `app.module.ts`

### Phase 4 — Image processing
- [ ] Tạo `src/common/file-upload/image-processing.service.ts`
- [ ] Tạo `src/common/file-upload/file-upload.service.ts`
- [ ] Tạo `src/common/file-upload/file-upload.module.ts`

### Phase 5a — Category image
- [ ] Thêm `uploadImage()` + `deleteImage()` vào `CategoryService`
- [ ] Inject `FileUploadService` vào `CategoryService`
- [ ] Thêm `POST /categories/:id/image` + `DELETE /categories/:id/image` vào controller

### Phase 5b — Product images
- [ ] Tạo `src/modules/catalog/services/product-image.service.ts`
- [ ] Thêm `POST /products/:id/images` + `DELETE` + `reorder` vào controller

### Phase 6 — Wiring
- [ ] Thêm R2 vars vào `env.validation.ts`
- [ ] Thêm `FileUploadModule` vào `CatalogModule`

### Verify
- [ ] Upload ảnh category qua Swagger → xuất hiện trên R2 dashboard
- [ ] Upload ảnh product → 3 file (thumb/medium/original) trên R2
- [ ] Upload file `.exe` → trả 415
- [ ] Upload file > 5MB → trả 413
- [ ] `category.image` trong DB chứa URL public của R2

---

## Lưu ý quan trọng

**Không lưu full URL vào DB — lưu key**
Nếu đổi R2 bucket hoặc migrate sang S3, chỉ cần đổi env `R2_PUBLIC_URL`, không phải update hàng nghìn row trong DB.

**Multer memory storage (mặc định)**
`FileInterceptor` mặc định giữ file trong RAM (không ghi ra disk tạm). Phù hợp vì ta cần buffer để xử lý với `sharp`. Không cần config thêm.

**`file-type` dynamic import**
```typescript
// ✅ Đúng (ESM-only package)
const { fileTypeFromBuffer } = await import('file-type');

// ❌ Sai
import { fileTypeFromBuffer } from 'file-type';
```
