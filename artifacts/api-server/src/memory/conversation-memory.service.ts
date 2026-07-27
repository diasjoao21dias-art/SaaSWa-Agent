// =============================================================================
// ConversationMemoryService — Memória de Conversa em Duas Camadas
//
// ARQUITETURA:
//   Camada 1 → Redis (quente): janela deslizante das últimas N mensagens.
//              Sub-milissegundo. TTL de 2h reiniciado a cada mensagem.
//              Usado pelo AiResponseConsumer no caminho crítico.
//
//   Camada 2 → PostgreSQL (frio): histórico completo e permanente.
//              Usado como fallback (cache miss) e para histórico humano.
//
// QUANDO CADA CAMADA É ACIONADA:
//   Redis   → conversa ativa: toda resposta de IA lê daqui (99% dos casos)
//   Postgres→ cold start (primeira mensagem), Redis restart, TTL expirado
//
// RESPONSABILIDADES:
//   ✓ pushMessage()  — salva mensagem no Redis (chamado após salvar no DB)
//   ✓ getContext()   — retorna janela de contexto (Redis → Postgres fallback)
//   ✓ evict()        — remove contexto do Redis (conversa fechada / transferida)
//
// PROIBIDO neste serviço:
//   ✗ Salvar no PostgreSQL — essa responsabilidade é de quem chama (consumers)
//   ✗ Lógica de IA, envio de mensagens, regras de negócio
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import {
  MEMORY_KEY_CTX,
  MEMORY_CTX_TTL_SECONDS,
  MEMORY_MAX_WINDOW_SIZE,
} from './memory.constants';

export interface MemoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ─── Push de nova mensagem ─────────────────────────────────────────────────

  /**
   * Adiciona uma mensagem ao contexto Redis da conversa.
   *
   * Operação: LPUSH (insere no topo) + LTRIM (mantém janela) + EXPIRE (TTL deslizante)
   * Complexidade: O(1) amortizado — operação atômica via pipeline
   *
   * @param conversationId  UUID da conversa
   * @param role            'USER' | 'ASSISTANT'
   * @param content         Texto da mensagem (null/vazio = ignorado)
   * @param windowSize      Tamanho da janela (agent.contextWindowSize)
   */
  async pushMessage(
    conversationId: string,
    role: 'USER' | 'ASSISTANT',
    content: string | null,
    windowSize: number,
  ): Promise<void> {
    if (!content?.trim()) return; // não persiste mensagens vazias no contexto

    const key = this.ctxKey(conversationId);
    const effectiveWindow = Math.min(windowSize, MEMORY_MAX_WINDOW_SIZE);
    const entry: MemoryMessage = { role, content };

    try {
      await this.cache.lpushTrimExpire(
        key,
        JSON.stringify(entry),
        effectiveWindow,
        MEMORY_CTX_TTL_SECONDS,
      );
    } catch (err) {
      // Falha no Redis não deve impedir o fluxo principal — o Postgres é o fallback
      this.logger.warn(
        `Failed to push message to Redis context for conversation ${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  // ─── Leitura de contexto ───────────────────────────────────────────────────

  /**
   * Retorna a janela de contexto da conversa para o modelo de IA.
   *
   * Estratégia de duas camadas:
   *   1. Tenta Redis (LRANGE — sub-milissegundo)
   *   2. Se miss → consulta PostgreSQL → aquece Redis → retorna
   *
   * Retorno: mensagens em ORDEM CRONOLÓGICA (mais antiga → mais recente)
   * Isso é o formato esperado pela Responses API da OpenAI.
   *
   * @param conversationId  UUID da conversa
   * @param windowSize      Máximo de mensagens a retornar
   */
  async getContext(
    conversationId: string,
    windowSize: number,
  ): Promise<MemoryMessage[]> {
    const effectiveWindow = Math.min(windowSize, MEMORY_MAX_WINDOW_SIZE);

    // ── Camada 1: Redis ────────────────────────────────────────────────────────
    try {
      const hot = await this.readFromRedis(conversationId);
      if (hot.length > 0) {
        this.logger.debug(
          `Memory HIT (Redis): conversation=${conversationId}, messages=${hot.length}`,
        );
        // Retorna as últimas effectiveWindow mensagens, já em ordem cronológica
        return hot.slice(-effectiveWindow);
      }
    } catch (err) {
      this.logger.warn(
        `Redis context read failed for ${conversationId}, falling back to DB: ${(err as Error).message}`,
      );
    }

    // ── Camada 2: PostgreSQL (fallback) ────────────────────────────────────────
    this.logger.debug(
      `Memory MISS (Redis cold): conversation=${conversationId} — loading from PostgreSQL`,
    );
    return this.loadFromDatabase(conversationId, effectiveWindow);
  }

  // ─── Evicção de contexto ───────────────────────────────────────────────────

  /**
   * Remove o contexto Redis de uma conversa.
   * Chamado quando a conversa é fechada, transferida para humano, ou encerrada
   * por inatividade. Libera memória Redis imediatamente (sem esperar TTL).
   */
  async evict(conversationId: string): Promise<void> {
    try {
      await this.cache.del(this.ctxKey(conversationId));
      this.logger.debug(`Redis context evicted for conversation ${conversationId}`);
    } catch (err) {
      this.logger.warn(
        `Failed to evict Redis context for ${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  // ─── Aquecimento manual de cache ───────────────────────────────────────────

  /**
   * Carrega histórico do PostgreSQL e popula Redis.
   * Útil para pré-aquecer contexto antes de uma resposta (opcional).
   * O getContext() já faz isso automaticamente no fallback.
   */
  async warmCache(conversationId: string, windowSize: number): Promise<void> {
    const messages = await this.loadFromDatabaseRaw(conversationId, windowSize);
    if (messages.length === 0) return;

    const key = this.ctxKey(conversationId);
    const effectiveWindow = Math.min(windowSize, MEMORY_MAX_WINDOW_SIZE);

    try {
      // Inserimos em ordem reversa (mais antiga primeiro no LPUSH)
      // para que o topo da lista fique com a mensagem mais recente
      for (const msg of messages) {
        await this.cache.lpushTrimExpire(
          key,
          JSON.stringify(msg),
          effectiveWindow,
          MEMORY_CTX_TTL_SECONDS,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to warm Redis cache for ${conversationId}: ${(err as Error).message}`);
    }
  }

  // ─── Internos ─────────────────────────────────────────────────────────────

  private ctxKey(conversationId: string): string {
    return `${MEMORY_KEY_CTX}${conversationId}`;
  }

  /**
   * Lê a lista do Redis e devolve em ordem cronológica.
   * LRANGE 0 -1 devolve [newest, ..., oldest] (LPUSH insere no topo).
   * Invertemos para [oldest, ..., newest] — formato esperado pela OpenAI.
   */
  private async readFromRedis(conversationId: string): Promise<MemoryMessage[]> {
    const raw = await this.cache.lrange(this.ctxKey(conversationId), 0, -1);
    if (!raw || raw.length === 0) return [];

    const parsed: MemoryMessage[] = [];
    for (const item of raw) {
      try {
        parsed.push(JSON.parse(item) as MemoryMessage);
      } catch {
        // item corrompido — ignora
      }
    }

    // Lista está [newest...oldest] → invertemos para ordem cronológica
    return parsed.reverse();
  }

  /**
   * Consulta o PostgreSQL e aquece o Redis com o resultado.
   */
  private async loadFromDatabase(
    conversationId: string,
    windowSize: number,
  ): Promise<MemoryMessage[]> {
    const messages = await this.loadFromDatabaseRaw(conversationId, windowSize);
    if (messages.length === 0) return [];

    // Aquece Redis em background (fire-and-forget) — não bloqueia a resposta
    this.warmCacheFromMessages(conversationId, messages, windowSize).catch((err) =>
      this.logger.warn(`Async cache warm failed for ${conversationId}: ${(err as Error).message}`),
    );

    return messages;
  }

  /**
   * Query pura no PostgreSQL — sem efeitos colaterais.
   * Retorna mensagens em ordem cronológica (mais antiga → mais recente).
   */
  private async loadFromDatabaseRaw(
    conversationId: string,
    windowSize: number,
  ): Promise<MemoryMessage[]> {
    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        role: { in: ['USER', 'ASSISTANT'] },
        content: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: windowSize,
      select: { role: true, content: true },
    });

    // DESC → invertemos para ordem cronológica
    return rows
      .reverse()
      .map((m) => ({
        role: m.role as 'USER' | 'ASSISTANT',
        content: m.content!,
      }));
  }

  /**
   * Popula Redis com uma lista de mensagens já em ordem cronológica.
   * Como LPUSH insere no topo, inserimos da mais antiga para a mais nova.
   */
  private async warmCacheFromMessages(
    conversationId: string,
    messages: MemoryMessage[],
    windowSize: number,
  ): Promise<void> {
    const key = this.ctxKey(conversationId);
    const effectiveWindow = Math.min(windowSize, MEMORY_MAX_WINDOW_SIZE);

    for (const msg of messages) {
      await this.cache.lpushTrimExpire(
        key,
        JSON.stringify(msg),
        effectiveWindow,
        MEMORY_CTX_TTL_SECONDS,
      );
    }
  }
}
