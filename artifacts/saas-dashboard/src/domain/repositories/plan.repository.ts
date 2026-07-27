import type { Plan, PlanId, CreatePlanInput, UpdatePlanInput } from '../entities/plan.entity';

export interface IPlanRepository {
  list(): Promise<readonly Plan[]>;
  create(input: CreatePlanInput): Promise<Plan>;
  update(id: PlanId, input: UpdatePlanInput): Promise<Plan>;
  remove(id: PlanId): Promise<void>;
}
