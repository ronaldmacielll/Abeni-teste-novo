/**
 * Multi-Tenancy Filters Tests
 * 
 * Tests for multi-tenant data filtering and authorization
 */

import {
  filterPostsByClientId,
  filterTransactionsByClientId,
  filterByClientId,
  validateClientAuthorization,
  enforceClientAuthorization,
  validateAllItemsBelongToClient,
  filterPostsByDateRange,
} from './filters'
import type { Post } from '@/modules/performance/types/post.types'
import type { Transaction } from '@/modules/finance/types/transaction.types'

describe('Multi-Tenancy Filters', () => {
  describe('filterPostsByClientId', () => {
    const mockPosts: Post[] = [
      {
        id: '1',
        title: 'Post 1',
        imageUrl: null,
        status: 'Publicado',
        metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
        createdAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
        clientId: 'client-a',
      },
      {
        id: '2',
        title: 'Post 2',
        imageUrl: null,
        status: 'Publicado',
        metrics: { alcance: 150, engajamento: 75, impressoes: 300, cliques: 15 },
        createdAt: '2024-01-02T00:00:00Z',
        publishedAt: '2024-01-02T00:00:00Z',
        clientId: 'client-b',
      },
      {
        id: '3',
        title: 'Post 3',
        imageUrl: null,
        status: 'Agendado',
        metrics: { alcance: 0, engajamento: 0, impressoes: 0, cliques: 0 },
        createdAt: '2024-01-03T00:00:00Z',
        publishedAt: null,
        clientId: 'client-a',
      },
    ]

    it('should filter posts by client_id', () => {
      const result = filterPostsByClientId(mockPosts, 'client-a')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
      expect(result.every((post) => post.clientId === 'client-a')).toBe(true)
    })

    it('should return empty array when no posts match', () => {
      const result = filterPostsByClientId(mockPosts, 'client-c')

      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      const result = filterPostsByClientId([], 'client-a')

      expect(result).toHaveLength(0)
    })

    it('should handle single matching post', () => {
      const result = filterPostsByClientId(mockPosts, 'client-b')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })
  })

  describe('filterPostsByDateRange', () => {
    const mockPosts: Post[] = [
      {
        id: '1',
        title: 'Post 1',
        imageUrl: null,
        status: 'Publicado',
        metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
        createdAt: '2024-01-01T00:00:00Z',
        publishedAt: '2024-01-01T00:00:00Z',
        clientId: 'client-a',
      },
      {
        id: '2',
        title: 'Post 2',
        imageUrl: null,
        status: 'Publicado',
        metrics: { alcance: 150, engajamento: 75, impressoes: 300, cliques: 15 },
        createdAt: '2024-01-15T00:00:00Z',
        publishedAt: '2024-01-15T00:00:00Z',
        clientId: 'client-a',
      },
      {
        id: '3',
        title: 'Post 3',
        imageUrl: null,
        status: 'Agendado',
        metrics: { alcance: 0, engajamento: 0, impressoes: 0, cliques: 0 },
        createdAt: '2024-02-01T00:00:00Z',
        publishedAt: null,
        clientId: 'client-a',
      },
    ]

    it('should filter posts by date range', () => {
      const startDate = new Date('2024-01-01T00:00:00Z')
      const endDate = new Date('2024-01-20T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
    })

    it('should include posts at the start boundary', () => {
      const startDate = new Date('2024-01-01T00:00:00Z')
      const endDate = new Date('2024-01-01T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should include posts at the end boundary', () => {
      const startDate = new Date('2024-01-15T00:00:00Z')
      const endDate = new Date('2024-01-15T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should return empty array when no posts match', () => {
      const startDate = new Date('2024-03-01T00:00:00Z')
      const endDate = new Date('2024-03-31T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      const startDate = new Date('2024-01-01T00:00:00Z')
      const endDate = new Date('2024-01-31T00:00:00Z')

      const result = filterPostsByDateRange([], startDate, endDate)

      expect(result).toHaveLength(0)
    })

    it('should handle wide date range', () => {
      const startDate = new Date('2020-01-01T00:00:00Z')
      const endDate = new Date('2025-12-31T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(3)
    })

    it('should preserve post order', () => {
      const startDate = new Date('2024-01-01T00:00:00Z')
      const endDate = new Date('2024-02-28T00:00:00Z')

      const result = filterPostsByDateRange(mockPosts, startDate, endDate)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('3')
    })
  })

  describe('filterTransactionsByClientId', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        descricao: 'Transaction 1',
        valor: 1000,
        tipo: 'Entrada',
        status: 'Pago',
        dataVencimento: '2024-01-15T00:00:00Z',
        impostosTaxas: 100,
        parcelamento: null,
        createdAt: '2024-01-01T00:00:00Z',
        clientId: 'client-a',
      },
      {
        id: '2',
        descricao: 'Transaction 2',
        valor: 500,
        tipo: 'Saída',
        status: 'Pendente',
        dataVencimento: '2024-01-20T00:00:00Z',
        impostosTaxas: 0,
        parcelamento: null,
        createdAt: '2024-01-02T00:00:00Z',
        clientId: 'client-b',
      },
      {
        id: '3',
        descricao: 'Transaction 3',
        valor: 2000,
        tipo: 'Entrada',
        status: 'Pago',
        dataVencimento: '2024-01-25T00:00:00Z',
        impostosTaxas: 200,
        parcelamento: null,
        createdAt: '2024-01-03T00:00:00Z',
        clientId: 'client-a',
      },
    ]

    it('should filter transactions by client_id', () => {
      const result = filterTransactionsByClientId(mockTransactions, 'client-a')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
      expect(result.every((tx) => tx.clientId === 'client-a')).toBe(true)
    })

    it('should return empty array when no transactions match', () => {
      const result = filterTransactionsByClientId(mockTransactions, 'client-c')

      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      const result = filterTransactionsByClientId([], 'client-a')

      expect(result).toHaveLength(0)
    })
  })

  describe('filterByClientId (generic)', () => {
    interface TestData {
      id: string
      clientId: string
      value: number
    }

    const mockData: TestData[] = [
      { id: '1', clientId: 'client-a', value: 100 },
      { id: '2', clientId: 'client-b', value: 200 },
      { id: '3', clientId: 'client-a', value: 300 },
      { id: '4', clientId: 'client-c', value: 400 },
    ]

    it('should filter generic data by client_id', () => {
      const result = filterByClientId(mockData, 'client-a')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
      expect(result[1].id).toBe('3')
      expect(result.every((item) => item.clientId === 'client-a')).toBe(true)
    })

    it('should work with different data types', () => {
      interface CustomType {
        name: string
        clientId: string
      }

      const customData: CustomType[] = [
        { name: 'Item 1', clientId: 'client-x' },
        { name: 'Item 2', clientId: 'client-y' },
        { name: 'Item 3', clientId: 'client-x' },
      ]

      const result = filterByClientId(customData, 'client-x')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Item 1')
      expect(result[1].name).toBe('Item 3')
    })
  })

  describe('validateClientAuthorization', () => {
    it('should return true when client_ids match', () => {
      const result = validateClientAuthorization('client-123', 'client-123')

      expect(result).toBe(true)
    })

    it('should return false when client_ids do not match', () => {
      const result = validateClientAuthorization('client-123', 'client-456')

      expect(result).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(validateClientAuthorization('', '')).toBe(true)
      expect(validateClientAuthorization('client-123', '')).toBe(false)
      expect(validateClientAuthorization('', 'client-123')).toBe(false)
    })

    it('should be case-sensitive', () => {
      const result = validateClientAuthorization('Client-123', 'client-123')

      expect(result).toBe(false)
    })
  })

  describe('enforceClientAuthorization', () => {
    it('should not throw when client_ids match', () => {
      expect(() => {
        enforceClientAuthorization('client-123', 'client-123')
      }).not.toThrow()
    })

    it('should throw error when client_ids do not match', () => {
      expect(() => {
        enforceClientAuthorization('client-123', 'client-456')
      }).toThrow('Authorization failed')
      expect(() => {
        enforceClientAuthorization('client-123', 'client-456')
      }).toThrow('JWT client_id (client-123) does not match resource client_id (client-456)')
    })

    it('should throw error with descriptive message', () => {
      try {
        enforceClientAuthorization('jwt-client', 'resource-client')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('jwt-client')
        expect((error as Error).message).toContain('resource-client')
      }
    })
  })

  describe('validateAllItemsBelongToClient', () => {
    interface TestItem {
      id: string
      clientId: string
    }

    it('should return true when all items belong to client', () => {
      const items: TestItem[] = [
        { id: '1', clientId: 'client-a' },
        { id: '2', clientId: 'client-a' },
        { id: '3', clientId: 'client-a' },
      ]

      const result = validateAllItemsBelongToClient(items, 'client-a')

      expect(result).toBe(true)
    })

    it('should return false when any item does not belong to client', () => {
      const items: TestItem[] = [
        { id: '1', clientId: 'client-a' },
        { id: '2', clientId: 'client-b' }, // Different client
        { id: '3', clientId: 'client-a' },
      ]

      const result = validateAllItemsBelongToClient(items, 'client-a')

      expect(result).toBe(false)
    })

    it('should return true for empty array', () => {
      const result = validateAllItemsBelongToClient([], 'client-a')

      expect(result).toBe(true)
    })

    it('should return true for single matching item', () => {
      const items: TestItem[] = [{ id: '1', clientId: 'client-a' }]

      const result = validateAllItemsBelongToClient(items, 'client-a')

      expect(result).toBe(true)
    })

    it('should return false for single non-matching item', () => {
      const items: TestItem[] = [{ id: '1', clientId: 'client-b' }]

      const result = validateAllItemsBelongToClient(items, 'client-a')

      expect(result).toBe(false)
    })
  })
})
