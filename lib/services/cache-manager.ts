/**
 * Cache Manager Service
 * Handles caching of Instagram data with TTL and LRU/FIFO strategies
 * Validates: Requirements 18.1, 18.2
 */

import { INSTAGRAM_CACHE_CONFIG } from '@/lib/config/instagram.config'
import { logger } from '@/lib/utils/logger'

interface CacheEntry<T> {
  value: T
  expiresAt: number
  accessCount: number
  lastAccessedAt: number
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private accessOrder: string[] = []

  constructor(
    private ttl: number = INSTAGRAM_CACHE_CONFIG.ttl,
    private maxSize: number = INSTAGRAM_CACHE_CONFIG.maxSize,
    private strategy: 'LRU' | 'FIFO' = INSTAGRAM_CACHE_CONFIG.strategy
  ) {
    logger.debug('CacheManager initialized', {
      ttl,
      maxSize,
      strategy,
    })
  }

  /**
   * Get value from cache
   * Requirement 18.1
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key)

      if (!entry) {
        logger.debug('Cache miss', { key })
        return null
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        logger.debug('Cache entry expired', { key })
        this.cache.delete(key)
        this.accessOrder = this.accessOrder.filter((k) => k !== key)
        return null
      }

      // Update access info for LRU
      if (this.strategy === 'LRU') {
        entry.accessCount++
        entry.lastAccessedAt = Date.now()
        this.accessOrder = this.accessOrder.filter((k) => k !== key)
        this.accessOrder.push(key)
      }

      logger.debug('Cache hit', { key })
      return entry.value as T
    } catch (error) {
      logger.error('Cache get failed', error as Error, { key })
      return null
    }
  }

  /**
   * Set value in cache
   * Requirement 18.1
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const entryTtl = ttl || this.ttl

      // Check if we need to evict
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evict()
      }

      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + entryTtl * 1000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      }

      this.cache.set(key, entry)

      if (!this.accessOrder.includes(key)) {
        this.accessOrder.push(key)
      }

      logger.debug('Cache set', { key, ttl: entryTtl })
    } catch (error) {
      logger.error('Cache set failed', error as Error, { key })
    }
  }

  /**
   * Delete value from cache
   * Requirement 18.1
   */
  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key)
      this.accessOrder = this.accessOrder.filter((k) => k !== key)
      logger.debug('Cache delete', { key })
    } catch (error) {
      logger.error('Cache delete failed', error as Error, { key })
    }
  }

  /**
   * Clear all cache
   * Requirement 18.1
   */
  async clear(): Promise<void> {
    try {
      const size = this.cache.size
      this.cache.clear()
      this.accessOrder = []
      logger.info('Cache cleared', { size })
    } catch (error) {
      logger.error('Cache clear failed', error as Error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    entries: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: this.cache.size,
    }
  }

  /**
   * Evict oldest entry based on strategy
   */
  private evict(): void {
    if (this.accessOrder.length === 0) {
      return
    }

    let keyToEvict: string

    if (this.strategy === 'LRU') {
      // Evict least recently used
      keyToEvict = this.accessOrder[0]
    } else {
      // Evict first in (FIFO)
      keyToEvict = this.accessOrder[0]
    }

    this.cache.delete(keyToEvict)
    this.accessOrder = this.accessOrder.filter((k) => k !== keyToEvict)

    logger.debug('Cache evicted', { key: keyToEvict, strategy: this.strategy })
  }

  /**
   * Clean expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const now = Date.now()
      let removed = 0

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
          this.accessOrder = this.accessOrder.filter((k) => k !== key)
          removed++
        }
      }

      if (removed > 0) {
        logger.debug('Cache cleanup', { removed })
      }

      return removed
    } catch (error) {
      logger.error('Cache cleanup failed', error as Error)
      return 0
    }
  }

  /**
   * Set TTL for cache manager
   */
  setTtl(ttl: number): void {
    this.ttl = ttl
    logger.debug('Cache TTL updated', { ttl })
  }

  /**
   * Set max size for cache
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize
    logger.debug('Cache max size updated', { maxSize })
  }

  /**
   * Set eviction strategy
   */
  setStrategy(strategy: 'LRU' | 'FIFO'): void {
    this.strategy = strategy
    logger.debug('Cache strategy updated', { strategy })
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()
