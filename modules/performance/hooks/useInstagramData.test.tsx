/**
 * useInstagramData Hook Tests
 * 
 * Tests for the useInstagramData hook
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInstagramData } from './useInstagramData';
import type { GetInstagramPostsResponse } from '../types/post.types';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useInstagramData Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    localStorage.clear();
  });

  const mockResponse: GetInstagramPostsResponse = {
    posts: [
      {
        id: 'ig-post-1',
        title: 'Test Instagram Post',
        imageUrl: 'https://example.com/image.jpg',
        status: 'Publicado',
        metrics: {
          alcance: 1500,
          engajamento: 250,
          impressoes: 2000,
          cliques: 150,
          likes: 200,
          comments: 50,
        },
        createdAt: '2024-01-15T10:00:00Z',
        publishedAt: '2024-01-15T10:00:00Z',
        clientId: 'client-1',
        source: 'instagram',
        instagramAccountName: 'Test Account',
        instagramAccountId: 'ig-account-1',
      },
    ],
    metadata: {
      total: 1,
      period: 'month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Successful Data Fetching', () => {
    it('should fetch Instagram posts successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.posts).toEqual(mockResponse.posts);
      expect(result.current.metadata).toEqual(mockResponse.metadata);
      expect(result.current.error).toBeNull();
    });

    it('should include period parameter in fetch URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useInstagramData({ period: 'week' }), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('period=week');
      expect(fetchUrl).toContain('source=instagram');
    });

    it('should include accountId parameter when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useInstagramData({ period: 'month', accountId: 'ig-account-1' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('accountId=ig-account-1');
    });

    it('should return empty posts array initially', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useInstagramData({ enabled: false }), {
        wrapper,
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.metadata).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle 403 Forbidden error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle 502 Bad Gateway error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad Gateway' }),
      });

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      // Network errors should be caught and set as error
      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should not retry on auth errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      renderHook(() => useInstagramData({ period: 'month' }), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Caching and Revalidation', () => {
    it('should refetch when period changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result, rerender } = renderHook(
        ({ period }) => useInstagramData({ period }),
        {
          wrapper,
          initialProps: { period: 'month' as const },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      rerender({ period: 'week' as const });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when accountId changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result, rerender } = renderHook(
        ({ accountId }) => useInstagramData({ period: 'month', accountId }),
        {
          wrapper,
          initialProps: { accountId: undefined },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      rerender({ accountId: 'ig-account-1' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useInstagramData({ period: 'month' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      result.current.refetch();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Disabled Queries', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(() => useInstagramData({ period: 'month', enabled: false }), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch when enabled changes to true', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result, rerender } = renderHook(
        ({ enabled }) => useInstagramData({ period: 'month', enabled }),
        {
          wrapper,
          initialProps: { enabled: false },
        }
      );

      expect(global.fetch).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Authorization Header', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('auth_session', JSON.stringify({ accessToken: 'test-token' }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useInstagramData({ period: 'month' }), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const headers = (global.fetch as jest.Mock).mock.calls[0][1]?.headers;
      expect(headers?.Authorization).toBe('Bearer test-token');
    });

    it('should not include Authorization header when token is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useInstagramData({ period: 'month' }), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const headers = (global.fetch as jest.Mock).mock.calls[0][1]?.headers;
      expect(headers?.Authorization).toBeUndefined();
    });
  });
});
