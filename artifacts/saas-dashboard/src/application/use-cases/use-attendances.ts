import { useQuery } from '@tanstack/react-query';
import { useAttendanceRepository } from '@/infrastructure/di/repository.context';
import type { ListAttendancesFilter } from '@/domain/repositories/attendance.repository';

export function useAttendances(filter?: ListAttendancesFilter) {
  const repo = useAttendanceRepository();
  return useQuery({
    queryKey: ['attendances', filter],
    queryFn: () => repo.list(filter),
  });
}
