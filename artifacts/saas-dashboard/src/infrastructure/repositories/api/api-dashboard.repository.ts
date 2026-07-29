import type { IDashboardRepository } from '@/domain/repositories/dashboard.repository';
import type { DashboardStats, ActivityItem, TimeSeries, ChannelBreakdown } from '@/domain/entities/dashboard.entity';
import { getDashboardStats, getDashboardActivity, getConversationReport, getChannelBreakdown } from '@workspace/api-client-react';

export class ApiDashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await getDashboardStats() as any;
    return {
      totalConversations: data.totalConversations ?? 0,
      openConversations: data.openConversations ?? 0,
      totalClients: data.totalClients ?? 0,
      totalAgents: data.totalAgents ?? 0,
      onlineAgents: data.onlineAgents ?? 0,
      totalAttendances: data.totalAttendances ?? 0,
      mrr: data.mrr ?? 0,
      mrrGrowth: data.mrrGrowth ?? 0,
      avgResponseTime: data.avgResponseTime ?? 0,
      satisfactionScore: data.satisfactionScore ?? 0,
    };
  }

  async getConversationTrend(): Promise<readonly TimeSeries[]> {
    const points = await getConversationReport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (points as any[]).map((p) => ({ label: p.label, value: p.value }));
  }

  async getChannelBreakdown(): Promise<readonly ChannelBreakdown[]> {
    const items = await getChannelBreakdown();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (items as any[]).map((i) => ({ channel: i.channel, count: i.count, percentage: i.percentage }));
  }

  async getRecentActivity(): Promise<readonly ActivityItem[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await getDashboardActivity() as any[];
    return items.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.description ?? '',
      actor: i.actor ?? null,
      createdAt: new Date(i.createdAt),
    }));
  }
}
