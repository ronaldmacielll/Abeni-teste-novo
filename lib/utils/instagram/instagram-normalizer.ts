/**
 * Instagram Data Normalizer
 * Transforms Instagram API data to ALUA internal format
 * Validates: Requirements 3.1, 4.1, 4.2, 15.1
 */

import { InstagramPost, InstagramMetrics, NormalizedPost } from '@/lib/types/instagram.types'
import { validateMetrics, ensureMetricsConsistency } from '@/lib/utils/validation'
import { logger } from '@/lib/utils/logger'

export class InstagramNormalizer {
  /**
   * Normalize Instagram post to ALUA format
   * Requirement 3.1, 4.1, 4.2
   */
  static normalizePost(
    igPost: InstagramPost,
    metrics: InstagramMetrics,
    accountName: string
  ): NormalizedPost {
    try {
      // Validate metrics before normalizing
      const validation = validateMetrics(metrics)
      if (!validation.valid) {
        logger.warn('Metrics validation failed, using defaults', {
          postId: igPost.id,
          errors: validation.errors,
        })
      }

      // Ensure metrics consistency
      const consistentMetrics = ensureMetricsConsistency(metrics)

      // Extract caption as title (first 100 characters)
      const title = igPost.caption.substring(0, 100) || 'Instagram Post'

      // Determine status based on post data
      const status = this.determinePostStatus(igPost)

      const normalized: NormalizedPost = {
        id: `instagram-${igPost.id}`,
        title,
        imageUrl: igPost.mediaUrl,
        status,
        metrics: {
          alcance: consistentMetrics.alcance,
          engajamento: consistentMetrics.engajamento,
          impressoes: consistentMetrics.impressoes,
          cliques: consistentMetrics.cliques,
          likes: consistentMetrics.likes,
          comments: consistentMetrics.comments,
        },
        createdAt: igPost.timestamp,
        publishedAt: igPost.publishedAt,
        instagramAccountName: accountName,
        instagramPostId: igPost.id,
        instagramPermalink: igPost.permalink,
      }

      logger.debug('Post normalized successfully', {
        postId: igPost.id,
        normalizedId: normalized.id,
      })

      return normalized
    } catch (error) {
      logger.error('Failed to normalize post', error as Error, {
        postId: igPost.id,
      })
      throw error
    }
  }

  /**
   * Validate metrics consistency
   * Requirement 15.1
   */
  static validateMetrics(metrics: InstagramMetrics): {
    valid: boolean
    errors: string[]
  } {
    return validateMetrics(metrics)
  }

  /**
   * Ensure metrics consistency
   * Requirement 15.1
   */
  static ensureMetricsConsistency(metrics: InstagramMetrics): InstagramMetrics {
    return ensureMetricsConsistency(metrics)
  }

  /**
   * Normalize multiple posts
   */
  static normalizePosts(
    igPosts: InstagramPost[],
    metrics: InstagramMetrics[],
    accountName: string
  ): NormalizedPost[] {
    const metricsMap = new Map(metrics.map((m) => [m.postId, m]))

    return igPosts
      .map((post) => {
        const postMetrics = metricsMap.get(post.id)
        if (!postMetrics) {
          logger.warn('Metrics not found for post', { postId: post.id })
          return null
        }

        return this.normalizePost(post, postMetrics, accountName)
      })
      .filter((post): post is NormalizedPost => post !== null)
  }

  /**
   * Determine post status based on post data
   */
  private static determinePostStatus(post: InstagramPost): 'Publicado' | 'Agendado' | 'Rascunho' {
    // Instagram API only returns published posts
    // Scheduled and draft posts are not available through the API
    return 'Publicado'
  }

  /**
   * Extract metrics from normalized post
   */
  static extractMetrics(post: NormalizedPost): InstagramMetrics {
    return {
      postId: post.instagramPostId,
      alcance: post.metrics.alcance,
      engajamento: post.metrics.engajamento,
      impressoes: post.metrics.impressoes,
      cliques: post.metrics.cliques,
      likes: post.metrics.likes,
      comments: post.metrics.comments,
      retrievedAt: new Date().toISOString(),
    }
  }

  /**
   * Merge normalized posts with existing data
   */
  static mergePosts(
    newPosts: NormalizedPost[],
    existingPosts: NormalizedPost[]
  ): NormalizedPost[] {
    const existingMap = new Map(existingPosts.map((p) => [p.instagramPostId, p]))

    const merged: NormalizedPost[] = []

    // Add new posts
    for (const post of newPosts) {
      merged.push(post)
    }

    // Add existing posts that are not in new posts
    for (const post of existingPosts) {
      if (!newPosts.some((p) => p.instagramPostId === post.instagramPostId)) {
        merged.push(post)
      }
    }

    // Sort by published date (newest first)
    merged.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return dateB - dateA
    })

    return merged
  }

  /**
   * Filter posts by date range
   */
  static filterPostsByDateRange(
    posts: NormalizedPost[],
    startDate: Date,
    endDate: Date
  ): NormalizedPost[] {
    return posts.filter((post) => {
      if (!post.publishedAt) return false

      const postDate = new Date(post.publishedAt)
      return postDate >= startDate && postDate <= endDate
    })
  }

  /**
   * Sort posts by metrics
   */
  static sortPostsByMetric(
    posts: NormalizedPost[],
    metric: keyof NormalizedPost['metrics'],
    ascending: boolean = false
  ): NormalizedPost[] {
    return [...posts].sort((a, b) => {
      const valueA = a.metrics[metric]
      const valueB = b.metrics[metric]

      if (ascending) {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    })
  }

  /**
   * Calculate aggregate metrics
   */
  static calculateAggregateMetrics(posts: NormalizedPost[]): InstagramMetrics {
    const aggregate: InstagramMetrics = {
      postId: 'aggregate',
      alcance: 0,
      engajamento: 0,
      impressoes: 0,
      cliques: 0,
      likes: 0,
      comments: 0,
      retrievedAt: new Date().toISOString(),
    }

    for (const post of posts) {
      aggregate.alcance += post.metrics.alcance
      aggregate.engajamento += post.metrics.engajamento
      aggregate.impressoes += post.metrics.impressoes
      aggregate.cliques += post.metrics.cliques
      aggregate.likes += post.metrics.likes
      aggregate.comments += post.metrics.comments
    }

    return aggregate
  }

  /**
   * Calculate average metrics
   */
  static calculateAverageMetrics(posts: NormalizedPost[]): InstagramMetrics {
    if (posts.length === 0) {
      return {
        postId: 'average',
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
        likes: 0,
        comments: 0,
        retrievedAt: new Date().toISOString(),
      }
    }

    const aggregate = this.calculateAggregateMetrics(posts)

    return {
      postId: 'average',
      alcance: Math.round(aggregate.alcance / posts.length),
      engajamento: Math.round(aggregate.engajamento / posts.length),
      impressoes: Math.round(aggregate.impressoes / posts.length),
      cliques: Math.round(aggregate.cliques / posts.length),
      likes: Math.round(aggregate.likes / posts.length),
      comments: Math.round(aggregate.comments / posts.length),
      retrievedAt: new Date().toISOString(),
    }
  }
}
