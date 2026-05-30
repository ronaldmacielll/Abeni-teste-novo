/**
 * InstagramAccountList Component Tests
 * 
 * Tests for list rendering, actions, and states
 * Implements Requirements: 8.1, 16.1, 16.2
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstagramAccountList, type InstagramAccount } from './InstagramAccountList';

describe('InstagramAccountList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSync = jest.fn();

  const mockAccounts: InstagramAccount[] = [
    {
      accountId: 'acc-1',
      accountName: 'ALUA Produtora',
      businessAccountId: '123456789',
      isActive: true,
      lastSyncTime: '2024-01-15T10:30:00Z',
      nextSyncTime: '2024-01-15T10:35:00Z',
    },
    {
      accountId: 'acc-2',
      accountName: 'Test Account',
      businessAccountId: '987654321',
      isActive: false,
      lastSyncTime: '2024-01-14T15:20:00Z',
      nextSyncTime: '2024-01-15T15:20:00Z',
      lastError: 'Token expired',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with all accounts', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText('ALUA Produtora')).toBeInTheDocument();
      expect(screen.getByText('Test Account')).toBeInTheDocument();
    });

    it('should render account IDs', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/123456789/)).toBeInTheDocument();
      expect(screen.getByText(/987654321/)).toBeInTheDocument();
    });

    it('should render status badges', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      const badges = screen.getAllByText(/Ativa|Inativa/);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('should render action buttons', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      // Should have sync, edit, and delete buttons for each account
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6); // 3 buttons per account
    });

    it('should display error message when error prop is provided', () => {
      render(
        <InstagramAccountList
          accounts={[]}
          error="Erro ao carregar contas"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Erro ao carregar contas/i, { selector: 'p.text-sm.font-medium' })).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(
        <InstagramAccountList
          accounts={[]}
          isLoading={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Carregando contas/i)).toBeInTheDocument();
    });

    it('should display empty state when no accounts', () => {
      render(
        <InstagramAccountList
          accounts={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Nenhuma conta Instagram configurada/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onSync when sync button is clicked', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      const syncButtons = screen.getAllByTitle('Sincronizar agora');
      fireEvent.click(syncButtons[0]);

      expect(mockOnSync).toHaveBeenCalledWith('acc-1');
    });

    it('should call onEdit when edit button is clicked', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      const editButtons = screen.getAllByTitle('Editar conta');
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith('acc-1');
    });

    it('should call onDelete when delete button is clicked', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      const deleteButtons = screen.getAllByTitle('Deletar conta');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith('acc-1');
    });
  });

  describe('Status Display', () => {
    it('should show active status for active accounts', () => {
      render(
        <InstagramAccountList
          accounts={[mockAccounts[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });

    it('should show inactive status for inactive accounts', () => {
      render(
        <InstagramAccountList
          accounts={[mockAccounts[1]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText('Inativa')).toBeInTheDocument();
    });

    it('should display last error message', () => {
      render(
        <InstagramAccountList
          accounts={[mockAccounts[1]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      expect(screen.getByText(/Token expired/)).toBeInTheDocument();
    });
  });

  describe('Sync State', () => {
    it('should disable buttons when account is syncing', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
          isSyncing={{ 'acc-1': true }}
        />
      );

      const buttons = screen.getAllByRole('button');
      // First 3 buttons (for acc-1) should be disabled
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
      expect(buttons[2]).toBeDisabled();
    });

    it('should show spinning animation when syncing', () => {
      const { container } = render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
          isSyncing={{ 'acc-1': true }}
        />
      );

      const spinningElements = container.querySelectorAll('.animate-spin');
      expect(spinningElements.length).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(
        <InstagramAccountList
          accounts={mockAccounts}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      // Check that dates are formatted (should contain / for date separator in pt-BR format)
      const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('should display dash for missing dates', () => {
      const accountWithoutDates: InstagramAccount = {
        accountId: 'acc-3',
        accountName: 'No Dates Account',
        businessAccountId: '111111111',
        isActive: true,
      };

      render(
        <InstagramAccountList
          accounts={[accountWithoutDates]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSync={mockOnSync}
        />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });
});
