import type { IAttendanceRepository, ListAttendancesFilter } from '@/domain/repositories/attendance.repository';
import type { Attendance, AttendanceId } from '@/domain/entities/attendance.entity';
import { listAttendances } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Attendance {
  return {
    id: r.id as AttendanceId,
    clientName: r.clientName ?? '',
    agentName: r.agentName ?? '',
    channel: r.channel ?? 'whatsapp',
    status: r.status ?? 'pending',
    startedAt: new Date(r.startedAt ?? r.createdAt),
    endedAt: r.endedAt ? new Date(r.endedAt) : null,
    durationSeconds: r.durationSeconds ?? null,
    notes: r.notes ?? null,
  };
}

export class ApiAttendanceRepository implements IAttendanceRepository {
  async list(filter?: ListAttendancesFilter): Promise<readonly Attendance[]> {
    const rows = await listAttendances();
    let result = rows.map(mapRow);
    if (filter?.status) result = result.filter((a) => a.status === filter.status);
    return result;
  }
}
