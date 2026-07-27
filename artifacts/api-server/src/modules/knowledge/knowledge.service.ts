import { Injectable } from '@nestjs/common';
import { KnowledgeRepository } from './knowledge.repository';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import type { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class KnowledgeService {
  constructor(private readonly repo: KnowledgeRepository) {}

  async createBase(tenantId: string, dto: CreateKnowledgeBaseDto) {
    return this.repo.createBase(tenantId, { ...dto, isActive: true });
  }

  async findBaseById(id: string, tenantId: string) {
    const base = await this.repo.findBaseById(id, tenantId);
    if (!base) throw new NotFoundException('KnowledgeBase', id);
    return base;
  }

  async findAllBases(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAllBases(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async removeBase(id: string, tenantId: string) {
    await this.findBaseById(id, tenantId);
    await this.repo.softDeleteBase(id);
  }

  async addDocument(baseId: string, tenantId: string, dto: CreateKnowledgeDocumentDto) {
    await this.findBaseById(baseId, tenantId); // ensure base belongs to tenant
    return this.repo.createDocument(baseId, { ...dto, status: 'PENDING' });
  }

  async findDocuments(baseId: string, tenantId: string, pagination: PaginationDto) {
    await this.findBaseById(baseId, tenantId);
    const { data, total } = await this.repo.findDocuments(baseId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async removeDocument(baseId: string, docId: string, tenantId: string) {
    await this.findBaseById(baseId, tenantId);
    const doc = await this.repo.findDocumentById(docId, baseId);
    if (!doc) throw new NotFoundException('KnowledgeDocument', docId);
    await this.repo.softDeleteDocument(docId);
  }
}
