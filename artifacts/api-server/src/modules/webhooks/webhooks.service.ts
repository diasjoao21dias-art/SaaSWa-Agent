import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebhooksRepository } from './webhooks.repository';
import { WebhookInboundProducer } from '../../queue/producers/webhook-inbound.producer';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { CreateWebhookDto } from './dto/create-webhook.dto';
import type { EvolutionWebhookDto } from './dto/evolution-webhook.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly repo: WebhooksRepository,
    private readonly inboundProducer: WebhookInboundProducer,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('evolution.webhookSecret', '');
  }

  // ─── Outbound webhooks (tenant-configured) ────────────────────────────────────
  async create(tenantId: string, dto: CreateWebhookDto) {
    return this.repo.create(tenantId, { ...dto, status: 'ACTIVE' });
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async findById(id: string, tenantId: string) {
    const wh = await this.repo.findById(id, tenantId);
    if (!wh) throw new NotFoundException('Webhook', id);
    return wh;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.softDelete(id);
  }

  /**
   * Dispatch an event to all active tenant webhooks subscribed to this event.
   * Called internally whenever a significant event occurs.
   */
  async dispatch(tenantId: string, event: string, payload: object): Promise<void> {
    const hooks = await this.repo.findActiveByEvent(tenantId, event);
    for (const hook of hooks) {
      const delivery = await this.repo.createDelivery(hook.id, event, payload);
      // Fire-and-forget with retry handled via BullMQ in a real implementation
      this.deliverWebhook(hook.id, hook.url, hook.secret, payload, delivery.id).catch((err) => {
        this.logger.error(`Webhook delivery failed for ${hook.url}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }

  private async deliverWebhook(
    webhookId: string, url: string, secret: string | null,
    payload: object, deliveryId: string,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = secret
      ? createHmac('sha256', secret).update(body).digest('hex')
      : undefined;

    try {
      const res = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(signature ? { 'x-webhook-signature': `sha256=${signature}` } : {}),
        },
        timeout: 10000,
      });

      await this.repo.updateDelivery(deliveryId, {
        status: 'SUCCESS',
        httpStatus: res.status,
        deliveredAt: new Date(),
        attemptCount: 1,
      });
      await this.repo.update(webhookId, { lastTriggeredAt: new Date() });
    } catch (err) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status ?? 0;
      await this.repo.updateDelivery(deliveryId, {
        status: 'FAILED',
        httpStatus,
        errorMessage: err instanceof Error ? err.message : String(err),
        attemptCount: 1,
      });
      await this.repo.update(webhookId, { lastError: err instanceof Error ? err.message : String(err) });
    }
  }

  // ─── Inbound Evolution API webhook ────────────────────────────────────────────
  verifyEvolutionSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return true; // Skip if no secret configured
    const expected = createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
    return signature === `sha256=${expected}` || signature === expected;
  }

  async processEvolutionWebhook(dto: EvolutionWebhookDto): Promise<void> {
    this.logger.debug(`Received Evolution webhook: ${dto.event} for instance: ${dto.instance}`);
    await this.inboundProducer.enqueue({
      instanceName: dto.instance,
      event: dto.event,
      payload: { data: dto.data, sender: dto.sender },
      receivedAt: new Date().toISOString(),
    });
  }
}
