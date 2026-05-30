/**
 * Credential Manager Service
 * Handles secure storage and retrieval of Instagram credentials
 * Validates: Requirements 1.1, 9.1, 9.2, 9.3
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { StoredCredential, StoredCredentialWithoutToken } from '@/lib/types/instagram.types'
import { INSTAGRAM_CONFIG } from '@/lib/config/instagram.config'

export class CredentialManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  private encryptionKey: Buffer

  constructor() {
    // Initialize encryption key from environment
    const keyHex = INSTAGRAM_CONFIG.ENCRYPTION_KEY

    if (!keyHex || keyHex.length !== 64) {
      throw new Error('INSTAGRAM_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)')
    }

    this.encryptionKey = Buffer.from(keyHex, 'hex')

    logger.debug('CredentialManager initialized')
  }

  /**
   * Store credential with encrypted access token
   * Requirement 9.1, 9.2
   */
  async storeCredential(
    credential: Omit<StoredCredential, 'createdAt'>,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Storing credential', {
        accountId: credential.accountId,
        accountName: credential.accountName,
      })

      // Encrypt the access token
      const encryptedToken = this.encryptToken(credential.accessToken)

      // Store in database
      const { error } = await this.supabase.from('instagram_credentials').insert({
        account_id: credential.accountId,
        account_name: credential.accountName,
        business_account_id: credential.businessAccountId,
        access_token_encrypted: encryptedToken,
        clickup_list_id: credential.clickupListId,
        is_active: credential.isActive,
        last_validated_at: credential.lastValidatedAt,
        expires_at: credential.expiresAt,
        created_by: userId,
      })

      if (error) {
        throw error
      }

      logger.info('Credential stored successfully', {
        accountId: credential.accountId,
      })
    } catch (error) {
      logger.error('Failed to store credential', error as Error, {
        accountId: credential.accountId,
      })
      throw error
    }
  }

  /**
   * Retrieve credential with decrypted access token
   * Requirement 9.1, 9.2
   */
  async getCredential(accountId: string, userId: string): Promise<StoredCredential> {
    try {
      logger.debug('Retrieving credential', { accountId })

      const { data, error } = await this.supabase
        .from('instagram_credentials')
        .select('*')
        .eq('account_id', accountId)
        .eq('created_by', userId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Credential not found')
      }

      // Decrypt the access token
      const decryptedToken = this.decryptToken(data.access_token_encrypted)

      return {
        accountId: data.account_id,
        accountName: data.account_name,
        businessAccountId: data.business_account_id,
        accessToken: decryptedToken,
        clickupListId: data.clickup_list_id,
        isActive: data.is_active,
        createdAt: data.created_at,
        lastValidatedAt: data.last_validated_at,
        expiresAt: data.expires_at,
      }
    } catch (error) {
      logger.error('Failed to retrieve credential', error as Error, { accountId })
      throw error
    }
  }

  /**
   * List all credentials for a user (without tokens)
   * Requirement 9.1, 9.2
   */
  async listCredentials(userId: string): Promise<StoredCredentialWithoutToken[]> {
    try {
      logger.debug('Listing credentials', { userId })

      const { data, error } = await this.supabase
        .from('instagram_credentials')
        .select('id, account_id, account_name, business_account_id, clickup_list_id, is_active, created_at, last_validated_at, expires_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        accountId: item.account_id,
        accountName: item.account_name,
        businessAccountId: item.business_account_id,
        clickupListId: item.clickup_list_id,
        isActive: item.is_active,
        createdAt: item.created_at,
        lastValidatedAt: item.last_validated_at,
        expiresAt: item.expires_at,
      }))
    } catch (error) {
      logger.error('Failed to list credentials', error as Error, { userId })
      throw error
    }
  }

  /**
   * Validate and refresh token if necessary
   * Requirement 9.1, 9.2
   */
  async validateAndRefreshToken(accountId: string, userId: string): Promise<boolean> {
    try {
      logger.info('Validating token', { accountId })

      const credential = await this.getCredential(accountId, userId)

      // Check if token is expired
      if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
        logger.warn('Token expired', { accountId, expiresAt: credential.expiresAt })
        return false
      }

      // Update last validated timestamp
      const { error } = await this.supabase
        .from('instagram_credentials')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .eq('created_by', userId)

      if (error) {
        throw error
      }

      logger.info('Token validated successfully', { accountId })
      return true
    } catch (error) {
      logger.error('Token validation failed', error as Error, { accountId })
      return false
    }
  }

  /**
   * Delete credential
   * Requirement 9.1, 9.2
   */
  async deleteCredential(accountId: string, userId: string): Promise<void> {
    try {
      logger.info('Deleting credential', { accountId })

      const { error } = await this.supabase
        .from('instagram_credentials')
        .delete()
        .eq('account_id', accountId)
        .eq('created_by', userId)

      if (error) {
        throw error
      }

      logger.info('Credential deleted successfully', { accountId })
    } catch (error) {
      logger.error('Failed to delete credential', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Update credential
   */
  async updateCredential(
    accountId: string,
    updates: Partial<Omit<StoredCredential, 'createdAt' | 'accountId'>>,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Updating credential', { accountId })

      const updateData: any = {}

      if (updates.accountName) updateData.account_name = updates.accountName
      if (updates.clickupListId) updateData.clickup_list_id = updates.clickupListId
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.accessToken) updateData.access_token_encrypted = this.encryptToken(updates.accessToken)
      if (updates.expiresAt) updateData.expires_at = updates.expiresAt

      const { error } = await this.supabase
        .from('instagram_credentials')
        .update(updateData)
        .eq('account_id', accountId)
        .eq('created_by', userId)

      if (error) {
        throw error
      }

      logger.info('Credential updated successfully', { accountId })
    } catch (error) {
      logger.error('Failed to update credential', error as Error, { accountId })
      throw error
    }
  }

  /**
   * Encrypt token using AES-256-GCM
   * Requirement 9.1, 9.2
   */
  private encryptToken(token: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv)

      const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
      const authTag = cipher.getAuthTag()

      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted])

      return combined.toString('base64')
    } catch (error) {
      logger.error('Encryption failed', error as Error)
      throw error
    }
  }

  /**
   * Decrypt token using AES-256-GCM
   * Requirement 9.1, 9.2
   */
  private decryptToken(encrypted: string): string {
    try {
      const buffer = Buffer.from(encrypted, 'base64')

      // Extract IV, authTag, and encrypted data
      const iv = buffer.slice(0, 16)
      const authTag = buffer.slice(16, 32)
      const encryptedData = buffer.slice(32)

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ])

      return decrypted.toString('utf8')
    } catch (error) {
      logger.error('Decryption failed', error as Error)
      throw error
    }
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager()
