import type { IFinancialRepository } from '@/domain/repositories/financial.repository';
import type { Transaction, FinancialSummary } from '@/domain/entities/transaction.entity';
import type { TimeSeries } from '@/domain/entities/dashboard.entity';
import { TransactionDTOSchema } from '@/application/dtos/transaction.dto';
import { mapTransactionDTO } from '@/application/mappers/transaction.mapper';
import { MOCK_TRANSACTIONS, MOCK_FINANCIAL_TREND } from '@/lib/mock-data';

function computeSummary(transactions: readonly Transaction[]): FinancialSummary {
  const income = transactions.filter((t) => t.type === 'income' && t.status === 'paid');
  const expenses = transactions.filter((t) => t.type === 'expense' && t.status === 'paid');
  const pending = transactions.filter((t) => t.status === 'pending');
  return {
    mrr: 28_450,
    mrrGrowth: 12.4,
    totalIncome: income.reduce((s, t) => s + t.amount, 0),
    totalExpenses: expenses.reduce((s, t) => s + t.amount, 0),
    pendingAmount: pending.reduce((s, t) => s + t.amount, 0),
  };
}

export class MockFinancialRepository implements IFinancialRepository {
  async listTransactions(): Promise<readonly Transaction[]> {
    return MOCK_TRANSACTIONS.map((raw) => mapTransactionDTO(TransactionDTOSchema.parse(raw)));
  }

  async getSummary(): Promise<FinancialSummary> {
    const transactions = await this.listTransactions();
    return computeSummary(transactions);
  }

  async getMonthlyTrend(): Promise<readonly TimeSeries[]> {
    return MOCK_FINANCIAL_TREND;
  }
}
