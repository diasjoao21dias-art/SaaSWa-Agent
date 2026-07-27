import { useState } from 'react';
import { useAttendances } from '@/application/use-cases/use-attendances';
import type { Attendance, AttendanceStatus } from '@/domain/entities/attendance.entity';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function AttendanceRow({ attendance }: { attendance: Attendance }) {
  return (
    <tr className="border-b border-border hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground">{attendance.clientName}</p>
        <p className="text-xs text-muted-foreground">{attendance.agentName}</p>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs font-medium text-muted-foreground">{attendance.channel}</span>
      </td>
      <td className="px-4 py-3"><StatusBadge status={attendance.status} /></td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell font-mono-tabular">
        {attendance.durationSeconds != null ? formatDuration(attendance.durationSeconds) : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
        {format(attendance.startedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell max-w-[200px] truncate">
        {attendance.notes ?? '—'}
      </td>
    </tr>
  );
}

export default function Attendances() {
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');

  const { data: attendances = [], isLoading } = useAttendances(
    statusFilter ? { status: statusFilter } : undefined,
  );

  if (isLoading) return <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Atendimentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{attendances.length} atendimento(s)</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AttendanceStatus | '')}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="escalated">Escalado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Cliente / Agente', 'Canal', 'Status', 'Duração', 'Início', 'Notas'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-sm text-muted-foreground py-12">Nenhum atendimento encontrado.</td></tr>
              ) : (
                attendances.map((a) => <AttendanceRow key={a.id} attendance={a} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
