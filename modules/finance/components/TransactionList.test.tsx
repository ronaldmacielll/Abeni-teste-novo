/**
 * TransactionList Component Tests
 * 
 * Unit tests for the TransactionList component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionList } from './TransactionList';
import type { Transaction } from '../types/transaction.types';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    descricao: 'Pagamento Cliente A',
    valor: 5000,
    tipo: 'Entrada',
    status: 'Pago',
    dataVencimento: '2024-01-15T00:00:00.000Z',
    impostosTaxas: 500,
    parcelamento: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    clientId: 'client-123',
  },
  {
    id: '2',
    descricao: 'Fornecedor X',
    valor: 2000,
    tipo: 'Saída',
    status: 'Pendente',
    dataVencimento: '2024-01-20T00:00:00.000Z',
    impostosTaxas: 0,
    parcelamento: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    clientId: 'client-123',
  },
  {
    id: '3',
    descricao: 'Serviço Atrasado',
    valor: 1500,
    tipo: 'Saída',
    status: 'Atrasado',
    dataVencimento: '2024-01-10T00:00:00.000Z',
    impostosTaxas: 0,
    parcelamento: null,
    createdAt: '2024-01-03T00:00:00.000Z',
    clientId: 'client-123',
  },
];

const mockTransactionWithInstallment: Transaction = {
  id: '4',
  descricao: 'Pagamento Parcelado',
  valor: 3000,
  tipo: 'Entrada',
  status: 'Pendente',
  dataVencimento: '2024-02-01T00:00:00.000Z',
  impostosTaxas: 0,
  parcelamento: {
    current: 3,
    total: 10,
    valuePerInstallment: 300,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  clientId: 'client-123',
};

describe('TransactionList Component', () => {
  it('should render transaction list with all transactions', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('Pagamento Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor X')).toBeInTheDocument();
    expect(screen.getByText('Serviço Atrasado')).toBeInTheDocument();
  });

  it('should display green indicator for Pago status', () => {
    render(<TransactionList transactions={mockTransactions} />);

    const pagoStatus = screen.getByText('Pago');
    expect(pagoStatus).toBeInTheDocument();
    expect(pagoStatus.closest('div')).toHaveClass('bg-success-light');
  });

  it('should display yellow indicator for Pendente status', () => {
    render(<TransactionList transactions={mockTransactions} />);

    const pendenteStatus = screen.getAllByText('Pendente')[0];
    expect(pendenteStatus).toBeInTheDocument();
    expect(pendenteStatus.closest('div')).toHaveClass('bg-warning-light');
  });

  it('should display red indicator for Atrasado status', () => {
    render(<TransactionList transactions={mockTransactions} />);

    const atrasadoStatus = screen.getByText('Atrasado');
    expect(atrasadoStatus).toBeInTheDocument();
    expect(atrasadoStatus.closest('div')).toHaveClass('bg-danger-light');
  });

  it('should format currency values correctly', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText(/\+ R\$ 5\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/- R\$ 2\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/- R\$ 1\.500,00/)).toBeInTheDocument();
  });

  it('should display transaction type badges', () => {
    render(<TransactionList transactions={mockTransactions} />);

    const entradaBadges = screen.getAllByText('Entrada');
    const saidaBadges = screen.getAllByText('Saída');

    expect(entradaBadges.length).toBeGreaterThan(0);
    expect(saidaBadges.length).toBeGreaterThan(0);
  });

  it('should display installment information when present', () => {
    render(<TransactionList transactions={[mockTransactionWithInstallment]} />);

    expect(screen.getByText(/Parcela 3 de 10/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 300,00\/parcela/)).toBeInTheDocument();
  });

  it('should display taxes when present', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText(/Impostos: R\$ 500,00/)).toBeInTheDocument();
  });

  it('should sort transactions by due date in ascending order', () => {
    render(<TransactionList transactions={mockTransactions} />);

    const rows = screen.getAllByRole('row');
    // First row is header, so data rows start at index 1
    const firstDataRow = rows[1];
    const lastDataRow = rows[rows.length - 1];

    // First transaction should be the one with earliest date (id: 3, date: 2024-01-10)
    expect(firstDataRow).toHaveTextContent('Serviço Atrasado');
    // Last transaction should be the one with latest date (id: 2, date: 2024-01-20)
    expect(lastDataRow).toHaveTextContent('Fornecedor X');
  });

  it('should display empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />);

    expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument();
  });

  it('should display formatted dates', () => {
    render(<TransactionList transactions={mockTransactions} />);

    // Dates should be formatted as DD/MM/YYYY
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
    expect(screen.getByText('20/01/2024')).toBeInTheDocument();
    expect(screen.getByText('10/01/2024')).toBeInTheDocument();
  });

  it('should apply positive color to Entrada transactions', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />);

    const entradaValue = screen.getByText(/\+ R\$ 5\.000,00/);
    expect(entradaValue).toHaveClass('text-success-text');
  });

  it('should apply negative color to Saída transactions', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />);

    const saidaValues = screen.getAllByText(/- R\$/);
    saidaValues.forEach((value) => {
      expect(value).toHaveClass('text-danger-text');
    });
  });

  it('should highlight transactions with due date equal to today', () => {
    const today = new Date();
    const todayISO = today.toISOString();

    const transactionDueToday: Transaction = {
      id: '5',
      descricao: 'Vence Hoje',
      valor: 1000,
      tipo: 'Entrada',
      status: 'Pendente',
      dataVencimento: todayISO,
      impostosTaxas: 0,
      parcelamento: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      clientId: 'client-123',
    };

    const { container } = render(<TransactionList transactions={[transactionDueToday]} />);

    // Row should have blue background highlight
    const row = screen.getByText('Vence Hoje').closest('tr');
    expect(row).toHaveClass('bg-blue-50');

    // Should display "Vence hoje" label
    expect(screen.getByText('Vence hoje')).toBeInTheDocument();
  });

  it('should not highlight transactions with due date not equal to today', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />);

    // None of the mock transactions are due today, so no "Vence hoje" label should appear
    expect(screen.queryByText('Vence hoje')).not.toBeInTheDocument();
  });

  it('should handle transactions with zero taxes', () => {
    const transactionNoTaxes: Transaction = {
      id: '6',
      descricao: 'Sem Impostos',
      valor: 1000,
      tipo: 'Entrada',
      status: 'Pago',
      dataVencimento: '2024-02-01T00:00:00.000Z',
      impostosTaxas: 0,
      parcelamento: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      clientId: 'client-123',
    };

    render(<TransactionList transactions={[transactionNoTaxes]} />);

    // Should not display taxes line when impostosTaxas is 0
    expect(screen.queryByText(/Impostos:/)).not.toBeInTheDocument();
  });

  it('should display all status indicators correctly', () => {
    render(<TransactionList transactions={mockTransactions} />);

    // Verify all three status types are rendered with correct styling
    const pagoIndicator = screen.getByText('Pago').closest('div');
    const pendenteIndicator = screen.getAllByText('Pendente')[0].closest('div');
    const atrasadoIndicator = screen.getByText('Atrasado').closest('div');

    expect(pagoIndicator).toHaveClass('bg-success-light');
    expect(pendenteIndicator).toHaveClass('bg-warning-light');
    expect(atrasadoIndicator).toHaveClass('bg-danger-light');
  });

  it('should sort transactions in descending order when sortDirection is desc', () => {
    render(
      <TransactionList 
        transactions={mockTransactions} 
        sortDirection="desc"
      />
    );

    const rows = screen.getAllByRole('row');
    // First data row should have the latest date
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveTextContent('Fornecedor X');
  });
});
