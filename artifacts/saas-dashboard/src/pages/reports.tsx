/**
 * Reports — análise de performance com 4 abas:
 * Volume de Conversas | MRR | Performance por Agente | Canais
 */
import {
  useGetConversationReport, useGetFinancialReport,
  useGetAgentReport, useGetChannelBreakdown,
} from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  MOCK_CONV_TREND, MOCK_FINANCIAL_TREND,
  MOCK_AGENT_REPORT, MOCK_CHANNELS,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))',
  'hsl(var(--chart-3))', 'hsl(var(--chart-4))',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
};

function ChartSkeleton() {
  return <div className="h-72 bg-muted/30 animate-pulse rounded-lg" />;
}

export default function Reports() {
  const { data: apiConvTrend = [],  isLoading: convLoading    } = useGetConversationReport();
  const { data: apiFinTrend = [],   isLoading: finLoading     } = useGetFinancialReport();
  const { data: apiAgents = [],     isLoading: agentLoading   } = useGetAgentReport();
  const { data: apiChannels = [],   isLoading: channelLoading } = useGetChannelBreakdown();

  const convTrend  = apiConvTrend.length  ? apiConvTrend  : MOCK_CONV_TREND;
  const finTrend   = apiFinTrend.length   ? apiFinTrend   : MOCK_FINANCIAL_TREND;
  const agents     = apiAgents.length     ? apiAgents     : MOCK_AGENT_REPORT;
  const channels   = apiChannels.length   ? apiChannels   : MOCK_CHANNELS;

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

        {/* ── Conversations Volume ─────────────────────────────────────── */}
        <TabsContent value="conversations" className="mt-4">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Volume de Conversas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 dias</p>
            </div>
            {convLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={convTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Conversas"
                    stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        {/* ── MRR Trend ────────────────────────────────────────────────── */}
        <TabsContent value="mrr" className="mt-4">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">MRR (Receita Recorrente Mensal)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 12 meses</p>
            </div>
            {finLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={finTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`R$${v.toLocaleString('pt-BR')}`, 'MRR']} />
                  <Legend />
                  <Area type="monotone" dataKey="value" name="MRR"
                    stroke="hsl(var(--chart-1))" strokeWidth={2}
                    fill="url(#mrrGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        {/* ── Agent Performance ─────────────────────────────────────────── */}
        <TabsContent value="agents" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart: attendances */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Atendimentos por Agente</h3>
              {agentLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={agents} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="attendances" name="Atendimentos" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table: full metrics */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Métricas Detalhadas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agente</th>
                      <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atend.</th>
                      <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dur. Méd.</th>
                      <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Satisf.</th>
                      <th className="text-right pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resolução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map(a => (
                      <tr key={a.agentId} className="hover:bg-accent/30" data-testid={`agent-metric-${a.agentId}`}>
                        <td className="py-2.5 text-sm font-medium text-foreground">{a.name}</td>
                        <td className="py-2.5 text-right font-mono-tabular text-muted-foreground">{a.attendances.toLocaleString('pt-BR')}</td>
                        <td className="py-2.5 text-right font-mono-tabular text-muted-foreground">{Math.round(a.avgDuration)}s</td>
                        <td className="py-2.5 text-right">
                          <span className={cn('font-mono-tabular text-sm font-semibold',
                            a.satisfaction >= 95 ? 'text-emerald-600 dark:text-emerald-400'
                            : a.satisfaction >= 88 ? 'text-amber-500'
                            : 'text-red-500')}>
                            {a.satisfaction}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono-tabular text-muted-foreground">
                          {a.resolutionRate !== undefined ? `${a.resolutionRate}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Channel Breakdown ─────────────────────────────────────────── */}
        <TabsContent value="channels" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por Canal</h3>
              {channelLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={channels} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={110}
                      dataKey="count" paddingAngle={3}
                      label={({ name, percentage }) => `${percentage ?? ''}%`}
                    >
                      {channels.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, n: string) => [v.toLocaleString('pt-BR'), n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Channel stats table */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Detalhamento</h3>
              <div className="space-y-3">
                {channels.map((ch: any, i) => {
                  const total = channels.reduce((s: number, c: any) => s + c.count, 0);
                  const pct   = ch.percentage ?? Math.round((ch.count / total) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {ch.channel ?? ch.name}
                        </span>
                        <span className="font-mono-tabular text-muted-foreground">
                          {ch.count.toLocaleString('pt-BR')} <span className="text-muted-foreground/60">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
