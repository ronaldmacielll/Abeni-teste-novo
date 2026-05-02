/**
 * useFinancialData Hook
 * 
 * React Query hook for fetching financial transactions with caching and error handling
 * Implements Requirements: 13.2, 13.3, 15.3
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { GetTransactionsResponse } from '../types/transaction.types';

interface UseFinancialDataOptions {
  period?: 'week' | 'month' | 'year';
  enabled?: boolean;
}

interface UseFinancialDataReturn extends UseQueryResult<GetTransactionsResponse, Error> {
  transactions: GetTransactionsResponse['transactions'];
  summary: GetTransactionsResponse['summary'] | undefined;
  projections: GetTransactionsResponse['projections'] | undefined;
}

/**
 * Fetch transactions from the BFF API
 */
async function fetchTransactions(period: 'week' | 'month' | 'year' = 'month'): Promise<GetTransactionsResponse> {
  const response = await fetch(`/api/transactions?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      throw new Error('Não autorizado. Por favor, faça login novamente.');
    }
    
    if (response.status === 403) {
      throw new Error('Acesso negado. Você não tem permissão para acessar estes dados.');
    }
    
    if (response.status === 502 || response.status === 503) {
      throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
    }
    
    throw new Error(
      errorData.error || 
      errorData.message || 
      'Erro ao carregar dados financeiros'
    );
  }

  return response.json();
}

/**
 * Hook for fetching financial data with React Query
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background revalidation
 * - Automatic retry with exponential backoff
 * - Error handling with user-friendly messages
 * 
 * @param options - Configuration options
 * @param options.period - Time period filter ('week', 'month', or 'year')
 * @param options.enabled - Whether the query should run (default: true)
 * 
 * @example
 * ```tsx
 * const { transactions, summary, projections, isLoading, error, refetch } = useFinancialData({ period: 'month' });
 * ```
 */
export function useFinancialData(
  options: UseFinancialDataOptions = {}
): UseFinancialDataReturn {
  const { period = 'month', enabled = true } = options;

  const query = useQuery<GetTransactionsResponse, Error>({
    queryKey: ['financial-transactions', period],
    queryFn: () => fetchTransactions(period),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('autorizado') || error.message.includes('Acesso negado')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 4000);
    },
  });

  return {
    ...query,
    transactions: query.data?.transactions || [],
    summary: query.data?.summary,
    projections: query.data?.projections,
  };
}
