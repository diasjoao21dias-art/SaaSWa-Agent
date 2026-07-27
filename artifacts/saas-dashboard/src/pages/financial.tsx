import { useTransactions, useFinancialSummary, useFinancialTrend } from '@/application/use-cases/use-financial';
import type { Transaction } from '@/domain/entities/transaction.entity';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
};

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income';
  return (
    <tr className="border-b border-border hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground">{tx.description}</p>
        {tx.clientName && <p className="text-xs text-muted-foreground">{tx.clientName}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
          {isIncome ? 'Receita' : 'Despesa'}
        </span>
      </td>
      <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
      <td className={`px-4 py-3 text-sm font-semibold font-mono-tabular ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        {isIncome ? '+' : '-'} {formatBRL(tx.amount)}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
        {format(tx.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
      </td>
    </tr>
  );
}

export default function Financial() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: trend = [], isLoading: trendLoading } = useFinancialTrend();

  const isLoading = txLoading || summaryLoading || trendLoading;
  if (isLoading) return <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Receitas, despesas e MRR</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="MRR" value={formatBRL(summary.mrr)} icon={DollarSign} trend={{ value: summary.mrrGrowth, isPositive: summary.mrrGrowth >= 0 }} colorClass="bg-primary/10" iconClass="text-primary" />
          <StatCard title="Receita Total" value={formatBRL(summary.totalIncome)} icon={TrendingUp} colorClass="bg-emerald-500/10" iconClass="text-emerald-500" />
          <StatCard title="Despesas" value={formatBRL(summary.totalExpenses)} icon={TrendingDown} colorClass="bg-red-500/10" iconClass="text-red-500" />
          <StatCard title="A Receber" value={formatBRL(summary.pendingAmount)} icon={Clock} colorClass="bg-amber-500/10" iconClass="text-amber-500" />
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">MRR Mensal</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 12 meses</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatBRL(v), 'MRR']} />
            <Area type="monotone" dataKey="value" name="MRR" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Transações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Descrição', 'Tipo', 'Status', 'Valor', 'Vencimento'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
