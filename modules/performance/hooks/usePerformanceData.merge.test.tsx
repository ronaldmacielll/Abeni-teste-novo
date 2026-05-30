/**
 * usePerformanceData Hook - Multi-Source Merge Tests
 * 
 * Tests for merging posts from multiple sources (ClickUp + Instagram)
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceData } from './usePerformanceData';
import type { GetPostsResponse } from '../types/post.types';

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

describe('usePerformanceData Hook - Multi-Source Merge', () => {
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

  const mockClickUpPost = {
    id: 'cu-post-1',
    title: 'ClickUp Post',
    imageUrl: 'https://example.com/cu-image.jpg',
    status: 'Publicado' as const,
    metrics: {
      alcance: 1000,
      engajamento: 200,
      impressoes: 1500,
      cliques: 100,
    },
    createdAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    clientId: 'client-1',
    source: 'clickup' as const,
  };

  const mockInstagramPost = {
    id: 'ig-post-1',
    title: 'Instagram Post',
    imageUrl: 'https://example.com/ig-image.jpg',
    status: 'Publicado' as const,
    metrics: {
      alcance: 1500,
      engajamento: 250,
      impressoes: 2000,
      cliques: 150,
      likes: 200,
      comments: 50,
    },
    createdAt: '2024-01-16T10:00:00Z',
    publishedAt: '2024-01-16T10:00:00Z',
    clientId: 'client-1',
    source: 'instagram' as const,
    instagramAccountName: 'Test Account',
    instagramAccountId: 'ig-account-1',
  };

  const mockMergedResponse: GetPostsResponse = {
    posts: [mockClickUpPost, mockInstagramPost],
    metadata: {
      total: 2,
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

  describe('Multi-Source Fetching', () => {
    it('should fetch posts from all sources when source is "all"', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.posts).toHaveLength(2);
      expect(result.current.posts).toContainEqual(mockClickUpPost);
      expect(result.current.posts).toContainEqual(mockInstagramPost);
    });

    it('should fetch only ClickUp posts when source is "clickup"', async () => {
      const clickupOnlyResponse: GetPostsResponse = {
        posts: [mockClickUpPost],
        metadata: {
          total: 1,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => clickupOnlyResponse,
      });

      const { result } = renderHook(
        () => usePerformanceData({ period: 'month', source: 'clickup' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('source=clickup');
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].source).toBe('clickup');
    });

    it('should fetch only Instagram posts when source is "instagram"', async () => {
      const instagramOnlyResponse: GetPostsResponse = {
        posts: [mockInstagramPost],
        metadata: {
          total: 1,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => instagramOnlyResponse,
      });

      const { result } = renderHook(
        () => usePerformanceData({ period: 'month', source: 'instagram' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('source=instagram');
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].source).toBe('instagram');
    });
  });

  describe('Post Merging and Sorting', () => {
    it('should merge posts from multiple sources', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.posts).toHaveLength(2);
      expect(result.current.metadata?.total).toBe(2);
    });

    it('should sort posts by date (most recent first)', async () => {
      const sortedResponse: GetPostsResponse = {
        posts: [mockInstagramPost, mockClickUpPost], // Instagram is more recent
        metadata: {
          total: 2,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => sortedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Posts should be sorted by date (most recent first)
      expect(result.current.posts[0].createdAt).toBeGreaterThanOrEqual(
        result.current.posts[1].createdAt
      );
    });

    it('should preserve source information in merged posts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const clickupPost = result.current.posts.find(p => p.source === 'clickup');
      const instagramPost = result.current.posts.find(p => p.source === 'instagram');

      expect(clickupPost?.source).toBe('clickup');
      expect(instagramPost?.source).toBe('instagram');
    });

    it('should preserve Instagram-specific fields in merged posts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const instagramPost = result.current.posts.find(p => p.source === 'instagram');
      expect(instagramPost?.instagramAccountName).toBe('Test Account');
      expect(instagramPost?.instagramAccountId).toBe('ig-account-1');
    });
  });

  describe('Account Filtering', () => {
    it('should filter by Instagram account ID', async () => {
      const filteredResponse: GetPostsResponse = {
        posts: [mockInstagramPost],
        metadata: {
          total: 1,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => filteredResponse,
      });

      const { result } = renderHook(
        () => usePerformanceData({ period: 'month', source: 'all', accountId: 'ig-account-1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('accountId=ig-account-1');
      expect(result.current.posts).toHaveLength(1);
      expect(result.current.posts[0].instagramAccountId).toBe('ig-account-1');
    });

    it('should not include accountId parameter when not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchUrl).not.toContain('accountId=');
    });
  });

  describe('Metrics Consistency Across Sources', () => {
    it('should handle different metric fields for different sources', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const clickupPost = result.current.posts.find(p => p.source === 'clickup');
      const instagramPost = result.current.posts.find(p => p.source === 'instagram');

      // ClickUp post should have basic metrics
      expect(clickupPost?.metrics).toHaveProperty('alcance');
      expect(clickupPost?.metrics).toHaveProperty('engajamento');

      // Instagram post should have all metrics including likes and comments
      expect(instagramPost?.metrics).toHaveProperty('likes');
      expect(instagramPost?.metrics).toHaveProperty('comments');
    });
  });

  describe('Empty Results', () => {
    it('should handle empty posts array', async () => {
      const emptyResponse: GetPostsResponse = {
        posts: [],
        metadata: {
          total: 0,
          period: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const { result } = renderHook(() => usePerformanceData({ period: 'month', source: 'all' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.posts).toHaveLength(0);
      expect(result.current.metadata?.total).toBe(0);
    });
  });

  describe('Query Key Changes', () => {
    it('should refetch when source changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result, rerender } = renderHook(
        ({ source }) => usePerformanceData({ period: 'month', source }),
        {
          wrapper,
          initialProps: { source: 'all' as const },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          posts: [mockClickUpPost],
          metadata: { total: 1, period: 'month', startDate: '2024-01-01', endDate: '2024-01-31' },
        }),
      });

      rerender({ source: 'clickup' as const });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when accountId changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMergedResponse,
      });

      const { result, rerender } = renderHook(
        ({ accountId }) => usePerformanceData({ period: 'month', source: 'all', accountId }),
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
        json: async () => ({
          posts: [mockInstagramPost],
          metadata: { total: 1, period: 'month', startDate: '2024-01-01', endDate: '2024-01-31' },
        }),
      });

      rerender({ accountId: 'ig-account-1' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
