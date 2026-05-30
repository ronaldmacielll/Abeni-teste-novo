/**
 * Tests for Webhook Validator Utility
 * Tests signature validation, payload validation, and data extraction
 */

import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import {
  validateWebhookSignature,
  validateWebhookPayload,
  extractPostIdsFromWebhook,
  extractAccountIdFromWebhook,
  type InstagramWebhookPayload,
} from './webhook-validator'

describe('Webhook Validator', () => {
  const appSecret = 'test-app-secret-1234567890'

  // ============================================================================
  // Signature Validation Tests
  // ============================================================================

  describe('validateWebhookSignature', () => {
    it('should validate correct signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const hash = createHmac('sha256', appSecret).update(body).digest('hex')
      const signature = `sha256=${hash}`

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(true)
    })

    it('should reject invalid signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = 'sha256=invalid-signature-hash'

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(false)
    })

    it('should reject signature with wrong algorithm', () => {
      const body = JSON.stringify({ test: 'data' })
      const hash = createHmac('sha256', appSecret).update(body).digest('hex')
      const signature = `sha1=${hash}`

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(false)
    })

    it('should reject malformed signature header', () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = 'invalid-format'

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(false)
    })

    it('should reject signature with wrong secret', () => {
      const body = JSON.stringify({ test: 'data' })
      const hash = createHmac('sha256', 'wrong-secret').update(body).digest('hex')
      const signature = `sha256=${hash}`

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(false)
    })

    it('should reject tampered body', () => {
      const body = JSON.stringify({ test: 'data' })
      const hash = createHmac('sha256', appSecret).update(body).digest('hex')
      const signature = `sha256=${hash}`

      const tamperedBody = JSON.stringify({ test: 'tampered' })
      const result = validateWebhookSignature(tamperedBody, signature, appSecret)

      expect(result).toBe(false)
    })

    it('should handle empty body', () => {
      const body = ''
      const hash = createHmac('sha256', appSecret).update(body).digest('hex')
      const signature = `sha256=${hash}`

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(true)
    })

    it('should handle large body', () => {
      const body = JSON.stringify({ data: 'x'.repeat(10000) })
      const hash = createHmac('sha256', appSecret).update(body).digest('hex')
      const signature = `sha256=${hash}`

      const result = validateWebhookSignature(body, signature, appSecret)

      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // Payload Validation Tests
  // ============================================================================

  describe('validateWebhookPayload', () => {
    const createValidPayload = (overrides = {}): InstagramWebhookPayload => ({
      object: 'instagram',
      entry: [
        {
          id: '123456789',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'feed',
              value: {
                media_id: 'post-123',
                caption: 'Test post',
              },
            },
          ],
        },
      ],
      ...overrides,
    })

    it('should validate correct payload', () => {
      const payload = createValidPayload()
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject null payload', () => {
      const result = validateWebhookPayload(null)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject non-object payload', () => {
      const result = validateWebhookPayload('not an object')

      expect(result.valid).toBe(false)
    })

    it('should reject payload with wrong object type', () => {
      const payload = createValidPayload({ object: 'page' })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Invalid object type'))).toBe(true)
    })

    it('should reject payload without entry array', () => {
      const payload = { object: 'instagram' } as any
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('entry array'))).toBe(true)
    })

    it('should reject payload with empty entry array', () => {
      const payload = createValidPayload({ entry: [] })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('cannot be empty'))).toBe(true)
    })

    it('should reject entry without id', () => {
      const payload = createValidPayload({
        entry: [
          {
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('missing or invalid id'))).toBe(true)
    })

    it('should reject entry without time', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('missing or invalid time'))).toBe(true)
    })

    it('should reject entry without changes array', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('changes array'))).toBe(true)
    })

    it('should reject entry with empty changes array', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('cannot be empty'))).toBe(true)
    })

    it('should reject change without field', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                value: { media_id: 'post-123' },
              },
            ],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('missing or invalid field'))).toBe(true)
    })

    it('should reject change without value', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
              },
            ],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('missing or invalid value'))).toBe(true)
    })

    it('should validate payload with multiple entries', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
          {
            id: '987654321',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-456' },
              },
            ],
          },
        ],
      }
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(true)
    })

    it('should validate payload with multiple changes', () => {
      const payload = createValidPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
              {
                field: 'comments',
                value: { comment_id: 'comment-123' },
              },
            ],
          },
        ],
      })
      const result = validateWebhookPayload(payload)

      expect(result.valid).toBe(true)
    })
  })

  // ============================================================================
  // Post ID Extraction Tests
  // ============================================================================

  describe('extractPostIdsFromWebhook', () => {
    const createPayload = (overrides = {}): InstagramWebhookPayload => ({
      object: 'instagram',
      entry: [
        {
          id: '123456789',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'feed',
              value: {
                media_id: 'post-123',
              },
            },
          ],
        },
      ],
      ...overrides,
    })

    it('should extract single post ID from media_id', () => {
      const payload = createPayload()
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toContain('post-123')
      expect(postIds).toHaveLength(1)
    })

    it('should extract multiple post IDs', () => {
      const payload = createPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
              {
                field: 'feed',
                value: { media_id: 'post-456' },
              },
            ],
          },
        ],
      })
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toContain('post-123')
      expect(postIds).toContain('post-456')
      expect(postIds).toHaveLength(2)
    })

    it('should extract post ID from post_id field', () => {
      const payload = createPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { post_id: 'post-789' },
              },
            ],
          },
        ],
      })
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toContain('post-789')
    })

    it('should remove duplicate post IDs', () => {
      const payload = createPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
        ],
      })
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toHaveLength(1)
      expect(postIds).toContain('post-123')
    })

    it('should return empty array if no post IDs found', () => {
      const payload = createPayload({
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'comments',
                value: { comment_id: 'comment-123' },
              },
            ],
          },
        ],
      })
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toHaveLength(0)
    })

    it('should handle multiple entries', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
          {
            id: '987654321',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-456' },
              },
            ],
          },
        ],
      }
      const postIds = extractPostIdsFromWebhook(payload)

      expect(postIds).toContain('post-123')
      expect(postIds).toContain('post-456')
      expect(postIds).toHaveLength(2)
    })
  })

  // ============================================================================
  // Account ID Extraction Tests
  // ============================================================================

  describe('extractAccountIdFromWebhook', () => {
    const createPayload = (overrides = {}): InstagramWebhookPayload => ({
      object: 'instagram',
      entry: [
        {
          id: '123456789',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'feed',
              value: { media_id: 'post-123' },
            },
          ],
        },
      ],
      ...overrides,
    })

    it('should extract account ID from first entry', () => {
      const payload = createPayload()
      const accountId = extractAccountIdFromWebhook(payload)

      expect(accountId).toBe('123456789')
    })

    it('should return null if no entries', () => {
      const payload = createPayload({ entry: [] })
      const accountId = extractAccountIdFromWebhook(payload)

      expect(accountId).toBeNull()
    })

    it('should return first account ID if multiple entries', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-123' },
              },
            ],
          },
          {
            id: '987654321',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'feed',
                value: { media_id: 'post-456' },
              },
            ],
          },
        ],
      }
      const accountId = extractAccountIdFromWebhook(payload)

      expect(accountId).toBe('123456789')
    })
  })
})

