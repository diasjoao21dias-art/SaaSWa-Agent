import type { IIntegrationRepository } from '@/domain/repositories/integration.repository';
import type { Integration, IntegrationId } from '@/domain/entities/integration.entity';
import { listIntegrations, updateIntegration } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Integration {
  return {
    id: r.id as IntegrationId,
    name: r.name,
    type: r.type,
    description: r.description ?? '',
    isActive: r.isActive ?? false,
    status: r.status ?? 'disconnected',
    connectedAt: r.connectedAt ? new Date(r.connectedAt) : null,
  };
}

export class ApiIntegrationRepository implements IIntegrationRepository {
  async list(): Promise<readonly Integration[]> {
    const rows = await listIntegrations();
    return rows.map(mapRow);
  }

  async toggle(id: IntegrationId, isActive: boolean): Promise<Integration> {
    const row = await updateIntegration(id, { isActive } as Parameters<typeof updateIntegration>[1]);
    return mapRow(row);
  }
}
