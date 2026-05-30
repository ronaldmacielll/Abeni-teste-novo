/**
 * Instagram Admin API Routes - Account Status
 * GET /api/admin/instagram/status - Get status of all accounts
 * 
 * Validates: Requirements 5.1, 5.2, 8.1, 16.1
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { credentialManager } from '@/lib/services/credential-manager'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import type { AccountStatus } from '@/lib/types/instagram.types'

/**
 * GET /api/admin/instagram/status
 * Get status of all configured accounts
 * 
 * Returns:
 * - accountId: Unique account identifier
 * - accountName: Display name
 * - isActive: Whether account is active
 * - lastSyncTime: Timestamp of last successful sync
 * - nextSyncTime: Estimated time of next sync
 * - lastError: Last error message if any
 * - postsCount: Number of posts synced
 * 
 * Requirements: 5.1, 5.2, 8.1, 16.1
 */
export async function GET(request: NextRequest) {
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

    // Only internal users can view status
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can view account status' },
        { status: 403 }
      )
    }

    logger.info('Fetching account status', { clientId })

    // 2. Get all accounts
    let accounts
    try {
      accounts = await credentialManager.listCredentials(clientId)
    } catch (error) {
      logger.error('Failed to list accounts', error as Error, { clientId })
      return NextResponse.json(
        { error: 'Failed to retrieve accounts' },
        { status: 500 }
      )
    }

    // 3. Get status for each account
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const statuses: AccountStatus[] = await Promise.all(
      accounts.map(async (account) => {
        try {
          // Get last sync
          const { data: lastSyncData } = await supabase
            .from('instagram_sync_history')
            .select('completed_at, status, error_message')
            .eq('account_id', account.accountId)
            .order('completed_at', { ascending: false })
            .limit(1)

          const lastSync = lastSyncData?.[0]

          // Calculate next sync time (assuming 5-minute intervals)
          let nextSyncTime: string | undefined
          if (lastSync?.completed_at) {
            const lastSyncDate = new Date(lastSync.completed_at)
            const nextSync = new Date(lastSyncDate.getTime() + 5 * 60 * 1000)
            nextSyncTime = nextSync.toISOString()
          }

          // Get post count
          const { count: postsCount } = await supabase
            .from('instagram_post_mappings')
            .select('*', { count: 'exact', head: true })
            .eq('instagram_account_id', account.accountId)

          // Extract last error if sync failed
          let lastError: string | undefined
          if (lastSync?.status === 'failed' && lastSync?.error_message) {
            try {
              const errors = JSON.parse(lastSync.error_message)
              lastError = errors[0]?.message || 'Unknown error'
            } catch {
              lastError = lastSync.error_message
            }
          }

          return {
            accountId: account.accountId,
            accountName: account.accountName,
            isActive: account.isActive,
            lastSyncTime: lastSync?.completed_at || undefined,
            nextSyncTime,
            lastError,
            postsCount: postsCount || 0,
          }
        } catch (error) {
          logger.error('Failed to get account status', error as Error, {
            accountId: account.accountId,
          })

          return {
            accountId: account.accountId,
            accountName: account.accountName,
            isActive: account.isActive,
            lastError: 'Failed to retrieve status',
            postsCount: 0,
          }
        }
      })
    )

    return NextResponse.json(
      {
        accounts: statuses,
        total: statuses.length,
        activeCount: statuses.filter((s) => s.isActive).length,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Unexpected error in GET /api/admin/instagram/status', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
