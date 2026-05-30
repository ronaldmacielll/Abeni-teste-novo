/**
 * Instagram Integration Configuration
 * Centralized configuration for all Instagram-related settings
 */

import { RetryConfig, RateLimiterConfig, CacheConfig } from '@/lib/types/instagram.types'

// ============================================================================
// Environment Variables
// ============================================================================

export const INSTAGRAM_CONFIG = {
  // Encryption
  ENCRYPTION_KEY: process.env.INSTAGRAM_ENCRYPTION_KEY || '',
  VAULT_URL: process.env.INSTAGRAM_VAULT_URL,

  // Sync Job
  SYNC_FREQUENCY_MINUTES: parseInt(process.env.INSTAGRAM_SYNC_FREQUENCY_MINUTES || '5'),
  MAX_CONCURRENT_ACCOUNTS: parseInt(process.env.INSTAGRAM_MAX_CONCURRENT_ACCOUNTS || '3'),
  SYNC_TIMEOUT_SECONDS: parseInt(process.env.INSTAGRAM_SYNC_TIMEOUT_SECONDS || '120'),

  // Rate Limiting
  RATE_LIMIT_POSTS_PER_SECOND: parseInt(process.env.INSTAGRAM_RATE_LIMIT_POSTS_PER_SECOND || '10'),
  RATE_LIMIT_METRICS_PER_SECOND: parseInt(
    process.env.INSTAGRAM_RATE_LIMIT_METRICS_PER_SECOND || '20'
  ),
  RATE_LIMIT_MAX_CONCURRENT_REQUESTS: parseInt(
    process.env.INSTAGRAM_RATE_LIMIT_MAX_CONCURRENT_REQUESTS || '5'
  ),

  // Cache
  CACHE_TTL_SECONDS: parseInt(process.env.INSTAGRAM_CACHE_TTL_SECONDS || '300'),
  CACHE_MAX_SIZE: parseInt(process.env.INSTAGRAM_CACHE_MAX_SIZE || '1000'),
  CACHE_STRATEGY: (process.env.INSTAGRAM_CACHE_STRATEGY || 'LRU') as 'LRU' | 'FIFO',

  // Logging
  LOG_LEVEL: (process.env.INSTAGRAM_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  DEBUG_MODE: process.env.INSTAGRAM_DEBUG_MODE === 'true',
}

// ============================================================================
// Validation
// ============================================================================

export function validateInstagramConfig(): string[] {
  const errors: string[] = []

  if (!INSTAGRAM_CONFIG.ENCRYPTION_KEY) {
    errors.push('INSTAGRAM_ENCRYPTION_KEY is not set')
  }

  if (INSTAGRAM_CONFIG.ENCRYPTION_KEY.length !== 64) {
    errors.push('INSTAGRAM_ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
  }

  if (INSTAGRAM_CONFIG.SYNC_FREQUENCY_MINUTES < 5) {
    errors.push('INSTAGRAM_SYNC_FREQUENCY_MINUTES must be at least 5 minutes')
  }

  if (INSTAGRAM_CONFIG.SYNC_FREQUENCY_MINUTES > 60) {
    errors.push('INSTAGRAM_SYNC_FREQUENCY_MINUTES must not exceed 60 minutes')
  }

  if (INSTAGRAM_CONFIG.MAX_CONCURRENT_ACCOUNTS < 1) {
    errors.push('INSTAGRAM_MAX_CONCURRENT_ACCOUNTS must be at least 1')
  }

  if (INSTAGRAM_CONFIG.MAX_CONCURRENT_ACCOUNTS > 10) {
    errors.push('INSTAGRAM_MAX_CONCURRENT_ACCOUNTS must not exceed 10')
  }

  if (INSTAGRAM_CONFIG.SYNC_TIMEOUT_SECONDS < 30) {
    errors.push('INSTAGRAM_SYNC_TIMEOUT_SECONDS must be at least 30 seconds')
  }

  if (INSTAGRAM_CONFIG.CACHE_TTL_SECONDS < 60) {
    errors.push('INSTAGRAM_CACHE_TTL_SECONDS must be at least 60 seconds')
  }

  return errors
}

// ============================================================================
// Retry Configurations
// ============================================================================

export const INSTAGRAM_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
}

export const CLICKUP_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

export const NETWORK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 120000,
  backoffMultiplier: 2,
}

// ============================================================================
// Rate Limiter Configurations
// ============================================================================

export const INSTAGRAM_POSTS_RATE_LIMITER: RateLimiterConfig = {
  maxTokens: INSTAGRAM_CONFIG.RATE_LIMIT_POSTS_PER_SECOND,
  refillRatePerSecond: INSTAGRAM_CONFIG.RATE_LIMIT_POSTS_PER_SECOND,
}

export const INSTAGRAM_METRICS_RATE_LIMITER: RateLimiterConfig = {
  maxTokens: INSTAGRAM_CONFIG.RATE_LIMIT_METRICS_PER_SECOND,
  refillRatePerSecond: INSTAGRAM_CONFIG.RATE_LIMIT_METRICS_PER_SECOND,
}

// ============================================================================
// Cache Configuration
// ============================================================================

export const INSTAGRAM_CACHE_CONFIG: CacheConfig = {
  ttl: INSTAGRAM_CONFIG.CACHE_TTL_SECONDS,
  maxSize: INSTAGRAM_CONFIG.CACHE_MAX_SIZE,
  strategy: INSTAGRAM_CONFIG.CACHE_STRATEGY,
}

// ============================================================================
// Instagram API Configuration
// ============================================================================

export const INSTAGRAM_API_CONFIG = {
  BASE_URL: 'https://graph.instagram.com',
  API_VERSION: 'v18.0',
  TIMEOUT_MS: 30000,
  REQUIRED_PERMISSIONS: [
    'instagram_business_content_read',
    'instagram_business_insights_read',
  ],
}

// ============================================================================
// ClickUp API Configuration
// ============================================================================

export const CLICKUP_API_CONFIG = {
  TIMEOUT_MS: 10000,
  MAX_BATCH_SIZE: 100,
}

// ============================================================================
// Sync Job Configuration
// ============================================================================

export const SYNC_JOB_CONFIG = {
  FREQUENCY_MINUTES: INSTAGRAM_CONFIG.SYNC_FREQUENCY_MINUTES,
  MAX_CONCURRENT_ACCOUNTS: INSTAGRAM_CONFIG.MAX_CONCURRENT_ACCOUNTS,
  TIMEOUT_SECONDS: INSTAGRAM_CONFIG.SYNC_TIMEOUT_SECONDS,
  POSTS_FETCH_LIMIT: 25,
  POSTS_LOOKBACK_HOURS: 24,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_RESET_MINUTES: 30,
}

// ============================================================================
// Metrics Validation Rules
// ============================================================================

export const METRICS_VALIDATION_RULES = {
  // All metrics must be non-negative
  MIN_VALUE: 0,

  // Relationships that must hold
  RELATIONSHIPS: {
    // likes <= engagement
    LIKES_LE_ENGAGEMENT: true,
    // comments <= engagement
    COMMENTS_LE_ENGAGEMENT: true,
    // engagement <= impressions
    ENGAGEMENT_LE_IMPRESSIONS: true,
  },

  // Default values for missing metrics
  DEFAULT_VALUES: {
    alcance: 0,
    engajamento: 0,
    impressoes: 0,
    cliques: 0,
    likes: 0,
    comments: 0,
  },
}

// ============================================================================
// Logging Configuration
// ============================================================================

export const LOGGING_CONFIG = {
  LEVEL: INSTAGRAM_CONFIG.LOG_LEVEL,
  DEBUG_MODE: INSTAGRAM_CONFIG.DEBUG_MODE,
  INCLUDE_TIMESTAMPS: true,
  INCLUDE_CONTEXT: true,
  MAX_LOG_SIZE: 10000, // characters
}

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_WEBHOOK_SUPPORT: false, // Future feature
  ENABLE_BATCH_METRICS_UPDATE: true,
  ENABLE_CACHE: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_CIRCUIT_BREAKER: true,
  ENABLE_AUDIT_LOGGING: true,
}
