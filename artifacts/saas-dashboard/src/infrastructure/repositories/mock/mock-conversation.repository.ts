import type { IConversationRepository, ListConversationsFilter } from '@/domain/repositories/conversation.repository';
import type { Conversation, ConversationId, ConversationStatus } from '@/domain/entities/conversation.entity';
import { ConversationDTOSchema } from '@/application/dtos/conversation.dto';
import { mapConversationDTO } from '@/application/mappers/conversation.mapper';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';

function parseAll(): Conversation[] {
  return MOCK_CONVERSATIONS.map((raw) => mapConversationDTO(ConversationDTOSchema.parse(raw)));
}

export class MockConversationRepository implements IConversationRepository {
  async list(filter?: ListConversationsFilter): Promise<readonly Conversation[]> {
    let results = parseAll();
    if (filter?.status) results = results.filter((c) => c.status === filter.status);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.agentName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q),
      );
    }
    return results;
  }

  async updateStatus(_id: ConversationId, _status: ConversationStatus): Promise<void> {}
}
