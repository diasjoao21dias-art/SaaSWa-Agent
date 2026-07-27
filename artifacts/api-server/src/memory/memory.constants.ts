// =============================================================================
// Memory Constants — Constantes do Sistema de Memória de Conversas
//
// QUANDO USAR REDIS:
//   - Leitura de contexto para resposta de IA (caminho quente, < 1ms)
//   - Conversas ativas: janela deslizante das últimas N mensagens
//   - Cache invalida automaticamente via TTL (2h de inatividade)
//   - Ideal para: alta frequência, baixa latência, dado temporário
//
// QUANDO USAR POSTGRESQL:
//   - Histórico completo e permanente de todas as mensagens
//   - Fallback quando Redis está frio (restart, primeira mensagem, TTL expirado)
//   - Consultas de agentes humanos, auditoria, analytics, relatórios
//   - Ideal para: durabilidade, queries complexas, dado crítico de negócio
// =============================================================================

/** Prefixo da chave Redis para contexto quente de conversa (Redis List) */
export const MEMORY_KEY_CTX = 'conv:ctx:';

/**
 * TTL deslizante do contexto Redis — 2 horas.
 * Reinicia a cada nova mensagem. Expirado automaticamente após inatividade.
 * Motivo: conversas inativas não precisam de contexto em memória quente.
 */
export const MEMORY_CTX_TTL_SECONDS = 7_200; // 2 horas

/**
 * Cap de segurança para o tamanho da janela Redis.
 * Mesmo que agent.contextWindowSize seja maior, nunca armazenamos mais que isso.
 * Protege contra configurações acidentais que sobrecarregariam o Redis.
 */
export const MEMORY_MAX_WINDOW_SIZE = 100;

/**
 * Retenção de mensagens no PostgreSQL (dias).
 * Mensagens mais antigas que isso — em conversas fechadas há tempo suficiente
 * — são soft-deletadas pelo job de limpeza.
 */
export const MEMORY_RETENTION_DAYS = 90;

/**
 * Carência mínima após fechamento de conversa antes de limpar mensagens (dias).
 * Garante que histórico recente esteja disponível para revisão humana.
 */
export const MEMORY_CLOSE_GRACE_DAYS = 30;

/** Tamanho do batch para queries de limpeza — evita locks longos no PostgreSQL */
export const MEMORY_CLEANUP_BATCH_SIZE = 500;

// ─── Queue / Job names ────────────────────────────────────────────────────────

export const QUEUE_MEMORY_CLEANUP = 'memory-cleanup';
export const JOB_CLEANUP_OLD_MESSAGES = 'cleanup-old-messages';
