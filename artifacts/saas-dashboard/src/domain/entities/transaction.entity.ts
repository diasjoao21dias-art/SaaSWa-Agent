export type TransactionId = string & { readonly _brand: 'TransactionId' };
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending' | 'overdue';

export interface Transaction {
  readonly id: TransactionId;
  readonly description: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly clientName: string | null;
  readonly planName: string | null;
  readonly dueDate: Date;
}

export interface FinancialSummary {
  readonly mrr: number;
  readonly mrrGrowth: number;
  readonly totalIncome: number;
  readonly totalExpenses: number;
  readonly pendingAmount: number;
}
