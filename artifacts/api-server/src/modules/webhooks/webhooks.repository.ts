import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: object) {
    return this.prisma.webhook.create({ data: { ...(data as Record<string, unknown>), tenantId } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.webhook.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.webhook.findMany({ where: { tenantId, deletedAt: null }, skip, take }),
      this.prisma.webhook.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async update(id: string, data: object) {
    return this.prisma.webhook.update({ where: { id }, data: { ...(data as Record<string, unknown>), updatedAt: new Date() } });
  }

  async softDelete(id: string) {
    return this.prisma.webhook.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
  }

  async findActiveByEvent(tenantId: string, event: string) {
    return this.prisma.webhook.findMany({
      where: { tenantId, status: 'ACTIVE', deletedAt: null, events: { has: event } },
    });
  }

  async createDelivery(webhookId: string, event: string, payload: object) {
    return this.prisma.webhookDelivery.create({
      data: { webhookId, event, payload, status: 'PENDING' },
    });
  }

  async updateDelivery(id: string, data: object) {
    return this.prisma.webhookDelivery.update({ where: { id }, data: { ...(data as Record<string, unknown>), updatedAt: new Date() } });
  }
}
