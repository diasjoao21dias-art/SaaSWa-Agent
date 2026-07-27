import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { ConversationsRepository } from '../conversations/conversations.repository';
import { ConversationNotFoundException } from '../conversations/exceptions/conversation.exceptions';
import { WhatsappOutboundProducer } from '../../queue/producers/whatsapp-outbound.producer';
import type { SendMessageDto } from './dto/send-message.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepo: MessagesRepository,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly outboundProducer: WhatsappOutboundProducer,
  ) {}

  async findByConversation(conversationId: string, tenantId: string, pagination: PaginationDto) {
    const conv = await this.conversationsRepo.findById(conversationId, tenantId);
    if (!conv) throw new ConversationNotFoundException(conversationId);

    const { data, total } = await this.messagesRepo.findByConversation(
      conversationId, pagination.page, pagination.limit,
    );
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async sendHumanMessage(conversationId: string, tenantId: string, userId: string, dto: SendMessageDto) {
    const conv = await this.conversationsRepo.findById(conversationId, tenantId);
    if (!conv) throw new ConversationNotFoundException(conversationId);

    const message = await this.messagesRepo.create(conversationId, {
      role: 'HUMAN',
      type: dto.type ?? 'TEXT',
      content: dto.content,
      status: 'SENT',
      sentByUserId: userId,
      sentAt: new Date(),
    });

    // Update conversation last message
    await this.conversationsRepo.update(conversationId, { lastMessageAt: new Date() });

    // Enqueue outbound WhatsApp delivery
    await this.outboundProducer.enqueue({
      tenantId,
      conversationId,
      messageId: message.id,
      instanceName: conv.whatsappNumber.instanceName,
      recipientPhone: conv.customer.phone,
      content: dto.content,
      messageType: 'text',
    });

    return message;
  }
}
