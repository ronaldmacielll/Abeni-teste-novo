/**
 * Performance Module Types
 * 
 * Domain types for the Performance module
 */

export type PostStatus = 'Publicado' | 'Agendado' | 'Rascunho' | 'Arquivado'
export type PostSource = 'clickup' | 'instagram'

export interface PostMetrics {
  alcance: number
  engajamento: number
  impressoes: number
  cliques: number
  likes?: number
  comments?: number
}

export interface Post {
  id: string
  title: string
  imageUrl: string | null
  status: PostStatus
  metrics: PostMetrics
  createdAt: string
  publishedAt: string | null
  clientId: string
  source: PostSource
  instagramAccountName?: string
  instagramAccountId?: string
}

export interface GetPostsRequest {
  period?: 'week' | 'month'
  clientId?: string
  source?: PostSource | 'all'
  accountId?: string
}

export interface GetPostsResponse {
  posts: Post[]
  metadata: {
    total: number
    period: string
    startDate: string
    endDate: string
  }
}

export interface GetInstagramPostsResponse {
  posts: Post[]
  metadata: {
    total: number
    period: string
    startDate: string
    endDate: string
  }
}
