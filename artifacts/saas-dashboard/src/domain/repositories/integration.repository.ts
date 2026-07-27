import type { Integration, IntegrationId } from '../entities/integration.entity';

export interface IIntegrationRepository {
  list(): Promise<readonly Integration[]>;
  toggle(id: IntegrationId, isActive: boolean): Promise<Integration>;
}
