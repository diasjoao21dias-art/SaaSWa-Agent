import { createContext, useContext } from 'react';
import type { IConversationRepository } from '@/domain/repositories/conversation.repository';
import type { IClientRepository } from '@/domain/repositories/client.repository';
import type { IAgentRepository } from '@/domain/repositories/agent.repository';
import type { IAttendanceRepository } from '@/domain/repositories/attendance.repository';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import type { IPlanRepository } from '@/domain/repositories/plan.repository';
import type { IFinancialRepository } from '@/domain/repositories/financial.repository';
import type { IIntegrationRepository } from '@/domain/repositories/integration.repository';
import type { IDashboardRepository } from '@/domain/repositories/dashboard.repository';

export interface RepositoryContainer {
  readonly conversations: IConversationRepository;
  readonly clients: IClientRepository;
  readonly agents: IAgentRepository;
  readonly attendances: IAttendanceRepository;
  readonly users: IUserRepository;
  readonly plans: IPlanRepository;
  readonly financial: IFinancialRepository;
  readonly integrations: IIntegrationRepository;
  readonly dashboard: IDashboardRepository;
}

export const RepositoryContext = createContext<RepositoryContainer | null>(null);

function useRepository(): RepositoryContainer {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepository must be used inside <RepositoryProvider>');
  return ctx;
}

export const useConversationRepository = () => useRepository().conversations;
export const useClientRepository = () => useRepository().clients;
export const useAgentRepository = () => useRepository().agents;
export const useAttendanceRepository = () => useRepository().attendances;
export const useUserRepository = () => useRepository().users;
export const usePlanRepository = () => useRepository().plans;
export const useFinancialRepository = () => useRepository().financial;
export const useIntegrationRepository = () => useRepository().integrations;
export const useDashboardRepository = () => useRepository().dashboard;
