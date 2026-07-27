// =============================================================================
// WebhookInboundConsumer — Consumer de Webhooks do Evolution API
//
// RESPONSABILIDADE: Processar todos os eventos inbound do Evolution API:
//   • messages.upsert      — mensagem recebida (text, image, audio, doc, location…)
//   • messages.update      — atualização de status de entrega (sent/delivered/read)
//   • connection.update    — mudança de estado de conexão → agenda reconexão
//   • qrcode.updated       — novo QR Code disponível → atualiza banco
//
// Este consumer não contém regras de negócio de IA ou de tenant.
// Delega para AiResponseProducer e WhatsappOutboundProducer quando necessário.
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiResponseProducer } from '../producers/ai-response.producer';
import { WhatsappOutboundProducer } from '../producers/whatsapp-outbound.producer';
import { ConversationMemoryService } from '../../memory/conversation-memory.service';
import {
  QUEUE_WEBHOOK_INBOUND,
  JOB_PROCESS_INCOMING_MESSAGE,
} from '../queue.constants';
import type { WebhookInboundJobData } from '../producers/webhook-inbound.producer';
import type {
  EvolutionMessageUpsertItem,
  EvolutionMessageUpdateItem,
  EvolutionConnectionUpdateData,
  EvolutionQrCodeUpdatedData,
  EvolutionMessageContent,
} from '../../evolution/interfaces/evolution.interfaces';

import { MEMORY_MAX_WINDOW_SIZE } from '../../memory/memory.constants';

// Tipo interno para a mensagem persistida (extraído do MessageType do Prisma)
type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'STICKER' | 'REACTION';

// Mapeamento de status Evolution → status do nosso banco
const EVOLUTION_STATUS_MAP: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
  SERVER_ACK: 'SENT',
  DELIVERY_ACK: 'DELIVERED',
  READ: 'READ',
  PLAYED: 'READ',   // Áudio ouvido = equivalente a READ
  ERROR: 'FAILED',
};

@Processor(QUEUE_WEBHOOK_INBOUND, { concurrency: 10 })
export class WebhookInboundConsumer extends WorkerHost {
  private readonly logger = new Logger(WebhookInboundConsumer.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiResponseProducer) private readonly aiProducer: AiResponseProducer,
    @Inject(WhatsappOutboundProducer) private readonly reconnectProducer: WhatsappOutboundProducer,
    @Inject(ConversationMemoryService) private readonly memory: ConversationMemoryService,
  ) {
    super();
  }

  async process(job: Job<WebhookInboundJobData>): Promise<void> {
    if (job.name !== JOB_PROCESS_INCOMING_MESSAGE) return;

    const { instanceName, event } = job.data;
    const normalizedEvent = event.toLowerCase().replace('.', '_').replace('.', '_');

    this.logger.debug(`Processing event "${event}" for instance "${instanceName}"`);

    // Despacha para o handler correto por evento
    if (event === 'messages.upsert' || event === 'message') {
      await this.handleMessageUpsert(instanceName, job.data);
    } else if (event === 'messages.update') {
      await this.handleMessageUpdate(instanceName, job.data);
    } else if (event === 'connection.update') {
      await this.handleConnectionUpdate(instanceName, job.data);
    } else if (event === 'qrcode.updated') {
      await this.handleQrCodeUpdated(instanceName, job.data);
    } else {
      this.logger.debug(`Unhandled event "${event}" — skipping`);
    }
  }

  // ─── messages.upsert ─────────────────────────────────────────────────────────

  private async handleMessageUpsert(
    instanceName: string,
    jobData: WebhookInboundJobData,
  ): Promise<void> {
    const payload = jobData.payload as Record<string, unknown>;
    const data = payload['data'] as EvolutionMessageUpsertItem | undefined;

    if (!data) return;

    const { key, pushName, message } = data;
    if (!key) return;

    // Ignora mensagens enviadas por nós
    if (key.fromMe) return;

    // Ignora grupos (remoteJid termina com @g.us)
    if (key.remoteJid?.endsWith('@g.us')) {
      this.logger.debug(`Group message ignored: ${key.remoteJid}`);
      return;
    }

    const remoteJid = key.remoteJid ?? '';
    const customerPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@s.whatsapp.net', '');
    if (!customerPhone) return;

    // Resolve a instância no banco
    const waNumber = await this.prisma.whatsappNumber.findFirst({
      where: { instanceName, deletedAt: null },
      select: { id: true, tenantId: true, agentId: true },
    });

    if (!waNumber) {
      this.logger.warn(`Instance "${instanceName}" not found in DB — skipping`);
      return;
    }

    // Upsert do cliente
    let customer = await this.prisma.customer.findFirst({
      where: { tenantId: waNumber.tenantId, phone: customerPhone, deletedAt: null },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId: waNumber.tenantId,
          phone: customerPhone,
          name: pushName ?? customerPhone,
        },
      });
    } else if (pushName && !customer.name) {
      // Atualiza nome se ainda não tinha
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: pushName, lastSeenAt: new Date() },
      });
    } else {
      // Atualiza lastSeenAt
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeenAt: new Date() },
      });
    }

    // Get or create conversa ativa
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: waNumber.tenantId,
        customerId: customer.id,
        whatsappNumberId: waNumber.id,
        status: { in: ['BOT', 'WAITING'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: waNumber.tenantId,
          customerId: customer.id,
          whatsappNumberId: waNumber.id,
          agentId: waNumber.agentId,
          status: 'BOT',
          firstMessageAt: new Date(),
          lastMessageAt: new Date(),
        },
      });
    }

    // Extrai conteúdo e tipo da mensagem
    const { content, type, mediaUrl } = this.extractMessageContent(message);
    const waMessageId = key.id;

    // Salva a mensagem recebida
    // mediaUrl é armazenada em metadata pois o schema usa fileId (relação File)
    // para arquivos persistidos — a URL original fica disponível em metadata.mediaUrl
    const savedMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        type: type as 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'STICKER' | 'REACTION',
        content,
        whatsappMessageId: waMessageId,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        metadata: mediaUrl ? { mediaUrl } : {},
      },
    });

    // Empurra mensagem para o contexto Redis (memória quente).
    // Usamos MEMORY_MAX_WINDOW_SIZE como cap — o AiResponseConsumer lê apenas
    // agent.contextWindowSize entradas (sempre ≤ MEMORY_MAX_WINDOW_SIZE),
    // evitando uma query extra de agente apenas para o push.
    await this.memory.pushMessage(
      conversation.id,
      'USER',
      content,
      MEMORY_MAX_WINDOW_SIZE,
    );

    // Atualiza lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Enfileira resposta de IA se a conversa está em modo BOT e tem agente
    if (conversation.status === 'BOT' && waNumber.agentId) {
      await this.aiProducer.enqueue({
        tenantId: waNumber.tenantId,
        conversationId: conversation.id,
        messageId: savedMessage.id,
        agentId: waNumber.agentId,
        customerPhone,
        whatsappNumberInstanceName: instanceName,
      });
    }
  }

  // ─── messages.update ─────────────────────────────────────────────────────────

  private async handleMessageUpdate(
    instanceName: string,
    jobData: WebhookInboundJobData,
  ): Promise<void> {
    const payload = jobData.payload as Record<string, unknown>;
    const updates = payload['data'] as EvolutionMessageUpdateItem[] | EvolutionMessageUpdateItem | undefined;

    const items = Array.isArray(updates) ? updates : updates ? [updates] : [];

    for (const item of items) {
      const waMessageId = item?.key?.id;
      const evolutionStatus = item?.update?.status;

      if (!waMessageId || !evolutionStatus) continue;

      const dbStatus = EVOLUTION_STATUS_MAP[evolutionStatus];
      if (!dbStatus) continue;

      try {
        await this.prisma.message.updateMany({
          where: { whatsappMessageId: waMessageId },
          data: {
            status: dbStatus,
            ...(dbStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            ...(dbStatus === 'READ' ? { readAt: new Date() } : {}),
          },
        });

        this.logger.debug(`Message status updated: ${waMessageId} → ${dbStatus}`);
      } catch {
        // Mensagem pode não existir no banco (ex: mensagens enviadas por outros meios)
        this.logger.debug(`Could not update status for waMessageId ${waMessageId}`);
      }
    }
  }

  // ─── connection.update ────────────────────────────────────────────────────────

  private async handleConnectionUpdate(
    instanceName: string,
    jobData: WebhookInboundJobData,
  ): Promise<void> {
    const payload = jobData.payload as Record<string, unknown>;
    const data = payload['data'] as EvolutionConnectionUpdateData | undefined;

    if (!data) return;

    const { state, statusReason } = data;

    const statusMap: Record<string, 'CONNECTED' | 'DISCONNECTED' | 'INITIALIZING' | 'ERROR'> = {
      open: 'CONNECTED',
      connecting: 'INITIALIZING',
      close: 'DISCONNECTED',
      refused: 'ERROR',
    };

    const newStatus = statusMap[state] ?? 'DISCONNECTED';
    const extra: Record<string, unknown> = {};

    if (state === 'open') {
      extra['lastConnectedAt'] = new Date();
      extra['qrCode'] = null;
      extra['qrCodeExpiresAt'] = null;
    }

    // Atualiza status no banco
    const updated = await this.prisma.whatsappNumber.updateMany({
      where: { instanceName, deletedAt: null },
      data: { status: newStatus, ...extra, updatedAt: new Date() },
    });

    this.logger.log(`Connection update for "${instanceName}": ${state} → ${newStatus} (reason=${statusReason ?? 'N/A'})`);

    // Persiste motivo da desconexão para diagnóstico
    if (state === 'close' || state === 'refused') {
      await this.prisma.whatsappNumber.updateMany({
        where: { instanceName, deletedAt: null },
        data: {
          sessionData: {
            lastDisconnectReason: statusReason,
            lastDisconnectAt: new Date().toISOString(),
            lastDisconnectState: state,
          },
          updatedAt: new Date(),
        },
      });

      // ── Reconexão automática ──────────────────────────────────────────────────
      // statusReason 401 = não autorizado / sessão expirada → não tenta reconectar
      // statusReason 515 = restart explícito → não tenta reconectar
      const SKIP_RECONNECT_REASONS = [401, 515, 403];
      const shouldReconnect = !SKIP_RECONNECT_REASONS.includes(statusReason ?? -1);

      if (shouldReconnect && updated.count > 0) {
        const waNumber = await this.prisma.whatsappNumber.findFirst({
          where: { instanceName, deletedAt: null },
          select: { tenantId: true },
        });

        if (waNumber) {
          await this.reconnectProducer.scheduleReconnect(
            {
              instanceName,
              tenantId: waNumber.tenantId,
              attemptCount: 0,
            },
            15_000, // aguarda 15s antes da primeira tentativa
          );

          this.logger.log(`Scheduled auto-reconnect for "${instanceName}" in 15s`);
        }
      } else if (SKIP_RECONNECT_REASONS.includes(statusReason ?? -1)) {
        this.logger.warn(
          `Auto-reconnect skipped for "${instanceName}": statusReason=${statusReason} (session expired or unauthorized)`,
        );
      }
    }
  }

  // ─── qrcode.updated ──────────────────────────────────────────────────────────

  private async handleQrCodeUpdated(
    instanceName: string,
    jobData: WebhookInboundJobData,
  ): Promise<void> {
    const payload = jobData.payload as Record<string, unknown>;
    const data = payload['data'] as EvolutionQrCodeUpdatedData | Record<string, unknown> | undefined;

    // O Evolution API pode enviar o QR em diferentes formatos
    const base64 =
      (data as EvolutionQrCodeUpdatedData)?.qrcode?.base64 ??
      (data as Record<string, unknown>)?.['base64'] as string | undefined;

    if (!base64) {
      this.logger.debug(`qrcode.updated for "${instanceName}" — no base64 found`);
      return;
    }

    await this.prisma.whatsappNumber.updateMany({
      where: { instanceName, deletedAt: null },
      data: {
        status: 'QR_CODE',
        qrCode: base64,
        qrCodeExpiresAt: new Date(Date.now() + 60_000),
        updatedAt: new Date(),
      },
    });

    this.logger.debug(`QR Code updated for "${instanceName}"`);
  }

  // ─── Extração de conteúdo de mensagem ─────────────────────────────────────────

  /**
   * Extrai o conteúdo textual, tipo e URL de mídia de qualquer tipo de mensagem.
   * Suporta: text, extendedText, image, audio, video, document, location, sticker, reaction.
   */
  private extractMessageContent(message?: EvolutionMessageContent | null): {
    content: string;
    type: MessageType;
    mediaUrl?: string;
  } {
    if (!message) return { content: '', type: 'TEXT' };

    // ── Texto simples ──────────────────────────────────────────────────────────
    if (message.conversation) {
      return { content: message.conversation, type: 'TEXT' };
    }

    // ── Texto estendido (links, menções) ───────────────────────────────────────
    if (message.extendedTextMessage?.text) {
      return { content: message.extendedTextMessage.text, type: 'TEXT' };
    }

    // ── Imagem ─────────────────────────────────────────────────────────────────
    if (message.imageMessage) {
      const img = message.imageMessage;
      return {
        content: img.caption ?? '[Imagem]',
        type: 'IMAGE',
        mediaUrl: img.url ?? img.directPath,
      };
    }

    // ── Áudio / Voz ────────────────────────────────────────────────────────────
    if (message.audioMessage) {
      const audio = message.audioMessage;
      return {
        content: audio.ptt ? '[Mensagem de voz]' : '[Áudio]',
        type: 'AUDIO',
        mediaUrl: audio.url ?? audio.directPath,
      };
    }

    // ── Vídeo ──────────────────────────────────────────────────────────────────
    if (message.videoMessage) {
      const video = message.videoMessage;
      return {
        content: video.caption ?? '[Vídeo]',
        type: 'VIDEO',
        mediaUrl: video.url ?? video.directPath,
      };
    }

    // ── Documento / PDF ────────────────────────────────────────────────────────
    if (message.documentMessage) {
      const doc = message.documentMessage;
      return {
        content: doc.fileName ?? doc.caption ?? '[Documento]',
        type: 'DOCUMENT',
        mediaUrl: doc.url ?? doc.directPath,
      };
    }

    // ── Localização ────────────────────────────────────────────────────────────
    if (message.locationMessage) {
      const loc = message.locationMessage;
      const parts = [loc.name, loc.address].filter(Boolean);
      const description = parts.length > 0 ? parts.join(', ') : `${loc.degreesLatitude},${loc.degreesLongitude}`;
      return { content: `[Localização: ${description}]`, type: 'LOCATION' };
    }

    // ── Sticker ────────────────────────────────────────────────────────────────
    if (message.stickerMessage) {
      return {
        content: '[Sticker]',
        type: 'STICKER',
        mediaUrl: message.stickerMessage.url ?? message.stickerMessage.directPath,
      };
    }

    // ── Reação ─────────────────────────────────────────────────────────────────
    if (message.reactionMessage) {
      return {
        content: `[Reação: ${message.reactionMessage.text}]`,
        type: 'REACTION',
      };
    }

    return { content: '[Tipo de mensagem não suportado]', type: 'TEXT' };
  }

  // ─── Eventos de worker ────────────────────────────────────────────────────────

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
