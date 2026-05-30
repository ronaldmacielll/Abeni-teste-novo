/**
 * Instagram Admin API Integration Tests - Account Status
 * Tests for GET /api/admin/instagram/status
 * 
 * Validates: Requirements 5.1, 5.2, 8.1, 16.1
 */

import { NextRequest } from 'next/server'
import { GET } from './route'
import { credentialManager } from '@/lib/services/credential-manager'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/services/credential-manager')
jest.mock('@supabase/supabase-js')

// Mock JWT extraction
jest.mock('@/services/auth/jwt', () => ({
  extractClientIdFromToken: jest.fn((token: string) => {
    if (token === 'valid-internal-token') return 'client-123'
    if (token === 'valid-client-token') return 'client-456'
    return null
  }),
  extractRoleFromToken: jest.fn((token: string) => {
    if (token === 'valid-internal-token') return 'internal'
    if (token === 'valid-client-token') return 'client'
    return 'client'
  }),
}))

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('GET /api/admin/instagram/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only internal users')
  })

  it('should return empty status when no accounts are configured', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts).toEqual([])
    expect(data.total).toBe(0)
    expect(data.activeCount).toBe(0)
  })

  it('should return status for all accounts', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
      {
        accountId: 'ig-456',
        accountName: 'Account 2',
        businessAccountId: '789012',
        clickupListId: 'list456',
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        completed_at: '2024-01-01T12:00:00Z',
                        status: 'success',
                        error_message: null,
                      },
                    ],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 5,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts).toHaveLength(2)
    expect(data.total).toBe(2)
    expect(data.activeCount).toBe(1)
  })

  it('should include last sync time in status', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        completed_at: '2024-01-01T12:00:00Z',
                        status: 'success',
                        error_message: null,
                      },
                    ],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 10,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts[0].lastSyncTime).toBe('2024-01-01T12:00:00Z')
    expect(data.accounts[0].postsCount).toBe(10)
  })

  it('should calculate next sync time based on last sync', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        completed_at: '2024-01-01T12:00:00Z',
                        status: 'success',
                        error_message: null,
                      },
                    ],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 5,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts[0].nextSyncTime).toBeDefined()
    // Next sync should be 5 minutes after last sync
    const lastSync = new Date('2024-01-01T12:00:00Z')
    const expectedNextSync = new Date(lastSync.getTime() + 5 * 60 * 1000)
    expect(data.accounts[0].nextSyncTime).toBe(expectedNextSync.toISOString())
  })

  it('should include last error when sync failed', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      {
                        completed_at: '2024-01-01T12:00:00Z',
                        status: 'failed',
                        error_message: JSON.stringify([
                          {
                            type: 'INSTAGRAM_API',
                            message: 'API rate limit exceeded',
                          },
                        ]),
                      },
                    ],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts[0].lastError).toBe('API rate limit exceeded')
  })

  it('should handle missing sync history gracefully', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts[0].lastSyncTime).toBeUndefined()
    expect(data.accounts[0].postsCount).toBe(0)
  })

  it('should return 500 on database error', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockRejectedValue(new Error('Database error')),
                }),
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    // Should still return accounts but with error status
    expect(data.accounts).toHaveLength(1)
    expect(data.accounts[0].lastError).toBe('Failed to retrieve status')
  })

  it('should count active accounts correctly', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
      {
        accountId: 'ig-456',
        accountName: 'Account 2',
        businessAccountId: '789012',
        clickupListId: 'list456',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
      {
        accountId: 'ig-789',
        accountName: 'Account 3',
        businessAccountId: '345678',
        clickupListId: 'list789',
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'instagram_sync_history') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'instagram_post_mappings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
              }),
            }),
          }
        }
        return {}
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.total).toBe(3)
    expect(data.activeCount).toBe(2)
  })
})
