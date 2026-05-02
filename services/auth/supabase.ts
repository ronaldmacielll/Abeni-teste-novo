/**
 * Supabase Auth Service
 * 
 * Handles authentication with Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    
    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }
  }

  async getSession(): Promise<Session | null> {
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
  }

  async refreshToken(): Promise<string> {
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session) {
      throw new Error('Failed to refresh token')
    }

    return data.session.access_token
  }
}

export const authService = new AuthService()
