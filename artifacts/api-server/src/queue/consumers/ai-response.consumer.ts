// =============================================================================
// AiResponseConsumer — Consumer de Fila de Respostas de IA
//
// RESPONSABILIDADE: Orquestrar o fluxo completo de resposta automática:
//   1. Carregar contexto da conversa do banco
//   2. Chamar AiService.generate() para obter a resposta
//   3. Salvar a mensagem de resposta no banco
//   4. Enfileirar o envio outbound (WhatsApp)
//
// Este consumer é intencionalmente fino (thin consumer).
// Toda a lógica de IA (montagem de prompt, chamada OpenAI) vive em AiService.
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../../modules/ai/ai.service';
import { WhatsappOutboundProducer } from '../producers/whatsapp-outbound.producer';
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
    // Carregamos o agente aqui para obter: status, contextWindowSize, tenantId do agente.
    const agent = await this.prisma.aiAgent.findFirst({
      where: { id: agentId, deletedAt: null },
      select: {
        id: true,
        status: true,
        contextWindowSize: true,
        fallbackMessage: true,
        name: true,
      },
    });

    if (!agent || agent.status !== 'ACTIVE') {
      this.logger.warn(`Agent ${agentId} not found or inactive — skipping AI response`);
      return;
    }

    // ── 2. Carregar histórico recente da conversa ───────────────────────────────
    // Carregamos contextWindowSize mensagens em ordem decrescente,
    // depois invertemos para ordem cronológica (mais antiga → mais recente).
    const recentMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        role: { in: ['USER', 'ASSISTANT'] },
        content: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: agent.contextWindowSize,
      select: { role: true, content: true },
    });

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content }));

    // ── 3. Carregar contexto do cliente (nome para personalização) ──────────────
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        customer: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    });

    // ── 4. Gerar resposta via AiService ────────────────────────────────────────
    // AiService.generate() encapsula: cache de agente, montagem de prompt,
    // chamada Responses API, aplicação de fallback.
    const result = await this.aiService.generate({
      agentId,
      conversationHistory,
      customerName: conversation?.customer?.name ?? undefined,
      tenantName: conversation?.tenant?.name ?? undefined,
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

    // ── 6. Atualizar timestamps da conversa ─────────────────────────────────────
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // ── 7. Marcar mensagem original como processada ─────────────────────────────
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

    // ── 8. Enfileirar envio outbound para o WhatsApp ────────────────────────────
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
