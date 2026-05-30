/**
 * Property-Based Tests for Instagram Normalizer
 * Validates: Requirements 3.1, 4.1, 4.2, 15.1
 */

import fc from 'fast-check'
import { InstagramNormalizer } from '../instagram-normalizer'
import { InstagramPost, InstagramMetrics } from '@/lib/types/instagram.types'

describe('InstagramNormalizer - Property Tests', () => {
  // Arbitraries for generating test data
  const instagramPostArbitrary = fc.record({
    id: fc.hexaString({ minLength: 1, maxLength: 20 }),
    caption: fc.string({ maxLength: 500 }),
    mediaType: fc.constantFrom('IMAGE' as const, 'VIDEO' as const, 'CAROUSEL' as const),
    mediaUrl: fc.option(fc.webUrl()),
    timestamp: fc.date().map((d) => d.toISOString()),
    permalink: fc.webUrl(),
    publishedAt: fc.date().map((d) => d.toISOString()),
  })

  const metricsArbitrary = fc.record({
    postId: fc.hexaString({ minLength: 1, maxLength: 20 }),
    alcance: fc.integer({ min: 0, max: 1000000 }),
    engajamento: fc.integer({ min: 0, max: 100000 }),
    impressoes: fc.integer({ min: 0, max: 1000000 }),
    cliques: fc.integer({ min: 0, max: 100000 }),
    likes: fc.integer({ min: 0, max: 100000 }),
    comments: fc.integer({ min: 0, max: 10000 }),
    retrievedAt: fc.date().map((d) => d.toISOString()),
  })

  describe('Property 1: Post Normalization Completeness', () => {
    it('should normalize all required fields', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          // All required fields must be present
          expect(normalized.id).toBeDefined()
          expect(normalized.title).toBeDefined()
          expect(normalized.status).toBeDefined()
          expect(normalized.metrics).toBeDefined()
          expect(normalized.createdAt).toBeDefined()
          expect(normalized.instagramAccountName).toBeDefined()
          expect(normalized.instagramPostId).toBeDefined()
          expect(normalized.instagramPermalink).toBeDefined()
        })
      )
    })

    it('should preserve Instagram post ID', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.instagramPostId).toBe(post.id)
        })
      )
    })

    it('should preserve Instagram permalink', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.instagramPermalink).toBe(post.permalink)
        })
      )
    })

    it('should set status to Publicado', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.status).toBe('Publicado')
        })
      )
    })

    it('should use caption as title (truncated to 100 chars)', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          if (post.caption) {
            expect(normalized.title).toBe(post.caption.substring(0, 100))
          }
        })
      )
    })
  })

  describe('Property 2: Metrics Consistency', () => {
    it('should ensure likes <= engagement', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.metrics.likes).toBeLessThanOrEqual(normalized.metrics.engajamento)
        })
      )
    })

    it('should ensure comments <= engagement', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.metrics.comments).toBeLessThanOrEqual(normalized.metrics.engajamento)
        })
      )
    })

    it('should ensure engagement <= impressions', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.metrics.engajamento).toBeLessThanOrEqual(normalized.metrics.impressoes)
        })
      )
    })

    it('should ensure all metrics are non-negative', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized.metrics.alcance).toBeGreaterThanOrEqual(0)
          expect(normalized.metrics.engajamento).toBeGreaterThanOrEqual(0)
          expect(normalized.metrics.impressoes).toBeGreaterThanOrEqual(0)
          expect(normalized.metrics.cliques).toBeGreaterThanOrEqual(0)
          expect(normalized.metrics.likes).toBeGreaterThanOrEqual(0)
          expect(normalized.metrics.comments).toBeGreaterThanOrEqual(0)
        })
      )
    })

    it('should preserve metric values when valid', () => {
      fc.assert(
        fc.property(
          instagramPostArbitrary,
          fc.record({
            postId: fc.hexaString({ minLength: 1, maxLength: 20 }),
            alcance: fc.integer({ min: 0, max: 100000 }),
            engajamento: fc.integer({ min: 0, max: 10000 }),
            impressoes: fc.integer({ min: 0, max: 100000 }),
            cliques: fc.integer({ min: 0, max: 10000 }),
            likes: fc.integer({ min: 0, max: 5000 }),
            comments: fc.integer({ min: 0, max: 1000 }),
            retrievedAt: fc.date().map((d) => d.toISOString()),
          }),
          fc.string(),
          (post, metrics, accountName) => {
            // Ensure metrics are consistent
            const consistentMetrics = {
              ...metrics,
              likes: Math.min(metrics.likes, metrics.engajamento),
              comments: Math.min(metrics.comments, metrics.engajamento),
              engajamento: Math.min(metrics.engajamento, metrics.impressoes),
            }

            const normalized = InstagramNormalizer.normalizePost(
              post as InstagramPost,
              consistentMetrics as InstagramMetrics,
              accountName
            )

            expect(normalized.metrics.alcance).toBe(consistentMetrics.alcance)
            expect(normalized.metrics.impressoes).toBe(consistentMetrics.impressoes)
          }
        )
      )
    })
  })

  describe('Property 3: Normalization Idempotence', () => {
    it('should produce consistent results for same input', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized1 = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          const normalized2 = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          expect(normalized1).toEqual(normalized2)
        })
      )
    })
  })

  describe('Property 4: Metrics Extraction', () => {
    it('should extract metrics correctly from normalized post', () => {
      fc.assert(
        fc.property(instagramPostArbitrary, metricsArbitrary, fc.string(), (post, metrics, accountName) => {
          const normalized = InstagramNormalizer.normalizePost(
            post as InstagramPost,
            metrics as InstagramMetrics,
            accountName
          )

          const extracted = InstagramNormalizer.extractMetrics(normalized)

          expect(extracted.postId).toBe(normalized.instagramPostId)
          expect(extracted.alcance).toBe(normalized.metrics.alcance)
          expect(extracted.engajamento).toBe(normalized.metrics.engajamento)
          expect(extracted.impressoes).toBe(normalized.metrics.impressoes)
          expect(extracted.cliques).toBe(normalized.metrics.cliques)
          expect(extracted.likes).toBe(normalized.metrics.likes)
          expect(extracted.comments).toBe(normalized.metrics.comments)
        })
      )
    })
  })

  describe('Property 5: Batch Normalization', () => {
    it('should normalize all posts in batch', () => {
      fc.assert(
        fc.property(
          fc.array(instagramPostArbitrary, { minLength: 1, maxLength: 10 }),
          fc.array(metricsArbitrary, { minLength: 1, maxLength: 10 }),
          fc.string(),
          (posts, metrics, accountName) => {
            const postsArray = posts as InstagramPost[]
            const metricsArray = metrics as InstagramMetrics[]

            // Ensure we have matching metrics for each post
            const metricsMap = new Map(metricsArray.map((m) => [m.postId, m]))
            const matchingMetrics = postsArray
              .map((p) => metricsMap.get(p.id))
              .filter((m): m is InstagramMetrics => m !== undefined)

            if (matchingMetrics.length === 0) return

            const normalized = InstagramNormalizer.normalizePosts(
              postsArray.slice(0, matchingMetrics.length),
              matchingMetrics,
              accountName
            )

            expect(normalized.length).toBeLessThanOrEqual(postsArray.length)
            expect(normalized.length).toBeLessThanOrEqual(matchingMetrics.length)
          }
        )
      )
    })
  })
})
