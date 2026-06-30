import { RedisModule } from '@common/redis/redis.module';
import { StorageModule } from '@common/storage/storage.module';
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  imports: [RedisModule, StorageModule],
  controllers: [HealthController],
})
export class HealthModule {}
