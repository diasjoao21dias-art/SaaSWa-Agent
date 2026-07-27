import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useClientRepository } from '@/infrastructure/di/repository.context';
import type { ClientId, CreateClientInput, UpdateClientInput } from '@/domain/entities/client.entity';

const QUERY_KEY = 'clients';

export function useClients() {
  const repo = useClientRepository();
  return useQuery({ queryKey: [QUERY_KEY], queryFn: () => repo.list() });
}

export function useCreateClient() {
  const repo = useClientRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => repo.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateClient() {
  const repo = useClientRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ClientId; input: UpdateClientInput }) =>
      repo.update(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteClient() {
  const repo = useClientRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ClientId) => repo.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
