import type { Agent } from '../entities/agent.entity';

export interface IAgentRepository {
  list(): Promise<readonly Agent[]>;
}
