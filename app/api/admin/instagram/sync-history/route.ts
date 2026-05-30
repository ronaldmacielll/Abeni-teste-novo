/**
 * Instagram Admin API Routes - Sync History
 * GET /api/admin/instagram/sync-history - Get synchronization history
 * 
 * Validates: Requirements 11.1, 11.2, 17.1
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schema for query parameters
const QuerySchema = z.object({
  accountId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

type QueryParams = z.infer<typeof QuerySchema>

/**
 * GET /api/admin/instagram/sync-history
 * Get synchronization history with optional filters
 * 
 * Query Parameters:
 * - accountId: Filter by account ID (optional)
 * - limit: Number of records to return (default: 20, max: 100)
 * - offset: Number of records to skip (default: 0)
 * 
 * Requirements: 11.1, 11.2, 17.1
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

    // Only internal users can view sync history
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can view sync history' },
        { status: 403 }
      )
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    let query: QueryParams
    try {
      query = QuerySchema.parse({
        accountId: searchParams.get('accountId'),
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    logger.info('Fetching sync history', {
      clientId,
      accountId: query.accountId,
      limit: query.limit,
      offset: query.offset,
    })

    // 3. Query sync history from database
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      // Build query
      let dbQuery = supabase
        .from('instagram_sync_history')
        .select('*', { count: 'exact' })

      // Filter by account if provided
      if (query.accountId) {
        dbQuery = dbQuery.eq('account_id', query.accountId)
      }

      // Apply pagination
      dbQuery = dbQuery
        .order('started_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1)

      const { data, count, error } = await dbQuery

      if (error) {
        throw error
      }

      // 4. Format response
      const history = (data || []).map((entry: any) => ({
        id: entry.id,
        accountId: entry.account_id,
        status: entry.status,
        postsProcessed: entry.posts_processed,
        tasksCreated: entry.tasks_created,
        tasksUpdated: entry.tasks_updated,
        metricsUpdated: entry.metrics_updated,
        errorMessage: entry.error_message,
        durationMs: entry.duration_ms,
        startedAt: entry.started_at,
        completedAt: entry.completed_at,
      }))

      return NextResponse.json(
        {
          history,
          pagination: {
            total: count || 0,
            limit: query.limit,
            offset: query.offset,
            hasMore: (query.offset + query.limit) < (count || 0),
          },
        },
        { status: 200 }
      )
    } catch (error) {
      logger.error('Failed to fetch sync history', error as Error, { clientId })
      return NextResponse.json(
        { error: 'Failed to retrieve sync history' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Unexpected error in GET /api/admin/instagram/sync-history', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
