import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import {
  QUEUE_WHATSAPP_OUTBOUND,
  JOB_SEND_WHATSAPP_MESSAGE,
} from '../queue.constants';
import type { WhatsappOutboundJobData } from '../producers/whatsapp-outbound.producer';

@Processor(QUEUE_WHATSAPP_OUTBOUND, { concurrency: 20 })
export class WhatsappOutboundConsumer extends WorkerHost {
  private readonly logger = new Logger(WhatsappOutboundConsumer.name);
  private readonly evolutionBaseUrl: string;
  private readonly evolutionApiKey: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.evolutionBaseUrl = this.configService.get<string>('evolution.baseUrl', '');
    this.evolutionApiKey = this.configService.get<string>('evolution.apiKey', '');
  }

  async process(job: Job<WhatsappOutboundJobData>): Promise<void> {
    if (job.name !== JOB_SEND_WHATSAPP_MESSAGE) return;

    const { instanceName, recipientPhone, content, messageId } = job.data;

    try {
      await axios.post(
        `${this.evolutionBaseUrl}/message/sendText/${instanceName}`,
        {
          number: recipientPhone,
          textMessage: { text: content },
          options: { delay: 1000, presence: 'composing' },
        },
        {
          headers: {
            apikey: this.evolutionApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      // Mark message as delivered
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });

      this.logger.debug(`Message sent to ${recipientPhone} via ${instanceName}`);
    } catch (error) {
      // Update message status to failed before retrying
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error; // Let BullMQ handle the retry
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Outbound job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }
}
