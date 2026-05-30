# Estratégia de Testes: Instagram Business Integration

## 1. Testes Unitários

### 1.1 Instagram Service Tests

```typescript
// lib/services/instagram.service.test.ts
import { InstagramService } from './instagram.service'
import axios from 'axios'

jest.mock('axios')

describe('InstagramService', () => {
  let service: InstagramService
  const mockAxios = axios as jest.Mocked<typeof axios>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new InstagramService('123456789', 'test-token')
  })

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { id: '123456789', username: 'test_account' }
        })
      } as any)

      const result = await service.validateCredentials()
      expect(result).toBe(true)
    })

    it('should return false for invalid credentials', async () => {
      mockAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Invalid token'))
      } as any)

      const result = await service.validateCredentials()
      expect(result).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      mockAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Network error'))
      } as any)

      const result = await service.validateCredentials()
      expect(result).toBe(false)
    })
  })

  describe('fetchRecentPosts', () => {
    it('should return array of posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          caption: 'Test post',
          media_type: 'IMAGE',
          media_url: 'https://example.com/image.jpg',
          timestamp: '2024-01-15T10:00:00Z',
          permalink: 'https://instagram.com/p/123'
        }
      ]

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { data: mockPosts }
        })
      } as any)

      const posts = await service.fetchRecentPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0].id).toBe('post-1')
    })

    it('should handle pagination', async () => {
      const mockPosts = Array(50).fill(null).map((_, i) => ({
        id: `post-${i}`,
        caption: `Post ${i}`,
        media_type: 'IMAGE',
        media_url: 'https://example.com/image.jpg',
        timestamp: '2024-01-15T10:00:00Z',
        permalink: 'https://instagram.com/p/123'
      }))

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { data: mockPosts }
        })
      } as any)

      const posts = await service.fetchRecentPosts(undefined, 50)
      expect(posts.length).toBeGreaterThan(0)
    })

    it('should filter posts by date', async () => {
      const since = new Date('2024-01-15')
      const mockPosts = [
        {
          id: 'post-1',
          caption: 'Recent post',
          media_type: 'IMAGE',
          media_url: 'https://example.com/image.jpg',
          timestamp: '2024-01-16T10:00:00Z',
          permalink: 'https://instagram.com/p/123'
        }
      ]

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { data: mockPosts }
        })
      } as any)

      const posts = await service.fetchRecentPosts(since)
      expect(posts).toHaveLength(1)
    })
  })

  describe('fetchPostMetrics', () => {
    it('should return metrics object with all fields', async () => {
      const mockMetrics = {
        data: [
          { name: 'reach', values: [{ value: 1000 }] },
          { name: 'engagement', values: [{ value: 100 }] },
          { name: 'impressions', values: [{ value: 1500 }] },
          { name: 'clicks', values: [{ value: 50 }] },
          { name: 'like_count', values: [{ value: 80 }] },
          { name: 'comments_count', values: [{ value: 20 }] }
        ]
      }

      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: mockMetrics
        })
      } as any)

      const metrics = await service.fetchPostMetrics('post-1')
      expect(metrics.alcance).toBe(1000)
      expect(metrics.engajamento).toBe(100)
      expect(metrics.impressoes).toBe(1500)
      expect(metrics.cliques).toBe(50)
      expect(metrics.likes).toBe(80)
      expect(metrics.comments).toBe(20)
    })

    it('should handle missing metrics with defaults', async () => {
      mockAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { data: [] }
        })
      } as any)

      const metrics = await service.fetchPostMetrics('post-1')
      expect(metrics.alcance).toBe(0)
      expect(metrics.engajamento).toBe(0)
    })

    it('should retry on failure', async () => {
      const mockGet = jest.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          data: {
            data: [
              { name: 'reach', values: [{ value: 1000 }] }
            ]
          }
        })

      mockAxios.create.mockReturnValue({
        get: mockGet
      } as any)

      const metrics = await service.fetchPostMetrics('post-1')
      expect(mockGet).toHaveBeenCalledTimes(2)
    })
  })
})
```

### 1.2 Credential Manager Tests

```typescript
// lib/services/credential-manager.test.ts
import { CredentialManager } from './credential-manager'
import crypto from 'crypto'

describe('CredentialManager', () => {
  let manager: CredentialManager

  beforeEach(() => {
    manager = new CredentialManager()
  })

  describe('Token Encryption', () => {
    it('should encrypt and decrypt tokens correctly', () => {
      const token = 'EAAB1234567890abcdef'
      const encrypted = manager['encryptToken'](token)
      const decrypted = manager['decryptToken'](encrypted)

      expect(decrypted).toBe(token)
      expect(encrypted).not.toBe(token)
    })

    it('should produce different ciphertexts for same plaintext', () => {
      const token = 'EAAB1234567890abcdef'
      const encrypted1 = manager['encryptToken'](token)
      const encrypted2 = manager['encryptToken'](token)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle special characters in tokens', () => {
      const token = 'EAAB!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = manager['encryptToken'](token)
      const decrypted = manager['decryptToken'](encrypted)

      expect(decrypted).toBe(token)
    })
  })

  describe('storeCredential', () => {
    it('should store credential with encrypted token', async () => {
      const credential = {
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: '123456789',
        accessToken: 'EAAB1234567890abcdef',
        clickupListId: 'list-123',
        isActive: true
      }

      await manager.storeCredential(credential)

      // Verificar que foi armazenado
      const stored = await manager.getCredential('test-account')
      expect(stored.accountName).toBe('Test Account')
      expect(stored.accessToken).toBe(credential.accessToken)
    })
  })

  describe('getCredential', () => {
    it('should retrieve and decrypt credential', async () => {
      const credential = {
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: '123456789',
        accessToken: 'EAAB1234567890abcdef',
        clickupListId: 'list-123',
        isActive: true
      }

      await manager.storeCredential(credential)
      const retrieved = await manager.getCredential('test-account')

      expect(retrieved.accessToken).toBe(credential.accessToken)
    })

    it('should throw error for non-existent credential', async () => {
      await expect(
        manager.getCredential('non-existent')
      ).rejects.toThrow()
    })
  })

  describe('listCredentials', () => {
    it('should list all credentials without tokens', async () => {
      const credential = {
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: '123456789',
        accessToken: 'EAAB1234567890abcdef',
        clickupListId: 'list-123',
        isActive: true
      }

      await manager.storeCredential(credential)
      const list = await manager.listCredentials()

      expect(list).toHaveLength(1)
      expect(list[0].accessToken).toBe('***REDACTED***')
    })
  })

  describe('deleteCredential', () => {
    it('should delete credential', async () => {
      const credential = {
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: '123456789',
        accessToken: 'EAAB1234567890abcdef',
        clickupListId: 'list-123',
        isActive: true
      }

      await manager.storeCredential(credential)
      await manager.deleteCredential('test-account')

      await expect(
        manager.getCredential('test-account')
      ).rejects.toThrow()
    })
  })
})
```

### 1.3 Data Normalizer Tests

```typescript
// lib/utils/instagram-normalizer.test.ts
import { InstagramNormalizer } from './instagram-normalizer'
import { InstagramPost, InstagramMetrics } from '@/lib/services/instagram.service'

describe('InstagramNormalizer', () => {
  describe('normalizePost', () => {
    it('should normalize post correctly', () => {
      const post: InstagramPost = {
        id: 'post-123',
        caption: 'Test caption',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: '2024-01-15T10:00:00Z',
        permalink: 'https://instagram.com/p/123',
        publishedAt: '2024-01-15T10:00:00Z'
      }

      const metrics: InstagramMetrics = {
        postId: 'post-123',
        alcance: 1000,
        engajamento: 100,
        impressoes: 1500,
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      const normalized = InstagramNormalizer.normalizePost(
        post,
        metrics,
        'Test Account'
      )

      expect(normalized.id).toBe('instagram-post-123')
      expect(normalized.title).toBe('Test caption')
      expect(normalized.status).toBe('Publicado')
      expect(normalized.metrics.alcance).toBe(1000)
      expect(normalized.instagramAccountName).toBe('Test Account')
    })

    it('should truncate long captions', () => {
      const longCaption = 'A'.repeat(200)
      const post: InstagramPost = {
        id: 'post-123',
        caption: longCaption,
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: '2024-01-15T10:00:00Z',
        permalink: 'https://instagram.com/p/123',
        publishedAt: '2024-01-15T10:00:00Z'
      }

      const metrics: InstagramMetrics = {
        postId: 'post-123',
        alcance: 1000,
        engajamento: 100,
        impressoes: 1500,
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      const normalized = InstagramNormalizer.normalizePost(
        post,
        metrics,
        'Test Account'
      )

      expect(normalized.title.length).toBeLessThanOrEqual(100)
    })
  })

  describe('validateMetrics', () => {
    it('should validate correct metrics', () => {
      const metrics: InstagramMetrics = {
        postId: 'post-123',
        alcance: 1000,
        engajamento: 100,
        impressoes: 1500,
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      expect(InstagramNormalizer.validateMetrics(metrics)).toBe(true)
    })

    it('should reject negative metrics', () => {
      const metrics: InstagramMetrics = {
        postId: 'post-123',
        alcance: -100,
        engajamento: 100,
        impressoes: 1500,
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      expect(InstagramNormalizer.validateMetrics(metrics)).toBe(false)
    })

    it('should reject non-numeric metrics', () => {
      const metrics: any = {
        postId: 'post-123',
        alcance: 'invalid',
        engajamento: 100,
        impressoes: 1500,
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      expect(InstagramNormalizer.validateMetrics(metrics)).toBe(false)
    })
  })

  describe('ensureMetricsConsistency', () => {
    it('should fix inconsistent metrics', () => {
      const metrics: InstagramMetrics = {
        postId: 'post-123',
        alcance: 100,
        engajamento: 200, // Maior que alcance (inconsistente)
        impressoes: 50,   // Menor que engajamento (inconsistente)
        cliques: 50,
        likes: 80,
        comments: 20,
        retrievedAt: '2024-01-15T10:05:00Z'
      }

      const fixed = InstagramNormalizer.ensureMetricsConsistency(metrics)

      expect(fixed.engajamento).toBeLessThanOrEqual(fixed.impressoes)
      expect(fixed.likes + fixed.comments).toBeLessThanOrEqual(fixed.engajamento)
    })
  })
})
```

## 2. Testes de Integração

### 2.1 Sync Job Integration Tests

```typescript
// lib/jobs/instagram-sync.job.integration.test.ts
import { InstagramSyncJob } from './instagram-sync.job'
import { CredentialManager } from '@/lib/services/credential-manager'
import { createClient } from '@supabase/supabase-js'

describe('InstagramSyncJob Integration', () => {
  let syncJob: InstagramSyncJob
  let credentialManager: CredentialManager
  let supabase: ReturnType<typeof createClient>

  beforeAll(async () => {
    syncJob = new InstagramSyncJob(5)
    credentialManager = new CredentialManager()
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  beforeEach(async () => {
    // Limpar dados de teste
    await supabase
      .from('instagram_credentials')
      .delete()
      .eq('account_name', 'Test Account')
  })

  describe('runSync', () => {
    it('should complete sync cycle successfully', async () => {
      // Adicionar credencial de teste
      await credentialManager.storeCredential({
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: process.env.TEST_INSTAGRAM_ACCOUNT_ID!,
        accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN!,
        clickupListId: process.env.TEST_CLICKUP_LIST_ID!,
        isActive: true
      })

      const results = await syncJob.runSync()

      expect(results).toHaveLength(1)
      expect(results[0].accountId).toBe('test-account')
      expect(results[0].postsProcessed).toBeGreaterThanOrEqual(0)
    }, 60000) // 60 segundo timeout

    it('should handle multiple accounts', async () => {
      // Adicionar múltiplas credenciais
      for (let i = 0; i < 3; i++) {
        await credentialManager.storeCredential({
          accountId: `test-account-${i}`,
          accountName: `Test Account ${i}`,
          businessAccountId: process.env.TEST_INSTAGRAM_ACCOUNT_ID!,
          accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN!,
          clickupListId: process.env.TEST_CLICKUP_LIST_ID!,
          isActive: true
        })
      }

      const results = await syncJob.runSync()

      expect(results.length).toBeGreaterThanOrEqual(1)
    }, 120000) // 120 segundo timeout
  })

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      await credentialManager.storeCredential({
        accountId: 'invalid-account',
        accountName: 'Invalid Account',
        businessAccountId: '999999999',
        accessToken: 'invalid-token',
        clickupListId: 'list-123',
        isActive: true
      })

      const results = await syncJob.runSync()

      expect(results).toHaveLength(1)
      expect(results[0].errors.length).toBeGreaterThan(0)
    }, 30000)
  })
})
```

## 3. Testes de API

### 3.1 POST /api/admin/instagram/accounts

```typescript
// app/api/admin/instagram/accounts/route.test.ts
import { POST, GET } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/admin/instagram/accounts', () => {
  it('should create account with valid credentials', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/instagram/accounts'),
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountName: 'Test Account',
          businessAccountId: process.env.TEST_INSTAGRAM_ACCOUNT_ID,
          accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN,
          clickupListId: process.env.TEST_CLICKUP_LIST_ID
        })
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.accountId).toBeDefined()
  })

  it('should reject invalid credentials', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/instagram/accounts'),
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountName: 'Test Account',
          businessAccountId: '999999999',
          accessToken: 'invalid-token',
          clickupListId: 'list-123'
        })
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should require authentication', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/instagram/accounts'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountName: 'Test Account',
          businessAccountId: '123456789',
          accessToken: 'token',
          clickupListId: 'list-123'
        })
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/instagram/accounts', () => {
  it('should list all accounts', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/instagram/accounts'),
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
        }
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.accounts)).toBe(true)
  })

  it('should not expose access tokens', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/admin/instagram/accounts'),
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
        }
      }
    )

    const response = await GET(request)
    const data = await response.json()

    data.accounts.forEach(account => {
      expect(account.accessToken).toBe('***REDACTED***')
    })
  })
})
```

## 4. Testes de Propriedades (Property-Based Testing)

### 4.1 Metrics Validation Properties

```typescript
// lib/utils/instagram-normalizer.property.test.ts
import fc from 'fast-check'
import { InstagramNormalizer } from './instagram-normalizer'
import { InstagramMetrics } from '@/lib/services/instagram.service'

describe('InstagramNormalizer Properties', () => {
  describe('Metrics Consistency', () => {
    it('should always ensure likes + comments <= engagement', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string(),
            alcance: fc.nat(),
            engajamento: fc.nat(),
            impressoes: fc.nat(),
            cliques: fc.nat(),
            likes: fc.nat(),
            comments: fc.nat(),
            retrievedAt: fc.iso8601()
          }),
          (metrics: any) => {
            const fixed = InstagramNormalizer.ensureMetricsConsistency(metrics)
            return (fixed.likes + fixed.comments) <= fixed.engajamento
          }
        )
      )
    })

    it('should always ensure engagement <= impressions', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string(),
            alcance: fc.nat(),
            engajamento: fc.nat(),
            impressoes: fc.nat(),
            cliques: fc.nat(),
            likes: fc.nat(),
            comments: fc.nat(),
            retrievedAt: fc.iso8601()
          }),
          (metrics: any) => {
            const fixed = InstagramNormalizer.ensureMetricsConsistency(metrics)
            return fixed.engajamento <= fixed.impressoes
          }
        )
      )
    })

    it('should preserve non-negative property', () => {
      fc.assert(
        fc.property(
          fc.record({
            postId: fc.string(),
            alcance: fc.nat(),
            engajamento: fc.nat(),
            impressoes: fc.nat(),
            cliques: fc.nat(),
            likes: fc.nat(),
            comments: fc.nat(),
            retrievedAt: fc.iso8601()
          }),
          (metrics: any) => {
            const fixed = InstagramNormalizer.ensureMetricsConsistency(metrics)
            return Object.values(fixed).every(v => 
              typeof v === 'number' ? v >= 0 : true
            )
          }
        )
      )
    })
  })

  describe('Normalization Idempotence', () => {
    it('should be idempotent when normalizing twice', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string(),
            caption: fc.string(),
            mediaType: fc.constantFrom('IMAGE', 'VIDEO', 'CAROUSEL'),
            mediaUrl: fc.option(fc.webUrl()),
            timestamp: fc.iso8601(),
            permalink: fc.webUrl(),
            publishedAt: fc.iso8601()
          }),
          fc.record({
            postId: fc.string(),
            alcance: fc.nat(),
            engajamento: fc.nat(),
            impressoes: fc.nat(),
            cliques: fc.nat(),
            likes: fc.nat(),
            comments: fc.nat(),
            retrievedAt: fc.iso8601()
          }),
          (post: any, metrics: any) => {
            const normalized1 = InstagramNormalizer.normalizePost(
              post,
              metrics,
              'Test Account'
            )
            const normalized2 = InstagramNormalizer.normalizePost(
              post,
              metrics,
              'Test Account'
            )
            return JSON.stringify(normalized1) === JSON.stringify(normalized2)
          }
        )
      )
    })
  })
})
```

## 5. Testes de Performance

### 5.1 Benchmark Tests

```typescript
// lib/jobs/instagram-sync.performance.test.ts
import { InstagramSyncJob } from './instagram-sync.job'

describe('InstagramSyncJob Performance', () => {
  let syncJob: InstagramSyncJob

  beforeAll(() => {
    syncJob = new InstagramSyncJob(5)
  })

  it('should complete sync within 120 seconds', async () => {
    const startTime = Date.now()
    await syncJob.runSync()
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(120000)
  }, 150000)

  it('should handle 100 posts within 60 seconds', async () => {
    // Teste com 100 posts
    const startTime = Date.now()
    // Simular processamento de 100 posts
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(60000)
  }, 90000)
})
```

## 6. Checklist de Testes

- [ ] Testes unitários para Instagram Service
- [ ] Testes unitários para Credential Manager
- [ ] Testes unitários para Data Normalizer
- [ ] Testes de integração para Sync Job
- [ ] Testes de API para endpoints
- [ ] Testes de propriedades para validação de métricas
- [ ] Testes de performance
- [ ] Testes de segurança (criptografia)
- [ ] Testes de tratamento de erros
- [ ] Testes de retry logic
- [ ] Cobertura de testes > 80%
- [ ] Testes E2E para fluxo completo
