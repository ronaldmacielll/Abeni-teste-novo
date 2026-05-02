/**
 * ClickUp API Types
 * 
 * Type definitions for ClickUp API integration
 */

export interface ClickUpTask {
  id: string
  name: string
  description: string
  status: {
    status: string
    color: string
  }
  date_created: string
  date_updated: string
  custom_fields: CustomField[]
  attachments: Attachment[]
  list: {
    id: string
    name: string
  }
}

export interface CustomField {
  id: string
  name: string
  type: 'number' | 'text' | 'drop_down' | 'date' | 'url' | 'attachment'
  value: any
  type_config?: {
    options?: Array<{
      id: string
      name: string
      color: string
    }>
  }
}

export interface Attachment {
  id: string
  url: string
  title: string
  extension: string
}

export interface TaskFilters {
  archived?: boolean
  subtasks?: boolean
  statuses?: string[]
  include_closed?: boolean
  order_by?: string
  reverse?: boolean
  date_created_gt?: number
  date_created_lt?: number
  date_updated_gt?: number
  date_updated_lt?: number
}

export interface CreateTaskPayload {
  name: string
  description?: string
  status?: string
  priority?: number
  due_date?: number
  start_date?: number
  assignees?: string[]
  tags?: string[]
  custom_fields?: Array<{
    id: string
    value: any
  }>
}

export interface FieldMapping {
  performance: {
    alcance: string
    engajamento: string
    impressoes: string
    cliques: string
    status: string
    imagem: string
  }
  financial: {
    valor: string
    tipo: string
    status: string
    dataVencimento: string
    impostosTaxas: string
    parcelamento: string
  }
}
