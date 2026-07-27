// =============================================================================
// Evolution API — TypeScript Interfaces
// Representa os contratos de resposta da Evolution API (v2 / Baileys)
// Nenhuma regra de negócio aqui — apenas tipos de infraestrutura.
// =============================================================================

// ─── Status de conexão retornado pelo Evolution API ───────────────────────────

export type EvolutionConnectionState =
  | 'open'      // Conectado
  | 'connecting'
  | 'close'     // Desconectado
  | 'refused';

// ─── Resposta de criação de instância ─────────────────────────────────────────

export interface EvolutionCreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash?: {
    apikey: string;
  };
  settings?: {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
  };
  qrcode?: {
    pairingCode: string | null;
    code: string;
    base64: string;
    count: number;
  };
}

// ─── Resposta de conexão / QR Code ────────────────────────────────────────────

export interface EvolutionConnectResponse {
  pairingCode: string | null;
  code: string;
  base64: string;    // "data:image/png;base64,..."
  count: number;
}

// ─── Estado de conexão ────────────────────────────────────────────────────────

export interface EvolutionConnectionStateResponse {
  instance: {
    instanceName: string;
    state: EvolutionConnectionState;
  };
}

// ─── Webhook de evento de conexão (connection.update) ─────────────────────────

export interface EvolutionConnectionUpdateData {
  instance: string;
  state: EvolutionConnectionState;
  statusReason?: number;
}

// ─── Webhook de QR Code (qrcode.updated) ──────────────────────────────────────

export interface EvolutionQrCodeUpdatedData {
  qrcode: {
    instance: string;
    pairingCode: string | null;
    code: string;
    base64: string;
    count: number;
  };
}

// ─── Estrutura da mensagem recebida (messages.upsert) ─────────────────────────

export interface EvolutionMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  participant?: string;
}

export interface EvolutionTextMessage {
  conversation?: string;
  extendedTextMessage?: { text: string; contextInfo?: Record<string, unknown> };
}

export interface EvolutionImageMessage {
  caption?: string;
  mimetype: string;
  url?: string;
  directPath?: string;
  mediaKey?: string;
  fileEncSha256?: string;
  fileSha256?: string;
  fileLength?: string;
}

export interface EvolutionAudioMessage {
  url?: string;
  directPath?: string;
  mediaKey?: string;
  mimetype: string;
  ptt?: boolean;   // true = mensagem de voz
  seconds?: number;
  fileEncSha256?: string;
  fileSha256?: string;
}

export interface EvolutionDocumentMessage {
  url?: string;
  directPath?: string;
  mimetype: string;
  title?: string;
  fileName?: string;
  caption?: string;
  mediaKey?: string;
  fileEncSha256?: string;
  fileSha256?: string;
  fileLength?: string;
}

export interface EvolutionVideoMessage {
  caption?: string;
  mimetype: string;
  url?: string;
  directPath?: string;
  mediaKey?: string;
  seconds?: number;
}

export interface EvolutionLocationMessage {
  degreesLatitude: number;
  degreesLongitude: number;
  name?: string;
  address?: string;
}

export interface EvolutionStickerMessage {
  url?: string;
  directPath?: string;
  mimetype: string;
  isAnimated?: boolean;
}

export interface EvolutionReactionMessage {
  key: EvolutionMessageKey;
  text: string; // emoji
}

export interface EvolutionMessageContent {
  conversation?: string;
  extendedTextMessage?: EvolutionTextMessage['extendedTextMessage'];
  imageMessage?: EvolutionImageMessage;
  audioMessage?: EvolutionAudioMessage;
  documentMessage?: EvolutionDocumentMessage;
  videoMessage?: EvolutionVideoMessage;
  locationMessage?: EvolutionLocationMessage;
  stickerMessage?: EvolutionStickerMessage;
  reactionMessage?: EvolutionReactionMessage;
}

export interface EvolutionMessageUpsertItem {
  key: EvolutionMessageKey;
  pushName?: string;
  message?: EvolutionMessageContent;
  messageType?: string;
  messageTimestamp?: number;
  instanceId?: string;
  source?: string;
  messageContextInfo?: Record<string, unknown>;
  // Media download URL (resolved by Evolution API)
  mediaUrl?: string;
}

// ─── Webhook de update de status de mensagem (messages.update) ────────────────

export interface EvolutionMessageUpdateItem {
  key: EvolutionMessageKey;
  update: {
    status: 'ERROR' | 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
  };
}

// ─── Resposta de envio de mensagem ────────────────────────────────────────────

export interface EvolutionSendMessageResponse {
  key: EvolutionMessageKey;
  message?: EvolutionMessageContent;
  messageTimestamp?: string | number;
  status?: string;
}

// ─── Configuração de webhook ──────────────────────────────────────────────────

export interface EvolutionWebhookConfig {
  url: string;
  webhook_by_events: boolean;
  webhook_base64: boolean;
  events: string[];
}

// ─── Todos os eventos suportados pelo Evolution API ───────────────────────────

export const EVOLUTION_EVENTS = [
  'APPLICATION_STARTUP',
  'QRCODE_UPDATED',
  'MESSAGES_SET',
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'MESSAGES_DELETE',
  'SEND_MESSAGE',
  'CONTACTS_SET',
  'CONTACTS_UPSERT',
  'CONTACTS_UPDATE',
  'PRESENCE_UPDATE',
  'CHATS_SET',
  'CHATS_UPSERT',
  'CHATS_UPDATE',
  'CHATS_DELETE',
  'GROUPS_UPSERT',
  'GROUP_UPDATE',
  'GROUP_PARTICIPANTS_UPDATE',
  'CONNECTION_UPDATE',
  'LABELS_EDIT',
  'LABELS_ASSOCIATION',
  'CALL',
  'TYPEBOT_START',
  'TYPEBOT_CHANGE_FLOW',
] as const;

export type EvolutionEvent = (typeof EVOLUTION_EVENTS)[number];

// ─── Eventos essenciais que queremos receber ───────────────────────────────────

export const ESSENTIAL_EVENTS: string[] = [
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'CONNECTION_UPDATE',
  'QRCODE_UPDATED',
];
