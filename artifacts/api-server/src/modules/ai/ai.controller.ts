import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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

@ApiTags('AI')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get('models')
  @ApiOperation({ summary: 'List available AI models' })
  listModels() {
    return this.service.listAvailableModels();
  }

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a chat message to an AI agent (playground)' })
  chatCompletion(@CurrentTenant() tenant: TenantContext, @Body() dto: ChatCompletionDto) {
    return this.service.chatCompletion(tenant.id, dto);
  }

  @Post('test-prompt')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Test a system prompt before saving it (ADMIN only)' })
  testPrompt(@Body() dto: TestPromptDto) {
    return this.service.testPrompt(dto);
  }
}
