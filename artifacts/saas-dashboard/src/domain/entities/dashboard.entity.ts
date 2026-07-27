export interface DashboardStats {
  readonly totalConversations: number;
  readonly openConversations: number;
  readonly totalClients: number;
  readonly onlineAgents: number;
  readonly totalAgents: number;
  readonly mrr: number;
  readonly mrrGrowth: number;
  readonly avgResponseTime: number;
  readonly satisfactionScore: number;
  readonly totalAttendances: number;
}

export interface TimeSeries {
  readonly label: string;
  readonly value: number;
}

export interface ChannelBreakdown {
  readonly channel: string;
  readonly count: number;
  readonly percentage: number;
}

export interface ActivityItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actor: string | null;
  readonly createdAt: Date;
}
