# Deployment Checklist

Use esta checklist para garantir que todos os passos necessários foram completados antes e depois do deploy.

## 📋 Pré-Deploy

### Código e Testes

- [ ] Todos os testes unitários passando
  ```bash
  npm run test
  ```

- [ ] Todos os testes E2E passando
  ```bash
  npm run test:e2e
  ```

- [ ] Cobertura de testes adequada (>80%)
  ```bash
  npm run test:coverage
  ```

- [ ] Type check sem erros
  ```bash
  npm run type-check
  ```

- [ ] Lint sem erros ou warnings
  ```bash
  npm run lint
  ```

- [ ] Formatação consistente
  ```bash
  npm run format:check
  ```

- [ ] Build local funcionando
  ```bash
  npm run build
  npm run start
  ```

### Segurança

- [ ] Nenhum secret ou API key commitado no código
- [ ] `.env.local` está no `.gitignore`
- [ ] Dependências atualizadas e sem vulnerabilidades críticas
  ```bash
  npm audit
  ```

- [ ] JWT_SECRET gerado com segurança (32+ caracteres aleatórios)
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Headers de segurança configurados

### Configuração

- [ ] Todas as variáveis de ambiente documentadas em `.env.example`
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] ClickUp API key válida e testada
- [ ] ClickUp List IDs corretos (Performance e Financial)
- [ ] Supabase projeto configurado
- [ ] Supabase Auth configurado
- [ ] Tabelas do banco de dados criadas
- [ ] Row Level Security (RLS) configurado no Supabase

### Documentação

- [ ] README.md atualizado
- [ ] API.md completo e atualizado
- [ ] DEPLOYMENT.md revisado
- [ ] Comentários de código adequados
- [ ] Changelog atualizado (se aplicável)

### Git

- [ ] Branch `main` atualizada
- [ ] Todas as mudanças commitadas
- [ ] Mensagens de commit seguem padrão (Conventional Commits)
- [ ] Tags de versão criadas (se aplicável)
  ```bash
  git tag -a v1.0.0 -m "Release version 1.0.0"
  git push origin v1.0.0
  ```

## 🚀 Deploy

### Vercel Setup

- [ ] Conta Vercel criada
- [ ] Projeto importado do Git
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`

### Variáveis de Ambiente (Production)

- [ ] `CLICKUP_API_KEY` configurada
- [ ] `CLICKUP_PERFORMANCE_LIST_ID` configurada
- [ ] `CLICKUP_FINANCIAL_LIST_ID` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `NEXT_PUBLIC_BASE_URL` configurada (URL de produção)
- [ ] `JWT_SECRET` configurada
- [ ] `NODE_ENV=production` configurada

### Deploy Execution

- [ ] Deploy iniciado (automático ou manual)
- [ ] Build completado sem erros
- [ ] Deployment URL gerada
- [ ] Preview deployment testado (se aplicável)

## ✅ Pós-Deploy

### Verificação Funcional

- [ ] Site acessível na URL de produção
- [ ] SSL/HTTPS funcionando
- [ ] Página de login carrega corretamente
- [ ] Autenticação funciona (login/logout)
- [ ] Dashboard de Performance carrega
- [ ] Dashboard Financeiro carrega
- [ ] Dados do ClickUp sendo carregados corretamente
- [ ] Filtros de período funcionando
- [ ] Criação de transação funciona
- [ ] Multi-tenancy funcionando (dados isolados por client_id)

### Verificação Técnica

- [ ] API endpoints respondendo
  ```bash
  curl https://your-domain.com/api/posts
  ```

- [ ] Headers de segurança presentes
  ```bash
  curl -I https://your-domain.com
  ```

- [ ] Compressão gzip ativa
- [ ] Cache headers configurados
- [ ] Imagens otimizadas carregando
- [ ] Fontes carregando corretamente

### Performance

- [ ] Lighthouse score > 90 (Performance)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Largest Contentful Paint < 2.5s

### Monitoramento

- [ ] Vercel Analytics configurado
- [ ] Logs acessíveis no dashboard
- [ ] Error tracking funcionando
- [ ] Alertas configurados (se aplicável)

### Domínio (se aplicável)

- [ ] Domínio customizado adicionado
- [ ] DNS configurado corretamente
- [ ] SSL provisionado para domínio customizado
- [ ] Redirect www → apex (ou vice-versa) configurado
- [ ] Domínio propagado (pode levar até 48h)

### Testes em Produção

- [ ] Teste de login com usuário real
- [ ] Teste de carregamento de posts
- [ ] Teste de carregamento de transações
- [ ] Teste de criação de transação
- [ ] Teste de filtros
- [ ] Teste de navegação entre módulos
- [ ] Teste em diferentes browsers (Chrome, Firefox, Safari)
- [ ] Teste em diferentes dispositivos (Desktop, Tablet, Mobile)

### Rollback Plan

- [ ] Deployment anterior identificado
- [ ] Processo de rollback documentado
- [ ] Equipe sabe como fazer rollback
  ```bash
  vercel promote <previous-deployment-url>
  ```

## 🔄 Ambientes Adicionais

### Staging Environment

- [ ] Branch `staging` criada
- [ ] Variáveis de ambiente de staging configuradas
- [ ] Listas ClickUp de teste configuradas
- [ ] Projeto Supabase de staging configurado
- [ ] URL de staging testada

### Preview Deployments

- [ ] Preview deployments habilitados para PRs
- [ ] GitHub Actions configurado (se aplicável)
- [ ] Notificações de preview funcionando

## 📊 Monitoramento Contínuo

### Primeira Semana

- [ ] Monitorar logs diariamente
- [ ] Verificar error rate
- [ ] Verificar response times
- [ ] Coletar feedback de usuários
- [ ] Verificar métricas de uso

### Primeira Mês

- [ ] Revisar analytics semanalmente
- [ ] Identificar gargalos de performance
- [ ] Otimizar queries lentas
- [ ] Ajustar cache strategy se necessário
- [ ] Atualizar documentação com learnings

## 🐛 Troubleshooting

### Se algo der errado:

1. **Verificar logs**
   ```bash
   vercel logs --prod
   ```

2. **Verificar variáveis de ambiente**
   ```bash
   vercel env ls
   ```

3. **Testar localmente com variáveis de produção**
   ```bash
   # Copie variáveis de produção para .env.local
   npm run build
   npm run start
   ```

4. **Fazer rollback se necessário**
   ```bash
   vercel promote <previous-deployment-url>
   ```

5. **Contatar suporte**
   - Vercel Support: https://vercel.com/support
   - Supabase Support: https://supabase.com/support
   - ClickUp Support: https://help.clickup.com

## 📝 Notas

### Informações de Deploy

- **Data do Deploy**: _______________
- **Versão**: _______________
- **Deployment URL**: _______________
- **Responsável**: _______________
- **Duração do Build**: _______________
- **Issues Encontradas**: _______________

### Próximos Passos

- [ ] Comunicar deploy para stakeholders
- [ ] Atualizar documentação interna
- [ ] Agendar review pós-deploy
- [ ] Planejar próximas features
- [ ] Coletar feedback de usuários

---

## ✨ Deploy Completo!

Parabéns! Se todos os itens acima foram verificados, seu deploy está completo e a aplicação está pronta para uso em produção.

**Lembre-se**: Monitoramento contínuo é essencial para manter a aplicação saudável e performática.

---

**Última Atualização**: Janeiro 2024
