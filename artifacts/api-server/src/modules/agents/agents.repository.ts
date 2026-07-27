import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: object) {
    return this.prisma.aiAgent.create({ data: { ...(data as Record<string, unknown>), tenantId } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.aiAgent.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { prompt: true, knowledgeBase: { select: { id: true, name: true, type: true } } },
    });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.aiAgent.findMany({ where: { tenantId, deletedAt: null }, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.aiAgent.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async countByTenant(tenantId: string) {
    return this.prisma.aiAgent.count({ where: { tenantId, deletedAt: null } });
  }

  async update(id: string, data: object) {
    return this.prisma.aiAgent.update({ where: { id }, data: { ...(data as Record<string, unknown>), updatedAt: new Date() } });
  }

  async softDelete(id: string) {
    return this.prisma.aiAgent.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
  }
}
