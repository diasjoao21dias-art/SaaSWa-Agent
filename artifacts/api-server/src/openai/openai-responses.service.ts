// =============================================================================
// OpenAiResponsesService — Camada de Infraestrutura Pura
//
// RESPONSABILIDADE: Única e exclusiva — fazer chamadas para a OpenAI
// usando a nova Responses API (SDK v5: openai.responses.create()).
//
// PROIBIDO neste serviço:
//   ✗ Acesso ao banco de dados (Prisma)
//   ✗ Regras de negócio (contexto de conversa, montagem de prompt)
//   ✗ Lógica de tenant ou agente
//
// PERMITIDO neste serviço:
//   ✓ Inicialização do cliente OpenAI SDK
//   ✓ Chamadas para openai.responses.create()
//   ✓ Tratamento de erros HTTP da OpenAI (rate limit, context length, etc.)
//   ✓ Listagem de modelos disponíveis
//
// POR QUE Responses API e não Chat Completions?
//   A Responses API é a API de geração atual da OpenAI (lançada em 2025).
//   Ela unifica completions e ferramentas em um único endpoint, oferece
//   'instructions' separadas do histórico, e é a base para Agents SDK.
//   Referência: https://platform.openai.com/docs/api-reference/responses
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  OpenAiApiException,
  OpenAiRateLimitException,
  OpenAiContextLengthException,
} from './exceptions/openai.exception';
import type { CreateResponseParams, CreateResponseResult, AvailableModel } from './interfaces/openai.interfaces';

@Injectable()
export class OpenAiResponsesService {
  private readonly logger = new Logger(OpenAiResponsesService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('openai.apiKey'),
      organization: this.configService.get<string | undefined>('openai.organization'),
      timeout: this.configService.get<number>('openai.timeoutMs', 30_000),
    });
  }

  // ─── Geração de resposta ──────────────────────────────────────────────────────

  /**
   * Cria uma resposta usando a OpenAI Responses API.
   *
   * Diferenças da Chat Completions (legada):
   *   • `instructions` recebe o system prompt — separado do histórico de mensagens
   *   • `input` é o histórico de mensagens (user/assistant)
   *   • `max_output_tokens` no lugar de `max_tokens`
   *   • Resposta em `response.output_text` (getter de conveniência)
   *   • Tokens em `response.usage.input_tokens` / `response.usage.output_tokens`
   */
  async createResponse(params: CreateResponseParams): Promise<CreateResponseResult> {
    const start = Date.now();

    const {
      model,
      instructions,
      input,
      temperature = 0.7,
      maxOutputTokens = 1024,
      topP = 1,
    } = params;

    try {
      const response = await this.client.responses.create({
        model,
        instructions,
        input: input.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_output_tokens: maxOutputTokens,
        top_p: topP,
      });

      const text = response.output_text ?? '';
      const latencyMs = Date.now() - start;

      this.logger.debug(
        `Responses API: model=${model}, ` +
        `in=${response.usage?.input_tokens ?? 0}, ` +
        `out=${response.usage?.output_tokens ?? 0}, ` +
        `latency=${latencyMs}ms`,
      );

      return {
        text,
        responseId: response.id,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        latencyMs,
        model,
      };
    } catch (err) {
      throw this.mapOpenAiError(err, model);
    }
  }

  // ─── Modelos disponíveis ──────────────────────────────────────────────────────

  /**
   * Retorna a lista curada de modelos suportados pela plataforma.
   * Inclui apenas modelos compatíveis com a Responses API.
   */
  listAvailableModels(): AvailableModel[] {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Modelo principal — máxima capacidade de raciocínio e compreensão',
        contextWindow: 128_000,
        outputLimit: 16_384,
        recommended: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Modelo rápido e econômico — ideal para atendimento ao cliente',
        contextWindow: 128_000,
        outputLimit: 16_384,
        recommended: true,
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        description: 'Alta precisão em raciocínio e instrução seguida à risca',
        contextWindow: 1_047_576,
        outputLimit: 32_768,
      },
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        description: 'Versão compacta do GPT-4.1 — boa relação custo-benefício',
        contextWindow: 1_047_576,
        outputLimit: 32_768,
      },
      {
        id: 'o4-mini',
        name: 'o4 Mini',
        description: 'Modelo de raciocínio — excelente para lógica e análise complexa',
        contextWindow: 200_000,
        outputLimit: 100_000,
      },
    ];
  }

  // ─── Mapeamento de erros ──────────────────────────────────────────────────────

  private mapOpenAiError(err: unknown, model: string): never {
    // OpenAI SDK v5 lança instâncias de OpenAI.APIError
    if (err instanceof OpenAI.APIError) {
      const status = err.status;

      if (status === 429) throw new OpenAiRateLimitException();

      if (status === 400 && err.message?.toLowerCase().includes('context')) {
        throw new OpenAiContextLengthException(model);
      }

      throw new OpenAiApiException('createResponse', `HTTP ${status}: ${err.message}`);
    }

    if (err instanceof Error) {
      throw new OpenAiApiException('createResponse', err.message);
    }

    throw new OpenAiApiException('createResponse', 'Unknown error');
  }
}
