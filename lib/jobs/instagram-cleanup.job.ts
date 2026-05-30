/**
 * Instagram Data Cleanup Job
 * Removes old sync history, audit logs, and orphaned post mappings
 * Runs daily to maintain database performance
 */

import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export class InstagramCleanupJob {
  private scheduler: cron.ScheduleTask | null = null
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  /**
   * Start the cleanup job scheduler
   * Runs daily at 2 AM UTC
   */
  start(): void {
    if (this.scheduler) {
      logger.warn('Cleanup job already running')
      return
    }

    logger.info('Starting Instagram cleanup job scheduler')

    // Run daily at 2 AM UTC (0 2 * * *)
    this.scheduler = cron.schedule('0 2 * * *', async () => {
      try {
        await this.runCleanup()
      } catch (error) {
        logger.error('Cleanup job failed', error as Error)
      }
    })

    logger.info('Instagram cleanup job scheduler started')
  }

  /**
   * Stop the cleanup job scheduler
   */
  stop(): void {
    if (this.scheduler) {
      this.scheduler.stop()
      this.scheduler = null
      logger.info('Instagram cleanup job scheduler stopped')
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<void> {
    try {
      logger.info('Starting cleanup cycle')

      const startTime = Date.now()

      // Cleanup old sync history (keep last 90 days)
      const syncHistoryDeleted = await this.cleanupOldSyncHistory()

      // Cleanup old audit logs (keep last 180 days)
      const auditLogsDeleted = await this.cleanupOldAuditLogs()

      // Cleanup orphaned post mappings
      const postMappingsDeleted = await this.cleanupOrphanedPostMappings()

      const duration = Date.now() - startTime

      logger.info('Cleanup cycle completed', {
        syncHistoryDeleted,
        auditLogsDeleted,
        postMappingsDeleted,
        duration,
      })
    } catch (error) {
      logger.error('Cleanup cycle failed', error as Error)
    }
  }

  /**
   * Cleanup old sync history records (older than 90 days)
   */
  private async cleanupOldSyncHistory(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('instagram_sync_history')
        .delete()
        .lt('started_at', ninetyDaysAgo)

      if (error) {
        throw error
      }

      const deletedCount = data?.length || 0

      logger.info('Cleaned up old sync history', {
        deletedCount,
        beforeDate: ninetyDaysAgo,
      })

      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup sync history', error as Error)
      return 0
    }
  }

  /**
   * Cleanup old audit logs (older than 180 days)
   */
  private async cleanupOldAuditLogs(): Promise<number> {
    try {
      const oneHundredEightyDaysAgo = new Date(
        Date.now() - 180 * 24 * 60 * 60 * 1000
      ).toISOString()

      const { data, error } = await this.supabase
        .from('instagram_audit_logs')
        .delete()
        .lt('timestamp', oneHundredEightyDaysAgo)

      if (error) {
        throw error
      }

      const deletedCount = data?.length || 0

      logger.info('Cleaned up old audit logs', {
        deletedCount,
        beforeDate: oneHundredEightyDaysAgo,
      })

      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup audit logs', error as Error)
      return 0
    }
  }

  /**
   * Cleanup orphaned post mappings (no metrics update in 90 days)
   */
  private async cleanupOrphanedPostMappings(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('instagram_post_mappings')
        .delete()
        .or(`last_metrics_update.is.null,last_metrics_update.lt.${ninetyDaysAgo}`)

      if (error) {
        throw error
      }

      const deletedCount = data?.length || 0

      logger.info('Cleaned up orphaned post mappings', {
        deletedCount,
        beforeDate: ninetyDaysAgo,
      })

      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup post mappings', error as Error)
      return 0
    }
  }
}

// Export singleton instance
let cleanupJobInstance: InstagramCleanupJob | null = null

export function getCleanupJobInstance(): InstagramCleanupJob {
  if (!cleanupJobInstance) {
    cleanupJobInstance = new InstagramCleanupJob()
  }
  return cleanupJobInstance
}
