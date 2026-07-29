import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AssignAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() agentId?: string;
}

class DirectSendMessageDto extends SendMessageDto {
  @ApiPropertyOptional({ description: 'ID da conversa (cria job no contexto de uma conversa existente)' })
  @IsOptional() @IsUUID() conversationId?: string;

  @ApiPropertyOptional({ description: 'ID da mensagem já criada no banco' })
  @IsOptional() @IsUUID() messageId?: string;
}

@ApiTags('WhatsApp')
@ApiBearerAuth('access-token')
@Controller({ path: 'whatsapp', version: '1' })
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  // ─── Criação ───────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registra um novo número WhatsApp via Evolution API' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateWhatsappNumberDto) {
    return this.service.create(tenant.id, dto);
  }

  // ─── Listagem ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lista todos os números WhatsApp do tenant' })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um número WhatsApp pelo ID' })
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  // ─── QR Code ───────────────────────────────────────────────────────────────────

  @Get(':id/qrcode')
  @ApiOperation({
    summary: 'Gera QR Code para autenticação do número',
    description: 'O QR Code expira em 60 segundos. Após o scan, o status muda para CONNECTED via webhook.',
  })
  getQrCode(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.getQrCode(id, tenant.id);
  }

  // ─── Desconexão ────────────────────────────────────────────────────────────────

  @Patch(':id/disconnect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Desconecta o número WhatsApp (logout)' })
  disconnect(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.disconnect(id, tenant.id);
  }

  // ─── Reconexão manual ─────────────────────────────────────────────────────────

  @Post(':id/reconnect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reconecta manualmente uma instância',
    description: 'Reinicia a instância no Evolution API e retorna novo QR Code para scan.',
  })
  reconnect(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.reconnect(id, tenant.id);
  }

  // ─── Envio de mensagens ────────────────────────────────────────────────────────

  @Post(':id/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Enfileira o envio de mensagem (texto, imagem, áudio, vídeo, documento, localização)',
    description: [
      'O envio é assíncrono via BullMQ. Retorna 202 Accepted com o messageId.',
      '',
      'Tipos suportados:',
      '  text     — campo text obrigatório',
      '  image    — mediaUrl obrigatório; caption opcional',
      '  audio    — mediaUrl obrigatório (OGG/OPUS preferencial)',
      '  video    — mediaUrl obrigatório; caption opcional',
      '  document — mediaUrl + fileName obrigatórios; caption opcional',
      '  location — latitude + longitude obrigatórios; locationName/locationAddress opcionais',
    ].join('\n'),
  })
  async send(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: DirectSendMessageDto,
  ) {
    const conversationId = dto.conversationId ?? 'direct';
    const messageId = dto.messageId ?? `direct-${Date.now()}`;
    return this.service.sendMessage(id, tenant.id, dto, conversationId, messageId);
  }

  // ─── Atribuição de agente ──────────────────────────────────────────────────────

  @Patch(':id/assign-agent')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atribui ou remove um agente IA a este número' })
  assignAgent(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.service.assignAgent(id, tenant.id, dto.agentId ?? null);
  }

  // ─── Remoção ───────────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove o número WhatsApp e exclui a instância no Evolution API' })
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
