import type { Conversation, ConversationId } from '@/domain/entities/conversation.entity';
import type { ConversationDTO } from '../dtos/conversation.dto';

export function mapConversationDTO(dto: ConversationDTO): Conversation {
  return {
    id: dto.id as ConversationId,
    clientName: dto.clientName,
    agentName: dto.agentName,
    channel: dto.channel,
    status: dto.status,
    lastMessage: dto.lastMessage,
    unreadCount: dto.unreadCount,
    updatedAt: new Date(dto.updatedAt),
  };
}
