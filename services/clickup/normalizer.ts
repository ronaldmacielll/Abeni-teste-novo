/**
 * Data Normalizer
 * 
 * Transforms ClickUp task data into domain-specific objects
 * Handles missing fields with default values
 */

import type { ClickUpTask, FieldMapping } from './types'
import type { Post, PostStatus, PostMetrics } from '@/modules/performance/types/post.types'
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  Installment,
} from '@/modules/finance/types/transaction.types'

export class DataNormalizer {
  /**
   * Normalizes a ClickUp task into a Post object
   */
  normalizePost(task: ClickUpTask, fieldMap: FieldMapping['performance']): Post {
    const customFields = this.extractCustomFields(task, fieldMap)

    // Extract metrics with default values
    const metrics: PostMetrics = {
      alcance: this.toNumber(customFields.alcance, 0),
      engajamento: this.toNumber(customFields.engajamento, 0),
      impressoes: this.toNumber(customFields.impressoes, 0),
      cliques: this.toNumber(customFields.cliques, 0),
    }

    // Extract image URL from attachments
    const imageUrl = task.attachments?.[0]?.url || null

    // Normalize status
    const status = this.normalizePostStatus(customFields.status)

    return {
      id: task.id,
      title: task.name,
      imageUrl,
      status,
      metrics,
      createdAt: this.toISODate(task.date_created),
      publishedAt: status === 'Publicado' ? this.toISODate(task.date_created) : null,
      clientId: '', // Will be set by the BFF layer
    }
  }

  /**
   * Normalizes a ClickUp task into a Transaction object
   */
  normalizeTransaction(
    task: ClickUpTask,
    fieldMap: FieldMapping['financial']
  ): Transaction {
    const customFields = this.extractCustomFields(task, fieldMap)

    // Parse parcelamento if present
    const parcelamento = this.parseParcelamento(
      customFields.parcelamento,
      this.toNumber(customFields.valor, 0)
    )

    return {
      id: task.id,
      descricao: task.name,
      valor: this.toNumber(customFields.valor, 0),
      tipo: this.normalizeTransactionType(customFields.tipo),
      status: this.normalizeTransactionStatus(customFields.status),
      dataVencimento: this.toISODate(customFields.dataVencimento),
      impostosTaxas: this.toNumber(customFields.impostosTaxas, 0),
      parcelamento,
      createdAt: this.toISODate(task.date_created),
      clientId: '', // Will be set by the BFF layer
    }
  }

  /**
   * Extracts custom fields from a ClickUp task based on field mapping
   */
  private extractCustomFields(
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

  /**
   * Converts a value to a number with a default fallback
   */
  private toNumber(value: any, defaultValue: number): number {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * Converts a date string to ISO 8601 format
   */
  private toISODate(value: any): string {
    if (!value) {
      return new Date().toISOString()
    }

    // If it's already a timestamp (number)
    if (typeof value === 'number') {
      return new Date(value).toISOString()
    }

    // If it's a string, try to parse it
    const date = new Date(value)
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  /**
   * Normalizes post status to valid PostStatus type
   */
  private normalizePostStatus(value: any): PostStatus {
    const validStatuses: PostStatus[] = ['Publicado', 'Agendado', 'Rascunho', 'Arquivado']
    return validStatuses.includes(value) ? value : 'Rascunho'
  }

  /**
   * Normalizes transaction type to valid TransactionType
   */
  private normalizeTransactionType(value: any): TransactionType {
    return value === 'Entrada' || value === 'Saída' ? value : 'Entrada'
  }

  /**
   * Normalizes transaction status to valid TransactionStatus
   */
  private normalizeTransactionStatus(value: any): TransactionStatus {
    const validStatuses: TransactionStatus[] = ['Pago', 'Pendente', 'Atrasado']
    return validStatuses.includes(value) ? value : 'Pendente'
  }

  /**
   * Parses parcelamento string (e.g., "3/10") into Installment object
   */
  private parseParcelamento(value: any, totalValue: number): Installment | null {
    if (!value || typeof value !== 'string') {
      return null
    }

    const match = value.match(/^(\d+)\/(\d+)$/)
    if (!match) {
      return null
    }

    const current = parseInt(match[1], 10)
    const total = parseInt(match[2], 10)

    if (current < 1 || total < 1 || current > total) {
      return null
    }

    return {
      current,
      total,
      valuePerInstallment: totalValue / total,
    }
  }
}

export const dataNormalizer = new DataNormalizer()
