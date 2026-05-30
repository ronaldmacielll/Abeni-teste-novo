/**
 * Tests for Instagram Service
 * Validates: Requirements 2.1, 2.2, 3.1, 4.1, 4.2
 */

import { InstagramService } from '../instagram.service'
import { InstagramPost, InstagramMetrics } from '@/lib/types/instagram.types'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('InstagramService', () => {
  const validConfig = {
    accessToken: 'EAAB' + 'x'.repeat(100),
    businessAccountId: '123456789',
    accountName: 'Test Account',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      const service = new InstagramService(validConfig)
      expect(service).toBeDefined()
    })

    it('should throw error with invalid access token', () => {
      expect(() => {
        new InstagramService({
          ...validConfig,
          accessToken: 'invalid',
        })
      }).toThrow('Invalid access token format')
    })

    it('should throw error with invalid business account ID', () => {
      expect(() => {
        new InstagramService({
          ...validConfig,
          businessAccountId: 'ABC123',
        })
      }).toThrow('Invalid business account ID format')
    })
  })

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            id: '123456789',
            name: 'Test Account',
            permissions: [
              { permission: 'instagram_business_content_read', status: 'granted' },
              { permission: 'instagram_business_insights_read', status: 'granted' },
            ],
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const result = await service.validateCredentials()

      expect(result).toBe(true)
    })

    it('should return false for missing permissions', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            id: '123456789',
            name: 'Test Account',
            permissions: [{ permission: 'instagram_business_content_read', status: 'granted' }],
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const result = await service.validateCredentials()

      expect(result).toBe(false)
    })

    it('should return false on API error', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const result = await service.validateCredentials()

      expect(result).toBe(false)
    })
  })

  describe('fetchRecentPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPosts = [
        {
          id: '1',
          caption: 'Test post 1',
          media_type: 'IMAGE',
          media_url: 'https://example.com/1.jpg',
          timestamp: new Date().toISOString(),
          permalink: 'https://instagram.com/p/1',
        },
        {
          id: '2',
          caption: 'Test post 2',
          media_type: 'VIDEO',
          media_url: 'https://example.com/2.mp4',
          timestamp: new Date().toISOString(),
          permalink: 'https://instagram.com/p/2',
        },
      ]

      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            data: mockPosts,
            paging: { cursors: { after: null } },
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const posts = await service.fetchRecentPosts(undefined, 25)

      expect(posts).toHaveLength(2)
      expect(posts[0].id).toBe('1')
      expect(posts[1].id).toBe('2')
    })

    it('should handle pagination', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn()
          .mockResolvedValueOnce({
            data: {
              data: [
                {
                  id: '1',
                  caption: 'Post 1',
                  media_type: 'IMAGE',
                  timestamp: new Date().toISOString(),
                  permalink: 'https://instagram.com/p/1',
                },
              ],
              paging: { cursors: { after: 'cursor123' } },
            },
          })
          .mockResolvedValueOnce({
            data: {
              data: [
                {
                  id: '2',
                  caption: 'Post 2',
                  media_type: 'IMAGE',
                  timestamp: new Date().toISOString(),
                  permalink: 'https://instagram.com/p/2',
                },
              ],
              paging: { cursors: { after: null } },
            },
          }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const posts = await service.fetchRecentPosts(undefined, 2)

      expect(posts).toHaveLength(2)
    })

    it('should filter posts by date', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: '1',
                caption: 'Recent post',
                media_type: 'IMAGE',
                timestamp: now.toISOString(),
                permalink: 'https://instagram.com/p/1',
              },
              {
                id: '2',
                caption: 'Old post',
                media_type: 'IMAGE',
                timestamp: yesterday.toISOString(),
                permalink: 'https://instagram.com/p/2',
              },
            ],
            paging: { cursors: { after: null } },
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const posts = await service.fetchRecentPosts(now, 25)

      expect(posts).toHaveLength(1)
      expect(posts[0].id).toBe('1')
    })

    it('should throw error on API failure', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)

      await expect(service.fetchRecentPosts()).rejects.toThrow()
    })
  })

  describe('fetchPostMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            data: [
              { name: 'reach', values: [{ value: 100 }] },
              { name: 'engagement', values: [{ value: 50 }] },
              { name: 'impressions', values: [{ value: 200 }] },
              { name: 'clicks', values: [{ value: 30 }] },
              { name: 'likes', values: [{ value: 40 }] },
              { name: 'comments', values: [{ value: 10 }] },
            ],
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const metrics = await service.fetchPostMetrics('post123')

      expect(metrics.postId).toBe('post123')
      expect(metrics.alcance).toBe(100)
      expect(metrics.engajamento).toBe(50)
      expect(metrics.impressoes).toBe(200)
      expect(metrics.cliques).toBe(30)
      expect(metrics.likes).toBe(40)
      expect(metrics.comments).toBe(10)
    })

    it('should return default metrics on error', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const metrics = await service.fetchPostMetrics('post123')

      expect(metrics.postId).toBe('post123')
      expect(metrics.alcance).toBe(0)
      expect(metrics.engajamento).toBe(0)
      expect(metrics.impressoes).toBe(0)
    })
  })

  describe('fetchPostMetricsBatch', () => {
    it('should fetch metrics for multiple posts', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            data: [
              { name: 'reach', values: [{ value: 100 }] },
              { name: 'engagement', values: [{ value: 50 }] },
              { name: 'impressions', values: [{ value: 200 }] },
              { name: 'clicks', values: [{ value: 30 }] },
              { name: 'likes', values: [{ value: 40 }] },
              { name: 'comments', values: [{ value: 10 }] },
            ],
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const metrics = await service.fetchPostMetricsBatch(['post1', 'post2', 'post3'])

      expect(metrics).toHaveLength(3)
      expect(metrics[0].postId).toBe('post1')
      expect(metrics[1].postId).toBe('post2')
      expect(metrics[2].postId).toBe('post3')
    })

    it('should handle batch processing with delays', async () => {
      const mockCreate = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            data: [
              { name: 'reach', values: [{ value: 100 }] },
              { name: 'engagement', values: [{ value: 50 }] },
              { name: 'impressions', values: [{ value: 200 }] },
              { name: 'clicks', values: [{ value: 30 }] },
              { name: 'likes', values: [{ value: 40 }] },
              { name: 'comments', values: [{ value: 10 }] },
            ],
          },
        }),
      })

      mockedAxios.create.mockReturnValue(mockCreate() as any)

      const service = new InstagramService(validConfig)
      const startTime = Date.now()
      const metrics = await service.fetchPostMetricsBatch(
        Array.from({ length: 15 }, (_, i) => `post${i}`)
      )
      const duration = Date.now() - startTime

      expect(metrics).toHaveLength(15)
      // Should have delays between batches
      expect(duration).toBeGreaterThan(100)
    })
  })
})
