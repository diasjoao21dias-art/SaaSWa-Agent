import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import openaiConfig from './config/openai.config';
import evolutionConfig from './config/evolution.config';
import { configValidationSchema } from './config/config.validation';

import { PrismaModule } from './database/prisma.module';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';

import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PinoLogger } from './common/logger/pino.logger';

import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AiModule } from './modules/ai/ai.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    // ─── Configuration ────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        openaiConfig,
        evolutionConfig,
      ],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // ─── Rate Limiting ─────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 300 },
    ]),

    // ─── Infrastructure ────────────────────────────────────────────────────────
    PrismaModule,
    CacheModule,
    QueueModule,

    // ─── Feature Modules ───────────────────────────────────────────────────────
    AuthModule,
    TenantsModule,
    UsersModule,
    CustomersModule,
    WhatsappModule,
    AgentsModule,
    PromptsModule,
    KnowledgeModule,
    ConversationsModule,
    MessagesModule,
    WebhooksModule,
    AiModule,
    PlansModule,
    SubscriptionsModule,
  ],
  providers: [
    PinoLogger,
    // Global rate-limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PinoLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
