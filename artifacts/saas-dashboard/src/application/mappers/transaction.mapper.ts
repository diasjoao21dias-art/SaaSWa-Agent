import type { Transaction, TransactionId, FinancialSummary } from '@/domain/entities/transaction.entity';
import type { TransactionDTO, FinancialSummaryDTO } from '../dtos/transaction.dto';

export function mapTransactionDTO(dto: TransactionDTO): Transaction {
  return {
    id: dto.id as TransactionId,
    description: dto.description,
    amount: dto.amount,
    type: dto.type,
    status: dto.status,
    clientName: dto.clientName,
    planName: dto.planName,
    dueDate: new Date(dto.dueDate),
  };
}

export function mapFinancialSummaryDTO(dto: FinancialSummaryDTO): FinancialSummary {
  return {
    mrr: dto.mrr,
    mrrGrowth: dto.mrrGrowth,
    totalIncome: dto.totalIncome,
    totalExpenses: dto.totalExpenses,
    pendingAmount: dto.pendingAmount,
  };
}
