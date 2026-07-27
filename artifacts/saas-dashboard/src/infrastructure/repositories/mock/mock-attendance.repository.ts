import type { IAttendanceRepository, ListAttendancesFilter } from '@/domain/repositories/attendance.repository';
import type { Attendance } from '@/domain/entities/attendance.entity';
import { AttendanceDTOSchema } from '@/application/dtos/attendance.dto';
import { mapAttendanceDTO } from '@/application/mappers/attendance.mapper';
import { MOCK_ATTENDANCES } from '@/lib/mock-data';

export class MockAttendanceRepository implements IAttendanceRepository {
  async list(filter?: ListAttendancesFilter): Promise<readonly Attendance[]> {
    let results = MOCK_ATTENDANCES.map((raw) => mapAttendanceDTO(AttendanceDTOSchema.parse(raw)));
    if (filter?.status) results = results.filter((a) => a.status === filter.status);
    return results;
  }
}
