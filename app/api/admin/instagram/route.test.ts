/**
 * Instagram Admin API Integration Tests
 * Tests for POST /api/admin/instagram/accounts and GET /api/admin/instagram/accounts
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 16.1
 */

import { NextRequest } from 'next/server'
import { POST, GET } from './route'
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

describe('POST /api/admin/instagram/accounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when client_id is missing from token', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Missing client_id in JWT token')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Only internal users can manage Instagram accounts')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        // Missing businessAccountId, accessToken, clickupListId
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should return 400 when Instagram credentials are invalid', async () => {
    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.validateCredentials = jest.fn().mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'invalid-token',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid Instagram credentials')
  })

  it('should successfully add a new account with valid credentials', async () => {
    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.validateCredentials = jest.fn().mockResolvedValue(true)

    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.storeCredential = jest.fn().mockResolvedValue(undefined)

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'valid-token',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.accountId).toBeDefined()
    expect(data.message).toBe('Instagram account configured successfully')
  })

  it('should return 500 when credential storage fails', async () => {
    const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
    mockInstagramService.prototype.validateCredentials = jest.fn().mockResolvedValue(true)

    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.storeCredential = jest
      .fn()
      .mockRejectedValue(new Error('Storage failed'))

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'valid-token',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to store account credentials')
  })
})

describe('GET /api/admin/instagram/accounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when client_id is missing from token', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Missing client_id in JWT token')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Only internal users can view Instagram accounts')
  })

  it('should return empty list when no accounts are configured', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
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
  })

  it('should return list of accounts with sync status', async () => {
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

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    completed_at: '2024-01-01T12:00:00Z',
                    status: 'success',
                  },
                ],
              }),
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts).toHaveLength(1)
    expect(data.accounts[0].accountName).toBe('Test Account')
    expect(data.accounts[0].lastSyncTime).toBe('2024-01-01T12:00:00Z')
    expect(data.total).toBe(1)
  })

  it('should return 500 when credential retrieval fails', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest
      .fn()
      .mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to retrieve accounts')
  })
})

describe('Multi-tenancy and Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should isolate accounts by client_id', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([
      {
        accountId: 'ig-123',
        accountName: 'Client 1 Account',
        businessAccountId: '123456',
        clickupListId: 'list123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    // Verify that listCredentials was called with the correct client_id
    expect(mockCredentialManager.listCredentials).toHaveBeenCalledWith('client-123')
  })

  it('should not allow client role to add accounts', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only internal users')
  })
})

describe('Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate accountName is not empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: '',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should validate businessAccountId is not empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '',
        accessToken: 'token123',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should validate accessToken is not empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: '',
        clickupListId: 'list123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should validate clickupListId is not empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/accounts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: '',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })
})
