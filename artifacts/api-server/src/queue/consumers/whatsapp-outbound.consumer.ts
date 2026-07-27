// =============================================================================
// WhatsappOutboundConsumer — Consumer de Fila de Envio
//
// RESPONSABILIDADE: Processar jobs de envio outbound (texto, imagem, áudio,
// vídeo, documento, localização) e jobs de reconexão automática.
//
// Usa EvolutionApiService para todas as chamadas HTTP — nunca faz HTTP direto.
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EvolutionApiService } from '../../evolution/evolution-api.service';
import {
  QUEUE_WHATSAPP_OUTBOUND,
  JOB_SEND_WHATSAPP_MESSAGE,
  JOB_RECONNECT_WHATSAPP_INSTANCE,
} from '../queue.constants';
import type { WhatsappOutboundJobData, WhatsappReconnectJobData } from '../producers/whatsapp-outbound.producer';

@Processor(QUEUE_WHATSAPP_OUTBOUND, { concurrency: 20 })
export class WhatsappOutboundConsumer extends WorkerHost {
  private readonly logger = new Logger(WhatsappOutboundConsumer.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly evolution: EvolutionApiService,
  ) {
    super();
  }

  async process(job: Job<WhatsappOutboundJobData | WhatsappReconnectJobData>): Promise<void> {
    switch (job.name) {
      case JOB_SEND_WHATSAPP_MESSAGE:
        return this.processSend(job as Job<WhatsappOutboundJobData>);
      case JOB_RECONNECT_WHATSAPP_INSTANCE:
        return this.processReconnect(job as Job<WhatsappReconnectJobData>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ─── Envio de mensagem ────────────────────────────────────────────────────────

  private async processSend(job: Job<WhatsappOutboundJobData>): Promise<void> {
    const { instanceName, recipientPhone, messageType, messageId } = job.data;

    try {
      await this.dispatchByType(job.data);

      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });

      this.logger.debug(`[${messageType}] sent to ${recipientPhone} via ${instanceName}`);
    } catch (error) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error; // deixa BullMQ gerenciar o retry
    }
  }

  /**
   * Despacha o tipo correto de mensagem para o EvolutionApiService.
   * Nenhuma regra de negócio aqui — apenas mapeamento tipo → método HTTP.
   */
  private async dispatchByType(data: WhatsappOutboundJobData): Promise<void> {
    const { instanceName, recipientPhone, messageType } = data;

    switch (messageType) {
      case 'text':
        if (!data.content) throw new Error('content is required for text message');
        await this.evolution.sendText(instanceName, recipientPhone, data.content);
        break;

      case 'image':
        if (!data.mediaUrl) throw new Error('mediaUrl is required for image message');
        await this.evolution.sendImage(instanceName, recipientPhone, data.mediaUrl, data.mediaCaption);
        break;

      case 'audio':
        if (!data.mediaUrl) throw new Error('mediaUrl is required for audio message');
        await this.evolution.sendAudio(instanceName, recipientPhone, data.mediaUrl);
        break;

      case 'video':
        if (!data.mediaUrl) throw new Error('mediaUrl is required for video message');
        await this.evolution.sendVideo(instanceName, recipientPhone, data.mediaUrl, data.mediaCaption);
        break;

      case 'document':
        if (!data.mediaUrl) throw new Error('mediaUrl is required for document message');
        if (!data.mediaFileName) throw new Error('mediaFileName is required for document message');
        await this.evolution.sendDocument(
          instanceName,
          recipientPhone,
          data.mediaUrl,
          data.mediaFileName,
          data.mediaCaption,
        );
        break;

      case 'location':
        if (data.latitude == null || data.longitude == null) {
          throw new Error('latitude and longitude are required for location message');
        }
        await this.evolution.sendLocation(
          instanceName,
          recipientPhone,
          data.latitude,
          data.longitude,
          data.locationName,
          data.locationAddress,
        );
        break;

      default:
        throw new Error(`Unsupported message type: ${String(messageType)}`);
    }
  }

  // ─── Reconexão automática ─────────────────────────────────────────────────────

  /**
   * Processa job de reconexão automática.
   *
   * Estratégia:
   *   1. Restart da instância no Evolution API
   *   2. O Evolution API tentará restaurar a sessão Baileys salva
   *   3. Se a sessão ainda for válida, conecta automaticamente sem QR Code
   *   4. Se inválida, emitirá evento qrcode.updated → status QR_CODE no banco
   *
   * BullMQ gerencia retries com backoff exponencial conforme RECONNECT_JOB_OPTIONS.
   */
  private async processReconnect(job: Job<WhatsappReconnectJobData>): Promise<void> {
    const { instanceName, attemptCount } = job.data;

    this.logger.log(
      `Auto-reconnect attempt ${attemptCount + 1} for instance "${instanceName}"`,
    );

    // Verifica se a instância ainda existe no banco antes de tentar reconectar
    const waNumber = await this.prisma.whatsappNumber.findFirst({
      where: { instanceName, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!waNumber) {
      this.logger.warn(`Reconnect aborted: instance "${instanceName}" not found in DB`);
      return; // Aborta sem retry
    }

    // Não reconecta se já foi conectado por outro meio (ex: scan manual de QR)
    if (waNumber.status === 'CONNECTED') {
      this.logger.debug(`Reconnect skipped: "${instanceName}" already CONNECTED`);
      return;
    }

    try {
      // Restart → Evolution API tenta restaurar sessão Baileys
      await this.evolution.restartInstance(instanceName);

      // Atualiza status para INITIALIZING no banco
      await this.prisma.whatsappNumber.update({
        where: { id: waNumber.id },
        data: { status: 'INITIALIZING', updatedAt: new Date() },
      });

      this.logger.log(`Reconnect restart triggered for "${instanceName}"`);
      // O status final (CONNECTED ou QR_CODE) chegará via webhook connection.update
    } catch (error) {
      this.logger.error(
        `Reconnect failed for "${instanceName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error; // BullMQ fará retry com backoff exponencial
    }
  }

  // ─── Eventos de worker ────────────────────────────────────────────────────────

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job "${job.name}" (id=${job.id}) failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Job "${job.name}" (id=${job.id}) completed`);
  }
}
