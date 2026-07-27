import type { DashboardStats, TimeSeries, ChannelBreakdown, ActivityItem } from '../entities/dashboard.entity';

export interface IDashboardRepository {
  getStats(): Promise<DashboardStats>;
  getConversationTrend(): Promise<readonly TimeSeries[]>;
  getChannelBreakdown(): Promise<readonly ChannelBreakdown[]>;
  getRecentActivity(): Promise<readonly ActivityItem[]>;
}
