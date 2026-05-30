/**
 * Tests for Post to ClickUp Mapper
 * Validates: Requirements 6.1, 6.2, 6.3, 7.1
 */

import { PostClickUpMapper } from '../post-clickup-mapper'
import { NormalizedPost, InstagramMetrics, ClickUpTaskData } from '@/lib/types/instagram.types'

describe('PostClickUpMapper', () => {
  const mockNormalizedPost: NormalizedPost = {
    id: 'instagram-123',
    title: 'Test Post Caption',
    imageUrl: 'https://example.com/image.jpg',
    status: 'Publicado',
    metrics: {
      alcance: 1000,
      engajamento: 150,
      impressoes: 2000,
      cliques: 50,
      likes: 100,
      comments: 50,
    },
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    instagramAccountName: 'Test Account',
    instagramPostId: '123',
    instagramPermalink: 'https://instagram.com/p/123',
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

  describe('mapToClickUpTask', () => {
    it('should map normalized post to ClickUp task format', () => {
      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, mockMetrics)

      expect(task).toBeDefined()
      expect(task.name).toBe('Test Post Caption')
      expect(task.status).toBe('Publicado')
      expect(task.custom_fields).toBeDefined()
    })

    it('should include all metrics in custom fields', () => {
      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, mockMetrics)

      expect(task.custom_fields.Alcance).toBe(1000)
      expect(task.custom_fields.Engajamento).toBe(150)
      expect(task.custom_fields.Impressões).toBe(2000)
      expect(task.custom_fields.Cliques).toBe(50)
      expect(task.custom_fields.Likes).toBe(100)
      expect(task.custom_fields.Comments).toBe(50)
    })

    it('should include Instagram identifiers in custom fields', () => {
      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, mockMetrics)

      expect(task.custom_fields.Instagram_Post_ID).toBe('123')
      expect(task.custom_fields.Instagram_Account_Name).toBe('Test Account')
      expect(task.custom_fields.Instagram_Permalink).toBe('https://instagram.com/p/123')
    })

    it('should include Instagram permalink in description', () => {
      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, mockMetrics)

      expect(task.description).toContain('https://instagram.com/p/123')
      expect(task.description).toContain('Test Account')
    })

    it('should handle posts with empty caption', () => {
      const postWithoutCaption = {
        ...mockNormalizedPost,
        title: '',
      }

      const task = PostClickUpMapper.mapToClickUpTask(postWithoutCaption, mockMetrics)

      expect(task.name).toBe('')
      expect(task.description).toBeDefined()
    })

    it('should handle posts without image URL', () => {
      const postWithoutImage = {
        ...mockNormalizedPost,
        imageUrl: null,
      }

      const task = PostClickUpMapper.mapToClickUpTask(postWithoutImage, mockMetrics)

      expect(task).toBeDefined()
      expect(task.description).not.toContain('View Media')
    })

    it('should handle zero metrics', () => {
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

      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, zeroMetrics)

      expect(task.custom_fields.Alcance).toBe(0)
      expect(task.custom_fields.Engajamento).toBe(0)
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

      const task = PostClickUpMapper.mapToClickUpTask(mockNormalizedPost, largeMetrics)

      expect(task.custom_fields.Alcance).toBe(1000000)
      expect(task.custom_fields.Engajamento).toBe(500000)
    })
  })

  describe('extractMetricsFromTask', () => {
    it('should extract metrics from ClickUp task', () => {
      const task = {
        custom_fields: [
          { id: 'Alcance', value: 1000 },
          { id: 'Engajamento', value: 150 },
          { id: 'Impressões', value: 2000 },
          { id: 'Cliques', value: 50 },
          { id: 'Likes', value: 100 },
          { id: 'Comments', value: 50 },
        ],
      }

      const metrics = PostClickUpMapper.extractMetricsFromTask(task)

      expect(metrics.alcance).toBe(1000)
      expect(metrics.engajamento).toBe(150)
      expect(metrics.impressoes).toBe(2000)
      expect(metrics.cliques).toBe(50)
      expect(metrics.likes).toBe(100)
      expect(metrics.comments).toBe(50)
    })

    it('should handle missing custom fields', () => {
      const task = {
        custom_fields: [{ id: 'Alcance', value: 1000 }],
      }

      const metrics = PostClickUpMapper.extractMetricsFromTask(task)

      expect(metrics.alcance).toBe(1000)
      expect(metrics.engajamento).toBeUndefined()
    })

    it('should handle null custom fields', () => {
      const task = {
        custom_fields: null,
      }

      const metrics = PostClickUpMapper.extractMetricsFromTask(task)

      expect(metrics).toEqual({})
    })

    it('should handle undefined custom fields', () => {
      const task = {}

      const metrics = PostClickUpMapper.extractMetricsFromTask(task)

      expect(metrics).toEqual({})
    })

    it('should use default value 0 for missing metrics', () => {
      const task = {
        custom_fields: [
          { id: 'Alcance', value: null },
          { id: 'Engajamento', value: undefined },
        ],
      }

      const metrics = PostClickUpMapper.extractMetricsFromTask(task)

      expect(metrics.alcance).toBe(0)
      expect(metrics.engajamento).toBe(0)
    })
  })

  describe('shouldUpdateMetrics', () => {
    it('should return true when metrics have changed', () => {
      const oldMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const newMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1100,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const shouldUpdate = PostClickUpMapper.shouldUpdateMetrics(oldMetrics, newMetrics)

      expect(shouldUpdate).toBe(true)
    })

    it('should return false when metrics have not changed', () => {
      const oldMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const newMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const shouldUpdate = PostClickUpMapper.shouldUpdateMetrics(oldMetrics, newMetrics)

      expect(shouldUpdate).toBe(false)
    })

    it('should detect changes in any metric', () => {
      const oldMetrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const metricsToTest = [
        { ...oldMetrics, alcance: 1001 },
        { ...oldMetrics, engajamento: 151 },
        { ...oldMetrics, impressoes: 2001 },
        { ...oldMetrics, cliques: 51 },
        { ...oldMetrics, likes: 101 },
        { ...oldMetrics, comments: 51 },
      ]

      metricsToTest.forEach((newMetrics) => {
        const shouldUpdate = PostClickUpMapper.shouldUpdateMetrics(oldMetrics, newMetrics)
        expect(shouldUpdate).toBe(true)
      })
    })
  })

  describe('extractInstagramPostId', () => {
    it('should extract Instagram post ID from task', () => {
      const task = {
        custom_fields: [{ id: 'Instagram_Post_ID', value: '123' }],
      }

      const postId = PostClickUpMapper.extractInstagramPostId(task)

      expect(postId).toBe('123')
    })

    it('should return null if Instagram_Post_ID not found', () => {
      const task = {
        custom_fields: [{ id: 'Alcance', value: 1000 }],
      }

      const postId = PostClickUpMapper.extractInstagramPostId(task)

      expect(postId).toBeNull()
    })

    it('should return null if custom_fields is null', () => {
      const task = {
        custom_fields: null,
      }

      const postId = PostClickUpMapper.extractInstagramPostId(task)

      expect(postId).toBeNull()
    })
  })

  describe('extractInstagramAccountName', () => {
    it('should extract Instagram account name from task', () => {
      const task = {
        custom_fields: [{ id: 'Instagram_Account_Name', value: 'Test Account' }],
      }

      const accountName = PostClickUpMapper.extractInstagramAccountName(task)

      expect(accountName).toBe('Test Account')
    })

    it('should return null if Instagram_Account_Name not found', () => {
      const task = {
        custom_fields: [{ id: 'Alcance', value: 1000 }],
      }

      const accountName = PostClickUpMapper.extractInstagramAccountName(task)

      expect(accountName).toBeNull()
    })
  })

  describe('extractInstagramPermalink', () => {
    it('should extract Instagram permalink from task', () => {
      const task = {
        custom_fields: [{ id: 'Instagram_Permalink', value: 'https://instagram.com/p/123' }],
      }

      const permalink = PostClickUpMapper.extractInstagramPermalink(task)

      expect(permalink).toBe('https://instagram.com/p/123')
    })

    it('should return null if Instagram_Permalink not found', () => {
      const task = {
        custom_fields: [{ id: 'Alcance', value: 1000 }],
      }

      const permalink = PostClickUpMapper.extractInstagramPermalink(task)

      expect(permalink).toBeNull()
    })
  })

  describe('buildCustomFieldsUpdate', () => {
    it('should build custom fields update payload', () => {
      const metrics: InstagramMetrics = {
        postId: '123',
        alcance: 1000,
        engajamento: 150,
        impressoes: 2000,
        cliques: 50,
        likes: 100,
        comments: 50,
        retrievedAt: new Date().toISOString(),
      }

      const update = PostClickUpMapper.buildCustomFieldsUpdate(metrics)

      expect(update).toHaveLength(6)
      expect(update[0]).toEqual({ id: 'Alcance', value: 1000 })
      expect(update[1]).toEqual({ id: 'Engajamento', value: 150 })
      expect(update[2]).toEqual({ id: 'Impressões', value: 2000 })
      expect(update[3]).toEqual({ id: 'Cliques', value: 50 })
      expect(update[4]).toEqual({ id: 'Likes', value: 100 })
      expect(update[5]).toEqual({ id: 'Comments', value: 50 })
    })

    it('should handle zero metrics in update payload', () => {
      const metrics: InstagramMetrics = {
        postId: '123',
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
        likes: 0,
        comments: 0,
        retrievedAt: new Date().toISOString(),
      }

      const update = PostClickUpMapper.buildCustomFieldsUpdate(metrics)

      expect(update.every((field) => field.value === 0)).toBe(true)
    })
  })

  describe('mapPostsToClickUpTasks', () => {
    it('should map multiple posts to ClickUp tasks', () => {
      const posts: NormalizedPost[] = [
        mockNormalizedPost,
        {
          ...mockNormalizedPost,
          id: 'instagram-456',
          instagramPostId: '456',
          title: 'Second Post',
        },
      ]

      const metricsMap = new Map([
        ['123', mockMetrics],
        [
          '456',
          {
            ...mockMetrics,
            postId: '456',
          },
        ],
      ])

      const tasks = PostClickUpMapper.mapPostsToClickUpTasks(posts, metricsMap)

      expect(tasks).toHaveLength(2)
      expect(tasks[0].name).toBe('Test Post Caption')
      expect(tasks[1].name).toBe('Second Post')
    })

    it('should skip posts without metrics', () => {
      const posts: NormalizedPost[] = [
        mockNormalizedPost,
        {
          ...mockNormalizedPost,
          id: 'instagram-456',
          instagramPostId: '456',
          title: 'Second Post',
        },
      ]

      const metricsMap = new Map([['123', mockMetrics]])

      const tasks = PostClickUpMapper.mapPostsToClickUpTasks(posts, metricsMap)

      expect(tasks).toHaveLength(1)
      expect(tasks[0].name).toBe('Test Post Caption')
    })

    it('should handle empty posts array', () => {
      const tasks = PostClickUpMapper.mapPostsToClickUpTasks([], new Map())

      expect(tasks).toHaveLength(0)
    })
  })
})
