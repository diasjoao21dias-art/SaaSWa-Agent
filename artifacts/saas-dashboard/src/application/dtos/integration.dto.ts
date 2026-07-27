import { z } from 'zod';

export const IntegrationDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.enum(['whatsapp', 'openai', 'stripe', 'slack', 'webhook', 'crm']),
  description: z.string(),
  isActive: z.boolean(),
  status: z.enum(['connected', 'disconnected']),
  connectedAt: z.string().nullable(),
});

export type IntegrationDTO = z.infer<typeof IntegrationDTOSchema>;
