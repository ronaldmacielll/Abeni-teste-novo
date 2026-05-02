# Implementation Plan: Portal de Performance + Gestão Financeira

## Overview

Este plano de implementação detalha a construção de uma aplicação web dual-module (Performance + Financeiro) integrada ao ClickUp API, seguindo arquitetura BFF (Backend-for-Frontend) com Next.js 14+ App Router, TypeScript, TailwindCSS, Supabase Auth, e React Query.

**Stack Técnica:**
- Frontend: Next.js 14+ (App Router), React, TypeScript
- Backend: Next.js API Routes (BFF)
- Autenticação: Supabase Auth
- Integração: ClickUp REST API
- Estilo: TailwindCSS + Design System customizado
- Estado: React Query (TanStack Query)
- Testes: Jest, React Testing Library, fast-check (PBT), Playwright

**Arquitetura:**
- Multi-tenant com isolamento por client_id
- BFF pattern (nunca chamar ClickUp direto do frontend)
- Estrutura modular (/modules/performance, /modules/finance, /services/clickup)
- 17 propriedades de corretude implementadas com property-based testing

## Tasks

- [x] 1. Setup do Projeto e Configuração Inicial
  - Criar projeto Next.js 14+ com TypeScript e App Router
  - Configurar TailwindCSS com design system customizado
  - Criar estrutura de pastas modular (/app, /modules, /services, /lib)
  - Configurar Supabase client e variáveis de ambiente
  - Criar arquivo .env.example com todas as variáveis necessárias (CLICKUP_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_BASE_URL)
  - Configurar ESLint, Prettier, e TypeScript strict mode
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 2. Implementar Design System e Componentes Base
  - [x] 2.1 Criar sistema de cores no TailwindCSS
    - Definir paleta de cores primárias, secundárias, status, e neutras
    - Configurar cores no tailwind.config.ts
    - _Requirements: 14.5_
  
  - [x] 2.2 Criar componentes base do design system
    - Implementar Card component com variantes (default, elevated, outlined)
    - Implementar Button component com tamanhos (sm, md, lg) e variantes (primary, secondary, outline, ghost, danger)
    - Implementar Input component com estados (default, error, disabled)
    - Implementar Badge component com variantes de status (success, warning, danger, info, neutral)
    - Criar LoadingState component com spinner
    - Criar ErrorBoundary component
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.3_
  
  - [x] 2.3 Escrever testes unitários para componentes base
    - Testar renderização de variantes e estados
    - Testar interações do usuário (clicks, hover)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 3. Implementar Autenticação e Proteção de Rotas
  - [x] 3.1 Criar serviço de autenticação Supabase
    - Implementar AuthService com métodos signIn, signOut, getSession, refreshToken
    - Criar tipos TypeScript para User, Session, AuthResponse
    - Implementar extração de client_id do JWT
    - _Requirements: 1.1, 1.3, 1.4, 2.1_
  
  - [x] 3.2 Escrever property test para extração de client_id do JWT
    - **Property 1: JWT Client ID Extraction**
    - **Validates: Requirements 2.1**
  
  - [x] 3.3 Criar página de login (/app/login/page.tsx)
    - Implementar formulário com email e senha
    - Adicionar validação de campos
    - Implementar redirecionamento após login bem-sucedido
    - Exibir mensagens de erro para credenciais inválidas
    - _Requirements: 1.1, 1.2, 1.5, 15.4_
  
  - [x] 3.4 Implementar middleware de autenticação
    - Criar middleware para validar JWT em todas as rotas protegidas
    - Implementar redirecionamento para /login se não autenticado
    - Extrair e validar client_id do JWT
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 3.5 Criar contexto de autenticação (useAuth hook)
    - Implementar AuthContext com estado do usuário
    - Criar hook useAuth para acesso ao contexto
    - Implementar refresh automático de token
    - _Requirements: 1.4, 16.4_
  
  - [x] 3.6 Escrever testes de integração para fluxo de autenticação
    - Testar login com credenciais válidas e inválidas
    - Testar refresh de token expirado
    - Testar redirecionamento após autenticação
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4. Checkpoint - Autenticação Funcional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar Serviço ClickUp e Normalização de Dados
  - [x] 5.1 Criar ClickUp API client
    - Implementar ClickUpService com métodos getTasksByList, createTask, updateTask, getCustomFields
    - Configurar headers de autenticação com API key
    - Implementar tratamento de erros e retry logic para rate limiting
    - Criar tipos TypeScript para ClickUpTask, CustomField, Attachment
    - _Requirements: 12.1, 12.3, 12.4, 15.1, 15.2_
  
  - [x] 5.2 Implementar Data Normalizer para Posts
    - Criar função normalizePost que transforma ClickUpTask em Post
    - Mapear custom fields (Alcance, Engajamento, Impressões, Cliques, Status, Imagem)
    - Aplicar valores padrão para campos ausentes (0 para números, null para opcionais)
    - Converter datas para ISO 8601
    - Remover metadados desnecessários do ClickUp
    - _Requirements: 3.2, 17.2, 17.3, 17.4, 17.5, 20.1_
  
  - [x] 5.3 Escrever property test para normalização de Posts
    - **Property 4: Post Normalization Completeness**
    - **Validates: Requirements 3.2, 3.3, 17.2, 17.3, 17.4, 17.5, 20.1**
  
  - [x] 5.4 Implementar Data Normalizer para Transactions
    - Criar função normalizeTransaction que transforma ClickUpTask em Transaction
    - Mapear custom fields (Valor, Tipo, Status, Data_de_Vencimento, Impostos_Taxas, Parcelamento)
    - Aplicar valores padrão para campos ausentes
    - Converter datas para ISO 8601
    - Remover metadados desnecessários do ClickUp
    - _Requirements: 6.2, 6.3, 17.2, 17.3, 17.4, 17.5, 20.1_
  
  - [x] 5.5 Escrever property test para normalização de Transactions
    - **Property 6: Transaction Normalization Completeness**
    - **Validates: Requirements 6.2, 6.3, 17.2, 17.3, 17.4, 17.5, 20.1**
  
  - [x] 5.6 Implementar filtros de multi-tenancy
    - Criar função filterByClientId que filtra dados por client_id
    - Implementar validação de autorização (JWT client_id vs resource client_id)
    - _Requirements: 2.2, 2.3_
  
  - [x] 5.7 Escrever property tests para multi-tenancy
    - **Property 2: Multi-Tenant Data Filtering**
    - **Property 3: Authorization Enforcement**
    - **Validates: Requirements 2.2, 2.3**

- [x] 6. Implementar BFF - API Routes para Performance
  - [x] 6.1 Criar endpoint GET /api/posts
    - Validar JWT e extrair client_id
    - Implementar filtro por período (week, month)
    - Chamar ClickUp API para buscar tasks da lista de performance
    - Normalizar dados usando normalizePost
    - Filtrar por client_id
    - Retornar JSON com posts e metadata
    - Implementar cache com React Query (5 minutos stale time)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.2, 5.3, 12.5, 13.2, 13.4_
  
  - [x] 6.2 Escrever property test para filtro de data
    - **Property 5: Date Range Filtering**
    - **Validates: Requirements 5.3**
  
  - [x] 6.3 Escrever testes de integração para /api/posts
    - Testar resposta com JWT válido
    - Testar filtro por período
    - Testar erro 401 para JWT inválido
    - Testar erro 403 para client_id não autorizado
    - Testar erro 502 quando ClickUp API falha
    - _Requirements: 3.1, 3.4, 5.4, 15.1, 15.2, 15.5_

- [x] 7. Implementar Módulo Performance - Frontend
  - [x] 7.1 Criar tipos TypeScript para Performance Module
    - Definir interfaces Post, PostStatus, PostMetrics
    - Criar tipos para filtros e período
    - _Requirements: 18.3_
  
  - [x] 7.2 Criar hook usePerformanceData
    - Implementar hook com React Query para buscar posts
    - Implementar cache e revalidação em background
    - Implementar tratamento de erros e retry
    - _Requirements: 13.2, 13.3, 15.3_
  
  - [x] 7.3 Criar componente PostCard
    - Renderizar thumbnail com fallback para imagem ausente
    - Exibir badge de status com cores apropriadas
    - Exibir métricas (Alcance, Engajamento, Impressões, Cliques)
    - Implementar layout responsivo
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 13.5, 14.1, 14.2_
  
  - [x] 7.4 Criar componente MetricDisplay
    - Renderizar label, valor, e ícone
    - Suportar formatação (number, percentage)
    - _Requirements: 4.2_
  
  - [x] 7.5 Criar componente PeriodFilter
    - Implementar toggle entre week e month
    - Persistir seleção no estado da sessão
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [x] 7.6 Criar página Performance Dashboard (/app/(dashboard)/performance/page.tsx)
    - Integrar PostCard, MetricDisplay, e PeriodFilter
    - Implementar grid responsivo (1 coluna mobile, 2 tablet, 3-4 desktop)
    - Exibir loading state durante carregamento
    - Exibir erro com opção de retry
    - _Requirements: 4.1, 4.5, 5.1, 5.2, 5.4, 13.1, 14.1, 14.2, 14.3, 14.4, 15.3_
  
  - [x] 7.7 Escrever testes unitários para componentes Performance
    - Testar renderização de PostCard com diferentes status
    - Testar PeriodFilter com mudança de período
    - Testar estados de loading e erro
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

- [x] 8. Checkpoint - Módulo Performance Funcional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implementar Cálculos Financeiros (Funções Puras)
  - [x] 9.1 Criar função calculateGrossRevenue
    - Implementar cálculo: soma de Valor onde Tipo === "Entrada"
    - Filtrar por período se fornecido
    - _Requirements: 7.1_
  
  - [x] 9.2 Escrever property test para calculateGrossRevenue
    - **Property 7: Gross Revenue Calculation**
    - **Validates: Requirements 7.1**
  
  - [x] 9.3 Criar função calculateNetRevenue
    - Implementar cálculo: Faturamento Bruto - soma de Impostos_Taxas
    - _Requirements: 7.2_
  
  - [x] 9.4 Escrever property test para calculateNetRevenue
    - **Property 8: Net Revenue Calculation**
    - **Validates: Requirements 7.2**
  
  - [x] 9.5 Criar função calculateBalance
    - Implementar cálculo: soma de Entradas Pagas - soma de Saídas Pagas
    - _Requirements: 7.3_
  
  - [x] 9.6 Escrever property test para calculateBalance
    - **Property 9: Current Balance Calculation**
    - **Validates: Requirements 7.3**
  
  - [x] 9.7 Criar função getUpcomingTransactions
    - Filtrar transações onde Data_de_Vencimento > hoje
    - Ordenar por data de vencimento
    - _Requirements: 9.1, 8.4_
  
  - [x] 9.8 Escrever property tests para getUpcomingTransactions
    - **Property 11: Future Transaction Filtering**
    - **Property 10: Transaction Sorting Invariant**
    - **Validates: Requirements 9.1, 8.4**
  
  - [x] 9.9 Criar função calculateProjectedIncome
    - Calcular soma de Entradas futuras
    - _Requirements: 9.2_
  
  - [ ] 9.10 Escrever property test para calculateProjectedIncome
    - **Property 12: Projected Income Calculation**
    - **Validates: Requirements 9.2**
  
  - [x] 9.11 Criar função calculateProjectedExpenses
    - Calcular soma de Saídas futuras
    - _Requirements: 9.3_
  
  - [ ] 9.12 Escrever property test para calculateProjectedExpenses
    - **Property 13: Projected Expenses Calculation**
    - **Validates: Requirements 9.3**
  
  - [x] 9.13 Criar função parseParcelamento
    - Extrair current e total de string "X/Y"
    - Validar formato e range (1 ≤ X ≤ Y)
    - _Requirements: 10.1_
  
  - [x] 9.14 Escrever property test para parseParcelamento
    - **Property 14: Parcelamento Parsing**
    - **Validates: Requirements 10.1**
  
  - [x] 9.15 Criar função calculatePerInstallmentValue
    - Calcular Valor / total de parcelas
    - _Requirements: 10.3_
  
  - [x] 9.16 Escrever property test para calculatePerInstallmentValue
    - **Property 15: Per-Installment Value Calculation**
    - **Validates: Requirements 10.3**
  
  - [x] 9.17 Criar função processInstallments
    - Distribuir parcelas restantes em meses futuros
    - Gerar entradas separadas para cada parcela
    - _Requirements: 10.4, 10.5_
  
  - [x] 9.18 Escrever property test para processInstallments
    - **Property 16: Installment Distribution**
    - **Validates: Requirements 10.4, 10.5**

- [x] 10. Implementar BFF - API Routes para Financeiro
  - [x] 10.1 Criar endpoint GET /api/transactions
    - Validar JWT e extrair client_id
    - Implementar filtro por período (week, month, year)
    - Chamar ClickUp API para buscar tasks da lista financeira
    - Normalizar dados usando normalizeTransaction
    - Filtrar por client_id
    - Executar cálculos (gross revenue, net revenue, balance, projections)
    - Processar parcelamentos
    - Retornar JSON com transactions, summary, e projections
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 9.1, 9.2, 9.3, 10.4_
  
  - [x] 10.2 Criar endpoint POST /api/transactions
    - Validar JWT e extrair client_id
    - Validar campos obrigatórios (Valor, Tipo, Data_de_Vencimento, Status)
    - Validar tipos de dados e formatos
    - Chamar ClickUp API para criar task
    - Retornar sucesso com transaction criada
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 10.3 Escrever property test para validação de input
    - **Property 17: Input Validation Completeness**
    - **Validates: Requirements 11.3**
  
  - [x] 10.4 Escrever testes de integração para /api/transactions
    - Testar GET com JWT válido e filtros
    - Testar POST com dados válidos
    - Testar validação de campos obrigatórios
    - Testar erro 401 para JWT inválido
    - Testar erro 400 para dados inválidos
    - _Requirements: 6.1, 6.4, 11.1, 11.3, 11.5, 15.1, 15.2_

- [x] 11. Implementar Módulo Financeiro - Frontend
  - [x] 11.1 Criar tipos TypeScript para Financial Module
    - Definir interfaces Transaction, TransactionType, TransactionStatus, Installment
    - Definir interfaces FinancialSummary, CashFlowProjection
    - _Requirements: 18.3_
  
  - [x] 11.2 Criar hook useFinancialData
    - Implementar hook com React Query para buscar transactions
    - Implementar cache e revalidação
    - Implementar tratamento de erros
    - _Requirements: 13.2, 13.3, 15.3_
  
  - [x] 11.3 Criar componente SummaryCard
    - Renderizar título, valor formatado em BRL, e trend
    - Suportar variantes (primary, success, warning, danger)
    - _Requirements: 7.4_
  
  - [x] 11.4 Criar componente TransactionList
    - Renderizar lista de transações com indicadores de status
    - Implementar ordenação por data de vencimento
    - Exibir indicador vermelho para "Atrasado"
    - Exibir indicador amarelo para "Pendente"
    - Exibir indicador verde para "Pago"
    - Destacar transações com vencimento hoje
    - Exibir informação de parcelamento quando presente
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.2_
  
  - [x] 11.5 Criar componente TransactionForm
    - Implementar formulário com campos: Valor, Tipo, Data_de_Vencimento, Status, Impostos_Taxas, Parcelamento
    - Adicionar validação de campos obrigatórios
    - Implementar submit com POST para /api/transactions
    - Exibir mensagens de erro inline
    - Atualizar lista após criação bem-sucedida
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [x] 11.6 Criar página Financial Dashboard (/app/(dashboard)/finance/page.tsx)
    - Exibir 3 SummaryCards: Saldo Atual, Faturamento Bruto, Faturamento Líquido
    - Exibir cards de projeção: Entradas Previstas, Saídas Previstas
    - Integrar TransactionList
    - Integrar TransactionForm (modal ou drawer)
    - Implementar layout responsivo
    - Exibir loading state e error state
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 9.1, 9.2, 9.3, 9.4, 14.1, 14.2, 14.3, 14.4, 15.3_
  
  - [x] 11.7 Escrever testes unitários para componentes Financial
    - Testar SummaryCard com diferentes variantes
    - Testar TransactionList com diferentes status
    - Testar TransactionForm com validação
    - _Requirements: 7.4, 8.1, 8.2, 8.3, 11.1_

- [x] 12. Checkpoint - Módulo Financeiro Funcional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implementar Navegação e Layout Compartilhado
  - [x] 13.1 Criar componente Navigation
    - Implementar menu com links para Performance e Finance
    - Destacar módulo ativo
    - Exibir informações do usuário
    - Adicionar botão de logout
    - Condicionar visibilidade de módulos por role (client vs internal)
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [x] 13.2 Criar layout compartilhado (/app/(dashboard)/layout.tsx)
    - Integrar Navigation component
    - Implementar sidebar e header
    - Aplicar estilos do design system
    - Garantir navegação client-side sem reloads
    - _Requirements: 16.1, 16.5_
  
  - [x] 13.3 Escrever testes unitários para Navigation
    - Testar renderização de links
    - Testar highlight do módulo ativo
    - Testar visibilidade condicional por role
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 14. Implementar Tratamento de Erros e Estados de Loading
  - [x] 14.1 Criar componente ErrorNotification
    - Exibir toast com mensagem de erro
    - Incluir botão "Tentar Novamente"
    - Suportar diferentes tipos de erro (auth, network, validation)
    - _Requirements: 15.2, 15.3_
  
  - [x] 14.2 Implementar error boundaries em módulos
    - Adicionar ErrorBoundary em Performance e Finance modules
    - Exibir fallback UI amigável
    - Logar erros para monitoramento
    - _Requirements: 15.1, 15.2_
  
  - [x] 14.3 Implementar retry logic com exponential backoff
    - Configurar React Query com retry para erros transientes (408, 429, 502, 503, 504)
    - Implementar backoff: [1000ms, 2000ms, 4000ms]
    - _Requirements: 13.3, 15.3_
  
  - [x] 14.4 Implementar loading states consistentes
    - Criar LoadingSpinner component
    - Adicionar skeleton loaders para cards
    - Exibir loading durante fetch de dados
    - _Requirements: 13.1, 13.3_

- [x] 15. Implementar Otimizações de Performance
  - [x] 15.1 Configurar React Query cache strategy
    - Definir staleTime: 5 minutos
    - Definir cacheTime: 10 minutos
    - Implementar background revalidation
    - _Requirements: 13.2, 13.3_
  
  - [x] 15.2 Implementar compressão de resposta no BFF
    - Adicionar middleware de compressão para JSON > 1KB
    - _Requirements: 13.4_
  
  - [x] 15.3 Otimizar imagens com Next.js Image
    - Usar next/image para thumbnails de posts
    - Implementar lazy loading
    - Configurar image optimization
    - _Requirements: 13.5_
  
  - [x] 15.4 Implementar code splitting por módulo
    - Usar dynamic imports para Performance e Finance modules
    - Reduzir bundle size inicial
    - _Requirements: 13.1_

- [x] 16. Implementar Database Schema no Supabase
  - [x] 16.1 Criar tabela profiles
    - Definir schema: id, email, client_id, role, metadata, created_at, updated_at
    - Criar índices em client_id e email
    - _Requirements: 2.1, 18.1_
  
  - [x] 16.2 Criar tabela client_config
    - Definir schema: client_id, clickup_performance_list_id, clickup_financial_list_id, field_mappings, created_at, updated_at
    - _Requirements: 18.1, 20.4_
  
  - [x] 16.3 Configurar Row Level Security (RLS)
    - Implementar políticas de acesso por client_id
    - Garantir isolamento multi-tenant no banco
    - _Requirements: 2.2, 2.3_

- [x] 17. Setup de Testes e Configuração de CI
  - [x] 17.1 Configurar Jest e React Testing Library
    - Criar jest.config.js
    - Configurar test environment
    - Adicionar scripts de teste no package.json
    - _Requirements: Testing Strategy_
  
  - [x] 17.2 Configurar fast-check para property-based testing
    - Instalar fast-check
    - Criar generators customizados (ClickUpTask, Transaction, JWT)
    - Configurar 100 iterações por property test
    - _Requirements: Testing Strategy - Property-Based Testing_
  
  - [x] 17.3 Configurar Playwright para E2E tests
    - Instalar Playwright
    - Configurar browsers (Chrome, Firefox, Safari)
    - Criar testes E2E para fluxos críticos (login, performance dashboard, financial dashboard)
    - _Requirements: Testing Strategy - End-to-End Testing_
  
  - [x] 17.4 Escrever testes E2E para fluxos principais
    - Testar fluxo de login → performance dashboard
    - Testar fluxo de login → financial dashboard → criar transação
    - Testar filtros e navegação
    - _Requirements: Testing Strategy - E2E Test Coverage_

- [x] 18. Checkpoint Final - Sistema Completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Documentação e Deploy
  - [x] 19.1 Criar README.md
    - Documentar setup do projeto
    - Documentar variáveis de ambiente
    - Documentar estrutura de pastas
    - Documentar comandos de desenvolvimento e build
    - _Requirements: 19.3_
  
  - [x] 19.2 Criar documentação de API
    - Documentar endpoints /api/posts e /api/transactions
    - Documentar request/response schemas
    - Documentar códigos de erro
    - _Requirements: 12.5, 15.2_
  
  - [x] 19.3 Configurar deploy na Vercel
    - Conectar repositório Git
    - Configurar variáveis de ambiente
    - Configurar domínio customizado (se aplicável)
    - Testar deploy em staging
    - _Requirements: 19.1, 19.2, 19.4_

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude (17 propriedades no total)
- Unit tests validam exemplos específicos e edge cases
- Todas as funções de cálculo financeiro são puras e testáveis com PBT
- A arquitetura BFF garante segurança (API key nunca exposta ao cliente)
- Multi-tenancy é garantido por filtros de client_id em todas as queries
- Design system customizado garante consistência visual
- React Query implementa cache agressivo com revalidação em background
