import { Injectable, Logger } from '@nestjs/common';
import { AgentsRepository } from './agents.repository';
import { CacheService } from '../../cache/cache.service';
import { AgentNotFoundException } from './exceptions/agent.exceptions';
import { CACHE_KEY_AGENT, CACHE_TTL_MEDIUM } from '../../common/constants';
import type { CreateAgentDto } from './dto/create-agent.dto';
import type { UpdateAgentDto } from './dto/update-agent.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly repo: AgentsRepository,
    private readonly cache: CacheService,
  ) {}

  async create(tenantId: string, dto: CreateAgentDto) {
    const agent = await this.repo.create(tenantId, { ...dto, status: 'DRAFT' });
    this.logger.log(`Agent created: ${agent.name} for tenant ${tenantId}`);
    return agent;
  }

  async findById(id: string, tenantId: string) {
    const cacheKey = `${CACHE_KEY_AGENT}${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const agent = await this.repo.findById(id, tenantId);
    if (!agent) throw new AgentNotFoundException(id);

    await this.cache.set(cacheKey, agent, CACHE_TTL_MEDIUM);
    return agent;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async update(id: string, tenantId: string, dto: UpdateAgentDto) {
    await this.findById(id, tenantId);
    const updated = await this.repo.update(id, dto);
    await this.cache.del(`${CACHE_KEY_AGENT}${id}`);
    return updated;
  }

  async activate(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const updated = await this.repo.update(id, { status: 'ACTIVE' });
    await this.cache.del(`${CACHE_KEY_AGENT}${id}`);
    return updated;
  }

  async deactivate(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const updated = await this.repo.update(id, { status: 'INACTIVE' });
    await this.cache.del(`${CACHE_KEY_AGENT}${id}`);
    return updated;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.softDelete(id);
    await this.cache.del(`${CACHE_KEY_AGENT}${id}`);
  }
}
