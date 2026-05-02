/**
 * ClickUp API Client Tests
 * 
 * Tests for ClickUp API client including retry logic and error handling
 */

import { ClickUpService } from './client'
import type { ClickUpTask, CreateTaskPayload } from './types'

// Mock fetch globally
global.fetch = jest.fn()

describe('ClickUpService', () => {
  let service: ClickUpService
  const mockApiKey = 'test-api-key'
  const mockListId = 'test-list-id'

  beforeEach(() => {
    service = new ClickUpService(mockApiKey)
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new ClickUpService('')).toThrow('ClickUp API key is required')
    })

    it('should create instance with valid API key', () => {
      expect(() => new ClickUpService(mockApiKey)).not.toThrow()
    })
  })

  describe('getTasksByList', () => {
    const mockTasks: ClickUpTask[] = [
      {
        id: '1',
        name: 'Test Task',
        description: 'Test Description',
        status: { status: 'open', color: '#000000' },
        date_created: '2024-01-01T00:00:00Z',
        date_updated: '2024-01-01T00:00:00Z',
        custom_fields: [],
        attachments: [],
        list: { id: mockListId, name: 'Test List' },
      },
    ]

    it('should fetch tasks successfully', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      const result = await service.getTasksByList(mockListId)

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.clickup.com/api/v2/list/${mockListId}/task`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: mockApiKey,
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should include filters in query string', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      await service.getTasksByList(mockListId, {
        archived: false,
        order_by: 'created',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('archived=false'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('order_by=created'),
        expect.any(Object)
      )
    })

    it('should throw error on non-retryable error', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request',
      })

      await expect(service.getTasksByList(mockListId)).rejects.toThrow(
        'ClickUp API error: 400 Bad Request - Invalid request'
      )
    })
  })

  describe('retry logic', () => {
    const mockTasks: ClickUpTask[] = []

    it('should retry on 429 rate limit error', async () => {
      const mockFetch = global.fetch as jest.Mock
      
      // First call: 429 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      })
      
      // Second call: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      const promise = service.getTasksByList(mockListId)
      
      // Fast-forward time for first retry (1000ms)
      await jest.advanceTimersByTimeAsync(1000)
      
      const result = await promise

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 502 bad gateway error', async () => {
      const mockFetch = global.fetch as jest.Mock
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => 'Gateway error',
      })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      const promise = service.getTasksByList(mockListId)
      await jest.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 503 service unavailable error', async () => {
      const mockFetch = global.fetch as jest.Mock
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'Service unavailable',
      })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      const promise = service.getTasksByList(mockListId)
      await jest.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff delays', async () => {
      const mockFetch = global.fetch as jest.Mock
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Fail 3 times, then succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: mockTasks }),
        })

      const promise = service.getTasksByList(mockListId)
      
      // First retry: 1000ms
      await jest.advanceTimersByTimeAsync(1000)
      // Second retry: 2000ms
      await jest.advanceTimersByTimeAsync(2000)
      // Third retry: 4000ms
      await jest.advanceTimersByTimeAsync(4000)
      
      const result = await promise

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledTimes(4)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3)
      
      consoleWarnSpy.mockRestore()
    })

    it('should fail after max retries', async () => {
      const mockFetch = global.fetch as jest.Mock
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Fail all attempts
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit',
      })

      const promise = service.getTasksByList(mockListId)
      
      // Advance through all retry delays
      await jest.advanceTimersByTimeAsync(1000)
      await jest.advanceTimersByTimeAsync(2000)
      await jest.advanceTimersByTimeAsync(4000)

      await expect(promise).rejects.toThrow('ClickUp API error: 429')
      expect(mockFetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
      
      consoleWarnSpy.mockRestore()
    })

    it('should retry on network errors', async () => {
      const mockFetch = global.fetch as jest.Mock
      
      // First call: network error
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'))
      
      // Second call: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      })

      const promise = service.getTasksByList(mockListId)
      await jest.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toEqual(mockTasks)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('createTask', () => {
    const mockTaskPayload: CreateTaskPayload = {
      name: 'New Task',
      description: 'Task description',
    }

    const mockCreatedTask: ClickUpTask = {
      id: 'new-task-id',
      name: 'New Task',
      description: 'Task description',
      status: { status: 'open', color: '#000000' },
      date_created: '2024-01-01T00:00:00Z',
      date_updated: '2024-01-01T00:00:00Z',
      custom_fields: [],
      attachments: [],
      list: { id: mockListId, name: 'Test List' },
    }

    it('should create task successfully', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedTask,
      })

      const result = await service.createTask(mockListId, mockTaskPayload)

      expect(result).toEqual(mockCreatedTask)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.clickup.com/api/v2/list/${mockListId}/task`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockTaskPayload),
        })
      )
    })
  })

  describe('updateTask', () => {
    const mockTaskId = 'task-123'
    const mockUpdates: Partial<CreateTaskPayload> = {
      name: 'Updated Task',
    }

    const mockUpdatedTask: ClickUpTask = {
      id: mockTaskId,
      name: 'Updated Task',
      description: '',
      status: { status: 'open', color: '#000000' },
      date_created: '2024-01-01T00:00:00Z',
      date_updated: '2024-01-02T00:00:00Z',
      custom_fields: [],
      attachments: [],
      list: { id: mockListId, name: 'Test List' },
    }

    it('should update task successfully', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedTask,
      })

      const result = await service.updateTask(mockTaskId, mockUpdates)

      expect(result).toEqual(mockUpdatedTask)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.clickup.com/api/v2/task/${mockTaskId}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockUpdates),
        })
      )
    })
  })

  describe('getCustomFields', () => {
    const mockFields = [
      {
        id: 'field-1',
        name: 'Alcance',
        type: 'number' as const,
        value: null,
      },
    ]

    it('should fetch custom fields successfully', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: mockFields }),
      })

      const result = await service.getCustomFields(mockListId)

      expect(result).toEqual(mockFields)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.clickup.com/api/v2/list/${mockListId}/field`,
        expect.any(Object)
      )
    })
  })

  describe('mapCustomFields', () => {
    const mockTask: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: '',
      status: { status: 'open', color: '#000000' },
      date_created: '2024-01-01T00:00:00Z',
      date_updated: '2024-01-01T00:00:00Z',
      custom_fields: [
        { id: 'field-1', name: 'Alcance', type: 'number', value: 1000 },
        { id: 'field-2', name: 'Engajamento', type: 'number', value: 500 },
      ],
      attachments: [],
      list: { id: mockListId, name: 'Test List' },
    }

    it('should map custom fields correctly', () => {
      const fieldMap = {
        alcance: 'field-1',
        engajamento: 'field-2',
        impressoes: 'field-3', // Missing field
      }

      const result = service.mapCustomFields(mockTask, fieldMap)

      expect(result).toEqual({
        alcance: 1000,
        engajamento: 500,
        impressoes: null,
      })
    })

    it('should return null for missing fields', () => {
      const fieldMap = {
        nonexistent: 'field-999',
      }

      const result = service.mapCustomFields(mockTask, fieldMap)

      expect(result).toEqual({
        nonexistent: null,
      })
    })
  })
})
