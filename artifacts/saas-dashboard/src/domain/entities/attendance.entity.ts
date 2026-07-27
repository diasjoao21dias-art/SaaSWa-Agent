import type { ConversationChannel } from './conversation.entity';

export type AttendanceId = string & { readonly _brand: 'AttendanceId' };
export type AttendanceStatus = 'resolved' | 'escalated' | 'open';

export interface Attendance {
  readonly id: AttendanceId;
  readonly clientName: string;
  readonly agentName: string;
  readonly channel: ConversationChannel;
  readonly status: AttendanceStatus;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly durationSeconds: number | null;
  readonly notes: string | null;
}
