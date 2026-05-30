/**
 * Instagram Business Integration Types
 * Defines all TypeScript interfaces and types for Instagram API integration
 */

// ============================================================================
// Instagram API Response Types
// ============================================================================

export interface InstagramPost {
  id: string
  caption: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  mediaUrl: string | null
  timestamp: string
  permalink: string
  publishedAt: string
}

export interface InstagramMetrics {
  postId: string
  alcance: number
  engajamento: number
  impressoes: number
  cliques: number
  likes: number
  comments: number
  retrievedAt: string
}

export interface InstagramServiceConfig {
  accessToken: string
  businessAccountId: string
  accountName: string
}

// ============================================================================
// Normalized Data Types
// ============================================================================

export interface NormalizedPost {
  id: string
  title: string
  imageUrl: string | null
  status: 'Publicado' | 'Agendado' | 'Rascunho'
  metrics: {
    alcance: number
    engajamento: number
    impressoes: number
    cliques: number
    likes: number
    comments: number
  }
  createdAt: string
  publishedAt: string | null
  instagramAccountName: string
  instagramPostId: string
  instagramPermalink: string
}

// ============================================================================
// Credential Storage Types
// ============================================================================

export interface StoredCredential {
  accountId: string
  accountName: string
  businessAccountId: string
  accessToken: string // Encrypted
  clickupListId: string
  isActive: boolean
  createdAt: string
  lastValidatedAt: string
  expiresAt?: string
}

export interface StoredCredentialWithoutToken
  extends Omit<StoredCredential, 'accessToken'> {}

// ============================================================================
// Sync Job Types
// ============================================================================

export interface SyncError {
  type: 'INSTAGRAM_API' | 'CLICKUP_API' | 'VALIDATION' | 'UNKNOWN'
  message: string
  context: Record<string, any>
  timestamp: string
}

export interface SyncResult {
  accountId: string
  accountName: string
  postsProcessed: number
  tasksCreated: number
  tasksUpdated: number
  metricsUpdated: number
  errors: SyncError[]
  duration: number
  timestamp: string
  status: 'success' | 'partial' | 'failed'
}

export interface SyncJobConfig {
  frequencyMinutes: number
  maxConcurrentAccounts: number
  timeoutSeconds: number
}

// ============================================================================
// ClickUp Integration Types
// ============================================================================

export interface ClickUpTaskData {
  name: string
  description: string
  custom_fields: {
    Alcance: number
    Engajamento: number
    Impressões: number
    Cliques: number
    Likes: number
    Comments: number
    Instagram_Post_ID: string
    Instagram_Account_Name: string
    Instagram_Permalink: string
  }
  status: string
}

// ============================================================================
// Audit Logging Types
// ============================================================================

export interface AuditLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'SYNC'
  resourceType: 'CREDENTIAL' | 'MAPPING' | 'SYNC'
  resourceId: string
  userId: string
  changes: Record<string, any>
  status: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
  timestamp: string
  ipAddress: string
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  ttl: number // in seconds
  maxSize: number
  strategy: 'LRU' | 'FIFO'
}

export const CACHE_KEYS = {
  POSTS: (accountId: string) => `instagram:posts:${accountId}`,
  METRICS: (postId: string) => `instagram:metrics:${postId}`,
  ACCOUNT_STATUS: (accountId: string) => `instagram:status:${accountId}`,
  SYNC_LOCK: (accountId: string) => `instagram:sync:lock:${accountId}`,
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimiterConfig {
  maxTokens: number
  refillRatePerSecond: number
}

// ============================================================================
// Retry Strategy Types
// ============================================================================

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

export const RETRY_CONFIGS = {
  INSTAGRAM_API: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },
  CLICKUP_API: {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },
  NETWORK: {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 120000,
    backoffMultiplier: 2,
  },
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AddAccountRequest {
  accountName: string
  businessAccountId: string
  accessToken: string
  clickupListId: string
}

export interface AddAccountResponse {
  success: boolean
  accountId?: string
  message: string
}

export interface ListAccountsResponse {
  accounts: StoredCredentialWithoutToken[]
}

export interface UpdateAccountRequest {
  accountName?: string
  clickupListId?: string
  isActive?: boolean
}

export interface SyncHistoryEntry {
  id: string
  accountId: string
  status: 'success' | 'partial' | 'failed'
  postsProcessed: number
  tasksCreated: number
  tasksUpdated: number
  metricsUpdated: number
  errorMessage?: string
  durationMs: number
  startedAt: string
  completedAt: string
}

export interface AccountStatus {
  accountId: string
  accountName: string
  isActive: boolean
  lastSyncTime?: string
  nextSyncTime?: string
  lastError?: string
  postsCount: number
}

// ============================================================================
// Batch Processing Types
// ============================================================================

export interface BatchProcessorConfig {
  batchSize: number
  delayMs: number
}

// ============================================================================
// Instagram API Response Types (from Meta API)
// ============================================================================

export interface InstagramAPIPost {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  media_url?: string
  timestamp: string
  permalink: string
}

export interface InstagramAPIMetrics {
  reach: number
  engagement: number
  impressions: number
  clicks: number
  likes: number
  comments: number
}

export interface InstagramAPIInsights {
  data: Array<{
    name: string
    period: string
    values: Array<{ value: number }>
    title: string
    description: string
  }>
}
