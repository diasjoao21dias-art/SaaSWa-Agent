import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserRepository } from '@/infrastructure/di/repository.context';
import type { UserId, CreateUserInput, UpdateUserInput } from '@/domain/entities/user.entity';

const QUERY_KEY = 'users';

export function useUsers() {
  const repo = useUserRepository();
  return useQuery({ queryKey: [QUERY_KEY], queryFn: () => repo.list() });
}

export function useCreateUser() {
  const repo = useUserRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => repo.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateUser() {
  const repo = useUserRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: UserId; input: UpdateUserInput }) =>
      repo.update(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteUser() {
  const repo = useUserRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UserId) => repo.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
