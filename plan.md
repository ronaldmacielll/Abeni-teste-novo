📄 PRD — Portal de Performance + Gestão Financeira (ClickUp Integration)
1. Visão Geral do Produto
1.1 Objetivo
Desenvolver uma aplicação web com dois módulos principais:
Portal do Cliente (Performance)
Permitir que clientes visualizem métricas de suas postagens em tempo real.
Eliminar a necessidade de acesso direto ao ClickUp.
Gestão Financeira Interna
Controlar fluxo de caixa da agência.
Centralizar entradas, saídas e previsões financeiras.

2. Arquitetura do Sistema
2.1 Stack Sugerida
Frontend: Next.js (React)
Backend: Serverless (Vercel Functions / Firebase Functions / Supabase Edge Functions)
Autenticação: Supabase Auth ou Firebase Auth
API externa: ClickUp API
2.2 Decisão Técnica (IMPORTANTE)
Não usar chamadas diretas client-side para ClickUp API.
Motivos:
Exposição de API Key (risco de segurança)
Dificuldade de controle de acesso por cliente
Limitações de rate limit
✅ Solução recomendada:
 Criar uma camada Backend (BFF - Backend for Frontend) que:
Faz chamadas à API do ClickUp
Filtra dados por cliente
Normaliza os dados
Retorna apenas o necessário para o frontend

3. Módulo 1 — Portal de Performance
3.1 Fonte de Dados
ClickUp (listas específicas por cliente)
Cada tarefa = 1 postagem
3.2 Estrutura de Dados (Custom Fields)
Alcance (Number)
Engajamento (Number)
Impressões (Number)
Cliques (Number)
Status (Dropdown)
Imagem (Attachment ou URL)

3.3 Requisitos Funcionais
3.3.1 Autenticação
Login com e-mail e senha
Usuário vinculado a um client_id
Cada cliente só acessa sua própria lista

3.3.2 Dashboard de Posts
Cada post deve ser exibido como um card contendo:
Miniatura da imagem
Status (Publicado, Agendado, etc.)
Métricas:
Alcance
Engajamento
Impressões
Cliques

3.3.3 Filtros
Por período:
Semana
Mês
Possibilidade futura:
Por rede social
Por tipo de conteúdo

3.4 Requisitos Não Funcionais
Carregamento rápido (< 2s)
Interface responsiva
Cache de dados (ISR ou SWR)

4. Módulo 2 — Gestão Financeira
4.1 Fonte de Dados
ClickUp (lista financeira)
Cada tarefa = 1 transação

4.2 Estrutura de Dados (Custom Fields)
Campo
Tipo
Valor
Number
Tipo
Dropdown (Entrada/Saída)
Status
Dropdown (Pago/Pendente/Atrasado)
Data de Vencimento
Date
Impostos/Taxas
Number ou Percent
Parcelamento
Text (ex: 1/10)


4.3 Requisitos Funcionais
4.3.1 Cálculos
Faturamento Bruto
Soma de todas as Entradas no período
Faturamento Líquido
Bruto - Impostos/Taxas
Saldo Atual
Entradas pagas - Saídas pagas

4.3.2 Fluxo de Caixa
Exibir transações futuras (data > hoje)
Separar:
Entradas previstas
Saídas previstas

4.3.3 Gestão de Parcelamento
Identificar parcelas via campo (ex: 3/10)
Distribuir valores por mês
Permitir visualização futura

4.4 Interface (UI)
4.4.1 Cards de Resumo
Saldo Atual
Faturamento Bruto (mês)
Previsão de Saídas

4.4.2 Lista de Transações
Ordenação por data
Indicadores visuais:
🔴 Atrasado
🟡 Pendente
🟢 Pago

4.4.3 Formulário de Entrada
Criar nova transação
Enviar direto para ClickUp via API
Campos:
Valor
Tipo
Data
Status
Impostos
Parcelamento

5. Backend (BFF)
5.1 Responsabilidades
Autenticação segura
Integração com ClickUp API
Filtro por cliente
Transformação de dados

5.2 Endpoints Sugeridos
Performance
GET /api/posts?client_id=xxx&period=month
Financeiro
GET /api/transactions?period=month
POST /api/transactions

6. Lógica Técnica (para Kiro)
6.1 Reducers / Aggregations
Implementar funções como:
calculateGrossRevenue(transactions)
calculateNetRevenue(transactions)
calculateBalance(transactions)
getUpcomingTransactions(transactions)

6.2 Filtros
Mensal
Semanal
Anual

6.3 Alertas Visuais
Se status === atrasado → vermelho
Se vencimento === hoje → destaque
Se tipo === saída → negativo

7. Segurança
API Key do ClickUp armazenada no backend
Autenticação com JWT
Controle de acesso por client_id

8. Escalabilidade
Arquitetura deve permitir:
Adicionar novas métricas via ClickUp (sem alterar frontend)
Adicionar novas redes sociais
Adicionar novos tipos financeiros

9. Entregáveis
Aplicação Web funcional
Integração com ClickUp
Dashboard de performance
Dashboard financeiro
Sistema de autenticação

10. Próximos Passos
Criar projeto no Kiro com Next.js
Gerar estrutura modular:
/modules/performance
/modules/finance
/services/clickup
Implementar backend serverless
Integrar autenticação
Construir dashboards
flowchart TD %% ========================= %% USER FLOW %% ========================= A[Usuário acessa o portal] --> B[Tela de Login] B --> C{Credenciais válidas?} C -- Não --> D[Exibir erro de login] D --> B C -- Sim --> E[Gerar JWT Token] E --> F[Redirecionar para Dashboard] %% ========================= %% AUTH + CONTEXT %% ========================= F --> G[Carregar contexto do usuário] G --> H[Identificar client_id] %% ========================= %% DASHBOARD ROUTING %% ========================= H --> I{Selecionar módulo} I -->|Performance| J[Dashboard de Performance] I -->|Financeiro| K[Dashboard Financeiro] %% ========================= %% PERFORMANCE FLOW %% ========================= J --> L[Selecionar período] L --> M[Chamada GET /api/posts] M --> N[Backend (BFF)] N --> O[Validar JWT] O --> P{Token válido?} P -- Não --> Q[Retornar 401] P -- Sim --> R[Filtrar por client_id] R --> S[Chamar API ClickUp] S --> T[Buscar tarefas da lista do cliente] T --> U[Mapear Custom Fields] U --> V[Normalizar dados] V --> W[Retornar JSON para frontend] W --> X[Renderizar Cards] X --> Y[Exibir métricas] Y --> Z[Atualizar UI com filtros] %% ========================= %% PERFORMANCE DETAILS %% ========================= Z --> ZA[Miniatura] Z --> ZB[Status do Post] Z --> ZC[Alcance] Z --> ZD[Engajamento] Z --> ZE[Impressões] Z --> ZF[Cliques] %% ========================= %% FINANCIAL FLOW %% ========================= K --> AA[Selecionar período] AA --> AB[Chamada GET /api/transactions] AB --> AC[Backend (BFF)] AC --> AD[Validar JWT] AD --> AE{Token válido?} AE -- Não --> AF[Retornar 401] AE -- Sim --> AG[Buscar lista financeira ClickUp] AG --> AH[Mapear Custom Fields] AH --> AI[Normalizar dados] AI --> AJ[Executar cálculos] %% ========================= %% FINANCIAL CALCULATIONS %% ========================= AJ --> AK[Faturamento Bruto] AJ --> AL[Faturamento Líquido] AJ --> AM[Saldo Atual] AJ --> AN[Fluxo de Caixa Futuro] %% ========================= %% PARCELAMENTO %% ========================= AJ --> AO[Processar Parcelamentos] AO --> AP[Distribuir parcelas por mês] %% ========================= %% RESPONSE %% ========================= AK --> AQ[Montar resposta JSON] AL --> AQ AM --> AQ AN --> AQ AP --> AQ AQ --> AR[Retornar dados ao frontend] %% ========================= %% FINANCIAL UI %% ========================= AR --> AS[Renderizar Cards Resumo] AS --> AT[Saldo Atual] AS --> AU[Faturamento Bruto] AS --> AV[Previsão de Saídas] AR --> AW[Renderizar Lista de Transações] AW --> AX{Status} AX -->|Pago| AY[Indicador verde] AX -->|Pendente| AZ[Indicador amarelo] AX -->|Atrasado| BA[Indicador vermelho] %% ========================= %% CREATE TRANSACTION %% ========================= K --> BB[Usuário cria nova transação] BB --> BC[Formulário] BC --> BD[POST /api/transactions] BD --> BE[Backend] BE --> BF[Validar dados] BF --> BG[Enviar para ClickUp API] BG --> BH[Criar tarefa] BH --> BI[Retornar sucesso] BI --> BJ[Atualizar UI] %% ========================= %% ERROR HANDLING %% ========================= N --> BK{Erro API ClickUp?} AC --> BK BK -- Sim --> BL[Log erro] BL --> BM[Retornar erro amigável] BK -- Não --> BN[Continuar fluxo] %% ========================= %% CACHE LAYER %% ========================= N --> BO[Cache (Redis / Edge)] AC --> BO BO --> BP{Cache válido?} BP -- Sim --> BQ[Retornar cache] BP -- Não --> S %% ========================= %% SECURITY %% ========================= O --> BR[Verificar permissões] AD --> BR BR --> BS{Acesso permitido?} BS -- Não --> BT[403 Forbidden] BS -- Sim --> BU[Continuar] %% ========================= %% FINAL %% ========================= BN --> BV[Fim] BQ --> BV BJ --> BV