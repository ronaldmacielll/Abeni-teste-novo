/**
 * TransactionList Component
 * 
 * Displays a list of financial transactions with status indicators and sorting
 * Implements Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.2
 */

'use client';

import React, { useMemo } from 'react';
import { Card } from '@/lib/design-system/components';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Transaction } from '../types/transaction.types';

export interface TransactionListProps {
  transactions: Transaction[];
  onSort?: (field: keyof Transaction) => void;
  sortField?: keyof Transaction;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Format currency value in BRL
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Check if date is today
 */
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get status indicator component
 */
function StatusIndicator({ status }: { status: Transaction['status'] }) {
  const config = {
    Pago: {
      icon: CheckCircle,
      color: 'text-success-main',
      bg: 'bg-success-light',
      label: 'Pago',
    },
    Pendente: {
      icon: Clock,
      color: 'text-warning-main',
      bg: 'bg-warning-light',
      label: 'Pendente',
    },
    Atrasado: {
      icon: AlertCircle,
      color: 'text-danger-main',
      bg: 'bg-danger-light',
      label: 'Atrasado',
    },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <div className={clsx('flex items-center gap-2 px-3 py-1 rounded-full', bg)}>
      <Icon className={clsx('w-4 h-4', color)} />
      <span className={clsx('text-xs font-medium', color)}>
        {label}
      </span>
    </div>
  );
}

/**
 * TransactionList Component
 * 
 * Renders a list of transactions with:
 * - Status indicators (green for Pago, yellow for Pendente, red for Atrasado)
 * - Sorted by due date (ascending by default)
 * - Highlighted transactions with due date = today
 * - Installment information when present
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onSort: _onSort,
  sortField: _sortField = 'dataVencimento',
  sortDirection = 'asc',
}) => {
  // Sort transactions by due date
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.dataVencimento).getTime();
      const dateB = new Date(b.dataVencimento).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [transactions, sortDirection]);

  if (transactions.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma transação encontrada</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => {
              const isDueToday = isToday(transaction.dataVencimento);
              
              return (
                <tr
                  key={transaction.id}
                  className={clsx(
                    'hover:bg-gray-50 transition-colors',
                    isDueToday && 'bg-blue-50'
                  )}
                >
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIndicator status={transaction.status} />
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.descricao}
                      </p>
                      {transaction.parcelamento && (
                        <p className="text-xs text-gray-500">
                          Parcela {transaction.parcelamento.current} de {transaction.parcelamento.total}
                          {' '}({formatCurrency(transaction.parcelamento.valuePerInstallment)}/parcela)
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        transaction.tipo === 'Entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {transaction.tipo}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        transaction.tipo === 'Entrada' ? 'text-success-text' : 'text-danger-text'
                      )}
                    >
                      {transaction.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(transaction.valor)}
                    </p>
                    {transaction.impostosTaxas > 0 && (
                      <p className="text-xs text-gray-500">
                        Impostos: {formatCurrency(transaction.impostosTaxas)}
                      </p>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <p className={clsx('text-sm', isDueToday && 'font-semibold text-primary-600')}>
                        {formatDate(transaction.dataVencimento)}
                      </p>
                      {isDueToday && (
                        <span className="text-xs text-primary-600 font-medium">
                          Vence hoje
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
