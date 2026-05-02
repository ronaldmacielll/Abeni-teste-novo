# Setup Guide - Portal de Performance + Gestão Financeira

Este guia detalha o processo completo de configuração do projeto.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.x ou superior ([Download](https://nodejs.org/))
- **npm** 9.x ou superior (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))
- Conta no **Supabase** ([Criar conta](https://supabase.com/))
- **ClickUp API Key** ([Obter API Key](https://clickup.com/api))

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd portal-performance-gestao-financeira
```

### 2. Instale as dependências

```bash
npm install
```

Este comando instalará todas as dependências listadas no `package.json`, incluindo:
- Next.js 14+
- React 18
- TypeScript
- TailwindCSS
- Supabase Client
- React Query
- Jest, Playwright, fast-check (para testes)

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com suas credenciais:

```env
# ClickUp API Configuration
CLICKUP_API_KEY=pk_your_clickup_api_key_here
CLICKUP_PERFORMANCE_LIST_ID=123456789
CLICKUP_FINANCIAL_LIST_ID=987654321

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET=your_secure_random_string_here

# Environment
NODE_ENV=development
```

#### Como obter as credenciais:

**ClickUp API Key:**
1. Acesse [ClickUp Settings](https://app.clickup.com/settings/apps)
2. Clique em "Apps" → "API Token"
3. Gere um novo token
4. Copie o token (começa com `pk_`)

**ClickUp List IDs:**
1. Abra a lista no ClickUp
2. O ID está na URL: `https://app.clickup.com/LIST_ID/v/l/...`

**Supabase Credentials:**
1. Crie um projeto no [Supabase](https://supabase.com/)
2. Vá em Settings → API
3. Copie a "Project URL" e "anon public" key

**JWT Secret:**
Gere uma string aleatória segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Configuração do Banco de Dados

### Opção 1: Usar Migrations (Recomendado)

O projeto inclui migrations SQL prontas para uso. Esta é a forma recomendada de configurar o banco de dados.

#### Usando Supabase Dashboard

1. Acesse o Supabase SQL Editor no seu projeto
2. Execute cada migration na ordem:

```bash
# 1. Criar tabela profiles
supabase/migrations/20240101000000_create_profiles_table.sql

# 2. Criar tabela client_config
supabase/migrations/20240101000001_create_client_config_table.sql

# 3. Configurar Row Level Security
supabase/migrations/20240101000002_configure_row_level_security.sql
```

#### Usando Supabase CLI

```bash
# Instalar Supabase CLI (se necessário)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref your-project-ref

# Aplicar todas as migrations
supabase db push
```

#### Verificar Instalação

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'client_config');

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'client_config');

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

📚 **Documentação Completa**: Veja `supabase/migrations/README.md` para instruções detalhadas.

### Opção 2: Configuração Manual

Se preferir configurar manualmente, veja os arquivos de migration em `supabase/migrations/` para o SQL completo.

### Inserir Dados de Teste

O projeto inclui um arquivo de seed data pronto para uso:

```bash
# Usando Supabase CLI
supabase db execute -f supabase/seed.sql

# Ou copie o conteúdo de supabase/seed.sql e execute no SQL Editor
```

**Importante**: Antes de executar o seed.sql:
1. Crie usuários no Supabase Auth
2. Substitua os UUIDs de placeholder pelos IDs reais dos usuários
3. Substitua os IDs das listas do ClickUp
4. Substitua os IDs dos custom fields do ClickUp

📚 **Documentação**: Veja `supabase/seed.sql` para instruções detalhadas.

## 🎯 Configuração do ClickUp

### 1. Crie as listas

Crie duas listas no ClickUp:
- **Performance List**: Para posts de redes sociais
- **Financial List**: Para transações financeiras

### 2. Configure Custom Fields

**Performance List:**
- Alcance (Number)
- Engajamento (Number)
- Impressões (Number)
- Cliques (Number)
- Status (Dropdown: Publicado, Agendado, Rascunho, Arquivado)
- Imagem (Attachment)

**Financial List:**
- Valor (Number)
- Tipo (Dropdown: Entrada, Saída)
- Status (Dropdown: Pago, Pendente, Atrasado)
- Data de Vencimento (Date)
- Impostos/Taxas (Number)
- Parcelamento (Text - formato: "X/Y")

### 3. Obtenha os Custom Field IDs

Execute este script para obter os IDs dos custom fields:

```bash
curl -X GET \
  'https://api.clickup.com/api/v2/list/YOUR_LIST_ID/field' \
  -H 'Authorization: YOUR_API_KEY'
```

Atualize o `field_mappings` na tabela `client_config` com os IDs corretos.

## ✅ Verificação da Instalação

### 1. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O servidor deve iniciar em `http://localhost:3000`

### 2. Verifique a página inicial

Acesse `http://localhost:3000` - você deve ver a página inicial do portal.

### 3. Execute os testes

```bash
# Testes unitários
npm test

# Verificação de tipos
npm run type-check

# Lint
npm run lint
```

## 🔧 Troubleshooting

### Erro: "Missing required environment variable"

**Solução:** Verifique se todas as variáveis no `.env` estão preenchidas corretamente.

### Erro: "Failed to fetch user profile"

**Solução:** 
1. Verifique se as tabelas foram criadas no Supabase
2. Verifique se o RLS está configurado corretamente
3. Certifique-se de que o usuário tem um registro na tabela `profiles`

### Erro: "ClickUp API error: 401"

**Solução:**
1. Verifique se a API key está correta
2. Certifique-se de que a API key tem permissões adequadas
3. Verifique se os List IDs estão corretos

### Erro: "Module not found"

**Solução:**
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro de TypeScript

**Solução:**
```bash
# Limpe o cache do TypeScript
rm -rf .next
npm run type-check
```

## 📚 Próximos Passos

Após a configuração inicial:

1. **Crie usuários de teste** no Supabase Auth
2. **Adicione dados de exemplo** nas listas do ClickUp
3. **Teste o fluxo de autenticação** (será implementado na Task 3)
4. **Explore a estrutura do projeto** no README.md
5. **Comece a implementar os módulos** seguindo o tasks.md

## 🆘 Suporte

Se encontrar problemas durante a configuração:

1. Verifique a documentação oficial:
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [ClickUp API Docs](https://clickup.com/api)

2. Revise os logs de erro no console

3. Entre em contato com a equipe de desenvolvimento

## 📝 Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e preenchido
- [ ] Projeto Supabase criado
- [ ] Tabelas do banco de dados criadas
- [ ] RLS configurado
- [ ] Usuário de teste criado
- [ ] Listas do ClickUp criadas
- [ ] Custom fields configurados
- [ ] Field mappings atualizados
- [ ] Servidor de desenvolvimento funcionando
- [ ] Testes passando

Parabéns! Seu ambiente está configurado e pronto para desenvolvimento! 🎉
