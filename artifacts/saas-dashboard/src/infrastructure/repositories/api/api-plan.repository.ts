import type { IPlanRepository, CreatePlanInput, UpdatePlanInput } from '@/domain/repositories/plan.repository';
import type { Plan, PlanId } from '@/domain/entities/plan.entity';
import { listPlans, createPlan, updatePlan, deletePlan } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Plan {
  return {
    id: r.id as PlanId,
    name: r.name,
    description: r.description ?? '',
    price: r.price ?? 0,
    interval: r.interval ?? 'monthly',
    isActive: r.isActive ?? true,
    subscriberCount: r.subscriberCount ?? 0,
    maxAgents: r.maxAgents ?? null,
    maxConversations: r.maxConversations ?? null,
    features: Array.isArray(r.features) ? r.features : [],
  };
}

export class ApiPlanRepository implements IPlanRepository {
  async list(): Promise<readonly Plan[]> {
    const rows = await listPlans();
    return rows.map(mapRow);
  }

  async create(input: CreatePlanInput): Promise<Plan> {
    const row = await createPlan(input as Parameters<typeof createPlan>[0]);
    return mapRow(row);
  }

  async update(id: PlanId, input: UpdatePlanInput): Promise<Plan> {
    const row = await updatePlan(id, input as Parameters<typeof updatePlan>[1]);
    return mapRow(row);
  }

  async remove(id: PlanId): Promise<void> {
    await deletePlan(id);
  }
}
