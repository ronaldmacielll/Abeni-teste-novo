/**
 * Instagram Admin API Routes
 * POST /api/admin/instagram/accounts - Add new Instagram account
 * GET /api/admin/instagram/accounts - List configured accounts
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 16.1
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { credentialManager } from '@/lib/services/credential-manager'
import { InstagramService } from '@/lib/services/instagram/instagram.service'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'

// Validation schemas
const AddAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(255),
  businessAccountId: z.string().min(1, 'Business account ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  clickupListId: z.string().min(1, 'ClickUp list ID is required'),
})

type AddAccountRequest = z.infer<typeof AddAccountSchema>

/**
 * POST /api/admin/instagram/accounts
 * Add a new Instagram Business account
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
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

    // Only internal users can add accounts
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can manage Instagram accounts' },
        { status: 403 }
      )
    }

    // 2. Parse and validate request body
    let body: AddAccountRequest
    try {
      const rawBody = await request.json()
      body = AddAccountSchema.parse(rawBody)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    logger.info('Adding Instagram account', {
      accountName: body.accountName,
      businessAccountId: body.businessAccountId,
      clientId,
    })

    // 3. Validate ClickUp list exists
    try {
      const clickupApiKey = process.env.CLICKUP_API_KEY
      if (!clickupApiKey) {
        throw new Error('ClickUp API key not configured')
      }

      const response = await fetch(`https://api.clickup.com/api/v2/list/${body.clickupListId}`, {
        method: 'GET',
        headers: {
          Authorization: clickupApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        logger.warn('ClickUp list validation failed', {
          clickupListId: body.clickupListId,
          status: response.status,
        })
        return NextResponse.json(
          { error: 'CLICKUP_LIST_NOT_FOUND', message: 'ClickUp list does not exist or is not accessible' },
          { status: 400 }
        )
      }
    } catch (error) {
      logger.error('ClickUp list validation error', error as Error, {
        clickupListId: body.clickupListId,
      })
      return NextResponse.json(
        { error: 'Failed to validate ClickUp list' },
        { status: 400 }
      )
    }

    // 4. Validate credentials with Instagram API
    try {
      const instagramService = new InstagramService({
        accessToken: body.accessToken,
        businessAccountId: body.businessAccountId,
        accountName: body.accountName,
      })

      const isValid = await instagramService.validateCredentials()

      if (!isValid) {
        logger.warn('Instagram credentials validation failed', {
          businessAccountId: body.businessAccountId,
        })
        return NextResponse.json(
          { error: 'Invalid Instagram credentials or insufficient permissions' },
          { status: 400 }
        )
      }
    } catch (error) {
      logger.error('Instagram credential validation error', error as Error, {
        businessAccountId: body.businessAccountId,
      })
      return NextResponse.json(
        { error: 'Failed to validate Instagram credentials' },
        { status: 400 }
      )
    }

    // 5. Generate unique account ID
    const accountId = `ig-${crypto.randomBytes(8).toString('hex')}`

    // 6. Store credentials encrypted
    try {
      await credentialManager.storeCredential(
        {
          accountId,
          accountName: body.accountName,
          businessAccountId: body.businessAccountId,
          accessToken: body.accessToken,
          clickupListId: body.clickupListId,
          isActive: true,
          lastValidatedAt: new Date().toISOString(),
        },
        clientId
      )
    } catch (error) {
      logger.error('Failed to store credentials', error as Error, {
        accountId,
      })
      return NextResponse.json(
        { error: 'Failed to store account credentials' },
        { status: 500 }
      )
    }

    // 7. Create Account_Mapping in database
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const { error } = await supabase.from('instagram_credentials').insert({
        account_id: accountId,
        account_name: body.accountName,
        business_account_id: body.businessAccountId,
        clickup_list_id: body.clickupListId,
        is_active: true,
        created_by: clientId,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      logger.error('Failed to create account mapping', error as Error, {
        accountId,
      })
      return NextResponse.json(
        { error: 'Failed to create account mapping' },
        { status: 500 }
      )
    }

    logger.info('Instagram account added successfully', {
      accountId,
      accountName: body.accountName,
    })

    return NextResponse.json(
      {
        success: true,
        accountId,
        message: 'Instagram account configured successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Unexpected error in POST /api/admin/instagram/accounts', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/instagram/accounts
 * List all configured Instagram accounts (without tokens)
 * 
 * Requirements: 1.1, 8.1, 16.1
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

    // Only internal users can view accounts
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can view Instagram accounts' },
        { status: 403 }
      )
    }

    logger.info('Listing Instagram accounts', { clientId })

    // 2. Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // 3. List credentials from database
    try {
      const allAccounts = await credentialManager.listCredentials(clientId)

      // Apply pagination
      const paginatedAccounts = allAccounts.slice(offset, offset + limit)

      // 4. Fetch sync history for each account
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const accountsWithStatus = await Promise.all(
        paginatedAccounts.map(async (account) => {
          // Get last sync time
          const { data: syncHistory } = await supabase
            .from('instagram_sync_history')
            .select('completed_at, status')
            .eq('account_id', account.accountId)
            .order('completed_at', { ascending: false })
            .limit(1)

          const lastSync = syncHistory?.[0]

          return {
            ...account,
            lastSyncTime: lastSync?.completed_at || null,
            lastSyncStatus: lastSync?.status || null,
          }
        })
      )

      return NextResponse.json(
        {
          accounts: accountsWithStatus,
          total: allAccounts.length,
          limit,
          offset,
          hasMore: offset + limit < allAccounts.length,
        },
        { status: 200 }
      )
    } catch (error) {
      logger.error('Failed to list credentials', error as Error, { clientId })
      return NextResponse.json(
        { error: 'Failed to retrieve accounts' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Unexpected error in GET /api/admin/instagram/accounts', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
