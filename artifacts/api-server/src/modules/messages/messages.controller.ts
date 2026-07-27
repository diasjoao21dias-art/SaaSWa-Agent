import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { TenantContext, JwtPayload } from '../../common/types/authenticated-request.type';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'conversations/:conversationId/messages', version: '1' })
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages from a conversation (chronological)' })
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Param('conversationId') conversationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findByConversation(conversationId, tenant.id, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message as human operator' })
  sendMessage(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendHumanMessage(conversationId, tenant.id, user.sub, dto);
  }
}
