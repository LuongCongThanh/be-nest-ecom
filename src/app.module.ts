import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // loads .env and exposes ConfigService app-wide
import { envValidationSchema } from '@config/env.validation';
import { HealthModule } from '@health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,         // no need to re-import ConfigModule in child modules
      validationSchema: envValidationSchema, // validate .env on startup; missing required vars crash the process
      validationOptions: {
        abortEarly: true,     // stop at first invalid var instead of collecting all errors
      },
    }),
    HealthModule,
  ],
})
export class AppModule {}