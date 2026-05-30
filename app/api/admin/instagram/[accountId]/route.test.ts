/**
 * Instagram Admin API Integration Tests - Account Details
 * Tests for PUT /api/admin/instagram/accounts/:accountId and DELETE /api/admin/instagram/accounts/:accountId
 * 
 * Validates: Requirements 1.1, 13.1, 13.2, 8.1
 */

import { NextRequest } from 'next/server'
import { PUT, DELETE } from './route'
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

describe('PUT /api/admin/instagram/[accountId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only internal users')
  })

  it('should return 404 when account does not exist', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockRejectedValue(new Error('Not found'))

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-nonexistent', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-nonexistent' } })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Account not found')
  })

  it('should successfully update account name', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Old Name',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.updateCredential = jest.fn().mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockCredentialManager.updateCredential).toHaveBeenCalledWith(
      'ig-123',
      { accountName: 'Updated Name' },
      'client-123'
    )
  })

  it('should successfully update isActive status', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.updateCredential = jest.fn().mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        isActive: false,
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockCredentialManager.updateCredential).toHaveBeenCalledWith(
      'ig-123',
      { isActive: false },
      'client-123'
    )
  })

  it('should return 400 for invalid request body', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        isActive: 'not-a-boolean',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should return 500 when update fails', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.updateCredential = jest
      .fn()
      .mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    const response = await PUT(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to update account')
  })
})

describe('DELETE /api/admin/instagram/[accountId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer valid-client-token',
      },
    })

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Only internal users')
  })

  it('should return 400 when confirmation is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Deletion requires confirmation')
  })

  it('should return 404 when account does not exist', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockRejectedValue(new Error('Not found'))

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/ig-nonexistent?confirmed=true',
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await DELETE(request, { params: { accountId: 'ig-nonexistent' } })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Account not found')
  })

  it('should successfully delete account with confirmation', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.deleteCredential = jest.fn().mockResolvedValue(undefined)

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/ig-123?confirmed=true',
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockCredentialManager.deleteCredential).toHaveBeenCalledWith('ig-123', 'client-123')
  })

  it('should delete related post mappings and sync history', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.deleteCredential = jest.fn().mockResolvedValue(undefined)

    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        delete: mockDelete,
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/ig-123?confirmed=true',
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(200)

    // Verify that both post mappings and sync history were deleted
    expect(mockSupabase.from).toHaveBeenCalledWith('instagram_post_mappings')
    expect(mockSupabase.from).toHaveBeenCalledWith('instagram_sync_history')
  })

  it('should return 500 when deletion fails', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.deleteCredential = jest
      .fn()
      .mockRejectedValue(new Error('Database error'))

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/ig-123?confirmed=true',
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await DELETE(request, { params: { accountId: 'ig-123' } })
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to delete account')
  })
})

describe('Authorization and Multi-tenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should verify account belongs to client before updating', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.updateCredential = jest.fn().mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/ig-123', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
      body: JSON.stringify({
        accountName: 'Updated Name',
      }),
    })

    await PUT(request, { params: { accountId: 'ig-123' } })

    // Verify that getCredential was called with the correct client_id
    expect(mockCredentialManager.getCredential).toHaveBeenCalledWith('ig-123', 'client-123')
  })

  it('should verify account belongs to client before deleting', async () => {
    const mockCredentialManager = credentialManager as jest.Mocked<typeof credentialManager>
    mockCredentialManager.getCredential = jest.fn().mockResolvedValue({
      accountId: 'ig-123',
      accountName: 'Test Account',
      businessAccountId: '123456',
      accessToken: 'token',
      clickupListId: 'list123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastValidatedAt: '2024-01-01T00:00:00Z',
    })
    mockCredentialManager.deleteCredential = jest.fn().mockResolvedValue(undefined)

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/ig-123?confirmed=true',
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    await DELETE(request, { params: { accountId: 'ig-123' } })

    // Verify that getCredential was called with the correct client_id
    expect(mockCredentialManager.getCredential).toHaveBeenCalledWith('ig-123', 'client-123')
  })
})
