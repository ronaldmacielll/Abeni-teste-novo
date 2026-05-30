/**
 * Tests for useWebhookConfiguration Hook
 * 
 * Tests fetching and updating webhook configuration
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWebhookConfiguration } from './useWebhookConfiguration'
import React from 'react'

// Mock fetch
global.fetch = jest.fn()

describe('useWebhookConfiguration Hook', () => {
  const mockToken = 'test-token'
  const mockAccountId = 'test-account-123'
  const mockWebhookUrl = 'https://example.com/api/instagram/webhooks'

  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('Fetching webhook configuration', () => {
    it('should fetch webhook configuration on mount', async () => {
      const mockConfig = {
        success: true,
        accountId: mockAccountId,
        accountName: 'Test Account',
        webhooksEnabled: true,
        webhookUrl: mockWebhookUrl,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.config).toEqual(mockConfig)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Account not found' }),
      })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Account not found')
      expect(result.current.config).toBeUndefined()
    })

    it('should not fetch if accountId or token is missing', () => {
      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: '',
            token: mockToken,
          }),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.config).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Toggling webhook', () => {
    it('should toggle webhook enabled state', async () => {
      const mockConfig = {
        success: true,
        accountId: mockAccountId,
        accountName: 'Test Account',
        webhooksEnabled: false,
        webhookUrl: mockWebhookUrl,
      }

      const mockUpdatedConfig = {
        ...mockConfig,
        webhooksEnabled: true,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUpdatedConfig,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUpdatedConfig,
        })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.config).toBeDefined()
      })

      expect(result.current.config?.webhooksEnabled).toBe(false)

      // Toggle webhook
      await result.current.toggleWebhook(true)

      await waitFor(() => {
        expect(result.current.config?.webhooksEnabled).toBe(true)
      })

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/instagram/${mockAccountId}/webhooks`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ webhooksEnabled: true }),
        })
      )
    })

    it('should handle toggle errors', async () => {
      const mockConfig = {
        success: true,
        accountId: mockAccountId,
        accountName: 'Test Account',
        webhooksEnabled: false,
        webhookUrl: mockWebhookUrl,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConfig,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to update' }),
        })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.config).toBeDefined()
      })

      await result.current.toggleWebhook(true)

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to update')
      })
    })

    it('should set isLoading during toggle', async () => {
      const mockConfig = {
        success: true,
        accountId: mockAccountId,
        accountName: 'Test Account',
        webhooksEnabled: false,
        webhookUrl: mockWebhookUrl,
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConfig,
        })
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => ({ ...mockConfig, webhooksEnabled: true }),
                  }),
                100
              )
            )
        )
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockConfig, webhooksEnabled: true }),
        })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.config).toBeDefined()
      })

      const togglePromise = result.current.toggleWebhook(true)

      // Should be loading during toggle
      expect(result.current.isLoading).toBe(true)

      await togglePromise

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Refetch', () => {
    it('should refetch configuration', async () => {
      const mockConfig = {
        success: true,
        accountId: mockAccountId,
        accountName: 'Test Account',
        webhooksEnabled: false,
        webhookUrl: mockWebhookUrl,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      })

      const { result } = renderHook(
        () =>
          useWebhookConfiguration({
            accountId: mockAccountId,
            token: mockToken,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.config).toBeDefined()
      })

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length

      await result.current.refetch()

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })
  })
})
