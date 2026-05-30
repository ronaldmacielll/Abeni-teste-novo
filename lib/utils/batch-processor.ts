/**
 * Batch Processor
 * Processes items in batches with configurable delay
 * Validates: Requirements 18.1, 18.2
 */

import { logger } from './logger'

export interface BatchProcessorConfig {
  batchSize: number
  delayMs: number
}

export class BatchProcessor {
  constructor(private config: BatchProcessorConfig) {
    logger.debug('BatchProcessor initialized', {
      batchSize: config.batchSize,
      delayMs: config.delayMs,
    })
  }

  /**
   * Process items in batches
   * Requirement 18.1, 18.2
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize?: number,
    delayMs?: number
  ): Promise<R[]> {
    const actualBatchSize = batchSize || this.config.batchSize
    const actualDelayMs = delayMs || this.config.delayMs

    logger.info('Starting batch processing', {
      totalItems: items.length,
      batchSize: actualBatchSize,
      delayMs: actualDelayMs,
    })

    const results: R[] = []
    const startTime = Date.now()

    for (let i = 0; i < items.length; i += actualBatchSize) {
      const batch = items.slice(i, i + actualBatchSize)
      const batchNumber = Math.floor(i / actualBatchSize) + 1
      const totalBatches = Math.ceil(items.length / actualBatchSize)

      logger.debug(`Processing batch ${batchNumber}/${totalBatches}`, {
        batchSize: batch.length,
      })

      try {
        const batchResults = await Promise.all(batch.map((item) => processor(item)))
        results.push(...batchResults)

        // Add delay between batches (except after the last batch)
        if (i + actualBatchSize < items.length) {
          await new Promise((resolve) => setTimeout(resolve, actualDelayMs))
        }
      } catch (error) {
        logger.error(`Batch ${batchNumber} processing failed`, error as Error)
        throw error
      }
    }

    const duration = Date.now() - startTime

    logger.info('Batch processing completed', {
      totalItems: items.length,
      processedItems: results.length,
      durationMs: duration,
    })

    return results
  }

  /**
   * Process items sequentially
   */
  async processSequential<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    delayMs?: number
  ): Promise<R[]> {
    const actualDelayMs = delayMs || this.config.delayMs

    logger.info('Starting sequential processing', {
      totalItems: items.length,
      delayMs: actualDelayMs,
    })

    const results: R[] = []
    const startTime = Date.now()

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processor(items[i])
        results.push(result)

        // Add delay between items (except after the last item)
        if (i < items.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, actualDelayMs))
        }
      } catch (error) {
        logger.error(`Item ${i} processing failed`, error as Error)
        throw error
      }
    }

    const duration = Date.now() - startTime

    logger.info('Sequential processing completed', {
      totalItems: items.length,
      processedItems: results.length,
      durationMs: duration,
    })

    return results
  }

  /**
   * Process items with error handling
   */
  async processBatchWithErrorHandling<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    errorHandler?: (error: Error, item: T, index: number) => Promise<R | null>,
    batchSize?: number,
    delayMs?: number
  ): Promise<{
    results: R[]
    errors: Array<{ item: T; index: number; error: Error }>
  }> {
    const actualBatchSize = batchSize || this.config.batchSize
    const actualDelayMs = delayMs || this.config.delayMs

    logger.info('Starting batch processing with error handling', {
      totalItems: items.length,
      batchSize: actualBatchSize,
    })

    const results: R[] = []
    const errors: Array<{ item: T; index: number; error: Error }> = []

    for (let i = 0; i < items.length; i += actualBatchSize) {
      const batch = items.slice(i, i + actualBatchSize)
      const batchNumber = Math.floor(i / actualBatchSize) + 1

      logger.debug(`Processing batch ${batchNumber}`, {
        batchSize: batch.length,
      })

      const batchResults = await Promise.allSettled(
        batch.map((item, index) => processor(item))
      )

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        const itemIndex = i + j

        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          const error = result.reason as Error

          if (errorHandler) {
            try {
              const handledResult = await errorHandler(error, batch[j], itemIndex)
              if (handledResult !== null) {
                results.push(handledResult)
              } else {
                errors.push({ item: batch[j], index: itemIndex, error })
              }
            } catch (handlerError) {
              errors.push({ item: batch[j], index: itemIndex, error: handlerError as Error })
            }
          } else {
            errors.push({ item: batch[j], index: itemIndex, error })
          }
        }
      }

      // Add delay between batches
      if (i + actualBatchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, actualDelayMs))
      }
    }

    logger.info('Batch processing with error handling completed', {
      totalItems: items.length,
      successfulItems: results.length,
      failedItems: errors.length,
    })

    return { results, errors }
  }

  /**
   * Update batch size
   */
  setBatchSize(batchSize: number): void {
    this.config.batchSize = batchSize
    logger.debug('Batch size updated', { batchSize })
  }

  /**
   * Update delay
   */
  setDelay(delayMs: number): void {
    this.config.delayMs = delayMs
    logger.debug('Delay updated', { delayMs })
  }
}
