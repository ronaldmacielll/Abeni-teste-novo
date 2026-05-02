/**
 * JWT Token Utilities
 * 
 * Utilities for working with JWT tokens, including client_id extraction
 */

/**
 * Extract client_id from Supabase JWT token
 * 
 * Checks for client_id in the following order:
 * 1. payload.client_id (root level)
 * 2. payload.user_metadata.client_id
 * 3. payload.app_metadata.client_id
 * 
 * @param token - JWT token string
 * @returns client_id string if found, null otherwise
 */
export function extractClientIdFromToken(token: string): string | null {
  try {
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
