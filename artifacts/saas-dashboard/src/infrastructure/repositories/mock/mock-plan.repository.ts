import type { IPlanRepository } from '@/domain/repositories/plan.repository';
import type { Plan, PlanId, CreatePlanInput, UpdatePlanInput } from '@/domain/entities/plan.entity';
import { PlanDTOSchema } from '@/application/dtos/plan.dto';
import { mapPlanDTO } from '@/application/mappers/plan.mapper';
import { MOCK_PLANS } from '@/lib/mock-data';

let store: Plan[] = MOCK_PLANS.map((raw) => mapPlanDTO(PlanDTOSchema.parse(raw)));

export class MockPlanRepository implements IPlanRepository {
  async list(): Promise<readonly Plan[]> {
    return store;
  }

  async create(input: CreatePlanInput): Promise<Plan> {
    const plan: Plan = {
      id: `p${Date.now()}` as PlanId,
      name: input.name,
      description: input.description ?? '',
      price: input.price,
      interval: input.interval,
      isActive: true,
      subscriberCount: 0,
      maxAgents: input.maxAgents ?? null,
      maxConversations: input.maxConversations ?? null,
      features: input.features ?? [],
    };
    store = [...store, plan];
    return plan;
  }

  async update(id: PlanId, input: UpdatePlanInput): Promise<Plan> {
    store = store.map((p) => (p.id === id ? { ...p, ...input } : p));
    const updated = store.find((p) => p.id === id);
    if (!updated) throw new Error(`Plan ${id} not found`);
    return updated;
  }

  async remove(id: PlanId): Promise<void> {
    store = store.filter((p) => p.id !== id);
  }
}
