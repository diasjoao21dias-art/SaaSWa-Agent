import type { Attendance, AttendanceId } from '@/domain/entities/attendance.entity';
import type { AttendanceDTO } from '../dtos/attendance.dto';

export function mapAttendanceDTO(dto: AttendanceDTO): Attendance {
  return {
    id: dto.id as AttendanceId,
    clientName: dto.clientName,
    agentName: dto.agentName,
    channel: dto.channel,
    status: dto.status,
    startedAt: new Date(dto.startedAt),
    endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
    durationSeconds: dto.durationSeconds,
    notes: dto.notes,
  };
}
