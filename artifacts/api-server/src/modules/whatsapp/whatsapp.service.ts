import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsappRepository } from './whatsapp.repository';
import {
  WhatsappNumberNotFoundException,
  WhatsappInstanceException,
} from './exceptions/whatsapp.exceptions';
import type { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly repo: WhatsappRepository,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('evolution.baseUrl', '');
    this.apiKey = this.configService.get<string>('evolution.apiKey', '');
  }

  async create(tenantId: string, dto: CreateWhatsappNumberDto) {
    // Create instance in Evolution API
    try {
      await axios.post(`${this.baseUrl}/instance/create`, {
        instanceName: dto.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }, { headers: { apikey: this.apiKey } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Evolution API instance';
      throw new WhatsappInstanceException(message);
    }

    const record = await this.repo.create(tenantId, dto);
    this.logger.log(`WhatsApp number created: ${dto.instanceName} for tenant ${tenantId}`);
    return record;
  }

  async findById(id: string, tenantId: string) {
    const num = await this.repo.findById(id, tenantId);
    if (!num) throw new WhatsappNumberNotFoundException(id);
    return num;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async getQrCode(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);
    try {
      const res = await axios.get(`${this.baseUrl}/instance/connect/${num.instanceName}`, {
        headers: { apikey: this.apiKey },
      });
      const qrCode = (res.data as Record<string, unknown>)?.['qrcode']?.['base64'] as string | undefined;
      await this.repo.updateStatus(id, 'QR_CODE', { qrCode, qrCodeExpiresAt: new Date(Date.now() + 60000) });
      return { qrCode };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get QR code';
      throw new WhatsappInstanceException(message);
    }
  }

  async disconnect(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);
    try {
      await axios.delete(`${this.baseUrl}/instance/logout/${num.instanceName}`, {
        headers: { apikey: this.apiKey },
      });
    } catch {
      // Log but don't fail — instance might already be disconnected
      this.logger.warn(`Failed to logout Evolution instance ${num.instanceName}`);
    }
    return this.repo.updateStatus(id, 'DISCONNECTED');
  }

  async assignAgent(id: string, tenantId: string, agentId: string | null) {
    await this.findById(id, tenantId);
    return this.repo.update(id, { agentId });
  }

  async remove(id: string, tenantId: string) {
    const num = await this.findById(id, tenantId);
    try {
      await axios.delete(`${this.baseUrl}/instance/delete/${num.instanceName}`, {
        headers: { apikey: this.apiKey },
      });
    } catch {
      this.logger.warn(`Could not delete Evolution instance ${num.instanceName}`);
    }
    await this.repo.softDelete(id);
  }
}
