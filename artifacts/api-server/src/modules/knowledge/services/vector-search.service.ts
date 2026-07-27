// =============================================================================
// VectorSearchService — Busca semântica por similaridade de cosseno (pgvector)
//
// Usa pgvector com índice HNSW para busca ANN (Approximate Nearest Neighbor).
// Toda interação com a coluna `embedding vector(1536)` passa por aqui via
// SQL raw, já que Prisma não suporta nativamente o tipo Unsupported().
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmbeddingService } from './embedding.service';
import {
  SEARCH_TOP_K,
  SEARCH_MIN_SIMILARITY,
  CONTEXT_MAX_CHARS,
} from '../constants/knowledge-rag.constants';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  chunkIndex: number;
  similarity: number;
}

export interface KnowledgeContext {
  /** Texto concatenado dos chunks mais relevantes para injetar no prompt */
  context: string;
  /** Chunks retornados (para logging/debug) */
  sources: SearchResult[];
  /** Se há contexto suficiente (similarity > threshold) */
  hasRelevantContext: boolean;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // ─── Busca semântica ───────────────────────────────────────────────────────

  /**
   * Busca os chunks mais relevantes para uma query em uma base de conhecimento.
   *
   * @param query            Texto da query (mensagem do usuário)
   * @param knowledgeBaseId  UUID da base de conhecimento vinculada ao agente
   * @param embeddingModel   Modelo usado na base (para consistência do vetor)
   * @param topK             Número máximo de resultados
   */
  async search(
    query: string,
    knowledgeBaseId: string,
    embeddingModel = 'text-embedding-3-small',
    topK = SEARCH_TOP_K,
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Gera embedding da query
    const queryEmbedding = await this.embeddingService.embedQuery(query, embeddingModel);
    const embeddingStr   = EmbeddingService.toVectorString(queryEmbedding);

    try {
      const rows = await this.prisma.$queryRaw<SearchResult[]>`
        SELECT
          kd.id,
          kd.title,
          kd.content,
          kd.source_url       AS "sourceUrl",
          kd.chunk_index      AS "chunkIndex",
          1 - (kd.embedding <=> ${embeddingStr}::vector) AS similarity
        FROM knowledge_documents kd
        WHERE kd.knowledge_base_id = ${knowledgeBaseId}::uuid
          AND kd.status            = 'READY'::"KnowledgeDocumentStatus"
          AND kd.deleted_at        IS NULL
          AND kd.embedding         IS NOT NULL
        ORDER BY kd.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK}
      `;

      this.logger.debug(
        `Vector search: kb=${knowledgeBaseId}, query="${query.slice(0, 60)}…", ` +
        `results=${rows.length}, topSimilarity=${rows[0]?.similarity?.toFixed(3) ?? 'n/a'}`,
      );

      return rows;
    } catch (err) {
      // pgvector não instalado ou outra falha — degradar graciosamente
      this.logger.error(
        `Vector search failed (pgvector available?): ${(err as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Busca e constrói o contexto de conhecimento para injetar no prompt.
   * Filtra por similaridade mínima e limita o tamanho total do contexto.
   */
  async getKnowledgeContext(
    query: string,
    knowledgeBaseId: string,
    embeddingModel = 'text-embedding-3-small',
  ): Promise<KnowledgeContext> {
    const results = await this.search(query, knowledgeBaseId, embeddingModel);

    const relevant = results.filter((r) => r.similarity >= SEARCH_MIN_SIMILARITY);

    if (relevant.length === 0) {
      return { context: '', sources: [], hasRelevantContext: false };
    }

    // Concatena chunks até o limite de caracteres
    let totalChars = 0;
    const usedSources: SearchResult[] = [];
    const parts: string[] = [];

    for (const source of relevant) {
      if (totalChars + source.content.length > CONTEXT_MAX_CHARS) break;
      parts.push(`[Fonte: ${source.title}]\n${source.content}`);
      totalChars += source.content.length;
      usedSources.push(source);
    }

    return {
      context: parts.join('\n\n---\n\n'),
      sources: usedSources,
      hasRelevantContext: true,
    };
  }

  // ─── Persistência de embeddings ────────────────────────────────────────────

  /**
   * Salva o embedding de um KnowledgeDocument via SQL raw.
   * (Prisma não suporta o tipo vector(1536) nativo)
   */
  async saveEmbedding(
    documentId: string,
    embedding: number[],
    tokenCount: number,
  ): Promise<void> {
    const embeddingStr = EmbeddingService.toVectorString(embedding);

    await this.prisma.$executeRaw`
      UPDATE knowledge_documents
      SET
        embedding     = ${embeddingStr}::vector,
        status        = 'READY'::"KnowledgeDocumentStatus",
        processed_at  = NOW(),
        token_count   = ${tokenCount},
        updated_at    = NOW()
      WHERE id = ${documentId}::uuid
    `;
  }

  /**
   * Marca um documento como ERROR.
   */
  async markError(documentId: string, message: string): Promise<void> {
    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'ERROR',
        errorMessage: message.slice(0, 1000),
      },
    });
  }
}
