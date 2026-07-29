import type { IConversationRepository, ListConversationsFilter } from '@/domain/repositories/conversation.repository';
import type { Conversation, ConversationId, ConversationStatus } from '@/domain/entities/conversation.entity';
import { listConversations, updateConversation } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Conversation {
  return {
    id: r.id as ConversationId,
    clientName: r.clientName ?? '',
    agentName: r.agentName ?? '',
    channel: r.channel,
    status: r.status,
    lastMessage: r.lastMessage ?? '',
    unreadCount: r.unreadCount ?? 0,
    updatedAt: new Date(r.updatedAt ?? r.createdAt),
  };
}

export class ApiConversationRepository implements IConversationRepository {
  async list(filter?: ListConversationsFilter): Promise<readonly Conversation[]> {
    const rows = await listConversations(filter as Record<string, string>);
    return rows.map(mapRow);
  }

  async updateStatus(id: ConversationId, status: ConversationStatus): Promise<void> {
    await updateConversation(id, { status });
  }
}
