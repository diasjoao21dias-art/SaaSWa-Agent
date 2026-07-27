import { z } from 'zod';

export const DashboardStatsDTOSchema = z.object({
  totalConversations: z.number().int().nonnegative(),
  openConversations: z.number().int().nonnegative(),
  totalClients: z.number().int().nonnegative(),
  onlineAgents: z.number().int().nonnegative(),
  totalAgents: z.number().int().nonnegative(),
  mrr: z.number().nonnegative(),
  mrrGrowth: z.number(),
  avgResponseTime: z.number().nonnegative(),
  satisfactionScore: z.number().min(0).max(100),
  totalAttendances: z.number().int().nonnegative(),
});

export type DashboardStatsDTO = z.infer<typeof DashboardStatsDTOSchema>;

export const ActivityItemDTOSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  actor: z.string().nullable(),
  createdAt: z.string(),
});

export type ActivityItemDTO = z.infer<typeof ActivityItemDTOSchema>;

export const ChannelBreakdownDTOSchema = z.object({
  channel: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type ChannelBreakdownDTO = z.infer<typeof ChannelBreakdownDTOSchema>;
