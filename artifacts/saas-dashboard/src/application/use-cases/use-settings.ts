/**
 * use-settings — fetch and persist dashboard settings via the compat API.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface DashboardSettings {
  companyName: string;
  website: string;
  supportEmail: string;
  phone: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  notifNewConversation: boolean;
  notifAgentAssignment: boolean;
  notifEscalation: boolean;
  notifPaymentUpdate: boolean;
  notifAgentOffline: boolean;
  notifWeeklyReport: boolean;
  notifConversationLimit: boolean;
  twofaEnabled: boolean;
  loginNotification: boolean;
  evolutionUrl: string;
  evolutionKey: string;
  webhookSecret: string;
  whatsappConnected: boolean;
  whatsappPhone: string;
  botAutoReconnect: boolean;
  botEscalateSilence: boolean;
  botLogAll: boolean;
  subscriptionStatus: string;
}

const QUERY_KEY = ['settings'];

export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/settings`);
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json() as Promise<DashboardSettings>;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DashboardSettings>) => {
      const res = await fetch(`${BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
