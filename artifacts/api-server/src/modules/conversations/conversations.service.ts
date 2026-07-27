import { Injectable, Logger } from '@nestjs/common';
import { ConversationsRepository } from './conversations.repository';
import { ConversationNotFoundException, ConversationAlreadyClosedException } from './exceptions/conversation.exceptions';
import type { ConversationQueryDto } from './dto/conversation-query.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly repo: ConversationsRepository) {}

  async findById(id: string, tenantId: string) {
    const conv = await this.repo.findById(id, tenantId);
    if (!conv) throw new ConversationNotFoundException(id);
    return conv;
  }

  async findAll(tenantId: string, query: ConversationQueryDto) {
    const { data, total } = await this.repo.findAll(tenantId, query.page, query.limit, {
      status: query.status,
      agentId: query.agentId,
      humanOperatorId: query.humanOperatorId,
      search: query.search,
    });
    return paginate(data, total, query.page, query.limit);
  }

  async close(id: string, tenantId: string, resolutionNotes?: string) {
    const conv = await this.findById(id, tenantId);
    if (conv.status === 'CLOSED') throw new ConversationAlreadyClosedException();
    return this.repo.close(id, resolutionNotes);
  }

  async assignToHuman(id: string, tenantId: string, userId: string) {
    const conv = await this.findById(id, tenantId);
    if (conv.status === 'CLOSED') throw new ConversationAlreadyClosedException();
    this.logger.log(`Conversation ${id} assigned to human operator ${userId}`);
    return this.repo.assignToHuman(id, userId);
  }

  async returnToBot(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.repo.returnToBot(id);
  }

  async rate(id: string, tenantId: string, rating: number, note?: string) {
    await this.findById(id, tenantId);
    return this.repo.update(id, { rating, ratingNote: note });
  }
}
