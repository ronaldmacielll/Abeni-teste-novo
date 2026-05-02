/**
 * usePerformanceData Hook Tests
 * 
 * Tests for the usePerformanceData React Query hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceData } from './usePerformanceData';
import type { GetPostsResponse } from '../types/post.types';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retry for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePerformanceData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse: GetPostsResponse = {
    posts: [
      {
        id: '1',
        title: 'Test Post',
        imageUrl: 'https://example.com/image.jpg',
        status: 'Publicado',
        metrics: {
          alcance: 1000,
          engajamento: 500,
          impressoes: 2000,
          cliques: 100,
        },
        createdAt: '2024-01-15T10:00:00Z',
        publishedAt: '2024-01-15T10:00:00Z',
        clientId: 'client-123',
      },
    ],
    metadata: {
      total: 1,
      period: 'month',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
    },
  };

  it('should fetch posts successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.posts).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toEqual(mockResponse.posts);
    expect(result.current.metadata).toEqual(mockResponse.metadata);
    expect(result.current.error).toBeNull();
  });

  it('should use correct query key with period', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    renderHook(() => usePerformanceData({ period: 'week' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts?period=week',
        expect.any(Object)
      );
    });
  });

  it('should default to month period', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts?period=month',
        expect.any(Object)
      );
    });
  });

  it('should handle 401 unauthorized error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('Não autorizado');
  });

  it('should handle 403 forbidden error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('Acesso negado');
  });

  it('should handle 502 bad gateway error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad Gateway' }),
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('temporariamente indisponível');
  });

  it('should handle 503 service unavailable error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' }),
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('temporariamente indisponível');
  });

  it('should handle generic error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Internal Server Error');
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => usePerformanceData({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not be loading
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return empty array when no data', async () => {
    const { result } = renderHook(() => usePerformanceData({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.posts).toEqual([]);
    expect(result.current.metadata).toBeUndefined();
  });

  it('should include credentials in fetch request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    const { result } = renderHook(() => usePerformanceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('Erro ao carregar dados');
  });
});
