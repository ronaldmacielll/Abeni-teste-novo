/**
 * usePerformanceData Hook
 * 
 * React Query hook for fetching performance posts with caching and error handling
 * Implements Requirements: 13.2, 13.3, 15.3
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { GetPostsResponse } from '../types/post.types';

interface UsePerformanceDataOptions {
  period?: 'week' | 'month';
  enabled?: boolean;
}

interface UsePerformanceDataReturn {
  posts: GetPostsResponse['posts'];
  metadata: GetPostsResponse['metadata'] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => void;
  data: GetPostsResponse | undefined;
}

/**
 * Fetch posts from the BFF API
 */
async function fetchPosts(period: 'week' | 'month' = 'month'): Promise<GetPostsResponse> {
  // Get token from localStorage
  const authSession = localStorage.getItem('auth_session');
  let token = '';
  
  if (authSession) {
    try {
      const session = JSON.parse(authSession);
      token = session.accessToken || '';
    } catch (error) {
      console.error('Failed to parse auth session:', error);
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/posts?period=${period}`, {
    headers,
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
      'Erro ao carregar dados de performance'
    );
  }

  return response.json();
}

/**
 * Hook for fetching performance data with React Query
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background revalidation
 * - Automatic retry with exponential backoff
 * - Error handling with user-friendly messages
 * 
 * @param options - Configuration options
 * @param options.period - Time period filter ('week' or 'month')
 * @param options.enabled - Whether the query should run (default: true)
 * 
 * @example
 * ```tsx
 * const { posts, isLoading, error, refetch } = usePerformanceData({ period: 'month' });
 * ```
 */
export function usePerformanceData(
  options: UsePerformanceDataOptions = {}
): UsePerformanceDataReturn {
  const { period = 'month', enabled = true } = options;

  const query = useQuery<GetPostsResponse, Error>({
    queryKey: ['performance-posts', period],
    queryFn: () => fetchPosts(period),
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
    posts: query.data?.posts || [],
    metadata: query.data?.metadata,
  };
}
