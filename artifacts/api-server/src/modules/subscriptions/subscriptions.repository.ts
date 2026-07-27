import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: object) {
    return this.prisma.subscription.create({
      data: { ...(data as Record<string, unknown>), tenantId },
      include: { plan: true },
    });
  }

  async findActivByTenant(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIAL'] }, deletedAt: null },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId, deletedAt: null },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: object) {
    return this.prisma.subscription.update({
      where: { id },
      data: { ...(data as Record<string, unknown>), updatedAt: new Date() },
      include: { plan: true },
    });
  }

  async cancel(id: string, reason?: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELED', canceledAt: new Date(), cancelReason: reason, cancelAtPeriodEnd: true, updatedAt: new Date() },
    });
  }
}
