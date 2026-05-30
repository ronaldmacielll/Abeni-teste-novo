/**
 * Rate Limiter
 * Implements token bucket algorithm for rate limiting
 * Validates: Requirements 18.1, 18.2
 */

import { logger } from './logger'

export class RateLimiter {
  private tokens: number
  private lastRefillTime: number
  private readonly maxTokens: number
  private readonly refillRatePerSecond: number

  constructor(maxTokens: number, refillRatePerSecond: number) {
    this.maxTokens = maxTokens
    this.refillRatePerSecond = refillRatePerSecond
    this.tokens = maxTokens
    this.lastRefillTime = Date.now()

    logger.debug('RateLimiter initialized', {
      maxTokens,
      refillRatePerSecond,
    })
  }

  /**
   * Acquire tokens from the bucket
   * Requirement 18.1, 18.2
   */
  async acquire(tokens: number = 1): Promise<void> {
    const maxWaitTime = 60000 // 60 seconds max wait
    const startTime = Date.now()

    while (!this.canAcquire(tokens)) {
      const elapsedTime = Date.now() - startTime

      if (elapsedTime > maxWaitTime) {
        throw new Error(`Rate limit exceeded: waited ${elapsedTime}ms for ${tokens} tokens`)
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    this.tokens -= tokens
  }

  /**
   * Try to acquire tokens without waiting
   */
  tryAcquire(tokens: number = 1): boolean {
    if (this.canAcquire(tokens)) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  /**
   * Check if tokens can be acquired
   */
  private canAcquire(tokens: number): boolean {
    this.refill()
    return this.tokens >= tokens
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefillTime) / 1000

    if (timePassed > 0) {
      const tokensToAdd = timePassed * this.refillRatePerSecond
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefillTime = now
    }
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens
    this.lastRefillTime = Date.now()
    logger.debug('RateLimiter reset')
  }

  /**
   * Get rate limiter stats
   */
  getStats(): {
    tokens: number
    maxTokens: number
    refillRatePerSecond: number
  } {
    return {
      tokens: this.getTokens(),
      maxTokens: this.maxTokens,
      refillRatePerSecond: this.refillRatePerSecond,
    }
  }
}
