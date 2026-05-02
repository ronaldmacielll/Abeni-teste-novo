# Portal de Performance + Gestão Financeira

Uma aplicação web dual-module que integra com a API do ClickUp para fornecer:
1. **Portal de Performance**: Dashboard voltado para clientes exibindo métricas de posts de redes sociais em tempo real
2. **Gestão Financeira**: Sistema interno de controle de fluxo de caixa para operações financeiras da agência

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Build e Deploy](#build-e-deploy)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Documentação da API](#documentação-da-api)
- [Contribuindo](#contribuindo)

## 🎯 Visão Geral

O Portal de Performance + Gestão Financeira é uma aplicação Next.js que segue o padrão **Backend-for-Frontend (BFF)**, onde todas as interações com a API do ClickUp são tratadas no lado do servidor através de Next.js API Routes, garantindo segurança e controle de acesso adequado através de isolamento multi-tenant por client_id.

### Características Principais

- ✅ **Autenticação Segura**: Integração com Supabase Auth
- ✅ **Multi-Tenancy**: Isolamento de dados por client_id
- ✅ **BFF Pattern**: API key do ClickUp nunca exposta ao cliente
- ✅ **Cache Inteligente**: React Query com revalidação em background
- ✅ **Design Responsivo**: Funciona em mobile, tablet e desktop
- ✅ **Property-Based Testing**: 17 propriedades de corretude implementadas
- ✅ **Testes E2E**: Cobertura completa com Playwright

## 🛠 Stack Técnica

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS + Design System customizado
- **Estado**: React Query (TanStack Query)
- **Ícones**: Lucide React

### Backend
- **API Layer**: Next.js API Routes (serverless)
- **Autenticação**: Supabase Auth
- **Integração**: ClickUp REST API
- **Validação**: JWT (jose library)

### Testes
- **Unit Tests**: Jest + React Testing Library
- **Property-Based Tests**: fast-check
- **E2E Tests**: Playwright
- **Coverage**: Jest coverage reports

### DevOps
- **Deployment**: Vercel (recomendado)
- **CI/CD**: GitHub Actions (opcional)
- **Linting**: ESLint + Prettier

## 🏗 Arquitetura

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS + JWT
       ▼
┌─────────────────────────────┐
│   Next.js Application       │
│  ┌─────────────────────┐   │
│  │  Frontend (React)   │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │  API Routes (BFF)   │   │
│  │  - /api/posts       │   │
│  │  - /api/transactions│   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │  ClickUp Service    │   │
│  └──────────┬──────────┘   │
└─────────────┼───────────────┘
              │ API Key
              ▼
     ┌────────────────┐
     │  ClickUp API   │
     └────────────────┘
```

### Padrão Multi-Tenant

Cada requisição é filtrada por `client_id` extraído do JWT token, garantindo que usuários acessem apenas seus próprios dados.

## 📦 Pré-requisitos

- **Node.js**: 18.x ou superior
- **npm**: 9.x ou superior (ou yarn/pnpm)
- **Conta ClickUp**: Com API key e listas configuradas
- **Conta Supabase**: Para autenticação
- **Git**: Para controle de versão

## 🚀 Instalação

1. **Clone o repositório**

```bash
git clone <repository-url>
cd portal-performance-gestao-financeira
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais (veja [Configuração](#configuração))

4. **Execute o servidor de desenvolvimento**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

#### ClickUp API Configuration

```env
# Obtenha sua API key em: https://app.clickup.com/settings/apps
CLICKUP_API_KEY=pk_your_api_key_here

# IDs das listas do ClickUp (encontre na URL da lista)
CLICKUP_PERFORMANCE_LIST_ID=123456789
CLICKUP_FINANCIAL_LIST_ID=987654321
```

#### Supabase Configuration

```env
# Encontre em: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Application Configuration

```env
# URL base da aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Secret para validação de JWT (gere com: openssl rand -base64 32)
JWT_SECRET=your_random_secret_here

# Ambiente
NODE_ENV=development
```

#### ClickUp Custom Field IDs (Opcional)

Se você quiser mapear custom fields específicos do ClickUp:

```env
CLICKUP_FIELD_ALCANCE=field_id_here
CLICKUP_FIELD_ENGAJAMENTO=field_id_here
CLICKUP_FIELD_IMPRESSOES=field_id_here
CLICKUP_FIELD_CLIQUES=field_id_here
CLICKUP_FIELD_STATUS=field_id_here
CLICKUP_FIELD_IMAGEM=field_id_here
```

### Configuração do Supabase

1. **Crie um projeto no Supabase**
2. **Configure a tabela de profiles**:

```sql
-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'internal')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

3. **Configure a tabela de client_config**:

```sql
-- Tabela de configuração por cliente
CREATE TABLE public.client_config (
  client_id TEXT PRIMARY KEY,
  clickup_performance_list_id TEXT NOT NULL,
  clickup_financial_list_id TEXT,
  field_mappings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuração do ClickUp

1. **Crie duas listas no ClickUp**:
   - Lista de Performance (para posts de redes sociais)
   - Lista Financeira (para transações)

2. **Configure Custom Fields na lista de Performance**:
   - Alcance (Number)
   - Engajamento (Number)
   - Impressões (Number)
   - Cliques (Number)
   - Status (Dropdown: Publicado, Agendado, Rascunho, Arquivado)
   - Imagem (URL ou Attachment)

3. **Configure Custom Fields na lista Financeira**:
   - Valor (Number)
   - Tipo (Dropdown: Entrada, Saída)
   - Status (Dropdown: Pago, Pendente, Atrasado)
   - Data_de_Vencimento (Date)
   - Impostos_Taxas (Number)
   - Parcelamento (Text, formato: "3/10")

## 💻 Desenvolvimento

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)

# Build
npm run build            # Cria build de produção
npm run start            # Inicia servidor de produção

# Linting e Formatação
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige problemas do ESLint automaticamente
npm run format           # Formata código com Prettier
npm run format:check     # Verifica formatação sem modificar

# Type Checking
npm run type-check       # Verifica tipos TypeScript sem gerar arquivos

# Testes
npm run test             # Executa testes unitários
npm run test:watch       # Executa testes em modo watch
npm run test:coverage    # Gera relatório de cobertura
npm run test:e2e         # Executa testes E2E com Playwright
npm run test:e2e:ui      # Executa testes E2E com UI interativa
```

### Workflow de Desenvolvimento

1. **Crie uma branch para sua feature**
```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolva e teste localmente**
```bash
npm run dev
npm run test
npm run test:e2e
```

3. **Verifique linting e tipos**
```bash
npm run lint
npm run type-check
```

4. **Commit suas mudanças**
```bash
git add .
git commit -m "feat: descrição da feature"
```

5. **Push e crie Pull Request**
```bash
git push origin feature/nome-da-feature
```

## 🧪 Testes

### Testes Unitários

```bash
# Executar todos os testes
npm run test

# Executar em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

Os testes unitários cobrem:
- Componentes React
- Hooks customizados
- Funções de cálculo financeiro
- Normalização de dados
- Property-based tests (17 propriedades)

### Testes E2E

```bash
# Executar testes E2E
npm run test:e2e

# Executar com UI interativa
npm run test:e2e:ui
```

Os testes E2E cobrem:
- Fluxo de autenticação
- Dashboard de Performance
- Dashboard Financeiro
- Criação de transações
- Filtros e navegação

### Property-Based Testing

O projeto implementa 17 propriedades de corretude usando fast-check:

1. JWT Client ID Extraction
2. Multi-Tenant Data Filtering
3. Authorization Enforcement
4. Post Normalization Completeness
5. Date Range Filtering
6. Transaction Normalization Completeness
7. Gross Revenue Calculation
8. Net Revenue Calculation
9. Current Balance Calculation
10. Transaction Sorting Invariant
11. Future Transaction Filtering
12. Projected Income Calculation
13. Projected Expenses Calculation
14. Parcelamento Parsing
15. Per-Installment Value Calculation
16. Installment Distribution
17. Input Validation Completeness

## 🚢 Build e Deploy

### Build Local

```bash
# Criar build de produção
npm run build

# Testar build localmente
npm run start
```

### Deploy na Vercel (Recomendado)

Este projeto está otimizado para deploy na Vercel com configuração completa incluída.

#### Documentação Completa de Deploy

📚 **[Guia Completo de Deploy na Vercel](./docs/VERCEL_DEPLOYMENT.md)**
- Configuração inicial e conexão do repositório Git
- Configuração detalhada de variáveis de ambiente
- Deploy via Dashboard e CLI
- Configuração de domínio customizado
- Ambientes de staging e produção
- Monitoramento e troubleshooting

📋 **[Guia de Variáveis de Ambiente](./docs/ENVIRONMENT_VARIABLES.md)**
- Lista completa de todas as variáveis obrigatórias e opcionais
- Instruções de como obter cada credencial
- Boas práticas de segurança
- Validação e troubleshooting

🔄 **[Workflow de Deploy](./docs/DEPLOYMENT_WORKFLOW.md)**
- Estratégia de branches (main, staging, feature)
- Workflow de staging e produção
- Processo de hotfix e rollback
- CI/CD com GitHub Actions
- Checklist completo de deploy

#### Quick Start

1. **Instale a Vercel CLI**
```bash
npm install -g vercel
```

2. **Login na Vercel**
```bash
vercel login
```

3. **Configure variáveis de ambiente**
   - Veja [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) para lista completa
   - Configure via Dashboard ou CLI

4. **Deploy**
```bash
# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

#### Deploy Automático via GitHub

1. **Conecte seu repositório à Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "Import Project"
   - Selecione seu repositório GitHub

2. **Configure variáveis de ambiente**
   - Siga o guia em [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)

3. **Deploy automático**
   - Cada push para `main` cria um deploy de produção
   - Cada PR cria um deploy de preview

### Arquivos de Configuração

O projeto inclui:
- `vercel.json` - Configuração otimizada para Vercel
- `next.config.js` - Configuração do Next.js com otimizações
- `.env.example` - Template de variáveis de ambiente

### Variáveis de Ambiente Essenciais

```env
# ClickUp API
CLICKUP_API_KEY=<production_api_key>
CLICKUP_PERFORMANCE_LIST_ID=<production_list_id>
CLICKUP_FINANCIAL_LIST_ID=<production_list_id>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<production_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
JWT_SECRET=<strong_random_secret>
NODE_ENV=production
```

Para lista completa e instruções detalhadas, consulte [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md).

## 📁 Estrutura de Pastas

```
portal-performance-gestao-financeira/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Grupo de rotas do dashboard
│   │   ├── performance/          # Módulo de Performance
│   │   │   ├── page.tsx          # Página do dashboard de performance
│   │   │   └── PerformancePageContent.tsx
│   │   ├── finance/              # Módulo Financeiro
│   │   │   ├── page.tsx          # Página do dashboard financeiro
│   │   │   └── FinancePageContent.tsx
│   │   └── layout.tsx            # Layout compartilhado do dashboard
│   ├── api/                      # API Routes (BFF Layer)
│   │   ├── posts/                # Endpoint de posts
│   │   │   └── route.ts
│   │   └── transactions/         # Endpoint de transações
│   │       └── route.ts
│   ├── login/                    # Página de login
│   │   └── page.tsx
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página inicial
│   └── globals.css               # Estilos globais
│
├── modules/                      # Módulos de domínio
│   ├── performance/              # Módulo de Performance
│   │   ├── components/           # Componentes específicos
│   │   │   ├── PostCard.tsx
│   │   │   ├── MetricDisplay.tsx
│   │   │   └── PeriodFilter.tsx
│   │   ├── hooks/                # Hooks customizados
│   │   │   └── usePerformanceData.ts
│   │   └── types/                # Tipos TypeScript
│   │       └── post.types.ts
│   │
│   ├── finance/                  # Módulo Financeiro
│   │   ├── components/           # Componentes específicos
│   │   │   ├── TransactionList.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   └── TransactionForm.tsx
│   │   ├── hooks/                # Hooks customizados
│   │   │   └── useFinancialData.ts
│   │   ├── utils/                # Funções utilitárias
│   │   │   └── calculations.ts
│   │   └── types/                # Tipos TypeScript
│   │       └── transaction.types.ts
│   │
│   └── shared/                   # Componentes compartilhados
│       ├── components/
│       │   ├── Navigation.tsx
│       │   ├── ErrorBoundary.tsx
│       │   └── LoadingState.tsx
│       └── hooks/
│           └── useAuth.ts
│
├── services/                     # Serviços externos
│   ├── clickup/                  # Integração ClickUp
│   │   ├── client.ts             # Cliente da API
│   │   ├── normalizer.ts         # Normalização de dados
│   │   └── types.ts              # Tipos da API
│   └── auth/                     # Autenticação
│       └── supabase.ts           # Cliente Supabase
│
├── lib/                          # Bibliotecas e utilitários
│   ├── design-system/            # Design System
│   │   ├── components/           # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   ├── colors.ts             # Paleta de cores
│   │   ├── typography.ts         # Sistema de tipografia
│   │   └── spacing.ts            # Escala de espaçamento
│   ├── api/                      # Utilitários de API
│   │   └── compression.ts
│   └── env.ts                    # Validação de variáveis de ambiente
│
├── e2e/                          # Testes E2E (Playwright)
│   ├── auth.spec.ts
│   ├── performance-dashboard.spec.ts
│   └── financial-dashboard.spec.ts
│
├── docs/                         # Documentação adicional
│   └── API.md                    # Documentação da API
│
├── .kiro/                        # Configuração Kiro
│   └── specs/                    # Especificações
│
├── middleware.ts                 # Middleware de autenticação
├── jest.config.js                # Configuração Jest
├── jest.setup.js                 # Setup Jest
├── playwright.config.ts          # Configuração Playwright
├── tailwind.config.ts            # Configuração TailwindCSS
├── tsconfig.json                 # Configuração TypeScript
├── .env.example                  # Exemplo de variáveis de ambiente
├── .env.local                    # Variáveis locais (não commitado)
├── .eslintrc.json                # Configuração ESLint
├── .prettierrc                   # Configuração Prettier
└── package.json                  # Dependências e scripts
```

### Convenções de Nomenclatura

- **Componentes**: PascalCase (ex: `PostCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `usePerformanceData.ts`)
- **Utilitários**: camelCase (ex: `calculations.ts`)
- **Tipos**: PascalCase com sufixo (ex: `post.types.ts`)
- **Testes**: mesmo nome do arquivo + `.test.tsx` ou `.spec.ts`

## 📚 Documentação da API

Veja [docs/API.md](./docs/API.md) para documentação completa dos endpoints.

### Endpoints Principais

#### GET /api/posts
Retorna posts de redes sociais com métricas de performance.

#### GET /api/transactions
Retorna transações financeiras com cálculos agregados.

#### POST /api/transactions
Cria uma nova transação financeira.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Tarefas de manutenção

## 📄 Licença

Este projeto é privado e proprietário.

## 🆘 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Next.js, React, e TypeScript**
