# Configuração de Variáveis de Ambiente no Vercel

## 🔧 Como Adicionar Variáveis de Ambiente

### Passo 1: Acesse as Configurações do Projeto

1. Vá para o **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecione seu projeto: `portal-performance-gestao-financeira`
3. Clique em **"Settings"** (no menu superior)
4. No menu lateral, clique em **"Environment Variables"**

### Passo 2: Adicione Cada Variável

Para cada variável abaixo, clique em **"Add New"** e preencha:

---

#### 1. CLICKUP_API_KEY

- **Key**: `CLICKUP_API_KEY`
- **Value**: Sua API key do ClickUp (ex: `pk_123456...`)
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

**Como obter**: https://app.clickup.com/settings/apps

---

#### 2. CLICKUP_PERFORMANCE_LIST_ID

- **Key**: `CLICKUP_PERFORMANCE_LIST_ID`
- **Value**: ID da sua lista de Performance no ClickUp
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

**Como obter**: Abra a lista no ClickUp, o ID está na URL

---

#### 3. CLICKUP_FINANCIAL_LIST_ID

- **Key**: `CLICKUP_FINANCIAL_LIST_ID`
- **Value**: ID da sua lista Financeira no ClickUp
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

---

#### 4. NEXT_PUBLIC_SUPABASE_URL

- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: URL do seu projeto Supabase (ex: `https://xxx.supabase.co`)
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

**Como obter**: Supabase Dashboard → Settings → API → Project URL

---

#### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Anon/Public key do Supabase
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

**Como obter**: Supabase Dashboard → Settings → API → anon/public key

---

#### 6. NEXT_PUBLIC_BASE_URL

- **Key**: `NEXT_PUBLIC_BASE_URL`
- **Value (Production)**: `https://seu-dominio.vercel.app`
- **Value (Preview)**: `https://seu-projeto-git-main.vercel.app`
- **Environments**: Configure separadamente para Production e Preview

**Nota**: Após o primeiro deploy, o Vercel te dará a URL. Você pode voltar e atualizar esta variável.

---

#### 7. JWT_SECRET

- **Key**: `JWT_SECRET`
- **Value**: Um secret aleatório de 32+ caracteres
- **Environments**: Marque ✓ Production, ✓ Preview, ✓ Development

**Como gerar**:
```bash
# No terminal (se tiver OpenSSL)
openssl rand -base64 32

# Ou use um gerador online
https://generate-secret.vercel.app/32
```

**Exemplo**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

#### 8. NODE_ENV

- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environments**: Marque apenas ✓ Production

---

## ✅ Checklist

Após adicionar todas as variáveis:

- [ ] CLICKUP_API_KEY
- [ ] CLICKUP_PERFORMANCE_LIST_ID
- [ ] CLICKUP_FINANCIAL_LIST_ID
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_BASE_URL
- [ ] JWT_SECRET
- [ ] NODE_ENV

## 🚀 Passo 3: Redeploy

Após adicionar todas as variáveis:

1. Vá para a aba **"Deployments"**
2. Clique nos **três pontos** do último deployment
3. Clique em **"Redeploy"**
4. Aguarde o build completar

## 🎯 Alternativa: Adicionar Antes do Deploy

Se você ainda não fez o deploy, pode adicionar as variáveis **antes** de clicar em "Deploy":

1. Na tela de import do projeto
2. Expanda **"Environment Variables"**
3. Adicione todas as variáveis acima
4. Clique em **"Deploy"**

---

## 📝 Valores Temporários para Teste

Se você só quer testar o deploy sem configurar tudo:

```env
CLICKUP_API_KEY=temp_key_replace_later
CLICKUP_PERFORMANCE_LIST_ID=123456
CLICKUP_FINANCIAL_LIST_ID=789012
NEXT_PUBLIC_SUPABASE_URL=https://temp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=temp_key
NEXT_PUBLIC_BASE_URL=https://seu-projeto.vercel.app
JWT_SECRET=temp_secret_change_in_production_12345678901234567890
NODE_ENV=production
```

**⚠️ IMPORTANTE**: Substitua por valores reais antes de usar em produção!

---

## 🆘 Problemas Comuns

### "Secret does not exist"

**Solução**: Remova a seção `"env"` do `vercel.json` (já foi corrigido)

### "Build failed"

**Solução**: Verifique se todas as variáveis obrigatórias foram adicionadas

### "Cannot read environment variable"

**Solução**: 
1. Verifique se marcou os ambientes corretos (Production/Preview)
2. Faça um redeploy após adicionar variáveis

---

**Última Atualização**: Janeiro 2024
