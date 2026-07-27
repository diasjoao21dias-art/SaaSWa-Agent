// =============================================================================
// EmbeddingService — Geração e gerenciamento de embeddings para RAG
//
// Camada de aplicação entre o KnowledgeModule e a infraestrutura OpenAI.
// Responsável por: batching, logging de custo, seleção de modelo.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OpenAiEmbeddingsService } from '../../../openai/openai-embeddings.service';
import { EMBEDDING_BATCH_SIZE } from '../constants/knowledge-rag.constants';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly openaiEmbeddings: OpenAiEmbeddingsService) {}

  /**
   * Gera embeddings para um array de textos, processando em lotes.
   *
   * @param texts  Textos a serem vetorizados
   * @param model  Modelo de embedding (padrão: text-embedding-3-small)
   * @returns      Array de float[] na mesma ordem dos textos de entrada
   */
  async embedTexts(texts: string[], model = 'text-embedding-3-small'): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = [];
    const batches = this.batch(texts, EMBEDDING_BATCH_SIZE);

    this.logger.debug(
      `Embedding ${texts.length} texts in ${batches.length} batches (model: ${model})`,
    );

    for (let i = 0; i < batches.length; i++) {
      const batchTexts = batches[i]!;
      this.logger.debug(`Processing batch ${i + 1}/${batches.length} (${batchTexts.length} texts)`);
      const embeddings = await this.openaiEmbeddings.embedBatch(batchTexts, model);
      results.push(...embeddings);
    }

    return results;
  }

  /**
   * Gera embedding para uma única query (busca semântica).
   */
  async embedQuery(query: string, model = 'text-embedding-3-small'): Promise<number[]> {
    return this.openaiEmbeddings.embedOne(query, model);
  }

  /**
   * Converte float[] para string no formato pgvector: '[0.1,0.2,...]'
   */
  static toVectorString(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  // ─── Utilitários ──────────────────────────────────────────────────────────

  private batch<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }
}
