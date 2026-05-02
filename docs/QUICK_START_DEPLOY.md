# Quick Start - Deploy em 10 Minutos

Guia rápido para fazer deploy da aplicação na Vercel em menos de 10 minutos.

## ⚡ Pré-requisitos Rápidos

Tenha em mãos:
- ✅ Conta GitHub com repositório do projeto
- ✅ Conta Vercel (crie em [vercel.com](https://vercel.com))
- ✅ ClickUp API Key
- ✅ ClickUp List IDs (Performance e Financial)
- ✅ Supabase URL e Anon Key

## 🚀 Deploy em 5 Passos

### Passo 1: Prepare o Repositório (1 min)

```bash
# Certifique-se de que está na branch main
git checkout main

# Commit todas as mudanças
git add .
git commit -m "chore: prepare for deployment"

# Push para GitHub
git push origin main
```

### Passo 2: Importe no Vercel (2 min)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Git Repository"
3. Selecione seu repositório `portal-performance-gestao-financeira`
4. Clique em "Import"

### Passo 3: Configure Variáveis (3 min)

Na tela de configuração, adicione estas variáveis:

```env
CLICKUP_API_KEY=pk_your_api_key
CLICKUP_PERFORMANCE_LIST_ID=123456789
CLICKUP_FINANCIAL_LIST_ID=987654321
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
JWT_SECRET=your_random_32_char_secret
NODE_ENV=production
```

**Dica**: Gere JWT_SECRET com:
```bash
openssl rand -base64 32
```

### Passo 4: Deploy (2 min)

1. Clique em "Deploy"
2. Aguarde o build completar (1-2 minutos)
3. Vercel mostrará a URL: `https://your-project.vercel.app`

### Passo 5: Teste (2 min)

1. Acesse a URL fornecida
2. Teste o login
3. Verifique se os dashboards carregam

## ✅ Pronto!

Sua aplicação está no ar! 🎉

## 🔧 Configurações Opcionais

### Adicionar Domínio Customizado

1. Vercel Dashboard → Settings → Domains
2. Adicione seu domínio: `portal.suaagencia.com.br`
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)

### Configurar Staging

```bash
# Crie branch staging
git checkout -b staging
git push origin staging
```

Vercel criará automaticamente um preview deployment para esta branch.

## 📊 Monitoramento

Acesse métricas em:
- **Logs**: Dashboard → Deployments → Seu Deploy → Functions
- **Analytics**: Dashboard → Analytics
- **Errors**: Dashboard → Logs

## 🐛 Problemas Comuns

### Build falhou?

```bash
# Teste localmente primeiro
npm run build

# Se funcionar, force rebuild no Vercel
vercel --force
```

### Variáveis não funcionam?

1. Verifique se adicionou todas as variáveis
2. Certifique-se de selecionar "Production" environment
3. Redeploy após adicionar variáveis

### ClickUp não conecta?

1. Verifique se API key é válida
2. Verifique se List IDs estão corretos
3. Teste API key localmente primeiro

## 📚 Próximos Passos

- [ ] Configure domínio customizado
- [ ] Configure alertas de erro
- [ ] Configure GitHub Actions para CI/CD
- [ ] Adicione mais usuários no Supabase
- [ ] Configure backup do banco de dados

## 🆘 Precisa de Ajuda?

- **Documentação Completa**: [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Checklist Completa**: [docs/DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **API Docs**: [docs/API.md](./API.md)
- **Vercel Support**: https://vercel.com/support

---

**Tempo Total**: ~10 minutos ⏱️

**Dificuldade**: Fácil 🟢

**Última Atualização**: Janeiro 2024
