/**
 * SyncJobStatus Component
 * 
 * Displays current synchronization status and metrics
 * Implements Requirements: 5.1, 5.2, 11.1, 11.2
 */

'use client';

import React from 'react';
import { Card, Badge } from '@/lib/design-system/components';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { clsx } from 'clsx';

export interface SyncJobStatusData {
  status: 'success' | 'partial' | 'failed' | 'running';
  postsProcessed: number;
  tasksCreated: number;
  tasksUpdated: number;
  metricsUpdated: number;
  duration: number; // in milliseconds
  timestamp: string;
  errorMessage?: string;
}

export interface SyncJobStatusProps {
  data?: SyncJobStatusData | null;
  isLoading?: boolean;
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: SyncJobStatusData['status']): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'success':
      return 'success';
    case 'partial':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'running':
      return 'warning';
    default:
      return 'warning';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: SyncJobStatusData['status']): string {
  switch (status) {
    case 'success':
      return 'Sucesso';
    case 'partial':
      return 'Parcial';
    case 'failed':
      return 'Falha';
    case 'running':
      return 'Em Progresso';
    default:
      return 'Desconhecido';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: SyncJobStatusData['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'partial':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'running':
      return <Zap className="w-5 h-5 text-blue-400 animate-pulse" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
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
 * Format timestamp to readable format
 */
function formatTimestamp(dateString: string): string {
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
 * SyncJobStatus Component
 * 
 * Renders sync job status with:
 * - Status badge (success/partial/failed/running)
 * - Metrics: posts processed, tasks created/updated, metrics updated
 * - Duration and timestamp
 * - Error message if applicable
 * - Visual progress indicator
 */
export const SyncJobStatus: React.FC<SyncJobStatusProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3"></div>
            <p className="text-gray-400">Carregando status...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma sincronização realizada ainda</p>
          <p className="text-sm text-gray-500 mt-1">A próxima sincronização ocorrerá em breve</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(data.status)}
            <div>
              <h3 className="text-lg font-semibold text-white">
                Status de Sincronização
              </h3>
              <p className="text-sm text-gray-400">
                {formatTimestamp(data.timestamp)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(data.status)}>
            {getStatusLabel(data.status)}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Posts Processed */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Posts Processados
            </p>
            <p className="text-2xl font-bold text-blue-400">
              {data.postsProcessed}
            </p>
          </div>

          {/* Tasks Created */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Tasks Criadas
            </p>
            <p className="text-2xl font-bold text-green-400">
              {data.tasksCreated}
            </p>
          </div>

          {/* Tasks Updated */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Tasks Atualizadas
            </p>
            <p className="text-2xl font-bold text-purple-400">
              {data.tasksUpdated}
            </p>
          </div>

          {/* Metrics Updated */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Métricas Atualizadas
            </p>
            <p className="text-2xl font-bold text-yellow-400">
              {data.metricsUpdated}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Duração da sincronização</span>
          </div>
          <span className="text-sm font-semibold text-gray-200">
            {formatDuration(data.duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Progresso Geral
          </p>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-500',
                data.status === 'success' && 'bg-green-500',
                data.status === 'partial' && 'bg-yellow-500',
                data.status === 'failed' && 'bg-red-500',
                data.status === 'running' && 'bg-blue-500 animate-pulse'
              )}
              style={{
                width: data.status === 'running' ? '75%' : '100%',
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {data.errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Erro durante sincronização</p>
              <p className="text-sm text-red-300 mt-1">{data.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        {data.status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm text-green-300">
              ✓ Sincronização concluída com sucesso. Todos os posts e métricas foram atualizados.
            </p>
          </div>
        )}

        {data.status === 'partial' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-300">
              ⚠ Sincronização parcial. Alguns posts podem não ter sido processados. Verifique os erros acima.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
