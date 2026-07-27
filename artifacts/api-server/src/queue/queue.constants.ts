export const QUEUE_AI_RESPONSE = 'ai-response';
export const QUEUE_WHATSAPP_OUTBOUND = 'whatsapp-outbound';
export const QUEUE_WEBHOOK_INBOUND = 'webhook-inbound';

export const JOB_PROCESS_INCOMING_MESSAGE = 'process-incoming-message';
export const JOB_SEND_AI_RESPONSE = 'send-ai-response';
export const JOB_SEND_WHATSAPP_MESSAGE = 'send-whatsapp-message';
export const JOB_DELIVER_WEBHOOK = 'deliver-webhook';

export const QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
