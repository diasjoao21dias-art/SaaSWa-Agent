import { Injectable } from '@nestjs/common';
import { KnowledgeRepository } from './knowledge.repository';
import { DocumentIngestionService } from './services/document-ingestion.service';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import type { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import type { IngestUrlDto } from './dto/ingest-url.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly repo: KnowledgeRepository,
    private readonly ingestion: DocumentIngestionService,
  ) {}

  // ─── Knowledge Bases ───────────────────────────────────────────────────────

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

  // ─── Ingestão ─────────────────────────────────────────────────────────────

  /**
   * Ingere um arquivo enviado via multipart/form-data.
   * Cria KnowledgeDocument com PENDING e enfileira processamento assíncrono.
   */
  async ingestFile(
    baseId: string,
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    await this.findBaseById(baseId, tenantId);
    return this.ingestion.ingestFile(baseId, tenantId, userId, file);
  }

  /**
   * Ingere conteúdo de uma URL via scraping.
   */
  async ingestUrl(baseId: string, tenantId: string, dto: IngestUrlDto) {
    await this.findBaseById(baseId, tenantId);
    return this.ingestion.ingestUrl(baseId, tenantId, dto);
  }

  /**
   * Ingere texto direto fornecido pelo usuário.
   */
  async ingestText(baseId: string, tenantId: string, dto: CreateKnowledgeDocumentDto) {
    await this.findBaseById(baseId, tenantId);
    return this.ingestion.ingestText(baseId, tenantId, dto);
  }

  // ─── Documentos ───────────────────────────────────────────────────────────

  async findDocuments(baseId: string, tenantId: string, pagination: PaginationDto) {
    await this.findBaseById(baseId, tenantId);
    const { data, total } = await this.repo.findDocuments(baseId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async removeDocument(baseId: string, docId: string, tenantId: string) {
    await this.findBaseById(baseId, tenantId);
    const doc = await this.repo.findDocumentById(docId, baseId);
    if (!doc) throw new NotFoundException('KnowledgeDocument', docId);

    // Soft-delete todos os chunks do mesmo arquivo
    if (doc.fileId) {
      await this.repo.softDeleteDocumentsByFileId(doc.fileId);
    } else {
      await this.repo.softDeleteDocument(docId);
    }
  }
}
