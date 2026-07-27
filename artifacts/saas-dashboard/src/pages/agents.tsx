import { useAgents } from '@/application/use-cases/use-agents';
import type { Agent, AgentStatus } from '@/domain/entities/agent.entity';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string }> = {
  online: { label: 'Online', dot: 'bg-emerald-500' },
  busy: { label: 'Ocupado', dot: 'bg-amber-500' },
  offline: { label: 'Offline', dot: 'bg-slate-400' },
};

function AgentCard({ agent }: { agent: Agent }) {
  const status = STATUS_CONFIG[agent.status];
  const initials = agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-10 h-10"><AvatarFallback className="text-sm">{initials}</AvatarFallback></Avatar>
          <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card', status.dot)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{agent.role}</p>
        </div>
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full',
          agent.status === 'online' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : agent.status === 'busy' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        )}>
          {status.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
        <Metric label="Ativas" value={agent.activeConversations} />
        <Metric label="Total" value={agent.totalAttendances.toLocaleString('pt-BR')} />
        <Metric label="Satisfação" value={`${agent.satisfactionScore}%`} highlight={agent.satisfactionScore >= 95} />
      </div>
    </div>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={cn('text-base font-bold font-mono-tabular', highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function StatusSummary({ agents }: { agents: readonly Agent[] }) {
  const counts = agents.reduce<Record<AgentStatus, number>>(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    { online: 0, busy: 0, offline: 0 },
  );
  return (
    <div className="flex gap-4">
      {Object.entries(counts).map(([status, count]) => {
        const cfg = STATUS_CONFIG[status as AgentStatus];
        return (
          <div key={status} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
            <span>{count} {cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Agents() {
  const { data: agents = [], isLoading } = useAgents();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-card border border-card-border rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{agents.length} agente(s)</p>
        </div>
        <StatusSummary agents={agents} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a) => <AgentCard key={a.id} agent={a} />)}
      </div>
    </div>
  );
}
