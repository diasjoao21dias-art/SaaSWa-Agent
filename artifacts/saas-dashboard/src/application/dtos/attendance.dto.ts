import { z } from 'zod';

export const AttendanceDTOSchema = z.object({
  id: z.string().min(1),
  clientName: z.string(),
  agentName: z.string(),
  channel: z.enum(['WhatsApp', 'Web Chat', 'Email', 'SMS']),
  status: z.enum(['resolved', 'escalated', 'open']),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
});

export type AttendanceDTO = z.infer<typeof AttendanceDTOSchema>;
