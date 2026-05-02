/**
 * Performance Dashboard Page Content
 * 
 * Main dashboard for viewing social media post performance metrics
 * Implements Requirements: 4.1, 4.5, 5.1, 5.2, 5.4, 13.1, 14.1, 14.2, 14.3, 14.4, 15.3
 * 
 * This component is dynamically imported to enable code splitting
 */

'use client';

import { useState } from 'react';
import { usePerformanceData } from '@/modules/performance/hooks/usePerformanceData';
import { PostCard, PeriodFilter } from '@/modules/performance/components';
import { LoadingState, ErrorBoundary } from '@/modules/shared/components';
import { Button } from '@/lib/design-system/components';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PerformancePageContent() {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  
  const { posts, metadata, isLoading, error, refetch, isRefetching } = usePerformanceData({
    period,
  });

  return (
    <ErrorBoundary moduleName="Performance">
      <div>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Performance Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Filters Section */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Posts Recentes
              </h2>
              {metadata && (
                <p className="text-sm text-gray-600 mt-1">
                  {metadata.total} {metadata.total === 1 ? 'post encontrado' : 'posts encontrados'}
                  {' • '}
                  {period === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                </p>
              )}
            </div>
            <PeriodFilter selected={period} onChange={setPeriod} />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <LoadingState size="lg" message="Carregando posts..." />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-danger-light p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-danger-main" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Erro ao carregar dados
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {error.message}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => refetch()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && posts.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum post encontrado
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Não há posts para o período selecionado.
                  {period === 'week' 
                    ? ' Tente selecionar "Mês" para ver mais resultados.' 
                    : ' Tente selecionar "Semana" ou aguarde novos posts.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setPeriod(period === 'week' ? 'month' : 'week')}
                >
                  Alterar Período
                </Button>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          {!isLoading && !error && posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
