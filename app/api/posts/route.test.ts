/**
 * Integration tests for GET /api/posts endpoint
 * 
 * Tests JWT validation, multi-tenant filtering, period filtering, and error handling
 */

import { NextRequest } from 'next/server'
import { GET } from './route'
import { ClickUpService } from '@/services/clickup/client'
import type { ClickUpTask } from '@/services/clickup/types'

// Mock dependencies
jest.mock('@/services/clickup/client')
jest.mock('@/services/auth/jwt')
jest.mock('@/lib/env', () => ({
  env: {
    clickup: {
      apiKey: 'test-api-key',
      performanceListId: 'test-list-id',
      financialListId: 'test-financial-list-id',
      baseUrl: 'https://api.clickup.com/api/v2',
    },
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
    },
    app: {
      baseUrl: 'http://localhost:3000',
      environment: 'development',
    },
    jwt: {
      secret: 'test-secret',
    },
  },
}))

const mockClickUpService = ClickUpService as jest.MockedClass<typeof ClickUpService>
const mockExtractClientIdFromToken = jest.requireMock('@/services/auth/jwt').extractClientIdFromToken

// Helper to create mock ClickUp tasks
function createMockClickUpTask(overrides: Partial<ClickUpTask> = {}): ClickUpTask {
  return {
    id: 'task-1',
    name: 'Test Post',
    description: 'Test description',
    status: {
      status: 'Publicado',
      color: '#00ff00',
    },
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    custom_fields: [
      { id: 'alcance-id', name: 'Alcance', type: 'number', value: 1000 },
      { id: 'engajamento-id', name: 'Engajamento', type: 'number', value: 500 },
      { id: 'impressoes-id', name: 'Impressões', type: 'number', value: 2000 },
      { id: 'cliques-id', name: 'Cliques', type: 'number', value: 100 },
      { id: 'status-id', name: 'Status', type: 'text', value: 'Publicado' },
    ],
    attachments: [
      {
        id: 'attachment-1',
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        extension: 'jpg',
      },
    ],
    list: {
      id: 'test-list-id',
      name: 'Performance',
    },
    ...overrides,
  }
}

// Helper to create mock NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    headers: new Headers(headers),
  })
}

describe('GET /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables for field mapping
    process.env.CLICKUP_FIELD_ALCANCE = 'alcance-id'
    process.env.CLICKUP_FIELD_ENGAJAMENTO = 'engajamento-id'
    process.env.CLICKUP_FIELD_IMPRESSOES = 'impressoes-id'
    process.env.CLICKUP_FIELD_CLIQUES = 'cliques-id'
    process.env.CLICKUP_FIELD_STATUS = 'status-id'
    process.env.CLICKUP_FIELD_IMAGEM = 'imagem-id'
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 401 when Authorization header is malformed', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'InvalidFormat token123',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 403 when client_id is missing from JWT', async () => {
      mockExtractClientIdFromToken.mockReturnValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Missing client_id in JWT token')
    })

    it('should extract client_id from JWT token', async () => {
      const mockClientId = 'client-123'
      mockExtractClientIdFromToken.mockReturnValue(mockClientId)
      
      const mockGetTasksByList = jest.fn().mockResolvedValue([])
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      await GET(request)

      expect(mockExtractClientIdFromToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetTasksByList).toHaveBeenCalled()
    })
  })

  describe('Period Filtering', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue([])
    })

    it('should default to month period when not specified', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.period).toBe('month')
    })

    it('should accept week period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts?period=week', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.period).toBe('week')
    })

    it('should accept month period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts?period=month', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.period).toBe('month')
    })

    it('should return 400 for invalid period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts?period=invalid', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid period parameter')
    })
  })

  describe('Data Retrieval and Normalization', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should fetch tasks from ClickUp and normalize them', async () => {
      const mockTasks = [createMockClickUpTask()]
      const mockGetTasksByList = jest.fn().mockResolvedValue(mockTasks)
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockGetTasksByList).toHaveBeenCalledWith('test-list-id', {
        archived: false,
        include_closed: false,
      })
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0]).toMatchObject({
        id: 'task-1',
        title: 'Test Post',
        clientId: 'client-123',
        metrics: {
          alcance: 1000,
          engajamento: 500,
          impressoes: 2000,
          cliques: 100,
        },
      })
    })

    it('should filter posts by date range', async () => {
      const now = new Date()
      const oldDate = new Date()
      oldDate.setDate(now.getDate() - 60) // 60 days ago (outside month range)
      
      const recentTask = createMockClickUpTask({
        id: 'recent-task',
        date_created: now.toISOString(),
      })
      
      const oldTask = createMockClickUpTask({
        id: 'old-task',
        date_created: oldDate.toISOString(),
      })
      
      const mockGetTasksByList = jest.fn().mockResolvedValue([recentTask, oldTask])
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/posts?period=month', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].id).toBe('recent-task')
    })

    it('should return metadata with date range', async () => {
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue([])
      
      const request = createMockRequest('http://localhost:3000/api/posts?period=week', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata).toMatchObject({
        total: 0,
        period: 'week',
      })
      expect(data.metadata.startDate).toBeDefined()
      expect(data.metadata.endDate).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should return 502 when ClickUp API fails', async () => {
      const mockGetTasksByList = jest.fn().mockRejectedValue(
        new Error('ClickUp API error: 500 Internal Server Error')
      )
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('Failed to fetch data from ClickUp API')
      expect(data.message).toContain('ClickUp API error')
    })

    it('should return 500 for unexpected errors', async () => {
      mockExtractClientIdFromToken.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Response Headers', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue([])
    })

    it('should include cache control headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=300')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })

  describe('Multi-Tenant Isolation', () => {
    it('should filter posts by client_id', async () => {
      const clientId = 'client-123'
      mockExtractClientIdFromToken.mockReturnValue(clientId)
      
      const mockTasks = [createMockClickUpTask()]
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue(mockTasks)
      
      const request = createMockRequest('http://localhost:3000/api/posts', {
        authorization: 'Bearer valid-token',
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts.every((post: any) => post.clientId === clientId)).toBe(true)
    })
  })
})
