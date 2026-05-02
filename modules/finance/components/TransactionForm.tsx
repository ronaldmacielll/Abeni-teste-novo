/**
 * TransactionForm Component
 * 
 * Form for creating new financial transactions
 * Implements Requirements: 11.1, 11.2, 11.5
 */

'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/lib/design-system/components';
import type { CreateTransactionRequest } from '../types/transaction.types';

export interface TransactionFormProps {
  onSubmit: (data: CreateTransactionRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateTransactionRequest>;
}

interface FormErrors {
  valor?: string;
  tipo?: string;
  status?: string;
  dataVencimento?: string;
  descricao?: string;
}

/**
 * TransactionForm Component
 * 
 * Renders a form with:
 * - Required fields: Valor, Tipo, Data de Vencimento, Status
 * - Optional fields: Impostos/Taxas, Parcelamento, Descrição
 * - Inline validation and error messages
 * - Submit handler with POST to /api/transactions
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    valor: initialData?.valor || 0,
    tipo: initialData?.tipo || 'Entrada',
    status: initialData?.status || 'Pendente',
    dataVencimento: initialData?.dataVencimento || '',
    impostosTaxas: initialData?.impostosTaxas || 0,
    parcelamento: initialData?.parcelamento || '',
    descricao: initialData?.descricao || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.valor || formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório';
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório';
    }

    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    }

    if (!formData.descricao || formData.descricao.trim() === '') {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Form will be closed by parent component on success
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Erro ao criar transação. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleChange = (
    field: keyof CreateTransactionRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Submit Error */}
      {submitError && (
        <div className="bg-danger-light border border-danger-main rounded-lg p-3">
          <p className="text-sm text-danger-text">{submitError}</p>
        </div>
      )}

      {/* Descrição */}
      <Input
        label="Descrição *"
        type="text"
        value={formData.descricao}
        onChange={(e) => handleChange('descricao', e.target.value)}
        error={!!errors.descricao}
        errorMessage={errors.descricao}
        placeholder="Ex: Pagamento de cliente X"
      />

      {/* Valor */}
      <Input
        label="Valor *"
        type="number"
        step="0.01"
        min="0"
        value={formData.valor || ''}
        onChange={(e) => handleChange('valor', parseFloat(e.target.value) || 0)}
        error={!!errors.valor}
        errorMessage={errors.valor}
        placeholder="0.00"
      />

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo *
        </label>
        <select
          value={formData.tipo}
          onChange={(e) => handleChange('tipo', e.target.value as 'Entrada' | 'Saída')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="Entrada">Entrada</option>
          <option value="Saída">Saída</option>
        </select>
        {errors.tipo && (
          <p className="mt-1 text-sm text-danger-text">{errors.tipo}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as 'Pago' | 'Pendente' | 'Atrasado')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="Pago">Pago</option>
          <option value="Pendente">Pendente</option>
          <option value="Atrasado">Atrasado</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-danger-text">{errors.status}</p>
        )}
      </div>

      {/* Data de Vencimento */}
      <Input
        label="Data de Vencimento *"
        type="date"
        value={formData.dataVencimento}
        onChange={(e) => handleChange('dataVencimento', e.target.value)}
        error={!!errors.dataVencimento}
        errorMessage={errors.dataVencimento}
      />

      {/* Impostos/Taxas */}
      <Input
        label="Impostos/Taxas"
        type="number"
        step="0.01"
        min="0"
        value={formData.impostosTaxas || ''}
        onChange={(e) => handleChange('impostosTaxas', parseFloat(e.target.value) || 0)}
        placeholder="0.00"
      />

      {/* Parcelamento */}
      <Input
        label="Parcelamento"
        type="text"
        value={formData.parcelamento}
        onChange={(e) => handleChange('parcelamento', e.target.value)}
        placeholder="Ex: 3/10 (parcela 3 de 10)"
      />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Criando...' : 'Criar Transação'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
