/**
 * Instagram Admin API Routes - Manual Sync
 * POST /api/admin/instagram/sync - Trigger manual synchronization
 * 
 * Validates: Requirements 5.1, 5.2, 11.1
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { credentialManager } from '@/lib/services/credential-manager'
import { InstagramService } from '@/lib/services/instagram/instagram.service'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import type { SyncResult, SyncError } from '@/lib/types/instagram.types'

/**
 * POST /api/admin/instagram/sync
 * Trigger manual synchronization for all accounts
 * 
 * Requirements: 5.1, 5.2, 11.1
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate JWT and extract client_id
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const clientId = extractClientIdFromToken(token)
    const role = extractRoleFromToken(token)

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client_id in JWT token' },
        { status: 403 }
      )
    }

    // Only internal users can trigger sync
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can trigger synchronization' },
        { status: 403 }
      )
    }

    logger.info('Manual sync triggered', { clientId })

    // 2. Get all active accounts for this client
    let accounts
    try {
      accounts = await credentialManager.listCredentials(clientId)
      accounts = accounts.filter((acc) => acc.isActive)
    } catch (error) {
      logger.error('Failed to list accounts', error as Error, { clientId })
      return NextResponse.json(
        { error: 'Failed to retrieve accounts' },
        { status: 500 }
      )
    }

    if (accounts.length === 0) {
      return NextResponse.json(
        {
          results: [],
          message: 'No active accounts configured',
        },
        { status: 200 }
      )
    }

    // 3. Sync each account
    const results: SyncResult[] = []
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    for (const account of accounts) {
      const syncStartTime = Date.now()
      const errors: SyncError[] = []

      try {
        logger.info('Starting sync for account', {
          accountId: account.accountId,
          accountName: account.accountName,
        })

        // Get full credential with token
        let credential
        try {
          credential = await credentialManager.getCredential(account.accountId, clientId)
        } catch (error) {
          logger.error('Failed to get credential', error as Error, {
            accountId: account.accountId,
          })
          errors.push({
            type: 'VALIDATION',
            message: 'Failed to retrieve account credentials',
            context: { accountId: account.accountId },
            timestamp: new Date().toISOString(),
          })
          continue
        }

        // Create Instagram service
        const instagramService = new InstagramService({
          accessToken: credential.accessToken,
          businessAccountId: credential.businessAccountId,
          accountName: credential.accountName,
        })

        // Fetch recent posts
        let posts
        try {
          posts = await instagramService.fetchRecentPosts(undefined, 25)
        } catch (error) {
          logger.error('Failed to fetch posts', error as Error, {
            accountId: account.accountId,
          })
          errors.push({
            type: 'INSTAGRAM_API',
            message: 'Failed to fetch posts from Instagram',
            context: { accountId: account.accountId },
            timestamp: new Date().toISOString(),
          })
          continue
        }

        // Fetch metrics for each post
        let metrics
        try {
          metrics = await instagramService.fetchPostMetricsBatch(posts.map((p) => p.id))
        } catch (error) {
          logger.error('Failed to fetch metrics', error as Error, {
            accountId: account.accountId,
          })
          errors.push({
            type: 'INSTAGRAM_API',
            message: 'Failed to fetch metrics from Instagram',
            context: { accountId: account.accountId },
            timestamp: new Date().toISOString(),
          })
          continue
        }

        // Store sync history
        const syncDuration = Date.now() - syncStartTime
        const syncStatus = errors.length === 0 ? 'success' : 'partial'

        try {
          const { error: historyError } = await supabase
            .from('instagram_sync_history')
            .insert({
              account_id: account.accountId,
              status: syncStatus,
              posts_processed: posts.length,
              tasks_created: 0, // TODO: Track actual counts
              tasks_updated: 0,
              metrics_updated: metrics.length,
              error_message: errors.length > 0 ? JSON.stringify(errors) : null,
              duration_ms: syncDuration,
              started_at: new Date(syncStartTime).toISOString(),
              completed_at: new Date().toISOString(),
            })

          if (historyError) {
            throw historyError
          }
        } catch (error) {
          logger.error('Failed to store sync history', error as Error, {
            accountId: account.accountId,
          })
        }

        results.push({
          accountId: account.accountId,
          accountName: account.accountName,
          postsProcessed: posts.length,
          tasksCreated: 0,
          tasksUpdated: 0,
          metricsUpdated: metrics.length,
          errors,
          duration: syncDuration,
          timestamp: new Date().toISOString(),
          status: syncStatus,
        })

        logger.info('Sync completed for account', {
          accountId: account.accountId,
          postsProcessed: posts.length,
          duration: syncDuration,
        })
      } catch (error) {
        logger.error('Unexpected error during sync', error as Error, {
          accountId: account.accountId,
        })

        const syncDuration = Date.now() - syncStartTime

        results.push({
          accountId: account.accountId,
          accountName: account.accountName,
          postsProcessed: 0,
          tasksCreated: 0,
          tasksUpdated: 0,
          metricsUpdated: 0,
          errors: [
            {
              type: 'UNKNOWN',
              message: error instanceof Error ? error.message : 'Unknown error',
              context: { accountId: account.accountId },
              timestamp: new Date().toISOString(),
            },
          ],
          duration: syncDuration,
          timestamp: new Date().toISOString(),
          status: 'failed',
        })
      }
    }

    logger.info('Manual sync completed', {
      clientId,
      accountsProcessed: results.length,
    })

    return NextResponse.json(
      {
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.status === 'success').length,
          partial: results.filter((r) => r.status === 'partial').length,
          failed: results.filter((r) => r.status === 'failed').length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Unexpected error in POST /api/admin/instagram/sync', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
