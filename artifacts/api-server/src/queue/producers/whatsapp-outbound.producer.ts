import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_WHATSAPP_OUTBOUND,
  JOB_SEND_WHATSAPP_MESSAGE,
} from '../queue.constants';

export interface WhatsappOutboundJobData {
  tenantId: string;
  conversationId: string;
  messageId: string;
  instanceName: string;
  recipientPhone: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
}

@Injectable()
export class WhatsappOutboundProducer {
  constructor(
    @InjectQueue(QUEUE_WHATSAPP_OUTBOUND) private readonly queue: Queue,
  ) {}

  async enqueue(data: WhatsappOutboundJobData): Promise<void> {
    await this.queue.add(JOB_SEND_WHATSAPP_MESSAGE, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
    });
  }
}
