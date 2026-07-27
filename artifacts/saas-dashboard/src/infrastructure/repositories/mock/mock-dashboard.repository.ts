import type { IDashboardRepository } from '@/domain/repositories/dashboard.repository';
import type { DashboardStats, TimeSeries, ChannelBreakdown, ActivityItem } from '@/domain/entities/dashboard.entity';
import { ActivityItemDTOSchema } from '@/application/dtos/dashboard.dto';
import { mapActivityItemDTO } from '@/application/mappers/dashboard.mapper';
import {
  MOCK_STATS, MOCK_CONV_TREND, MOCK_CHANNELS, MOCK_ACTIVITY,
} from '@/lib/mock-data';

export class MockDashboardRepository implements IDashboardRepository {
  async getStats(): Promise<DashboardStats> {
    return MOCK_STATS;
  }

  async getConversationTrend(): Promise<readonly TimeSeries[]> {
    return MOCK_CONV_TREND;
  }

  async getChannelBreakdown(): Promise<readonly ChannelBreakdown[]> {
    return MOCK_CHANNELS;
  }

  async getRecentActivity(): Promise<readonly ActivityItem[]> {
    return MOCK_ACTIVITY.map((raw) => mapActivityItemDTO(ActivityItemDTOSchema.parse(raw)));
  }
}
