/**
 * Instagram Sync Job - Edge Cases and Boundary Tests
 * Tests edge cases, boundary conditions, and unusual scenarios
 * Validates: Requirements 5.1, 5.2, 6.1, 6.2, 7.1, 11.1, 11.2
 */

import { InstagramSyncJob } from './instagram-sync.job'
import { CredentialManager } from '@/lib/services/credential-manager'
import { CacheManager } from '@/lib/services/cache-manager'
import { InstagramService } from '@/lib/services/instagram/instagram.service'
import { createClient } from '@supabase/supabase-js'

jest.mock('@/lib/services/credential-manager')
jest.mock('@/lib/services/cache-manager')
jest.mock('@/lib/services/instagram/instagram.service')
jest.mock('@supabase/supabase-js')
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('Instagram Sync Job - Edge Cases', () => {
  let syncJob: InstagramSyncJob
  let mockCredentialManager: jest.Mocked<CredentialManager>
  let mockCacheManager: jest.Mocked<CacheManager>
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockCredentialManager = new CredentialManager() as jest.Mocked<CredentialManager>
    mockCacheManager = new CacheManager() as jest.Mocked<CacheManager>

    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    syncJob = new InstagramSyncJob(
      {
        frequencyMinutes: 5,
        maxConcurrentAccounts: 3,
        timeoutSeconds: 120,
      },
      mockCredentialManager,
      mockCacheManager
    )
  })

  afterEach(() => {
    syncJob.stop()
  })

  describe('Boundary Conditions', () => {
    it('should handle empty posts array', async () => {
      const mockCredential = {
        accountId: 'ig-empty',
        accountName: 'Empty Account',
        businessAccountId: '000001',
        accessToken: 'empty-token',
        clickupListId: 'empty-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(0)
      expect(results[0].status).toBe('success')
    })

    it('should handle single post', async () => {
      const mockCredential = {
        accountId: 'ig-single',
        accountName: 'Single Account',
        businessAccountId: '000002',
        accessToken: 'single-token',
        clickupListId: 'single-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'single-post',
        caption: 'Single post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/single.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/single',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const mockMetrics = {
        postId: 'single-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle no configured accounts', async () => {
      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results).toEqual([])
    })

    it('should handle maximum concurrent accounts', async () => {
      const mockCredentials = Array.from({ length: 3 }, (_, i) => ({
        accountId: `ig-max-${i}`,
        accountName: `Max Account ${i}`,
        businessAccountId: `${i}`,
        accessToken: `token-${i}`,
        clickupListId: `list-${i}`,
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }))

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue(mockCredentials)
      mockCredentialManager.getCredential = jest.fn().mockImplementation((accountId) => {
        return Promise.resolve(mockCredentials.find((c) => c.accountId === accountId))
      })

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results).toHaveLength(3)
    })

    it('should handle exceeding maximum concurrent accounts', async () => {
      const mockCredentials = Array.from({ length: 5 }, (_, i) => ({
        accountId: `ig-exceed-${i}`,
        accountName: `Exceed Account ${i}`,
        businessAccountId: `${i}`,
        accessToken: `token-${i}`,
        clickupListId: `list-${i}`,
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }))

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue(mockCredentials)
      mockCredentialManager.getCredential = jest.fn().mockImplementation((accountId) => {
        return Promise.resolve(mockCredentials.find((c) => c.accountId === accountId))
      })

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results).toHaveLength(5)
    })
  })

  describe('Metrics Edge Cases', () => {
    it('should handle zero metrics', async () => {
      const mockCredential = {
        accountId: 'ig-zero-metrics',
        accountName: 'Zero Metrics Account',
        businessAccountId: '000003',
        accessToken: 'zero-token',
        clickupListId: 'zero-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'zero-post',
        caption: 'Zero metrics post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/zero.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/zero',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const zeroMetrics = {
        postId: 'zero-post',
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
        likes: 0,
        comments: 0,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([zeroMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle very large metrics values', async () => {
      const mockCredential = {
        accountId: 'ig-large-metrics',
        accountName: 'Large Metrics Account',
        businessAccountId: '000004',
        accessToken: 'large-metrics-token',
        clickupListId: 'large-metrics-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'large-metrics-post',
        caption: 'Large metrics post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/large-metrics.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/large-metrics',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const largeMetrics = {
        postId: 'large-metrics-post',
        alcance: 999999999,
        engajamento: 999999999,
        impressoes: 999999999,
        cliques: 999999999,
        likes: 999999999,
        comments: 999999999,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([largeMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle metrics with inconsistent relationships', async () => {
      const mockCredential = {
        accountId: 'ig-inconsistent',
        accountName: 'Inconsistent Account',
        businessAccountId: '000005',
        accessToken: 'inconsistent-token',
        clickupListId: 'inconsistent-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'inconsistent-post',
        caption: 'Inconsistent post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/inconsistent.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/inconsistent',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      // Inconsistent: likes > engagement
      const inconsistentMetrics = {
        postId: 'inconsistent-post',
        alcance: 100,
        engajamento: 30,
        impressoes: 200,
        cliques: 10,
        likes: 50, // Greater than engagement
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([inconsistentMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      // Should still process but log warning
      expect(results[0].status).toBe('success')
    })
  })

  describe('Post Data Edge Cases', () => {
    it('should handle posts with empty captions', async () => {
      const mockCredential = {
        accountId: 'ig-empty-caption',
        accountName: 'Empty Caption Account',
        businessAccountId: '000006',
        accessToken: 'empty-caption-token',
        clickupListId: 'empty-caption-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'empty-caption-post',
        caption: '', // Empty caption
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/empty-caption.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/empty-caption',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const mockMetrics = {
        postId: 'empty-caption-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle posts with very long captions', async () => {
      const mockCredential = {
        accountId: 'ig-long-caption',
        accountName: 'Long Caption Account',
        businessAccountId: '000007',
        accessToken: 'long-caption-token',
        clickupListId: 'long-caption-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const longCaption = 'A'.repeat(2000) // Very long caption

      const mockPost = {
        id: 'long-caption-post',
        caption: longCaption,
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/long-caption.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/long-caption',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const mockMetrics = {
        postId: 'long-caption-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle posts with special characters in caption', async () => {
      const mockCredential = {
        accountId: 'ig-special-chars',
        accountName: 'Special Chars Account',
        businessAccountId: '000008',
        accessToken: 'special-chars-token',
        clickupListId: 'special-chars-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'special-chars-post',
        caption: '🎉 Special chars: @user #hashtag 🚀 "quotes" & symbols!',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/special-chars.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/special-chars',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const mockMetrics = {
        postId: 'special-chars-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle posts with null media URL', async () => {
      const mockCredential = {
        accountId: 'ig-null-media',
        accountName: 'Null Media Account',
        businessAccountId: '000009',
        accessToken: 'null-media-token',
        clickupListId: 'null-media-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'null-media-post',
        caption: 'Post with no media',
        mediaType: 'IMAGE',
        mediaUrl: null, // Null media URL
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/null-media',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      const mockMetrics = {
        postId: 'null-media-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })
  })

  describe('Timing Edge Cases', () => {
    it('should handle posts with future timestamps', async () => {
      const mockCredential = {
        accountId: 'ig-future-time',
        accountName: 'Future Time Account',
        businessAccountId: '000010',
        accessToken: 'future-time-token',
        clickupListId: 'future-time-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow

      const mockPost = {
        id: 'future-post',
        caption: 'Future post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/future.jpg',
        timestamp: futureDate,
        permalink: 'https://instagram.com/p/future',
        publishedAt: futureDate,
      }

      const mockMetrics = {
        postId: 'future-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })

    it('should handle posts with very old timestamps', async () => {
      const mockCredential = {
        accountId: 'ig-old-time',
        accountName: 'Old Time Account',
        businessAccountId: '000011',
        accessToken: 'old-time-token',
        clickupListId: 'old-time-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const oldDate = new Date('2020-01-01T00:00:00Z').toISOString() // Very old

      const mockPost = {
        id: 'old-post',
        caption: 'Old post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/old.jpg',
        timestamp: oldDate,
        permalink: 'https://instagram.com/p/old',
        publishedAt: oldDate,
      }

      const mockMetrics = {
        postId: 'old-post',
        alcance: 100,
        engajamento: 50,
        impressoes: 200,
        cliques: 10,
        likes: 40,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([mockMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })
  })
})
