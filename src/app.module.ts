import { JwtAuthGuard } from '@common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';
import { appConfig, databaseConfig, jwtConfig } from '@config/app.config';
import { envValidationSchema } from '@config/env.validation';
import { HealthModule } from '@health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { JwtStrategy } from '@modules/identity/strategies/jwt.strategy';
import { StorageModule } from '@common/storage/storage.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { IdentityModule } from '@modules/identity/identity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') ?? '30m' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    HealthModule,
    PassportModule,
    StorageModule,
    IdentityModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
