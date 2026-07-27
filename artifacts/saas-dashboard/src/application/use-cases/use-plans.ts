import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePlanRepository } from '@/infrastructure/di/repository.context';
import type { PlanId, CreatePlanInput, UpdatePlanInput } from '@/domain/entities/plan.entity';

const QUERY_KEY = 'plans';

export function usePlans() {
  const repo = usePlanRepository();
  return useQuery({ queryKey: [QUERY_KEY], queryFn: () => repo.list() });
}

export function useCreatePlan() {
  const repo = usePlanRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => repo.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePlan() {
  const repo = usePlanRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: PlanId; input: UpdatePlanInput }) =>
      repo.update(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeletePlan() {
  const repo = usePlanRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: PlanId) => repo.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
