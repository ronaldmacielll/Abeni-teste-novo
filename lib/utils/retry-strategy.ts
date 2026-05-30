/**
 * Retry Strategy with Exponential Backoff and Circuit Breaker
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { RetryConfig } from '@/lib/types/instagram.types'
import { logger } from './logger'

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeoutMs: number
}

export class RetryStrategy {
  private consecutiveFailures = 0
  private circuitBreakerOpen = false
  private circuitBreakerResetTime = 0

  constructor(
    private retryConfig: RetryConfig,
    private circuitBreakerConfig?: CircuitBreakerConfig
  ) {
    logger.debug('RetryStrategy initialized', {
      maxRetries: retryConfig.maxRetries,
      initialDelayMs: retryConfig.initialDelayMs,
      backoffMultiplier: retryConfig.backoffMultiplier,
    })
  }

  /**
   * Execute function with retry and circuit breaker
   * Requirement 10.1, 10.2, 10.3
   */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      if (Date.now() < this.circuitBreakerResetTime) {
        throw new Error('Circuit breaker is open')
      } else {
        // Reset circuit breaker
        this.circuitBreakerOpen = false
        this.consecutiveFailures = 0
        logger.info('Circuit breaker reset')
      }
    }

    let lastError: Error | undefined
    let delay = this.retryConfig.initialDelayMs

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await fn()

        // Reset consecutive failures on success
        this.consecutiveFailures = 0

        return result
      } catch (error) {
        lastError = error as Error

        this.consecutiveFailures++

        // Check if circuit breaker should open
        if (
          this.circuitBreakerConfig &&
          this.consecutiveFailures >= this.circuitBreakerConfig.failureThreshold
        ) {
          this.circuitBreakerOpen = true
          this.circuitBreakerResetTime = Date.now() + this.circuitBreakerConfig.resetTimeoutMs

          logger.error('Circuit breaker opened', lastError, {
            consecutiveFailures: this.consecutiveFailures,
            resetTimeoutMs: this.circuitBreakerConfig.resetTimeoutMs,
          })

          throw lastError
        }

        if (attempt < this.retryConfig.maxRetries) {
          logger.warn(`Retry attempt ${attempt + 1}/${this.retryConfig.maxRetries}`, undefined, lastError)

          await new Promise((resolve) => setTimeout(resolve, delay))

          delay = Math.min(
            delay * this.retryConfig.backoffMultiplier,
            this.retryConfig.maxDelayMs
          )
        }
      }
    }

    throw lastError || new Error('Unknown error in retry')
  }

  /**
   * Get retry strategy stats
   */
  getStats(): {
    consecutiveFailures: number
    circuitBreakerOpen: boolean
    circuitBreakerResetTime: number
  } {
    return {
      consecutiveFailures: this.consecutiveFailures,
      circuitBreakerOpen: this.circuitBreakerOpen,
      circuitBreakerResetTime: this.circuitBreakerResetTime,
    }
  }

  /**
   * Reset retry strategy
   */
  reset(): void {
    this.consecutiveFailures = 0
    this.circuitBreakerOpen = false
    this.circuitBreakerResetTime = 0
    logger.debug('RetryStrategy reset')
  }

  /**
   * Manually open circuit breaker
   */
  openCircuitBreaker(): void {
    this.circuitBreakerOpen = true
    this.circuitBreakerResetTime = Date.now() + (this.circuitBreakerConfig?.resetTimeoutMs || 30000)
    logger.warn('Circuit breaker manually opened')
  }

  /**
   * Manually close circuit breaker
   */
  closeCircuitBreaker(): void {
    this.circuitBreakerOpen = false
    this.consecutiveFailures = 0
    logger.info('Circuit breaker manually closed')
  }
}
