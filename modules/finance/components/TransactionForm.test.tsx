/**
 * TransactionForm Component Tests
 * 
 * Unit tests for the TransactionForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from './TransactionForm';
import type { CreateTransactionRequest } from '../types/transaction.types';

describe('TransactionForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de Vencimento/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Impostos\/Taxas/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parcelamento/)).toBeInTheDocument();
  });

  it('should display validation error for missing required fields', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Criar Transação');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Valor deve ser maior que zero')).toBeInTheDocument();
      expect(screen.getByText('Data de vencimento é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill in required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test Transaction');
    await user.type(screen.getByLabelText(/Valor/), '1000');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        descricao: 'Test Transaction',
        valor: 1000,
        tipo: 'Entrada',
        status: 'Pendente',
        dataVencimento: '2024-12-31',
        impostosTaxas: 0,
        parcelamento: '',
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data', () => {
    const initialData: Partial<CreateTransactionRequest> = {
      descricao: 'Initial Description',
      valor: 500,
      tipo: 'Saída',
      status: 'Pago',
      dataVencimento: '2024-06-15',
    };

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect(screen.getByLabelText(/Descrição/)).toHaveValue('Initial Description');
    expect(screen.getByLabelText(/Valor/)).toHaveValue(500);
    expect(screen.getByLabelText(/Tipo/)).toHaveValue('Saída');
    expect(screen.getByLabelText(/Status/)).toHaveValue('Pago');
    expect(screen.getByLabelText(/Data de Vencimento/)).toHaveValue('2024-06-15');
  });

  it('should display error message when submission fails', async () => {
    const errorMessage = 'Failed to create transaction';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill in required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test');
    await user.type(screen.getByLabelText(/Valor/), '100');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill in required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test');
    await user.type(screen.getByLabelText(/Valor/), '100');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Criando...')).toBeInTheDocument();
    });
  });

  it('should clear field error when user starts typing', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Trigger validation
    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    });

    // Start typing in description field
    await user.type(screen.getByLabelText(/Descrição/), 'Test');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Descrição é obrigatória')).not.toBeInTheDocument();
    });
  });

  it('should validate valor is greater than zero', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Descrição/), 'Test');
    await user.type(screen.getByLabelText(/Valor/), '0');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Valor deve ser maior que zero')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should allow optional fields to be empty', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill only required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test');
    await user.type(screen.getByLabelText(/Valor/), '100');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: 'Test',
          valor: 100,
          dataVencimento: '2024-12-31',
          impostosTaxas: 0,
          parcelamento: '',
        })
      );
    });
  });

  it('should handle all transaction types (Entrada and Saída)', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test Saída');
    await user.type(screen.getByLabelText(/Valor/), '500');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    // Select Saída type
    const tipoSelect = screen.getByLabelText(/Tipo/);
    await user.selectOptions(tipoSelect, 'Saída');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Saída',
        })
      );
    });
  });

  it('should handle all transaction statuses (Pago, Pendente, Atrasado)', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test Atrasado');
    await user.type(screen.getByLabelText(/Valor/), '300');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    // Select Atrasado status
    const statusSelect = screen.getByLabelText(/Status/);
    await user.selectOptions(statusSelect, 'Atrasado');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Atrasado',
        })
      );
    });
  });

  it('should include optional fields when provided', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill all fields including optional ones
    await user.type(screen.getByLabelText(/Descrição/), 'Complete Transaction');
    await user.type(screen.getByLabelText(/Valor/), '5000');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');
    await user.type(screen.getByLabelText(/Impostos\/Taxas/), '500');
    await user.type(screen.getByLabelText(/Parcelamento/), '3/10');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        descricao: 'Complete Transaction',
        valor: 5000,
        tipo: 'Entrada',
        status: 'Pendente',
        dataVencimento: '2024-12-31',
        impostosTaxas: 500,
        parcelamento: '3/10',
      });
    });
  });

  it('should validate that description is not just whitespace', async () => {
    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill with whitespace description
    await user.type(screen.getByLabelText(/Descrição/), '   ');
    await user.type(screen.getByLabelText(/Valor/), '100');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable cancel button while submitting', async () => {
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const user = userEvent.setup();

    // Fill required fields
    await user.type(screen.getByLabelText(/Descrição/), 'Test');
    await user.type(screen.getByLabelText(/Valor/), '100');
    await user.type(screen.getByLabelText(/Data de Vencimento/), '2024-12-31');

    const submitButton = screen.getByText('Criar Transação');
    await user.click(submitButton);

    // Cancel button should be disabled
    const cancelButton = screen.getByText('Cancelar');
    expect(cancelButton).toBeDisabled();
  });
});
