/**
 * Design System Component Examples
 * 
 * This file demonstrates the usage of all design system components.
 * Use this as a reference for implementing components in the application.
 */

import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ErrorBoundary } from '@/modules/shared/components/ErrorBoundary';

export const DesignSystemExamples: React.FC = () => {
  return (
    <div className="space-y-8 p-8 bg-gray-50">
      {/* Card Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-gray-600">Standard card with shadow</p>
          </Card>
          
          <Card variant="elevated">
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-gray-600">Card with larger shadow</p>
          </Card>
          
          <Card variant="outlined" hover>
            <h3 className="font-semibold mb-2">Outlined Card</h3>
            <p className="text-gray-600">Card with border and hover effect</p>
          </Card>
        </div>
      </section>

      {/* Button Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </div>
      </section>

      {/* Input Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Inputs</h2>
        <div className="max-w-md space-y-4">
          <Input
            label="Nome"
            placeholder="Digite seu nome"
          />
          
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
          />
          
          <Input
            label="Campo com erro"
            error
            errorMessage="Este campo é obrigatório"
            placeholder="Campo inválido"
          />
          
          <Input
            label="Campo desabilitado"
            disabled
            value="Valor desabilitado"
          />
        </div>
      </section>

      {/* Badge Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="success">Pago</Badge>
          <Badge variant="warning">Pendente</Badge>
          <Badge variant="danger">Atrasado</Badge>
          <Badge variant="info">Informação</Badge>
          <Badge variant="neutral">Neutro</Badge>
        </div>
      </section>

      {/* Loading State Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Loading States</h2>
        <div className="flex gap-8 items-center">
          <LoadingState size="sm" />
          <LoadingState size="md" message="Carregando..." />
          <LoadingState size="lg" message="Processando dados..." />
        </div>
      </section>

      {/* Error Boundary Example */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Error Boundary</h2>
        <Card>
          <p className="text-gray-600 mb-4">
            ErrorBoundary captura erros em componentes filhos e exibe uma UI de fallback.
          </p>
          <ErrorBoundary
            fallback={
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Erro customizado capturado!</p>
              </div>
            }
          >
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">Componente funcionando normalmente</p>
            </div>
          </ErrorBoundary>
        </Card>
      </section>

      {/* Combined Example */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Exemplo Combinado</h2>
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Transação</h3>
            <Badge variant="success">Pago</Badge>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor:</span>
              <span className="font-semibold">R$ 5.000,00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vencimento:</span>
              <span>15/01/2024</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="primary" size="sm">Editar</Button>
            <Button variant="outline" size="sm">Detalhes</Button>
            <Button variant="danger" size="sm">Excluir</Button>
          </div>
        </Card>
      </section>
    </div>
  );
};
