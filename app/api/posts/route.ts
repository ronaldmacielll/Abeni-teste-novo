/**
 * Performance API Route - GET /api/posts
 * 
 * BFF endpoint for retrieving social media post metrics from ClickUp
 * Implements JWT validation, multi-tenant filtering, and data normalization
 */

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { ClickUpService } from '@/services/clickup/client'
import { dataNormalizer } from '@/services/clickup/normalizer'
import { filterPostsByClientId, filterPostsByDateRange } from '@/services/clickup/filters'
import { extractClientIdFromToken } from '@/services/auth/jwt'
import { env } from '@/lib/env'
import { compressedJsonResponse } from '@/lib/api/compression'
import type { GetPostsResponse, Post } from '@/modules/performance/types/post.types'
import type { FieldMapping } from '@/services/clickup/types'

// Field mapping for performance custom fields
// TODO: Move this to database configuration (client_config table)
const PERFORMANCE_FIELD_MAP: FieldMapping['performance'] = {
  alcance: process.env.CLICKUP_FIELD_ALCANCE || '',
  engajamento: process.env.CLICKUP_FIELD_ENGAJAMENTO || '',
  impressoes: process.env.CLICKUP_FIELD_IMPRESSOES || '',
  cliques: process.env.CLICKUP_FIELD_CLIQUES || '',
  status: process.env.CLICKUP_FIELD_STATUS || '',
  imagem: process.env.CLICKUP_FIELD_IMAGEM || '',
}

/**
 * Calculate date range based on period filter
 */
function getDateRange(period?: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()

  if (period === 'week') {
    // Last 7 days
    startDate.setDate(endDate.getDate() - 7)
  } else if (period === 'month') {
    // Last 30 days
    startDate.setDate(endDate.getDate() - 30)
  } else {
    // Default to last 30 days
    startDate.setDate(endDate.getDate() - 30)
  }

  // Reset time to start of day for startDate
  startDate.setHours(0, 0, 0, 0)
  
  // Reset time to end of day for endDate
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

/**
 * GET /api/posts
 * 
 * Query Parameters:
 * - period: 'week' | 'month' (optional, defaults to 'month')
 * 
 * Headers:
 * - Authorization: Bearer <JWT token>
 * 
 * Returns:
 * - 200: Success with posts and metadata
 * - 401: Unauthorized (missing or invalid JWT)
 * - 403: Forbidden (missing client_id in JWT)
 * - 500: Internal server error
 * - 502: Bad gateway (ClickUp API error)
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

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client_id in JWT token' },
        { status: 403 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Validate period parameter
    if (period !== 'week' && period !== 'month') {
      return NextResponse.json(
        { error: 'Invalid period parameter. Must be "week" or "month"' },
        { status: 400 }
      )
    }

    // 3. Calculate date range for filtering
    const { startDate, endDate } = getDateRange(period)

    // 4. Check if using temporary ClickUp credentials (development mode)
    const isUsingTempClickUp = 
      env.clickup.apiKey === 'temp_clickup_key_for_development' ||
      env.clickup.apiKey.startsWith('temp_') ||
      env.clickup.performanceListId === '' ||
      env.clickup.performanceListId.startsWith('temp_')

    let posts: Post[] = []

    if (isUsingTempClickUp) {
      // Return empty data when no ClickUp connection
      console.log('No ClickUp connection - returning empty data')
      
      posts = []
    } else {
      // Real ClickUp integration
      const clickupService = new ClickUpService(env.clickup.apiKey)

      // 5. Fetch tasks from ClickUp performance list
      let clickupTasks
      try {
        clickupTasks = await clickupService.getTasksByList(
          env.clickup.performanceListId,
          {
            archived: false,
            include_closed: false,
          }
        )
      } catch (error) {
        console.error('ClickUp API error:', error)
        return NextResponse.json(
          { 
            error: 'Failed to fetch data from ClickUp API',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 502 }
        )
      }

      // 6. Normalize ClickUp tasks to Post objects
      posts = clickupTasks.map((task) => {
        const post = dataNormalizer.normalizePost(task, PERFORMANCE_FIELD_MAP)
        // Set client_id from JWT
        return { ...post, clientId }
      })

      // 7. Filter by client_id (multi-tenant isolation)
      posts = filterPostsByClientId(posts, clientId)

      // 8. Filter by date range
      posts = filterPostsByDateRange(posts, startDate, endDate)
    }

    // 9. Build response with metadata
    const response: GetPostsResponse = {
      posts,
      metadata: {
        total: posts.length,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }

    // 10. Return JSON response with cache headers and compression
    return compressedJsonResponse(response, 200, {
      'Cache-Control': 'private, max-age=300', // 5 minutes cache
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/posts:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
