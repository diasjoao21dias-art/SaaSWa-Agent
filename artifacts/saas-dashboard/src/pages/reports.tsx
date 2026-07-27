import { useGetConversationReport, useGetFinancialReport, useGetAgentReport, useGetChannelBreakdown } from '@workspace/api-client-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const { data: conversationTrend = [], isLoading: convLoading } = useGetConversationReport();
  const { data: financialTrend = [], isLoading: finLoading } = useGetFinancialReport();
  const { data: agentMetrics = [], isLoading: agentLoading } = useGetAgentReport();
  const { data: channelBreakdown = [], isLoading: channelLoading } = useGetChannelBreakdown();

  const isLoading = convLoading || finLoading || agentLoading || channelLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-80 bg-card border border-card-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Reports</h1>

      {/* Conversation Volume Trend */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Conversation Volume Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={conversationTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="value" name="Conversations" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-1))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Financial MRR Trend */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">MRR Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={financialTrend}>
            <defs>
              <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }} 
            />
            <Legend />
            <Area type="monotone" dataKey="value" name="MRR ($)" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorMRR)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Agent Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Agent</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Attendances</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Avg Duration</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Satisfaction</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentMetrics.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-accent/5" data-testid={`agent-metric-${agent.agentId}`}>
                    <td className="py-3 text-sm font-medium text-foreground">{agent.name}</td>
                    <td className="py-3 text-sm font-mono-tabular text-muted-foreground">{agent.attendances}</td>
                    <td className="py-3 text-sm font-mono-tabular text-muted-foreground">{Math.round(agent.avgDuration)}s</td>
                    <td className="py-3 text-sm font-mono-tabular text-muted-foreground">{agent.satisfaction}%</td>
                    <td className="py-3 text-sm font-mono-tabular text-muted-foreground">
                      {agent.resolutionRate !== undefined ? `${agent.resolutionRate}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agentMetrics.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No agent data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Channel Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ channel, percentage }) => `${channel} ${percentage}%`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {channelBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
