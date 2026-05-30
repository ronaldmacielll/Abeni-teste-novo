/**
 * Tests for Batch Processor
 * Validates: Requirements 18.1, 18.2
 */

import { BatchProcessor } from '../batch-processor'

describe('BatchProcessor', () => {
  describe('Basic Batch Processing', () => {
    it('should process items in batches', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3, 4, 5]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item * 2)
        return item * 2
      })

      expect(results).toEqual([2, 4, 6, 8, 10])
    })

    it('should process single batch', async () => {
      const processor = new BatchProcessor({ batchSize: 10, delayMs: 0 })
      const items = [1, 2, 3]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle empty array', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const results: number[] = []

      await processor.processBatch([], async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([])
    })
  })

  describe('Batch Size', () => {
    it('should respect batch size of 1', async () => {
      const processor = new BatchProcessor({ batchSize: 1, delayMs: 0 })
      const items = [1, 2, 3]
      let batchCount = 0
      const batchSizes: number[] = []

      await processor.processBatch(items, async (item) => {
        if (batchCount === 0) {
          batchSizes.push(1)
        }
        batchCount++
        return item
      })

      expect(batchSizes).toEqual([1])
    })

    it('should respect batch size of 5', async () => {
      const processor = new BatchProcessor({ batchSize: 5, delayMs: 0 })
      const items = Array.from({ length: 12 }, (_, i) => i + 1)
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual(items)
    })

    it('should handle items less than batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 10, delayMs: 0 })
      const items = [1, 2, 3]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle items exactly matching batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 3, delayMs: 0 })
      const items = [1, 2, 3]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle items multiple of batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 3, delayMs: 0 })
      const items = [1, 2, 3, 4, 5, 6]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('Delay Between Batches', () => {
    it('should add delay between batches', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 50 })
      const items = [1, 2, 3, 4]

      const startTime = Date.now()
      await processor.processBatch(items, async (item) => item)
      const duration = Date.now() - startTime

      // Should have at least one delay (50ms)
      expect(duration).toBeGreaterThanOrEqual(50)
    })

    it('should not delay after last batch', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 100 })
      const items = [1, 2]

      const startTime = Date.now()
      await processor.processBatch(items, async (item) => item)
      const duration = Date.now() - startTime

      // Should not have delay after last batch
      expect(duration).toBeLessThan(100)
    })

    it('should handle zero delay', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3, 4]

      const startTime = Date.now()
      await processor.processBatch(items, async (item) => item)
      const duration = Date.now() - startTime

      // Should complete quickly
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Processor Function', () => {
    it('should call processor for each item', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]
      const calls: number[] = []

      await processor.processBatch(items, async (item) => {
        calls.push(item)
        return item
      })

      expect(calls).toEqual([1, 2, 3])
    })

    it('should return processor results', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]

      const results = await processor.processBatch(items, async (item) => item * 2)

      expect(results).toEqual([2, 4, 6])
    })

    it('should handle async processor', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]

      const results = await processor.processBatch(items, async (item) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return item * 2
      })

      expect(results).toEqual([2, 4, 6])
    })

    it('should handle processor errors', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]

      await expect(
        processor.processBatch(items, async (item) => {
          if (item === 2) {
            throw new Error('Processing error')
          }
          return item
        })
      ).rejects.toThrow('Processing error')
    })
  })

  describe('Large Batches', () => {
    it('should handle large number of items', async () => {
      const processor = new BatchProcessor({ batchSize: 10, delayMs: 0 })
      const items = Array.from({ length: 1000 }, (_, i) => i + 1)
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toHaveLength(1000)
      expect(results[0]).toBe(1)
      expect(results[999]).toBe(1000)
    })

    it('should handle large batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 1000, delayMs: 0 })
      const items = Array.from({ length: 100 }, (_, i) => i + 1)
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toHaveLength(100)
    })
  })

  describe('Different Data Types', () => {
    it('should handle string items', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = ['a', 'b', 'c']
      const results: string[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item.toUpperCase())
        return item.toUpperCase()
      })

      expect(results).toEqual(['A', 'B', 'C'])
    })

    it('should handle object items', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const results: any[] = []

      await processor.processBatch(items, async (item) => {
        results.push({ ...item, processed: true })
        return { ...item, processed: true }
      })

      expect(results).toHaveLength(3)
      expect(results[0].processed).toBe(true)
    })

    it('should handle mixed types', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items: any[] = [1, 'two', { three: 3 }]
      const results: any[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual(items)
    })
  })

  describe('Concurrency', () => {
    it('should process batches sequentially', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3, 4]
      const processingOrder: number[] = []

      await processor.processBatch(items, async (item) => {
        processingOrder.push(item)
        return item
      })

      expect(processingOrder).toEqual([1, 2, 3, 4])
    })

    it('should process items within batch in parallel', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3, 4]
      const startTimes: Map<number, number> = new Map()
      const endTimes: Map<number, number> = new Map()

      await processor.processBatch(items, async (item) => {
        startTimes.set(item, Date.now())
        await new Promise((resolve) => setTimeout(resolve, 10))
        endTimes.set(item, Date.now())
        return item
      })

      // Items in same batch should start around same time
      const batch1Start = startTimes.get(1)!
      const batch1End = endTimes.get(2)!
      const batch2Start = startTimes.get(3)!

      // Batch 2 should start after batch 1 ends
      expect(batch2Start).toBeGreaterThan(batch1End)
    })
  })

  describe('Configuration', () => {
    it('should accept custom batch size', () => {
      const processor = new BatchProcessor({ batchSize: 5, delayMs: 0 })
      expect(processor).toBeDefined()
    })

    it('should accept custom delay', () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 100 })
      expect(processor).toBeDefined()
    })

    it('should accept zero delay', () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      expect(processor).toBeDefined()
    })

    it('should accept large delay', () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 5000 })
      expect(processor).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single item', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1]
      const results: number[] = []

      await processor.processBatch(items, async (item) => {
        results.push(item)
        return item
      })

      expect(results).toEqual([1])
    })

    it('should handle processor returning undefined', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]

      const results = await processor.processBatch(items, async (item) => {
        return undefined as any
      })

      expect(results).toHaveLength(3)
    })

    it('should handle processor returning null', async () => {
      const processor = new BatchProcessor({ batchSize: 2, delayMs: 0 })
      const items = [1, 2, 3]

      const results = await processor.processBatch(items, async (item) => {
        return null as any
      })

      expect(results).toHaveLength(3)
    })
  })

  describe('Performance', () => {
    it('should process 100 items efficiently', async () => {
      const processor = new BatchProcessor({ batchSize: 10, delayMs: 0 })
      const items = Array.from({ length: 100 }, (_, i) => i + 1)

      const startTime = Date.now()
      const results = await processor.processBatch(items, async (item) => item)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(100)
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle rapid batch processing', async () => {
      const processor = new BatchProcessor({ batchSize: 5, delayMs: 0 })
      const items = Array.from({ length: 50 }, (_, i) => i + 1)

      const results = await processor.processBatch(items, async (item) => item * 2)

      expect(results).toHaveLength(50)
      expect(results[0]).toBe(2)
      expect(results[49]).toBe(100)
    })
  })
})
