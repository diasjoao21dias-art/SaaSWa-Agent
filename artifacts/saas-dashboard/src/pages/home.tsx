import { useGetDashboardStats, useGetDashboardActivity, useGetConversationReport, useGetChannelBreakdown } from '@workspace/api-client-react';
import { StatCard } from '@/components/ui/stat-card';
import { MessageSquare, Users, Bot, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity = [], isLoading: activityLoading } = useGetDashboardActivity();
  const { data: conversationTrend = [], isLoading: trendLoading } = useGetConversationReport();
  const { data: channelBreakdown = [], isLoading: channelLoading } = useGetChannelBreakdown();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-4 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value={stats.totalConversations}
          icon={MessageSquare}
        />
        <StatCard
          title="Open Conversations"
          value={stats.openConversations}
          icon={MessageSquare}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
        />
        <StatCard
          title="Online Agents"
          value={`${stats.onlineAgents}/${stats.totalAgents}`}
          icon={Bot}
        />
        <StatCard
          title="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: stats.mrrGrowth, isPositive: stats.mrrGrowth >= 0 }}
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats.avgResponseTime}s`}
          icon={Clock}
        />
        <StatCard
          title="Satisfaction Score"
          value={`${stats.satisfactionScore}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Attendances"
          value={stats.totalAttendances}
          icon={Clock}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Volume Trend */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Conversation Volume</h3>
          {trendLoading ? (
            <div className="h-64 bg-muted/30 animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
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
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Channel Breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Channel Breakdown</h3>
          {channelLoading ? (
            <div className="h-64 bg-muted/30 animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={channelBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, percentage }) => `${channel} ${percentage}%`}
                  outerRadius={80}
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
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
        {activityLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded border border-border hover:bg-accent/5 transition-colors"
                data-testid={`activity-${item.id}`}
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  {item.actor && (
                    <p className="text-xs text-muted-foreground mt-1">by {item.actor}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
