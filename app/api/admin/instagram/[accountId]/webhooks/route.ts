/**
 * Instagram Webhook Configuration API Routes
 * GET /api/admin/instagram/accounts/:accountId/webhooks - Get webhook configuration
 * PUT /api/admin/instagram/accounts/:accountId/webhooks - Update webhook configuration
 * 
 * Validates: Requirements 20.1, 20.6
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { extractClientIdFromToken } from '@/services/auth/jwt'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schemas
const UpdateWebhookConfigSchema = z.object({
  webhooksEnabled: z.boolean(),
})

type UpdateWebhookConfigRequest = z.infer<typeof UpdateWebhookConfigSchema>

/**
 * GET /api/admin/instagram/accounts/:accountId/webhooks
 * Get webhook configuration for an account
 * 
 * Requirements: 20.1, 20.6
 */
export async function GET(
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

    let clientId: string
    try {
      clientId = extractClientIdFromToken(token)
    } catch (error) {
      logger.warn('Invalid token', error as Error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    logger.debug('Getting webhook configuration', {
      accountId,
      clientId,
    })

    // 2. Get webhook configuration from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: credential, error: credentialError } = await supabase
      .from('instagram_credentials')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (credentialError || !credential) {
      logger.warn('Credential not found', {
        accountId,
        error: credentialError?.message,
      })
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // 3. Get webhook configuration
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('instagram_webhook_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (webhookError && webhookError.code !== 'PGRST116') {
      logger.error('Error fetching webhook config', webhookError)
      return NextResponse.json(
        { error: 'Failed to fetch webhook configuration' },
        { status: 500 }
      )
    }

    // 4. Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instagram/webhooks`

    logger.info('Webhook configuration retrieved', {
      accountId,
      webhooksEnabled: webhookConfig?.webhooks_enabled || false,
    })

    return NextResponse.json({
      success: true,
      accountId,
      accountName: credential.account_name,
      webhooksEnabled: webhookConfig?.webhooks_enabled || false,
      webhookUrl,
      createdAt: webhookConfig?.created_at,
      updatedAt: webhookConfig?.updated_at,
    })
  } catch (error) {
    logger.error('Error getting webhook configuration', error as Error, {
      accountId: params.accountId,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/instagram/accounts/:accountId/webhooks
 * Update webhook configuration for an account
 * 
 * Requirements: 20.1, 20.6
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

    let clientId: string
    try {
      clientId = extractClientIdFromToken(token)
    } catch (error) {
      logger.warn('Invalid token', error as Error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    let body: UpdateWebhookConfigRequest
    try {
      body = await request.json()
      UpdateWebhookConfigSchema.parse(body)
    } catch (error) {
      logger.warn('Invalid request body', error as Error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    logger.debug('Updating webhook configuration', {
      accountId,
      webhooksEnabled: body.webhooksEnabled,
    })

    // 3. Verify account exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: credential, error: credentialError } = await supabase
      .from('instagram_credentials')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (credentialError || !credential) {
      logger.warn('Credential not found', {
        accountId,
        error: credentialError?.message,
      })
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // 4. Update or create webhook configuration
    const { data: existingConfig } = await supabase
      .from('instagram_webhook_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    let result
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('instagram_webhook_config')
        .update({
          webhooks_enabled: body.webhooksEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', accountId)
        .select()
        .single()

      if (error) {
        throw error
      }
      result = data
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('instagram_webhook_config')
        .insert({
          account_id: accountId,
          webhooks_enabled: body.webhooksEnabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }
      result = data
    }

    // 5. Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instagram/webhooks`

    logger.info('Webhook configuration updated', {
      accountId,
      webhooksEnabled: body.webhooksEnabled,
    })

    return NextResponse.json({
      success: true,
      accountId,
      accountName: credential.account_name,
      webhooksEnabled: result.webhooks_enabled,
      webhookUrl,
      updatedAt: result.updated_at,
    })
  } catch (error) {
    logger.error('Error updating webhook configuration', error as Error, {
      accountId: params.accountId,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
