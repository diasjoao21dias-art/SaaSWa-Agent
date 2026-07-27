import { z } from 'zod';

export const ConversationDTOSchema = z.object({
  id: z.string().min(1),
  clientName: z.string(),
  agentName: z.string(),
  channel: z.enum(['WhatsApp', 'Web Chat', 'Email', 'SMS']),
  status: z.enum(['open', 'pending', 'closed']),
  lastMessage: z.string(),
  unreadCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export type ConversationDTO = z.infer<typeof ConversationDTOSchema>;

export const UpdateConversationStatusDTOSchema = z.object({
  status: z.enum(['open', 'pending', 'closed']),
});

export type UpdateConversationStatusDTO = z.infer<typeof UpdateConversationStatusDTOSchema>;
