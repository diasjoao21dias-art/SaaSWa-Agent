import type { IIntegrationRepository } from '@/domain/repositories/integration.repository';
import type { Integration, IntegrationId } from '@/domain/entities/integration.entity';
import { IntegrationDTOSchema } from '@/application/dtos/integration.dto';
import { mapIntegrationDTO } from '@/application/mappers/integration.mapper';
import { MOCK_INTEGRATIONS } from '@/lib/mock-data';

let store: Integration[] = MOCK_INTEGRATIONS.map((raw) =>
  mapIntegrationDTO(IntegrationDTOSchema.parse(raw)),
);

export class MockIntegrationRepository implements IIntegrationRepository {
  async list(): Promise<readonly Integration[]> {
    return store;
  }

  async toggle(id: IntegrationId, isActive: boolean): Promise<Integration> {
    store = store.map((i) =>
      i.id === id
        ? { ...i, isActive, status: isActive ? 'connected' : 'disconnected', connectedAt: isActive ? new Date() : null }
        : i,
    );
    const updated = store.find((i) => i.id === id);
    if (!updated) throw new Error(`Integration ${id} not found`);
    return updated;
  }
}
