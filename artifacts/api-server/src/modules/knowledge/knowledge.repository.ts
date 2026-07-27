import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Knowledge Bases ───────────────────────────────────────────────────────

  async createBase(tenantId: string, data: object) {
    return this.prisma.knowledgeBase.create({ data: { ...(data as Record<string, unknown>), tenantId } });
  }

  async findBaseById(id: string, tenantId: string) {
    return this.prisma.knowledgeBase.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { documents: { where: { deletedAt: null } } } } },
    });
  }

  async findAllBases(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.knowledgeBase.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take,
        include: { _count: { select: { documents: { where: { deletedAt: null } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeBase.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async updateBase(id: string, data: object) {
    return this.prisma.knowledgeBase.update({
      where: { id },
      data: { ...(data as Record<string, unknown>), updatedAt: new Date() },
    });
  }

  async softDeleteBase(id: string) {
    return this.prisma.knowledgeBase.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ─── Documents ─────────────────────────────────────────────────────────────

  async createDocument(knowledgeBaseId: string, data: object) {
    return this.prisma.knowledgeDocument.create({
      data: { ...(data as Record<string, unknown>), knowledgeBaseId },
    });
  }

  async findDocumentById(id: string, knowledgeBaseId: string) {
    return this.prisma.knowledgeDocument.findFirst({
      where: { id, knowledgeBaseId, deletedAt: null },
    });
  }

  async findDocuments(knowledgeBaseId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.knowledgeDocument.findMany({
        where: { knowledgeBaseId, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          chunkIndex: true,
          tokenCount: true,
          status: true,
          errorMessage: true,
          sourceUrl: true,
          processedAt: true,
          createdAt: true,
          // Omite content e embedding para não sobrecarregar a listagem
        },
      }),
      this.prisma.knowledgeDocument.count({ where: { knowledgeBaseId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async softDeleteDocument(id: string) {
    return this.prisma.knowledgeDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Deleta todos os chunks de um documento-pai (quando o pai é deletado) */
  async softDeleteDocumentsByFileId(fileId: string) {
    return this.prisma.knowledgeDocument.updateMany({
      where: { fileId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
