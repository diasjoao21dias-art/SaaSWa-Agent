export type PlanId = string & { readonly _brand: 'PlanId' };
export type BillingInterval = 'month' | 'year';

export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly interval: BillingInterval;
  readonly isActive: boolean;
  readonly subscriberCount: number;
  readonly maxAgents: number | null;
  readonly maxConversations: number | null;
  readonly features: readonly string[];
}

export interface CreatePlanInput {
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly interval: BillingInterval;
  readonly maxAgents?: number;
  readonly maxConversations?: number;
  readonly features?: string[];
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  readonly isActive?: boolean;
}
