import type { DashboardStats, ActivityItem } from '@/domain/entities/dashboard.entity';
import type { DashboardStatsDTO, ActivityItemDTO } from '../dtos/dashboard.dto';

export function mapDashboardStatsDTO(dto: DashboardStatsDTO): DashboardStats {
  return { ...dto };
}

export function mapActivityItemDTO(dto: ActivityItemDTO): ActivityItem {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    actor: dto.actor,
    createdAt: new Date(dto.createdAt),
  };
}
