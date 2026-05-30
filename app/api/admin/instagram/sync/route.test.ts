/**
 * Instagram Admin API Integration Tests - Manual Sync
 * Tests for POST /api/admin/instagram/sync
 * 
 * Validates: Requirements 5.1, 5.2, 11.1
 */

import { NextRequest } from 'next/server'
import { POST } from './route'
import { credentialManager } from '@/lib/services/credential-manager'
import { InstagramService } from '@/lib/services/instagram/instagram.service'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/services/credential-manager')
jest.mock('@/lib/services/instagram/instagram.service')
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

describe('POST /api/admin/instagram/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when client_id is missing from token', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Missing client_id in JWT token')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only internal users')
  })

  it('should return empty results when no accounts are configured', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results).toEqual([])
    expect(data.message).toBe('No active accounts configured')
  })

  it('should successfully sync a single account', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Test Account',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token123',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })

    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([
      {
        id: 'post-1',
        caption: 'Test post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: '2024-01-01T12:00:00Z',
        permalink: 'https://instagram.com/p/123',
        publishedAt: '2024-01-01T12:00:00Z',
      },
    ])

    mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([
      {
        postId: 'post-1',
        alcance: 100,
        engajamento: 50,
        impressoes: 150,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: '2024-01-01T12:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].accountId).toBe('ig-123')
    expect(data.results[0].postsProcessed).toBe(1)
    expect(data.results[0].metricsUpdated).toBe(1)
    expect(data.results[0].status).toBe('success')
  })

  it('should handle sync failure gracefully', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Test Account',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    mockCredentialManager.getCredential = jest.fn().mockRejectedValue(new Error('Credential error'))

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].status).toBe('partial')
    expect(data.results[0].errors).toHaveLength(1)
    expect(data.results[0].errors[0].type).toBe('VALIDATION')
  })

  it('should sync multiple accounts', async () => {
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
    ])

    mockCredentialManager.getCredential = jest.fn().mockImplementation((accountId) => {
      if (accountId === 'ig-123') {
        return Promise.resolve({
          accountId: 'ig-123',
          accountName: 'Account 1',
          businessAccountId: '123456',
          accessToken: 'token123',
          clickupListId: 'list123',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastValidatedAt: '2024-01-01T00:00:00Z',
        })
      }
      return Promise.resolve({
        accountId: 'ig-456',
        accountName: 'Account 2',
        businessAccountId: '789012',
        accessToken: 'token456',
        clickupListId: 'list456',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      })
    })

    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
    mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results).toHaveLength(2)
    expect(data.summary.total).toBe(2)
  })

  it('should return summary with success/partial/failed counts', async () => {
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

    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Account 1',
      businessAccountId: '123456',
      accessToken: 'token123',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })

    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
    mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.summary).toBeDefined()
    expect(data.summary.total).toBe(1)
    expect(data.summary.successful).toBe(1)
    expect(data.summary.partial).toBe(0)
    expect(data.summary.failed).toBe(0)
  })

  it('should skip inactive accounts', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Account 1',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results).toEqual([])
    expect(data.message).toBe('No active accounts configured')
  })

  it('should return 500 on unexpected error', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest
      .fn()
      .mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})

describe('Sync Result Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track posts processed and metrics updated', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Test Account',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token123',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })

    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([
      {
        id: 'post-1',
        caption: 'Post 1',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/1.jpg',
        timestamp: '2024-01-01T12:00:00Z',
        permalink: 'https://instagram.com/p/1',
        publishedAt: '2024-01-01T12:00:00Z',
      },
      {
        id: 'post-2',
        caption: 'Post 2',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/2.jpg',
        timestamp: '2024-01-01T13:00:00Z',
        permalink: 'https://instagram.com/p/2',
        publishedAt: '2024-01-01T13:00:00Z',
      },
    ])

    mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([
      {
        postId: 'post-1',
        alcance: 100,
        engajamento: 50,
        impressoes: 150,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: '2024-01-01T12:00:00Z',
      },
      {
        postId: 'post-2',
        alcance: 200,
        engajamento: 100,
        impressoes: 300,
        cliques: 20,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-01T13:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.results[0].postsProcessed).toBe(2)
    expect(data.results[0].metricsUpdated).toBe(2)
  })
})
