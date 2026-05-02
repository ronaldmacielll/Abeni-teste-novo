/**
 * Supabase Auth Service
 * 
 * Handles authentication with Supabase
 * Includes fallback for development with hardcoded admin user
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Hardcoded admin user for development
const HARDCODED_ADMIN = {
  email: 'adm',
  password: '34775585',
  user: {
    id: 'admin-dev-001',
    email: 'admin@dev.local',
    clientId: 'admin-client',
    role: 'internal' as const,
    metadata: {
      name: 'Administrador',
      company: 'Sistema',
    },
  },
}

// Check if we're using temporary Supabase values
const isUsingTempSupabase = supabaseUrl?.includes('temp-project') || !supabaseUrl || !supabaseAnonKey

let supabase: any = null

if (!isUsingTempSupabase) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client, using fallback auth')
  }
}

export interface User {
  id: string
  email: string
  clientId: string
  role: 'client' | 'internal'
  metadata: {
    name?: string
    company?: string
  }
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: User
}

export interface AuthResponse {
  user: User
  session: Session
  token: string
}

export class AuthService {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    // Check for hardcoded admin user first
    if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
      const now = Date.now()
      const expiresAt = now + (7 * 24 * 60 * 60 * 1000) // 7 days from now
      
      const session: Session = {
        accessToken: `dev-token-${now}`,
        refreshToken: `dev-refresh-${now}`,
        expiresAt: Math.floor(expiresAt / 1000),
        user: HARDCODED_ADMIN.user,
      }

      // Store token in cookie for middleware access
      if (typeof document !== 'undefined') {
        document.cookie = `sb-access-token=${session.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${session.refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }

      return {
        user: HARDCODED_ADMIN.user,
        session,
        token: session.accessToken,
      }
    }

    // If not using temp Supabase, try real authentication
    if (!isUsingTempSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(`Authentication failed: ${error.message}`)
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed: No user or session returned')
      }

      // Get user profile with client_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`)
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        clientId: profile.client_id,
        role: profile.role,
        metadata: profile.metadata || {},
      }

      const session: Session = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
        user,
      }

      // Store token in cookie for middleware access
      if (typeof document !== 'undefined') {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }

      return {
        user,
        session,
        token: data.session.access_token,
      }
    }

    // If we get here, credentials are invalid
    throw new Error('Credenciais inválidas')
  }

  async signOut(): Promise<void> {
    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    // Try to sign out from Supabase if available
    if (!isUsingTempSupabase && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.warn('Supabase sign out failed:', error)
      }
    }
  }

  async getSession(): Promise<Session | null> {
    // Check for dev token in cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const accessToken = cookies['sb-access-token']
      
      // If it's a dev token, return hardcoded session
      if (accessToken?.startsWith('dev-token-')) {
        const now = Date.now()
        const expiresAt = now + (7 * 24 * 60 * 60 * 1000)
        
        return {
          accessToken,
          refreshToken: cookies['sb-refresh-token'] || '',
          expiresAt: Math.floor(expiresAt / 1000),
          user: HARDCODED_ADMIN.user,
        }
      }
    }

    // Try to get session from Supabase if available
    if (!isUsingTempSupabase && supabase) {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          return null
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (!profile) {
          return null
        }

        const user: User = {
          id: data.session.user.id,
          email: data.session.user.email!,
          clientId: profile.client_id,
          role: profile.role,
          metadata: profile.metadata || {},
        }

        return {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          user,
        }
      } catch (error) {
        console.warn('Failed to get Supabase session:', error)
      }
    }

    return null
  }

  async refreshToken(): Promise<string> {
    // For dev tokens, just return the same token
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const accessToken = cookies['sb-access-token']
      
      if (accessToken?.startsWith('dev-token-')) {
        return accessToken
      }
    }

    // Try to refresh from Supabase if available
    if (!isUsingTempSupabase && supabase) {
      const { data, error } = await supabase.auth.refreshSession()

      if (error || !data.session) {
        throw new Error('Failed to refresh token')
      }

      return data.session.access_token
    }

    throw new Error('Failed to refresh token')
  }
}

export const authService = new AuthService()
export { supabase }
