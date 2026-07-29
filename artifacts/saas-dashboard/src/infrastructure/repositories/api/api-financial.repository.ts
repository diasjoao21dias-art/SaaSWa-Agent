import type { IFinancialRepository } from '@/domain/repositories/financial.repository';
import type { Transaction, TransactionId, FinancialSummary } from '@/domain/entities/transaction.entity';
import type { TimeSeries } from '@/domain/entities/dashboard.entity';
import { listTransactions, getFinancialReport } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(r: any): Transaction {
  return {
    id: r.id as TransactionId,
    description: r.description ?? '',
    amount: r.amount ?? 0,
    type: r.type ?? 'expense',
    status: r.status ?? 'pending',
    clientName: r.clientName ?? null,
    planName: r.planName ?? null,
    dueDate: new Date(r.dueDate ?? r.createdAt),
  };
}

export class ApiFinancialRepository implements IFinancialRepository {
  async listTransactions(): Promise<readonly Transaction[]> {
    const rows = await listTransactions();
    return rows.map(mapTransaction);
  }

  async getSummary(): Promise<FinancialSummary> {
    const transactions = await listTransactions();
    const income = transactions.filter((t) => t.type === 'income' && t.status === 'paid');
    const expenses = transactions.filter((t) => t.type === 'expense' && t.status === 'paid');
    const mrr = income.reduce((s, t) => s + (t.amount ?? 0), 0);
    const totalExpenses = expenses.reduce((s, t) => s + (t.amount ?? 0), 0);
    return {
      mrr,
      mrrGrowth: 0,
      totalIncome: mrr,
      totalExpenses,
      pendingAmount: transactions
        .filter((t) => t.status === 'pending')
        .reduce((s, t) => s + (t.amount ?? 0), 0),
    };
  }

  async getMonthlyTrend(): Promise<readonly TimeSeries[]> {
    const points = await getFinancialReport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (points as any[]).map((p) => ({ label: p.label, value: p.value }));
  }
}
