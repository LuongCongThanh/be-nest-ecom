import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageAdapter } from './storage.interface';

@Injectable()
export class R2Adapter implements IStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow('STORAGE_BUCKET');
    this.publicUrl = config.getOrThrow('STORAGE_PUBLIC_URL');

    const endpoint = config.getOrThrow<string>('STORAGE_ENDPOINT');
    const forcePathStyle = config.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true';

    this.client = new S3Client({
      region: config.get<string>('STORAGE_REGION') ?? 'auto',
      endpoint,
      credentials: {
        accessKeyId: config.getOrThrow('STORAGE_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow('STORAGE_SECRET_ACCESS_KEY'),
      },
      forcePathStyle,
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
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
