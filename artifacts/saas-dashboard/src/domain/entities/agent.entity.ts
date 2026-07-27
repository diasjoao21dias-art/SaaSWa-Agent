export type AgentId = string & { readonly _brand: 'AgentId' };
export type AgentStatus = 'online' | 'busy' | 'offline';

export interface Agent {
  readonly id: AgentId;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: AgentStatus;
  readonly activeConversations: number;
  readonly totalAttendances: number;
  readonly satisfactionScore: number;
}
