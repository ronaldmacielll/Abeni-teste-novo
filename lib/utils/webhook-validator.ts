/**
 * Instagram Webhook Signature Validation
 * Validates webhook signatures from Instagram using HMAC-SHA256
 * Reference: https://developers.facebook.com/docs/instagram-api/webhooks
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from './logger'

/**
 * Validates Instagram webhook signature
 * Instagram sends an X-Hub-Signature-256 header with format: sha256=<signature>
 * The signature is HMAC-SHA256 of the raw request body using the app secret
 *
 * @param body - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value
 * @param appSecret - Instagram App Secret
 * @returns true if signature is valid, false otherwise
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  appSecret: string
): boolean {
  try {
    // Extract the signature from the header (format: sha256=<signature>)
    const parts = signature.split('=')
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      logger.warn('Invalid webhook signature format', { signature })
      return false
    }

    const expectedSignature = parts[1]

    // Calculate HMAC-SHA256 of the body using the app secret
    const hash = createHmac('sha256', appSecret).update(body).digest('hex')

    // Compare signatures using constant-time comparison to prevent timing attacks
    const isValid = timingSafeEqual(Buffer.from(hash), Buffer.from(expectedSignature))

    if (!isValid) {
      logger.warn('Webhook signature validation failed', {
        expected: expectedSignature.substring(0, 10) + '...',
        received: hash.substring(0, 10) + '...',
      })
    }

    return isValid
  } catch (error) {
    logger.error('Error validating webhook signature', error as Error, {
      signatureLength: signature?.length,
    })
    return false
  }
}

/**
 * Webhook event types from Instagram
 */
export enum WebhookEventType {
  FEED = 'feed',
  STORIES = 'stories',
  COMMENTS = 'comments',
  MENTIONS = 'mentions',
}

/**
 * Webhook event change types
 */
export enum WebhookChangeType {
  ADDED = 'added',
  EDITED = 'edited',
  DELETED = 'deleted',
}

/**
 * Instagram webhook payload structure
 */
export interface InstagramWebhookPayload {
  object: string // Should be 'instagram'
  entry: WebhookEntry[]
}

export interface WebhookEntry {
  id: string // Business account ID
  time: number // Unix timestamp
  changes: WebhookChange[]
}

export interface WebhookChange {
  field: string // 'feed', 'stories', 'comments', 'mentions'
  value: WebhookChangeValue
}

export interface WebhookChangeValue {
  media_id?: string
  post_id?: string
  comment_id?: string
  mention_id?: string
  caption?: string
  media_type?: string
  timestamp?: number
  [key: string]: any
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(payload: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object')
    return { valid: false, errors }
  }

  if (payload.object !== 'instagram') {
    errors.push(`Invalid object type: ${payload.object}, expected 'instagram'`)
  }

  if (!Array.isArray(payload.entry)) {
    errors.push('Payload must contain an entry array')
  } else if (payload.entry.length === 0) {
    errors.push('Entry array cannot be empty')
  } else {
    // Validate each entry
    for (let i = 0; i < payload.entry.length; i++) {
      const entry = payload.entry[i]

      if (!entry.id || typeof entry.id !== 'string') {
        errors.push(`Entry ${i}: missing or invalid id`)
      }

      if (typeof entry.time !== 'number') {
        errors.push(`Entry ${i}: missing or invalid time`)
      }

      if (!Array.isArray(entry.changes)) {
        errors.push(`Entry ${i}: missing or invalid changes array`)
      } else if (entry.changes.length === 0) {
        errors.push(`Entry ${i}: changes array cannot be empty`)
      } else {
        // Validate each change
        for (let j = 0; j < entry.changes.length; j++) {
          const change = entry.changes[j]

          if (!change.field || typeof change.field !== 'string') {
            errors.push(`Entry ${i}, Change ${j}: missing or invalid field`)
          }

          if (!change.value || typeof change.value !== 'object') {
            errors.push(`Entry ${i}, Change ${j}: missing or invalid value`)
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Extracts post IDs from webhook payload
 */
export function extractPostIdsFromWebhook(payload: InstagramWebhookPayload): string[] {
  const postIds: string[] = []

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      // Handle feed changes (new posts, edited posts)
      if (change.field === 'feed' && change.value.media_id) {
        postIds.push(change.value.media_id)
      }

      // Handle post_id field (alternative format)
      if (change.value.post_id) {
        postIds.push(change.value.post_id)
      }
    }
  }

  return Array.from(new Set(postIds)) // Remove duplicates
}

/**
 * Extracts account ID from webhook payload
 */
export function extractAccountIdFromWebhook(payload: InstagramWebhookPayload): string | null {
  if (payload.entry && payload.entry.length > 0) {
    return payload.entry[0].id
  }
  return null
}

