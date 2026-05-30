/**
 * useWebhookConfiguration Hook
 * 
 * Hook for managing webhook configuration for Instagram accounts
 * Implements Requirements: 20.1, 20.6
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'

export interface WebhookConfigData {
  success: boolean
  accountId: string
  accountName: string
  webhooksEnabled: boolean
  webhookUrl: string
  createdAt?: string
  updatedAt?: string
}

export interface UseWebhookConfigurationOptions {
  accountId: string
  token: string
}

/**
 * Hook to fetch and manage webhook configuration
 */
export function useWebhookConfiguration({
  accountId,
  token,
}: UseWebhookConfigurationOptions) {
  const [error, setError] = useState<string | null>(null)

  // Fetch webhook configuration
  const {
    data: config,
    isLoading: isLoadingConfig,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['webhook-config', accountId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/admin/instagram/${accountId}/webhooks`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch webhook configuration')
        }

        return (await response.json()) as WebhookConfigData
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        throw err
      }
    },
    enabled: !!accountId && !!token,
  })

  // Update webhook configuration
  const updateMutation = useMutation({
    mutationFn: async (webhooksEnabled: boolean) => {
      try {
        const response = await fetch(
          `/api/admin/instagram/${accountId}/webhooks`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ webhooksEnabled }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update webhook configuration')
        }

        return (await response.json()) as WebhookConfigData
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        throw err
      }
    },
    onSuccess: () => {
      // Refetch configuration after successful update
      refetchConfig()
    },
  })

  const toggleWebhook = useCallback(
    async (enabled: boolean) => {
      setError(null)
      try {
        await updateMutation.mutateAsync(enabled)
      } catch (err) {
        // Error is already set in the mutation
      }
    },
    [updateMutation]
  )

  return {
    config,
    isLoading: isLoadingConfig || updateMutation.isPending,
    error: error || (updateMutation.isError ? 'Failed to update webhook configuration' : null),
    toggleWebhook,
    refetch: refetchConfig,
  }
}
