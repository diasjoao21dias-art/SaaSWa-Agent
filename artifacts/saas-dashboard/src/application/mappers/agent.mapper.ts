import type { Agent, AgentId } from '@/domain/entities/agent.entity';
import type { AgentDTO } from '../dtos/agent.dto';

export function mapAgentDTO(dto: AgentDTO): Agent {
  return {
    id: dto.id as AgentId,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    activeConversations: dto.activeConversations,
    totalAttendances: dto.totalAttendances,
    satisfactionScore: dto.satisfactionScore,
  };
}
