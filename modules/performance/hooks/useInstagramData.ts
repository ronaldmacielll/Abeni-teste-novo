/**
 * useInstagramData Hook
 * 
 * React Query hook for fetching Instagram posts with caching and error handling
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import type { GetInstagramPostsResponse } from '../types/post.types';

// Validation schema for period
const PeriodSchema = z.enum(['week', 'month']);
type Period = z.infer<typeof PeriodSchema>;

interface UseInstagramDataOptions {
  period?: Period;
  enabled?: boolean;
  accountId?: string;
}

interface UseInstagramDataReturn {
  posts: GetInstagramPostsResponse['posts'];
  metadata: GetInstagramPostsResponse['metadata'] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => void;
  data: GetInstagramPostsResponse | undefined;
}

/**
 * Fetch Instagram posts from the BFF API
 */
async function fetchInstagramPosts(
  period: Period = 'month',
  accountId?: string
): Promise<GetInstagramPostsResponse> {
  // Validate period
  const validatedPeriod = PeriodSchema.parse(period);

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

  // Build query string
  const params = new URLSearchParams();
  params.append('period', validatedPeriod);
  params.append('source', 'instagram');
  if (accountId) {
    params.append('accountId', accountId);
  }

  const response = await fetch(`/api/posts?${params.toString()}`, {
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
      'Erro ao carregar dados do Instagram'
    );
  }

  return response.json();
}

/**
 * Hook for fetching Instagram data with React Query
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background revalidation
 * - Automatic retry with exponential backoff
 * - Error handling with user-friendly messages
 * - Support for filtering by period and account
 * - Period validation with Zod
 * 
 * @param options - Configuration options
 * @param options.period - Time period filter ('week' or 'month')
 * @param options.enabled - Whether the query should run (default: true)
 * @param options.accountId - Filter by Instagram account ID
 * 
 * @example
 * ```tsx
 * const { posts, isLoading, error, refetch } = useInstagramData({ period: 'month' });
 * ```
 */
export function useInstagramData(
  options: UseInstagramDataOptions = {}
): UseInstagramDataReturn {
  const { period = 'month', enabled = true, accountId } = options;

  // Validate period at hook level
  let validatedPeriod: Period = 'month';
  try {
    validatedPeriod = PeriodSchema.parse(period);
  } catch (error) {
    console.error('Invalid period provided:', period, error);
    validatedPeriod = 'month'; // Fallback to default
  }

  const query = useQuery<GetInstagramPostsResponse, Error>({
    queryKey: ['instagram-posts', validatedPeriod, accountId],
    queryFn: () => fetchInstagramPosts(validatedPeriod, accountId),
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
