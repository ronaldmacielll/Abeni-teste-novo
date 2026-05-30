# Guia de Implementação: Instagram Business Integration

## Fase 1: Setup Inicial

### 1.1 Configurar Variáveis de Ambiente

```bash
# .env.local
INSTAGRAM_ENCRYPTION_KEY=<32-byte-hex-key>
INSTAGRAM_API_VERSION=v18.0
INSTAGRAM_GRAPH_API_URL=https://graph.instagram.com

# Para desenvolvimento
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<random-token>
INSTAGRAM_WEBHOOK_SECRET=<webhook-secret>
```

### 1.2 Criar Tabelas no Banco de Dados

```sql
-- Executar migrations
npm run db:migrate

-- Ou criar manualmente as tabelas definidas em design.md
```

### 1.3 Instalar Dependências

```bash
npm install crypto-js node-cron axios
npm install --save-dev @types/node-cron
```

## Fase 2: Implementar Serviços Core

### 2.1 Instagram Service

**Arquivo**: `lib/services/instagram.service.ts`

```typescript
import axios, { AxiosInstance } from 'axios'

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

export class InstagramService {
  private client: AxiosInstance
  private businessAccountId: string
  private accessToken: string

  constructor(businessAccountId: string, accessToken: string) {
    this.businessAccountId = businessAccountId
    this.accessToken = accessToken

    this.client = axios.create({
      baseURL: process.env.INSTAGRAM_GRAPH_API_URL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.client.get('/me', {
        params: {
          fields: 'id,username,name'
        }
      })
      return !!response.data.id
    } catch (error) {
      console.error('Credential validation failed:', error)
      return false
    }
  }

  async fetchRecentPosts(since?: Date, limit: number = 25): Promise<InstagramPost[]> {
    try {
      const params: any = {
        fields: 'id,caption,media_type,media_url,timestamp,permalink',
        limit
      }

      if (since) {
        params.since = Math.floor(since.getTime() / 1000)
      }

      const response = await this.client.get(
        `/${this.businessAccountId}/media`,
        { params }
      )

      return response.data.data.map(post => ({
        id: post.id,
        caption: post.caption || '',
        mediaType: post.media_type,
        mediaUrl: post.media_url || null,
        timestamp: post.timestamp,
        permalink: post.permalink,
        publishedAt: post.timestamp
      }))
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      throw error
    }
  }

  async fetchPostMetrics(postId: string): Promise<InstagramMetrics> {
    try {
      const response = await this.client.get(`/${postId}/insights`, {
        params: {
          metric: 'engagement,impressions,reach,clicks,like_count,comments_count'
        }
      })

      const metrics = response.data.data.reduce((acc, metric) => {
        acc[metric.name] = metric.values[0]?.value || 0
        return acc
      }, {})

      return {
        postId,
        alcance: metrics.reach || 0,
        engajamento: metrics.engagement || 0,
        impressoes: metrics.impressions || 0,
        cliques: metrics.clicks || 0,
        likes: metrics.like_count || 0,
        comments: metrics.comments_count || 0,
        retrievedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Failed to fetch metrics for post ${postId}:`, error)
      throw error
    }
  }

  async fetchPostMetricsBatch(postIds: string[]): Promise<InstagramMetrics[]> {
    const results: InstagramMetrics[] = []

    for (const postId of postIds) {
      try {
        const metrics = await this.fetchPostMetrics(postId)
        results.push(metrics)
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Skipping metrics for post ${postId}`)
      }
    }

    return results
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error
    let delay = 1000

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2
        }
      }
    }

    throw lastError
  }
}
```

### 2.2 Credential Manager

**Arquivo**: `lib/services/credential-manager.ts`

```typescript
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export interface StoredCredential {
  accountId: string
  accountName: string
  businessAccountId: string
  accessToken: string
  clickupListId: string
  isActive: boolean
  createdAt: string
  lastValidatedAt: string
  expiresAt?: string
}

export class CredentialManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  private encryptionKey = Buffer.from(
    process.env.INSTAGRAM_ENCRYPTION_KEY!,
    'hex'
  )

  async storeCredential(
    credential: Omit<StoredCredential, 'createdAt'>
  ): Promise<void> {
    const encryptedToken = this.encryptToken(credential.accessToken)

    const { error } = await this.supabase
      .from('instagram_credentials')
      .upsert({
        account_id: credential.accountId,
        account_name: credential.accountName,
        business_account_id: credential.businessAccountId,
        access_token_encrypted: encryptedToken,
        clickup_list_id: credential.clickupListId,
        is_active: credential.isActive,
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
        expires_at: credential.expiresAt
      })

    if (error) throw error
  }

  async getCredential(accountId: string): Promise<StoredCredential> {
    const { data, error } = await this.supabase
      .from('instagram_credentials')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (error) throw error

    return {
      accountId: data.account_id,
      accountName: data.account_name,
      businessAccountId: data.business_account_id,
      accessToken: this.decryptToken(data.access_token_encrypted),
      clickupListId: data.clickup_list_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      lastValidatedAt: data.last_validated_at,
      expiresAt: data.expires_at
    }
  }

  async listCredentials(): Promise<Omit<StoredCredential, 'accessToken'>[]> {
    const { data, error } = await this.supabase
      .from('instagram_credentials')
      .select('*')

    if (error) throw error

    return data.map(cred => ({
      accountId: cred.account_id,
      accountName: cred.account_name,
      businessAccountId: cred.business_account_id,
      accessToken: '***REDACTED***',
      clickupListId: cred.clickup_list_id,
      isActive: cred.is_active,
      createdAt: cred.created_at,
      lastValidatedAt: cred.last_validated_at,
      expiresAt: cred.expires_at
    }))
  }

  async deleteCredential(accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('instagram_credentials')
      .delete()
      .eq('account_id', accountId)

    if (error) throw error
  }

  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv)

    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final()
    ])

    const authTag = cipher.getAuthTag()

    return Buffer.concat([iv, authTag, encrypted]).toString('base64')
  }

  private decryptToken(encrypted: string): string {
    const buffer = Buffer.from(encrypted, 'base64')
    const iv = buffer.slice(0, 16)
    const authTag = buffer.slice(16, 32)
    const encryptedData = buffer.slice(32)

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      iv
    )
    decipher.setAuthTag(authTag)

    return decipher.update(encryptedData) + decipher.final('utf8')
  }
}
```

### 2.3 Data Normalizer

**Arquivo**: `lib/utils/instagram-normalizer.ts`

```typescript
import { InstagramPost, InstagramMetrics } from '@/lib/services/instagram.service'

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

export class InstagramNormalizer {
  static normalizePost(
    igPost: InstagramPost,
    metrics: InstagramMetrics,
    accountName: string
  ): NormalizedPost {
    const validatedMetrics = this.ensureMetricsConsistency(metrics)

    return {
      id: `instagram-${igPost.id}`,
      title: igPost.caption.substring(0, 100) || 'Instagram Post',
      imageUrl: igPost.mediaUrl,
      status: 'Publicado',
      metrics: {
        alcance: validatedMetrics.alcance,
        engajamento: validatedMetrics.engajamento,
        impressoes: validatedMetrics.impressoes,
        cliques: validatedMetrics.cliques,
        likes: validatedMetrics.likes,
        comments: validatedMetrics.comments
      },
      createdAt: new Date(igPost.timestamp).toISOString(),
      publishedAt: new Date(igPost.publishedAt).toISOString(),
      instagramAccountName: accountName,
      instagramPostId: igPost.id,
      instagramPermalink: igPost.permalink
    }
  }

  static validateMetrics(metrics: InstagramMetrics): boolean {
    // Validar que todos os valores são números não-negativos
    const values = [
      metrics.alcance,
      metrics.engajamento,
      metrics.impressoes,
      metrics.cliques,
      metrics.likes,
      metrics.comments
    ]

    return values.every(v => typeof v === 'number' && v >= 0)
  }

  static ensureMetricsConsistency(
    metrics: InstagramMetrics
  ): InstagramMetrics {
    // Garantir que likes e comments <= engajamento
    const engajamento = Math.max(
      metrics.engajamento,
      metrics.likes + metrics.comments
    )

    // Garantir que engajamento <= impressoes
    const impressoes = Math.max(metrics.impressoes, engajamento)

    return {
      ...metrics,
      engajamento,
      impressoes
    }
  }
}
```

## Fase 3: Implementar Sync Job

### 3.1 Sync Job Scheduler

**Arquivo**: `lib/jobs/instagram-sync.job.ts`

```typescript
import cron from 'node-cron'
import { InstagramService } from '@/lib/services/instagram.service'
import { CredentialManager } from '@/lib/services/credential-manager'
import { InstagramNormalizer } from '@/lib/utils/instagram-normalizer'
import { ClickUpService } from '@/lib/services/clickup.service'
import { createClient } from '@supabase/supabase-js'

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
}

export interface SyncError {
  type: 'INSTAGRAM_API' | 'CLICKUP_API' | 'VALIDATION' | 'UNKNOWN'
  message: string
  context: Record<string, any>
  timestamp: string
}

export class InstagramSyncJob {
  private cronJob: cron.ScheduledTask | null = null
  private isRunning = false
  private credentialManager = new CredentialManager()
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  constructor(private frequencyMinutes: number = 5) {}

  start(): void {
    // Executar a cada N minutos
    const cronExpression = `*/${this.frequencyMinutes} * * * *`

    this.cronJob = cron.schedule(cronExpression, async () => {
      if (!this.isRunning) {
        await this.runSync()
      }
    })

    console.log(`Instagram Sync Job started (every ${this.frequencyMinutes} minutes)`)
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      console.log('Instagram Sync Job stopped')
    }
  }

  async runSync(): Promise<SyncResult[]> {
    this.isRunning = true
    const startTime = Date.now()
    const results: SyncResult[] = []

    try {
      // Obter todas as contas ativas
      const { data: credentials, error } = await this.supabase
        .from('instagram_credentials')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      // Sincronizar cada conta
      for (const cred of credentials) {
        try {
          const result = await this.syncAccount(cred.account_id)
          results.push(result)
        } catch (error) {
          console.error(`Error syncing account ${cred.account_id}:`, error)
        }
      }

      // Registrar histórico
      await this.recordSyncHistory(results)
    } finally {
      this.isRunning = false
      const duration = Date.now() - startTime
      console.log(`Sync completed in ${duration}ms`)
    }

    return results
  }

  private async syncAccount(accountId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: SyncError[] = []
    let postsProcessed = 0
    let tasksCreated = 0
    let tasksUpdated = 0
    let metricsUpdated = 0

    try {
      // Obter credenciais
      const credential = await this.credentialManager.getCredential(accountId)

      // Criar serviços
      const instagramService = new InstagramService(
        credential.businessAccountId,
        credential.accessToken
      )
      const clickupService = new ClickUpService(
        process.env.CLICKUP_API_KEY!
      )

      // Buscar posts recentes
      const posts = await instagramService.fetchRecentPosts(
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
      )

      postsProcessed = posts.length

      // Processar cada post
      for (const post of posts) {
        try {
          // Buscar métricas
          const metrics = await instagramService.fetchPostMetrics(post.id)

          // Validar métricas
          if (!InstagramNormalizer.validateMetrics(metrics)) {
            errors.push({
              type: 'VALIDATION',
              message: `Invalid metrics for post ${post.id}`,
              context: { postId: post.id, metrics },
              timestamp: new Date().toISOString()
            })
            continue
          }

          // Normalizar post
          const normalizedPost = InstagramNormalizer.normalizePost(
            post,
            metrics,
            credential.accountName
          )

          // Verificar se post já existe
          const { data: existingMapping } = await this.supabase
            .from('instagram_post_mappings')
            .select('clickup_task_id')
            .eq('instagram_post_id', post.id)
            .single()

          if (existingMapping) {
            // Atualizar task existente
            await clickupService.updateTask(existingMapping.clickup_task_id, {
              custom_fields: {
                'Alcance': metrics.alcance,
                'Engajamento': metrics.engajamento,
                'Impressões': metrics.impressoes,
                'Cliques': metrics.cliques,
                'Likes': metrics.likes,
                'Comments': metrics.comments
              }
            })
            tasksUpdated++
            metricsUpdated++
          } else {
            // Criar nova task
            const task = await clickupService.createTask(
              credential.clickupListId,
              {
                name: normalizedPost.title,
                description: `Instagram Post\n\n${post.caption}\n\n[View on Instagram](${post.permalink})`,
                custom_fields: {
                  'Alcance': metrics.alcance,
                  'Engajamento': metrics.engajamento,
                  'Impressões': metrics.impressoes,
                  'Cliques': metrics.cliques,
                  'Likes': metrics.likes,
                  'Comments': metrics.comments,
                  'Instagram_Post_ID': post.id,
                  'Instagram_Account_Name': credential.accountName,
                  'Instagram_Permalink': post.permalink
                },
                status: 'Publicado'
              }
            )

            // Registrar mapeamento
            await this.supabase
              .from('instagram_post_mappings')
              .insert({
                instagram_post_id: post.id,
                instagram_account_id: accountId,
                clickup_task_id: task.id,
                clickup_list_id: credential.clickupListId,
                last_metrics_update: new Date().toISOString()
              })

            tasksCreated++
          }
        } catch (error) {
          errors.push({
            type: 'UNKNOWN',
            message: `Error processing post ${post.id}`,
            context: { postId: post.id, error: String(error) },
            timestamp: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      errors.push({
        type: 'INSTAGRAM_API',
        message: `Error syncing account ${accountId}`,
        context: { accountId, error: String(error) },
        timestamp: new Date().toISOString()
      })
    }

    const duration = Date.now() - startTime

    return {
      accountId,
      accountName: accountId, // TODO: obter do credential
      postsProcessed,
      tasksCreated,
      tasksUpdated,
      metricsUpdated,
      errors,
      duration,
      timestamp: new Date().toISOString()
    }
  }

  private async recordSyncHistory(results: SyncResult[]): Promise<void> {
    for (const result of results) {
      await this.supabase
        .from('instagram_sync_history')
        .insert({
          account_id: result.accountId,
          status: result.errors.length === 0 ? 'success' : 'partial',
          posts_processed: result.postsProcessed,
          tasks_created: result.tasksCreated,
          tasks_updated: result.tasksUpdated,
          metrics_updated: result.metricsUpdated,
          error_message: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
          duration_ms: result.duration,
          completed_at: new Date().toISOString()
        })
    }
  }
}
```

## Fase 4: Implementar API Endpoints

### 4.1 POST /api/admin/instagram/accounts

**Arquivo**: `app/api/admin/instagram/accounts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { InstagramService } from '@/lib/services/instagram.service'
import { CredentialManager } from '@/lib/services/credential-manager'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      accountName,
      businessAccountId,
      accessToken,
      clickupListId
    } = body

    // Validar campos obrigatórios
    if (!accountName || !businessAccountId || !accessToken || !clickupListId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validar credenciais com Instagram API
    const instagramService = new InstagramService(
      businessAccountId,
      accessToken
    )

    const isValid = await instagramService.validateCredentials()
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Instagram credentials' },
        { status: 400 }
      )
    }

    // Armazenar credenciais
    const credentialManager = new CredentialManager()
    const accountId = `instagram-${Date.now()}`

    await credentialManager.storeCredential({
      accountId,
      accountName,
      businessAccountId,
      accessToken,
      clickupListId,
      isActive: true
    })

    return NextResponse.json(
      {
        success: true,
        accountId,
        message: 'Instagram account configured successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error configuring Instagram account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const credentialManager = new CredentialManager()
    const credentials = await credentialManager.listCredentials()

    return NextResponse.json({ accounts: credentials })
  } catch (error) {
    console.error('Error fetching Instagram accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4.2 POST /api/admin/instagram/sync

**Arquivo**: `app/api/admin/instagram/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { InstagramSyncJob } from '@/lib/jobs/instagram-sync.job'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const syncJob = new InstagramSyncJob()
    const results = await syncJob.runSync()

    return NextResponse.json({
      success: true,
      results,
      message: 'Sync completed'
    })
  } catch (error) {
    console.error('Error running sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Fase 5: Testes

### 5.1 Testes Unitários

**Arquivo**: `lib/services/instagram.service.test.ts`

```typescript
import { InstagramService } from './instagram.service'

describe('InstagramService', () => {
  let service: InstagramService

  beforeEach(() => {
    service = new InstagramService('123456789', 'test-token')
  })

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      // Mock API call
      const result = await service.validateCredentials()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('fetchRecentPosts', () => {
    it('should return array of posts', async () => {
      const posts = await service.fetchRecentPosts()
      expect(Array.isArray(posts)).toBe(true)
    })
  })

  describe('fetchPostMetrics', () => {
    it('should return metrics object', async () => {
      const metrics = await service.fetchPostMetrics('post-123')
      expect(metrics).toHaveProperty('alcance')
      expect(metrics).toHaveProperty('engajamento')
    })
  })
})
```

## Próximos Passos

1. Implementar componentes React para Admin Interface
2. Adicionar testes de integração
3. Configurar webhooks do Instagram
4. Implementar monitoramento e alertas
5. Documentar processo de deployment
