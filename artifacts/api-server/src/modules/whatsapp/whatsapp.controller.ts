import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AssignAgentDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() agentId?: string;
}

@ApiTags('WhatsApp')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'whatsapp', version: '1' })
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Connect a new WhatsApp number via Evolution API' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateWhatsappNumberDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all connected WhatsApp numbers' })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  @Get(':id/qrcode')
  @ApiOperation({ summary: 'Get QR code to connect the WhatsApp number' })
  getQrCode(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.getQrCode(id, tenant.id);
  }

  @Patch(':id/disconnect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect a WhatsApp number' })
  disconnect(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.disconnect(id, tenant.id);
  }

  @Patch(':id/assign-agent')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign or unassign an AI agent to this number' })
  assignAgent(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.service.assignAgent(id, tenant.id, dto.agentId ?? null);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
