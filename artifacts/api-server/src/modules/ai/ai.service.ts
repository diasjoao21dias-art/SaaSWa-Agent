// =============================================================================
// AiService — Camada de Regras de Negócio de IA
//
// RESPONSABILIDADE: Orquestrar a geração de respostas de IA para conversas.
//   - Carrega e valida a configuração do agente
//   - Monta o system prompt via PromptBuilderService
//   - Chama a OpenAI via OpenAiResponsesService
//   - Expõe endpoints de playground e teste de prompts
//
// PROIBIDO neste serviço:
//   ✗ Lógica de fila / BullMQ
//   ✗ Salvar mensagens no banco
//   ✗ Chamadas HTTP diretas (use OpenAiResponsesService)
//
// PERMITIDO neste serviço:
//   ✓ Carregar agente e validar status
//   ✓ Construir o contexto e histórico de mensagens
//   ✓ Delegar a montagem do prompt para PromptBuilderService
//   ✓ Delegar a chamada de API para OpenAiResponsesService
//   ✓ Cache de configuração de agente
// =============================================================================

import { Injectable, Logger, Optional } from '@nestjs/common';
import { AgentsRepository } from '../agents/agents.repository';
import { CacheService } from '../../cache/cache.service';
import { OpenAiResponsesService } from '../../openai/openai-responses.service';
import { PromptBuilderService } from './prompt-builder.service';
import { VectorSearchService } from '../knowledge/services/vector-search.service';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { AgentNotFoundException } from '../agents/exceptions/agent.exceptions';
import { CACHE_KEY_AGENT, CACHE_TTL_MEDIUM } from '../../common/constants';
import type { ChatCompletionDto, TestPromptDto } from './dto/chat-completion.dto';
import type { ResponseInputMessage } from '../../openai/interfaces/openai.interfaces';
import type { CreateResponseResult } from '../../openai/interfaces/openai.interfaces';

// ─── Tipo para a requisição de geração de resposta automática ─────────────────

export interface GenerateResponseRequest {
  /** ID do agente configurado para o número WhatsApp */
  agentId: string;
  /** Histórico recente da conversa (já em ordem cronológica) */
  conversationHistory: Array<{ role: 'USER' | 'ASSISTANT'; content: string | null }>;
  /** Nome do cliente (para personalização do prompt) */
  customerName?: string;
  /** Nome da empresa (tenant) */
  tenantName?: string;
  /** ID da base de conhecimento vinculada ao agente (RAG) */
  knowledgeBaseId?: string | null;
  /** Modelo de embedding da base de conhecimento */
  embeddingModel?: string;
}

export interface GenerateResponseResult extends CreateResponseResult {
  /** Mensagem de fallback aplicada (quando a OpenAI retornou vazio) */
  usedFallback: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly agentsRepo: AgentsRepository,
    private readonly cache: CacheService,
    private readonly openai: OpenAiResponsesService,
    private readonly promptBuilder: PromptBuilderService,
    @Optional() private readonly vectorSearch: VectorSearchService | null,
  ) {}

  // ─── Geração automática (chamada pelo consumer de fila) ───────────────────────

  /**
   * Gera uma resposta de IA para uma mensagem recebida no WhatsApp.
   *
   * Fluxo:
   *   1. Carrega agente (com cache Redis de 5 min)
   *   2. Valida que agente está ACTIVE
   *   3. Monta o system prompt via PromptBuilderService
   *   4. Formata o histórico para o formato da Responses API
   *   5. Chama a OpenAI via OpenAiResponsesService
   *   6. Aplica fallback se a resposta vier vazia
   *
   * @param agentId     UUID do agente configurado para o número WhatsApp
   * @param history     Histórico da conversa (cronológico, role USER/ASSISTANT)
   * @param context     Contexto runtime (nome do cliente, etc.)
   */
  async generate(
    request: GenerateResponseRequest,
  ): Promise<GenerateResponseResult> {
    const { agentId, conversationHistory, customerName, tenantName, knowledgeBaseId, embeddingModel } = request;

    // ── 1. Carregar agente ──────────────────────────────────────────────────────
    const agent = await this.loadAgent(agentId);

    if (agent.status !== 'ACTIVE') {
      throw new AgentNotFoundException(agentId);
    }

    // ── 2. Recuperar contexto de conhecimento via RAG (se KB vinculada) ────────
    let knowledgeContext: string | undefined;

    if (knowledgeBaseId && this.vectorSearch) {
      // Usa a última mensagem do usuário como query para busca vetorial
      const lastUserMsg = conversationHistory
        .filter((m) => m.role === 'USER' && m.content?.trim())
        .at(-1);

      if (lastUserMsg?.content) {
        try {
          const kb = await this.vectorSearch.getKnowledgeContext(
            lastUserMsg.content,
            knowledgeBaseId,
            embeddingModel,
          );
          if (kb.hasRelevantContext) {
            knowledgeContext = kb.context;
            this.logger.debug(
              `RAG: ${kb.sources.length} chunks retrieved for agent=${agent.name}`,
            );
          }
        } catch (err) {
          // RAG failure deve degradar graciosamente — nunca bloqueia a resposta
          this.logger.warn(`RAG retrieval failed (non-fatal): ${(err as Error).message}`);
        }
      }
    }

    // ── 3. Montar system prompt ─────────────────────────────────────────────────
    const systemPrompt = this.promptBuilder.build(
      {
        name: agent.name,
        personality: agent.description,
        promptContent: agent.prompt?.content,
        temperature: agent.temperature,
        welcomeMessage: agent.welcomeMessage,
        fallbackMessage: agent.fallbackMessage,
        humanHandoffEnabled: agent.humanHandoffEnabled,
        handoffKeywords: agent.handoffKeywords,
        inactivityTimeout: agent.inactivityTimeout,
        tenantName,
        knowledgeContext,
      },
      {
        customerName,
        currentDateTime: new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      },
    );

    // ── 4. Formatar histórico para Responses API ────────────────────────────────
    // Responses API aceita apenas role 'user' | 'assistant' (lowercase)
    // A mensagem atual do usuário já está no histórico
    const inputMessages: ResponseInputMessage[] = conversationHistory
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content!,
      }));

    this.logger.debug(
      `Generating AI response: agent=${agent.name}, model=${agent.model}, ` +
      `history=${inputMessages.length} messages, temp=${agent.temperature}`,
    );

    // ── 4. Chamar OpenAI Responses API ─────────────────────────────────────────
    const result = await this.openai.createResponse({
      model: agent.model,
      instructions: systemPrompt,
      input: inputMessages,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
      topP: agent.topP,
    });

    // ── 5. Aplicar fallback se resposta vazia ──────────────────────────────────
    const usedFallback = !result.text.trim();
    if (usedFallback && agent.fallbackMessage) {
      result.text = agent.fallbackMessage;
    } else if (usedFallback) {
      result.text = 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?';
    }

    this.logger.debug(
      `AI response: ${result.latencyMs}ms, ` +
      `${result.inputTokens}in/${result.outputTokens}out tokens` +
      (usedFallback ? ' [FALLBACK]' : ''),
    );

    return { ...result, usedFallback };
  }

  // ─── Playground (endpoint de teste interativo) ────────────────────────────────

  /**
   * Endpoint de playground: envia uma mensagem para um agente e retorna
   * a resposta diretamente (sem fila, sem salvar no banco).
   * Usado pelos painéis de administração para testar a configuração do agente.
   */
  async chatCompletion(tenantId: string, dto: ChatCompletionDto) {
    const agent = await this.agentsRepo.findById(dto.agentId, tenantId);
    if (!agent) throw new NotFoundException('Agent', dto.agentId);

    const systemPrompt = this.promptBuilder.build({
      name: agent.name,
      personality: agent.description,
      promptContent: agent.prompt?.content,
      temperature: agent.temperature,
      welcomeMessage: agent.welcomeMessage,
      fallbackMessage: agent.fallbackMessage,
      humanHandoffEnabled: agent.humanHandoffEnabled,
      handoffKeywords: agent.handoffKeywords,
      inactivityTimeout: agent.inactivityTimeout,
    });

    // Monta histórico + mensagem atual
    const inputMessages: ResponseInputMessage[] = [
      ...(dto.history ?? []).filter((h) => h.content?.trim()).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: dto.message },
    ];

    const result = await this.openai.createResponse({
      model: agent.model,
      instructions: systemPrompt,
      input: inputMessages,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
      topP: agent.topP,
    });

    return {
      reply: result.text || agent.fallbackMessage || 'Sem resposta.',
      model: result.model,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
      latencyMs: result.latencyMs,
      responseId: result.responseId,
      promptPreview: systemPrompt,   // útil para debugging no playground
    };
  }

  // ─── Teste de prompt (sem agente) ─────────────────────────────────────────────

  /**
   * Testa um system prompt arbitrário com uma mensagem de exemplo.
   * Não requer agente configurado — útil para desenvolvimento de prompts.
   */
  async testPrompt(dto: TestPromptDto) {
    const result = await this.openai.createResponse({
      model: dto.model ?? 'gpt-4o-mini',
      instructions: dto.systemPrompt,
      input: [{ role: 'user', content: dto.userMessage }],
      temperature: dto.temperature ?? 0.7,
      maxOutputTokens: 512,
    });

    return {
      reply: result.text,
      model: result.model,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
      latencyMs: result.latencyMs,
    };
  }

  // ─── Modelos disponíveis ──────────────────────────────────────────────────────

  listAvailableModels() {
    return this.openai.listAvailableModels();
  }

  // ─── Preview do prompt montado ────────────────────────────────────────────────

  /**
   * Retorna o system prompt que seria enviado para a OpenAI para um dado agente.
   * Útil para o painel de administração mostrar o prompt completo ao admin.
   */
  async previewPrompt(agentId: string, tenantId: string, customerName?: string) {
    const agent = await this.agentsRepo.findById(agentId, tenantId);
    if (!agent) throw new NotFoundException('Agent', agentId);

    return {
      systemPrompt: this.promptBuilder.build(
        {
          name: agent.name,
          personality: agent.description,
          promptContent: agent.prompt?.content,
          temperature: agent.temperature,
          welcomeMessage: agent.welcomeMessage,
          fallbackMessage: agent.fallbackMessage,
          humanHandoffEnabled: agent.humanHandoffEnabled,
          handoffKeywords: agent.handoffKeywords,
          inactivityTimeout: agent.inactivityTimeout,
        },
        { customerName },
      ),
      agent: {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        contextWindowSize: agent.contextWindowSize,
      },
    };
  }

  // ─── Cache de agente ──────────────────────────────────────────────────────────

  /**
   * Carrega o agente com cache Redis (TTL: 5 min).
   * Invalidado pelo AgentsService ao atualizar o agente.
   */
  private async loadAgent(agentId: string) {
    const cacheKey = `${CACHE_KEY_AGENT}${agentId}`;
    const cached = await this.cache.get<Awaited<ReturnType<typeof this.agentsRepo.findById>>>(cacheKey);
    if (cached) return cached;

    const agent = await this.agentsRepo.findByIdGlobal(agentId);
    if (!agent) throw new AgentNotFoundException(agentId);

    await this.cache.set(cacheKey, agent, CACHE_TTL_MEDIUM);
    return agent;
  }
}
