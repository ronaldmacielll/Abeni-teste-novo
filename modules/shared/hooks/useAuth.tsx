'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User, Session } from '@/services/auth/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session from storage and validate
  const loadSession = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('auth_session');
      if (storedSession) {
        const parsedSession: Session = JSON.parse(storedSession);
        
        // Check if token is expired
        const now = Date.now() / 1000;
        if (parsedSession.expiresAt > now) {
          setSession(parsedSession);
          setUser(parsedSession.user);
        } else {
          // Token expired, try to refresh
          await refreshSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      localStorage.removeItem('auth_session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh session token
  const refreshSession = useCallback(async () => {
    try {
      const newToken = await authService.refreshToken();
      const newSession = await authService.getSession();
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        localStorage.setItem('auth_session', JSON.stringify(newSession));
      } else {
        throw new Error('Failed to get new session');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession(null);
      setUser(null);
      localStorage.removeItem('auth_session');
      router.push('/login');
    }
  }, [router]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.signIn(email, password);
    setSession(response.session);
    setUser(response.user);
    localStorage.setItem('auth_session', JSON.stringify(response.session));
    
    // Cookies are set by authService.signIn
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSession(null);
      setUser(null);
      localStorage.removeItem('auth_session');
      // Cookies are cleared by authService.signOut
      router.push('/login');
    }
  }, [router]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!session) return;

    const now = Date.now() / 1000;
    const expiresIn = session.expiresAt - now;
    
    // Refresh token 5 minutes before expiration
    const refreshTime = Math.max(0, (expiresIn - 300) * 1000);

    const refreshTimer = setTimeout(() => {
      refreshSession();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [session, refreshSession]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
