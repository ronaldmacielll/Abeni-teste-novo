# Implementation Plan: Instagram Business Integration

## Overview

Este plano de implementação detalha a construção da integração do Instagram Business API com o sistema ALUA Produtora. A integração automatiza a sincronização de posts e métricas do Instagram com o ClickUp, mantendo o Performance Dashboard atualizado em tempo real (5 minutos).

**Stack Técnica:**
- Frontend: Next.js 14+ (App Router), React, TypeScript
- Backend: Next.js API Routes (BFF)
- Autenticação: Supabase Auth
- Integração: Instagram Business API + ClickUp REST API
- Estilo: TailwindCSS + Design System customizado
- Estado: React Query (TanStack Query)
- Testes: Jest, React Testing Library, fast-check (PBT), Playwright
- Scheduler: Node.js cron ou similar
- Cache: Redis ou Memory

**Arquitetura:**
- Multi-tenant com isolamento por client_id
- BFF pattern (nunca chamar Instagram direto do frontend)
- Estrutura modular (/lib/services, /lib/jobs, /modules/admin, /modules/performance)
- Sincronização automática a cada 5 minutos
- Suporte para até 3 contas Instagram simultâneas

## Tasks

- [x] 1. Setup Inicial e Configuração de Infraestrutura
  - [x] 1.1 Criar estrutura de pastas para Instagram integration
    - Criar `/lib/services/instagram/`
    - Criar `/lib/jobs/`
    - Criar `/lib/utils/instagram/`
    - Criar `/lib/types/instagram.types.ts`
    - Criar `/modules/admin/components/`
    - Criar `/modules/admin/hooks/`
    - _Requirements: 1.1, 19.1_
  
  - [x] 1.2 Configurar variáveis de ambiente
    - Adicionar ao `.env.example`: INSTAGRAM_ENCRYPTION_KEY, INSTAGRAM_VAULT_URL, INSTAGRAM_SYNC_FREQUENCY_MINUTES
    - Documentar todas as variáveis necessárias
    - _Requirements: 1.1, 9.1_
  
  - [x] 1.3 Criar tabelas no banco de dados (Supabase)
    - Criar tabela `instagram_credentials` com campos: id, account_id, account_name, business_account_id, access_token_encrypted, clickup_list_id, is_active, created_at, last_validated_at, expires_at, created_by, updated_at
    - Criar tabela `instagram_post_mappings` com campos: id, instagram_post_id, instagram_account_id, clickup_task_id, clickup_list_id, last_metrics_update, created_at, updated_at
    - Criar tabela `instagram_sync_history` com campos: id, account_id, status, posts_processed, tasks_created, tasks_updated, metrics_updated, error_message, duration_ms, started_at, completed_at
    - Criar índices para performance
    - _Requirements: 1.1, 19.1, 18.1_
  
  - [x] 1.4 Configurar Row Level Security (RLS) no Supabase
    - Implementar políticas de acesso por client_id
    - Garantir isolamento multi-tenant
    - _Requirements: 1.1, 8.1_
  
  - [x] 1.5 Instalar dependências necessárias
    - Instalar: node-cron, crypto, axios (ou fetch nativo)
    - Verificar versões compatíveis com Next.js 14+
    - _Requirements: 1.1_

- [x] 2. Implementar Serviço Instagram e Validação de Credenciais
  - [x] 2.1 Criar InstagramService (`lib/services/instagram/instagram.service.ts`)
    - Implementar método `validateCredentials()` para validar token
    - Implementar método `fetchRecentPosts()` para buscar posts
    - Implementar método `fetchPostMetrics()` para buscar métricas
    - Implementar método `fetchPostMetricsBatch()` para buscar métricas em batch
    - Implementar retry com exponential backoff
    - Implementar tratamento de rate limiting
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 4.2_
  
  - [x] 2.2 Criar tipos TypeScript (`lib/types/instagram.types.ts`)
    - Definir interfaces: InstagramPost, InstagramMetrics, InstagramServiceConfig, SyncResult, SyncError
    - Definir tipos para respostas da API
    - _Requirements: 1.1_
  
  - [x] 2.3 Implementar validação de credenciais
    - Validar Access_Token com chamada de teste à API
    - Verificar permissões necessárias (instagram_business_content_read, instagram_business_insights_read)
    - Recuperar nome da conta e foto de perfil
    - Implementar timeout de 10 segundos
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.4 Escrever testes unitários para InstagramService
    - Testar validação de credenciais válidas e inválidas
    - Testar busca de posts com paginação
    - Testar busca de métricas
    - Testar retry com exponential backoff
    - _Requirements: 2.1, 2.2_

- [x] 3. Implementar Credential Manager e Segurança
  - [x] 3.1 Criar CredentialManager (`lib/services/credential-manager.ts`)
    - Implementar método `storeCredential()` para armazenar credenciais criptografadas
    - Implementar método `getCredential()` para recuperar credenciais descriptografadas
    - Implementar método `listCredentials()` para listar credenciais (sem tokens)
    - Implementar método `validateAndRefreshToken()` para validar e renovar tokens
    - Implementar método `deleteCredential()` para deletar credenciais
    - _Requirements: 1.1, 9.1, 9.2, 9.3_
  
  - [x] 3.2 Implementar criptografia de tokens
    - Usar AES-256-GCM para criptografia
    - Implementar métodos `encryptToken()` e `decryptToken()`
    - Usar INSTAGRAM_ENCRYPTION_KEY do ambiente
    - _Requirements: 9.1, 9.2_
  
  - [x] 3.3 Implementar audit logging
    - Criar classe `AuditLogger` para registrar todas as operações
    - Logar: CREATE, UPDATE, DELETE, VALIDATE, SYNC
    - Incluir: timestamp, userId, resourceId, changes, status, errorMessage
    - _Requirements: 9.3, 17.1_
  
  - [x] 3.4 Escrever testes unitários para CredentialManager
    - Testar armazenamento e recuperação de credenciais
    - Testar criptografia/descriptografia
    - Testar validação de tokens
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 4. Implementar Data Normalization
  - [x] 4.1 Criar InstagramNormalizer (`lib/utils/instagram/instagram-normalizer.ts`)
    - Implementar `normalizePost()` para transformar InstagramPost em NormalizedPost
    - Implementar `validateMetrics()` para validar dados de métricas
    - Implementar `ensureMetricsConsistency()` para garantir consistência
    - Mapear campos: title (caption), imageUrl, status, metrics, timestamps
    - _Requirements: 3.1, 4.1, 4.2, 15.1_
  
  - [x] 4.2 Criar PostClickUpMapper (`lib/services/post-clickup-mapper.ts`)
    - Implementar `mapToClickUpTask()` para mapear post para task do ClickUp
    - Implementar `extractMetricsFromTask()` para extrair métricas de task
    - Implementar `shouldUpdateMetrics()` para verificar se deve atualizar
    - Mapear custom fields: Alcance, Engajamento, Impressões, Cliques, Likes, Comments, Instagram_Post_ID, Instagram_Account_Name, Instagram_Permalink
    - _Requirements: 6.1, 6.2, 6.3, 7.1_
  
  - [x] 4.3 Escrever property tests para normalização
    - **Property 1: Post Normalization Completeness**
    - **Validates: Requirements 3.1, 4.1, 4.2, 15.1**
    - Testar que todos os campos obrigatórios são preenchidos
    - Testar que valores padrão são aplicados corretamente
  
  - [x] 4.4 Escrever property tests para validação de métricas
    - **Property 2: Metrics Consistency**
    - **Validates: Requirements 4.1, 4.2, 15.1**
    - Testar que likes ≤ engajamento
    - Testar que comments ≤ engajamento
    - Testar que engajamento ≤ impressões
    - Testar que todos os valores são não-negativos

- [x] 5. Implementar Cache e Rate Limiting
  - [x] 5.1 Criar CacheManager (`lib/services/cache-manager.ts`)
    - Implementar cache com TTL de 5 minutos
    - Implementar métodos: get(), set(), delete(), clear()
    - Suportar Redis ou Memory (fallback)
    - Definir cache keys para posts, métricas, status de conta
    - _Requirements: 18.1, 18.2_
  
  - [x] 5.2 Criar RateLimiter (`lib/utils/rate-limiter.ts`)
    - Implementar token bucket algorithm
    - Configurar limites: 10 posts/segundo, 20 métricas/segundo, 5 requisições concorrentes
    - Implementar método `acquire()` para adquirir tokens
    - _Requirements: 18.1, 18.2_
  
  - [x] 5.3 Criar RetryStrategy (`lib/utils/retry-strategy.ts`)
    - Implementar exponential backoff
    - Configurar retries por tipo de erro: Instagram API (3), ClickUp API (2), Network (5)
    - Implementar circuit breaker pattern
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 5.4 Criar BatchProcessor (`lib/utils/batch-processor.ts`)
    - Implementar processamento em batch com delay entre batches
    - Configurar tamanho de batch e delay
    - _Requirements: 18.1, 18.2_

- [x] 6. Implementar Sync Job Scheduler
  - [x] 6.1 Criar InstagramSyncJob (`lib/jobs/instagram-sync.job.ts`)
    - Implementar classe com métodos: start(), stop(), runSync()
    - Implementar scheduler com cron (5 minutos por padrão)
    - Implementar sincronização de múltiplas contas em paralelo
    - Implementar timeout de 120 segundos por ciclo
    - Implementar exponential backoff para falhas
    - _Requirements: 5.1, 5.2, 11.1, 11.2_
  
  - [x] 6.2 Implementar lógica de sincronização por conta
    - Buscar posts recentes do Instagram
    - Buscar métricas para cada post
    - Validar métricas
    - Criar ou atualizar tasks no ClickUp
    - Atualizar mapeamentos no banco
    - Armazenar em cache
    - _Requirements: 3.1, 4.1, 6.1, 6.2, 7.1_
  
  - [x] 6.3 Implementar deduplicação de posts
    - Verificar se post já existe no ClickUp (por Instagram_Post_ID)
    - Se existe, atualizar métricas
    - Se não existe, criar novo task
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 6.4 Implementar tratamento de erros e logging
    - Logar início e fim de cada sync
    - Logar erros com contexto completo
    - Armazenar histórico de syncs no banco
    - Implementar alertas para falhas críticas
    - _Requirements: 10.1, 10.2, 17.1, 17.2_
  
  - [x] 6.5 Escrever testes de integração para sync job
    - Testar sincronização completa de uma conta
    - Testar deduplicação de posts
    - Testar tratamento de erros
    - Testar timeout e retry
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1_

- [x] 7. Implementar API Endpoints - Admin Interface
  - [x] 7.1 Criar endpoint POST /api/admin/instagram/accounts
    - Validar JWT e extrair client_id
    - Validar campos obrigatórios: accountName, businessAccountId, accessToken, clickupListId
    - Chamar InstagramService.validateCredentials()
    - Armazenar credenciais criptografadas via CredentialManager
    - Criar Account_Mapping
    - Retornar sucesso com accountId
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 7.2 Criar endpoint GET /api/admin/instagram/accounts
    - Validar JWT e extrair client_id
    - Listar todas as contas configuradas (sem tokens)
    - Incluir status, last sync time, is_active
    - _Requirements: 1.1, 8.1, 16.1_
  
  - [x] 7.3 Criar endpoint PUT /api/admin/instagram/accounts/:accountId
    - Validar JWT e extrair client_id
    - Permitir atualizar: accountName, clickupListId, isActive
    - Validar que ClickUp list existe
    - Atualizar no banco
    - _Requirements: 1.1, 13.1, 13.2_
  
  - [x] 7.4 Criar endpoint DELETE /api/admin/instagram/accounts/:accountId
    - Validar JWT e extrair client_id
    - Requer confirmação (via query param)
    - Deletar credenciais
    - Deletar Account_Mapping
    - Deletar posts relacionados (opcional)
    - _Requirements: 1.1, 8.1_
  
  - [x] 7.5 Criar endpoint POST /api/admin/instagram/sync
    - Validar JWT e extrair client_id
    - Disparar sincronização manual
    - Retornar SyncResult[] com status de cada conta
    - _Requirements: 5.1, 5.2, 11.1_
  
  - [x] 7.6 Criar endpoint GET /api/admin/instagram/sync-history
    - Validar JWT e extrair client_id
    - Listar histórico de sincronizações
    - Suportar filtros: accountId, limit, offset
    - Retornar: history[], total
    - _Requirements: 11.1, 11.2, 17.1_
  
  - [x] 7.7 Criar endpoint GET /api/admin/instagram/status
    - Validar JWT e extrair client_id
    - Retornar status de todas as contas
    - Incluir: accountId, accountName, isActive, lastSyncTime, nextSyncTime, lastError
    - _Requirements: 5.1, 5.2, 8.1, 16.1_
  
  - [x] 7.8 Escrever testes de integração para endpoints
    - Testar autenticação e autorização
    - Testar validação de entrada
    - Testar respostas de sucesso e erro
    - Testar multi-tenancy (isolamento por client_id)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Implementar Admin Interface - Frontend
  - [x] 8.1 Criar componente InstagramAccountForm (`modules/admin/components/InstagramAccountForm.tsx`)
    - Implementar formulário com campos: accountName, businessAccountId, accessToken, clickupListId
    - Adicionar validação de campos obrigatórios
    - Implementar submit com POST para /api/admin/instagram/accounts
    - Exibir mensagens de erro inline
    - Exibir loading state durante submit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 16.1_
  
  - [x] 8.2 Criar componente InstagramAccountList (`modules/admin/components/InstagramAccountList.tsx`)
    - Exibir lista de contas configuradas
    - Mostrar: accountName, status (active/inactive), lastSyncTime, nextSyncTime
    - Implementar botões: edit, delete, manual sync
    - Exibir loading state e error state
    - _Requirements: 8.1, 16.1, 16.2_
  
  - [x] 8.3 Criar componente SyncJobStatus (`modules/admin/components/SyncJobStatus.tsx`)
    - Exibir status atual de sincronização
    - Mostrar: postsProcessed, tasksCreated, tasksUpdated, metricsUpdated
    - Mostrar: duration, timestamp, status (success/partial/failed)
    - Exibir indicador visual de progresso
    - _Requirements: 5.1, 5.2, 11.1, 11.2_
  
  - [x] 8.4 Criar componente SyncHistory (`modules/admin/components/SyncHistory.tsx`)
    - Exibir histórico de sincronizações
    - Mostrar: timestamp, status, postsProcessed, duration, errorMessage
    - Implementar paginação
    - Implementar filtro por accountId
    - _Requirements: 11.1, 11.2, 17.1_
  
  - [x] 8.5 Criar página Admin Instagram (`app/(dashboard)/admin/instagram/page.tsx`)
    - Integrar InstagramAccountForm
    - Integrar InstagramAccountList
    - Integrar SyncJobStatus
    - Integrar SyncHistory
    - Implementar layout responsivo
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 8.6 Escrever testes unitários para componentes Admin
    - Testar renderização de formulário
    - Testar validação de campos
    - Testar submit e tratamento de erros
    - Testar renderização de lista
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 9. Implementar Integração com Performance Dashboard
  - [x] 9.1 Criar hook useInstagramData (`modules/performance/hooks/useInstagramData.ts`)
    - Implementar hook com React Query para buscar posts do Instagram
    - Implementar cache e revalidação em background
    - Implementar tratamento de erros e retry
    - Suportar filtros por período
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 9.2 Criar componente InstagramPostCard (`modules/performance/components/InstagramPostCard.tsx`)
    - Renderizar post com layout similar ao PostCard existente
    - Exibir badge "Instagram" para identificar origem
    - Exibir nome da conta Instagram
    - Exibir todas as métricas: Alcance, Engajamento, Impressões, Cliques, Likes, Comments
    - Implementar layout responsivo
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 9.3 Estender hook usePerformanceData para incluir posts do Instagram
    - Modificar hook para buscar posts de múltiplas fontes (ClickUp + Instagram)
    - Implementar merge de dados
    - Implementar ordenação por data
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 9.4 Estender página Performance Dashboard
    - Exibir posts do Instagram junto com posts do ClickUp
    - Implementar filtro por fonte (ClickUp, Instagram, Todos)
    - Implementar filtro por conta Instagram
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 9.5 Escrever testes unitários para componentes Performance
    - Testar renderização de InstagramPostCard
    - Testar hook useInstagramData
    - Testar merge de dados de múltiplas fontes
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 10. Implementar Webhook Support (Future)
  - [x] 10.1 Criar endpoint POST /api/instagram/webhooks
    - Implementar validação de assinatura do webhook
    - Implementar retry logic
    - Disparar sync imediato para post afetado
    - Logar todos os eventos
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [x] 10.2 Implementar webhook configuration interface
    - Permitir habilitar/desabilitar webhooks por conta
    - Exibir webhook URL para configuração no Instagram
    - _Requirements: 20.1, 20.6_
  
  - [x] 10.3 Escrever testes para webhook handling
    - Testar validação de assinatura
    - Testar retry logic
    - Testar logging
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 11. Implementar Testes Completos
  - [x] 11.1 Escrever testes unitários para todos os serviços
    - InstagramService: validação, busca de posts, busca de métricas
    - CredentialManager: armazenamento, criptografia, validação
    - InstagramNormalizer: normalização, validação, consistência
    - PostClickUpMapper: mapeamento, extração de métricas
    - _Requirements: Testing Strategy_
  
  - [x] 11.2 Escrever testes de integração para sync job
    - Testar sincronização completa
    - Testar deduplicação
    - Testar tratamento de erros
    - Testar timeout e retry
    - _Requirements: Testing Strategy_
  
  - [x] 11.3 Escrever testes de integração para endpoints
    - Testar autenticação e autorização
    - Testar validação de entrada
    - Testar respostas de sucesso e erro
    - Testar multi-tenancy
    - _Requirements: Testing Strategy_
  
  - [x] 11.4 Escrever testes E2E para fluxos principais
    - Testar fluxo: login → admin → configurar conta → sync → ver posts no dashboard
    - Testar fluxo: admin → deletar conta → verificar que posts foram removidos
    - Testar fluxo: admin → manual sync → verificar histórico
    - _Requirements: Testing Strategy_
  
  - [x] 11.5 Configurar cobertura de testes
    - Garantir cobertura mínima de 80% para serviços
    - Garantir cobertura mínima de 70% para componentes
    - Gerar relatório de cobertura
    - _Requirements: Testing Strategy_

- [x] 12. Checkpoint - Integração Completa Funcional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Documentação e Deploy
  - [x] 13.1 Criar README.md para Instagram Integration
    - Documentar setup do projeto
    - Documentar variáveis de ambiente
    - Documentar estrutura de pastas
    - Documentar fluxo de sincronização
    - Documentar como configurar contas
    - _Requirements: 19.1_
  
  - [x] 13.2 Criar documentação de API
    - Documentar todos os endpoints
    - Documentar request/response schemas
    - Documentar códigos de erro
    - Documentar exemplos de uso
    - _Requirements: 19.1_
  
  - [x] 13.3 Criar guia de deployment
    - Documentar variáveis de ambiente necessárias
    - Documentar setup do banco de dados
    - Documentar configuração de scheduler
    - Documentar monitoramento e alertas
    - _Requirements: 19.1_
  
  - [x] 13.4 Configurar monitoramento e alertas
    - Implementar logging estruturado
    - Configurar alertas para falhas críticas
    - Configurar dashboard de monitoramento
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [x] 13.5 Preparar para deploy na Vercel
    - Testar em staging
    - Configurar variáveis de ambiente
    - Testar scheduler em produção
    - _Requirements: 19.1_

- [x] 14. Checkpoint Final - Sistema Completo
  - Ensure all tests pass, ask the user if questions arise.

## Dependências Entre Tarefas

```
1. Setup Inicial
   ├── 2. InstagramService
   │   ├── 3. CredentialManager
   │   │   ├── 4. Data Normalization
   │   │   │   ├── 5. Cache e Rate Limiting
   │   │   │   │   ├── 6. Sync Job Scheduler
   │   │   │   │   │   ├── 7. API Endpoints
   │   │   │   │   │   │   ├── 8. Admin Interface
   │   │   │   │   │   │   │   ├── 9. Performance Dashboard
   │   │   │   │   │   │   │   │   ├── 11. Testes Completos
   │   │   │   │   │   │   │   │   │   ├── 12. Checkpoint
   │   │   │   │   │   │   │   │   │   │   └── 13. Documentação
   │   │   │   │   │   │   │   │   │   │       └── 14. Checkpoint Final
```

## Estimativas de Complexidade

| Fase | Tarefa | Complexidade | Estimativa |
|------|--------|--------------|-----------|
| 1 | Setup Inicial | Baixa | 4-6 horas |
| 2 | InstagramService | Média | 8-12 horas |
| 3 | CredentialManager | Média | 6-8 horas |
| 4 | Data Normalization | Média | 6-8 horas |
| 5 | Cache e Rate Limiting | Média | 6-8 horas |
| 6 | Sync Job Scheduler | Alta | 12-16 horas |
| 7 | API Endpoints | Média | 10-12 horas |
| 8 | Admin Interface | Média | 12-16 horas |
| 9 | Performance Dashboard | Média | 8-10 horas |
| 10 | Webhook Support | Média | 8-10 horas |
| 11 | Testes Completos | Alta | 16-20 horas |
| 13 | Documentação | Baixa | 4-6 horas |

**Total Estimado: 100-130 horas**

## Notas Importantes

- Tarefas marcadas com `[ ]` devem ser executadas sequencialmente
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Unit tests validam exemplos específicos e edge cases
- A arquitetura BFF garante segurança (Access Token nunca exposto ao cliente)
- Multi-tenancy é garantido por filtros de client_id em todas as queries
- Sincronização automática a cada 5 minutos mantém dados atualizados
- Suporte para até 3 contas Instagram simultâneas
- Deduplicação previne criação de tasks duplicadas
- Retry com exponential backoff garante resiliência
- Circuit breaker previne cascata de falhas

## Correctness Properties

```typescript
// Property 1: Post Deduplication
// ∀ post ∈ Instagram: 
//   (post.id exists in ClickUp) ⟹ (exactly one ClickUp task for post.id)

// Property 2: Metrics Consistency
// ∀ metrics: 
//   (metrics.likes ≤ metrics.engajamento) ∧
//   (metrics.comments ≤ metrics.engajamento) ∧
//   (metrics.engajamento ≤ metrics.impressoes) ∧
//   (all metrics ≥ 0)

// Property 3: Sync Atomicity
// ∀ sync cycle:
//   (sync succeeds) ⟹ (all posts updated) ∨ (all posts rolled back)

// Property 4: Credential Security
// ∀ accessToken:
//   (token in database) ⟹ (token is encrypted) ∧
//   (token not in logs) ∧
//   (token not in API responses)

// Property 5: Account Isolation
// ∀ account1, account2 ∈ configured_accounts:
//   (account1 ≠ account2) ⟹ (posts from account1 not visible to account2)

// Property 6: Sync Frequency
// ∀ sync cycles:
//   (time between syncs) ≤ 5 minutes + processing_time

// Property 7: Error Recovery
// ∀ failed_sync:
//   (retry with exponential backoff) ∧
//   (max 3 retries) ∧
//   (circuit breaker after 5 consecutive failures)
```

## Próximos Passos (Pós-MVP)

1. **Webhook Support**: Implementar webhooks do Instagram para sincronização em tempo real
2. **Advanced Analytics**: Adicionar análises comparativas entre contas
3. **Scheduled Posts**: Suportar posts agendados do Instagram
4. **Multi-Language**: Suportar captions em múltiplos idiomas
5. **Media Download**: Fazer download de mídia para backup local
6. **Reels Support**: Adicionar suporte para Instagram Reels
7. **Stories Support**: Adicionar suporte para Instagram Stories (com insights)
8. **Performance Optimization**: Implementar cache distribuído com Redis
9. **Advanced Monitoring**: Implementar dashboard de monitoramento em tempo real
10. **API Rate Limiting**: Implementar rate limiting por usuário/conta
