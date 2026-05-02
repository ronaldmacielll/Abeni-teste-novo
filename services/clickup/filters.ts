/**
 * Multi-Tenancy Filters
 * 
 * Provides filtering and authorization functions for multi-tenant data isolation
 */

import type { Post } from '@/modules/performance/types/post.types'
import type { Transaction } from '@/modules/finance/types/transaction.types'

/**
 * Filters an array of posts by client_id
 * 
 * @param posts - Array of posts to filter
 * @param clientId - The client_id to filter by
 * @returns Array of posts matching the client_id
 */
export function filterPostsByClientId(posts: Post[], clientId: string): Post[] {
  return posts.filter((post) => post.clientId === clientId)
}

/**
 * Filters an array of transactions by client_id
 * 
 * @param transactions - Array of transactions to filter
 * @param clientId - The client_id to filter by
 * @returns Array of transactions matching the client_id
 */
export function filterTransactionsByClientId(
  transactions: Transaction[],
  clientId: string
): Transaction[] {
  return transactions.filter((transaction) => transaction.clientId === clientId)
}

/**
 * Generic filter function for any data with client_id
 * 
 * @param data - Array of data items with client_id property
 * @param clientId - The client_id to filter by
 * @returns Filtered array
 */
export function filterByClientId<T extends { clientId: string }>(
  data: T[],
  clientId: string
): T[] {
  return data.filter((item) => item.clientId === clientId)
}

/**
 * Validates that a JWT client_id matches a resource client_id
 * 
 * @param jwtClientId - The client_id extracted from the JWT token
 * @param resourceClientId - The client_id of the resource being accessed
 * @returns true if authorized, false otherwise
 */
export function validateClientAuthorization(
  jwtClientId: string,
  resourceClientId: string
): boolean {
  return jwtClientId === resourceClientId
}

/**
 * Validates authorization and throws an error if unauthorized
 * 
 * @param jwtClientId - The client_id extracted from the JWT token
 * @param resourceClientId - The client_id of the resource being accessed
 * @throws Error if client_ids don't match
 */
export function enforceClientAuthorization(
  jwtClientId: string,
  resourceClientId: string
): void {
  if (!validateClientAuthorization(jwtClientId, resourceClientId)) {
    throw new Error(
      `Authorization failed: JWT client_id (${jwtClientId}) does not match resource client_id (${resourceClientId})`
    )
  }
}

/**
 * Validates that all items in a collection belong to the specified client
 * 
 * @param data - Array of data items with client_id property
 * @param clientId - The expected client_id
 * @returns true if all items match the client_id, false otherwise
 */
export function validateAllItemsBelongToClient<T extends { clientId: string }>(
  data: T[],
  clientId: string
): boolean {
  return data.every((item) => item.clientId === clientId)
}

/**
 * Filters posts by date range
 * 
 * @param posts - Array of posts to filter
 * @param startDate - Start date of the range (inclusive)
 * @param endDate - End date of the range (inclusive)
 * @returns Array of posts within the date range
 */
export function filterPostsByDateRange(
  posts: Post[],
  startDate: Date,
  endDate: Date
): Post[] {
  return posts.filter((post) => {
    const postDate = new Date(post.createdAt)
    return postDate >= startDate && postDate <= endDate
  })
}
