// =============================================================================
// AiResponseConsumer — Consumer de Fila de Respostas de IA
//
// RESPONSABILIDADE: Orquestrar o fluxo completo de resposta automática:
//   1. Carregar configuração do agente (com cache Redis via AiService)
//   2. Obter contexto da conversa via ConversationMemoryService (Redis → Postgres)
//   3. Chamar AiService.generate() para obter a resposta
//   4. Salvar a mensagem de resposta no banco
//   5. Empurrar resposta para o contexto Redis (memória quente)
//   6. Enfileirar o envio outbound (WhatsApp)
//
// MEMÓRIA EM DUAS CAMADAS (ver ConversationMemoryService):
//   Redis   — contexto quente, janela deslizante, < 1ms, TTL 2h
//   Postgres— fallback automático em caso de cache miss (cold start, restart)
//
// Este consumer é intencionalmente fino (thin consumer).
// Toda a lógica de IA (montagem de prompt, chamada OpenAI) vive em AiService.
// Toda a lógica de memória vive em ConversationMemoryService.
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../../modules/ai/ai.service';
import { WhatsappOutboundProducer } from '../producers/whatsapp-outbound.producer';
import { ConversationMemoryService } from '../../memory/conversation-memory.service';
import {
  QUEUE_AI_RESPONSE,
  JOB_SEND_AI_RESPONSE,
} from '../queue.constants';
import type { AiResponseJobData } from '../producers/ai-response.producer';

@Processor(QUEUE_AI_RESPONSE, { concurrency: 5 })
export class AiResponseConsumer extends WorkerHost {
  private readonly logger = new Logger(AiResponseConsumer.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiService) private readonly aiService: AiService,
    @Inject(WhatsappOutboundProducer)
    private readonly outboundProducer: WhatsappOutboundProducer,
    @Inject(ConversationMemoryService)
    private readonly memory: ConversationMemoryService,
  ) {
    super();
  }

  async process(job: Job<AiResponseJobData>): Promise<void> {
    if (job.name !== JOB_SEND_AI_RESPONSE) return;

    const {
      conversationId,
      agentId,
      tenantId,
      customerPhone,
      whatsappNumberInstanceName,
      messageId,
    } = job.data;

    // ── 1. Carregar configuração do agente ──────────────────────────────────────
    // Carregamos o agente aqui para obter: status, contextWindowSize, knowledgeBase.
    const agent = await this.prisma.aiAgent.findFirst({
      where: { id: agentId, deletedAt: null },
      select: {
        id: true,
        status: true,
        contextWindowSize: true,
        fallbackMessage: true,
        name: true,
        knowledgeBaseId: true,
        knowledgeBase: {
          select: { embeddingModel: true },
        },
      },
    });

    if (!agent || agent.status !== 'ACTIVE') {
      this.logger.warn(`Agent ${agentId} not found or inactive — skipping AI response`);
      return;
    }

    // ── 2. Obter contexto da conversa via memória em duas camadas ───────────────
    // ConversationMemoryService.getContext() tenta Redis primeiro (< 1ms).
    // Se não encontrar (cold start, Redis restart, TTL expirado), busca no
    // Postgres e aquece o Redis em background para a próxima requisição.
    const conversationHistory = await this.memory.getContext(
      conversationId,
      agent.contextWindowSize,
    );

    // ── 3. Carregar contexto do cliente (nome para personalização) ──────────────
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        customer: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });

    // ── 4. Gerar resposta via AiService (com RAG se KB vinculada) ─────────────
    // AiService.generate() encapsula: cache de agente, busca vetorial (RAG),
    // montagem de prompt, chamada Responses API, aplicação de fallback.
    const result = await this.aiService.generate({
      agentId,
      conversationHistory,
      customerName: conversation?.customer?.name ?? undefined,
      tenantName: conversation?.tenant?.name ?? undefined,
      knowledgeBaseId: agent.knowledgeBaseId ?? undefined,
      embeddingModel: agent.knowledgeBase?.embeddingModel ?? 'text-embedding-3-small',
    });

    // ── 5. Salvar mensagem de resposta no banco ─────────────────────────────────
    const savedResponse = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        type: 'TEXT',
        content: result.text,
        status: 'SENT',
        tokensInput: result.inputTokens,
        tokensOutput: result.outputTokens,
        processingTimeMs: result.latencyMs,
        aiModel: result.model,
        sentAt: new Date(),
        metadata: {
          responseId: result.responseId,  // ID da resposta na OpenAI (rastreabilidade)
          usedFallback: result.usedFallback,
        },
      },
    });

    // ── 6. Empurrar resposta para o contexto Redis ─────────────────────────────
    // Mantém o contexto quente para a próxima mensagem do cliente.
    // A mensagem do usuário já foi empurrada pelo WebhookInboundConsumer.
    await this.memory.pushMessage(
      conversationId,
      'ASSISTANT',
      result.text,
      agent.contextWindowSize,
    );

    // ── 7. Atualizar timestamps da conversa ─────────────────────────────────────
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // ── 8. Marcar mensagem original como processada ─────────────────────────────
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        metadata: {
          processed: true,
          processingMs: result.latencyMs,
          aiResponseMessageId: savedResponse.id,
        },
      },
    });

    // ── 9. Enfileirar envio outbound para o WhatsApp ────────────────────────────
    await this.outboundProducer.enqueue({
      tenantId,
      conversationId,
      messageId: savedResponse.id,
      instanceName: whatsappNumberInstanceName,
      recipientPhone: customerPhone,
      messageType: 'text',
      content: result.text,
    });

    this.logger.debug(
      `AI response for conversation ${conversationId}: ` +
      `${result.latencyMs}ms, ${result.inputTokens}in/${result.outputTokens}out tokens` +
      (result.usedFallback ? ' [FALLBACK]' : ''),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `AI job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }
}
