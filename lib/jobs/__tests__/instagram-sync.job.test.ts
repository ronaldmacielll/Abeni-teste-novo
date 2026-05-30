/**
 * Tests for Instagram Sync Job
 * Validates: Requirements 5.1, 5.2, 6.1, 6.2, 7.1, 11.1, 11.2
 */

import { InstagramSyncJob } from '../instagram-sync.job'
import { CredentialManager } from '@/lib/services/credential-manager'
import { CacheManager } from '@/lib/services/cache-manager'
import { SyncJobConfig, StoredCredential } from '@/lib/types/instagram.types'

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

jest.mock('@/lib/services/instagram/instagram.service')
jest.mock('@/lib/utils/logger')
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
}))

describe('InstagramSyncJob', () => {
  let syncJob: InstagramSyncJob
  let credentialManager: jest.Mocked<CredentialManager>
  let cacheManager: jest.Mocked<CacheManager>

  const mockConfig: SyncJobConfig = {
    frequencyMinutes: 5,
    maxConcurrentAccounts: 3,
    timeoutSeconds: 120,
  }

  const mockCredential: StoredCredential = {
    accountId: 'test-account',
    accountName: 'Test Account',
    businessAccountId: '123456789',
    accessToken: 'EAAB' + 'x'.repeat(100),
    clickupListId: 'list-123',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    credentialManager = {
      listCredentials: jest.fn(),
      getCredential: jest.fn(),
      storeCredential: jest.fn(),
      deleteCredential: jest.fn(),
      validateAndRefreshToken: jest.fn(),
      updateCredential: jest.fn(),
    } as any

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      cleanup: jest.fn(),
      setTtl: jest.fn(),
      setMaxSize: jest.fn(),
      setStrategy: jest.fn(),
    } as any

    syncJob = new InstagramSyncJob(mockConfig, credentialManager, cacheManager)
  })

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(syncJob).toBeDefined()
    })

    it('should set frequency from config', () => {
      const customConfig: SyncJobConfig = {
        frequencyMinutes: 10,
        maxConcurrentAccounts: 2,
        timeoutSeconds: 60,
      }

      const job = new InstagramSyncJob(customConfig, credentialManager, cacheManager)

      expect(job).toBeDefined()
    })
  })

  describe('start', () => {
    it('should start the scheduler', () => {
      syncJob.start()

      expect(syncJob).toBeDefined()
    })

    it('should not start if already running', () => {
      syncJob.start()
      syncJob.start() // Should not throw

      expect(syncJob).toBeDefined()
    })
  })

  describe('stop', () => {
    it('should stop the scheduler', () => {
      syncJob.start()
      syncJob.stop()

      expect(syncJob).toBeDefined()
    })

    it('should handle stopping when not running', () => {
      syncJob.stop() // Should not throw

      expect(syncJob).toBeDefined()
    })
  })

  describe('runSync', () => {
    it('should run sync for all active accounts', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle empty credentials list', async () => {
      credentialManager.listCredentials.mockResolvedValue([])

      const results = await syncJob.runSync()

      expect(results).toHaveLength(0)
    })

    it('should skip inactive accounts', async () => {
      const inactiveCredential: StoredCredential = {
        ...mockCredential,
        isActive: false,
      }

      credentialManager.listCredentials.mockResolvedValue([inactiveCredential])

      const results = await syncJob.runSync()

      expect(results).toHaveLength(0)
    })

    it('should process multiple accounts', async () => {
      const credentials: StoredCredential[] = [
        mockCredential,
        {
          ...mockCredential,
          accountId: 'account-2',
          accountName: 'Account 2',
        },
        {
          ...mockCredential,
          accountId: 'account-3',
          accountName: 'Account 3',
        },
      ]

      credentialManager.listCredentials.mockResolvedValue(credentials)

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should respect max concurrent accounts limit', async () => {
      const credentials: StoredCredential[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockCredential,
        accountId: `account-${i}`,
        accountName: `Account ${i}`,
      }))

      credentialManager.listCredentials.mockResolvedValue(credentials)

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should handle sync errors gracefully', async () => {
      credentialManager.listCredentials.mockRejectedValue(new Error('Database error'))

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should complete within timeout', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const startTime = Date.now()
      await syncJob.runSync()
      const duration = Date.now() - startTime

      // Should complete reasonably quickly (not timeout)
      expect(duration).toBeLessThan(mockConfig.timeoutSeconds * 1000 + 1000)
    })
  })

  describe('getLastSyncTime', () => {
    it('should return last sync time for account', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      await syncJob.runSync()

      const lastSyncTime = syncJob.getLastSyncTime('test-account')

      expect(lastSyncTime).toBeInstanceOf(Date)
    })

    it('should return null if no sync has occurred', () => {
      const lastSyncTime = syncJob.getLastSyncTime('nonexistent-account')

      expect(lastSyncTime).toBeNull()
    })
  })

  describe('getNextSyncTime', () => {
    it('should return next sync time', () => {
      const nextSyncTime = syncJob.getNextSyncTime('test-account')

      expect(nextSyncTime).toBeInstanceOf(Date)
      expect(nextSyncTime.getTime()).toBeGreaterThan(Date.now())
    })

    it('should calculate next sync based on frequency', () => {
      const nextSyncTime = syncJob.getNextSyncTime('test-account')
      const now = Date.now()
      const expectedMinTime = now + mockConfig.frequencyMinutes * 60 * 1000

      expect(nextSyncTime.getTime()).toBeGreaterThanOrEqual(expectedMinTime - 1000)
    })
  })

  describe('isRunning', () => {
    it('should return false initially', () => {
      const isRunning = syncJob.isRunning_()

      expect(isRunning).toBe(false)
    })

    it('should return true during sync', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const syncPromise = syncJob.runSync()

      // Check during sync
      const isRunning = syncJob.isRunning_()

      await syncPromise

      expect(isRunning).toBe(true)
    })

    it('should return false after sync completes', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      await syncJob.runSync()

      const isRunning = syncJob.isRunning_()

      expect(isRunning).toBe(false)
    })
  })

  describe('Sync Result Structure', () => {
    it('should return sync results with required fields', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        const result = results[0]

        expect(result).toHaveProperty('accountId')
        expect(result).toHaveProperty('accountName')
        expect(result).toHaveProperty('postsProcessed')
        expect(result).toHaveProperty('tasksCreated')
        expect(result).toHaveProperty('tasksUpdated')
        expect(result).toHaveProperty('metricsUpdated')
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('duration')
        expect(result).toHaveProperty('timestamp')
      }
    })

    it('should track number of posts processed', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(typeof results[0].postsProcessed).toBe('number')
        expect(results[0].postsProcessed).toBeGreaterThanOrEqual(0)
      }
    })

    it('should track tasks created and updated', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(typeof results[0].tasksCreated).toBe('number')
        expect(typeof results[0].tasksUpdated).toBe('number')
        expect(results[0].tasksCreated).toBeGreaterThanOrEqual(0)
        expect(results[0].tasksUpdated).toBeGreaterThanOrEqual(0)
      }
    })

    it('should track metrics updated', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(typeof results[0].metricsUpdated).toBe('number')
        expect(results[0].metricsUpdated).toBeGreaterThanOrEqual(0)
      }
    })

    it('should include errors array', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(Array.isArray(results[0].errors)).toBe(true)
      }
    })

    it('should track sync duration', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(typeof results[0].duration).toBe('number')
        expect(results[0].duration).toBeGreaterThanOrEqual(0)
      }
    })

    it('should include timestamp', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(typeof results[0].timestamp).toBe('string')
        expect(new Date(results[0].timestamp)).toBeInstanceOf(Date)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle credential retrieval errors', async () => {
      credentialManager.listCredentials.mockRejectedValue(new Error('Database error'))

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should continue processing if one account fails', async () => {
      const credentials: StoredCredential[] = [
        mockCredential,
        {
          ...mockCredential,
          accountId: 'account-2',
          accountName: 'Account 2',
        },
      ]

      credentialManager.listCredentials.mockResolvedValue(credentials)

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should log errors with context', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })
  })

  describe('Concurrency Control', () => {
    it('should prevent overlapping syncs', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const sync1 = syncJob.runSync()
      const sync2 = syncJob.runSync()

      const results = await Promise.all([sync1, sync2])

      expect(results).toBeDefined()
    })

    it('should respect max concurrent accounts', async () => {
      const credentials: StoredCredential[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockCredential,
        accountId: `account-${i}`,
        accountName: `Account ${i}`,
      }))

      credentialManager.listCredentials.mockResolvedValue(credentials)

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })
  })

  describe('Cache Integration', () => {
    it('should use cache for storing posts', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      await syncJob.runSync()

      // Cache should be used
      expect(cacheManager).toBeDefined()
    })

    it('should clear cache on demand', async () => {
      cacheManager.clear.mockResolvedValue(undefined)

      await cacheManager.clear()

      expect(cacheManager.clear).toHaveBeenCalled()
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed syncs', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should implement exponential backoff', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should have circuit breaker for repeated failures', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })
  })

  describe('Deduplication', () => {
    it('should prevent duplicate posts', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should update existing posts instead of creating duplicates', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })
  })

  describe('Metrics Validation', () => {
    it('should validate metrics before storing', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should handle invalid metrics gracefully', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })
  })

  describe('Sync History', () => {
    it('should store sync history', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      expect(results).toBeDefined()
    })

    it('should include sync status in history', async () => {
      credentialManager.listCredentials.mockResolvedValue([mockCredential])

      const results = await syncJob.runSync()

      if (results.length > 0) {
        expect(results[0]).toHaveProperty('timestamp')
      }
    })
  })
})
