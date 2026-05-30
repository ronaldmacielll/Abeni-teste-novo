/**
 * Tests for Cache Manager
 * Validates: Requirements 18.1, 18.2
 */

import { CacheManager } from '../cache-manager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager(1, 10, 'LRU')
  })

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', 'value1')
      const value = await cache.get('key1')

      expect(value).toBe('value1')
    })

    it('should return null for missing keys', async () => {
      const value = await cache.get('nonexistent')

      expect(value).toBeNull()
    })

    it('should delete values', async () => {
      await cache.set('key1', 'value1')
      await cache.delete('key1')
      const value = await cache.get('key1')

      expect(value).toBeNull()
    })

    it('should clear all values', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.clear()

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('TTL and Expiration', () => {
    it('should expire values after TTL', async () => {
      const cache = new CacheManager(0.1, 10, 'LRU') // 100ms TTL

      await cache.set('key1', 'value1')
      expect(await cache.get('key1')).toBe('value1')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(await cache.get('key1')).toBeNull()
    })

    it('should support custom TTL', async () => {
      const cache = new CacheManager(10, 10, 'LRU')

      await cache.set('key1', 'value1', 0.1) // 100ms TTL
      expect(await cache.get('key1')).toBe('value1')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(await cache.get('key1')).toBeNull()
    })
  })

  describe('LRU Eviction', () => {
    it('should evict least recently used item when max size reached', async () => {
      const cache = new CacheManager(10, 2, 'LRU') // Max 2 items

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      // Access key1 to make it recently used
      await cache.get('key1')

      // Add key3, should evict key2 (least recently used)
      await cache.set('key3', 'value3')

      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBeNull()
      expect(await cache.get('key3')).toBe('value3')
    })

    it('should update access order on get', async () => {
      const cache = new CacheManager(10, 2, 'LRU')

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      // Access key1 multiple times
      await cache.get('key1')
      await cache.get('key1')

      // Add key3, should evict key2
      await cache.set('key3', 'value3')

      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('FIFO Eviction', () => {
    it('should evict first item when max size reached', async () => {
      const cache = new CacheManager(10, 2, 'FIFO')

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      // Add key3, should evict key1 (first in)
      await cache.set('key3', 'value3')

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBe('value2')
      expect(await cache.get('key3')).toBe('value3')
    })
  })

  describe('Statistics', () => {
    it('should return cache statistics', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(10)
      expect(stats.entries).toBe(2)
    })
  })

  describe('Configuration', () => {
    it('should update TTL', async () => {
      cache.setTtl(0.1)

      await cache.set('key1', 'value1')
      expect(await cache.get('key1')).toBe('value1')

      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(await cache.get('key1')).toBeNull()
    })

    it('should update max size', async () => {
      cache.setMaxSize(1)

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBe('value2')
    })

    it('should update strategy', async () => {
      cache.setStrategy('FIFO')

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await cache.set('key3', 'value3')

      expect(await cache.get('key1')).toBeNull()
    })
  })

  describe('Cleanup', () => {
    it('should remove expired entries', async () => {
      const cache = new CacheManager(0.1, 10, 'LRU')

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await new Promise((resolve) => setTimeout(resolve, 150))

      const removed = await cache.cleanup()

      expect(removed).toBe(2)
      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('Type Safety', () => {
    it('should handle different data types', async () => {
      await cache.set('string', 'value')
      await cache.set('number', 42)
      await cache.set('object', { key: 'value' })
      await cache.set('array', [1, 2, 3])

      expect(await cache.get('string')).toBe('value')
      expect(await cache.get('number')).toBe(42)
      expect(await cache.get('object')).toEqual({ key: 'value' })
      expect(await cache.get('array')).toEqual([1, 2, 3])
    })
  })
})
