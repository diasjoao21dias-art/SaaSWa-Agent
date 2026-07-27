// =============================================================================
// DocumentIngestionService — Orquestrador de ingestão de documentos
//
// Responsável por:
//   1. Receber arquivo, URL ou texto direto
//   2. Criar registro File (quando aplicável)
//   3. Criar KnowledgeDocument com status PENDING
//   4. Enfileirar job de processamento assíncrono
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../database/prisma.service';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import {
  QUEUE_KNOWLEDGE_PROCESSING,
  JOB_PROCESS_DOCUMENT,
  UPLOAD_DIR,
} from '../constants/knowledge-rag.constants';
import type { CreateKnowledgeDocumentDto } from '../dto/create-knowledge-document.dto';
import type { IngestUrlDto } from '../dto/ingest-url.dto';

export interface ProcessDocumentJobData {
  documentId: string;
  knowledgeBaseId: string;
  embeddingModel: string;
  /** For file ingestion: absolute path to uploaded file */
  filePath?: string;
  /** For URL ingestion */
  sourceUrl?: string;
  /** For direct text: text is already stored in document.content */
  isDirectText?: boolean;
}

export interface IngestionResult {
  documentId: string;
  status: 'PENDING';
  message: string;
}

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_KNOWLEDGE_PROCESSING)
    private readonly queue: Queue<ProcessDocumentJobData>,
  ) {}

  /**
   * Ingere um arquivo multipart (PDF, DOCX, XLSX, TXT, CSV).
   */
  async ingestFile(
    baseId: string,
    tenantId: string,
    uploadedById: string,
    file: Express.Multer.File,
  ): Promise<IngestionResult> {
    const base = await this.findBase(baseId, tenantId);

    // Garante diretório de upload
    const uploadPath = path.resolve(UPLOAD_DIR);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Salva File no banco
    const fileRecord = await this.prisma.file.create({
      data: {
        tenantId,
        uploadedById,
        storageProvider: 'LOCAL',
        storageKey: `knowledge/${path.basename(file.path)}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        status: 'READY',
      },
    });

    // Cria documento placeholder (PENDING)
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: baseId,
        fileId: fileRecord.id,
        title: path.parse(file.originalname).name,
        content: '',
        status: 'PENDING',
      },
    });

    // Enfileira processamento
    await this.queue.add(
      JOB_PROCESS_DOCUMENT,
      {
        documentId: document.id,
        knowledgeBaseId: baseId,
        embeddingModel: base.embeddingModel,
        filePath: file.path,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.log(
      `File ingestion queued: doc=${document.id}, file="${file.originalname}", ` +
      `size=${file.size} bytes, kb=${baseId}`,
    );

    return {
      documentId: document.id,
      status: 'PENDING',
      message: `Arquivo "${file.originalname}" recebido. Processamento em andamento.`,
    };
  }

  /**
   * Ingere conteúdo de uma URL (scraping + embedding).
   */
  async ingestUrl(
    baseId: string,
    tenantId: string,
    dto: IngestUrlDto,
  ): Promise<IngestionResult> {
    const base = await this.findBase(baseId, tenantId);

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: baseId,
        title: dto.title ?? new URL(dto.url).hostname,
        content: '',
        sourceUrl: dto.url,
        status: 'PENDING',
      },
    });

    await this.queue.add(
      JOB_PROCESS_DOCUMENT,
      {
        documentId: document.id,
        knowledgeBaseId: baseId,
        embeddingModel: base.embeddingModel,
        sourceUrl: dto.url,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.log(`URL ingestion queued: doc=${document.id}, url="${dto.url}", kb=${baseId}`);

    return {
      documentId: document.id,
      status: 'PENDING',
      message: `URL "${dto.url}" recebida. Processamento em andamento.`,
    };
  }

  /**
   * Ingere texto direto (o conteúdo já é fornecido pelo usuário).
   */
  async ingestText(
    baseId: string,
    tenantId: string,
    dto: CreateKnowledgeDocumentDto,
  ): Promise<IngestionResult> {
    const base = await this.findBase(baseId, tenantId);

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: baseId,
        title: dto.title,
        content: dto.content,
        question: dto.question,
        answer: dto.answer,
        sourceUrl: dto.sourceUrl,
        status: 'PENDING',
      },
    });

    await this.queue.add(
      JOB_PROCESS_DOCUMENT,
      {
        documentId: document.id,
        knowledgeBaseId: baseId,
        embeddingModel: base.embeddingModel,
        isDirectText: true,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.log(`Text ingestion queued: doc=${document.id}, kb=${baseId}`);

    return {
      documentId: document.id,
      status: 'PENDING',
      message: 'Documento recebido. Processamento em andamento.',
    };
  }

  // ─── Privados ──────────────────────────────────────────────────────────────

  private async findBase(baseId: string, tenantId: string) {
    const base = await this.prisma.knowledgeBase.findFirst({
      where: { id: baseId, tenantId, deletedAt: null },
    });
    if (!base) throw new NotFoundException('KnowledgeBase', baseId);
    return base;
  }
}
