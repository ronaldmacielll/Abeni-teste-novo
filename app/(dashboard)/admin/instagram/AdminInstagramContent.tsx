/**
 * AdminInstagramContent Component
 * 
 * Main content component for Instagram admin interface
 * Integrates all admin components: form, list, status, history
 * Implements Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InstagramAccountForm,
  InstagramAccountList,
  SyncJobStatus,
  SyncHistory,
  type InstagramAccountFormData,
  type InstagramAccount,
  type SyncJobStatusData,
  type SyncHistoryEntry,
} from '@/modules/admin/components';
import { Card, Button } from '@/lib/design-system/components';
import { Plus, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AdminInstagramContentState {
  showForm: boolean;
  editingAccountId: string | null;
  syncingAccountId: string | null;
  currentPage: number;
  selectedAccountFilter: string | null;
}

/**
 * Fetch Instagram accounts
 */
async function fetchAccounts(): Promise<InstagramAccount[]> {
  const response = await fetch('/api/admin/instagram/accounts', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar contas');
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Fetch sync status
 */
async function fetchSyncStatus(): Promise<SyncJobStatusData | null> {
  const response = await fetch('/api/admin/instagram/status', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.currentSync || null;
}

/**
 * Fetch sync history
 */
async function fetchSyncHistory(page: number = 1, accountId?: string): Promise<{
  entries: SyncHistoryEntry[];
  total: number;
}> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
  });

  if (accountId) {
    params.append('accountId', accountId);
  }

  const response = await fetch(`/api/admin/instagram/sync-history?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar histórico');
  }

  return response.json();
}

/**
 * Add new account
 */
async function addAccount(data: InstagramAccountFormData): Promise<void> {
  const response = await fetch('/api/admin/instagram/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao configurar conta');
  }
}

/**
 * Delete account
 */
async function deleteAccount(accountId: string): Promise<void> {
  const response = await fetch(`/api/admin/instagram/accounts/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao deletar conta');
  }
}

/**
 * Trigger manual sync
 */
async function triggerSync(accountId?: string): Promise<void> {
  const params = accountId ? `?accountId=${accountId}` : '';
  const response = await fetch(`/api/admin/instagram/sync${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao disparar sincronização');
  }
}

/**
 * AdminInstagramContent Component
 */
export default function AdminInstagramContent() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AdminInstagramContentState>({
    showForm: false,
    editingAccountId: null,
    syncingAccountId: null,
    currentPage: 1,
    selectedAccountFilter: null,
  });

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery({
    queryKey: ['instagram-accounts'],
    queryFn: fetchAccounts,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch sync status
  const {
    data: syncStatus,
    isLoading: syncStatusLoading,
  } = useQuery({
    queryKey: ['instagram-sync-status'],
    queryFn: fetchSyncStatus,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch sync history
  const {
    data: syncHistory,
    isLoading: syncHistoryLoading,
    error: syncHistoryError,
  } = useQuery({
    queryKey: ['instagram-sync-history', state.currentPage, state.selectedAccountFilter],
    queryFn: () => fetchSyncHistory(state.currentPage, state.selectedAccountFilter || undefined),
  });

  // Add account mutation
  const addAccountMutation = useMutation({
    mutationFn: addAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts'] });
      setState((prev) => ({ ...prev, showForm: false }));
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts'] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (accountId?: string) => triggerSync(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-sync-history'] });
      setState((prev) => ({ ...prev, syncingAccountId: null }));
    },
  });

  // Handle form submit
  const handleFormSubmit = async (data: InstagramAccountFormData) => {
    await addAccountMutation.mutateAsync(data);
  };

  // Handle delete
  const handleDelete = (accountId: string) => {
    if (confirm('Tem certeza que deseja deletar esta conta? Todos os dados relacionados serão removidos.')) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  // Handle sync
  const handleSync = (accountId: string) => {
    setState((prev) => ({ ...prev, syncingAccountId: accountId }));
    syncMutation.mutate(accountId);
  };

  // Handle manual sync all
  const handleSyncAll = () => {
    syncMutation.mutate();
  };

  // Map accounts to sync history format
  const accountsForFilter = accounts.map((acc) => ({
    accountId: acc.accountId,
    accountName: acc.accountName,
  }));

  // Get syncing status for each account
  const syncingStatus = Object.fromEntries(
    accounts.map((acc) => [acc.accountId, state.syncingAccountId === acc.accountId])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Administração Instagram
          </h1>
          <p className="text-gray-400 mt-2">
            Gerencie suas contas Instagram Business e sincronizações
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleSyncAll}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2"
          >
            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Tudo'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setState((prev) => ({ ...prev, showForm: !prev.showForm }))}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Form Section */}
      {state.showForm && (
        <InstagramAccountForm
          onSubmit={handleFormSubmit}
          onCancel={() => setState((prev) => ({ ...prev, showForm: false }))}
          isLoading={addAccountMutation.isPending}
        />
      )}

      {/* Sync Status Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Status de Sincronização
        </h2>
        <SyncJobStatus
          data={syncStatus}
          isLoading={syncStatusLoading}
        />
      </div>

      {/* Accounts Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Contas Configuradas
        </h2>
        <InstagramAccountList
          accounts={accounts}
          isLoading={accountsLoading}
          error={accountsError instanceof Error ? accountsError.message : null}
          onSync={handleSync}
          onDelete={handleDelete}
          isSyncing={syncingStatus}
        />
      </div>

      {/* Sync History Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Histórico de Sincronizações
        </h2>
        <SyncHistory
          entries={syncHistory?.entries || []}
          isLoading={syncHistoryLoading}
          error={syncHistoryError instanceof Error ? syncHistoryError.message : null}
          totalCount={syncHistory?.total || 0}
          currentPage={state.currentPage}
          pageSize={10}
          onPageChange={(page) => setState((prev) => ({ ...prev, currentPage: page }))}
          onFilterChange={(accountId) =>
            setState((prev) => ({
              ...prev,
              selectedAccountFilter: accountId,
              currentPage: 1,
            }))
          }
          accounts={accountsForFilter}
        />
      </div>

      {/* Error Alert */}
      {deleteAccountMutation.isError && (
        <Card className="bg-red-500/10 border border-red-500/30 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Erro ao deletar conta</p>
            <p className="text-sm text-red-300 mt-1">
              {deleteAccountMutation.error instanceof Error
                ? deleteAccountMutation.error.message
                : 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      )}

      {/* Sync Error Alert */}
      {syncMutation.isError && (
        <Card className="bg-red-500/10 border border-red-500/30 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Erro ao sincronizar</p>
            <p className="text-sm text-red-300 mt-1">
              {syncMutation.error instanceof Error
                ? syncMutation.error.message
                : 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
