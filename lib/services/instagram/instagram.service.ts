/**
 * Instagram Business Service
 * Handles all interactions with Instagram Business API
 * Validates: Requirements 2.1, 2.2, 3.1, 4.1, 4.2
 */

import axios, { AxiosInstance } from 'axios'
import { logger } from '@/lib/utils/logger'
import { validateAccessToken, validateBusinessAccountId } from '@/lib/utils/validation'
import {
  InstagramPost,
  InstagramMetrics,
  InstagramServiceConfig,
  InstagramAPIPost,
  InstagramAPIMetrics,
} from '@/lib/types/instagram.types'
import {
  INSTAGRAM_API_CONFIG,
  INSTAGRAM_RETRY_CONFIG,
  INSTAGRAM_CONFIG,
} from '@/lib/config/instagram.config'

export class InstagramService {
  private client: AxiosInstance
  private config: InstagramServiceConfig
  private retryConfig = INSTAGRAM_RETRY_CONFIG

  constructor(config: InstagramServiceConfig) {
    // Validate configuration
    if (!validateAccessToken(config.accessToken)) {
      throw new Error('Invalid access token format')
    }

    if (!validateBusinessAccountId(config.businessAccountId)) {
      throw new Error('Invalid business account ID format')
    }

    this.config = config

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${INSTAGRAM_API_CONFIG.BASE_URL}/${INSTAGRAM_API_CONFIG.API_VERSION}`,
      timeout: INSTAGRAM_API_CONFIG.TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    logger.debug('InstagramService initialized', {
      businessAccountId: config.businessAccountId,
      accountName: config.accountName,
    })
  }

  /**
   * Validate Instagram credentials by making a test API call
   * Requirement 2.1, 2.2
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Check if token has expired
      if (this.config.tokenExpiresAt && new Date() > new Date(this.config.tokenExpiresAt)) {
        logger.warn('Access token has expired', {
          businessAccountId: this.config.businessAccountId,
          expiresAt: this.config.tokenExpiresAt,
        })
        return false
      }

      logger.info('Validating Instagram credentials', {
        businessAccountId: this.config.businessAccountId,
      })

      // Call Instagram API to get account info
      const response = await this.retryWithBackoff(async () => {
        return this.client.get('/me', {
          params: {
            fields: 'id,name,profile_picture_url,permissions',
            access_token: this.config.accessToken,
          },
        })
      })

      const data = response.data

      // Verify required permissions
      const permissions = data.permissions || []
      const requiredPermissions = INSTAGRAM_API_CONFIG.REQUIRED_PERMISSIONS

      const hasAllPermissions = requiredPermissions.every((perm) =>
        permissions.some((p: any) => p.permission === perm && p.status === 'granted')
      )

      if (!hasAllPermissions) {
        logger.warn('Missing required permissions', {
          required: requiredPermissions,
          granted: permissions.map((p: any) => p.permission),
        })
        return false
      }

      logger.info('Credentials validated successfully', {
        accountId: data.id,
        accountName: data.name,
      })

      return true
    } catch (error) {
      logger.error('Credential validation failed', error as Error, {
        businessAccountId: this.config.businessAccountId,
      })
      return false
    }
  }

  /**
   * Fetch recent posts from Instagram Business account
   * Requirement 3.1
   */
  async fetchRecentPosts(since?: Date, limit: number = 25): Promise<InstagramPost[]> {
    try {
      logger.info('Fetching recent posts', {
        businessAccountId: this.config.businessAccountId,
        limit,
        since: since?.toISOString(),
      })

      const posts: InstagramPost[] = []
      let after: string | undefined

      // Fetch posts with pagination
      while (posts.length < limit) {
        const response = await this.retryWithBackoff(async () => {
          return this.client.get(`/${this.config.businessAccountId}/media`, {
            params: {
              fields: 'id,caption,media_type,media_url,timestamp,permalink',
              limit: Math.min(25, limit - posts.length),
              after,
              access_token: this.config.accessToken,
            },
          })
        })

        const data = response.data

        if (!data.data || data.data.length === 0) {
          break
        }

        // Convert API posts to internal format
        for (const apiPost of data.data) {
          const post = this.mapApiPostToInternal(apiPost)

          // Filter by date if provided
          if (since && new Date(post.timestamp) < since) {
            break
          }

          posts.push(post)

          if (posts.length >= limit) {
            break
          }
        }

        // Check for next page
        after = data.paging?.cursors?.after
        if (!after) {
          break
        }
      }

      logger.info('Posts fetched successfully', {
        businessAccountId: this.config.businessAccountId,
        count: posts.length,
      })

      return posts.slice(0, limit)
    } catch (error) {
      logger.error('Failed to fetch posts', error as Error, {
        businessAccountId: this.config.businessAccountId,
      })
      throw error
    }
  }

  /**
   * Fetch metrics for a single post
   * Requirement 4.1, 4.2
   */
  async fetchPostMetrics(postId: string): Promise<InstagramMetrics> {
    try {
      logger.debug('Fetching metrics for post', {
        postId,
        businessAccountId: this.config.businessAccountId,
      })

      const response = await this.retryWithBackoff(async () => {
        return this.client.get(`/${postId}/insights`, {
          params: {
            metric: 'engagement,impressions,reach,clicks,likes,comments',
            access_token: this.config.accessToken,
          },
        })
      })

      const metrics = this.mapApiMetricsToInternal(response.data, postId)

      logger.debug('Metrics fetched successfully', {
        postId,
        metrics,
      })

      return metrics
    } catch (error) {
      logger.error('Failed to fetch metrics', error as Error, {
        postId,
        businessAccountId: this.config.businessAccountId,
      })

      // Return default metrics on error
      return this.getDefaultMetrics(postId)
    }
  }

  /**
   * Fetch metrics for multiple posts in batch
   * Requirement 4.1, 4.2
   */
  async fetchPostMetricsBatch(postIds: string[]): Promise<InstagramMetrics[]> {
    try {
      logger.info('Fetching metrics batch', {
        businessAccountId: this.config.businessAccountId,
        count: postIds.length,
      })

      const metrics: InstagramMetrics[] = []

      // Process in batches to avoid rate limiting
      const batchSize = 10
      for (let i = 0; i < postIds.length; i += batchSize) {
        const batch = postIds.slice(i, i + batchSize)

        const batchMetrics = await Promise.all(batch.map((id) => this.fetchPostMetrics(id)))

        metrics.push(...batchMetrics)

        // Add delay between batches
        if (i + batchSize < postIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      logger.info('Metrics batch fetched successfully', {
        businessAccountId: this.config.businessAccountId,
        count: metrics.length,
      })

      return metrics
    } catch (error) {
      logger.error('Failed to fetch metrics batch', error as Error, {
        businessAccountId: this.config.businessAccountId,
        count: postIds.length,
      })
      throw error
    }
  }

  /**
   * Retry with exponential backoff
   * Requirement 10.2, 10.3
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.retryConfig.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined
    let delay = this.retryConfig.initialDelayMs

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, undefined, lastError)

          await new Promise((resolve) => setTimeout(resolve, delay))

          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs)
        }
      }
    }

    throw lastError || new Error('Unknown error in retry')
  }

  /**
   * Map Instagram API post to internal format
   */
  private mapApiPostToInternal(apiPost: InstagramAPIPost): InstagramPost {
    return {
      id: apiPost.id,
      caption: apiPost.caption || '',
      mediaType: apiPost.media_type as 'IMAGE' | 'VIDEO' | 'CAROUSEL',
      mediaUrl: apiPost.media_url || null,
      timestamp: apiPost.timestamp,
      permalink: apiPost.permalink,
      publishedAt: apiPost.timestamp,
    }
  }

  /**
   * Map Instagram API metrics to internal format
   */
  private mapApiMetricsToInternal(apiMetrics: any, postId: string): InstagramMetrics {
    const metricsMap: Record<string, number> = {}

    // Parse metrics from API response
    if (apiMetrics.data) {
      for (const metric of apiMetrics.data) {
        const name = metric.name.toLowerCase()
        const value = metric.values?.[0]?.value || 0

        metricsMap[name] = value
      }
    }

    return {
      postId,
      alcance: metricsMap['reach'] || 0,
      engajamento: metricsMap['engagement'] || 0,
      impressoes: metricsMap['impressions'] || 0,
      cliques: metricsMap['clicks'] || 0,
      likes: metricsMap['likes'] || 0,
      comments: metricsMap['comments'] || 0,
      retrievedAt: new Date().toISOString(),
    }
  }

  /**
   * Get default metrics when API call fails
   */
  private getDefaultMetrics(postId: string): InstagramMetrics {
    return {
      postId,
      alcance: 0,
      engajamento: 0,
      impressoes: 0,
      cliques: 0,
      likes: 0,
      comments: 0,
      retrievedAt: new Date().toISOString(),
    }
  }
}
