import { Module } from '@nestjs/common';
import { OpenAiResponsesService } from './openai-responses.service';

/**
 * OpenAiModule — camada de infraestrutura pura para a OpenAI API.
 *
 * Exporta OpenAiResponsesService que encapsula toda comunicação
 * com a OpenAI usando a nova Responses API (SDK v5).
 *
 * Importe este módulo em qualquer módulo que precise de geração de texto.
 */
@Module({
  providers: [OpenAiResponsesService],
  exports: [OpenAiResponsesService],
})
export class OpenAiModule {}
