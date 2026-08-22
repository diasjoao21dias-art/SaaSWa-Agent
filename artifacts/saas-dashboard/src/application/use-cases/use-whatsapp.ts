/**
 * use-whatsapp — hooks for Evolution API WhatsApp connection.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface WhatsappStatus {
  connected: boolean;
  instance: string | null;
  state: string;
  error?: string;
}

export interface ConnectResult {
  instance?: string;
  qrCode?: string;
  pairCode?: string | null;
  status?: string;
  error?: string;
}

export function useWhatsappStatus() {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/whatsapp/status`);
      if (!res.ok) throw new Error('Failed to get WhatsApp status');
      return res.json() as Promise<WhatsappStatus>;
    },
    refetchInterval: 5000,
  });
}

export function useConnectWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/whatsapp/connect`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to connect');
      return res.json() as Promise<ConnectResult>;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['whatsapp-status'] }),
  });
}

export function useDisconnectWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/whatsapp/disconnect`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['whatsapp-status'] }),
  });
}
