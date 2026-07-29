import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext, JwtPayload } from '../../common/types/authenticated-request.type';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CloseConversationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNotes?: string;
}
class RateConversationDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

@ApiTags('Conversations')
@ApiBearerAuth('access-token')
@Controller({ path: 'conversations', version: '1' })
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all conversations with filters' })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() query: ConversationQueryDto) {
    return this.service.findAll(tenant.id, query);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  @Patch(':id/close')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Close a conversation' })
  close(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: CloseConversationDto) {
    return this.service.close(id, tenant.id, dto.resolutionNotes);
  }

  @Patch(':id/assign-human')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Assign conversation to a human operator (takeover from bot)' })
  assignToHuman(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.assignToHuman(id, tenant.id, user.sub);
  }

  @Patch(':id/return-to-bot')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Return conversation to AI bot' })
  returnToBot(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.returnToBot(id, tenant.id);
  }

  @Patch(':id/rate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Rate a conversation (1–5 stars)' })
  rate(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: RateConversationDto) {
    return this.service.rate(id, tenant.id, dto.rating, dto.note);
  }
}
