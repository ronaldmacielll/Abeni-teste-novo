/**
 * SyncHistory Component Tests
 * 
 * Tests for history display, pagination, and filtering
 * Implements Requirements: 11.1, 11.2, 17.1
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncHistory, type SyncHistoryEntry } from './SyncHistory';

describe('SyncHistory', () => {
  const mockOnPageChange = jest.fn();
  const mockOnFilterChange = jest.fn();

  const mockEntries: SyncHistoryEntry[] = [
    {
      id: 'sync-1',
      accountId: 'acc-1',
      accountName: 'ALUA Produtora',
      status: 'success',
      postsProcessed: 15,
      tasksCreated: 10,
      tasksUpdated: 5,
      metricsUpdated: 15,
      durationMs: 5432,
      startedAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T10:30:05Z',
    },
    {
      id: 'sync-2',
      accountId: 'acc-2',
      accountName: 'Test Account',
      status: 'partial',
      postsProcessed: 8,
      tasksCreated: 5,
      tasksUpdated: 3,
      metricsUpdated: 8,
      errorMessage: 'Some posts failed to process',
      durationMs: 3200,
      startedAt: '2024-01-15T10:25:00Z',
      completedAt: '2024-01-15T10:25:03Z',
    },
  ];

  const mockAccounts = [
    { accountId: 'acc-1', accountName: 'ALUA Produtora' },
    { accountId: 'acc-2', accountName: 'Test Account' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with all entries', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const entries = screen.getAllByText(/ALUA Produtora|Test Account/);
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should render status badges', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Sucesso')).toBeInTheDocument();
      expect(screen.getByText('Parcial')).toBeInTheDocument();
    });

    it('should render metrics', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument(); // Posts processed
      expect(screen.getByText('10')).toBeInTheDocument(); // Tasks created
    });

    it('should render loading state', () => {
      render(
        <SyncHistory
          entries={[]}
          isLoading={true}
          totalCount={0}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Carregando histórico/i)).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(
        <SyncHistory
          entries={[]}
          error="Erro ao carregar histórico"
          totalCount={0}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Erro ao carregar histórico/i, { selector: 'p.text-sm.font-medium' })).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(
        <SyncHistory
          entries={[]}
          totalCount={0}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Nenhuma sincronização encontrada/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls when multiple pages', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={25}
          pageSize={10}
          currentPage={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Próxima/i })).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={25}
          pageSize={10}
          currentPage={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /Anterior/i });
      expect(previousButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={25}
          pageSize={10}
          currentPage={3}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Próxima/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when next button is clicked', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={25}
          pageSize={10}
          currentPage={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Próxima/i });
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when previous button is clicked', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={25}
          pageSize={10}
          currentPage={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /Anterior/i });
      fireEvent.click(previousButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should not render pagination when single page', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          pageSize={10}
          currentPage={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render filter select', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const select = screen.getByDisplayValue('Todas as contas');
      expect(select).toBeInTheDocument();
    });

    it('should render account options in filter', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const options = screen.getAllByText(/ALUA Produtora|Test Account/);
      expect(options.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onFilterChange when filter is changed', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const select = screen.getByDisplayValue('Todas as contas') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'acc-1' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith('acc-1');
    });

    it('should call onFilterChange with null when all accounts is selected', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      const select = screen.getByDisplayValue('Todas as contas') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Status Display', () => {
    it('should display success status', () => {
      render(
        <SyncHistory
          entries={[mockEntries[0]]}
          totalCount={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Sucesso')).toBeInTheDocument();
    });

    it('should display partial status', () => {
      render(
        <SyncHistory
          entries={[mockEntries[1]]}
          totalCount={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Parcial')).toBeInTheDocument();
    });

    it('should display error message for failed syncs', () => {
      render(
        <SyncHistory
          entries={[mockEntries[1]]}
          totalCount={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Some posts failed to process/)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that dates are formatted (should contain / for date separator in pt-BR format)
      const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Duration Formatting', () => {
    it('should format milliseconds correctly', () => {
      render(
        <SyncHistory
          entries={[
            {
              ...mockEntries[0],
              durationMs: 500,
            },
          ]}
          totalCount={1}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/500ms/)).toBeInTheDocument();
    });

    it('should format seconds correctly', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={2}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/5\.4s/)).toBeInTheDocument();
    });
  });

  describe('Total Count Display', () => {
    it('should display total count', () => {
      render(
        <SyncHistory
          entries={mockEntries}
          totalCount={42}
          accounts={mockAccounts}
          onPageChange={mockOnPageChange}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Total: 42 sincronizações/)).toBeInTheDocument();
    });
  });
});
