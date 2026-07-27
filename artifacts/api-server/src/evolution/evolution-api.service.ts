// =============================================================================
// EvolutionApiService — Camada de Infraestrutura Pura
//
// RESPONSABILIDADE: Única e exclusiva — fazer chamadas HTTP para a Evolution API.
//
// PROIBIDO neste serviço:
//   ✗ Acesso ao banco de dados (Prisma)
//   ✗ Regras de negócio (limites, planos, tenant isolation)
//   ✗ Lógica de conversação / AI
//   ✗ Validações de negócio
//
// PERMITIDO neste serviço:
//   ✓ Chamadas HTTP (axios) para a Evolution API
//   ✓ Tratamento de erros HTTP / rede
//   ✓ Tipagem das respostas
//   ✓ Logging de infraestrutura
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { EvolutionApiException } from './exceptions/evolution-api.exception';
import { ESSENTIAL_EVENTS } from './interfaces/evolution.interfaces';
import type {
  EvolutionCreateInstanceResponse,
  EvolutionConnectResponse,
  EvolutionConnectionStateResponse,
  EvolutionSendMessageResponse,
  EvolutionWebhookConfig,
} from './interfaces/evolution.interfaces';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('evolution.baseUrl');
    const apiKey = this.configService.getOrThrow<string>('evolution.apiKey');

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de log de erros de infraestrutura
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const url = error.config?.url ?? 'unknown';
        const status = error.response?.status ?? 0;
        this.logger.warn(`Evolution API HTTP ${status} on ${url}`);
        return Promise.reject(error);
      },
    );
  }

  // ─── Gerenciamento de Instâncias ─────────────────────────────────────────────

  /**
   * Cria uma nova instância no Evolution API.
   * Equivale a registrar uma "conexão WhatsApp" no gateway.
   */
  async createInstance(instanceName: string): Promise<EvolutionCreateInstanceResponse> {
    try {
      const res = await this.http.post<EvolutionCreateInstanceResponse>('/instance/create', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });
      this.logger.debug(`Instance created: ${instanceName}`);
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('createInstance', this.extractErrorMessage(err));
    }
  }

  /**
   * Solicita QR Code para autenticar o número.
   * Retorna base64 da imagem do QR Code.
   */
  async getQrCode(instanceName: string): Promise<EvolutionConnectResponse> {
    try {
      const res = await this.http.get<EvolutionConnectResponse>(
        `/instance/connect/${instanceName}`,
      );
      this.logger.debug(`QR code fetched for: ${instanceName}`);
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('getQrCode', this.extractErrorMessage(err));
    }
  }

  /**
   * Retorna o estado atual de conexão da instância.
   */
  async getConnectionState(instanceName: string): Promise<EvolutionConnectionStateResponse> {
    try {
      const res = await this.http.get<EvolutionConnectionStateResponse>(
        `/instance/connectionState/${instanceName}`,
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('getConnectionState', this.extractErrorMessage(err));
    }
  }

  /**
   * Desconecta a instância (logout do WhatsApp).
   * A sessão Baileys é encerrada mas a instância continua existindo.
   */
  async disconnectInstance(instanceName: string): Promise<void> {
    try {
      await this.http.delete(`/instance/logout/${instanceName}`);
      this.logger.debug(`Instance disconnected: ${instanceName}`);
    } catch (err) {
      // Não propaga erro se a instância já estava desconectada
      const status = (err as AxiosError)?.response?.status;
      if (status !== 404 && status !== 400) {
        throw new EvolutionApiException('disconnectInstance', this.extractErrorMessage(err));
      }
    }
  }

  /**
   * Reinicia a instância no servidor Evolution API.
   * Útil para reconexão após queda.
   */
  async restartInstance(instanceName: string): Promise<void> {
    try {
      await this.http.put(`/instance/restart/${instanceName}`);
      this.logger.debug(`Instance restarted: ${instanceName}`);
    } catch (err) {
      throw new EvolutionApiException('restartInstance', this.extractErrorMessage(err));
    }
  }

  /**
   * Exclui permanentemente a instância do Evolution API.
   * Operação destrutiva — use apenas quando remover o número do tenant.
   */
  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await this.http.delete(`/instance/delete/${instanceName}`);
      this.logger.debug(`Instance deleted: ${instanceName}`);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      if (status !== 404) {
        throw new EvolutionApiException('deleteInstance', this.extractErrorMessage(err));
      }
    }
  }

  // ─── Configuração de Webhook ──────────────────────────────────────────────────

  /**
   * Registra a URL de webhook no Evolution API para a instância.
   * Deve ser chamado após criar a instância.
   */
  async configureWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    const config: EvolutionWebhookConfig = {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: ESSENTIAL_EVENTS,
    };

    try {
      await this.http.post(`/webhook/set/${instanceName}`, config);
      this.logger.debug(`Webhook configured for: ${instanceName} → ${webhookUrl}`);
    } catch (err) {
      throw new EvolutionApiException('configureWebhook', this.extractErrorMessage(err));
    }
  }

  // ─── Envio de Mensagens ───────────────────────────────────────────────────────

  /**
   * Envia mensagem de texto simples.
   */
  async sendText(
    instanceName: string,
    recipientPhone: string,
    text: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendText/${instanceName}`,
        {
          number: recipientPhone,
          textMessage: { text },
          options: { delay: 1000, presence: 'composing' },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendText', this.extractErrorMessage(err));
    }
  }

  /**
   * Envia imagem (JPEG, PNG, GIF, WEBP).
   * mediaUrl deve ser uma URL pública acessível pela Evolution API.
   */
  async sendImage(
    instanceName: string,
    recipientPhone: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendMedia/${instanceName}`,
        {
          number: recipientPhone,
          mediatype: 'image',
          media: mediaUrl,
          caption: caption ?? '',
          options: { delay: 1000 },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendImage', this.extractErrorMessage(err));
    }
  }

  /**
   * Envia áudio como mensagem de voz (PTT — Push to Talk).
   * Formatos suportados: OGG/OPUS (preferencial), MP3, AAC, M4A.
   */
  async sendAudio(
    instanceName: string,
    recipientPhone: string,
    audioUrl: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendWhatsAppAudio/${instanceName}`,
        {
          number: recipientPhone,
          audio: audioUrl,
          options: { delay: 1000 },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendAudio', this.extractErrorMessage(err));
    }
  }

  /**
   * Envia documento (PDF, DOCX, XLSX, etc.).
   */
  async sendDocument(
    instanceName: string,
    recipientPhone: string,
    documentUrl: string,
    fileName: string,
    caption?: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendMedia/${instanceName}`,
        {
          number: recipientPhone,
          mediatype: 'document',
          media: documentUrl,
          fileName,
          caption: caption ?? '',
          options: { delay: 1000 },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendDocument', this.extractErrorMessage(err));
    }
  }

  /**
   * Envia vídeo (MP4, AVI, MOV).
   */
  async sendVideo(
    instanceName: string,
    recipientPhone: string,
    videoUrl: string,
    caption?: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendMedia/${instanceName}`,
        {
          number: recipientPhone,
          mediatype: 'video',
          media: videoUrl,
          caption: caption ?? '',
          options: { delay: 1000 },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendVideo', this.extractErrorMessage(err));
    }
  }

  /**
   * Envia localização geográfica.
   */
  async sendLocation(
    instanceName: string,
    recipientPhone: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<EvolutionSendMessageResponse> {
    try {
      const res = await this.http.post<EvolutionSendMessageResponse>(
        `/message/sendLocation/${instanceName}`,
        {
          number: recipientPhone,
          latitude,
          longitude,
          name: name ?? '',
          address: address ?? '',
          options: { delay: 1000 },
        },
      );
      return res.data;
    } catch (err) {
      throw new EvolutionApiException('sendLocation', this.extractErrorMessage(err));
    }
  }

  // ─── Utilitários privados ─────────────────────────────────────────────────────

  private extractErrorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
      const responseData = err.response?.data as Record<string, unknown> | undefined;
      const serverMessage =
        (responseData?.['message'] as string | undefined) ??
        (responseData?.['error'] as string | undefined);
      if (serverMessage) return serverMessage;
      return `HTTP ${err.response?.status ?? 0}: ${err.message}`;
    }
    if (err instanceof Error) return err.message;
    return 'Unknown error';
  }
}
