import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class PromptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: object) {
    return this.prisma.prompt.create({ data: { ...(data as Record<string, unknown>), tenantId } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.prompt.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { versions: { orderBy: { version: 'desc' }, take: 5 } },
    });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.prompt.findMany({ where: { tenantId, deletedAt: null }, skip, take, orderBy: { updatedAt: 'desc' } }),
      this.prisma.prompt.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async update(id: string, data: object, currentContent: string, createdById?: string, changeNote?: string) {
    const prompt = await this.prisma.prompt.update({
      where: { id },
      data: { ...(data as Record<string, unknown>), version: { increment: 1 }, updatedAt: new Date() },
    });
    // Save version history
    await this.prisma.promptVersion.create({
      data: {
        promptId: id,
        version: prompt.version,
        content: currentContent,
        changeNote,
        createdById,
      },
    });
    return prompt;
  }

  async softDelete(id: string) {
    return this.prisma.prompt.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}
