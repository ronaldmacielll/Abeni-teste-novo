# Sumário Executivo: Design Técnico - Instagram Business Integration

## Visão Geral

Este design técnico descreve a integração completa do Instagram Business API com o sistema ALUA Produtora. A solução automatiza a sincronização de posts e métricas do Instagram com o ClickUp, mantendo o Performance Dashboard atualizado em tempo real (a cada 5 minutos).

## Arquitetura de Alto Nível

```
Instagram API → Sync Job (5 min) → ClickUp API
                      ↓
                   Cache (Redis)
                      ↓
                  Performance Dashboard
```

## Componentes Principais

| Componente | Responsabilidade | Localização |
|-----------|-----------------|------------|
| **Instagram Service** | Interação com Instagram API | `lib/services/instagram.service.ts` |
| **Credential Manager** | Armazenamento seguro de tokens | `lib/services/credential-manager.ts` |
| **Sync Job** | Orquestração de sincronização | `lib/jobs/instagram-sync.job.ts` |
| **Data Normalizer** | Normalização de dados | `lib/utils/instagram-normalizer.ts` |
| **Admin API** | Endpoints para gerenciamento | `app/api/admin/instagram/*` |

## Fluxo de Sincronização

1. **Trigger**: Job scheduler executa a cada 5 minutos
2. **Fetch**: Busca posts recentes do Instagram (últimas 24 horas)
3. **Metrics**: Extrai métricas para cada post
4. **Validate**: Valida consistência dos dados
5. **Normalize**: Normaliza para formato ALUA
6. **Create/Update**: Cria ou atualiza tasks no ClickUp
7. **Cache**: Armazena em cache para dashboard
8. **Log**: Registra resultado da sincronização

## Segurança

- ✅ Tokens criptografados com AES-256-GCM
- ✅ Armazenamento em variáveis de ambiente
- ✅ Sem exposição de tokens em logs/API
- ✅ Validação de permissões do Instagram
- ✅ Audit logging de todas as operações
- ✅ Autenticação JWT obrigatória

## Performance

- ✅ Cache de 5 minutos para posts
- ✅ Batch processing de métricas
- ✅ Rate limiting (max 5 requisições concorrentes)
- ✅ Retry com exponential backoff
- ✅ Circuit breaker para falhas cascata
- ✅ Índices de banco de dados otimizados

## Tratamento de Erros

- ✅ Retry automático com backoff exponencial
- ✅ Circuit breaker após 5 falhas consecutivas
- ✅ Logging estruturado (JSON)
- ✅ Alertas para erros críticos
- ✅ Fallback para valores padrão

## Escalabilidade

- ✅ Suporte para até 3 contas Instagram
- ✅ Processamento paralelo de contas
- ✅ Batch processing de posts
- ✅ Cache distribuído (Redis)
- ✅ Índices de banco de dados

## Dados Sincronizados

### Posts
- ID, Caption, Tipo de Mídia, URL da Mídia
- Timestamp, Permalink, Status

### Métricas
- Alcance (Reach)
- Engajamento (Engagement)
- Impressões (Impressions)
- Cliques (Clicks)
- Likes
- Comments

## Endpoints da API

### Admin Interface
```
POST   /api/admin/instagram/accounts          # Adicionar conta
GET    /api/admin/instagram/accounts          # Listar contas
PUT    /api/admin/instagram/accounts/:id      # Atualizar conta
DELETE /api/admin/instagram/accounts/:id      # Deletar conta
POST   /api/admin/instagram/sync              # Sincronizar manualmente
GET    /api/admin/instagram/sync-history      # Histórico de syncs
GET    /api/admin/instagram/status            # Status das contas
```

### Webhook (Future)
```
POST   /api/instagram/webhooks                # Receber eventos do Instagram
```

## Banco de Dados

### Tabelas Principais
- `instagram_credentials` - Credenciais criptografadas
- `instagram_post_mappings` - Mapeamento Instagram ↔ ClickUp
- `instagram_sync_history` - Histórico de sincronizações
- `instagram_audit_log` - Log de auditoria

### Índices
- Credenciais por account_id e is_active
- Mapeamentos por post_id e account_id
- Histórico por account_id e data

## Testes

- ✅ Testes unitários (Instagram Service, Credential Manager, Normalizer)
- ✅ Testes de integração (Sync Job, API endpoints)
- ✅ Testes de propriedades (Validação de métricas)
- ✅ Testes de performance (Benchmark)
- ✅ Testes de segurança (Criptografia)

## Monitoramento

### Métricas Coletadas
- Total de syncs, sucessos, falhas
- Duração média/máxima/mínima
- Posts processados, tasks criadas/atualizadas
- Taxa de sucesso/erro

### Alertas Configuráveis
- Taxa de erro > 20%
- Sync timeout > 2 minutos
- Expiração de credenciais
- Nenhum sync em 24 horas

## Roadmap Futuro

1. **Webhook Support** - Sincronização em tempo real
2. **Advanced Analytics** - Análises comparativas
3. **Scheduled Posts** - Suporte para posts agendados
4. **Multi-Language** - Captions em múltiplos idiomas
5. **Media Download** - Backup local de mídia
6. **Reels Support** - Suporte para Instagram Reels
7. **Stories Support** - Suporte para Instagram Stories

## Requisitos de Deployment

### Variáveis de Ambiente
```
INSTAGRAM_ENCRYPTION_KEY=<32-byte-hex-key>
INSTAGRAM_API_VERSION=v18.0
INSTAGRAM_GRAPH_API_URL=https://graph.instagram.com
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<random-token>
INSTAGRAM_WEBHOOK_SECRET=<webhook-secret>
```

### Dependências
```
npm install crypto-js node-cron axios
npm install --save-dev @types/node-cron
```

### Banco de Dados
- Supabase PostgreSQL
- Migrations para criar tabelas
- Índices para performance

## Conformidade

- ✅ LGPD - Dados criptografados, audit logging
- ✅ GDPR - Direito ao esquecimento (delete credential)
- ✅ Instagram ToS - Uso autorizado de API
- ✅ ClickUp ToS - Integração autorizada

## Documentação Incluída

1. **design.md** - Design técnico completo com diagramas
2. **implementation-guide.md** - Guia passo a passo de implementação
3. **architecture-details.md** - Detalhes de arquitetura e padrões
4. **testing-strategy.md** - Estratégia completa de testes
5. **DESIGN_SUMMARY.md** - Este documento

## Próximos Passos

1. Revisar e aprovar design
2. Implementar componentes core (Phase 1-2)
3. Implementar Sync Job (Phase 3)
4. Implementar API endpoints (Phase 4)
5. Implementar testes (Phase 5)
6. Deploy em staging
7. Testes E2E
8. Deploy em produção

## Contato

Para dúvidas sobre este design, consulte a documentação incluída ou entre em contato com o time de desenvolvimento.

---

**Versão**: 1.0  
**Data**: Janeiro 2024  
**Status**: Pronto para Implementação
