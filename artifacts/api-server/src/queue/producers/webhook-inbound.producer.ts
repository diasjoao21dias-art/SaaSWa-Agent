import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_WEBHOOK_INBOUND,
  JOB_PROCESS_INCOMING_MESSAGE,
} from '../queue.constants';

export interface WebhookInboundJobData {
  instanceName: string;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

@Injectable()
export class WebhookInboundProducer {
  constructor(
    @InjectQueue(QUEUE_WEBHOOK_INBOUND) private readonly queue: Queue,
  ) {}

  async enqueue(data: WebhookInboundJobData): Promise<void> {
    await this.queue.add(JOB_PROCESS_INCOMING_MESSAGE, data, {
      priority: 1,
    });
  }
}
