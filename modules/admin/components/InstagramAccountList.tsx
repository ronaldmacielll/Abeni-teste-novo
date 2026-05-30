/**
 * InstagramAccountList Component
 * 
 * Displays a list of configured Instagram Business accounts
 * Implements Requirements: 8.1, 16.1, 16.2
 */

'use client';

import React from 'react';
import { Card, Badge, Button } from '@/lib/design-system/components';
import { Edit2, Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export interface InstagramAccount {
  accountId: string;
  accountName: string;
  businessAccountId: string;
  isActive: boolean;
  lastSyncTime?: string;
  nextSyncTime?: string;
  lastError?: string;
}

export interface InstagramAccountListProps {
  accounts: InstagramAccount[];
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
  onSync?: (accountId: string) => void;
  isSyncing?: Record<string, boolean>;
}

/**
 * Format date to Brazilian format (DD/MM/YYYY HH:MM)
 */
function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color
 */
function getStatusColor(isActive: boolean): 'success' | 'warning' {
  return isActive ? 'success' : 'warning';
}

/**
 * Get status label
 */
function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Ativa' : 'Inativa';
}

/**
 * InstagramAccountList Component
 * 
 * Renders a list of Instagram accounts with:
 * - Account name and status
 * - Last sync time and next sync time
 * - Action buttons: edit, delete, manual sync
 * - Loading and error states
 */
export const InstagramAccountList: React.FC<InstagramAccountListProps> = ({
  accounts,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  onSync,
  isSyncing = {},
}) => {
  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3"></div>
            <p className="text-gray-400">Carregando contas...</p>
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
            <p className="text-sm font-medium text-red-400">Erro ao carregar contas</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">Nenhuma conta Instagram configurada</p>
          <p className="text-sm text-gray-500">Adicione uma nova conta para começar a sincronizar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Conta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Última Sincronização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Próxima Sincronização
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark-card divide-y divide-gray-800">
            {accounts.map((account) => {
              const isSyncingNow = isSyncing[account.accountId] || false;
              
              return (
                <tr
                  key={account.accountId}
                  className="hover:bg-gray-800/50 transition-colors"
                >
                  {/* Account Name */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-white">
                        {account.accountName}
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {account.businessAccountId}
                      </p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(account.isActive)}>
                      {getStatusLabel(account.isActive)}
                    </Badge>
                  </td>

                  {/* Last Sync Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatDateTime(account.lastSyncTime)}
                      </span>
                    </div>
                    {account.lastError && (
                      <p className="text-xs text-red-400 mt-1">
                        Erro: {account.lastError}
                      </p>
                    )}
                  </td>

                  {/* Next Sync Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">
                      {formatDateTime(account.nextSyncTime)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {/* Manual Sync Button */}
                      <button
                        onClick={() => onSync?.(account.accountId)}
                        disabled={isSyncingNow}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          isSyncingNow
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        )}
                        title="Sincronizar agora"
                      >
                        <RefreshCw
                          className={clsx(
                            'w-4 h-4',
                            isSyncingNow && 'animate-spin'
                          )}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit?.(account.accountId)}
                        disabled={isSyncingNow}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          isSyncingNow
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        )}
                        title="Editar conta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete?.(account.accountId)}
                        disabled={isSyncingNow}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          isSyncingNow
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        )}
                        title="Deletar conta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
