/**
 * Instagram Admin API Integration Tests - Sync History
 * Tests for GET /api/admin/instagram/sync-history
 * 
 * Validates: Requirements 11.1, 11.2, 17.1
 */

import { NextRequest } from 'next/server'
import { GET } from './route'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
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

describe('GET /api/admin/instagram/sync-history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
      method: 'GET',
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid authorization header')
  })

  it('should return 403 when user is not internal', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
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

  it('should return empty history when no syncs have occurred', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.history).toEqual([])
    expect(data.pagination.total).toBe(0)
  })

  it('should return sync history with default pagination', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'sync-1',
                  account_id: 'ig-123',
                  status: 'success',
                  posts_processed: 5,
                  tasks_created: 3,
                  tasks_updated: 2,
                  metrics_updated: 5,
                  error_message: null,
                  duration_ms: 1500,
                  started_at: '2024-01-01T12:00:00Z',
                  completed_at: '2024-01-01T12:00:01.5Z',
                },
              ],
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.history).toHaveLength(1)
    expect(data.history[0].accountId).toBe('ig-123')
    expect(data.history[0].status).toBe('success')
    expect(data.pagination.limit).toBe(20)
    expect(data.pagination.offset).toBe(0)
  })

  it('should support custom limit and offset', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              count: 100,
              error: null,
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?limit=10&offset=20',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.offset).toBe(20)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should filter by accountId', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'sync-1',
              account_id: 'ig-123',
              status: 'success',
              posts_processed: 5,
              tasks_created: 3,
              tasks_updated: 2,
              metrics_updated: 5,
              error_message: null,
              duration_ms: 1500,
              started_at: '2024-01-01T12:00:00Z',
              completed_at: '2024-01-01T12:00:01.5Z',
            },
          ],
          count: 1,
          error: null,
        }),
      }),
    })

    const mockEq = jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'sync-1',
              account_id: 'ig-123',
              status: 'success',
              posts_processed: 5,
              tasks_created: 3,
              tasks_updated: 2,
              metrics_updated: 5,
              error_message: null,
              duration_ms: 1500,
              started_at: '2024-01-01T12:00:00Z',
              completed_at: '2024-01-01T12:00:01.5Z',
            },
          ],
          count: 1,
          error: null,
        }),
      }),
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    mockSelect.mockReturnValue({
      eq: mockEq,
    })

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?accountId=ig-123',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.history).toHaveLength(1)
    expect(data.history[0].accountId).toBe('ig-123')
  })

  it('should return 400 for invalid limit parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?limit=invalid',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should return 400 for limit exceeding maximum', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?limit=200',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should return 400 for negative offset', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?offset=-1',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation error')
  })

  it('should format sync history entries correctly', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'sync-1',
                  account_id: 'ig-123',
                  status: 'success',
                  posts_processed: 5,
                  tasks_created: 3,
                  tasks_updated: 2,
                  metrics_updated: 5,
                  error_message: null,
                  duration_ms: 1500,
                  started_at: '2024-01-01T12:00:00Z',
                  completed_at: '2024-01-01T12:00:01.5Z',
                },
              ],
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    const entry = data.history[0]
    expect(entry.id).toBe('sync-1')
    expect(entry.accountId).toBe('ig-123')
    expect(entry.status).toBe('success')
    expect(entry.postsProcessed).toBe(5)
    expect(entry.tasksCreated).toBe(3)
    expect(entry.tasksUpdated).toBe(2)
    expect(entry.metricsUpdated).toBe(5)
    expect(entry.durationMs).toBe(1500)
  })

  it('should calculate hasMore correctly', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: Array(10).fill({
                id: 'sync-1',
                account_id: 'ig-123',
                status: 'success',
                posts_processed: 5,
                tasks_created: 3,
                tasks_updated: 2,
                metrics_updated: 5,
                error_message: null,
                duration_ms: 1500,
                started_at: '2024-01-01T12:00:00Z',
                completed_at: '2024-01-01T12:00:01.5Z',
              }),
              count: 25,
              error: null,
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/instagram/sync-history?limit=10&offset=0',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-internal-token',
        },
      }
    )

    const response = await GET(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should return 500 on database error', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              count: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/admin/instagram/sync-history', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-internal-token',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to retrieve sync history')
  })
})
