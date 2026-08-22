/**
 * use-messages — fetch and send chat messages for a conversation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'client' | 'agent' | 'bot';
  content: string;
  createdAt: string;
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      return res.json() as Promise<ChatMessage[]>;
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content: string; sender?: string }) => {
      const res = await fetch(`${BASE}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content, sender: data.sender ?? 'agent' }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
