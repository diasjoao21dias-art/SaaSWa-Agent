import type { Attendance, AttendanceStatus } from '../entities/attendance.entity';

export interface ListAttendancesFilter {
  readonly status?: AttendanceStatus;
}

export interface IAttendanceRepository {
  list(filter?: ListAttendancesFilter): Promise<readonly Attendance[]>;
}
