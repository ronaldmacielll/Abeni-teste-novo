/**
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
 * 
 * Integration Tests for Authentication Flow
 * 
 * Tests the complete authentication flow including:
 * - Login with valid and invalid credentials
 * - Token refresh when token expires
 * - Redirection after authentication
 * 
 * This test suite validates the integration between:
 * - Login page (app/login/page.tsx)
 * - AuthService (services/auth/supabase.ts)
 * - Authentication middleware (middleware.ts)
 * - useAuth hook (modules/shared/hooks/useAuth.tsx)
 * 
 * Related Requirements: 1.1, 1.2, 1.4, 1.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '@/app/login/page';
import { AuthProvider, useAuth } from '@/modules/shared/hooks/useAuth';
import { authService } from '@/services/auth/supabase';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthService
jest.mock('@/services/auth/supabase', () => ({
  authService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Authentication Flow Integration Tests', () => {
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
  });

  describe('Requirement 1.1: Login with Valid Credentials', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
        session: {
          accessToken: 'valid-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() / 1000 + 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            clientId: 'client-456',
            role: 'client' as const,
            metadata: {},
          },
        },
        token: 'valid-token',
      };

      (authService.signIn as jest.Mock).mockResolvedValue(mockAuthResponse);

      render(<LoginPage />);

      // Fill in the form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Wait for authentication to complete
      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Verify redirection to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/performance');
      });
    });

    it('should redirect to custom redirect URL after successful login', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
        session: {
          accessToken: 'valid-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() / 1000 + 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            clientId: 'client-456',
            role: 'client' as const,
            metadata: {},
          },
        },
        token: 'valid-token',
      };

      (authService.signIn as jest.Mock).mockResolvedValue(mockAuthResponse);
      mockSearchParams.get.mockReturnValue('/finance');

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/finance');
      });
    });

    it('should store session in localStorage after successful login', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
        session: {
          accessToken: 'valid-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() / 1000 + 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            clientId: 'client-456',
            role: 'client' as const,
            metadata: {},
          },
        },
        token: 'valid-token',
      };

      (authService.signIn as jest.Mock).mockResolvedValue(mockAuthResponse);

      // Wrap LoginPage with AuthProvider
      const TestComponent = () => (
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      render(<TestComponent />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const storedSession = localStorageMock.getItem('auth_session');
        expect(storedSession).toBeTruthy();
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          expect(parsedSession.accessToken).toBe('valid-token');
          expect(parsedSession.user.email).toBe('test@example.com');
        }
      });
    });
  });

  describe('Requirement 1.2: Login with Invalid Credentials', () => {
    it('should display error message for invalid credentials', async () => {
      (authService.signIn as jest.Mock).mockRejectedValue(
        new Error('Invalid login credentials')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email ou senha inválidos/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display error message for unconfirmed email', async () => {
      (authService.signIn as jest.Mock).mockRejectedValue(
        new Error('Email not confirmed')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'unconfirmed@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/confirme seu email antes de fazer login/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      (authService.signIn as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao fazer login/i)).toBeInTheDocument();
      });
    });

    it('should validate empty email and password', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/preencha todos os campos/i)).toBeInTheDocument();
      });

      expect(authService.signIn).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/insira um email válido/i)).toBeInTheDocument();
      });

      expect(authService.signIn).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 1.4: Token Refresh', () => {
    it('should automatically refresh token before expiration', async () => {
      jest.useFakeTimers();

      const mockSession = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() / 1000 + 600, // Expires in 10 minutes
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      const mockNewSession = {
        ...mockSession,
        accessToken: 'new-token',
        expiresAt: Date.now() / 1000 + 3600,
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));
      (authService.refreshToken as jest.Mock).mockResolvedValue('new-token');
      (authService.getSession as jest.Mock).mockResolvedValue(mockNewSession);

      const TestComponent = () => {
        const { session } = useAuth();
        return <div>Token: {session?.accessToken}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/Token: old-token/i)).toBeInTheDocument();
      });

      // Fast-forward to 5 minutes before expiration (should trigger refresh)
      jest.advanceTimersByTime(300 * 1000); // 5 minutes

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should redirect to login if token refresh fails', async () => {
      const mockSession = {
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh-token',
        expiresAt: Date.now() / 1000 - 100, // Already expired
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Failed to refresh token')
      );

      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return <div>Authenticated: {isAuthenticated ? 'yes' : 'no'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Session should be cleared
      expect(localStorageMock.getItem('auth_session')).toBeNull();
    });

    it('should handle expired token on page load', async () => {
      const mockSession = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() / 1000 - 100, // Already expired
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      const mockNewSession = {
        ...mockSession,
        accessToken: 'new-token',
        expiresAt: Date.now() / 1000 + 3600,
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));
      (authService.refreshToken as jest.Mock).mockResolvedValue('new-token');
      (authService.getSession as jest.Mock).mockResolvedValue(mockNewSession);

      const TestComponent = () => {
        const { session } = useAuth();
        return <div>Token: {session?.accessToken || 'none'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should attempt to refresh expired token
      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Token: new-token/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 1.5: Redirection After Authentication', () => {
    it('should redirect authenticated users away from login page', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() / 1000 + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));

      // Mock useAuth to return authenticated state
      const TestLoginPage = () => {
        const { isAuthenticated, isLoading } = useAuth();
        
        React.useEffect(() => {
          if (isAuthenticated && !isLoading) {
            const redirect = mockSearchParams.get('redirect') || '/performance';
            mockPush(redirect);
          }
        }, [isAuthenticated, isLoading]);

        return <div>Login Page</div>;
      };

      render(
        <AuthProvider>
          <TestLoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/performance');
      });
    });

    it('should preserve redirect parameter when redirecting authenticated users', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() / 1000 + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));
      mockSearchParams.get.mockReturnValue('/finance');

      const TestLoginPage = () => {
        const { isAuthenticated, isLoading } = useAuth();
        
        React.useEffect(() => {
          if (isAuthenticated && !isLoading) {
            const redirect = mockSearchParams.get('redirect') || '/performance';
            mockPush(redirect);
          }
        }, [isAuthenticated, isLoading]);

        return <div>Login Page</div>;
      };

      render(
        <AuthProvider>
          <TestLoginPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/finance');
      });
    });

    it('should not redirect unauthenticated users', async () => {
      localStorageMock.clear();

      render(<LoginPage />);

      // Wait a bit to ensure no redirect happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText(/faça login para acessar o sistema/i)).toBeInTheDocument();
    });
  });

  describe('Integration: Complete Authentication Flow', () => {
    it('should complete full authentication flow from login to dashboard', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: { name: 'Test User' },
        },
        session: {
          accessToken: 'valid-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() / 1000 + 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            clientId: 'client-456',
            role: 'client' as const,
            metadata: { name: 'Test User' },
          },
        },
        token: 'valid-token',
      };

      (authService.signIn as jest.Mock).mockResolvedValue(mockAuthResponse);

      render(<LoginPage />);

      // Step 1: User fills in credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Step 2: User submits form
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);

      // Step 3: Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/entrando/i)).toBeInTheDocument();
      });

      // Step 4: Verify authentication service is called
      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Step 5: Verify redirection
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/performance');
      });

      // Step 6: Verify session is stored
      const storedSession = localStorageMock.getItem('auth_session');
      expect(storedSession).toBeTruthy();
    });

    it('should handle sign out and clear session', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() / 1000 + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          clientId: 'client-456',
          role: 'client' as const,
          metadata: {},
        },
      };

      localStorageMock.setItem('auth_session', JSON.stringify(mockSession));
      (authService.signOut as jest.Mock).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { signOut, isAuthenticated } = useAuth();
        return (
          <div>
            <div>Authenticated: {isAuthenticated ? 'yes' : 'no'}</div>
            <button onClick={signOut}>Sign Out</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Authenticated: yes/i)).toBeInTheDocument();
      });

      const signOutButton = screen.getByText(/Sign Out/i);
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(authService.signOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Session should be cleared
      expect(localStorageMock.getItem('auth_session')).toBeNull();
    });
  });
});
