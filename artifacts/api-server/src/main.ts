import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PinoLogger } from './common/logger/pino.logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(PinoLogger);

  app.useLogger(logger);

  // ─── Security ────────────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: process.env['NODE_ENV'] === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────────────────
  const allowedOrigins = configService.get<string>('app.allowedOrigins', '*');
  app.enableCors({
    origin: allowedOrigins === '*' ? true : allowedOrigins.split(','),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Tenant-ID',
    ],
    credentials: true,
    maxAge: 86400,
  });

  // ─── Global prefix ────────────────────────────────────────────────────────────
  const globalPrefix = configService.get<string>('app.globalPrefix', 'api');
  app.setGlobalPrefix(globalPrefix);

  // ─── API Versioning ───────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ─── Global Pipes ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ─── Global Filters ───────────────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // ─── Global Interceptors ──────────────────────────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TimeoutInterceptor(),
    new TransformInterceptor(),
  );

  // ─── Swagger ──────────────────────────────────────────────────────────────────
  if (configService.get<string>('app.env') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WhatsApp AI SaaS API')
      .setDescription(
        'Multi-tenant WhatsApp AI Agent SaaS — API Reference Documentation',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'api-key')
      .addTag('Auth', 'Authentication and token management')
      .addTag('Tenants', 'Tenant (company) management')
      .addTag('Users', 'User management within a tenant')
      .addTag('Customers', 'WhatsApp end-user contacts')
      .addTag('WhatsApp', 'WhatsApp number connections via Evolution API')
      .addTag('Agents', 'AI Agent configuration')
      .addTag('Prompts', 'System prompt library with versioning')
      .addTag('Knowledge', 'Knowledge base and document management')
      .addTag('Conversations', 'WhatsApp conversation threads')
      .addTag('Messages', 'Individual messages within conversations')
      .addTag('Webhooks', 'Outbound webhook configuration')
      .addTag('AI', 'OpenAI integration endpoints')
      .addTag('Plans', 'Subscription plan management')
      .addTag('Subscriptions', 'Tenant subscription management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // ─── Graceful Shutdown ────────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ─── Start ────────────────────────────────────────────────────────────────────
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 Application running on: http://localhost:${port}/${globalPrefix}`,
    'Bootstrap',
  );
  logger.log(
    `📚 Swagger docs: http://localhost:${port}/${globalPrefix}/docs`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
