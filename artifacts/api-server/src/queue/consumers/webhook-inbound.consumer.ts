import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiResponseProducer } from '../producers/ai-response.producer';
import {
  QUEUE_WEBHOOK_INBOUND,
  JOB_PROCESS_INCOMING_MESSAGE,
} from '../queue.constants';
import type { WebhookInboundJobData } from '../producers/webhook-inbound.producer';

@Processor(QUEUE_WEBHOOK_INBOUND, {
  concurrency: 10,
})
export class WebhookInboundConsumer extends WorkerHost {
  private readonly logger = new Logger(WebhookInboundConsumer.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiResponseProducer) private readonly aiProducer: AiResponseProducer,
  ) {
    super();
  }

  async process(job: Job<WebhookInboundJobData>): Promise<void> {
    if (job.name !== JOB_PROCESS_INCOMING_MESSAGE) return;

    const { instanceName, event, payload } = job.data;
    this.logger.debug(`Processing webhook event "${event}" for instance "${instanceName}"`);

    if (event !== 'messages.upsert' && event !== 'message') return;

    // Extract message details from Evolution API payload
    const messageData = (payload as Record<string, unknown>)['data'] as Record<string, unknown> | undefined;
    if (!messageData) return;

    const key = messageData['key'] as Record<string, unknown> | undefined;
    const fromMe = key?.['fromMe'] as boolean | undefined;

    // Skip messages sent by us
    if (fromMe) return;

    const remoteJid = key?.['remoteJid'] as string | undefined;
    if (!remoteJid) return;

    // Extract phone number (remove @s.whatsapp.net suffix)
    const customerPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

    // Find the WhatsApp number record and its tenant
    const waNumber = await this.prisma.whatsappNumber.findUnique({
      where: { instanceName, deletedAt: null },
      select: { id: true, tenantId: true, agentId: true },
    });

    if (!waNumber || !waNumber.agentId) {
      this.logger.warn(`No active agent for instance "${instanceName}". Skipping.`);
      return;
    }

    // Get or create customer
    let customer = await this.prisma.customer.findFirst({
      where: { tenantId: waNumber.tenantId, phone: customerPhone, deletedAt: null },
    });

    if (!customer) {
      const pushName = (messageData['pushName'] as string | undefined) ?? customerPhone;
      customer = await this.prisma.customer.create({
        data: { tenantId: waNumber.tenantId, phone: customerPhone, name: pushName },
      });
    }

    // Get or create active conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: waNumber.tenantId,
        customerId: customer.id,
        whatsappNumberId: waNumber.id,
        status: { in: ['BOT', 'WAITING'] },
        deletedAt: null,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: waNumber.tenantId,
          customerId: customer.id,
          whatsappNumberId: waNumber.id,
          agentId: waNumber.agentId,
          status: 'BOT',
          firstMessageAt: new Date(),
          lastMessageAt: new Date(),
        },
      });
    }

    // Extract message content
    const messageContent = this.extractMessageContent(messageData);
    const waMessageId = key?.['id'] as string | undefined;

    // Save the incoming message
    const savedMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        type: 'TEXT',
        content: messageContent,
        whatsappMessageId: waMessageId,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    // Update conversation lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Enqueue AI response if conversation is in BOT mode
    if (conversation.status === 'BOT') {
      await this.aiProducer.enqueue({
        tenantId: waNumber.tenantId,
        conversationId: conversation.id,
        messageId: savedMessage.id,
        agentId: waNumber.agentId,
        customerPhone,
        whatsappNumberInstanceName: instanceName,
      });
    }
  }

  private extractMessageContent(messageData: Record<string, unknown>): string {
    const message = messageData['message'] as Record<string, unknown> | undefined;
    if (!message) return '';

    // text message
    const conversation = message['conversation'] as string | undefined;
    if (conversation) return conversation;

    // extended text
    const extendedText = message['extendedTextMessage'] as Record<string, unknown> | undefined;
    if (extendedText?.['text']) return String(extendedText['text']);

    // image with caption
    const imageMessage = message['imageMessage'] as Record<string, unknown> | undefined;
    if (imageMessage?.['caption']) return String(imageMessage['caption']);

    return '[Unsupported message type]';
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
