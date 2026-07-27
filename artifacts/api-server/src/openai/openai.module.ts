import { Module } from '@nestjs/common';
import { OpenAiResponsesService } from './openai-responses.service';
import { OpenAiEmbeddingsService } from './openai-embeddings.service';

/**
 * OpenAiModule — camada de infraestrutura pura para a OpenAI API.
 *
 * Exporta:
 *   - OpenAiResponsesService  — geração de texto (Responses API)
 *   - OpenAiEmbeddingsService — geração de embeddings (Embeddings API)
 */
@Module({
  providers: [OpenAiResponsesService, OpenAiEmbeddingsService],
  exports: [OpenAiResponsesService, OpenAiEmbeddingsService],
})
export class OpenAiModule {}
