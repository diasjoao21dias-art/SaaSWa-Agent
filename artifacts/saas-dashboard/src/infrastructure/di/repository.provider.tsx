import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { RepositoryContext, type RepositoryContainer } from './repository.context';
import { ApiConversationRepository } from '../repositories/api/api-conversation.repository';
import { ApiClientRepository } from '../repositories/api/api-client.repository';
import { ApiAgentRepository } from '../repositories/api/api-agent.repository';
import { ApiAttendanceRepository } from '../repositories/api/api-attendance.repository';
import { ApiUserRepository } from '../repositories/api/api-user.repository';
import { ApiPlanRepository } from '../repositories/api/api-plan.repository';
import { ApiFinancialRepository } from '../repositories/api/api-financial.repository';
import { ApiIntegrationRepository } from '../repositories/api/api-integration.repository';
import { ApiDashboardRepository } from '../repositories/api/api-dashboard.repository';

function buildContainer(): RepositoryContainer {
  return {
    conversations: new ApiConversationRepository(),
    clients: new ApiClientRepository(),
    agents: new ApiAgentRepository(),
    attendances: new ApiAttendanceRepository(),
    users: new ApiUserRepository(),
    plans: new ApiPlanRepository(),
    financial: new ApiFinancialRepository(),
    integrations: new ApiIntegrationRepository(),
    dashboard: new ApiDashboardRepository(),
  };
}

interface Props {
  readonly children: ReactNode;
}

export function RepositoryProvider({ children }: Props) {
  const container = useMemo(() => buildContainer(), []);
  return <RepositoryContext.Provider value={container}>{children}</RepositoryContext.Provider>;
}
