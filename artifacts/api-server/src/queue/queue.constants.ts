// ─── Queue names ──────────────────────────────────────────────────────────────
export const QUEUE_AI_RESPONSE = 'ai-response';
export const QUEUE_WHATSAPP_OUTBOUND = 'whatsapp-outbound';
export const QUEUE_WEBHOOK_INBOUND = 'webhook-inbound';

// ─── Job names ────────────────────────────────────────────────────────────────
export const JOB_PROCESS_INCOMING_MESSAGE = 'process-incoming-message';
export const JOB_SEND_AI_RESPONSE = 'send-ai-response';
export const JOB_SEND_WHATSAPP_MESSAGE = 'send-whatsapp-message';
export const JOB_DELIVER_WEBHOOK = 'deliver-webhook';

/** Reconexão automática de instâncias desconectadas */
export const JOB_RECONNECT_WHATSAPP_INSTANCE = 'reconnect-whatsapp-instance';

// ─── Default job options ──────────────────────────────────────────────────────
export const QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

/** Opções para job de reconexão: backoff mais agressivo */
export const RECONNECT_JOB_OPTIONS = {
  attempts: 8,
  backoff: {
    type: 'exponential' as const,
    delay: 10_000, // começa em 10s, dobra a cada tentativa (10s, 20s, 40s…)
  },
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 100 },
};
