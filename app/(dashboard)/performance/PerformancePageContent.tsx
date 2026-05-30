/**
 * Performance Dashboard Page Content
 * 
 * Main dashboard for viewing social media post performance metrics from multiple sources
 * Implements Requirements: 4.1, 4.5, 5.1, 5.2, 5.4, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 14.1, 14.2, 14.3, 14.4, 15.3
 * 
 * This component is dynamically imported to enable code splitting
 */

'use client';

import { useState, useMemo } from 'react';
import { usePerformanceData } from '@/modules/performance/hooks/usePerformanceData';
import { PostCard, InstagramPostCard, PeriodFilter } from '@/modules/performance/components';
import { LoadingState, ErrorBoundary } from '@/modules/shared/components';
import { Button } from '@/lib/design-system/components';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { PostSource } from '@/modules/performance/types/post.types';

export default function PerformancePageContent() {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [sourceFilter, setSourceFilter] = useState<PostSource | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  
  const { posts, metadata, isLoading, error, refetch, isRefetching } = usePerformanceData({
    period,
    source: sourceFilter,
    accountId: accountFilter !== 'all' ? accountFilter : undefined,
  });

  // Get unique Instagram accounts for filtering
  const instagramAccounts = useMemo(() => {
    const accounts = new Set<string>();
    posts.forEach(post => {
      if (post.source === 'instagram' && post.instagramAccountName) {
        accounts.add(post.instagramAccountName);
      }
    });
    return Array.from(accounts).sort();
  }, [posts]);

  // Filter posts based on selected filters
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Source filter
      if (sourceFilter !== 'all' && post.source !== sourceFilter) {
        return false;
      }
      
      // Account filter (only for Instagram posts)
      if (accountFilter !== 'all' && post.source === 'instagram') {
        if (post.instagramAccountName !== accountFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [posts, sourceFilter, accountFilter]);

  return (
    <ErrorBoundary moduleName="Performance">
      <div>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
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
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Posts Recentes
                </h2>
                {metadata && (
                  <p className="text-sm text-gray-400 mt-1">
                    {filteredPosts.length} {filteredPosts.length === 1 ? 'post encontrado' : 'posts encontrados'}
                    {' • '}
                    {period === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                  </p>
                )}
              </div>
              <PeriodFilter selected={period} onChange={setPeriod} />
            </div>

            {/* Source and Account Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Source Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">
                  Filtrar por Fonte
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'clickup', 'instagram'] as const).map((source) => (
                    <button
                      key={source}
                      onClick={() => {
                        setSourceFilter(source);
                        setAccountFilter('all'); // Reset account filter when changing source
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        sourceFilter === source
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {source === 'all' ? 'Todas' : source === 'clickup' ? 'ClickUp' : 'Instagram'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Filter (only show for Instagram) */}
              {(sourceFilter === 'instagram' || sourceFilter === 'all') && instagramAccounts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">
                    Filtrar por Conta Instagram
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setAccountFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        accountFilter === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Todas
                    </button>
                    {instagramAccounts.map((account) => (
                      <button
                        key={account}
                        onClick={() => setAccountFilter(account)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          accountFilter === account
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {account}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <LoadingState size="lg" message="Carregando posts..." />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-dark-card rounded-2xl shadow-xl border border-red-500/30 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Erro ao carregar dados
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
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
          {!isLoading && !error && filteredPosts.length === 0 && (
            <div className="bg-dark-card rounded-2xl shadow-xl border border-gray-800 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhum post encontrado
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Não há posts para os filtros selecionados.
                  {period === 'week' 
                    ? ' Tente selecionar "Mês" para ver mais resultados.' 
                    : ' Tente alterar os filtros ou aguarde novos posts.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPeriod(period === 'week' ? 'month' : 'week');
                    setSourceFilter('all');
                    setAccountFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          {!isLoading && !error && filteredPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPosts.map((post) => {
                if (post.source === 'instagram') {
                  return <InstagramPostCard key={post.id} post={post} />;
                }
                return <PostCard key={post.id} post={post} />;
              })}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
