import type { Transaction, FinancialSummary, TimeSeries } from '../entities/transaction.entity';

export interface IFinancialRepository {
  listTransactions(): Promise<readonly Transaction[]>;
  getSummary(): Promise<FinancialSummary>;
  getMonthlyTrend(): Promise<readonly TimeSeries[]>;
}
