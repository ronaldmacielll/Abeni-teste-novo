import fc from 'fast-check';
import { extractClientIdFromToken } from './jwt';

/**
 * **Validates: Requirements 2.1**
 * 
 * Property-Based Tests for JWT Client ID Extraction
 * 
 * Tests the core JWT client_id extraction function used in authentication middleware.
 * 
 * Coverage:
 * - Property 1: JWT Client ID Extraction
 * - Edge cases: missing client_id, malformed tokens, various claim locations
 * 
 * Related Requirements: 2.1
 * 
 * Testing Strategy:
 * - Generate valid JWT tokens with client_id in different locations
 * - Verify extraction returns the correct client_id without modification
 * - Test with 100 iterations per property test
 */

describe('Feature: portal-performance-gestao-financeira, Property 1: JWT Client ID Extraction', () => {
  /**
   * Property 1: JWT Client ID Extraction
   * 
   * For any valid JWT token containing a client_id claim, extracting the client_id 
   * SHALL successfully return the claim value without modification.
   */
  describe('Property Test: Client ID extraction from valid JWT tokens', () => {
    it('should extract client_id from payload root', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // client_id value
          (clientId) => {
            // Create a valid JWT structure with client_id in payload root
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({ 
              client_id: clientId,
              sub: 'user-123',
              exp: Math.floor(Date.now() / 1000) + 3600
            })).toString('base64');
            const signature = Buffer.from('fake-signature').toString('base64');
            const token = `${header}.${payload}.${signature}`;

            const extracted = extractClientIdFromToken(token);
            
            expect(extracted).toBe(clientId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract client_id from user_metadata', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // client_id value
          (clientId) => {
            // Create a valid JWT structure with client_id in user_metadata
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({ 
              user_metadata: {
                client_id: clientId,
                name: 'Test User'
              },
              sub: 'user-123',
              exp: Math.floor(Date.now() / 1000) + 3600
            })).toString('base64');
            const signature = Buffer.from('fake-signature').toString('base64');
            const token = `${header}.${payload}.${signature}`;

            const extracted = extractClientIdFromToken(token);
            
            expect(extracted).toBe(clientId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract client_id from app_metadata', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // client_id value
          (clientId) => {
            // Create a valid JWT structure with client_id in app_metadata
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({ 
              app_metadata: {
                client_id: clientId,
                role: 'client'
              },
              sub: 'user-123',
              exp: Math.floor(Date.now() / 1000) + 3600
            })).toString('base64');
            const signature = Buffer.from('fake-signature').toString('base64');
            const token = `${header}.${payload}.${signature}`;

            const extracted = extractClientIdFromToken(token);
            
            expect(extracted).toBe(clientId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize payload root client_id over nested locations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // root client_id
          fc.string({ minLength: 1, maxLength: 50 }), // user_metadata client_id
          fc.string({ minLength: 1, maxLength: 50 }), // app_metadata client_id
          (rootClientId, userMetadataClientId, appMetadataClientId) => {
            // Ensure they're different for a meaningful test
            fc.pre(rootClientId !== userMetadataClientId && rootClientId !== appMetadataClientId);

            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({ 
              client_id: rootClientId,
              user_metadata: {
                client_id: userMetadataClientId
              },
              app_metadata: {
                client_id: appMetadataClientId
              },
              sub: 'user-123',
              exp: Math.floor(Date.now() / 1000) + 3600
            })).toString('base64');
            const signature = Buffer.from('fake-signature').toString('base64');
            const token = `${header}.${payload}.${signature}`;

            const extracted = extractClientIdFromToken(token);
            
            // Should extract the root client_id (highest priority)
            expect(extracted).toBe(rootClientId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various client_id formats without modification', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.uuid(), // UUID format
            fc.string({ minLength: 5, maxLength: 20 }).map(s => `client-${s}`), // Prefixed format
            fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()), // Numeric string
            fc.string({ minLength: 10, maxLength: 30 }) // Arbitrary string
          ),
          (clientId) => {
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
            const payload = Buffer.from(JSON.stringify({ 
              client_id: clientId,
              sub: 'user-123'
            })).toString('base64');
            const signature = Buffer.from('fake-signature').toString('base64');
            const token = `${header}.${payload}.${signature}`;

            const extracted = extractClientIdFromToken(token);
            
            // The extracted value should be identical to the original
            expect(extracted).toBe(clientId);
            expect(extracted).toEqual(clientId);
            expect(typeof extracted).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Unit Tests: Edge Cases and Error Conditions
   * 
   * These complement the property tests by testing specific error scenarios
   */
  describe('Edge Cases', () => {
    it('should return null for token without client_id', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        sub: 'user-123',
        email: 'user@example.com'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null for malformed token (not 3 parts)', () => {
      const malformedToken = 'invalid.token';
      
      const extracted = extractClientIdFromToken(malformedToken);
      
      expect(extracted).toBeNull();
    });

    it('should return null for token with invalid base64 payload', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const invalidPayload = 'not-valid-base64!!!';
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${invalidPayload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null for token with invalid JSON payload', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const invalidPayload = Buffer.from('not valid json').toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${invalidPayload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null for empty token', () => {
      const extracted = extractClientIdFromToken('');
      
      expect(extracted).toBeNull();
    });

    it('should handle client_id with special characters', () => {
      const specialClientId = 'client-123_test@domain.com';
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        client_id: specialClientId,
        sub: 'user-123'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBe(specialClientId);
    });

    it('should handle client_id with whitespace', () => {
      const clientIdWithSpaces = '  client-123  ';
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        client_id: clientIdWithSpaces,
        sub: 'user-123'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      // Should preserve whitespace (no trimming)
      expect(extracted).toBe(clientIdWithSpaces);
    });

    it('should return null when client_id is null in payload', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        client_id: null,
        sub: 'user-123'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null when client_id is undefined in payload', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        client_id: undefined,
        sub: 'user-123'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });

    it('should return null when client_id is empty string', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        client_id: '',
        sub: 'user-123'
      })).toString('base64');
      const signature = Buffer.from('fake-signature').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const extracted = extractClientIdFromToken(token);
      
      expect(extracted).toBeNull();
    });
  });
});
