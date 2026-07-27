// =============================================================================
// DocumentProcessingConsumer — Worker de processamento assíncrono de documentos
//
// Fluxo:
//   1. Carrega o KnowledgeDocument (PENDING)
//   2. Extrai texto (via TextExtractorService)
//   3. Divide em chunks (via ChunkerService)
//   4. Gera embeddings (via EmbeddingService)
//   5. Salva vetores (via VectorSearchService)
//   6. Marca status READY (ou ERROR em caso de falha)
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TextExtractorService } from '../services/text-extractor.service';
import { ChunkerService } from '../services/chunker.service';
import { EmbeddingService } from '../services/embedding.service';
import { VectorSearchService } from '../services/vector-search.service';
import {
  QUEUE_KNOWLEDGE_PROCESSING,
  JOB_PROCESS_DOCUMENT,
} from '../constants/knowledge-rag.constants';
import type { ProcessDocumentJobData } from '../services/document-ingestion.service';

@Processor(QUEUE_KNOWLEDGE_PROCESSING, { concurrency: 3 })
export class DocumentProcessingConsumer extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessingConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly textExtractor: TextExtractorService,
    private readonly chunker: ChunkerService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearch: VectorSearchService,
  ) {
    super();
  }

  async process(job: Job<ProcessDocumentJobData>): Promise<void> {
    if (job.name !== JOB_PROCESS_DOCUMENT) return;

    const { documentId, embeddingModel, filePath, sourceUrl, isDirectText } = job.data;
    const start = Date.now();

    this.logger.log(`Processing document: ${documentId}`);

    // ── 1. Marca como PROCESSING ─────────────────────────────────────────────
    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    let rawText: string;

    try {
      // ── 2. Extrai texto ───────────────────────────────────────────────────
      if (isDirectText) {
        // Texto já está no campo content — apenas lê do banco
        const doc = await this.prisma.knowledgeDocument.findUnique({
          where: { id: documentId },
          select: { content: true, question: true, answer: true },
        });

        // Para FAQ: combina question + answer
        if (doc?.question && doc.answer) {
          rawText = `Pergunta: ${doc.question}\nResposta: ${doc.answer}`;
        } else {
          rawText = doc?.content ?? '';
        }
      } else if (sourceUrl) {
        rawText = await this.textExtractor.extractFromUrl(sourceUrl);
      } else if (filePath) {
        // Determina mimeType pelo registro File
        const doc = await this.prisma.knowledgeDocument.findUnique({
          where: { id: documentId },
          select: { file: { select: { mimeType: true } } },
        });
        const mimeType = doc?.file?.mimeType ?? 'application/octet-stream';
        rawText = await this.textExtractor.extractFromPath(filePath, mimeType);
      } else {
        throw new Error('Job sem fonte de dados (filePath, sourceUrl ou isDirectText)');
      }

      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Texto extraído está vazio ou muito curto');
      }

      await job.updateProgress(25);

      // ── 3. Divide em chunks ───────────────────────────────────────────────
      const chunks = this.chunker.chunk(rawText);

      if (chunks.length === 0) {
        throw new Error('Nenhum chunk gerado a partir do texto');
      }

      this.logger.debug(`Document ${documentId}: ${chunks.length} chunks generated`);
      await job.updateProgress(40);

      // ── 4. Gera embeddings em lote ────────────────────────────────────────
      const texts = chunks.map((c) => c.content);
      const embeddings = await this.embeddingService.embedTexts(texts, embeddingModel);

      await job.updateProgress(80);

      // ── 5. Persiste: atualiza o doc original (chunk 0) + insere os demais ─
      const doc = await this.prisma.knowledgeDocument.findUnique({
        where: { id: documentId },
        select: { title: true, fileId: true, sourceUrl: true, knowledgeBaseId: true },
      });

      // Chunk 0 → atualiza o documento original
      await this.prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          content: chunks[0]!.content,
          chunkIndex: 0,
          tokenCount: chunks[0]!.tokenCount,
          status: 'PROCESSING', // será READY ao salvar o embedding
        },
      });
      await this.vectorSearch.saveEmbedding(documentId, embeddings[0]!, chunks[0]!.tokenCount);

      // Chunks 1..N → insere novos documentos
      for (let i = 1; i < chunks.length; i++) {
        const chunkDoc = await this.prisma.knowledgeDocument.create({
          data: {
            knowledgeBaseId: doc!.knowledgeBaseId,
            fileId: doc!.fileId,
            title: `${doc!.title} [parte ${i + 1}]`,
            content: chunks[i]!.content,
            sourceUrl: doc!.sourceUrl,
            chunkIndex: i,
            tokenCount: chunks[i]!.tokenCount,
            status: 'PROCESSING',
          },
        });
        await this.vectorSearch.saveEmbedding(chunkDoc.id, embeddings[i]!, chunks[i]!.tokenCount);
      }

      await job.updateProgress(100);

      const elapsed = Date.now() - start;
      this.logger.log(
        `Document ${documentId} processed: ${chunks.length} chunks, ${elapsed}ms`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      this.logger.error(`Document ${documentId} failed: ${message}`, (err as Error).stack);
      await this.vectorSearch.markError(documentId, message);
      throw err; // re-lança para o BullMQ registrar tentativas/retry
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Knowledge processing job ${job.id} failed after ${job.attemptsMade} attempt(s): ${error.message}`,
    );
  }
}
