import { z } from 'zod';

export const AgentDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.enum(['online', 'busy', 'offline']),
  activeConversations: z.number().int().nonnegative(),
  totalAttendances: z.number().int().nonnegative(),
  satisfactionScore: z.number().min(0).max(100),
});

export type AgentDTO = z.infer<typeof AgentDTOSchema>;
