// =============================================================================
// WhatsappService — Camada de Regras de Negócio
//
// RESPONSABILIDADE: Orquestrar operações de WhatsApp com aplicação de
// regras de negócio: isolamento de tenant, validações, limites de plano,
// persistência de sessão, enfileiramento de mensagens.
//
// PROIBIDO neste serviço:
//   ✗ Chamadas HTTP diretas para Evolution API (use EvolutionApiService)
//   ✗ Lógica de formatação de payload HTTP
//
// PERMITIDO neste serviço:
//   ✓ Regras de negócio e validações
//   ✓ Persistência via WhatsappRepository
//   ✓ Delegação de envio via WhatsappOutboundProducer (BullMQ)
//   ✓ Orquestração de EvolutionApiService
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappRepository } from './whatsapp.repository';
import { EvolutionApiService } from '../../evolution/evolution-api.service';
import { WhatsappOutboundProducer } from '../../queue/producers/whatsapp-outbound.producer';
import {
  WhatsappNumberNotFoundException,
  WhatsappInstanceException,
  WhatsappNumberNotConnectedException,
  WhatsappInvalidMessageException,
} from './exceptions/whatsapp.exceptions';
import type { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import { OutboundMessageType } from './dto/send-message.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly repo: WhatsappRepository,
    private readonly evolution: EvolutionApiService,
    private readonly outboundProducer: WhatsappOutboundProducer,
    private readonly configService: ConfigService,
  ) {}

  // ─── Criação de instância ─────────────────────────────────────────────────────

  /**
   * Cria uma nova conexão WhatsApp para o tenant.
   * Fluxo:
   *   1. Cria a instância no Evolution API
   *   2. Persiste o registro no banco
   *   3. Configura o webhook da instância apontando para nossa API
   */
  async create(tenantId: string, dto: CreateWhatsappNumberDto) {
    // Regra de negócio: criar instância no Evolution API
    try {
      await this.evolution.createInstance(dto.instanceName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create Evolution API instance';
      throw new WhatsappInstanceException(msg);
    }

    // Persistir no banco
    const record = await this.repo.create(tenantId, dto);

    // Configurar webhook da instância — aponta de volta para nossa API
    const webhookUrl = this.buildWebhookUrl();
    try {
      await this.evolution.configureWebhook(dto.instanceName, webhookUrl);
    } catch (err) {
      // Não aborta a criação se a configuração do webhook falhar;
      // será configurado manualmente ou via retry
      this.logger.warn(`Could not configure webhook for ${dto.instanceName}: ${err instanceof Error ? err.message : String(err)}`);
    }

    this.logger.log(`WhatsApp number created: ${dto.instanceName} for tenant ${tenantId}`);
    return record;
  }

  // ─── Consultas ─────────────────────────────────────────────────────────────────

  async findById(id: string, tenantId: string) {
    const num = await this.repo.findById(id, tenantId);
    if (!num) throw new WhatsappNumberNotFoundException(id);
    return num;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  // ─── QR Code ──────────────────────────────────────────────────────────────────

  /**
   * Solicita o QR Code para autenticação e salva no banco.
   * Status transiciona para QR_CODE até que connection.update informe CONNECTED.
   */
  async getQrCode(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);

    let qrData: { base64: string };
    try {
      qrData = await this.evolution.getQrCode(num.instanceName);
    } catch (err) {
      throw new WhatsappInstanceException(err instanceof Error ? err.message : 'Failed to get QR code');
    }

    // Persiste QR com TTL de 60 segundos (QR codes do WhatsApp expiram em ~60s)
    await this.repo.updateStatus(id, 'QR_CODE', {
      qrCode: qrData.base64,
      qrCodeExpiresAt: new Date(Date.now() + 60_000),
    });

    return { qrCode: qrData.base64, expiresIn: 60 };
  }

  // ─── Conexão / Desconexão ─────────────────────────────────────────────────────

  /**
   * Desconecta o número WhatsApp.
   * O status DISCONNECTED é confirmado via webhook connection.update,
   * mas já atualizamos o banco aqui para feedback imediato ao usuário.
   */
  async disconnect(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);

    try {
      await this.evolution.disconnectInstance(num.instanceName);
    } catch {
      // Log mas não falha — instância pode já estar desconectada
      this.logger.warn(`Soft disconnect failure for ${num.instanceName} — continuing`);
    }

    return this.repo.updateStatus(id, 'DISCONNECTED');
  }

  /**
   * Reconecta manualmente uma instância.
   * Reinicia a instância no Evolution API e solicita novo QR Code.
   */
  async reconnect(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);

    try {
      await this.evolution.restartInstance(num.instanceName);
    } catch (err) {
      throw new WhatsappInstanceException(`Failed to restart instance: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Atualiza para QR_CODE (aguarda scan)
    await this.repo.updateStatus(id, 'QR_CODE', {
      qrCode: null,
      qrCodeExpiresAt: null,
    });

    // Solicita novo QR Code
    return this.getQrCode(id, tenantId);
  }

  // ─── Envio de mensagens ───────────────────────────────────────────────────────

  /**
   * Valida e enfileira o envio de qualquer tipo de mensagem.
   *
   * Regra de negócio: apenas números CONNECTED podem enviar mensagens.
   * O envio real é feito de forma assíncrona pelo WhatsappOutboundConsumer.
   *
   * O caller é responsável por fornecer um conversationId e messageId já
   * criados no banco (via MessagesService), pois o envio é desacoplado.
   */
  async sendMessage(
    id: string,
    tenantId: string,
    dto: SendMessageDto,
    conversationId: string,
    messageId: string,
  ) {
    const num = await this.findById(id, tenantId);

    // Regra: só envia se estiver conectado
    if (num.status !== 'CONNECTED') {
      throw new WhatsappNumberNotConnectedException(num.instanceName);
    }

    // Validações por tipo
    this.validateMessagePayload(dto);

    await this.outboundProducer.enqueue({
      tenantId,
      conversationId,
      messageId,
      instanceName: num.instanceName,
      recipientPhone: dto.recipientPhone,
      messageType: dto.type,
      content: dto.text,
      mediaUrl: dto.mediaUrl,
      mediaCaption: dto.caption,
      mediaFileName: dto.fileName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.locationName,
      locationAddress: dto.locationAddress,
    });

    return { queued: true, messageId };
  }

  // ─── Atribuição de agente ──────────────────────────────────────────────────────

  async assignAgent(id: string, tenantId: string, agentId: string | null) {
    await this.findById(id, tenantId);
    return this.repo.update(id, { agentId });
  }

  // ─── Remoção ──────────────────────────────────────────────────────────────────

  async remove(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);

    try {
      await this.evolution.deleteInstance(num.instanceName);
    } catch {
      this.logger.warn(`Could not delete Evolution instance ${num.instanceName}`);
    }

    await this.repo.softDelete(id);
  }

  // ─── Atualização de status (chamado pelo WebhookInboundConsumer) ───────────────

  /**
   * Atualiza o status de conexão a partir de evento de webhook.
   * Chamado pelo WebhookInboundConsumer — não pelo controller.
   */
  async handleConnectionUpdate(
    instanceName: string,
    state: 'open' | 'connecting' | 'close' | 'refused',
    statusReason?: number,
  ) {
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

    if (state === 'close' || state === 'refused') {
      // Persiste motivo da desconexão na sessionData para diagnóstico
      const record = await this.repo.findByInstanceName(instanceName);
      if (record) {
        const currentSession = (record.sessionData as Record<string, unknown>) ?? {};
        await this.repo.saveSession(instanceName, {
          ...currentSession,
          lastDisconnectReason: statusReason,
          lastDisconnectAt: new Date().toISOString(),
        });
      }
    }

    await this.repo.updateStatusByInstanceName(instanceName, newStatus, extra);

    this.logger.log(`Connection update for ${instanceName}: ${state} → ${newStatus}`);
  }

  /**
   * Atualiza o QR Code a partir de evento de webhook.
   */
  async handleQrCodeUpdated(instanceName: string, base64: string) {
    const record = await this.repo.findByInstanceName(instanceName);
    if (!record) return;

    await this.repo.updateStatus(record.id, 'QR_CODE', {
      qrCode: base64,
      qrCodeExpiresAt: new Date(Date.now() + 60_000),
    });

    this.logger.debug(`QR Code updated for ${instanceName}`);
  }

  // ─── Validações privadas ──────────────────────────────────────────────────────

  private validateMessagePayload(dto: SendMessageDto): void {
    switch (dto.type) {
      case OutboundMessageType.TEXT:
        if (!dto.text?.trim()) {
          throw new WhatsappInvalidMessageException('text is required for type=text');
        }
        break;

      case OutboundMessageType.IMAGE:
      case OutboundMessageType.VIDEO:
        if (!dto.mediaUrl) {
          throw new WhatsappInvalidMessageException(`mediaUrl is required for type=${dto.type}`);
        }
        break;

      case OutboundMessageType.AUDIO:
        if (!dto.mediaUrl) {
          throw new WhatsappInvalidMessageException('mediaUrl is required for type=audio');
        }
        break;

      case OutboundMessageType.DOCUMENT:
        if (!dto.mediaUrl) {
          throw new WhatsappInvalidMessageException('mediaUrl is required for type=document');
        }
        if (!dto.fileName) {
          throw new WhatsappInvalidMessageException('fileName is required for type=document');
        }
        break;

      case OutboundMessageType.LOCATION:
        if (dto.latitude == null || dto.longitude == null) {
          throw new WhatsappInvalidMessageException('latitude and longitude are required for type=location');
        }
        break;
    }
  }

  private buildWebhookUrl(): string {
    const publicUrl = this.configService.get<string>('app.publicUrl', '');
    const prefix = this.configService.get<string>('app.globalPrefix', 'api');
    if (!publicUrl) return '';
    return `${publicUrl}/${prefix}/v1/webhooks/evolution`;
  }
}
