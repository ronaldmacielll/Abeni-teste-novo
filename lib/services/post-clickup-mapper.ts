/**
 * Post to ClickUp Task Mapper
 * Maps Instagram posts to ClickUp task format
 * Validates: Requirements 6.1, 6.2, 6.3, 7.1
 */

import { NormalizedPost, InstagramMetrics, ClickUpTaskData } from '@/lib/types/instagram.types'
import { logger } from '@/lib/utils/logger'

export class PostClickUpMapper {
  /**
   * Map normalized post to ClickUp task format
   * Requirement 6.1, 6.2, 6.3
   */
  static mapToClickUpTask(post: NormalizedPost, metrics: InstagramMetrics): ClickUpTaskData {
    try {
      logger.debug('Mapping post to ClickUp task', {
        postId: post.instagramPostId,
      })

      const description = this.buildTaskDescription(post)

      const task: ClickUpTaskData = {
        name: post.title,
        description,
        custom_fields: {
          Alcance: metrics.alcance,
          Engajamento: metrics.engajamento,
          Impressões: metrics.impressoes,
          Cliques: metrics.cliques,
          Likes: metrics.likes,
          Comments: metrics.comments,
          Instagram_Post_ID: post.instagramPostId,
          Instagram_Account_Name: post.instagramAccountName,
          Instagram_Permalink: post.instagramPermalink,
        },
        status: 'Publicado',
      }

      logger.debug('Post mapped to ClickUp task successfully', {
        postId: post.instagramPostId,
        taskName: task.name,
      })

      return task
    } catch (error) {
      logger.error('Failed to map post to ClickUp task', error as Error, {
        postId: post.instagramPostId,
      })
      throw error
    }
  }

  /**
   * Extract metrics from ClickUp task
   * Requirement 7.1
   */
  static extractMetricsFromTask(task: any): Partial<InstagramMetrics> {
    try {
      const metrics: Partial<InstagramMetrics> = {}

      // Extract custom fields
      if (task.custom_fields) {
        for (const field of task.custom_fields) {
          switch (field.id) {
            case 'Alcance':
              metrics.alcance = field.value || 0
              break
            case 'Engajamento':
              metrics.engajamento = field.value || 0
              break
            case 'Impressões':
              metrics.impressoes = field.value || 0
              break
            case 'Cliques':
              metrics.cliques = field.value || 0
              break
            case 'Likes':
              metrics.likes = field.value || 0
              break
            case 'Comments':
              metrics.comments = field.value || 0
              break
          }
        }
      }

      return metrics
    } catch (error) {
      logger.error('Failed to extract metrics from task', error as Error)
      throw error
    }
  }

  /**
   * Determine if metrics should be updated
   * Requirement 7.1
   */
  static shouldUpdateMetrics(oldMetrics: InstagramMetrics, newMetrics: InstagramMetrics): boolean {
    // Update if any metric has changed
    return (
      oldMetrics.alcance !== newMetrics.alcance ||
      oldMetrics.engajamento !== newMetrics.engajamento ||
      oldMetrics.impressoes !== newMetrics.impressoes ||
      oldMetrics.cliques !== newMetrics.cliques ||
      oldMetrics.likes !== newMetrics.likes ||
      oldMetrics.comments !== newMetrics.comments
    )
  }

  /**
   * Build task description from post
   */
  private static buildTaskDescription(post: NormalizedPost): string {
    const lines: string[] = []

    // Add full caption
    if (post.title) {
      lines.push(`**Caption:**\n${post.title}`)
    }

    // Add Instagram link
    lines.push(`\n**Instagram Post:**\n[View on Instagram](${post.instagramPermalink})`)

    // Add account info
    lines.push(`\n**Account:** ${post.instagramAccountName}`)

    // Add post date
    if (post.publishedAt) {
      const date = new Date(post.publishedAt)
      lines.push(`\n**Published:** ${date.toLocaleString()}`)
    }

    // Add metrics summary
    lines.push(`\n**Metrics:**`)
    lines.push(`- Alcance: ${post.metrics.alcance}`)
    lines.push(`- Engajamento: ${post.metrics.engajamento}`)
    lines.push(`- Impressões: ${post.metrics.impressoes}`)
    lines.push(`- Cliques: ${post.metrics.cliques}`)
    lines.push(`- Likes: ${post.metrics.likes}`)
    lines.push(`- Comments: ${post.metrics.comments}`)

    // Add media info
    if (post.imageUrl) {
      lines.push(`\n**Media:** [View Media](${post.imageUrl})`)
    }

    return lines.join('\n')
  }

  /**
   * Map multiple posts to ClickUp tasks
   */
  static mapPostsToClickUpTasks(
    posts: NormalizedPost[],
    metrics: Map<string, InstagramMetrics>
  ): ClickUpTaskData[] {
    return posts
      .map((post) => {
        const postMetrics = metrics.get(post.instagramPostId)
        if (!postMetrics) {
          logger.warn('Metrics not found for post', { postId: post.instagramPostId })
          return null
        }

        return this.mapToClickUpTask(post, postMetrics)
      })
      .filter((task): task is ClickUpTaskData => task !== null)
  }

  /**
   * Extract Instagram post ID from ClickUp task
   */
  static extractInstagramPostId(task: any): string | null {
    try {
      if (task.custom_fields) {
        for (const field of task.custom_fields) {
          if (field.id === 'Instagram_Post_ID') {
            return field.value
          }
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to extract Instagram post ID from task', error as Error)
      return null
    }
  }

  /**
   * Extract Instagram account name from ClickUp task
   */
  static extractInstagramAccountName(task: any): string | null {
    try {
      if (task.custom_fields) {
        for (const field of task.custom_fields) {
          if (field.id === 'Instagram_Account_Name') {
            return field.value
          }
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to extract Instagram account name from task', error as Error)
      return null
    }
  }

  /**
   * Extract Instagram permalink from ClickUp task
   */
  static extractInstagramPermalink(task: any): string | null {
    try {
      if (task.custom_fields) {
        for (const field of task.custom_fields) {
          if (field.id === 'Instagram_Permalink') {
            return field.value
          }
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to extract Instagram permalink from task', error as Error)
      return null
    }
  }

  /**
   * Build custom fields update payload for ClickUp
   */
  static buildCustomFieldsUpdate(metrics: InstagramMetrics): Array<{
    id: string
    value: number
  }> {
    return [
      { id: 'Alcance', value: metrics.alcance },
      { id: 'Engajamento', value: metrics.engajamento },
      { id: 'Impressões', value: metrics.impressoes },
      { id: 'Cliques', value: metrics.cliques },
      { id: 'Likes', value: metrics.likes },
      { id: 'Comments', value: metrics.comments },
    ]
  }
}
