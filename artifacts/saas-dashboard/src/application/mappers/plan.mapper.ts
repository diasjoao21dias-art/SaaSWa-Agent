import type { Plan, PlanId } from '@/domain/entities/plan.entity';
import type { PlanDTO } from '../dtos/plan.dto';

export function mapPlanDTO(dto: PlanDTO): Plan {
  return {
    id: dto.id as PlanId,
    name: dto.name,
    description: dto.description,
    price: dto.price,
    interval: dto.interval,
    isActive: dto.isActive,
    subscriberCount: dto.subscriberCount,
    maxAgents: dto.maxAgents,
    maxConversations: dto.maxConversations,
    features: dto.features,
  };
}
