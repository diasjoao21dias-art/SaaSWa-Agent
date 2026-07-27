/**
 * Financial — KPIs de receita, gráfico de área e tabela de transações.
 */
import { useState } from 'react';
import {
  useListTransactions, useGetFinancialReport,
  useCreateTransaction, useUpdateTransaction, getListTransactionsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { MOCK_TRANSACTIONS, MOCK_FINANCIAL_TREND } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const CHART_TOOLTIP = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
};

export default function Financial() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: apiTxns = [], isLoading } = useListTransactions();
  const { data: apiTrend = [], isLoading: trendLoading } = useGetFinancialReport();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transactions = apiTxns.length ? apiTxns : MOCK_TRANSACTIONS;
  const trend = apiTrend.length ? apiTrend : MOCK_FINANCIAL_TREND;

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.planName?.toLowerCase().includes(q)
    );
  });

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netRevenue   = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      description: fd.get('description') as string,
      amount: Number(fd.get('amount')),
      type: fd.get('type') as string,
      status: fd.get('status') as string,
      dueDate: fd.get('dueDate') as string,
    };
    createTransaction.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        setDialogOpen(false);
        toast({ title: 'Transação criada' });
      },
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTransaction.mutate(
      { id, data: { status, paidAt: status === 'paid' ? new Date().toISOString() : undefined } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() }) },
    );
  };

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-card border border-card-border rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-card border border-card-border rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receitas e despesas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-2" /> Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Descrição *</Label><Input name="description" required /></div>
              <div><Label>Valor (R$) *</Label><Input name="amount" type="number" step="0.01" required /></div>
              <div>
                <Label>Tipo</Label>
                <Select name="type" defaultValue="income">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue="pending">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Vencimento</Label><Input name="dueDate" type="date" /></div>
              <Button type="submit" className="w-full" disabled={createTransaction.isPending}>Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Receita Total', value: totalIncome,  icon: TrendingUp,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Despesa Total', value: totalExpense, icon: TrendingDown, color: 'text-red-500 dark:text-red-400',           bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: 'Lucro Líquido', value: netRevenue,   icon: DollarSign,   color: 'text-primary',                             bg: 'bg-primary/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-bold font-mono-tabular mt-1', color)}>
                R${value.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Tendência de Receita</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 12 meses</p>
        </div>
        {trendLoading ? (
          <div className="h-56 bg-muted/30 animate-pulse rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="finGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`R$${v.toLocaleString('pt-BR')}`, 'Receita']} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2}
                fill="url(#finGradient)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transactions table */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar transações…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9"
            data-testid="input-search-transactions" />
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Descrição', 'Valor', 'Tipo', 'Status', 'Cliente', 'Plano', 'Vencimento', 'Ação'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(txn => (
                  <tr key={txn.id} className="hover:bg-accent/30 transition-colors" data-testid={`transaction-${txn.id}`}>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{txn.description}</td>
                    <td className={cn(
                      'px-4 py-3 font-bold font-mono-tabular whitespace-nowrap',
                      txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                    )}>
                      {txn.type === 'expense' ? '−' : '+'}R${txn.amount.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={txn.type} /></td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{txn.clientName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{txn.planName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {txn.dueDate ? format(new Date(txn.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Select value={txn.status} onValueChange={s => handleStatusChange(txn.id, s)}>
                        <SelectTrigger className="h-7 text-xs w-28 bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <DollarSign className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
