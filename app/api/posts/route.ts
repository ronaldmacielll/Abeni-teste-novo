/**
 * Performance API Route - GET /api/posts
 * 
 * BFF endpoint for retrieving social media post metrics from ClickUp
 * Implements JWT validation, multi-tenant filtering, and data normalization
 */

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
      // Return mock data for development
      console.log('Using mock performance data (no ClickUp connection)')
      
      const mockPosts: Post[] = [
        {
          id: 'mock-post-1',
          title: 'Lançamento de Produto - Campanha Instagram',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 15420,
            engajamento: 1847,
            impressoes: 23150,
            cliques: 892,
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-2',
          title: 'Dicas de Uso - Stories Interativo',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 8930,
            engajamento: 2341,
            impressoes: 12450,
            cliques: 456,
          },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-3',
          title: 'Depoimento de Cliente - Vídeo',
          imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 22100,
            engajamento: 3254,
            impressoes: 35600,
            cliques: 1203,
          },
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-4',
          title: 'Promoção Relâmpago - Feed',
          imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 31250,
            engajamento: 4892,
            impressoes: 48900,
            cliques: 2341,
          },
          createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-5',
          title: 'Bastidores da Empresa - Reels',
          imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 18700,
            engajamento: 2156,
            impressoes: 27800,
            cliques: 734,
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-6',
          title: 'Tutorial de Produto - Carrossel',
          imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 12340,
            engajamento: 1567,
            impressoes: 18900,
            cliques: 623,
          },
          createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-7',
          title: 'Parceria com Influencer',
          imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 45600,
            engajamento: 6789,
            impressoes: 67800,
            cliques: 3421,
          },
          createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-post-8',
          title: 'Conteúdo Educativo - Infográfico',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
          status: 'Publicado',
          metrics: {
            alcance: 9870,
            engajamento: 1234,
            impressoes: 15600,
            cliques: 445,
          },
          createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
      ]

      // Filter by date range based on publishedAt
      posts = mockPosts.filter((post) => {
        if (!post.publishedAt) return false
        const postDate = new Date(post.publishedAt)
        return postDate >= startDate && postDate <= endDate
      })
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
