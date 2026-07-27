import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { RepositoryContext, type RepositoryContainer } from './repository.context';
import { MockConversationRepository } from '../repositories/mock/mock-conversation.repository';
import { MockClientRepository } from '../repositories/mock/mock-client.repository';
import { MockAgentRepository } from '../repositories/mock/mock-agent.repository';
import { MockAttendanceRepository } from '../repositories/mock/mock-attendance.repository';
import { MockUserRepository } from '../repositories/mock/mock-user.repository';
import { MockPlanRepository } from '../repositories/mock/mock-plan.repository';
import { MockFinancialRepository } from '../repositories/mock/mock-financial.repository';
import { MockIntegrationRepository } from '../repositories/mock/mock-integration.repository';
import { MockDashboardRepository } from '../repositories/mock/mock-dashboard.repository';

function buildContainer(): RepositoryContainer {
  return {
    conversations: new MockConversationRepository(),
    clients: new MockClientRepository(),
    agents: new MockAgentRepository(),
    attendances: new MockAttendanceRepository(),
    users: new MockUserRepository(),
    plans: new MockPlanRepository(),
    financial: new MockFinancialRepository(),
    integrations: new MockIntegrationRepository(),
    dashboard: new MockDashboardRepository(),
  };
}

interface Props {
  readonly children: ReactNode;
}

export function RepositoryProvider({ children }: Props) {
  const container = useMemo(() => buildContainer(), []);
  return <RepositoryContext.Provider value={container}>{children}</RepositoryContext.Provider>;
}
