/**
 * use-socket — Socket.io connection for real-time updates.
 * Connects to the backend WebSocket gateway and provides
 * event listeners for messages and subscription changes.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from './use-messages';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

/**
 * Listen for real-time new messages on a specific conversation.
 * Appends them to the react-query cache — no polling needed.
 */
export function useSocketMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const sock = getSocket();

  useEffect(() => {
    if (!sock || !conversationId) return;

    const handler = (data: { conversationId: string; message: ChatMessage }) => {
      if (data.conversationId !== conversationId) return;
      qc.setQueryData<ChatMessage[]>(
        ['messages', conversationId],
        (old = []) => [...old, data.message],
      );
    };

    sock.on('message:new', handler);
    return () => { sock.off('message:new', handler); };
  }, [sock, conversationId, qc]);
}

/**
 * Listen for real-time subscription status updates (block/unblock).
 */
export function useSocketSubscription() {
  const qc = useQueryClient();
  const sock = getSocket();

  useEffect(() => {
    if (!sock) return;

    const handler = (data: { status: string }) => {
      qc.setQueryData(['subscription-status'], data.status);
    };

    sock.on('subscription:update', handler);
    return () => { sock.off('subscription:update', handler); };
  }, [sock, qc]);
}
