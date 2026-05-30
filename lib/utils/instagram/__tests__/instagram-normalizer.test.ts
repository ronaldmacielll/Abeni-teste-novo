/**
 * Tests for Instagram Normalizer
 * Validates: Requirements 3.1, 4.1, 4.2, 15.1
 */

import { InstagramNormalizer } from '../instagram-normalizer'
import { InstagramPost, InstagramMetrics, NormalizedPost } from '@/lib/types/instagram.types'

describe('InstagramNormalizer', () => {
  const mockInstagramPost: InstagramPost = {
    id: '123',
    caption: 'This is a test post caption',
    mediaType: 'IMAGE',
    mediaUrl: 'https://example.com/image.jpg',
    timestamp: new Date().toISOString(),
    permalink: 'https://instagram.com/p/123',
    publishedAt: new Date().toISOString(),
  }

  const mockMetrics: InstagramMetrics = {
    postId: '123',
    alcance: 1000,
    engajamento: 150,
    impressoes: 2000,
    cliques: 50,
    likes: 100,
    comments: 50,
    retrievedAt: new Date().toISOString(),
  }

  describe('normalizePost', () => {
    it('should normalize Instagram post to ALUA format', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      expect(normalized).toBeDefined()
      expect(normalized.id).toBe('instagram-123')
      expect(normalized.title).toBe('This is a test post caption')
      expect(normalized.status).toBe('Publicado')
      expect(normalized.instagramAccountName).toBe('Test Account')
      expect(normalized.instagramPostId).toBe('123')
    })

    it('should include all metrics in normalized post', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      expect(normalized.metrics.alcance).toBe(1000)
      expect(normalized.metrics.engajamento).toBe(150)
      expect(normalized.metrics.impressoes).toBe(2000)
      expect(normalized.metrics.cliques).toBe(50)
      expect(normalized.metrics.likes).toBe(100)
      expect(normalized.metrics.comments).toBe(50)
    })

    it('should truncate long captions to 100 characters', () => {
      const longCaption = 'a'.repeat(150)
      const post = {
        ...mockInstagramPost,
        caption: longCaption,
      }

      const normalized = InstagramNormalizer.normalizePost(post, mockMetrics, 'Test Account')

      expect(normalized.title).toHaveLength(100)
      expect(normalized.title).toBe('a'.repeat(100))
    })

    it('should use default title for empty caption', () => {
      const post = {
        ...mockInstagramPost,
        caption: '',
      }

      const normalized = InstagramNormalizer.normalizePost(post, mockMetrics, 'Test Account')

      expect(normalized.title).toBe('Instagram Post')
    })

    it('should preserve Instagram permalink', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      expect(normalized.instagramPermalink).toBe('https://instagram.com/p/123')
    })

    it('should preserve media URL', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      expect(normalized.imageUrl).toBe('https://example.com/image.jpg')
    })

    it('should handle null media URL', () => {
      const post = {
        ...mockInstagramPost,
        mediaUrl: null,
      }

      const normalized = InstagramNormalizer.normalizePost(post, mockMetrics, 'Test Account')

      expect(normalized.imageUrl).toBeNull()
    })

    it('should set status to Publicado for all posts', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      expect(normalized.status).toBe('Publicado')
    })

    it('should handle metrics with zero values', () => {
      const zeroMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
        likes: 0,
        comments: 0,
        retrievedAt: new Date().toISOString(),
      }

      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, zeroMetrics, 'Test Account')

      expect(normalized.metrics.alcance).toBe(0)
      expect(normalized.metrics.engajamento).toBe(0)
    })

    it('should handle large metric values', () => {
      const largeMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000000,
        engajamento: 500000,
        impressoes: 2000000,
        cliques: 100000,
        likes: 400000,
        comments: 100000,
        retrievedAt: new Date().toISOString(),
      }

      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, largeMetrics, 'Test Account')

      expect(normalized.metrics.alcance).toBe(1000000)
      expect(normalized.metrics.engajamento).toBe(500000)
    })

    it('should preserve timestamps', () => {
      const now = new Date()
      const post = {
        ...mockInstagramPost,
        timestamp: now.toISOString(),
        publishedAt: now.toISOString(),
      }

      const normalized = InstagramNormalizer.normalizePost(post, mockMetrics, 'Test Account')

      expect(normalized.createdAt).toBe(now.toISOString())
      expect(normalized.publishedAt).toBe(now.toISOString())
    })
  })

  describe('validateMetrics', () => {
    it('should validate correct metrics', () => {
      const result = InstagramNormalizer.validateMetrics(mockMetrics)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect negative metrics', () => {
      const invalidMetrics: InstagramMetrics = {
        postId: '123',
        alcance: -100,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const result = InstagramNormalizer.validateMetrics(invalidMetrics)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect inconsistent metrics', () => {
      const inconsistentMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 100, // Less than engagement
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const result = InstagramNormalizer.validateMetrics(inconsistentMetrics)

      expect(result.valid).toBe(false)
    })

    it('should detect likes greater than engagement', () => {
      const invalidMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 50,
        impressoes: 2000,
        cliques: 50,
        likes: 100, // Greater than engagement
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const result = InstagramNormalizer.validateMetrics(invalidMetrics)

      expect(result.valid).toBe(false)
    })

    it('should detect comments greater than engagement', () => {
      const invalidMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 50,
        impressoes: 2000,
        cliques: 50,
        likes: 30,
        comments: 100, // Greater than engagement
        retrievedAt: new Date().toISOString(),
      }

      const result = InstagramNormalizer.validateMetrics(invalidMetrics)

      expect(result.valid).toBe(false)
    })
  })

  describe('ensureMetricsConsistency', () => {
    it('should return consistent metrics unchanged', () => {
      const consistent = InstagramNormalizer.ensureMetricsConsistency(mockMetrics)

      expect(consistent.alcance).toBe(mockMetrics.alcance)
      expect(consistent.engajamento).toBe(mockMetrics.engajamento)
      expect(consistent.impressoes).toBe(mockMetrics.impressoes)
    })

    it('should fix likes greater than engagement', () => {
      const inconsistent: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 50,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 30,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = InstagramNormalizer.ensureMetricsConsistency(inconsistent)

      expect(consistent.likes).toBeLessThanOrEqual(consistent.engajamento)
    })

    it('should fix comments greater than engagement', () => {
      const inconsistent: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 50,
        impressoes: 2000,
        cliques: 50,
        likes: 30,
        comments: 100,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = InstagramNormalizer.ensureMetricsConsistency(inconsistent)

      expect(consistent.comments).toBeLessThanOrEqual(consistent.engajamento)
    })

    it('should fix engagement greater than impressions', () => {
      const inconsistent: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 3000,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = InstagramNormalizer.ensureMetricsConsistency(inconsistent)

      expect(consistent.engajamento).toBeLessThanOrEqual(consistent.impressoes)
    })

    it('should handle negative metrics (validation should catch these)', () => {
      const inconsistent: InstagramMetrics = {
        postId: '123',
        alcance: -100,
        engajamento: -50,
        impressoes: -200,
        cliques: -30,
        likes: -40,
        comments: -10,
        retrievedAt: new Date().toISOString(),
      }

      // ensureMetricsConsistency adjusts values to maintain relationships
      // likes (-40) > engagement (-50), so engagement becomes -40
      // comments (-10) > engagement (-40), so engagement becomes -10
      // engagement (-10) > impressions (-200), so impressions becomes -10
      const consistent = InstagramNormalizer.ensureMetricsConsistency(inconsistent)

      expect(consistent.engajamento).toBe(-10)
      expect(consistent.impressoes).toBe(-10)
    })
  })

  describe('normalizePosts', () => {
    it('should normalize multiple posts', () => {
      const posts: InstagramPost[] = [
        mockInstagramPost,
        {
          ...mockInstagramPost,
          id: '456',
          caption: 'Second post',
        },
      ]

      const metrics: InstagramMetrics[] = [
        mockMetrics,
        {
          ...mockMetrics,
          postId: '456',
        },
      ]

      const normalized = InstagramNormalizer.normalizePosts(posts, metrics, 'Test Account')

      expect(normalized).toHaveLength(2)
      expect(normalized[0].instagramPostId).toBe('123')
      expect(normalized[1].instagramPostId).toBe('456')
    })

    it('should skip posts without metrics', () => {
      const posts: InstagramPost[] = [
        mockInstagramPost,
        {
          ...mockInstagramPost,
          id: '456',
          caption: 'Second post',
        },
      ]

      const metrics: InstagramMetrics[] = [mockMetrics]

      const normalized = InstagramNormalizer.normalizePosts(posts, metrics, 'Test Account')

      expect(normalized).toHaveLength(1)
      expect(normalized[0].instagramPostId).toBe('123')
    })

    it('should handle empty posts array', () => {
      const normalized = InstagramNormalizer.normalizePosts([], [], 'Test Account')

      expect(normalized).toHaveLength(0)
    })
  })

  describe('extractMetrics', () => {
    it('should extract metrics from normalized post', () => {
      const normalized = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const extracted = InstagramNormalizer.extractMetrics(normalized)

      expect(extracted.postId).toBe('123')
      expect(extracted.alcance).toBe(1000)
      expect(extracted.engajamento).toBe(150)
      expect(extracted.impressoes).toBe(2000)
    })
  })

  describe('mergePosts', () => {
    it('should merge new and existing posts', () => {
      const newPosts: NormalizedPost[] = [
        InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account'),
      ]

      const existingPosts: NormalizedPost[] = [
        InstagramNormalizer.normalizePost(
          {
            ...mockInstagramPost,
            id: '456',
            caption: 'Old post',
          },
          {
            ...mockMetrics,
            postId: '456',
          },
          'Test Account'
        ),
      ]

      const merged = InstagramNormalizer.mergePosts(newPosts, existingPosts)

      expect(merged).toHaveLength(2)
    })

    it('should not duplicate posts', () => {
      const post = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const merged = InstagramNormalizer.mergePosts([post], [post])

      expect(merged).toHaveLength(1)
    })

    it('should sort by published date (newest first)', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const newPost = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          publishedAt: now.toISOString(),
        },
        mockMetrics,
        'Test Account'
      )

      const oldPost = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
          publishedAt: yesterday.toISOString(),
        },
        {
          ...mockMetrics,
          postId: '456',
        },
        'Test Account'
      )

      const merged = InstagramNormalizer.mergePosts([oldPost], [newPost])

      expect(merged[0].instagramPostId).toBe('123') // Newest first
      expect(merged[1].instagramPostId).toBe('456')
    })
  })

  describe('filterPostsByDateRange', () => {
    it('should filter posts by date range', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const post = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const filtered = InstagramNormalizer.filterPostsByDateRange([post], yesterday, tomorrow)

      expect(filtered).toHaveLength(1)
    })

    it('should exclude posts outside date range', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

      const post = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          publishedAt: twoDaysAgo.toISOString(),
        },
        mockMetrics,
        'Test Account'
      )

      const filtered = InstagramNormalizer.filterPostsByDateRange([post], yesterday, now)

      expect(filtered).toHaveLength(0)
    })

    it('should handle posts without publishedAt', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const post = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          publishedAt: undefined as any,
        },
        mockMetrics,
        'Test Account'
      )

      const filtered = InstagramNormalizer.filterPostsByDateRange([post], yesterday, now)

      expect(filtered).toHaveLength(0)
    })
  })

  describe('sortPostsByMetric', () => {
    it('should sort posts by metric descending', () => {
      const post1 = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const post2 = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
        },
        {
          ...mockMetrics,
          postId: '456',
          alcance: 2000,
        },
        'Test Account'
      )

      const sorted = InstagramNormalizer.sortPostsByMetric([post1, post2], 'alcance', false)

      expect(sorted[0].metrics.alcance).toBe(2000)
      expect(sorted[1].metrics.alcance).toBe(1000)
    })

    it('should sort posts by metric ascending', () => {
      const post1 = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const post2 = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
        },
        {
          ...mockMetrics,
          postId: '456',
          alcance: 2000,
        },
        'Test Account'
      )

      const sorted = InstagramNormalizer.sortPostsByMetric([post1, post2], 'alcance', true)

      expect(sorted[0].metrics.alcance).toBe(1000)
      expect(sorted[1].metrics.alcance).toBe(2000)
    })
  })

  describe('calculateAggregateMetrics', () => {
    it('should calculate aggregate metrics', () => {
      const post1 = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const post2 = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
        },
        {
          ...mockMetrics,
          postId: '456',
          alcance: 500,
          engajamento: 100,
        },
        'Test Account'
      )

      const aggregate = InstagramNormalizer.calculateAggregateMetrics([post1, post2])

      expect(aggregate.alcance).toBe(1500)
      expect(aggregate.engajamento).toBe(250)
    })

    it('should handle empty posts array', () => {
      const aggregate = InstagramNormalizer.calculateAggregateMetrics([])

      expect(aggregate.alcance).toBe(0)
      expect(aggregate.engajamento).toBe(0)
    })
  })

  describe('calculateAverageMetrics', () => {
    it('should calculate average metrics', () => {
      const post1 = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const post2 = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
        },
        {
          ...mockMetrics,
          postId: '456',
          alcance: 500,
          engajamento: 100,
        },
        'Test Account'
      )

      const average = InstagramNormalizer.calculateAverageMetrics([post1, post2])

      expect(average.alcance).toBe(750)
      expect(average.engajamento).toBe(125)
    })

    it('should handle empty posts array', () => {
      const average = InstagramNormalizer.calculateAverageMetrics([])

      expect(average.alcance).toBe(0)
      expect(average.engajamento).toBe(0)
    })

    it('should round average values', () => {
      const post1 = InstagramNormalizer.normalizePost(mockInstagramPost, mockMetrics, 'Test Account')

      const post2 = InstagramNormalizer.normalizePost(
        {
          ...mockInstagramPost,
          id: '456',
        },
        {
          ...mockMetrics,
          postId: '456',
          alcance: 501,
        },
        'Test Account'
      )

      const average = InstagramNormalizer.calculateAverageMetrics([post1, post2])

      expect(average.alcance).toBe(751) // (1000 + 501) / 2 = 750.5, rounded to 751
    })
  })
})
