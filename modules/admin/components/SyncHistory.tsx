/**
 * SyncHistory Component
 * 
 * Displays synchronization history with pagination and filtering
 * Implements Requirements: 11.1, 11.2, 17.1
 */

'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@/lib/design-system/components';
import { ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export interface SyncHistoryEntry {
  id: string;
  accountId: string;
  accountName: string;
  status: 'success' | 'partial' | 'failed';
  postsProcessed: number;
  tasksCreated: number;
  tasksUpdated: number;
  metricsUpdated: number;
  errorMessage?: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface SyncHistoryProps {
  entries: SyncHistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onFilterChange?: (accountId: string | null) => void;
  accounts?: Array<{ accountId: string; accountName: string }>;
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: SyncHistoryEntry['status']): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'success':
      return 'success';
    case 'partial':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'warning';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: SyncHistoryEntry['status']): string {
  switch (status) {
    case 'success':
      return 'Sucesso';
    case 'partial':
      return 'Parcial';
    case 'failed':
      return 'Falha';
    default:
      return 'Desconhecido';
  }
}

/**
 * Format date to Brazilian format (DD/MM/YYYY HH:MM:SS)
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format duration in milliseconds to readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * SyncHistory Component
 * 
 * Renders sync history with:
 * - Table of sync entries with status, metrics, duration
 * - Pagination controls
 * - Filter by account
 * - Loading and error states
 */
export const SyncHistory: React.FC<SyncHistoryProps> = ({
  entries,
  isLoading = false,
  error = null,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onFilterChange,
  accounts = [],
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const handleFilterChange = (accountId: string | null) => {
    setSelectedAccountId(accountId);
    onFilterChange?.(accountId);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3"></div>
            <p className="text-gray-400">Carregando histórico...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Erro ao carregar histórico</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Histórico de Sincronizações
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Total: {totalCount} sincronizações
          </p>
        </div>

        {/* Filter by Account */}
        {accounts.length > 0 && (
          <select
            value={selectedAccountId || ''}
            onChange={(e) => handleFilterChange(e.target.value || null)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.accountId} value={account.accountId}>
                {account.accountName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma sincronização encontrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tasks Criadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tasks Atualizadas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-gray-800">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-800/50 transition-colors"
                >
                  {/* Date/Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-300">
                        {formatDateTime(entry.startedAt)}
                      </p>
                      {entry.errorMessage && (
                        <p className="text-xs text-red-400">
                          Erro: {entry.errorMessage.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Account */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-300">
                      {entry.accountName}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusVariant(entry.status)}>
                      {getStatusLabel(entry.status)}
                    </Badge>
                  </td>

                  {/* Posts Processed */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-blue-400">
                      {entry.postsProcessed}
                    </span>
                  </td>

                  {/* Tasks Created */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-green-400">
                      {entry.tasksCreated}
                    </span>
                  </td>

                  {/* Tasks Updated */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-purple-400">
                      {entry.tasksUpdated}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-300">
                      {formatDuration(entry.durationMs)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPreviousPage}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNextPage}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="flex items-center gap-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
