import { z } from 'zod';

export const PlanDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  interval: z.enum(['month', 'year']),
  isActive: z.boolean(),
  subscriberCount: z.number().int().nonnegative(),
  maxAgents: z.number().int().positive().nullable(),
  maxConversations: z.number().int().positive().nullable(),
  features: z.array(z.string()),
});

export type PlanDTO = z.infer<typeof PlanDTOSchema>;

export const CreatePlanFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative('Preço deve ser positivo'),
  interval: z.enum(['month', 'year']),
  maxAgents: z.coerce.number().int().positive().optional(),
  maxConversations: z.coerce.number().int().positive().optional(),
  features: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreatePlanFormValues = z.infer<typeof CreatePlanFormSchema>;
