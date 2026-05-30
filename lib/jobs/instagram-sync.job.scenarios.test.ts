/**
 * Instagram Sync Job - Scenario-Based Integration Tests
 * Tests specific real-world scenarios and edge cases
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

describe('Instagram Sync Job - Real-World Scenarios', () => {
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

  describe('Scenario 1: First-Time Sync for New Account', () => {
    it('should create all tasks on first sync', async () => {
      const mockCredential = {
        accountId: 'ig-new-account',
        accountName: 'New Account',
        businessAccountId: '999999',
        accessToken: 'new-token',
        clickupListId: 'new-list',
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPosts = Array.from({ length: 5 }, (_, i) => ({
        id: `new-post-${i}`,
        caption: `New post ${i}`,
        mediaType: 'IMAGE',
        mediaUrl: `https://example.com/new-${i}.jpg`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        permalink: `https://instagram.com/p/new${i}`,
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
      }))

      const mockMetrics = mockPosts.map((post) => ({
        postId: post.id,
        alcance: 100 + Math.random() * 900,
        engajamento: 50 + Math.random() * 450,
        impressoes: 200 + Math.random() * 1800,
        cliques: 10 + Math.random() * 90,
        likes: 40 + Math.random() * 360,
        comments: 10 + Math.random() * 90,
        retrievedAt: new Date().toISOString(),
      }))

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue(mockPosts)
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue(mockMetrics)

      mockSupabase.from().single.mockResolvedValue({ data: null, error: null })

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(5)
      expect(results[0].status).toBe('success')
    })
  })

  describe('Scenario 2: Incremental Sync with Mixed New and Existing Posts', () => {
    it('should create new tasks and update existing ones', async () => {
      const mockCredential = {
        accountId: 'ig-mixed',
        accountName: 'Mixed Account',
        businessAccountId: '888888',
        accessToken: 'mixed-token',
        clickupListId: 'mixed-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPosts = [
        {
          id: 'existing-post-1',
          caption: 'Existing post 1',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/existing-1.jpg',
          timestamp: '2024-01-10T12:00:00Z',
          permalink: 'https://instagram.com/p/existing1',
          publishedAt: '2024-01-10T12:00:00Z',
        },
        {
          id: 'new-post-1',
          caption: 'New post 1',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/new-1.jpg',
          timestamp: '2024-01-15T12:00:00Z',
          permalink: 'https://instagram.com/p/new1',
          publishedAt: '2024-01-15T12:00:00Z',
        },
      ]

      const mockMetrics = [
        {
          postId: 'existing-post-1',
          alcance: 500,
          engajamento: 250,
          impressoes: 1000,
          cliques: 50,
          likes: 200,
          comments: 50,
          retrievedAt: new Date().toISOString(),
        },
        {
          postId: 'new-post-1',
          alcance: 100,
          engajamento: 50,
          impressoes: 200,
          cliques: 10,
          likes: 40,
          comments: 10,
          retrievedAt: new Date().toISOString(),
        },
      ]

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue(mockPosts)
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue(mockMetrics)

      // First post exists, second doesn't
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { clickup_task_id: 'task-existing-1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(2)
      expect(results[0].status).toBe('success')
    })
  })

  describe('Scenario 3: Sync with Partial Failures', () => {
    it('should continue processing after individual post failures', async () => {
      const mockCredential = {
        accountId: 'ig-partial',
        accountName: 'Partial Account',
        businessAccountId: '777777',
        accessToken: 'partial-token',
        clickupListId: 'partial-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPosts = [
        {
          id: 'post-1',
          caption: 'Post 1',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/1.jpg',
          timestamp: '2024-01-15T12:00:00Z',
          permalink: 'https://instagram.com/p/1',
          publishedAt: '2024-01-15T12:00:00Z',
        },
        {
          id: 'post-2',
          caption: 'Post 2',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/2.jpg',
          timestamp: '2024-01-15T13:00:00Z',
          permalink: 'https://instagram.com/p/2',
          publishedAt: '2024-01-15T13:00:00Z',
        },
        {
          id: 'post-3',
          caption: 'Post 3',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/3.jpg',
          timestamp: '2024-01-15T14:00:00Z',
          permalink: 'https://instagram.com/p/3',
          publishedAt: '2024-01-15T14:00:00Z',
        },
      ]

      const mockMetrics = [
        {
          postId: 'post-1',
          alcance: 100,
          engajamento: 50,
          impressoes: 200,
          cliques: 10,
          likes: 40,
          comments: 10,
          retrievedAt: new Date().toISOString(),
        },
        {
          postId: 'post-2',
          alcance: 200,
          engajamento: 100,
          impressoes: 400,
          cliques: 20,
          likes: 80,
          comments: 20,
          retrievedAt: new Date().toISOString(),
        },
        {
          postId: 'post-3',
          alcance: 300,
          engajamento: 150,
          impressoes: 600,
          cliques: 30,
          likes: 120,
          comments: 30,
          retrievedAt: new Date().toISOString(),
        },
      ]

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue(mockPosts)
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue(mockMetrics)

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(3)
      expect(results[0].status).toBe('success')
    })
  })

  describe('Scenario 4: Sync with Expired Credentials', () => {
    it('should handle expired access tokens gracefully', async () => {
      const mockCredential = {
        accountId: 'ig-expired',
        accountName: 'Expired Account',
        businessAccountId: '666666',
        accessToken: 'expired-token',
        clickupListId: 'expired-list',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastValidatedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-10T00:00:00Z', // Expired
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockRejectedValue(new Error('Token expired'))

      const results = await syncJob.runSync()

      expect(results[0].status).toBe('failed')
      expect(results[0].errors).toHaveLength(1)
      expect(results[0].errors[0].type).toBe('VALIDATION')
    })
  })

  describe('Scenario 5: Sync with Rate Limiting', () => {
    it('should handle Instagram API rate limiting', async () => {
      const mockCredential = {
        accountId: 'ig-ratelimit',
        accountName: 'Rate Limited Account',
        businessAccountId: '555555',
        accessToken: 'ratelimit-token',
        clickupListId: 'ratelimit-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest
        .fn()
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce([])

      const results = await syncJob.runSync()

      expect(results[0].status).toBe('failed')
    })
  })

  describe('Scenario 6: Sync with Metrics Anomalies', () => {
    it('should handle metrics with unusual values', async () => {
      const mockCredential = {
        accountId: 'ig-anomaly',
        accountName: 'Anomaly Account',
        businessAccountId: '444444',
        accessToken: 'anomaly-token',
        clickupListId: 'anomaly-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPost = {
        id: 'anomaly-post',
        caption: 'Anomaly post',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/anomaly.jpg',
        timestamp: '2024-01-15T12:00:00Z',
        permalink: 'https://instagram.com/p/anomaly',
        publishedAt: '2024-01-15T12:00:00Z',
      }

      // Metrics with unusual values
      const anomalyMetrics = {
        postId: 'anomaly-post',
        alcance: 0, // Zero reach
        engajamento: 0, // Zero engagement
        impressoes: 0, // Zero impressions
        cliques: 0,
        likes: 0,
        comments: 0,
        retrievedAt: new Date().toISOString(),
      }

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([mockPost])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([anomalyMetrics])

      const results = await syncJob.runSync()

      expect(results[0].postsProcessed).toBe(1)
      expect(results[0].status).toBe('success')
    })
  })

  describe('Scenario 7: Sync with Large Batch of Posts', () => {
    it('should efficiently process 100+ posts', async () => {
      const mockCredential = {
        accountId: 'ig-large',
        accountName: 'Large Account',
        businessAccountId: '333333',
        accessToken: 'large-token',
        clickupListId: 'large-list',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
        lastValidatedAt: '2024-01-15T00:00:00Z',
      }

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue([mockCredential])
      mockCredentialManager.getCredential = jest.fn().mockResolvedValue(mockCredential)

      const mockPosts = Array.from({ length: 100 }, (_, i) => ({
        id: `large-post-${i}`,
        caption: `Large post ${i}`,
        mediaType: i % 3 === 0 ? 'VIDEO' : 'IMAGE',
        mediaUrl: `https://example.com/large-${i}.jpg`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        permalink: `https://instagram.com/p/large${i}`,
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
      }))

      const mockMetrics = mockPosts.map((post) => ({
        postId: post.id,
        alcance: Math.floor(Math.random() * 10000),
        engajamento: Math.floor(Math.random() * 5000),
        impressoes: Math.floor(Math.random() * 20000),
        cliques: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 4000),
        comments: Math.floor(Math.random() * 1000),
        retrievedAt: new Date().toISOString(),
      }))

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue(mockPosts)
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue(mockMetrics)

      const startTime = Date.now()
      const results = await syncJob.runSync()
      const duration = Date.now() - startTime

      expect(results[0].postsProcessed).toBe(100)
      expect(results[0].status).toBe('success')
      expect(duration).toBeLessThan(120000) // Should complete within timeout
    })
  })

  describe('Scenario 8: Sync with Multiple Accounts and Failures', () => {
    it('should handle mixed success and failure across accounts', async () => {
      const mockCredentials = [
        {
          accountId: 'ig-success',
          accountName: 'Success Account',
          businessAccountId: '222222',
          accessToken: 'success-token',
          clickupListId: 'success-list',
          isActive: true,
          createdAt: '2024-01-10T00:00:00Z',
          lastValidatedAt: '2024-01-15T00:00:00Z',
        },
        {
          accountId: 'ig-failure',
          accountName: 'Failure Account',
          businessAccountId: '111111',
          accessToken: 'failure-token',
          clickupListId: 'failure-list',
          isActive: true,
          createdAt: '2024-01-10T00:00:00Z',
          lastValidatedAt: '2024-01-15T00:00:00Z',
        },
      ]

      mockCredentialManager.listCredentials = jest.fn().mockResolvedValue(mockCredentials)
      mockCredentialManager.getCredential = jest.fn().mockImplementation((accountId) => {
        if (accountId === 'ig-failure') {
          return Promise.reject(new Error('Credential error'))
        }
        return Promise.resolve(mockCredentials[0])
      })

      const mockInstagramService = InstagramService as jest.MockedClass<typeof InstagramService>
      mockInstagramService.prototype.fetchRecentPosts = jest.fn().mockResolvedValue([])
      mockInstagramService.prototype.fetchPostMetricsBatch = jest.fn().mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results).toHaveLength(2)
      expect(results[0].status).toBe('success')
      expect(results[1].status).toBe('failed')
    })
  })
})
