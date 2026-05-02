/**
 * useFinancialData Hook Tests
 * 
 * Unit tests for the useFinancialData hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFinancialData } from './useFinancialData';
import type { GetTransactionsResponse } from '../types/transaction.types';

// Mock fetch
global.fetch = jest.fn();

const mockResponse: GetTransactionsResponse = {
  transactions: [
    {
      id: '1',
      descricao: 'Test Transaction',
      valor: 1000,
      tipo: 'Entrada',
      status: 'Pago',
      dataVencimento: '2024-01-15T00:00:00.000Z',
      impostosTaxas: 100,
      parcelamento: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      clientId: 'client-123',
    },
  ],
  summary: {
    faturamentoBruto: 1000,
    faturamentoLiquido: 900,
    saldoAtual: 900,
    totalImpostos: 100,
    period: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  },
  projections: {
    projecaoEntradas: 2000,
    projecaoSaidas: 500,
    saldoProjetado: 2400,
    futureTransactions: [],
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useFinancialData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch financial data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.transactions).toEqual(mockResponse.transactions);
    expect(result.current.summary).toEqual(mockResponse.summary);
    expect(result.current.projections).toEqual(mockResponse.projections);
  });

  it('should use correct API endpoint with period parameter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderHook(() => useFinancialData({ period: 'week' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transactions?period=week',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      );
    });
  });

  it('should handle 401 unauthorized error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Não autorizado');
  });

  it('should handle 403 forbidden error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Acesso negado');
  });

  it('should handle 502 service unavailable error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('temporariamente indisponível');
  });

  it('should handle generic error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Internal server error');
  });

  it('should return empty arrays when no data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [],
        summary: {
          faturamentoBruto: 0,
          faturamentoLiquido: 0,
          saldoAtual: 0,
          totalImpostos: 0,
          period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        },
        projections: {
          projecaoEntradas: 0,
          projecaoSaidas: 0,
          saldoProjetado: 0,
          futureTransactions: [],
        },
      }),
    });

    const { result } = renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.transactions).toEqual([]);
  });

  it('should not fetch when enabled is false', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFinancialData({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should use default period of month', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderHook(() => useFinancialData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transactions?period=month',
        expect.any(Object)
      );
    });
  });
});
