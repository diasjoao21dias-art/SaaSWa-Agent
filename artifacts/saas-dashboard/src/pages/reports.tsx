import { useConversationTrend, useChannelBreakdown } from '@/application/use-cases/use-dashboard';
import { useFinancialTrend } from '@/application/use-cases/use-financial';
import { useAgents } from '@/application/use-cases/use-agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

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

function ChartCard({ title, subtitle, children, isLoading }: {
  title: string; subtitle?: string; children: React.ReactNode; isLoading: boolean;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {isLoading ? <div className="h-72 bg-muted/30 animate-pulse rounded-lg" /> : children}
    </div>
  );
}

function ConversationsTab() {
  const { data: trend = [], isLoading } = useConversationTrend();
  return (
    <ChartCard title="Volume de Conversas" subtitle="Últimos 30 dias" isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={4} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="value" name="Conversas" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function MrrTab() {
  const { data: trend = [], isLoading } = useFinancialTrend();
  return (
    <ChartCard title="MRR (Receita Recorrente Mensal)" subtitle="Últimos 12 meses" isLoading={isLoading}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={trend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrReportGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`R$${v.toLocaleString('pt-BR')}`, 'MRR']} />
          <Area type="monotone" dataKey="value" name="MRR" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#mrrReportGrad)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AgentsTab() {
  const { data: agents = [], isLoading } = useAgents();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Atendimentos por Agente" isLoading={isLoading}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={agents} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="totalAttendances" name="Atendimentos" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Métricas Detalhadas" isLoading={isLoading}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Agente', 'Atend.', 'Satisf.', 'Resolução'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-accent/30">
                  <td className="py-2.5 pr-3 text-sm font-medium text-foreground">{a.name}</td>
                  <td className="py-2.5 pr-3 font-mono-tabular text-muted-foreground">{a.totalAttendances.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 pr-3">
                    <span className={cn('font-mono-tabular text-sm font-semibold', a.satisfactionScore >= 95 ? 'text-emerald-600 dark:text-emerald-400' : a.satisfactionScore >= 88 ? 'text-amber-500' : 'text-red-500')}>
                      {a.satisfactionScore}%
                    </span>
                  </td>
                  <td className="py-2.5 font-mono-tabular text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ChannelsTab() {
  const { data: channels = [], isLoading } = useChannelBreakdown();
  const total = channels.reduce((s, c) => s + c.count, 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Distribuição por Canal" isLoading={isLoading}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={channels} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="count" paddingAngle={3}>
              {channels.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v.toLocaleString('pt-BR'), n]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Detalhamento" isLoading={isLoading}>
        <div className="space-y-3">
          {channels.map((ch, i) => {
            const pct = total > 0 ? Math.round((ch.count / total) * 100) : 0;
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {ch.channel}
                  </span>
                  <span className="font-mono-tabular text-muted-foreground">{ch.count.toLocaleString('pt-BR')} <span className="text-muted-foreground/60">({pct}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análise e performance da plataforma</p>
      </div>
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="mrr">MRR</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
        </TabsList>
        <TabsContent value="conversations" className="mt-4"><ConversationsTab /></TabsContent>
        <TabsContent value="mrr" className="mt-4"><MrrTab /></TabsContent>
        <TabsContent value="agents" className="mt-4"><AgentsTab /></TabsContent>
        <TabsContent value="channels" className="mt-4"><ChannelsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
