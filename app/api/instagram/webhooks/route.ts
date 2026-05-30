/**
 * Instagram Webhook Endpoint
 * Receives webhook events from Instagram Business API
 * Validates signatures and triggers immediate sync for affected posts
 *
 * Reference: https://developers.facebook.com/docs/instagram-api/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import {
  validateWebhookSignature,
  validateWebhookPayload,
  extractPostIdsFromWebhook,
  extractAccountIdFromWebhook,
  type InstagramWebhookPayload,
} from '@/lib/utils/webhook-validator'
import { getSyncJobInstance } from '@/lib/jobs/instagram-sync.job'
import { CredentialManager } from '@/lib/services/credential-manager'
import { createClient } from '@/lib/database/supabase/client'

/**
 * GET /api/instagram/webhooks
 * Instagram sends a GET request to verify the webhook URL
 * Must respond with the challenge parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    logger.debug('Webhook verification request received', {
      mode,
      tokenLength: token?.length,
    })

    // Verify the token
    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
    if (!verifyToken) {
      logger.error('INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Webhook verification token not configured' },
        { status: 500 }
      )
    }

    if (mode !== 'subscribe' || token !== verifyToken) {
      logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken })
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }

    if (!challenge) {
      logger.warn('Webhook verification missing challenge')
      return NextResponse.json({ error: 'Missing challenge' }, { status: 400 })
    }

    logger.info('Webhook verified successfully')
    return NextResponse.json({ hub: { challenge } })
  } catch (error) {
    logger.error('Error handling webhook verification', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/instagram/webhooks
 * Receives webhook events from Instagram
 * Validates signature and triggers sync for affected posts
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get the raw body for signature validation
    const body = await request.text()

    logger.debug('Webhook event received', {
      contentLength: body.length,
      contentType: request.headers.get('content-type'),
    })

    // Validate signature
    const signature = request.headers.get('x-hub-signature-256')
    if (!signature) {
      logger.warn('Webhook request missing signature header')
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      )
    }

    const appSecret = process.env.INSTAGRAM_APP_SECRET
    if (!appSecret) {
      logger.error('INSTAGRAM_APP_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      )
    }

    if (!validateWebhookSignature(body, signature, appSecret)) {
      logger.warn('Webhook signature validation failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }

    logger.debug('Webhook signature validated')

    // Parse the payload
    let payload: InstagramWebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      logger.warn('Failed to parse webhook payload', error as Error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate payload structure
    const validation = validateWebhookPayload(payload)
    if (!validation.valid) {
      logger.warn('Webhook payload validation failed', {
        errors: validation.errors,
      })
      return NextResponse.json(
        { error: 'Invalid payload structure', details: validation.errors },
        { status: 400 }
      )
    }

    logger.info('Webhook payload validated', {
      entries: payload.entry.length,
      changes: payload.entry.reduce((sum, e) => sum + e.changes.length, 0),
    })

    // Extract information from webhook
    const accountId = extractAccountIdFromWebhook(payload)
    const postIds = extractPostIdsFromWebhook(payload)

    if (!accountId) {
      logger.warn('Could not extract account ID from webhook')
      return NextResponse.json(
        { error: 'Could not extract account ID' },
        { status: 400 }
      )
    }

    logger.info('Webhook event details extracted', {
      accountId,
      postIds: postIds.length,
    })

    // Verify that the account is configured
    const credentialManager = new CredentialManager()
    try {
      const credential = await credentialManager.getCredential(accountId)
      if (!credential.isActive) {
        logger.warn('Webhook received for inactive account', { accountId })
        return NextResponse.json(
          { error: 'Account is not active' },
          { status: 403 }
        )
      }
      logger.debug('Account verified', { accountId, accountName: credential.accountName })
    } catch (error) {
      logger.warn('Account not found or not configured', { accountId })
      return NextResponse.json(
        { error: 'Account not configured' },
        { status: 404 }
      )
    }

    // Trigger immediate sync for this account
    logger.info('Triggering immediate sync for webhook event', {
      accountId,
      postIds: postIds.length,
    })

    try {
      const syncJob = getSyncJobInstance()
      // Run sync in background (don't wait for it)
      syncJob.runSync().catch((error) => {
        logger.error('Error running sync from webhook', error as Error, {
          accountId,
        })
      })

      // Log webhook event to database
      await logWebhookEvent(accountId, payload, postIds, 'success')

      logger.info('Webhook processed successfully', {
        accountId,
        postIds: postIds.length,
        processingTime: Date.now() - startTime,
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Webhook received and sync triggered',
          accountId,
          postIds: postIds.length,
        },
        { status: 200 }
      )
    } catch (error) {
      logger.error('Error triggering sync from webhook', error as Error, {
        accountId,
      })

      await logWebhookEvent(accountId, payload, postIds, 'error', error as Error)

      return NextResponse.json(
        { error: 'Failed to trigger sync' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Unexpected error in webhook handler', error as Error, {
      processingTime: Date.now() - startTime,
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Log webhook event to database for monitoring and debugging
 */
async function logWebhookEvent(
  accountId: string,
  payload: InstagramWebhookPayload,
  postIds: string[],
  status: 'success' | 'error',
  error?: Error
): Promise<void> {
  try {
    const supabase = createClient()

    // Create a webhook event log entry
    const { error: dbError } = await supabase.from('instagram_webhook_events').insert({
      account_id: accountId,
      event_type: payload.entry[0]?.changes[0]?.field || 'unknown',
      post_ids: postIds,
      payload: payload,
      status,
      error_message: error?.message,
      processed_at: new Date().toISOString(),
    })

    if (dbError) {
      logger.warn('Failed to log webhook event to database', {
        error: dbError.message,
        accountId,
      })
    }
  } catch (error) {
    logger.warn('Error logging webhook event', error as Error, {
      accountId,
    })
  }
}

