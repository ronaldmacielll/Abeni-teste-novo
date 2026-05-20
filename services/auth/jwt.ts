/**
 * JWT Token Utilities
 * 
 * Utilities for working with JWT tokens, including client_id extraction
 */

/**
 * Extract client_id from Supabase JWT token or development token
 * 
 * For development tokens (starting with 'dev-token-'), returns a default client_id.
 * For Supabase JWT tokens, checks for client_id in the following order:
 * 1. payload.client_id (root level)
 * 2. payload.user_metadata.client_id
 * 3. payload.app_metadata.client_id
 * 
 * @param token - JWT token string or development token
 * @returns client_id string if found, null otherwise
 */
export function extractClientIdFromToken(token: string): string | null {
  try {
    // Check if it's a development token
    if (token.startsWith('dev-token-')) {
      console.log('Using development client_id for dev token');
      return 'admin-client'; // Return the hardcoded admin client_id
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Check for client_id in different possible locations
    const clientId = 
      payload.client_id || 
      payload.user_metadata?.client_id ||
      payload.app_metadata?.client_id;
    
    // Return null if client_id is empty string, null, or undefined
    return clientId || null;
  } catch (error) {
    console.error('Failed to extract client_id from token:', error);
    return null;
  }
}

/**
 * Extract role from Supabase JWT token or development token
 * 
 * For development tokens, extracts role from cookie data.
 * For Supabase JWT tokens, checks for role in the following order:
 * 1. payload.role (root level)
 * 2. payload.user_metadata.role
 * 3. payload.app_metadata.role
 * 
 * @param token - JWT token string or development token
 * @returns role string ('client' | 'internal') if found, 'client' as default
 */
export function extractRoleFromToken(token: string): 'client' | 'internal' {
  try {
    // Check if it's a development token
    if (token.startsWith('dev-token-')) {
      // For dev tokens, we need to check cookies for user data
      // This will be handled in the API route by reading cookies
      return 'internal'; // Default for dev tokens (will be overridden by cookie data)
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return 'client'; // Default to client role
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Check for role in different possible locations
    const role = 
      payload.role || 
      payload.user_metadata?.role ||
      payload.app_metadata?.role;
    
    // Return role if valid, otherwise default to 'client'
    return (role === 'internal' || role === 'client') ? role : 'client';
  } catch (error) {
    console.error('Failed to extract role from token:', error);
    return 'client'; // Default to client role on error
  }
}
