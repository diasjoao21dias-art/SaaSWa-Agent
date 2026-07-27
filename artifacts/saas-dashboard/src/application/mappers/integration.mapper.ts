import type { Integration, IntegrationId } from '@/domain/entities/integration.entity';
import type { IntegrationDTO } from '../dtos/integration.dto';

export function mapIntegrationDTO(dto: IntegrationDTO): Integration {
  return {
    id: dto.id as IntegrationId,
    name: dto.name,
    type: dto.type,
    description: dto.description,
    isActive: dto.isActive,
    status: dto.status,
    connectedAt: dto.connectedAt ? new Date(dto.connectedAt) : null,
  };
}
