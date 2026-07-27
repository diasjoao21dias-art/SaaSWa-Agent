/**
 * Attendances — histórico de atendimentos com duração e notas.
 */
import { useState } from 'react';
import { useListAttendances } from '@workspace/api-client-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOCK_ATTENDANCES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Web Chat': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SMS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function Attendances() {
  const [search, setSearch] = useState('');
  const { data: apiAtt = [], isLoading } = useListAttendances();
  const attendances = apiAtt.length ? apiAtt : MOCK_ATTENDANCES;

  const filtered = attendances.filter(a => {
    const q = search.toLowerCase();
    return (
      a.clientName?.toLowerCase().includes(q) ||
      a.agentName?.toLowerCase().includes(q) ||
      a.channel?.toLowerCase().includes(q)
    );
  });

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 bg-card border border-card-border rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Atendimentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} atendimento(s)</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search" placeholder="Buscar atendimentos…" value={search}
          onChange={e => setSearch(e.target.value)} className="pl-9"
          data-testid="input-search-attendances"
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Cliente', 'Agente', 'Canal', 'Status', 'Início', 'Fim', 'Duração', 'Notas'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(att => (
                <tr key={att.id} className="hover:bg-accent/30 transition-colors" data-testid={`attendance-${att.id}`}>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{att.clientName || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{att.agentName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      CHANNEL_COLORS[att.channel ?? ''] ?? 'bg-muted text-muted-foreground',
                    )}>
                      {att.channel || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={att.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {att.startedAt ? format(new Date(att.startedAt), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {att.endedAt ? format(new Date(att.endedAt), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-muted-foreground whitespace-nowrap">
                    {formatDuration(att.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate text-xs">
                    {att.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Clock className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum atendimento encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
