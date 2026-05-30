/**
 * Tests for Rate Limiter
 * Validates: Requirements 18.1, 18.2
 */

import { RateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
  describe('Token Acquisition', () => {
    it('should acquire tokens successfully', async () => {
      const limiter = new RateLimiter(10, 10)

      await limiter.acquire(5)

      const remaining = limiter.getTokens()
      expect(remaining).toBeLessThan(10)
    })

    it('should wait for tokens to be available', async () => {
      const limiter = new RateLimiter(1, 10)

      const startTime = Date.now()
      await limiter.acquire(1)
      await limiter.acquire(1) // Should wait for refill

      const duration = Date.now() - startTime
      expect(duration).toBeGreaterThan(50) // Should have waited
    })

    it('should throw error if wait time exceeds max', async () => {
      const limiter = new RateLimiter(0, 0) // No tokens, no refill

      await expect(limiter.acquire(1)).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Try Acquire', () => {
    it('should return true if tokens available', () => {
      const limiter = new RateLimiter(10, 10)

      const result = limiter.tryAcquire(5)

      expect(result).toBe(true)
    })

    it('should return false if tokens not available', () => {
      const limiter = new RateLimiter(1, 0)

      limiter.tryAcquire(1)
      const result = limiter.tryAcquire(1)

      expect(result).toBe(false)
    })
  })

  describe('Token Refill', () => {
    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter(10, 10) // 10 tokens per second

      limiter.tryAcquire(10) // Use all tokens
      expect(limiter.getTokens()).toBe(0)

      // Wait for refill
      await new Promise((resolve) => setTimeout(resolve, 150))

      const tokens = limiter.getTokens()
      expect(tokens).toBeGreaterThan(0)
    })

    it('should not exceed max tokens', async () => {
      const limiter = new RateLimiter(10, 10)

      await new Promise((resolve) => setTimeout(resolve, 200))

      const tokens = limiter.getTokens()
      expect(tokens).toBeLessThanOrEqual(10)
    })
  })

  describe('Reset', () => {
    it('should reset to max tokens', () => {
      const limiter = new RateLimiter(10, 10)

      limiter.tryAcquire(5)
      expect(limiter.getTokens()).toBeLessThan(10)

      limiter.reset()
      expect(limiter.getTokens()).toBe(10)
    })
  })

  describe('Statistics', () => {
    it('should return rate limiter stats', () => {
      const limiter = new RateLimiter(10, 5)

      const stats = limiter.getStats()

      expect(stats.maxTokens).toBe(10)
      expect(stats.refillRatePerSecond).toBe(5)
      expect(stats.tokens).toBeLessThanOrEqual(10)
    })
  })

  describe('Multiple Tokens', () => {
    it('should handle acquiring multiple tokens', async () => {
      const limiter = new RateLimiter(100, 100)

      await limiter.acquire(50)
      const remaining = limiter.getTokens()

      expect(remaining).toBeLessThan(100)
      expect(remaining).toBeGreaterThan(0)
    })
  })
})
