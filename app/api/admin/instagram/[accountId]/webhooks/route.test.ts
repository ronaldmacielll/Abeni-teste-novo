/**
 * Tests for Webhook Configuration API Routes
 * 
 * Tests GET and PUT endpoints for webhook configuration
 */

import { NextRequest } from 'next/server'
import { GET, PUT } from './route'
import * as jwtModule from '@/services/auth/jwt'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/services/auth/jwt')
jest.mock('@supabase/supabase-js')
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Webhook Configuration API Routes', () => {
  const mockToken = 'valid-token'
  const mockClientId = 'test-client-123'
  const mockAccountId = 'test-account-123'
  const mockWebhookUrl = 'https://example.com/api/instagram/webhooks'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
  })

  describe('GET /api/admin/instagram/accounts/:accountId/webhooks', () => {
    it('should return 401 if authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'GET',
      })

      const response = await GET(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 401 if token is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const response = await GET(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should return 404 if account not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await GET(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Account not found')
    })

    it('should return webhook configuration when account exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockCredential = {
        account_id: mockAccountId,
        account_name: 'Test Account',
        business_account_id: '123456789',
      }

      const mockWebhookConfig = {
        account_id: mockAccountId,
        webhooks_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCredential,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockWebhookConfig,
                  error: null,
                }),
              }),
            }),
          }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await GET(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.accountId).toBe(mockAccountId)
      expect(data.accountName).toBe('Test Account')
      expect(data.webhooksEnabled).toBe(true)
      expect(data.webhookUrl).toBe(mockWebhookUrl)
    })

    it('should return webhook configuration with default values if config not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockCredential = {
        account_id: mockAccountId,
        account_name: 'Test Account',
        business_account_id: '123456789',
      }

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCredential,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await GET(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.webhooksEnabled).toBe(false)
    })
  })

  describe('PUT /api/admin/instagram/accounts/:accountId/webhooks', () => {
    it('should return 401 if authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'PUT',
        body: JSON.stringify({ webhooksEnabled: true }),
      })

      const response = await PUT(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 400 if request body is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ webhooksEnabled: 'invalid' }),
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const response = await PUT(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request body')
    })

    it('should return 404 if account not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ webhooksEnabled: true }),
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await PUT(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Account not found')
    })

    it('should create new webhook configuration if not exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ webhooksEnabled: true }),
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockCredential = {
        account_id: mockAccountId,
        account_name: 'Test Account',
        business_account_id: '123456789',
      }

      const mockNewConfig = {
        account_id: mockAccountId,
        webhooks_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCredential,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockNewConfig,
                  error: null,
                }),
              }),
            }),
          }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await PUT(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.webhooksEnabled).toBe(true)
    })

    it('should update existing webhook configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/instagram/test-account/webhooks', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ webhooksEnabled: false }),
      })

      ;(jwtModule.extractClientIdFromToken as jest.Mock).mockReturnValue(mockClientId)

      const mockCredential = {
        account_id: mockAccountId,
        account_name: 'Test Account',
        business_account_id: '123456789',
      }

      const mockExistingConfig = {
        account_id: mockAccountId,
        webhooks_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockUpdatedConfig = {
        account_id: mockAccountId,
        webhooks_enabled: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCredential,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockExistingConfig,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockUpdatedConfig,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
      }

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const response = await PUT(request, { params: { accountId: mockAccountId } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.webhooksEnabled).toBe(false)
    })
  })
})
