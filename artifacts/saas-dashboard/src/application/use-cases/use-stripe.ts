/**
 * use-stripe — hooks for Stripe checkout and billing portal.
 */
import { useMutation, useQuery } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function useStripeConfig() {
  return useQuery({
    queryKey: ['stripe-config'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/stripe/config`);
      if (!res.ok) throw new Error('Failed to get Stripe config');
      return res.json() as Promise<{ publishableKey: string | null; configured: boolean }>;
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (data: { planId: string; planName: string; amount: number; interval: string }) => {
      const res = await fetch(`${BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      return res.json() as Promise<{ url?: string; error?: string }>;
    },
  });
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/stripe/portal`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to create portal session');
      return res.json() as Promise<{ url?: string; error?: string }>;
    },
  });
}
