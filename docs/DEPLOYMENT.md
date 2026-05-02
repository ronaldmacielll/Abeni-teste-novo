# Deployment Guide - Vercel

Este guia detalha o processo completo de deploy da aplicação Portal de Performance + Gestão Financeira na Vercel.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Preparação do Repositório](#preparação-do-repositório)
- [Deploy via Vercel Dashboard](#deploy-via-vercel-dashboard)
- [Deploy via Vercel CLI](#deploy-via-vercel-cli)
- [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
- [Configuração de Domínio Customizado](#configuração-de-domínio-customizado)
- [Ambientes (Staging e Production)](#ambientes-staging-e-production)
- [Monitoramento e Logs](#monitoramento-e-logs)
- [Troubleshooting](#troubleshooting)

## 🎯 Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Repositório Git (GitHub, GitLab, ou Bitbucket)
- ✅ Conta ClickUp com API key
- ✅ Projeto Supabase configurado
- ✅ Todas as variáveis de ambiente preparadas
- ✅ Build local funcionando (`npm run build`)
- ✅ Testes passando (`npm run test`)

## 📦 Preparação do Repositório

### 1. Commit e Push do Código

```bash
# Certifique-se de que todas as mudanças estão commitadas
git status

# Adicione arquivos não rastreados
git add .

# Commit
git commit -m "chore: prepare for deployment"

# Push para o repositório remoto
git push origin main
```

### 2. Verifique o .gitignore

Certifique-se de que arquivos sensíveis não estão sendo commitados:

```gitignore
# .gitignore
.env
.env.local
.env.production
.env.development
.vercel
node_modules/
.next/
out/
dist/
```

### 3. Teste o Build Localmente

```bash
# Limpe builds anteriores
rm -rf .next

# Execute o build
npm run build

# Teste o build localmente
npm run start
```

Se o build falhar, corrija os erros antes de prosseguir.

## 🚀 Deploy via Vercel Dashboard

### Método 1: Import Git Repository (Recomendado)

1. **Acesse o Vercel Dashboard**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login ou crie uma conta

2. **Importe o Projeto**
   - Clique em "Add New..." → "Project"
   - Selecione seu provedor Git (GitHub, GitLab, Bitbucket)
   - Autorize o Vercel a acessar seus repositórios
   - Selecione o repositório `portal-performance-gestao-financeira`

3. **Configure o Projeto**
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `.` (raiz do projeto)
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)
   - **Install Command**: `npm install` (padrão)

4. **Configure Variáveis de Ambiente**
   - Clique em "Environment Variables"
   - Adicione todas as variáveis necessárias (veja seção abaixo)
   - Selecione os ambientes: Production, Preview, Development

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar (geralmente 2-5 minutos)
   - Vercel fornecerá uma URL de preview: `https://your-project.vercel.app`

### Método 2: Deploy Manual via CLI

Se preferir usar a linha de comando:

```bash
# Instale a Vercel CLI globalmente
npm install -g vercel

# Login na Vercel
vercel login

# Deploy (primeira vez)
vercel

# Siga os prompts:
# - Set up and deploy? Yes
# - Which scope? Selecione sua conta/team
# - Link to existing project? No
# - Project name? portal-performance-gestao-financeira
# - Directory? ./
# - Override settings? No

# Deploy para produção
vercel --prod
```

## 🔐 Configuração de Variáveis de Ambiente

### Variáveis Obrigatórias

Configure as seguintes variáveis no Vercel Dashboard:

1. **Acesse Project Settings**
   - Dashboard → Seu Projeto → Settings → Environment Variables

2. **Adicione as Variáveis**

#### ClickUp Configuration

```
CLICKUP_API_KEY
Value: pk_your_actual_api_key_here
Environments: ✓ Production ✓ Preview ✓ Development
```

```
CLICKUP_PERFORMANCE_LIST_ID
Value: 123456789
Environments: ✓ Production ✓ Preview ✓ Development
```

```
CLICKUP_FINANCIAL_LIST_ID
Value: 987654321
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your_supabase_anon_key_here
Environments: ✓ Production ✓ Preview ✓ Development
```

#### Application Configuration

```
NEXT_PUBLIC_BASE_URL
Value (Production): https://your-domain.com
Value (Preview): https://your-project-git-branch.vercel.app
Environments: ✓ Production ✓ Preview
```

```
JWT_SECRET
Value: your_strong_random_secret_here
Environments: ✓ Production ✓ Preview ✓ Development
```

```
NODE_ENV
Value: production
Environments: ✓ Production
```

### Gerando Secrets Seguros

Para gerar um JWT_SECRET seguro:

```bash
# Usando OpenSSL
openssl rand -base64 32

# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Variáveis via CLI

Alternativamente, configure via CLI:

```bash
# Adicionar variável de produção
vercel env add CLICKUP_API_KEY production

# Adicionar variável para todos os ambientes
vercel env add JWT_SECRET production preview development

# Listar variáveis
vercel env ls

# Remover variável
vercel env rm VARIABLE_NAME production
```

## 🌐 Configuração de Domínio Customizado

### Adicionar Domínio

1. **Acesse Domains**
   - Dashboard → Seu Projeto → Settings → Domains

2. **Adicione o Domínio**
   - Clique em "Add"
   - Digite seu domínio: `portal.suaagencia.com.br`
   - Clique em "Add"

3. **Configure DNS**

Vercel fornecerá registros DNS para configurar:

#### Opção A: Nameservers (Recomendado)

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Configure estes nameservers no seu registrador de domínio.

#### Opção B: Registros A/CNAME

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. **Aguarde Propagação**
   - DNS pode levar até 48 horas para propagar
   - Vercel verificará automaticamente
   - SSL será provisionado automaticamente

### Configurar Redirect

Configure redirect de www para apex (ou vice-versa):

1. Settings → Domains
2. Clique nos três pontos ao lado do domínio
3. "Redirect to..." → Selecione o domínio principal

## 🔄 Ambientes (Staging e Production)

### Estrutura de Branches

```
main (production)
├── staging (preview)
└── feature/* (preview)
```

### Production Environment

- **Branch**: `main`
- **URL**: `https://your-domain.com`
- **Deploy**: Automático em cada push para `main`
- **Variáveis**: Production environment variables

### Preview/Staging Environment

- **Branch**: `staging` ou qualquer branch
- **URL**: `https://your-project-git-staging.vercel.app`
- **Deploy**: Automático em cada push
- **Variáveis**: Preview environment variables

### Configurar Staging

1. **Crie branch staging**
```bash
git checkout -b staging
git push origin staging
```

2. **Configure no Vercel**
   - Settings → Git → Production Branch
   - Mantenha `main` como production
   - Todas as outras branches serão preview

3. **Variáveis de Staging**
   - Use listas ClickUp de teste
   - Use projeto Supabase de staging
   - Configure `NEXT_PUBLIC_BASE_URL` para URL de preview

## 📊 Monitoramento e Logs

### Acessar Logs

1. **Real-time Logs**
   - Dashboard → Seu Projeto → Deployments
   - Clique no deployment
   - Aba "Functions" → Selecione função → View Logs

2. **Via CLI**
```bash
# Logs em tempo real
vercel logs

# Logs de produção
vercel logs --prod

# Logs de função específica
vercel logs /api/posts
```

### Analytics

Vercel fornece analytics integrado:

1. **Acesse Analytics**
   - Dashboard → Seu Projeto → Analytics

2. **Métricas Disponíveis**
   - Page views
   - Top pages
   - Top referrers
   - Devices
   - Browsers
   - Countries

### Monitoring

Configure alertas:

1. **Settings → Monitoring**
2. Configure:
   - Error rate threshold
   - Response time threshold
   - Notification channels (email, Slack)

## 🐛 Troubleshooting

### Build Failures

**Erro: "Module not found"**

```bash
# Solução: Verifique dependências
npm install
npm run build

# Se funcionar localmente, limpe cache do Vercel
vercel --force
```

**Erro: "Type errors"**

```bash
# Solução: Execute type check localmente
npm run type-check

# Corrija erros de tipo antes de fazer deploy
```

### Runtime Errors

**Erro: "CLICKUP_API_KEY is not defined"**

```
Solução:
1. Verifique se a variável está configurada no Vercel
2. Certifique-se de que está no ambiente correto (Production/Preview)
3. Redeploy após adicionar variáveis
```

**Erro: "Failed to fetch from ClickUp API"**

```
Solução:
1. Verifique se a API key é válida
2. Verifique se os list IDs estão corretos
3. Verifique rate limits do ClickUp
4. Verifique logs para detalhes do erro
```

### Performance Issues

**Build muito lento**

```bash
# Solução: Otimize dependências
npm run build -- --profile

# Considere:
# - Remover dependências não utilizadas
# - Usar dynamic imports
# - Otimizar imagens
```

**Cold starts lentos**

```
Solução:
1. Considere upgrade para Vercel Pro (menos cold starts)
2. Otimize bundle size
3. Use edge functions quando possível
```

### SSL/Domain Issues

**SSL não provisiona**

```
Solução:
1. Verifique configuração DNS
2. Aguarde até 48h para propagação
3. Remova e adicione domínio novamente
4. Contate suporte Vercel se persistir
```

**Redirect loop**

```
Solução:
1. Verifique configuração de redirect
2. Certifique-se de que não há conflito entre Vercel e CDN externo
3. Verifique middleware.ts para redirects customizados
```

## 🔄 Rollback

Se um deploy causar problemas:

### Via Dashboard

1. Dashboard → Deployments
2. Encontre deployment anterior estável
3. Clique nos três pontos → "Promote to Production"

### Via CLI

```bash
# Listar deployments
vercel ls

# Promover deployment específico
vercel promote <deployment-url>
```

## 🚦 CI/CD com GitHub Actions (Opcional)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Todos os testes passando (`npm run test`)
- [ ] Build local funcionando (`npm run build`)
- [ ] Type check sem erros (`npm run type-check`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Supabase configurado e testado
- [ ] ClickUp API key válida e testada
- [ ] Domínio configurado (se aplicável)
- [ ] SSL provisionado
- [ ] Testes E2E passando em staging
- [ ] Documentação atualizada
- [ ] README.md atualizado com URL de produção

## 🎉 Deploy Completo!

Após seguir este guia, sua aplicação estará:

- ✅ Deployada na Vercel
- ✅ Com SSL automático
- ✅ Com deploy automático em cada push
- ✅ Com preview deployments para PRs
- ✅ Com monitoramento e logs
- ✅ Com domínio customizado (opcional)

### URLs Importantes

- **Production**: `https://your-domain.com`
- **Vercel Dashboard**: `https://vercel.com/your-team/your-project`
- **Analytics**: `https://vercel.com/your-team/your-project/analytics`
- **Logs**: `https://vercel.com/your-team/your-project/logs`

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Next.js Docs**: https://nextjs.org/docs

---

**Última Atualização**: Janeiro 2024
