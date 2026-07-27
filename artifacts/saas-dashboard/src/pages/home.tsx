/**
 * Home — Visão Geral: KPIs, gráficos de volume e canais, feed de atividade.
 * Dados via RepositoryProvider (mock → API sem alteração nos componentes).
 */
import {
  useDashboardStats,
  useConversationTrend,
  useChannelBreakdown,
  useRecentActivity,
} from '@/application/use-cases/use-dashboard';
import { StatCard } from '@/components/ui/stat-card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SPARKLINES } from '@/lib/mock-data';
import {
  MessageSquare, Users, Bot, DollarSign,
  Clock, TrendingUp, CheckCircle, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardStats } from '@/domain/entities/dashboard.entity';

const CHART_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))',
  'hsl(var(--chart-3))', 'hsl(var(--chart-4))',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-card border border-card-border rounded-xl h-28 animate-pulse" />
      ))}
    </div>
  );
}

function KpiCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard title="Total de Conversas" value={stats.totalConversations.toLocaleString('pt-BR')} icon={MessageSquare} sparkline={SPARKLINES.conversations} colorClass="bg-sky-500/10" iconClass="text-sky-500" />
      <StatCard title="Conversas Abertas" value={stats.openConversations} icon={Activity} colorClass="bg-amber-500/10" iconClass="text-amber-500" />
      <StatCard title="Total de Clientes" value={stats.totalClients.toLocaleString('pt-BR')} icon={Users} sparkline={SPARKLINES.clients} colorClass="bg-violet-500/10" iconClass="text-violet-500" />
      <StatCard title="Agentes Online" value={`${stats.onlineAgents}/${stats.totalAgents}`} icon={Bot} colorClass="bg-emerald-500/10" iconClass="text-emerald-500" />
      <StatCard title="MRR" value={`$${stats.mrr.toLocaleString('pt-BR')}`} icon={DollarSign} trend={{ value: stats.mrrGrowth, isPositive: stats.mrrGrowth >= 0 }} sparkline={SPARKLINES.mrr} colorClass="bg-primary/10" iconClass="text-primary" />
      <StatCard title="Tempo Médio de Resp." value={`${stats.avgResponseTime}s`} icon={Clock} sparkline={SPARKLINES.response} colorClass="bg-orange-500/10" iconClass="text-orange-500" />
      <StatCard title="Satisfação" value={`${stats.satisfactionScore}%`} icon={TrendingUp} colorClass="bg-emerald-500/10" iconClass="text-emerald-500" />
      <StatCard title="Total de Atendimentos" value={stats.totalAttendances.toLocaleString('pt-BR')} icon={CheckCircle} colorClass="bg-sky-500/10" iconClass="text-sky-500" />
    </div>
  );
}

function VolumeChart() {
  const { data: trend = [], isLoading } = useConversationTrend();
  return (
    <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Volume de Conversas</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 dias</p>
      </div>
      {isLoading ? (
        <div className="h-56 bg-muted/30 animate-pulse rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={5} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="value" name="Conversas" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#convGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ChannelChart() {
  const { data: channels = [], isLoading } = useChannelBreakdown();
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Canais</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribuição por canal</p>
      </div>
      {isLoading ? (
        <div className="h-56 bg-muted/30 animate-pulse rounded-lg" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={channels} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" paddingAngle={3}>
                {channels.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [v.toLocaleString('pt-BR'), name]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-3 space-y-1.5">
            {channels.map((ch, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{ch.channel}</span>
                </span>
                <span className="font-medium font-mono-tabular text-foreground">{ch.percentage}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ActivityFeed() {
  const { data: activity = [], isLoading } = useRecentActivity();
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Atividade Recente</h3>
        <span className="text-xs text-muted-foreground">{activity.length} eventos</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/30 animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {activity.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                {item.actor && <p className="text-[11px] text-muted-foreground/70 mt-0.5">por {item.actor}</p>}
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) return <div className="p-6"><SkeletonGrid /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <KpiCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <VolumeChart />
        <ChannelChart />
      </div>
      <ActivityFeed />
    </div>
  );
}
