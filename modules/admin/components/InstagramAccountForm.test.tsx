/**
 * InstagramAccountForm Component Tests
 * 
 * Tests for form rendering, validation, and submission
 * Implements Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstagramAccountForm } from './InstagramAccountForm';

describe('InstagramAccountForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Nome da Conta/i)).toBeInTheDocument();
      expect(screen.getByText(/ID da Conta de Negócios/i)).toBeInTheDocument();
      expect(screen.getByText(/Token de Acesso/i)).toBeInTheDocument();
      expect(screen.getByText(/ID da Lista ClickUp/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /Configurar Conta/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    it('should render with initial data', () => {
      const initialData = {
        accountName: 'Test Account',
        businessAccountId: '123456',
        accessToken: 'token123',
        clickupListId: 'list-123',
      };

      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      );

      expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('list-123')).toBeInTheDocument();
    });
  });;

  describe('Validation', () => {
    it('should show error when accountName is empty', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Nome da conta é obrigatório/i)).toBeInTheDocument();
    });

    it('should show error when businessAccountId is empty', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const accountNameInput = screen.getByPlaceholderText(/ALUA Produtora/i) as HTMLInputElement;
      fireEvent.change(accountNameInput, { target: { value: 'Test Account' } });

      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/ID da conta de negócios é obrigatório/i)).toBeInTheDocument();
    });

    it('should show error when accessToken is empty', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const accountNameInput = screen.getByPlaceholderText(/ALUA Produtora/i) as HTMLInputElement;
      const businessIdInput = screen.getByPlaceholderText(/123456789/i) as HTMLInputElement;

      fireEvent.change(accountNameInput, { target: { value: 'Test Account' } });
      fireEvent.change(businessIdInput, { target: { value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Token de acesso é obrigatório/i)).toBeInTheDocument();
    });

    it('should show error when clickupListId is empty', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const accountNameInput = screen.getByPlaceholderText(/ALUA Produtora/i) as HTMLInputElement;
      const businessIdInput = screen.getByPlaceholderText(/123456789/i) as HTMLInputElement;
      const tokenInput = screen.getByPlaceholderText(/EAAB/i) as HTMLInputElement;

      fireEvent.change(accountNameInput, { target: { value: 'Test Account' } });
      fireEvent.change(businessIdInput, { target: { value: '123456' } });
      fireEvent.change(tokenInput, { target: { value: 'token123' } });

      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/ID da lista ClickUp é obrigatório/i)).toBeInTheDocument();
    });

    it('should clear error when field is filled', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Nome da conta é obrigatório/i)).toBeInTheDocument();

      const accountNameInput = screen.getByPlaceholderText(/ALUA Produtora/i) as HTMLInputElement;
      fireEvent.change(accountNameInput, { target: { value: 'Test Account' } });

      expect(screen.queryByText(/Nome da conta é obrigatório/i)).not.toBeInTheDocument();
    });
  });

  describe('Cancel', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form when isLoading is true', () => {
      render(
        <InstagramAccountForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const accountNameInput = screen.getByPlaceholderText(/ALUA Produtora/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Configurar Conta/i }) as HTMLButtonElement;

      expect(accountNameInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });
  });
});
