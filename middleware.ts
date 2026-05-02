import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractClientIdFromToken } from './services/auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/performance', '/finance', '/dashboard'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login'];

// Validate Supabase JWT token
async function validateSupabaseToken(token: string): Promise<boolean> {
  try {
    // Check if it's a development token (hardcoded admin)
    if (token.startsWith('dev-token-')) {
      console.log('Validating development token');
      return true;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if we're using temporary Supabase values
    const isUsingTempSupabase = 
      !supabaseUrl || 
      !supabaseAnonKey || 
      supabaseUrl.includes('temp-project') || 
      supabaseUrl.includes('your_supabase') ||
      supabaseAnonKey.includes('temp_anon') ||
      supabaseAnonKey.includes('your_supabase');

    if (isUsingTempSupabase) {
      console.log('Using temporary Supabase config, skipping validation');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return !error && !!user;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie (Supabase stores it as sb-access-token)
  let token = request.cookies.get('sb-access-token')?.value;
  
  // Also check for Authorization header (for API calls)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!token) {
      // No token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token with Supabase
    const isValid = await validateSupabaseToken(token);
    if (!isValid) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Extract and validate client_id
    const clientId = extractClientIdFromToken(token);
    if (!clientId) {
      console.warn('No client_id found in token for protected route');
      // Continue anyway - client_id will be fetched from profile in the app
    }

    // Add client_id and token to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    if (clientId) {
      requestHeaders.set('x-client-id', clientId);
    }
    requestHeaders.set('x-user-token', token);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  if (isAuthRoute && token) {
    const isValid = await validateSupabaseToken(token);
    if (isValid) {
      return NextResponse.redirect(new URL('/performance', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
