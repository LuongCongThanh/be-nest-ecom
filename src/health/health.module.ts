import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
