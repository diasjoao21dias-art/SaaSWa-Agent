import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatCompletionDto, TestPromptDto } from './dto/chat-completion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PreviewPromptQueryDto {
  @ApiPropertyOptional({ description: 'Nome do cliente para personalizar a prévia' })
  @IsOptional() @IsString()
  customerName?: string;
}

@ApiTags('AI')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly service: AiService) {}

  // ─── Modelos disponíveis ────────────────────────────────────────────────────

  @Get('models')
  @ApiOperation({
    summary: 'Lista os modelos OpenAI disponíveis',
    description: 'Retorna os modelos compatíveis com a Responses API, com limite de contexto e saída.',
  })
  listModels() {
    return this.service.listAvailableModels();
  }

  // ─── Playground ─────────────────────────────────────────────────────────────

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Playground — envia mensagem para um agente e recebe resposta imediata',
    description: [
      'Usa a OpenAI Responses API diretamente (sem fila).',
      'Retorna também o `promptPreview` — o system prompt montado automaticamente.',
      'Ideal para testar a configuração do agente antes de publicar.',
    ].join(' '),
  })
  chatCompletion(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ChatCompletionDto,
  ) {
    return this.service.chatCompletion(tenant.id, dto);
  }

  // ─── Teste de prompt ────────────────────────────────────────────────────────

  @Post('test-prompt')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Testa um system prompt arbitrário (ADMIN)',
    description: 'Chama a Responses API com um prompt customizado, sem precisar de um agente configurado.',
  })
  testPrompt(@Body() dto: TestPromptDto) {
    return this.service.testPrompt(dto);
  }

  // ─── Preview do prompt montado ──────────────────────────────────────────────

  @Get('agents/:agentId/prompt-preview')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Visualiza o system prompt que seria enviado para a OpenAI',
    description: [
      'Mostra exatamente o prompt completo que o PromptBuilderService montaria',
      'para o agente informado. Inclui todas as seções: identidade, personalidade,',
      'instruções, estilo, regras de comportamento, etc.',
    ].join(' '),
  })
  previewPrompt(
    @CurrentTenant() tenant: TenantContext,
    @Param('agentId') agentId: string,
    @Query() query: PreviewPromptQueryDto,
  ) {
    return this.service.previewPrompt(agentId, tenant.id, query.customerName);
  }
}
