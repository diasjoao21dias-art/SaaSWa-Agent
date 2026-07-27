import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_AI_RESPONSE,
  JOB_SEND_AI_RESPONSE,
} from '../queue.constants';

export interface AiResponseJobData {
  tenantId: string;
  conversationId: string;
  messageId: string;
  agentId: string;
  customerPhone: string;
  whatsappNumberInstanceName: string;
}

@Injectable()
export class AiResponseProducer {
  constructor(
    @InjectQueue(QUEUE_AI_RESPONSE) private readonly queue: Queue,
  ) {}

  async enqueue(data: AiResponseJobData): Promise<void> {
    await this.queue.add(JOB_SEND_AI_RESPONSE, data, {
      priority: 1,
      delay: 0,
    });
  }
}
