/**
 * Instagram Admin API Routes - Account Details
 * PUT /api/admin/instagram/accounts/:accountId - Update account
 * DELETE /api/admin/instagram/accounts/:accountId - Delete account
 * 
 * Validates: Requirements 1.1, 13.1, 13.2, 8.1
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { credentialManager } from '@/lib/services/credential-manager'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schemas
const UpdateAccountSchema = z.object({
  accountName: z.string().min(1).max(255).optional(),
  clickupListId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

type UpdateAccountRequest = z.infer<typeof UpdateAccountSchema>

/**
 * PUT /api/admin/instagram/accounts/:accountId
 * Update account configuration
 * 
 * Requirements: 1.1, 13.1, 13.2
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { accountId } = params

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

    // Only internal users can update accounts
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can manage Instagram accounts' },
        { status: 403 }
      )
    }

    // 2. Parse and validate request body
    let body: UpdateAccountRequest
    try {
      const rawBody = await request.json()
      body = UpdateAccountSchema.parse(rawBody)
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

    logger.info('Updating Instagram account', {
      accountId,
      clientId,
    })

    // 3. Verify account exists and belongs to client
    try {
      const credential = await credentialManager.getCredential(accountId, clientId)

      if (!credential) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
    } catch (error) {
      logger.error('Failed to verify account', error as Error, { accountId })
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // 4. Validate ClickUp list if provided
    if (body.clickupListId) {
      // TODO: Validate that ClickUp list exists
      // This would require ClickUp API call
      logger.debug('ClickUp list validation skipped (TODO)', {
        clickupListId: body.clickupListId,
      })
    }

    // 5. Update account in database
    try {
      await credentialManager.updateCredential(accountId, body, clientId)
    } catch (error) {
      logger.error('Failed to update account', error as Error, { accountId })
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      )
    }

    logger.info('Instagram account updated successfully', { accountId })

    return NextResponse.json(
      {
        success: true,
        message: 'Account updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Unexpected error in PUT /api/admin/instagram/[accountId]', error as Error)

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
 * DELETE /api/admin/instagram/accounts/:accountId
 * Delete account and associated data
 * 
 * Requirements: 1.1, 8.1
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { accountId } = params

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

    // Only internal users can delete accounts
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Only internal users can manage Instagram accounts' },
        { status: 403 }
      )
    }

    // 2. Check for confirmation query parameter
    const { searchParams } = new URL(request.url)
    const confirmed = searchParams.get('confirmed') === 'true'

    if (!confirmed) {
      return NextResponse.json(
        {
          error: 'Deletion requires confirmation',
          message: 'Add ?confirmed=true to confirm deletion',
        },
        { status: 400 }
      )
    }

    logger.info('Deleting Instagram account', {
      accountId,
      clientId,
    })

    // 3. Verify account exists and belongs to client
    try {
      const credential = await credentialManager.getCredential(accountId, clientId)

      if (!credential) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
    } catch (error) {
      logger.error('Failed to verify account', error as Error, { accountId })
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // 4. Delete credentials
    try {
      await credentialManager.deleteCredential(accountId, clientId)
    } catch (error) {
      logger.error('Failed to delete credentials', error as Error, { accountId })
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    // 5. Delete Account_Mapping and related posts
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      // Delete post mappings
      const { error: mappingError } = await supabase
        .from('instagram_post_mappings')
        .delete()
        .eq('instagram_account_id', accountId)

      if (mappingError) {
        throw mappingError
      }

      // Delete sync history
      const { error: historyError } = await supabase
        .from('instagram_sync_history')
        .delete()
        .eq('account_id', accountId)

      if (historyError) {
        throw historyError
      }
    } catch (error) {
      logger.error('Failed to delete related data', error as Error, { accountId })
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      )
    }

    logger.info('Instagram account deleted successfully', { accountId })

    return NextResponse.json(
      {
        success: true,
        message: 'Account deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/admin/instagram/[accountId]', error as Error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
