// =============================================================================
// MemoryCleanupProducer — Agendamento do Job de Limpeza de Histórico
//
// RESPONSABILIDADE: Registrar o job repetível (cron) no BullMQ que executa
// a limpeza automática de mensagens antigas no PostgreSQL.
//
// QUANDO EXECUTADO: Diariamente às 02:00 (horário local do servidor).
// Escolhemos madrugada para minimizar impacto em produção.
//
// POR QUÊ LIMPEZA AUTOMÁTICA:
//   - Conversas fechadas acumulam mensagens que nunca mais serão usadas pelo modelo
//   - PostgreSQL cresce indefinidamente sem limpeza → lentidão em queries de histórico
//   - Redis limpa automaticamente via TTL — apenas o Postgres precisa de cron
// =============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_MEMORY_CLEANUP,
  JOB_CLEANUP_OLD_MESSAGES,
  MEMORY_RETENTION_DAYS,
  MEMORY_CLOSE_GRACE_DAYS,
} from './memory.constants';

@Injectable()
export class MemoryCleanupProducer implements OnModuleInit {
  private readonly logger = new Logger(MemoryCleanupProducer.name);

  constructor(
    @InjectQueue(QUEUE_MEMORY_CLEANUP)
    private readonly cleanupQueue: Queue,
  ) {}

  /**
   * Registra o job repetível na inicialização do módulo.
   *
   * Usamos `onModuleInit` em vez de um evento de app para garantir que o job
   * seja agendado mesmo em restarts parciais.
   *
   * O BullMQ idempotência: adicionar um job repetível com o mesmo `jobId`
   * não cria duplicatas — apenas confirma que ele existe.
   */
  async onModuleInit(): Promise<void> {
    await this.cleanupQueue.add(
      JOB_CLEANUP_OLD_MESSAGES,
      {
        retentionDays: MEMORY_RETENTION_DAYS,
        closeGraceDays: MEMORY_CLOSE_GRACE_DAYS,
      },
      {
        jobId: 'memory-cleanup-daily', // ID fixo = idempotente ao reiniciar
        repeat: { pattern: '0 2 * * *' }, // Todo dia às 02:00
        removeOnComplete: { count: 7 },   // Mantém log dos últimos 7 sucessos
        removeOnFail: { count: 14 },      // Mantém log das últimas 14 falhas
      },
    );

    this.logger.log(
      `Memory cleanup scheduled: daily at 02:00 ` +
      `(retention=${MEMORY_RETENTION_DAYS}d, grace=${MEMORY_CLOSE_GRACE_DAYS}d)`,
    );
  }

  /**
   * Dispara limpeza manual imediata (útil para manutenção / admin).
   */
  async triggerNow(): Promise<string> {
    const job = await this.cleanupQueue.add(
      JOB_CLEANUP_OLD_MESSAGES,
      {
        retentionDays: MEMORY_RETENTION_DAYS,
        closeGraceDays: MEMORY_CLOSE_GRACE_DAYS,
      },
      {
        removeOnComplete: { count: 1 },
        removeOnFail: { count: 5 },
      },
    );
    this.logger.log(`Manual memory cleanup triggered: jobId=${job.id}`);
    return job.id!;
  }
}
