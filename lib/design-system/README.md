# Design System

Este diretório contém o sistema de design do Portal de Performance + Gestão Financeira, incluindo componentes base, paleta de cores, tipografia e utilitários de estilo.

## Estrutura

```
lib/design-system/
├── components/          # Componentes base do design system
│   ├── Card.tsx        # Componente de cartão
│   ├── Button.tsx      # Componente de botão
│   ├── Input.tsx       # Componente de input
│   ├── Badge.tsx       # Componente de badge
│   └── index.ts        # Exportações centralizadas
├── colors.ts           # Paleta de cores
├── typography.ts       # Sistema de tipografia
├── spacing.ts          # Sistema de espaçamento
└── README.md          # Esta documentação
```

## Componentes

### Card

Componente de cartão para agrupar conteúdo relacionado.

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' (padrão: 'default')
- `hover`: boolean - Adiciona efeito de hover (padrão: false)
- `className`: string - Classes CSS adicionais

**Exemplo:**
```tsx
import { Card } from '@/lib/design-system/components';

<Card variant="elevated" hover>
  <h2>Título do Card</h2>
  <p>Conteúdo do card</p>
</Card>
```

### Button

Componente de botão com múltiplas variantes e tamanhos.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' (padrão: 'primary')
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')
- `disabled`: boolean
- `className`: string - Classes CSS adicionais
- Todas as props padrão de HTMLButtonElement

**Exemplo:**
```tsx
import { Button } from '@/lib/design-system/components';

<Button variant="primary" size="md" onClick={handleClick}>
  Clique aqui
</Button>
```

### Input

Componente de input com suporte a estados de erro e label.

**Props:**
- `label`: string - Label do input
- `error`: boolean - Indica estado de erro
- `errorMessage`: string - Mensagem de erro a ser exibida
- `disabled`: boolean
- `className`: string - Classes CSS adicionais
- Todas as props padrão de HTMLInputElement

**Exemplo:**
```tsx
import { Input } from '@/lib/design-system/components';

<Input
  label="E-mail"
  type="email"
  error={hasError}
  errorMessage="E-mail inválido"
  placeholder="seu@email.com"
/>
```

### Badge

Componente de badge para indicadores de status.

**Props:**
- `variant`: 'success' | 'warning' | 'danger' | 'info' | 'neutral' (padrão: 'neutral')
- `className`: string - Classes CSS adicionais

**Exemplo:**
```tsx
import { Badge } from '@/lib/design-system/components';

<Badge variant="success">Pago</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Atrasado</Badge>
```

## Componentes Compartilhados

Localizados em `modules/shared/components/`:

### LoadingState

Componente de loading com spinner animado.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')
- `message`: string - Mensagem opcional
- `className`: string - Classes CSS adicionais

**Exemplo:**
```tsx
import { LoadingState } from '@/modules/shared/components';

<LoadingState size="lg" message="Carregando dados..." />
```

### ErrorBoundary

Componente de boundary para capturar erros em React.

**Props:**
- `children`: ReactNode
- `fallback`: ReactNode - UI customizada para erro
- `onError`: (error: Error, errorInfo: ErrorInfo) => void - Callback de erro

**Exemplo:**
```tsx
import { ErrorBoundary } from '@/modules/shared/components';

<ErrorBoundary onError={(error) => console.error(error)}>
  <App />
</ErrorBoundary>
```

## Paleta de Cores

### Cores Primárias

- **Primary**: Azul (#0ea5e9) - Cor principal da marca
- **Secondary**: Roxo (#a855f7) - Cor secundária

### Cores de Status

- **Success**: Verde (#10b981) - Sucesso, "Pago"
- **Warning**: Amarelo (#f59e0b) - Aviso, "Pendente"
- **Danger**: Vermelho (#ef4444) - Erro, "Atrasado"
- **Info**: Azul (#3b82f6) - Informação

### Cores Neutras

- **Gray**: Escala de cinza (50-900)
- **White**: #ffffff
- **Black**: #000000

## Tipografia

### Família de Fontes

- **Sans**: Inter, system-ui, sans-serif
- **Mono**: JetBrains Mono, Courier New, monospace

### Tamanhos

- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)

### Pesos

- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

## Espaçamento

Sistema de espaçamento baseado em múltiplos de 4px:

- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **5**: 1.25rem (20px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **10**: 2.5rem (40px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)
- **20**: 5rem (80px)
- **24**: 6rem (96px)

## Uso com TailwindCSS

Todas as cores, tipografia e espaçamento estão configurados no `tailwind.config.ts` e podem ser usados diretamente nas classes do Tailwind:

```tsx
<div className="bg-primary-500 text-white p-6 rounded-lg">
  <h1 className="text-2xl font-bold">Título</h1>
  <p className="text-base text-gray-600">Descrição</p>
</div>
```

## Testes

Todos os componentes possuem testes unitários completos. Para executar os testes:

```bash
npm test -- --testPathPattern="lib/design-system/components"
npm test -- --testPathPattern="modules/shared/components"
```

## Acessibilidade

Todos os componentes seguem as melhores práticas de acessibilidade:

- Uso correto de atributos ARIA
- Suporte a navegação por teclado
- Contraste de cores adequado (WCAG AA)
- Estados visuais claros (focus, hover, disabled)

## Extensibilidade

Para adicionar novos componentes ao design system:

1. Crie o componente em `lib/design-system/components/`
2. Exporte-o em `lib/design-system/components/index.ts`
3. Crie testes em `[ComponentName].test.tsx`
4. Documente o uso neste README
5. Siga os padrões de estilo existentes (TailwindCSS + clsx)
