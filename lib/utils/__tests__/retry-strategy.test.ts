/**
 * Tests for Retry Strategy
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { RetryStrategy } from '../retry-strategy'
import { INSTAGRAM_RETRY_CONFIG } from '@/lib/config/instagram.config'

describe('RetryStrategy', () => {
  describe('Basic Retry', () => {
    it('should succeed on first attempt', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG)

      const result = await strategy.executeWithRetry(async () => 'success')

      expect(result).toBe('success')
    })

    it('should retry on failure', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG)
      let attempts = 0

      const result = await strategy.executeWithRetry(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Fail')
        }
        return 'success'
      })

      expect(result).toBe('success')
      expect(attempts).toBe(2)
    })

    it('should throw after max retries', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG)

      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Always fails')
        })
      ).rejects.toThrow('Always fails')
    })
  })

  describe('Exponential Backoff', () => {
    it('should increase delay between retries', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      })

      const startTime = Date.now()

      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      const duration = Date.now() - startTime

      // Should have delays: 10ms + 20ms = 30ms minimum
      expect(duration).toBeGreaterThanOrEqual(30)
    })

    it('should not exceed max delay', async () => {
      const strategy = new RetryStrategy({
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 200,
        backoffMultiplier: 10,
      })

      const startTime = Date.now()

      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      const duration = Date.now() - startTime

      // Should not exceed max delay * retries
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 2,
        resetTimeoutMs: 100,
      })

      // First failure
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      // Second failure
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      // Circuit breaker should be open
      await expect(
        strategy.executeWithRetry(async () => 'success')
      ).rejects.toThrow('Circuit breaker is open')
    })

    it('should reset circuit breaker after timeout', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 1,
        resetTimeoutMs: 50,
      })

      // Trigger circuit breaker
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      // Wait for reset
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should succeed now
      const result = await strategy.executeWithRetry(async () => 'success')
      expect(result).toBe('success')
    })

    it('should reset consecutive failures on success', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 3,
        resetTimeoutMs: 100,
      })

      // One failure
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      // Success
      const result = await strategy.executeWithRetry(async () => 'success')
      expect(result).toBe('success')

      // Consecutive failures should be reset
      const stats = strategy.getStats()
      expect(stats.consecutiveFailures).toBe(0)
    })
  })

  describe('Manual Circuit Breaker Control', () => {
    it('should manually open circuit breaker', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG)

      strategy.openCircuitBreaker()

      await expect(
        strategy.executeWithRetry(async () => 'success')
      ).rejects.toThrow('Circuit breaker is open')
    })

    it('should manually close circuit breaker', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 1,
        resetTimeoutMs: 100,
      })

      // Trigger circuit breaker
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      // Manually close
      strategy.closeCircuitBreaker()

      // Should succeed now
      const result = await strategy.executeWithRetry(async () => 'success')
      expect(result).toBe('success')
    })
  })

  describe('Statistics', () => {
    it('should track consecutive failures', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG)

      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      const stats = strategy.getStats()
      expect(stats.consecutiveFailures).toBeGreaterThan(0)
    })

    it('should track circuit breaker state', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 1,
        resetTimeoutMs: 100,
      })

      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      const stats = strategy.getStats()
      expect(stats.circuitBreakerOpen).toBe(true)
    })
  })

  describe('Reset', () => {
    it('should reset all state', async () => {
      const strategy = new RetryStrategy(INSTAGRAM_RETRY_CONFIG, {
        failureThreshold: 1,
        resetTimeoutMs: 100,
      })

      // Trigger circuit breaker
      await expect(
        strategy.executeWithRetry(async () => {
          throw new Error('Fail')
        })
      ).rejects.toThrow()

      strategy.reset()

      const stats = strategy.getStats()
      expect(stats.consecutiveFailures).toBe(0)
      expect(stats.circuitBreakerOpen).toBe(false)
    })
  })
})
