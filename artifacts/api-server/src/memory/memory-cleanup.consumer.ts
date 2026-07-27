// =============================================================================
// MemoryCleanupConsumer — Limpeza Automática de Histórico no PostgreSQL
//
// RESPONSABILIDADE: Soft-deletar mensagens antigas de conversas fechadas.
//
// ESTRATÉGIA DE LIMPEZA:
//   1. Encontra conversas com status CLOSED fechadas há mais de `closeGraceDays`
//   2. Para cada lote de conversas, soft-deleta mensagens com mais de `retentionDays`
//   3. Processa em batches para evitar locks longos e alto consumo de memória
//
// POR QUÊ SOFT-DELETE (deletedAt) E NÃO HARD-DELETE:
//   - Permite auditoria pós-cleanup por um período adicional
//   - Reversível se necessário (erro de configuração, disputa legal, etc.)
//   - O código de leitura já filtra `deletedAt: null` — sem impacto imediato
//
// POR QUÊ NÃO LIMPAR CONVERSAS ABERTAS:
//   - Conversas BOT/WAITING/HUMAN ainda estão em uso ativo
//   - Deletar o histórico quebraria o contexto do agente de IA
//
// REDIS NÃO PRECISA DE LIMPEZA AQUI:
//   - Redis usa TTL (2h) — expira automaticamente após inatividade
//   - Conversas fechadas têm TTL expirado muito antes deste job rodar
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  QUEUE_MEMORY_CLEANUP,
  JOB_CLEANUP_OLD_MESSAGES,
  MEMORY_CLEANUP_BATCH_SIZE,
} from './memory.constants';

export interface CleanupJobData {
  retentionDays: number;
  closeGraceDays: number;
}

interface CleanupStats {
  conversationsScanned: number;
  messagesDeleted: number;
  batches: number;
  durationMs: number;
}

@Processor(QUEUE_MEMORY_CLEANUP, { concurrency: 1 })
export class MemoryCleanupConsumer extends WorkerHost {
  private readonly logger = new Logger(MemoryCleanupConsumer.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<CleanupJobData>): Promise<CleanupStats> {
    if (job.name !== JOB_CLEANUP_OLD_MESSAGES) return this.emptyStats();

    const { retentionDays, closeGraceDays } = job.data;
    const startedAt = Date.now();

    this.logger.log(
      `Starting memory cleanup: retentionDays=${retentionDays}, closeGraceDays=${closeGraceDays}`,
    );

    // ── Referências de data ────────────────────────────────────────────────────
    const messagesCutoff = new Date();
    messagesCutoff.setDate(messagesCutoff.getDate() - retentionDays);

    const conversationCutoff = new Date();
    conversationCutoff.setDate(conversationCutoff.getDate() - closeGraceDays);

    let stats: CleanupStats = {
      conversationsScanned: 0,
      messagesDeleted: 0,
      batches: 0,
      durationMs: 0,
    };

    // ── Processa em cursor paginado para não carregar tudo na memória ──────────
    let cursor: string | undefined = undefined;

    do {
      // Busca lote de conversas fechadas há mais de closeGraceDays
      const queryArgs = {
        where: {
          status: 'CLOSED' as const,
          updatedAt: { lt: conversationCutoff },
          deletedAt: null as null,
        },
        select: { id: true },
        take: MEMORY_CLEANUP_BATCH_SIZE,
        orderBy: { id: 'asc' as const },
        ...(cursor ? { skip: 1 as const, cursor: { id: cursor } } : {}),
      };
      const conversations: Array<{ id: string }> =
        await this.prisma.conversation.findMany(queryArgs as Parameters<typeof this.prisma.conversation.findMany>[0]);

      if (conversations.length === 0) break;

      cursor = conversations[conversations.length - 1].id;
      stats.conversationsScanned += conversations.length;

      const conversationIds = conversations.map((c: { id: string }) => c.id);

      // Soft-deleta mensagens antigas nestas conversas
      const result = await this.prisma.message.updateMany({
        where: {
          conversationId: { in: conversationIds },
          createdAt: { lt: messagesCutoff },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      stats.messagesDeleted += result.count;
      stats.batches += 1;

      this.logger.debug(
        `Cleanup batch ${stats.batches}: scanned ${conversations.length} conversations, ` +
        `deleted ${result.count} messages`,
      );

      // Libera o event loop brevemente entre batches pesados
      await new Promise((resolve) => setImmediate(resolve));

    } while (cursor);

    stats.durationMs = Date.now() - startedAt;

    this.logger.log(
      `Memory cleanup complete: ${stats.messagesDeleted} messages soft-deleted ` +
      `across ${stats.conversationsScanned} conversations ` +
      `in ${stats.batches} batches (${stats.durationMs}ms)`,
    );

    return stats;
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Memory cleanup job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }

  private emptyStats(): CleanupStats {
    return { conversationsScanned: 0, messagesDeleted: 0, batches: 0, durationMs: 0 };
  }
}
