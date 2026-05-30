/**
 * Validation Utilities for Instagram Integration
 * Provides validation functions for credentials, metrics, and data
 */

import { InstagramMetrics, InstagramPost } from '@/lib/types/instagram.types'
import { METRICS_VALIDATION_RULES } from '@/lib/config/instagram.config'
import { logger } from './logger'

// ============================================================================
// Credential Validation
// ============================================================================

export function validateAccessToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // Instagram access tokens are typically long strings starting with 'EAAB' or similar
  // This is a basic validation - actual validation happens via API call
  return token.length > 50
}

export function validateBusinessAccountId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }

  // Business account IDs are numeric strings
  return /^\d+$/.test(id)
}

export function validateAccountName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }

  // Account name should be between 1 and 255 characters
  return name.length > 0 && name.length <= 255
}

export function validateClickUpListId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }

  // ClickUp list IDs are numeric strings
  return /^\d+$/.test(id)
}

// ============================================================================
// Metrics Validation
// ============================================================================

export function validateMetricsValue(value: any): boolean {
  // Must be a number
  if (typeof value !== 'number') {
    return false
  }

  // Must be non-negative
  if (value < METRICS_VALIDATION_RULES.MIN_VALUE) {
    return false
  }

  // Must be an integer
  if (!Number.isInteger(value)) {
    return false
  }

  return true
}

export function validateMetrics(metrics: InstagramMetrics): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate each metric value
  const metricFields = ['alcance', 'engajamento', 'impressoes', 'cliques', 'likes', 'comments']

  for (const field of metricFields) {
    const value = metrics[field as keyof InstagramMetrics]

    if (!validateMetricsValue(value)) {
      errors.push(`${field} must be a non-negative integer, got: ${value}`)
    }
  }

  // Validate relationships
  if (METRICS_VALIDATION_RULES.RELATIONSHIPS.LIKES_LE_ENGAGEMENT) {
    if (metrics.likes > metrics.engajamento) {
      errors.push(
        `likes (${metrics.likes}) must be <= engagement (${metrics.engajamento})`
      )
    }
  }

  if (METRICS_VALIDATION_RULES.RELATIONSHIPS.COMMENTS_LE_ENGAGEMENT) {
    if (metrics.comments > metrics.engajamento) {
      errors.push(
        `comments (${metrics.comments}) must be <= engagement (${metrics.engajamento})`
      )
    }
  }

  if (METRICS_VALIDATION_RULES.RELATIONSHIPS.ENGAGEMENT_LE_IMPRESSIONS) {
    if (metrics.engajamento > metrics.impressoes) {
      errors.push(
        `engagement (${metrics.engajamento}) must be <= impressions (${metrics.impressoes})`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function ensureMetricsConsistency(metrics: InstagramMetrics): InstagramMetrics {
  const consistent = { ...metrics }

  // Ensure likes <= engagement
  if (consistent.likes > consistent.engajamento) {
    logger.warn('Metrics inconsistency: likes > engagement, adjusting engagement', {
      likes: consistent.likes,
      engagement: consistent.engajamento,
    })
    consistent.engajamento = consistent.likes
  }

  // Ensure comments <= engagement
  if (consistent.comments > consistent.engajamento) {
    logger.warn('Metrics inconsistency: comments > engagement, adjusting engagement', {
      comments: consistent.comments,
      engagement: consistent.engajamento,
    })
    consistent.engajamento = consistent.comments
  }

  // Ensure engagement <= impressions
  if (consistent.engajamento > consistent.impressoes) {
    logger.warn('Metrics inconsistency: engagement > impressions, adjusting impressions', {
      engagement: consistent.engajamento,
      impressions: consistent.impressoes,
    })
    consistent.impressoes = consistent.engajamento
  }

  return consistent
}

// ============================================================================
// Post Validation
// ============================================================================

export function validatePost(post: InstagramPost): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!post.id || typeof post.id !== 'string') {
    errors.push('Post ID is required and must be a string')
  }

  if (!post.caption || typeof post.caption !== 'string') {
    errors.push('Post caption is required and must be a string')
  }

  if (!['IMAGE', 'VIDEO', 'CAROUSEL'].includes(post.mediaType)) {
    errors.push(`Invalid media type: ${post.mediaType}`)
  }

  if (!post.timestamp || isNaN(new Date(post.timestamp).getTime())) {
    errors.push('Post timestamp is required and must be a valid date')
  }

  if (!post.permalink || typeof post.permalink !== 'string') {
    errors.push('Post permalink is required and must be a string')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Email Validation
// ============================================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// URL Validation
// ============================================================================

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// Batch Validation
// ============================================================================

export function validateMetricsBatch(
  metrics: InstagramMetrics[]
): {
  valid: InstagramMetrics[]
  invalid: Array<{ metrics: InstagramMetrics; errors: string[] }>
} {
  const valid: InstagramMetrics[] = []
  const invalid: Array<{ metrics: InstagramMetrics; errors: string[] }> = []

  for (const m of metrics) {
    const validation = validateMetrics(m)
    if (validation.valid) {
      valid.push(ensureMetricsConsistency(m))
    } else {
      invalid.push({ metrics: m, errors: validation.errors })
    }
  }

  return { valid, invalid }
}

export function validatePostBatch(
  posts: InstagramPost[]
): {
  valid: InstagramPost[]
  invalid: Array<{ post: InstagramPost; errors: string[] }>
} {
  const valid: InstagramPost[] = []
  const invalid: Array<{ post: InstagramPost; errors: string[] }> = []

  for (const p of posts) {
    const validation = validatePost(p)
    if (validation.valid) {
      valid.push(p)
    } else {
      invalid.push({ post: p, errors: validation.errors })
    }
  }

  return { valid, invalid }
}
