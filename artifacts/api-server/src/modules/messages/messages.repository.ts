import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConversation(conversationId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        skip, take,
        orderBy: { createdAt: 'asc' },
        include: { file: { select: { id: true, publicUrl: true, mimeType: true, originalName: true } } },
      }),
      this.prisma.message.count({ where: { conversationId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async create(conversationId: string, data: object) {
    return this.prisma.message.create({ data: { ...(data as Record<string, unknown>), conversationId } });
  }

  async findById(id: string) {
    return this.prisma.message.findFirst({ where: { id, deletedAt: null } });
  }
}
