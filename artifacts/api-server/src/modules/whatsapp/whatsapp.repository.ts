import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class WhatsappRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: { instanceName: string; displayName?: string; agentId?: string }) {
    return this.prisma.whatsappNumber.create({ data: { ...data, tenantId, status: 'DISCONNECTED' } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.whatsappNumber.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async findByInstanceName(instanceName: string) {
    return this.prisma.whatsappNumber.findFirst({ where: { instanceName, deletedAt: null } });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.whatsappNumber.findMany({ where: { tenantId, deletedAt: null }, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.whatsappNumber.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async countByTenant(tenantId: string) {
    return this.prisma.whatsappNumber.count({ where: { tenantId, deletedAt: null } });
  }

  async updateStatus(id: string, status: string, extra?: Record<string, unknown>) {
    return this.prisma.whatsappNumber.update({ where: { id }, data: { status: status as 'CONNECTED' | 'DISCONNECTED' | 'QR_CODE' | 'INITIALIZING' | 'ERROR', ...extra, updatedAt: new Date() } });
  }

  async update(id: string, data: object) {
    return this.prisma.whatsappNumber.update({ where: { id }, data: { ...(data as Record<string, unknown>), updatedAt: new Date() } });
  }

  async softDelete(id: string) {
    return this.prisma.whatsappNumber.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISCONNECTED' } });
  }
}
