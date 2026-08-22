// =============================================================================
// EventsGateway — WebSocket gateway for real-time updates.
// Broadcasts new messages and notifications to all connected dashboard clients.
// =============================================================================
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class EventsGateway {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  /** Broadcasts a new chat message to all clients. */
  emitNewMessage(conversationId: string, message: { id: string; sender: string; content: string; createdAt: string }) {
    this.server?.emit('message:new', { conversationId, message });
  }

  /** Broadcasts a notification (new conversation, attendance, etc). */
  emitNotification(notification: { id: string; type: string; title: string; description: string }) {
    this.server?.emit('notification:new', notification);
  }

  /** Broadcasts subscription status change (block/unblock tenant). */
  emitSubscriptionUpdate(status: string) {
    this.server?.emit('subscription:update', { status });
  }
}
