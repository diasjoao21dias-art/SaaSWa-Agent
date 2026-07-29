import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, Req, Headers, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { EvolutionWebhookDto } from './dto/evolution-webhook.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Webhooks')
@ApiBearerAuth('access-token')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  // ─── Public inbound endpoint for Evolution API ─────────────────────────────
  // High rate limit — Evolution API sends bursts of webhook events per tenant.
  @Public()
  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 200, ttl: 1000 } })
  @ApiOperation({ summary: 'Inbound webhook endpoint for Evolution API events (public)' })
  @ApiHeader({ name: 'x-webhook-signature', description: 'HMAC-SHA256 signature from Evolution API', required: false })
  async receiveEvolution(
    @Body() dto: EvolutionWebhookDto,
    @Headers('x-webhook-signature') signature: string,
    @Req() req: Request,
  ): Promise<{ ok: boolean }> {
    const rawBody = JSON.stringify(req.body);
    if (signature && !this.service.verifyEvolutionSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature.');
    }
    await this.service.processEvolutionWebhook(dto);
    return { ok: true };
  }

  // ─── Tenant-managed outbound webhook subscriptions ─────────────────────────
  // OWNER/ADMIN only — webhook URLs are sensitive configuration; AGENT/VIEWER
  // must not be able to register destinations for outbound events.
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create an outbound webhook subscription' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateWebhookDto) {
    return this.service.create(tenant.id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List outbound webhook subscriptions' })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an outbound webhook subscription' })
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
