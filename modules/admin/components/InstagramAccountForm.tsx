/**
 * InstagramAccountForm Component
 * 
 * Form for configuring Instagram Business accounts
 * Implements Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 16.1
 */

'use client';

import React, { useState } from 'react';
import { Button, Input, Card } from '@/lib/design-system/components';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface InstagramAccountFormProps {
  onSubmit: (data: InstagramAccountFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<InstagramAccountFormData>;
  isLoading?: boolean;
}

export interface InstagramAccountFormData {
  accountName: string;
  businessAccountId: string;
  accessToken: string;
  clickupListId: string;
}

interface FormErrors {
  accountName?: string;
  businessAccountId?: string;
  accessToken?: string;
  clickupListId?: string;
}

/**
 * InstagramAccountForm Component
 * 
 * Renders a form with:
 * - Required fields: accountName, businessAccountId, accessToken, clickupListId
 * - Inline validation and error messages
 * - Submit handler with POST to /api/admin/instagram/accounts
 * - Loading state during submit
 * - Success/error feedback
 */
export const InstagramAccountForm: React.FC<InstagramAccountFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<InstagramAccountFormData>({
    accountName: initialData?.accountName || '',
    businessAccountId: initialData?.businessAccountId || '',
    accessToken: initialData?.accessToken || '',
    clickupListId: initialData?.clickupListId || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Validate a single field in real-time
   */
  const validateField = (field: keyof InstagramAccountFormData, value: string): string | undefined => {
    switch (field) {
      case 'accountName':
        if (!value || value.trim() === '') {
          return 'Nome da conta é obrigatório';
        }
        if (value.length < 2) {
          return 'Nome deve ter pelo menos 2 caracteres';
        }
        if (value.length > 255) {
          return 'Nome não pode exceder 255 caracteres';
        }
        return undefined;

      case 'businessAccountId':
        if (!value || value.trim() === '') {
          return 'ID da conta de negócios é obrigatório';
        }
        if (!/^\d+$/.test(value)) {
          return 'ID deve conter apenas números';
        }
        return undefined;

      case 'accessToken':
        if (!value || value.trim() === '') {
          return 'Token de acesso é obrigatório';
        }
        if (value.length < 10) {
          return 'Token parece inválido (muito curto)';
        }
        return undefined;

      case 'clickupListId':
        if (!value || value.trim() === '') {
          return 'ID da lista ClickUp é obrigatório';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.accountName || formData.accountName.trim() === '') {
      newErrors.accountName = 'Nome da conta é obrigatório';
    }

    if (!formData.businessAccountId || formData.businessAccountId.trim() === '') {
      newErrors.businessAccountId = 'ID da conta de negócios é obrigatório';
    }

    if (!formData.accessToken || formData.accessToken.trim() === '') {
      newErrors.accessToken = 'Token de acesso é obrigatório';
    }

    if (!formData.clickupListId || formData.clickupListId.trim() === '') {
      newErrors.clickupListId = 'ID da lista ClickUp é obrigatório';
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
    setSubmitSuccess(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      // Reset form after successful submission
      setFormData({
        accountName: '',
        businessAccountId: '',
        accessToken: '',
        clickupListId: '',
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Erro ao configurar conta. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleChange = (
    field: keyof InstagramAccountFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation
    const fieldError = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            Configurar Conta Instagram
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Adicione uma nova conta Instagram Business para sincronização automática
          </p>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Erro na configuração</p>
              <p className="text-sm text-red-300 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Success */}
        {submitSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">Conta configurada com sucesso!</p>
              <p className="text-sm text-green-300 mt-1">A sincronização começará em breve</p>
            </div>
          </div>
        )}

        {/* Account Name */}
        <Input
          label="Nome da Conta *"
          type="text"
          value={formData.accountName}
          onChange={(e) => handleChange('accountName', e.target.value)}
          error={!!errors.accountName}
          errorMessage={errors.accountName}
          placeholder="Ex: ALUA Produtora"
          disabled={isSubmitting || isLoading}
        />

        {/* Business Account ID */}
        <Input
          label="ID da Conta de Negócios *"
          type="text"
          value={formData.businessAccountId}
          onChange={(e) => handleChange('businessAccountId', e.target.value)}
          error={!!errors.businessAccountId}
          errorMessage={errors.businessAccountId}
          placeholder="Ex: 123456789"
          disabled={isSubmitting || isLoading}
          description="Encontre este ID nas configurações da sua conta Instagram Business"
        />

        {/* Access Token */}
        <Input
          label="Token de Acesso *"
          type="password"
          value={formData.accessToken}
          onChange={(e) => handleChange('accessToken', e.target.value)}
          error={!!errors.accessToken}
          errorMessage={errors.accessToken}
          placeholder="EAAB..."
          disabled={isSubmitting || isLoading}
          description="Token com permissões: instagram_business_content_read, instagram_business_insights_read"
        />

        {/* ClickUp List ID */}
        <Input
          label="ID da Lista ClickUp *"
          type="text"
          value={formData.clickupListId}
          onChange={(e) => handleChange('clickupListId', e.target.value)}
          error={!!errors.clickupListId}
          errorMessage={errors.clickupListId}
          placeholder="Ex: list-123"
          disabled={isSubmitting || isLoading}
          description="ID da lista ClickUp onde os posts serão criados como tasks"
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-800">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoading}
            className="flex-1"
          >
            {isSubmitting ? 'Configurando...' : 'Configurar Conta'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancelar
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
          <p className="text-xs text-blue-300">
            <strong>Dica:</strong> Certifique-se de que sua conta Instagram é do tipo "Negócios" e que você tem acesso às permissões necessárias.
          </p>
        </div>
      </form>
    </Card>
  );
};
