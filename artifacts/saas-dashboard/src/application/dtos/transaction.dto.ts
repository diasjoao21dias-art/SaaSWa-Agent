import { z } from 'zod';

export const TransactionDTOSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  amount: z.number().nonnegative(),
  type: z.enum(['income', 'expense']),
  status: z.enum(['paid', 'pending', 'overdue']),
  clientName: z.string().nullable(),
  planName: z.string().nullable(),
  dueDate: z.string(),
});

export type TransactionDTO = z.infer<typeof TransactionDTOSchema>;

export const FinancialSummaryDTOSchema = z.object({
  mrr: z.number().nonnegative(),
  mrrGrowth: z.number(),
  totalIncome: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  pendingAmount: z.number().nonnegative(),
});

export type FinancialSummaryDTO = z.infer<typeof FinancialSummaryDTOSchema>;

export const TimeSeriesDTOSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export type TimeSeriesDTO = z.infer<typeof TimeSeriesDTOSchema>;
