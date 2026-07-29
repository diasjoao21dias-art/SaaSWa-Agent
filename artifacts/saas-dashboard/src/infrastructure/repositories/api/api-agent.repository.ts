import type { IAgentRepository } from '@/domain/repositories/agent.repository';
import type { Agent, AgentId } from '@/domain/entities/agent.entity';
import { listAgents } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Agent {
  return {
    id: r.id as AgentId,
    name: r.name,
    email: r.email ?? '',
    role: r.role ?? 'agent',
    status: r.status ?? 'offline',
    activeConversations: r.activeConversations ?? 0,
    totalAttendances: r.totalAttendances ?? 0,
    satisfactionScore: r.satisfactionScore ?? null,
  };
}

export class ApiAgentRepository implements IAgentRepository {
  async list(): Promise<readonly Agent[]> {
    const rows = await listAgents();
    return rows.map(mapRow);
  }
}
