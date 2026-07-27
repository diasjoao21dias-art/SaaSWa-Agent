// =============================================================================
// OpenAiEmbeddingsService — Geração de vetores de embedding
//
// RESPONSABILIDADE: Chamar a OpenAI Embeddings API e retornar vetores float[].
// Camada de infraestrutura pura — sem regras de negócio.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OpenAiApiException } from './exceptions/openai.exception';

@Injectable()
export class OpenAiEmbeddingsService {
  private readonly logger = new Logger(OpenAiEmbeddingsService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey:       this.configService.getOrThrow<string>('openai.apiKey'),
      organization: this.configService.get<string | undefined>('openai.organization'),
      timeout:      this.configService.get<number>('openai.timeoutMs', 30_000),
    });
  }

  /**
   * Gera embeddings para um lote de textos.
   *
   * @param texts  Array de strings a serem transformadas em vetores
   * @param model  Modelo de embedding (padrão: text-embedding-3-small)
   * @returns      Array de float[] — um por texto de entrada, na mesma ordem
   */
  async embedBatch(texts: string[], model = 'text-embedding-3-small'): Promise<number[][]> {
    if (texts.length === 0) return [];

    const start = Date.now();
    try {
      const response = await this.client.embeddings.create({
        model,
        input: texts,
        encoding_format: 'float',
      });

      this.logger.debug(
        `Embeddings: model=${model}, count=${texts.length}, ` +
        `tokens=${response.usage.total_tokens}, ${Date.now() - start}ms`,
      );

      // Garante ordem correta — OpenAI já devolve em ordem, mas reordenamos por segurança
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        throw new OpenAiApiException('embedBatch', `HTTP ${err.status}: ${err.message}`);
      }
      throw new OpenAiApiException('embedBatch', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  /**
   * Gera embedding para um único texto.
   */
  async embedOne(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
    const results = await this.embedBatch([text], model);
    return results[0]!;
  }
}
