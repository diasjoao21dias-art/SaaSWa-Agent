import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { TokenExpiryInterceptor } from './common/interceptors/token-expiry.interceptor';

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
import { MemoryModule } from './memory/memory.module';

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
import { DashboardCompatModule } from './modules/dashboard-compat/dashboard-compat.module';

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
    MemoryModule,

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
    DashboardCompatModule,
  ],
  providers: [
    PinoLogger,

    // ─── Global guards (order matters: each runs in sequence) ──────────────────
    // 1. Rate limiting — always first
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 2. JWT authentication — populates request.user; @Public() routes bypass this
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 3. Tenant isolation — validates tenantId; @SkipTenantGuard() or @Public() bypass
    { provide: APP_GUARD, useClass: TenantGuard },
    // 4. Role-based access — enforces @Roles(); OWNER bypasses; no decorator = open to any role
    { provide: APP_GUARD, useClass: RolesGuard },
    // ─── Global interceptors ───────────────────────────────────────────────────
    // Adds X-Token-Expiring / X-Token-Expires-In headers when token nears expiry
    { provide: APP_INTERCEPTOR, useClass: TokenExpiryInterceptor },
  ],
  exports: [PinoLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
