import { useQuery } from '@tanstack/react-query';
import { useFinancialRepository } from '@/infrastructure/di/repository.context';

export function useTransactions() {
  const repo = useFinancialRepository();
  return useQuery({ queryKey: ['transactions'], queryFn: () => repo.listTransactions() });
}

export function useFinancialSummary() {
  const repo = useFinancialRepository();
  return useQuery({ queryKey: ['financial-summary'], queryFn: () => repo.getSummary() });
}

export function useFinancialTrend() {
  const repo = useFinancialRepository();
  return useQuery({ queryKey: ['financial-trend'], queryFn: () => repo.getMonthlyTrend() });
}
