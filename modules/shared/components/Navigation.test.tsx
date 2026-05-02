/**
 * Navigation Component Tests
 * 
 * Tests for the Navigation component
 * Validates Requirements: 16.1, 16.2, 16.3, 16.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';
import { useAuth } from '@/modules/shared/hooks/useAuth';
import { usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('@/modules/shared/hooks/useAuth');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Navigation Component', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/performance');
  });

  describe('Module Links', () => {
    it('should display Performance link for all users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'client@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const performanceLink = screen.getByRole('link', { name: /performance/i });
      expect(performanceLink).toBeInTheDocument();
      expect(performanceLink).toHaveAttribute('href', '/performance');
    });

    it('should display Finance link only for internal users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'internal@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const financeLink = screen.getByRole('link', { name: /financeiro/i });
      expect(financeLink).toBeInTheDocument();
      expect(financeLink).toHaveAttribute('href', '/finance');
    });

    it('should NOT display Finance link for client users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'client@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const financeLink = screen.queryByRole('link', { name: /financeiro/i });
      expect(financeLink).not.toBeInTheDocument();
    });
  });

  describe('Active Module Highlighting', () => {
    it('should highlight Performance module when on performance page', () => {
      mockUsePathname.mockReturnValue('/performance');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const performanceLink = screen.getByRole('link', { name: /performance/i });
      expect(performanceLink).toHaveClass('border-primary-500');
      expect(performanceLink).toHaveClass('text-gray-900');
    });

    it('should highlight Finance module when on finance page', () => {
      mockUsePathname.mockReturnValue('/finance');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const financeLink = screen.getByRole('link', { name: /financeiro/i });
      expect(financeLink).toHaveClass('border-primary-500');
      expect(financeLink).toHaveClass('text-gray-900');
    });

    it('should not highlight inactive modules', () => {
      mockUsePathname.mockReturnValue('/performance');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const financeLink = screen.getByRole('link', { name: /financeiro/i });
      expect(financeLink).toHaveClass('border-transparent');
      expect(financeLink).toHaveClass('text-gray-500');
    });
  });

  describe('User Information Display', () => {
    it('should display user email when name is not available', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    it('should display user name when available', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '1', 
          email: 'user@test.com', 
          clientId: 'client-1', 
          role: 'client', 
          metadata: { name: 'John Doe' } 
        },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display "Cliente" for client role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'client@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      expect(screen.getByText('Cliente')).toBeInTheDocument();
    });

    it('should display "Interno" for internal role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'internal@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      expect(screen.getByText('Interno')).toBeInTheDocument();
    });
  });

  describe('Logout Button', () => {
    it('should display logout button', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const logoutButton = screen.getByRole('button', { name: /sair/i });
      expect(logoutButton).toBeInTheDocument();
    });

    it('should call signOut when logout button is clicked', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation />);

      const logoutButton = screen.getByRole('button', { name: /sair/i });
      fireEvent.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Override', () => {
    it('should use currentModule prop when provided', () => {
      mockUsePathname.mockReturnValue('/performance');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'internal', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation currentModule="finance" />);

      const financeLink = screen.getByRole('link', { name: /financeiro/i });
      expect(financeLink).toHaveClass('border-primary-500');
    });

    it('should use userRole prop when provided', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', clientId: 'client-1', role: 'client', metadata: {} },
        session: null,
        isLoading: false,
        isAuthenticated: true,
        signIn: jest.fn(),
        signOut: mockSignOut,
        refreshSession: jest.fn(),
      });

      render(<Navigation userRole="internal" />);

      // Should show finance link even though user role is 'client'
      const financeLink = screen.getByRole('link', { name: /financeiro/i });
      expect(financeLink).toBeInTheDocument();
    });
  });
});
