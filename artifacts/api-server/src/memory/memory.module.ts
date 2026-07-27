// =============================================================================
// MemoryModule — Módulo de Memória de Conversas
//
// Exporta ConversationMemoryService para uso pelos consumers de fila.
// A fila de limpeza (QUEUE_MEMORY_CLEANUP) é registrada aqui para
// encapsular toda a infra de memória neste módulo.
// =============================================================================

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversationMemoryService } from './conversation-memory.service';
import { MemoryCleanupProducer } from './memory-cleanup.producer';
import { MemoryCleanupConsumer } from './memory-cleanup.consumer';
import { QUEUE_MEMORY_CLEANUP } from './memory.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_MEMORY_CLEANUP }),
  ],
  providers: [
    ConversationMemoryService,
    MemoryCleanupProducer,
    MemoryCleanupConsumer,
  ],
  exports: [
    ConversationMemoryService,
    MemoryCleanupProducer,
  ],
})
export class MemoryModule {}
