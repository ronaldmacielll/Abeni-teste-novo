# 🔐 Credenciais de Login - Sistema ALUA

## Usuários Disponíveis

### 👨‍💼 Administrador (Acesso Total)
- **Email:** `ronaldadm@hotmail.com`
- **Senha:** `34775585`
- **Permissões:**
  - ✅ Acesso ao módulo Performance
  - ✅ Acesso ao módulo Financeiro
  - ✅ Visualização de todos os dados
  - ✅ Gestão completa do sistema

### 👤 Cliente (Acesso Limitado)
- **Email:** `cliente@exemplo.com`
- **Senha:** `cliente123`
- **Permissões:**
  - ✅ Acesso ao módulo Performance
  - ❌ SEM acesso ao módulo Financeiro
  - ✅ Visualização apenas dos próprios dados

---

## 📋 Diferenças Entre os Perfis

| Recurso | Administrador | Cliente |
|---------|--------------|---------|
| **Performance** | ✅ Sim | ✅ Sim |
| **Financeiro** | ✅ Sim | ❌ Não |
| **Menu Financeiro** | ✅ Visível | ❌ Oculto |
| **API Transações** | ✅ Permitido | ❌ Bloqueado |
| **Dados** | Todos os clientes | Apenas próprios |

---

## 🚀 Como Testar

### Teste 1: Login como Administrador
1. Acesse: http://localhost:3000/login
2. Use: `ronaldadm@hotmail.com` / `34775585`
3. Você verá **Performance** e **Financeiro** no menu
4. Ambos os módulos funcionarão normalmente

### Teste 2: Login como Cliente
1. Faça logout (botão "Sair" no canto superior direito)
2. Acesse: http://localhost:3000/login
3. Use: `cliente@exemplo.com` / `cliente123`
4. Você verá **apenas Performance** no menu
5. O menu Financeiro estará oculto
6. Se tentar acessar `/finance` diretamente, será bloqueado

---

## 🔒 Segurança Implementada

### Frontend (Interface)
- ✅ Menu Financeiro oculto para clientes
- ✅ Navegação baseada em role do usuário
- ✅ Exibição de tipo de usuário (Cliente/Interno)

### Backend (API)
- ✅ Verificação de role em `/api/transactions`
- ✅ Retorna erro 403 para clientes tentando acessar financeiro
- ✅ Mensagem: "Acesso negado. Apenas usuários internos podem acessar dados financeiros."

### Middleware
- ✅ Validação de JWT em todas as rotas protegidas
- ✅ Extração de client_id e role do token
- ✅ Redirecionamento para login se não autenticado

---

## 📝 Notas Importantes

1. **Dados de Desenvolvimento:** Estes usuários são hardcoded apenas para desenvolvimento
2. **Produção:** Em produção, você usará Supabase com usuários reais
3. **Cookies:** O sistema armazena role e client_id em cookies seguros
4. **Sessão:** Sessões duram 7 dias por padrão

---

## 🎯 Próximos Passos

Para adicionar mais clientes:
1. Edite o arquivo: `services/auth/supabase.ts`
2. Adicione novos usuários no array `HARDCODED_USERS`
3. Defina `role: 'client'` para clientes normais
4. Defina `role: 'internal'` para administradores

**Exemplo:**
```typescript
{
  email: 'novocliente@exemplo.com',
  password: 'senha123',
  user: {
    id: 'client-dev-002',
    email: 'novocliente@exemplo.com',
    clientId: 'client-002',
    role: 'client' as const,
    metadata: {
      name: 'Novo Cliente',
      company: 'Empresa XYZ',
    },
  },
}
```

---

## 🆘 Suporte

Se tiver problemas:
1. Limpe os cookies do navegador (Ctrl + Shift + Delete)
2. Faça logout e login novamente
3. Verifique o console do navegador (F12) para erros
4. Verifique o terminal do servidor para logs

---

**Sistema ALUA - Social Media Management** 🚀
