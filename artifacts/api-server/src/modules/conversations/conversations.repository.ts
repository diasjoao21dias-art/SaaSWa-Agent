import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, phone: true, name: true } },
        agent: { select: { id: true, name: true, model: true } },
        humanOperator: { select: { id: true, name: true, email: true } },
        whatsappNumber: { select: { id: true, instanceName: true, displayName: true, phoneNumber: true } },
        _count: { select: { messages: { where: { deletedAt: null } } } },
      },
    });
  }

  async findAll(tenantId: string, page: number, limit: number, filters?: {
    status?: string; agentId?: string; humanOperatorId?: string; search?: string;
  }) {
    const { skip, take } = getPaginationParams(page, limit);
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (filters?.status) where['status'] = filters.status;
    if (filters?.agentId) where['agentId'] = filters.agentId;
    if (filters?.humanOperatorId) where['humanOperatorId'] = filters.humanOperatorId;
    if (filters?.search) {
      where['customer'] = { OR: [{ name: { contains: filters.search, mode: 'insensitive' } }, { phone: { contains: filters.search } }] };
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: where as Parameters<typeof this.prisma.conversation.findMany>[0]['where'],
        skip, take,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: { select: { id: true, phone: true, name: true } },
          agent: { select: { id: true, name: true } },
          humanOperator: { select: { id: true, name: true } },
          _count: { select: { messages: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.conversation.count({ where: where as Parameters<typeof this.prisma.conversation.count>[0]['where'] }),
    ]);
    return { data, total };
  }

  async update(id: string, data: object) {
    return this.prisma.conversation.update({
      where: { id },
      data: { ...(data as Record<string, unknown>), updatedAt: new Date() },
    });
  }

  async close(id: string, resolutionNotes?: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), resolutionNotes, updatedAt: new Date() },
    });
  }

  async assignToHuman(id: string, userId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'HUMAN', humanOperatorId: userId, humanAssignedAt: new Date(), updatedAt: new Date() },
    });
  }

  async returnToBot(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'BOT', humanOperatorId: null, humanAssignedAt: null, updatedAt: new Date() },
    });
  }
}
