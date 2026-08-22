/**
 * use-subscription — check tenant subscription status (block non-paying).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export type SubscriptionStatus = 'active' | 'suspended' | 'canceled';

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/subscription-status`);
      if (!res.ok) throw new Error('Failed to check subscription');
      const data = await res.json();
      return data.status as SubscriptionStatus;
    },
    refetchInterval: 30000,
  });
}

export function useUpdateSubscriptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: SubscriptionStatus) => {
      const res = await fetch(`${BASE}/api/subscription-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update subscription');
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['subscription-status'] }),
  });
}
