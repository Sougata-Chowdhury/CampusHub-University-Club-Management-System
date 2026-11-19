import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const allowedOrigins = [
    ...configuredOrigins,
    process.env.FRONTEND_URL ? normalizeOrigin(process.env.FRONTEND_URL) : undefined,
    'https://university-club-management-system.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);
  const isAllowedVercelPreview = (origin: string) =>
    /^https:\/\/university-club-management-system-[a-z0-9-]+\.vercel\.app$/i.test(origin);

  app.enableCors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : '';
      if (!origin || allowedOrigins.includes(normalizedOrigin) || isAllowedVercelPreview(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.enableShutdownHooks();

  const port = Number(process.env.PORT || process.env.BACKEND_PORT || 8000);
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start the API', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
