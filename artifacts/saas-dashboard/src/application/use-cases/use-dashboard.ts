import { useQuery } from '@tanstack/react-query';
import { useDashboardRepository } from '@/infrastructure/di/repository.context';

export function useDashboardStats() {
  const repo = useDashboardRepository();
  return useQuery({ queryKey: ['dashboard-stats'], queryFn: () => repo.getStats() });
}

export function useConversationTrend() {
  const repo = useDashboardRepository();
  return useQuery({ queryKey: ['conversation-trend'], queryFn: () => repo.getConversationTrend() });
}

export function useChannelBreakdown() {
  const repo = useDashboardRepository();
  return useQuery({ queryKey: ['channel-breakdown'], queryFn: () => repo.getChannelBreakdown() });
}

export function useRecentActivity() {
  const repo = useDashboardRepository();
  return useQuery({ queryKey: ['recent-activity'], queryFn: () => repo.getRecentActivity() });
}
