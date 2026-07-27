import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class WhatsappRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: { instanceName: string; displayName?: string; agentId?: string }) {
    return this.prisma.whatsappNumber.create({
      data: { ...data, tenantId, status: 'DISCONNECTED' },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.whatsappNumber.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findByInstanceName(instanceName: string) {
    return this.prisma.whatsappNumber.findFirst({
      where: { instanceName, deletedAt: null },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.whatsappNumber.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.whatsappNumber.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.whatsappNumber.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async countByTenant(tenantId: string) {
    return this.prisma.whatsappNumber.count({ where: { tenantId, deletedAt: null } });
  }

  async updateStatus(
    id: string,
    status: 'CONNECTED' | 'DISCONNECTED' | 'QR_CODE' | 'INITIALIZING' | 'ERROR',
    extra?: Record<string, unknown>,
  ) {
    return this.prisma.whatsappNumber.update({
      where: { id },
      data: { status, ...extra, updatedAt: new Date() },
    });
  }

  async updateStatusByInstanceName(
    instanceName: string,
    status: 'CONNECTED' | 'DISCONNECTED' | 'QR_CODE' | 'INITIALIZING' | 'ERROR',
    extra?: Record<string, unknown>,
  ) {
    const record = await this.prisma.whatsappNumber.findFirst({
      where: { instanceName, deletedAt: null },
      select: { id: true },
    });
    if (!record) return null;

    return this.prisma.whatsappNumber.update({
      where: { id: record.id },
      data: { status, ...extra, updatedAt: new Date() },
    });
  }

  /**
   * Persiste dados de sessão (qualquer JSON relevante para a reconexão).
   * O campo sessionData é um JsonB que o WhatsappService gerencia livremente.
   */
  async saveSession(instanceName: string, sessionData: Record<string, unknown>) {
    return this.prisma.whatsappNumber.updateMany({
      where: { instanceName, deletedAt: null },
      data: { sessionData, updatedAt: new Date() },
    });
  }

  async update(id: string, data: object) {
    return this.prisma.whatsappNumber.update({
      where: { id },
      data: { ...(data as Record<string, unknown>), updatedAt: new Date() },
    });
  }

  async softDelete(id: string) {
    return this.prisma.whatsappNumber.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DISCONNECTED' },
    });
  }

  // ─── Consultas auxiliares ──────────────────────────────────────────────────────

  async findConnectedByTenant(tenantId: string) {
    return this.prisma.whatsappNumber.findMany({
      where: { tenantId, status: 'CONNECTED', deletedAt: null },
    });
  }

  async findDisconnectedByTenant(tenantId: string) {
    return this.prisma.whatsappNumber.findMany({
      where: { tenantId, status: 'DISCONNECTED', deletedAt: null },
    });
  }
}
