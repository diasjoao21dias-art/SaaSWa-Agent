import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  QUEUE_AI_RESPONSE,
  QUEUE_WHATSAPP_OUTBOUND,
  QUEUE_WEBHOOK_INBOUND,
} from './queue.constants';
import { AiResponseProducer } from './producers/ai-response.producer';
import { WhatsappOutboundProducer } from './producers/whatsapp-outbound.producer';
import { WebhookInboundProducer } from './producers/webhook-inbound.producer';
import { AiResponseConsumer } from './consumers/ai-response.consumer';
import { WhatsappOutboundConsumer } from './consumers/whatsapp-outbound.consumer';
import { WebhookInboundConsumer } from './consumers/webhook-inbound.consumer';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string | undefined>('redis.password'),
          db: configService.get<number>('redis.db', 0),
          tls: configService.get<boolean>('redis.tls') ? {} : undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_AI_RESPONSE },
      { name: QUEUE_WHATSAPP_OUTBOUND },
      { name: QUEUE_WEBHOOK_INBOUND },
    ),
  ],
  providers: [
    AiResponseProducer,
    WhatsappOutboundProducer,
    WebhookInboundProducer,
    AiResponseConsumer,
    WhatsappOutboundConsumer,
    WebhookInboundConsumer,
  ],
  exports: [
    AiResponseProducer,
    WhatsappOutboundProducer,
    WebhookInboundProducer,
    BullModule,
  ],
})
export class QueueModule {}
