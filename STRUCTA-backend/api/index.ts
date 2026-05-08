import 'reflect-metadata';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

let cachedServer: Express | null = null;

async function bootstrapServer(): Promise<Express> {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });

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

  // Also always allow the APP_URL so the deployed frontend is never blocked
  const appUrl = process.env.APP_URL;
  if (appUrl && !allowed.includes(appUrl) && !allowed.includes('*')) {
    allowed.push(appUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // No origin (server-to-server, curl) → allow
      if (!origin) return callback(null, true);
      // Wildcard configured → allow all
      if (allowed.includes('*')) return callback(null, true);
      // Exact match
      if (allowed.includes(origin)) return callback(null, true);
      // Any Vercel preview URL for this project
      if (/^https:\/\/structa-frontend(-[a-z0-9]+)*(-eduardo-manczenkos-projects)?\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  });

  await app.init();

  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  return server(req, res);
}
