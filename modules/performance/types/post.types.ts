/**
 * Performance Module Types
 * 
 * Domain types for the Performance module
 */

export type PostStatus = 'Publicado' | 'Agendado' | 'Rascunho' | 'Arquivado'

export interface PostMetrics {
  alcance: number
  engajamento: number
  impressoes: number
  cliques: number
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
}

export interface GetPostsRequest {
  period?: 'week' | 'month'
  clientId?: string
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
