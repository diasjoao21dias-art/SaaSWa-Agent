import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_WHATSAPP_OUTBOUND,
  JOB_SEND_WHATSAPP_MESSAGE,
  JOB_RECONNECT_WHATSAPP_INSTANCE,
  RECONNECT_JOB_OPTIONS,
} from '../queue.constants';
import type { OutboundMessageType } from '../../modules/whatsapp/dto/send-message.dto';

// ─── Tipos de job ──────────────────────────────────────────────────────────────

export interface WhatsappOutboundJobData {
  tenantId: string;
  conversationId: string;
  messageId: string;
  instanceName: string;
  recipientPhone: string;
  messageType: OutboundMessageType | 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';

  // ─── TEXT ────────────────────────────────────────────────────────────────────
  content?: string;

  // ─── MEDIA (image, audio, video, document) ───────────────────────────────────
  mediaUrl?: string;
  mediaCaption?: string;
  mediaFileName?: string;  // obrigatório para document

  // ─── LOCATION ─────────────────────────────────────────────────────────────────
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}

export interface WhatsappReconnectJobData {
  instanceName: string;
  tenantId: string;
  /** Número de tentativas já feitas (para log/diagnóstico) */
  attemptCount: number;
}

// ─── Producer ─────────────────────────────────────────────────────────────────

@Injectable()
export class WhatsappOutboundProducer {
  constructor(
    @InjectQueue(QUEUE_WHATSAPP_OUTBOUND) private readonly queue: Queue,
  ) {}

  /**
   * Enfileira o envio de qualquer tipo de mensagem outbound.
   */
  async enqueue(data: WhatsappOutboundJobData): Promise<void> {
    await this.queue.add(JOB_SEND_WHATSAPP_MESSAGE, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    });
  }

  /**
   * Agenda reconexão automática com delay inicial.
   * O delay garante que o WhatsApp não considere reconexões muito rápidas
   * como spam e bloqueie temporariamente.
   *
   * @param data Dados da instância a reconectar
   * @param delayMs Delay inicial em ms (padrão: 15 segundos)
   */
  async scheduleReconnect(data: WhatsappReconnectJobData, delayMs = 15_000): Promise<void> {
    await this.queue.add(JOB_RECONNECT_WHATSAPP_INSTANCE, data, {
      ...RECONNECT_JOB_OPTIONS,
      delay: delayMs,
      // jobId único por instância: evita múltiplos jobs de reconexão simultâneos
      jobId: `reconnect:${data.instanceName}`,
    });
  }
}
