import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { HttpStatus, Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/(.*)'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors) =>
        new UnprocessableEntityException({
          code: 'VALIDATION_FAILED',
          message: validationErrors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value',
          })),
        }),
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder().setTitle('E-Commerce API').setDescription('NestJS e-commerce backend API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
