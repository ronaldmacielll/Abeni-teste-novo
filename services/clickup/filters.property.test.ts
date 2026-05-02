/**
 * Property-Based Tests for Multi-Tenancy Filters
 * 
 * Property 2: Multi-Tenant Data Filtering
 * Property 3: Authorization Enforcement
 * 
 * Property 2: For any collection of data items with client_id fields and any target client_id,
 * filtering the collection SHALL return only items where the item's client_id exactly matches
 * the target client_id, and all returned items SHALL have matching client_id values.
 * 
 * Property 3: For any pair of client_id values (one from JWT, one from requested resource),
 * when the JWT client_id does not match the resource client_id, the authorization check SHALL
 * fail and return a 403 Forbidden status.
 * 
 * Validates: Requirements 2.2, 2.3
 */

import * as fc from 'fast-check'
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

describe('Feature: portal-performance-gestao-financeira', () => {
  // Arbitraries (generators) for property-based testing

  /**
   * Generates arbitrary client_id strings
   */
  const clientIdArbitrary = fc.oneof(
    fc.constantFrom('client-a', 'client-b', 'client-c', 'client-123', 'client-456'),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.uuid(),
    fc.constant(''),
    fc.hexaString({ minLength: 8, maxLength: 32 })
  )

  /**
   * Generates arbitrary Post objects
   */
  const postArbitrary: fc.Arbitrary<Post> = fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    imageUrl: fc.oneof(fc.webUrl(), fc.constant(null)),
    status: fc.constantFrom('Publicado', 'Agendado', 'Rascunho', 'Arquivado'),
    metrics: fc.record({
      alcance: fc.integer({ min: 0, max: 1000000 }),
      engajamento: fc.integer({ min: 0, max: 1000000 }),
      impressoes: fc.integer({ min: 0, max: 1000000 }),
      cliques: fc.integer({ min: 0, max: 1000000 }),
    }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()),
    publishedAt: fc.oneof(
      fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()),
      fc.constant(null)
    ),
    clientId: clientIdArbitrary,
  })

  /**
   * Generates arbitrary Transaction objects
   */
  const transactionArbitrary: fc.Arbitrary<Transaction> = fc.record({
    id: fc.string({ minLength: 1 }),
    descricao: fc.string({ minLength: 1 }),
    valor: fc.double({ min: 0, max: 1000000, noNaN: true }),
    tipo: fc.constantFrom('Entrada', 'Saída'),
    status: fc.constantFrom('Pago', 'Pendente', 'Atrasado'),
    dataVencimento: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString()),
    impostosTaxas: fc.double({ min: 0, max: 100000, noNaN: true }),
    parcelamento: fc.oneof(
      fc.constant(null),
      fc
        .tuple(fc.integer({ min: 1, max: 24 }), fc.integer({ min: 1, max: 24 }))
        .filter(([current, total]) => current <= total)
        .chain(([current, total]) =>
          fc.record({
            current: fc.constant(current),
            total: fc.constant(total),
            valuePerInstallment: fc.double({ min: 0, max: 100000, noNaN: true }),
          })
        )
    ),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()),
    clientId: clientIdArbitrary,
  })

  /**
   * Generates a generic data item with client_id
   */
  const dataItemArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    clientId: clientIdArbitrary,
    value: fc.anything(),
  })

  describe('Property 2: Multi-Tenant Data Filtering', () => {
    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.1: Filtering returns only items with matching client_id
     */
    it('should return only posts where client_id matches the target client_id', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            const result = filterPostsByClientId(posts, targetClientId)

            // All returned items must have matching client_id
            result.forEach((post) => {
              expect(post.clientId).toBe(targetClientId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.2: Filtering returns only transactions with matching client_id
     */
    it('should return only transactions where client_id matches the target client_id', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (transactions, targetClientId) => {
            const result = filterTransactionsByClientId(transactions, targetClientId)

            // All returned items must have matching client_id
            result.forEach((transaction) => {
              expect(transaction.clientId).toBe(targetClientId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.3: Generic filter returns only items with matching client_id
     */
    it('should return only items where client_id matches the target client_id (generic)', () => {
      fc.assert(
        fc.property(
          fc.array(dataItemArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (items, targetClientId) => {
            const result = filterByClientId(items, targetClientId)

            // All returned items must have matching client_id
            result.forEach((item) => {
              expect(item.clientId).toBe(targetClientId)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.4: Filtering never returns items with different client_id
     */
    it('should never return items with a different client_id than the target', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            const result = filterPostsByClientId(posts, targetClientId)

            // No returned item should have a different client_id
            const hasDifferentClientId = result.some((post) => post.clientId !== targetClientId)
            expect(hasDifferentClientId).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.5: Filtering is complete - returns all matching items
     */
    it('should return all items that match the target client_id', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            const result = filterPostsByClientId(posts, targetClientId)

            // Count expected matches
            const expectedCount = posts.filter((p) => p.clientId === targetClientId).length

            // Result should contain exactly the expected number of items
            expect(result.length).toBe(expectedCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.6: Filtering empty collection returns empty collection
     */
    it('should return empty array when filtering empty collection', () => {
      fc.assert(
        fc.property(clientIdArbitrary, (targetClientId) => {
          const result = filterPostsByClientId([], targetClientId)
          expect(result).toEqual([])
        }),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.7: Filtering with non-existent client_id returns empty collection
     */
    it('should return empty array when no items match the target client_id', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1 }),
          (posts, targetClientId) => {
            // Ensure no post has the target client_id
            const postsWithDifferentIds = posts.map((post) => ({
              ...post,
              clientId: `different-${post.clientId}`,
            }))

            const result = filterPostsByClientId(postsWithDifferentIds, targetClientId)
            expect(result).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.8: Filtering preserves item order
     */
    it('should preserve the relative order of matching items', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            const result = filterPostsByClientId(posts, targetClientId)

            // Extract matching items in original order
            const expectedOrder = posts.filter((p) => p.clientId === targetClientId)

            // Result should match the expected order
            expect(result).toEqual(expectedOrder)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.9: Filtering is case-sensitive
     */
    it('should perform case-sensitive client_id matching', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.toLowerCase() !== s.toUpperCase()),
          (baseClientId) => {
            const posts: Post[] = [
              {
                id: '1',
                title: 'Post 1',
                imageUrl: null,
                status: 'Publicado',
                metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
                createdAt: '2024-01-01T00:00:00.000Z',
                publishedAt: '2024-01-01T00:00:00.000Z',
                clientId: baseClientId.toLowerCase(),
              },
              {
                id: '2',
                title: 'Post 2',
                imageUrl: null,
                status: 'Publicado',
                metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
                createdAt: '2024-01-01T00:00:00.000Z',
                publishedAt: '2024-01-01T00:00:00.000Z',
                clientId: baseClientId.toUpperCase(),
              },
            ]

            const resultLower = filterPostsByClientId(posts, baseClientId.toLowerCase())
            const resultUpper = filterPostsByClientId(posts, baseClientId.toUpperCase())

            // Should only match exact case
            expect(resultLower.length).toBe(1)
            expect(resultUpper.length).toBe(1)
            expect(resultLower[0].id).toBe('1')
            expect(resultUpper[0].id).toBe('2')
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.10: validateAllItemsBelongToClient returns true only when all items match
     */
    it('should return true only when all items belong to the target client', () => {
      fc.assert(
        fc.property(
          fc.array(dataItemArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (items, targetClientId) => {
            const result = validateAllItemsBelongToClient(items, targetClientId)

            // Manually check if all items match
            const allMatch = items.every((item) => item.clientId === targetClientId)

            expect(result).toBe(allMatch)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.11: Filtering with same client_id for all items returns all items
     */
    it('should return all items when all items have the target client_id', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 1, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            // Set all posts to have the same client_id
            const postsWithSameClientId = posts.map((post) => ({
              ...post,
              clientId: targetClientId,
            }))

            const result = filterPostsByClientId(postsWithSameClientId, targetClientId)

            expect(result.length).toBe(postsWithSameClientId.length)
            expect(result).toEqual(postsWithSameClientId)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.2**
     * 
     * Property 2.12: Filtering does not modify original collection
     */
    it('should not modify the original collection', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          clientIdArbitrary,
          (posts, targetClientId) => {
            const originalPosts = JSON.parse(JSON.stringify(posts))

            filterPostsByClientId(posts, targetClientId)

            // Original array should remain unchanged
            expect(posts).toEqual(originalPosts)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Authorization Enforcement', () => {
    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.1: Authorization succeeds when client_ids match
     */
    it('should return true when JWT client_id matches resource client_id', () => {
      fc.assert(
        fc.property(clientIdArbitrary, (clientId) => {
          const result = validateClientAuthorization(clientId, clientId)
          expect(result).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.2: Authorization fails when client_ids don't match
     */
    it('should return false when JWT client_id does not match resource client_id', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (jwtClientId, resourceClientId) => {
            fc.pre(jwtClientId !== resourceClientId) // Only test when they're different

            const result = validateClientAuthorization(jwtClientId, resourceClientId)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.3: enforceClientAuthorization does not throw when client_ids match
     */
    it('should not throw error when JWT client_id matches resource client_id', () => {
      fc.assert(
        fc.property(clientIdArbitrary, (clientId) => {
          expect(() => {
            enforceClientAuthorization(clientId, clientId)
          }).not.toThrow()
        }),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.4: enforceClientAuthorization throws when client_ids don't match
     */
    it('should throw error when JWT client_id does not match resource client_id', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (jwtClientId, resourceClientId) => {
            fc.pre(jwtClientId !== resourceClientId) // Only test when they're different

            expect(() => {
              enforceClientAuthorization(jwtClientId, resourceClientId)
            }).toThrow('Authorization failed')
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.5: Authorization error message contains both client_ids
     */
    it('should include both client_ids in error message when authorization fails', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (jwtClientId, resourceClientId) => {
            fc.pre(jwtClientId !== resourceClientId) // Only test when they're different

            try {
              enforceClientAuthorization(jwtClientId, resourceClientId)
              fail('Should have thrown an error')
            } catch (error) {
              const errorMessage = (error as Error).message
              expect(errorMessage).toContain(jwtClientId)
              expect(errorMessage).toContain(resourceClientId)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.6: Authorization is case-sensitive
     */
    it('should perform case-sensitive authorization check', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.toLowerCase() !== s.toUpperCase()),
          (baseClientId) => {
            const lowerCase = baseClientId.toLowerCase()
            const upperCase = baseClientId.toUpperCase()

            // Should fail when cases don't match
            const result = validateClientAuthorization(lowerCase, upperCase)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.7: Authorization with empty strings
     */
    it('should handle empty string client_ids correctly', () => {
      // Empty strings match each other
      expect(validateClientAuthorization('', '')).toBe(true)

      // Empty string does not match non-empty string
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (clientId) => {
            expect(validateClientAuthorization('', clientId)).toBe(false)
            expect(validateClientAuthorization(clientId, '')).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.8: Authorization is reflexive (client_id always matches itself)
     */
    it('should always authorize when comparing a client_id with itself', () => {
      fc.assert(
        fc.property(clientIdArbitrary, (clientId) => {
          expect(validateClientAuthorization(clientId, clientId)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.9: Authorization is symmetric (order doesn't matter for inequality)
     */
    it('should fail authorization regardless of parameter order when client_ids differ', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (clientId1, clientId2) => {
            fc.pre(clientId1 !== clientId2) // Only test when they're different

            const result1 = validateClientAuthorization(clientId1, clientId2)
            const result2 = validateClientAuthorization(clientId2, clientId1)

            expect(result1).toBe(false)
            expect(result2).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.10: Authorization with whitespace differences
     */
    it('should treat client_ids with different whitespace as different', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (baseClientId) => {
            const withSpace = ` ${baseClientId}`
            const withoutSpace = baseClientId

            // Should fail when whitespace differs
            if (withSpace !== withoutSpace) {
              expect(validateClientAuthorization(withSpace, withoutSpace)).toBe(false)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.11: Authorization check is deterministic
     */
    it('should produce consistent results for the same inputs', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (jwtClientId, resourceClientId) => {
            const result1 = validateClientAuthorization(jwtClientId, resourceClientId)
            const result2 = validateClientAuthorization(jwtClientId, resourceClientId)

            expect(result1).toBe(result2)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 2.3**
     * 
     * Property 3.12: enforceClientAuthorization throws Error type
     */
    it('should throw Error instance when authorization fails', () => {
      fc.assert(
        fc.property(
          clientIdArbitrary,
          clientIdArbitrary,
          (jwtClientId, resourceClientId) => {
            fc.pre(jwtClientId !== resourceClientId) // Only test when they're different

            try {
              enforceClientAuthorization(jwtClientId, resourceClientId)
              fail('Should have thrown an error')
            } catch (error) {
              expect(error).toBeInstanceOf(Error)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Date Range Filtering', () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5: Date Range Filtering
     * 
     * For any collection of posts with creation dates and any time period (start date, end date),
     * filtering posts by the period SHALL return only posts where the creation date falls within
     * the inclusive range [start date, end date], and no returned post SHALL have a date outside
     * this range.
     */

    /**
     * Generates arbitrary date ranges
     */
    const dateRangeArbitrary = fc
      .tuple(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      )
      .map(([date1, date2]) => {
        // Ensure startDate <= endDate
        const startDate = date1 <= date2 ? date1 : date2
        const endDate = date1 <= date2 ? date2 : date1
        return { startDate, endDate }
      })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.1: All returned posts have creation dates within the range
     */
    it('should return only posts where createdAt falls within the date range (inclusive)', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const result = filterPostsByDateRange(posts, startDate, endDate)

            // All returned posts must have createdAt within the range
            result.forEach((post) => {
              const postDate = new Date(post.createdAt)
              expect(postDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
              expect(postDate.getTime()).toBeLessThanOrEqual(endDate.getTime())
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.2: No returned post has a date outside the range
     */
    it('should never return posts with createdAt outside the date range', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const result = filterPostsByDateRange(posts, startDate, endDate)

            // No returned post should have a date outside the range
            const hasOutsideDate = result.some((post) => {
              const postDate = new Date(post.createdAt)
              return postDate < startDate || postDate > endDate
            })
            expect(hasOutsideDate).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.3: Filtering is complete - returns all matching posts
     */
    it('should return all posts that fall within the date range', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const result = filterPostsByDateRange(posts, startDate, endDate)

            // Count expected matches
            const expectedCount = posts.filter((post) => {
              const postDate = new Date(post.createdAt)
              return postDate >= startDate && postDate <= endDate
            }).length

            // Result should contain exactly the expected number of posts
            expect(result.length).toBe(expectedCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.4: Filtering empty collection returns empty collection
     */
    it('should return empty array when filtering empty collection', () => {
      fc.assert(
        fc.property(dateRangeArbitrary, ({ startDate, endDate }) => {
          const result = filterPostsByDateRange([], startDate, endDate)
          expect(result).toEqual([])
        }),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.5: Filtering preserves post order
     */
    it('should preserve the relative order of matching posts', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const result = filterPostsByDateRange(posts, startDate, endDate)

            // Extract matching posts in original order
            const expectedOrder = posts.filter((post) => {
              const postDate = new Date(post.createdAt)
              return postDate >= startDate && postDate <= endDate
            })

            // Result should match the expected order
            expect(result).toEqual(expectedOrder)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.6: Filtering does not modify original collection
     */
    it('should not modify the original collection', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const originalPosts = JSON.parse(JSON.stringify(posts))

            filterPostsByDateRange(posts, startDate, endDate)

            // Original array should remain unchanged
            expect(posts).toEqual(originalPosts)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.7: Range boundaries are inclusive
     */
    it('should include posts with createdAt exactly equal to startDate or endDate', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.string({ minLength: 1 }),
          (boundaryDate, postId) => {
            const boundaryDateISO = boundaryDate.toISOString()

            // Create a post with createdAt exactly at the boundary
            const post: Post = {
              id: postId,
              title: 'Boundary Post',
              imageUrl: null,
              status: 'Publicado',
              metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
              createdAt: boundaryDateISO,
              publishedAt: boundaryDateISO,
              clientId: 'test-client',
            }

            // Test with post at startDate boundary
            const resultStart = filterPostsByDateRange([post], boundaryDate, new Date(boundaryDate.getTime() + 86400000))
            expect(resultStart).toContain(post)

            // Test with post at endDate boundary
            const resultEnd = filterPostsByDateRange([post], new Date(boundaryDate.getTime() - 86400000), boundaryDate)
            expect(resultEnd).toContain(post)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.8: Single-day range works correctly
     */
    it('should handle single-day date ranges correctly', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (posts, singleDate) => {
            // Use the same date for start and end
            const result = filterPostsByDateRange(posts, singleDate, singleDate)

            // All returned posts must have createdAt on exactly that date
            result.forEach((post) => {
              const postDate = new Date(post.createdAt)
              expect(postDate.getTime()).toBe(singleDate.getTime())
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.9: Very wide date range returns all posts
     */
    it('should return all posts when date range encompasses all possible dates', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          (posts) => {
            // Use a very wide date range that encompasses all possible post dates
            const veryEarlyDate = new Date('1900-01-01')
            const veryLateDate = new Date('2100-12-31')

            const result = filterPostsByDateRange(posts, veryEarlyDate, veryLateDate)

            // Should return all posts since all dates fall within this range
            expect(result.length).toBe(posts.length)
            expect(result).toEqual(posts)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.10: Empty range (future dates) returns empty result
     */
    it('should return empty array when date range is in the future and no posts exist in that range', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          (posts) => {
            // Use a date range far in the future
            const futureStart = new Date('2100-01-01')
            const futureEnd = new Date('2100-12-31')

            // Ensure all posts are before the future range
            const pastPosts = posts.map((post) => ({
              ...post,
              createdAt: new Date('2020-01-01').toISOString(),
            }))

            const result = filterPostsByDateRange(pastPosts, futureStart, futureEnd)

            // Should return empty array
            expect(result).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.11: Filtering handles ISO 8601 date strings correctly
     */
    it('should correctly parse ISO 8601 date strings from createdAt field', () => {
      fc.assert(
        fc.property(
          dateRangeArbitrary,
          fc.string({ minLength: 1 }),
          ({ startDate, endDate }, postId) => {
            // Create a post with a date in the middle of the range
            const middleDate = new Date((startDate.getTime() + endDate.getTime()) / 2)
            const post: Post = {
              id: postId,
              title: 'Test Post',
              imageUrl: null,
              status: 'Publicado',
              metrics: { alcance: 100, engajamento: 50, impressoes: 200, cliques: 10 },
              createdAt: middleDate.toISOString(), // ISO 8601 format
              publishedAt: middleDate.toISOString(),
              clientId: 'test-client',
            }

            const result = filterPostsByDateRange([post], startDate, endDate)

            // Post should be included since it's in the middle of the range
            expect(result).toContain(post)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 5.3**
     * 
     * Property 5.12: Filtering is deterministic
     */
    it('should produce consistent results for the same inputs', () => {
      fc.assert(
        fc.property(
          fc.array(postArbitrary, { minLength: 0, maxLength: 50 }),
          dateRangeArbitrary,
          (posts, { startDate, endDate }) => {
            const result1 = filterPostsByDateRange(posts, startDate, endDate)
            const result2 = filterPostsByDateRange(posts, startDate, endDate)

            expect(result1).toEqual(result2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
