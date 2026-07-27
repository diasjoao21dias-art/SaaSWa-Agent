import { useState } from 'react';
import { useListTransactions, useGetFinancialReport, useCreateTransaction, useUpdateTransaction, getListTransactionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

export default function Financial() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: transactions = [], isLoading } = useListTransactions();
  const { data: financialTrend = [], isLoading: trendLoading } = useGetFinancialReport();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredTransactions = transactions.filter(txn => {
    const searchLower = search.toLowerCase();
    return (
      txn.description.toLowerCase().includes(searchLower) ||
      txn.clientName?.toLowerCase().includes(searchLower) ||
      txn.planName?.toLowerCase().includes(searchLower)
    );
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netRevenue = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      dueDate: formData.get('dueDate') as string,
    };

    createTransaction.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          setDialogOpen(false);
          toast({ title: 'Transaction created successfully' });
        },
      }
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTransaction.mutate(
      { id, data: { status, paidAt: status === 'paid' ? new Date().toISOString() : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-card border border-card-border rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-card border border-card-border rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Financial</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="income">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="pending">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                Create Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Income</p>
              <p className="text-2xl font-semibold font-mono-tabular text-green-600 dark:text-green-400 mt-2">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Expense</p>
              <p className="text-2xl font-semibold font-mono-tabular text-red-600 dark:text-red-400 mt-2">
                ${totalExpense.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Revenue</p>
              <p className="text-2xl font-semibold font-mono-tabular text-foreground mt-2">
                ${netRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
        {trendLoading ? (
          <div className="h-64 bg-muted/30 animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={financialTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-transactions"
          />
        </div>

        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Due Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-accent/5 transition-colors" data-testid={`transaction-${txn.id}`}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{txn.description}</td>
                    <td className="px-4 py-3 text-sm font-mono-tabular font-semibold text-foreground">${txn.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{txn.clientName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{txn.planName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {txn.dueDate ? format(new Date(txn.dueDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={txn.status}
                        onValueChange={(status) => handleStatusChange(txn.id, status)}
                      >
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
