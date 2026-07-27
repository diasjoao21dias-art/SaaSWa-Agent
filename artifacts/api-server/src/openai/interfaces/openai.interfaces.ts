// =============================================================================
// OpenAI Responses API — Interfaces TypeScript
// Representa os contratos da nova Responses API (OpenAI SDK v5)
// Nenhuma regra de negócio — apenas tipos de infraestrutura.
// =============================================================================

// ─── Input de mensagem para a Responses API ───────────────────────────────────

export interface ResponseInputMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Parâmetros para criação de uma resposta ──────────────────────────────────

export interface CreateResponseParams {
  /** Modelo OpenAI a usar (ex: "gpt-4o", "gpt-4o-mini") */
  model: string;
  /** Prompt do sistema montado pelo PromptBuilderService */
  instructions: string;
  /** Histórico de mensagens da conversa */
  input: ResponseInputMessage[];
  /** Temperatura de amostragem (0–2). Padrão: 0.7 */
  temperature?: number;
  /** Limite máximo de tokens gerados. Padrão: 1024 */
  maxOutputTokens?: number;
  /** Top-p nucleus sampling (0–1). Padrão: 1 */
  topP?: number;
}

// ─── Resultado de uma resposta gerada ─────────────────────────────────────────

export interface CreateResponseResult {
  /** Texto da resposta gerada */
  text: string;
  /** ID da resposta no OpenAI (para rastreabilidade) */
  responseId: string;
  /** Tokens consumidos na entrada (prompt + histórico) */
  inputTokens: number;
  /** Tokens gerados na saída (resposta) */
  outputTokens: number;
  /** Tempo total de processamento em ms */
  latencyMs: number;
  /** Modelo efetivamente utilizado */
  model: string;
}

// ─── Modelos disponíveis ──────────────────────────────────────────────────────

export interface AvailableModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  outputLimit: number;
  recommended?: boolean;
}
