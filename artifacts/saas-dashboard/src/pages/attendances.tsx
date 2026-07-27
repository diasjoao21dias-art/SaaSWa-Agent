import { useState } from 'react';
import { useListAttendances } from '@workspace/api-client-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendances() {
  const [search, setSearch] = useState('');
  const { data: attendances = [], isLoading } = useListAttendances();

  const filteredAttendances = attendances.filter(att => {
    const searchLower = search.toLowerCase();
    return (
      att.clientName?.toLowerCase().includes(searchLower) ||
      att.agentName?.toLowerCase().includes(searchLower) ||
      att.channel?.toLowerCase().includes(searchLower)
    );
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-card border border-card-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Attendances</h1>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search attendances..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-attendances"
        />
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Agent</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Channel</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Started</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Ended</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Duration</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAttendances.map((att) => (
                <tr key={att.id} className="hover:bg-accent/5 transition-colors" data-testid={`attendance-${att.id}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{att.clientName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{att.agentName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{att.channel || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={att.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {att.startedAt ? format(new Date(att.startedAt), 'MMM d, HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {att.endedAt ? format(new Date(att.endedAt), 'MMM d, HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono-tabular text-muted-foreground">
                    {formatDuration(att.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {att.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAttendances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No attendances found</p>
          </div>
        )}
      </div>
    </div>
  );
}
