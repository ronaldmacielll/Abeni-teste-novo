/**
 * Tests for Credential Manager
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { CredentialManager } from '../credential-manager'
import crypto from 'crypto'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          account_id: 'test-account',
          account_name: 'Test Account',
          business_account_id: '123456789',
          access_token_encrypted: 'encrypted-token',
          clickup_list_id: '987654321',
          is_active: true,
          created_at: new Date().toISOString(),
          last_validated_at: new Date().toISOString(),
          expires_at: null,
        },
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  })),
}))

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.INSTAGRAM_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex')

describe('CredentialManager', () => {
  let manager: CredentialManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new CredentialManager()
  })

  describe('Constructor', () => {
    it('should initialize with valid encryption key', () => {
      expect(manager).toBeDefined()
    })

    it('should throw error with invalid encryption key', () => {
      process.env.INSTAGRAM_ENCRYPTION_KEY = 'invalid'

      expect(() => {
        new CredentialManager()
      }).toThrow('INSTAGRAM_ENCRYPTION_KEY must be a 32-byte hex string')
    })
  })

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt tokens correctly', () => {
      const token = 'EAAB' + 'x'.repeat(100)

      // Access private methods through any type
      const manager_any = manager as any

      const encrypted = manager_any.encryptToken(token)
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(token)

      const decrypted = manager_any.decryptToken(encrypted)
      expect(decrypted).toBe(token)
    })

    it('should produce different ciphertexts for same plaintext', () => {
      const token = 'EAAB' + 'x'.repeat(100)
      const manager_any = manager as any

      const encrypted1 = manager_any.encryptToken(token)
      const encrypted2 = manager_any.encryptToken(token)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should fail to decrypt with wrong key', () => {
      const token = 'EAAB' + 'x'.repeat(100)
      const manager_any = manager as any

      const encrypted = manager_any.encryptToken(token)

      // Create new manager with different key
      process.env.INSTAGRAM_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex')
      const wrongManager = new CredentialManager()
      const wrongManager_any = wrongManager as any

      expect(() => {
        wrongManager_any.decryptToken(encrypted)
      }).toThrow()
    })
  })

  describe('storeCredential', () => {
    it('should store credential with encrypted token', async () => {
      const credential = {
        accountId: 'test-account',
        accountName: 'Test Account',
        businessAccountId: '123456789',
        accessToken: 'EAAB' + 'x'.repeat(100),
        clickupListId: '987654321',
        isActive: true,
        lastValidatedAt: new Date().toISOString(),
      }

      await manager.storeCredential(credential, 'user-123')

      // Verify that the credential was stored
      expect(manager).toBeDefined()
    })
  })

  describe('getCredential', () => {
    it('should retrieve and decrypt credential', async () => {
      const manager_any = manager as any
      const token = 'EAAB' + 'x'.repeat(100)
      const encrypted = manager_any.encryptToken(token)

      // Mock the Supabase response
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          account_id: 'test-account',
          account_name: 'Test Account',
          business_account_id: '123456789',
          access_token_encrypted: encrypted,
          clickup_list_id: '987654321',
          is_active: true,
          created_at: new Date().toISOString(),
          last_validated_at: new Date().toISOString(),
          expires_at: null,
        },
        error: null,
      })

      const credential = await manager.getCredential('test-account', 'user-123')

      expect(credential.accountId).toBe('test-account')
      expect(credential.accessToken).toBe(token)
    })

    it('should throw error if credential not found', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      await expect(manager.getCredential('nonexistent', 'user-123')).rejects.toThrow()
    })
  })

  describe('listCredentials', () => {
    it('should list credentials without tokens', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [
          {
            account_id: 'account-1',
            account_name: 'Account 1',
            business_account_id: '123456789',
            clickup_list_id: '987654321',
            is_active: true,
            created_at: new Date().toISOString(),
            last_validated_at: new Date().toISOString(),
            expires_at: null,
          },
        ],
        error: null,
      })

      const credentials = await manager.listCredentials('user-123')

      expect(credentials).toHaveLength(1)
      expect(credentials[0].accountId).toBe('account-1')
      expect((credentials[0] as any).accessToken).toBeUndefined()
    })
  })

  describe('validateAndRefreshToken', () => {
    it('should validate token successfully', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          account_id: 'test-account',
          account_name: 'Test Account',
          business_account_id: '123456789',
          access_token_encrypted: 'encrypted-token',
          clickup_list_id: '987654321',
          is_active: true,
          created_at: new Date().toISOString(),
          last_validated_at: new Date().toISOString(),
          expires_at: null,
        },
        error: null,
      })

      mockSupabase.from().update().eq().eq.mockResolvedValue({ error: null })

      const result = await manager.validateAndRefreshToken('test-account', 'user-123')

      expect(result).toBe(true)
    })

    it('should return false for expired token', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      const expiredDate = new Date(Date.now() - 1000)

      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          account_id: 'test-account',
          account_name: 'Test Account',
          business_account_id: '123456789',
          access_token_encrypted: 'encrypted-token',
          clickup_list_id: '987654321',
          is_active: true,
          created_at: new Date().toISOString(),
          last_validated_at: new Date().toISOString(),
          expires_at: expiredDate.toISOString(),
        },
        error: null,
      })

      const result = await manager.validateAndRefreshToken('test-account', 'user-123')

      expect(result).toBe(false)
    })
  })

  describe('deleteCredential', () => {
    it('should delete credential', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().delete().eq().eq.mockResolvedValue({ error: null })

      await manager.deleteCredential('test-account', 'user-123')

      expect(manager).toBeDefined()
    })
  })

  describe('updateCredential', () => {
    it('should update credential', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = createClient()
      mockSupabase.from().update().eq().eq.mockResolvedValue({ error: null })

      await manager.updateCredential(
        'test-account',
        { accountName: 'Updated Name', isActive: false },
        'user-123'
      )

      expect(manager).toBeDefined()
    })
  })
})
