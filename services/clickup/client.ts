/**
 * ClickUp API Client
 * 
 * Handles all interactions with the ClickUp REST API
 * Implements retry logic for rate limiting and transient errors
 */

import type {
  ClickUpTask,
  CustomField,
  TaskFilters,
  CreateTaskPayload,
} from './types'

const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'

// Retry configuration
const RETRYABLE_STATUS_CODES = [408, 429, 502, 503, 504]
const RETRY_DELAYS_MS = [1000, 2000, 4000] // Exponential backoff
const MAX_RETRIES = RETRY_DELAYS_MS.length

export class ClickUpService {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ClickUp API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Makes an HTTP request to the ClickUp API with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${CLICKUP_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Handle rate limiting and transient errors with retry
      if (!response.ok && RETRYABLE_STATUS_CODES.includes(response.status)) {
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[retryCount]
          
          // Log retry attempt
          console.warn(
            `ClickUp API returned ${response.status}. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
          )
          
          // Wait before retrying
          await this.sleep(delay)
          
          // Retry the request
          return this.request<T>(endpoint, options, retryCount + 1)
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `ClickUp API error: ${response.status} ${response.statusText} - ${errorText}`
        )
      }

      return response.json()
    } catch (error) {
      // Handle network errors with retry
      if (retryCount < MAX_RETRIES && this.isNetworkError(error)) {
        const delay = RETRY_DELAYS_MS[retryCount]
        
        console.warn(
          `Network error occurred. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
        )
        
        await this.sleep(delay)
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Checks if an error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')
      )
    }
    return false
  }

  async getTasksByList(
    listId: string,
    filters?: TaskFilters
  ): Promise<ClickUpTask[]> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const endpoint = `/list/${listId}/task${queryString ? `?${queryString}` : ''}`

    const response = await this.request<{ tasks: ClickUpTask[] }>(endpoint)
    return response.tasks
  }

  async createTask(
    listId: string,
    taskData: CreateTaskPayload
  ): Promise<ClickUpTask> {
    const endpoint = `/list/${listId}/task`
    
    return this.request<ClickUpTask>(endpoint, {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(
    taskId: string,
    updates: Partial<CreateTaskPayload>
  ): Promise<ClickUpTask> {
    const endpoint = `/task/${taskId}`
    
    return this.request<ClickUpTask>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async getCustomFields(listId: string): Promise<CustomField[]> {
    const endpoint = `/list/${listId}/field`
    const response = await this.request<{ fields: CustomField[] }>(endpoint)
    return response.fields
  }

  mapCustomFields(
    task: ClickUpTask,
    fieldMap: Record<string, string>
  ): Record<string, any> {
    const result: Record<string, any> = {}

    Object.entries(fieldMap).forEach(([key, fieldId]) => {
      const customField = task.custom_fields.find((f) => f.id === fieldId)
      result[key] = customField?.value ?? null
    })

    return result
  }
}
