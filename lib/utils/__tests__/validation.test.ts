/**
 * Tests for Validation Utilities
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import {
  validateAccessToken,
  validateBusinessAccountId,
  validateAccountName,
  validateClickUpListId,
  validateMetricsValue,
  validateMetrics,
  ensureMetricsConsistency,
  validatePost,
  validateEmail,
  validateUrl,
} from '../validation'
import { InstagramMetrics, InstagramPost } from '@/lib/types/instagram.types'

describe('Credential Validation', () => {
  describe('validateAccessToken', () => {
    it('should accept valid access tokens', () => {
      const validToken = 'EAAB' + 'x'.repeat(100)
      expect(validateAccessToken(validToken)).toBe(true)
    })

    it('should reject short tokens', () => {
      expect(validateAccessToken('short')).toBe(false)
    })

    it('should reject empty tokens', () => {
      expect(validateAccessToken('')).toBe(false)
    })

    it('should reject non-string tokens', () => {
      expect(validateAccessToken(null as any)).toBe(false)
      expect(validateAccessToken(undefined as any)).toBe(false)
      expect(validateAccessToken(123 as any)).toBe(false)
    })
  })

  describe('validateBusinessAccountId', () => {
    it('should accept numeric account IDs', () => {
      expect(validateBusinessAccountId('123456789')).toBe(true)
    })

    it('should reject non-numeric IDs', () => {
      expect(validateBusinessAccountId('ABC123')).toBe(false)
    })

    it('should reject empty IDs', () => {
      expect(validateBusinessAccountId('')).toBe(false)
    })

    it('should reject non-string IDs', () => {
      expect(validateBusinessAccountId(123 as any)).toBe(false)
    })
  })

  describe('validateAccountName', () => {
    it('should accept valid account names', () => {
      expect(validateAccountName('My Instagram Account')).toBe(true)
    })

    it('should reject empty names', () => {
      expect(validateAccountName('')).toBe(false)
    })

    it('should reject names longer than 255 characters', () => {
      const longName = 'a'.repeat(256)
      expect(validateAccountName(longName)).toBe(false)
    })

    it('should accept names up to 255 characters', () => {
      const maxName = 'a'.repeat(255)
      expect(validateAccountName(maxName)).toBe(true)
    })

    it('should reject non-string names', () => {
      expect(validateAccountName(123 as any)).toBe(false)
    })
  })

  describe('validateClickUpListId', () => {
    it('should accept numeric list IDs', () => {
      expect(validateClickUpListId('987654321')).toBe(true)
    })

    it('should reject non-numeric IDs', () => {
      expect(validateClickUpListId('LIST-123')).toBe(false)
    })

    it('should reject empty IDs', () => {
      expect(validateClickUpListId('')).toBe(false)
    })
  })
})

describe('Metrics Validation', () => {
  describe('validateMetricsValue', () => {
    it('should accept non-negative integers', () => {
      expect(validateMetricsValue(0)).toBe(true)
      expect(validateMetricsValue(100)).toBe(true)
      expect(validateMetricsValue(999999)).toBe(true)
    })

    it('should reject negative numbers', () => {
      expect(validateMetricsValue(-1)).toBe(false)
      expect(validateMetricsValue(-100)).toBe(false)
    })

    it('should reject floating point numbers', () => {
      expect(validateMetricsValue(1.5)).toBe(false)
      expect(validateMetricsValue(0.1)).toBe(false)
    })

    it('should reject non-numbers', () => {
      expect(validateMetricsValue('100')).toBe(false)
      expect(validateMetricsValue(null)).toBe(false)
      expect(validateMetricsValue(undefined)).toBe(false)
    })
  })

  describe('validateMetrics', () => {
    const validMetrics: InstagramMetrics = {
      postId: '123',
      alcance: 100,
      engajamento: 50,
      impressoes: 200,
      cliques: 30,
      likes: 40,
      comments: 10,
      retrievedAt: new Date().toISOString(),
    }

    it('should accept valid metrics', () => {
      const result = validateMetrics(validMetrics)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject metrics with negative values', () => {
      const invalidMetrics = { ...validMetrics, alcance: -1 }
      const result = validateMetrics(invalidMetrics)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject metrics where likes > engagement', () => {
      const invalidMetrics = { ...validMetrics, likes: 100, engajamento: 50 }
      const result = validateMetrics(invalidMetrics)
      expect(result.valid).toBe(false)
    })

    it('should reject metrics where comments > engagement', () => {
      const invalidMetrics = { ...validMetrics, comments: 100, engajamento: 50 }
      const result = validateMetrics(invalidMetrics)
      expect(result.valid).toBe(false)
    })

    it('should reject metrics where engagement > impressions', () => {
      const invalidMetrics = { ...validMetrics, engajamento: 300, impressoes: 200 }
      const result = validateMetrics(invalidMetrics)
      expect(result.valid).toBe(false)
    })
  })

  describe('ensureMetricsConsistency', () => {
    it('should adjust engagement if likes > engagement', () => {
      const metrics: InstagramMetrics = {
        postId: '123',
        alcance: 100,
        engajamento: 30,
        impressoes: 200,
        cliques: 20,
        likes: 50,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = ensureMetricsConsistency(metrics)
      expect(consistent.engajamento).toBe(50)
    })

    it('should adjust engagement if comments > engagement', () => {
      const metrics: InstagramMetrics = {
        postId: '123',
        alcance: 100,
        engajamento: 30,
        impressoes: 200,
        cliques: 20,
        likes: 20,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = ensureMetricsConsistency(metrics)
      expect(consistent.engajamento).toBe(50)
    })

    it('should adjust impressions if engagement > impressions', () => {
      const metrics: InstagramMetrics = {
        postId: '123',
        alcance: 100,
        engajamento: 300,
        impressoes: 200,
        cliques: 20,
        likes: 20,
        comments: 10,
        retrievedAt: new Date().toISOString(),
      }

      const consistent = ensureMetricsConsistency(metrics)
      expect(consistent.impressoes).toBe(300)
    })
  })
})

describe('Post Validation', () => {
  const validPost: InstagramPost = {
    id: '123456',
    caption: 'Test post',
    mediaType: 'IMAGE',
    mediaUrl: 'https://example.com/image.jpg',
    timestamp: new Date().toISOString(),
    permalink: 'https://instagram.com/p/123456',
    publishedAt: new Date().toISOString(),
  }

  describe('validatePost', () => {
    it('should accept valid posts', () => {
      const result = validatePost(validPost)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject posts without ID', () => {
      const invalidPost = { ...validPost, id: '' }
      const result = validatePost(invalidPost)
      expect(result.valid).toBe(false)
    })

    it('should reject posts with invalid media type', () => {
      const invalidPost = { ...validPost, mediaType: 'INVALID' as any }
      const result = validatePost(invalidPost)
      expect(result.valid).toBe(false)
    })

    it('should reject posts with invalid timestamp', () => {
      const invalidPost = { ...validPost, timestamp: 'invalid-date' }
      const result = validatePost(invalidPost)
      expect(result.valid).toBe(false)
    })

    it('should reject posts without permalink', () => {
      const invalidPost = { ...validPost, permalink: '' }
      const result = validatePost(invalidPost)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Email Validation', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@example.co.uk')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })
})

describe('URL Validation', () => {
  it('should accept valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true)
    expect(validateUrl('http://example.com/path')).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(validateUrl('not a url')).toBe(false)
    expect(validateUrl('example.com')).toBe(false)
  })
})
