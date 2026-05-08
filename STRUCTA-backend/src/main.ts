import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const allowed = (process.env.ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: allowed.includes('*') ? true : allowed,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  logger.log(`STRUCTA API listening on http://localhost:${port}`);
}

void bootstrap();
