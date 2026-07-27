export type ConversationId = string & { readonly _brand: 'ConversationId' };
export type ConversationChannel = 'WhatsApp' | 'Web Chat' | 'Email' | 'SMS';
export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface Conversation {
  readonly id: ConversationId;
  readonly clientName: string;
  readonly agentName: string;
  readonly channel: ConversationChannel;
  readonly status: ConversationStatus;
  readonly lastMessage: string;
  readonly unreadCount: number;
  readonly updatedAt: Date;
}
