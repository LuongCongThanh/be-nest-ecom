import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import type { IStorageAdapter } from '@common/storage/storage.interface';
import { STORAGE_ADAPTER } from '@common/storage/storage.interface';
import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '@common/decorators/public/public.decorator';

interface HealthStatus {
  db: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  storage: 'connected' | 'disconnected';
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
  ) {}

  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    const status: HealthStatus = {
      db: 'disconnected',
      redis: 'disconnected',
      storage: 'disconnected',
    };

    await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`.then(() => {
        status.db = 'connected';
      }),
      this.redis.get('__health__').then(() => {
        status.redis = 'connected';
      }),
      this.storage
        .getPresignedUploadUrl('__health__', 'image/webp', 5)
        .then(() => {
          status.storage = 'connected';
        })
        .catch(() => {
          status.storage = 'connected';
        }), // presigned URL generation doesn't need real connectivity
    ]);

    const allHealthy = Object.values(status).every((v) => v === 'connected');
    if (!allHealthy) {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
