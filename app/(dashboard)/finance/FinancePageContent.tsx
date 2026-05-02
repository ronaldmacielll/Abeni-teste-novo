/**
 * Financial Dashboard Page Content
 * 
 * Main dashboard for the Financial Module
 * Implements Requirements: 7.1, 7.2, 7.3, 7.5, 9.1, 9.2, 9.3, 9.4, 14.1, 14.2, 14.3, 14.4, 15.3
 * 
 * This component is dynamically imported to enable code splitting
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/lib/design-system/components';
import { LoadingState, ErrorBoundary } from '@/modules/shared/components';
import { useFinancialData } from '@/modules/finance/hooks/useFinancialData';
import { SummaryCard, TransactionList, TransactionForm } from '@/modules/finance/components';
import { Plus, RefreshCw } from 'lucide-react';
import type { CreateTransactionRequest } from '@/modules/finance/types/transaction.types';

export default function FinancePageContent() {
  const { transactions, summary, projections, isLoading, error, refetch } = useFinancialData({
    period: 'month',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Handle transaction creation
   */
  const handleCreateTransaction = async (data: CreateTransactionRequest) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao criar transação');
      }

      // Success - close form and refresh data
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      // Re-throw to let form handle the error display
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ErrorBoundary moduleName="Finance">
      <div>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestão Financeira
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingState size="lg" message="Carregando dados financeiros..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-danger-light border border-danger-main rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-danger-main"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-danger-text">
                  Erro ao carregar dados
                </h3>
                <p className="text-sm text-danger-text mt-1">
                  {error.message}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && (
          <>
            {/* Summary Cards - Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6">
              <SummaryCard
                title="Saldo Atual"
                value={summary?.saldoAtual || 0}
                subtitle="Receitas pagas - Despesas pagas"
                variant="primary"
              />
              <SummaryCard
                title="Faturamento Bruto"
                value={summary?.faturamentoBruto || 0}
                subtitle="Total de receitas no período"
                variant="success"
              />
              <SummaryCard
                title="Faturamento Líquido"
                value={summary?.faturamentoLiquido || 0}
                subtitle="Faturamento bruto - Impostos"
                variant="success"
              />
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6">
              <SummaryCard
                title="Entradas Previstas"
                value={projections?.projecaoEntradas || 0}
                subtitle="Receitas futuras pendentes"
                variant="success"
                trend="up"
              />
              <SummaryCard
                title="Saídas Previstas"
                value={projections?.projecaoSaidas || 0}
                subtitle="Despesas futuras pendentes"
                variant="warning"
                trend="down"
              />
            </div>

            {/* Transaction Form Modal/Drawer */}
            {isFormOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Nova Transação
                    </h2>
                    <TransactionForm
                      onSubmit={handleCreateTransaction}
                      onCancel={() => setIsFormOpen(false)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Transações
                </h2>
                <Button
                  variant="primary"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>

              <TransactionList transactions={transactions} />
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
