import type { IAgentRepository } from '@/domain/repositories/agent.repository';
import type { Agent } from '@/domain/entities/agent.entity';
import { AgentDTOSchema } from '@/application/dtos/agent.dto';
import { mapAgentDTO } from '@/application/mappers/agent.mapper';
import { MOCK_AGENTS } from '@/lib/mock-data';

export class MockAgentRepository implements IAgentRepository {
  async list(): Promise<readonly Agent[]> {
    return MOCK_AGENTS.map((raw) => mapAgentDTO(AgentDTOSchema.parse(raw)));
  }
}
