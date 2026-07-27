import type { Conversation, ConversationId, ConversationStatus } from '../entities/conversation.entity';

export interface ListConversationsFilter {
  readonly status?: ConversationStatus;
  readonly search?: string;
}

export interface IConversationRepository {
  list(filter?: ListConversationsFilter): Promise<readonly Conversation[]>;
  updateStatus(id: ConversationId, status: ConversationStatus): Promise<void>;
}
