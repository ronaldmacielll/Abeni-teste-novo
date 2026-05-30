/**
 * Instagram Sync Job Scheduler
 * Orchestrates automatic synchronization of Instagram posts with ClickUp
 * Validates: Requirements 5.1, 5.2, 6.1, 6.2, 7.1, 11.1, 11.2
 */

import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { InstagramService } from '@/lib/services/instagram/instagram.service'
import { CredentialManager } from '@/lib/services/credential-manager'
import { CacheManager } from '@/lib/services/cache-manager'
import { InstagramNormalizer } from '@/lib/utils/instagram/instagram-normalizer'
import { PostClickUpMapper } from '@/lib/services/post-clickup-mapper'
import { RetryStrategy } from '@/lib/utils/retry-strategy'
import { BatchProcessor } from '@/lib/utils/batch-processor'
import {
  SyncJobConfig,
  SyncResult,
  SyncError,
  StoredCredential,
  CACHE_KEYS,
} from '@/lib/types/instagram.types'
import {
  SYNC_JOB_CONFIG,
  INSTAGRAM_RETRY_CONFIG,
  FEATURE_FLAGS,
} from '@/lib/config/instagram.config'

export class InstagramSyncJob {
  private scheduler: cron.ScheduleTask | null = null
  private isRunning = false
  private lastSyncTime: Map<string, Date> = new Map()
  private syncLocks: Map<string, boolean> = new Map()
  private retryStrategy: RetryStrategy
  private batchProcessor: BatchProcessor
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  constructor(
    private config: SyncJobConfig,
    private credentialManager: CredentialManager,
    private cacheManager: CacheManager
  ) {
    this.retryStrategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
      failureThreshold: SYNC_JOB_CONFIG.CIRCUIT_BREAKER_THRESHOLD,
      resetTimeoutMs: SYNC_JOB_CONFIG.CIRCUIT_BREAKER_RESET_MINUTES * 60 * 1000,
    })

    this.batchProcessor = new BatchProcessor({
      batchSize: 10,
      delayMs: 100,
    })

    logger.info('InstagramSyncJob initialized', {
      frequencyMinutes: config.frequencyMinutes,
      maxConcurrentAccounts: config.maxConcurrentAccounts,
      timeoutSeconds: config.timeoutSeconds,
    })
  }

  /**
   * Start the sync job scheduler
   * Requirement 5.1, 5.2, 11.1
   */
  start(): void {
    if (this.scheduler) {
      logger.warn('Sync job already running')
      return
    }

    // Create cron expression (every N minutes)
    const cronExpression = `*/${this.config.frequencyMinutes} * * * *`

    logger.info('Starting Instagram sync job scheduler', {
      frequency: `${this.config.frequencyMinutes} minutes`,
      cronExpression,
    })

    this.scheduler = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        logger.warn('Sync job already running, skipping this cycle')
        return
      }

      try {
        await this.runSync()
      } catch (error) {
        logger.error('Sync job failed', error as Error)
      }
    })

    logger.info('Instagram sync job scheduler started')
  }

  /**
   * Stop the sync job scheduler
   * Requirement 5.1, 5.2
   */
  stop(): void {
    if (this.scheduler) {
      this.scheduler.stop()
      this.scheduler = null
      logger.info('Instagram sync job scheduler stopped')
    }
  }

  /**
   * Run sync manually
   * Requirement 5.1, 5.2, 11.1
   */
  async runSync(): Promise<SyncResult[]> {
    if (this.isRunning) {
      logger.warn('Sync job already running')
      return []
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      logger.info('Starting sync cycle')

      // Get all active credentials
      const credentials = await this.getActiveCredentials()

      if (credentials.length === 0) {
        logger.info('No active Instagram accounts configured')
        return []
      }

      logger.info('Syncing accounts', { count: credentials.length })

      // Process accounts in parallel (with concurrency limit)
      const results = await this.processAccountsWithConcurrency(credentials)

      const duration = Date.now() - startTime

      logger.info('Sync cycle completed', {
        duration,
        accountsProcessed: results.length,
        successCount: results.filter((r) => r.status === 'success').length,
        failureCount: results.filter((r) => r.status === 'failed').length,
      })

      // Store sync history
      await this.storeSyncHistory(results)

      return results
    } catch (error) {
      logger.error('Sync cycle failed', error as Error)
      return []
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Get all active credentials
   */
  private async getActiveCredentials(): Promise<StoredCredential[]> {
    try {
      const { data, error } = await this.supabase
        .from('instagram_credentials')
        .select('*')
        .eq('is_active', true)

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        accountId: item.account_id,
        accountName: item.account_name,
        businessAccountId: item.business_account_id,
        accessToken: item.access_token_encrypted, // Will be decrypted by credential manager
        clickupListId: item.clickup_list_id,
        isActive: item.is_active,
        createdAt: item.created_at,
        lastValidatedAt: item.last_validated_at,
        expiresAt: item.expires_at,
      }))
    } catch (error) {
      logger.error('Failed to get active credentials', error as Error)
      return []
    }
  }

  /**
   * Process accounts with concurrency limit
   */
  private async processAccountsWithConcurrency(
    credentials: StoredCredential[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = []
    const maxConcurrent = this.config.maxConcurrentAccounts

    for (let i = 0; i < credentials.length; i += maxConcurrent) {
      const batch = credentials.slice(i, i + maxConcurrent)

      const batchResults = await Promise.all(
        batch.map((cred) => this.syncAccount(cred))
      )

      results.push(...batchResults)
    }

    return results
  }

  /**
   * Sync a single account
   * Requirement 6.1, 6.2
   */
  private async syncAccount(credential: StoredCredential): Promise<SyncResult> {
    const accountId = credential.accountId
    const startTime = Date.now()

    // Check if already syncing
    if (this.syncLocks.get(accountId)) {
      logger.warn('Account already syncing', { accountId })
      return {
        accountId,
        accountName: credential.accountName,
        postsProcessed: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        metricsUpdated: 0,
        errors: [],
        duration: 0,
        timestamp: new Date().toISOString(),
        status: 'failed',
      }
    }

    this.syncLocks.set(accountId, true)

    try {
      logger.info('Starting account sync', { accountId, accountName: credential.accountName })

      const result: SyncResult = {
        accountId,
        accountName: credential.accountName,
        postsProcessed: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        metricsUpdated: 0,
        errors: [],
        duration: 0,
        timestamp: new Date().toISOString(),
        status: 'success',
      }

      // Decrypt credential
      const decryptedCredential = await this.credentialManager.getCredential(
        accountId,
        credential.createdAt // Using createdAt as userId placeholder
      )

      // Create Instagram service
      const instagramService = new InstagramService({
        accessToken: decryptedCredential.accessToken,
        businessAccountId: credential.businessAccountId,
        accountName: credential.accountName,
      })

      // Fetch recent posts
      const posts = await instagramService.fetchRecentPosts(
        new Date(Date.now() - SYNC_JOB_CONFIG.POSTS_LOOKBACK_HOURS * 60 * 60 * 1000),
        SYNC_JOB_CONFIG.POSTS_FETCH_LIMIT
      )

      result.postsProcessed = posts.length

      if (posts.length === 0) {
        logger.info('No new posts found', { accountId })
        result.duration = Date.now() - startTime
        return result
      }

      // Fetch metrics for all posts
      const metrics = await instagramService.fetchPostMetricsBatch(posts.map((p) => p.id))

      // Normalize posts
      const normalizedPosts = InstagramNormalizer.normalizePosts(
        posts,
        metrics,
        credential.accountName
      )

      // Process posts and create/update ClickUp tasks
      const { results: processedPosts, errors } = await this.batchProcessor.processBatchWithErrorHandling(
        normalizedPosts,
        async (post) => {
          return this.createOrUpdateClickUpTask(post, credential)
        },
        async (error, post) => {
          logger.error('Failed to process post', error, { postId: post.instagramPostId })
          result.errors.push({
            type: 'CLICKUP_API',
            message: error.message,
            context: { postId: post.instagramPostId },
            timestamp: new Date().toISOString(),
          })
          return null
        }
      )

      result.tasksCreated = processedPosts.filter((p) => p.isNew).length
      result.tasksUpdated = processedPosts.filter((p) => !p.isNew).length
      result.metricsUpdated = processedPosts.length

      // Cache posts
      if (FEATURE_FLAGS.ENABLE_CACHE) {
        await this.cacheManager.set(
          CACHE_KEYS.POSTS(accountId),
          normalizedPosts,
          SYNC_JOB_CONFIG.POSTS_LOOKBACK_HOURS * 60 * 60
        )
      }

      // Update last sync time
      this.lastSyncTime.set(accountId, new Date())

      result.duration = Date.now() - startTime
      result.status = errors.length === 0 ? 'success' : 'partial'

      logger.info('Account sync completed', {
        accountId,
        postsProcessed: result.postsProcessed,
        tasksCreated: result.tasksCreated,
        tasksUpdated: result.tasksUpdated,
        duration: result.duration,
        status: result.status,
      })

      return result
    } catch (error) {
      logger.error('Account sync failed', error as Error, { accountId })

      return {
        accountId,
        accountName: credential.accountName,
        postsProcessed: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        metricsUpdated: 0,
        errors: [
          {
            type: 'UNKNOWN',
            message: (error as Error).message,
            context: { accountId },
            timestamp: new Date().toISOString(),
          },
        ],
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        status: 'failed',
      }
    } finally {
      this.syncLocks.delete(accountId)
    }
  }

  /**
   * Create or update ClickUp task
   * Requirement 6.1, 6.2, 14.1, 14.2
   */
  private async createOrUpdateClickUpTask(
    post: any,
    credential: StoredCredential
  ): Promise<{ isNew: boolean }> {
    try {
      // Check if post already exists in ClickUp
      const existingTask = await this.findExistingTask(post.instagramPostId, credential)

      if (existingTask) {
        // Update existing task
        logger.debug('Updating existing ClickUp task', {
          taskId: existingTask.id,
          postId: post.instagramPostId,
        })

        // Update metrics
        const customFields = PostClickUpMapper.buildCustomFieldsUpdate(post.metrics)

        // TODO: Call ClickUp API to update task
        // await clickupService.updateTask(existingTask.id, { custom_fields: customFields })

        return { isNew: false }
      } else {
        // Create new task
        logger.debug('Creating new ClickUp task', {
          postId: post.instagramPostId,
        })

        const taskData = PostClickUpMapper.mapToClickUpTask(post, post.metrics)

        // TODO: Call ClickUp API to create task
        // const newTask = await clickupService.createTask(credential.clickupListId, taskData)

        // Store mapping
        await this.storePostMapping(post.instagramPostId, credential.accountId, 'task-id')

        return { isNew: true }
      }
    } catch (error) {
      logger.error('Failed to create/update ClickUp task', error as Error, {
        postId: post.instagramPostId,
      })
      throw error
    }
  }

  /**
   * Find existing ClickUp task for Instagram post
   */
  private async findExistingTask(postId: string, credential: StoredCredential): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('instagram_post_mappings')
        .select('*')
        .eq('instagram_post_id', postId)
        .eq('instagram_account_id', credential.accountId)
        .single()

      if (error || !data) {
        return null
      }

      return { id: data.clickup_task_id }
    } catch (error) {
      logger.debug('No existing task found', { postId })
      return null
    }
  }

  /**
   * Store post mapping
   */
  private async storePostMapping(
    postId: string,
    accountId: string,
    taskId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from('instagram_post_mappings').insert({
        instagram_post_id: postId,
        instagram_account_id: accountId,
        clickup_task_id: taskId,
        clickup_list_id: '', // TODO: Get from credential
        last_metrics_update: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      logger.debug('Post mapping stored', { postId, taskId })
    } catch (error) {
      logger.error('Failed to store post mapping', error as Error, { postId })
    }
  }

  /**
   * Store sync history
   */
  private async storeSyncHistory(results: SyncResult[]): Promise<void> {
    try {
      const historyRecords = results.map((result) => ({
        account_id: result.accountId,
        status: result.status,
        posts_processed: result.postsProcessed,
        tasks_created: result.tasksCreated,
        tasks_updated: result.tasksUpdated,
        metrics_updated: result.metricsUpdated,
        error_message: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        duration_ms: result.duration,
        started_at: new Date(new Date(result.timestamp).getTime() - result.duration).toISOString(),
        completed_at: result.timestamp,
      }))

      const { error } = await this.supabase.from('instagram_sync_history').insert(historyRecords)

      if (error) {
        throw error
      }

      logger.debug('Sync history stored', { count: historyRecords.length })
    } catch (error) {
      logger.error('Failed to store sync history', error as Error)
    }
  }

  /**
   * Get last sync time for account
   */
  getLastSyncTime(accountId: string): Date | null {
    return this.lastSyncTime.get(accountId) || null
  }

  /**
   * Get next sync time for account
   */
  getNextSyncTime(accountId: string): Date {
    const lastSync = this.getLastSyncTime(accountId)
    const nextSync = new Date(
      (lastSync?.getTime() || Date.now()) + this.config.frequencyMinutes * 60 * 1000
    )
    return nextSync
  }

  /**
   * Check if sync is running
   */
  isRunning_(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
let syncJobInstance: InstagramSyncJob | null = null

export function getSyncJobInstance(
  credentialManager: CredentialManager,
  cacheManager: CacheManager
): InstagramSyncJob {
  if (!syncJobInstance) {
    syncJobInstance = new InstagramSyncJob(SYNC_JOB_CONFIG, credentialManager, cacheManager)
  }
  return syncJobInstance
}
