import { useQuery } from '@tanstack/react-query';
import { useAgentRepository } from '@/infrastructure/di/repository.context';

export function useAgents() {
  const repo = useAgentRepository();
  return useQuery({ queryKey: ['agents'], queryFn: () => repo.list() });
}
