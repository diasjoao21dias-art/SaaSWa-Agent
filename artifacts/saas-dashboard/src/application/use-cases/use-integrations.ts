import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntegrationRepository } from '@/infrastructure/di/repository.context';
import type { IntegrationId } from '@/domain/entities/integration.entity';

const QUERY_KEY = 'integrations';

export function useIntegrations() {
  const repo = useIntegrationRepository();
  return useQuery({ queryKey: [QUERY_KEY], queryFn: () => repo.list() });
}

export function useToggleIntegration() {
  const repo = useIntegrationRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: IntegrationId; isActive: boolean }) =>
      repo.toggle(id, isActive),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
