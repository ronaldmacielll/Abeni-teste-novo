/**
 * Data Normalizer Tests
 * 
 * Tests for ClickUp data normalization functions
 */

import { DataNormalizer } from './normalizer'
import type { ClickUpTask, FieldMapping } from './types'

describe('DataNormalizer', () => {
  let normalizer: DataNormalizer

  beforeEach(() => {
    normalizer = new DataNormalizer()
  })

  describe('normalizePost', () => {
    const fieldMap: FieldMapping['performance'] = {
      alcance: 'field-alcance',
      engajamento: 'field-engajamento',
      impressoes: 'field-impressoes',
      cliques: 'field-cliques',
      status: 'field-status',
      imagem: 'field-imagem',
    }

    const mockTask: ClickUpTask = {
      id: 'task-123',
      name: 'Test Post',
      description: 'Test Description',
      status: { status: 'open', color: '#000000' },
      date_created: '1704067200000', // 2024-01-01
      date_updated: '1704067200000',
      custom_fields: [
        { id: 'field-alcance', name: 'Alcance', type: 'number', value: 1000 },
        { id: 'field-engajamento', name: 'Engajamento', type: 'number', value: 500 },
        { id: 'field-impressoes', name: 'Impressões', type: 'number', value: 2000 },
        { id: 'field-cliques', name: 'Cliques', type: 'number', value: 100 },
        { id: 'field-status', name: 'Status', type: 'drop_down', value: 'Publicado' },
      ],
      attachments: [
        { id: 'att-1', url: 'https://example.com/image.jpg', title: 'Image', extension: 'jpg' },
      ],
      list: { id: 'list-123', name: 'Performance List' },
    }

    it('should normalize a complete post', () => {
      const result = normalizer.normalizePost(mockTask, fieldMap)

      expect(result).toEqual({
        id: 'task-123',
        title: 'Test Post',
        imageUrl: 'https://example.com/image.jpg',
        status: 'Publicado',
        metrics: {
          alcance: 1000,
          engajamento: 500,
          impressoes: 2000,
          cliques: 100,
        },
        createdAt: expect.any(String),
        publishedAt: expect.any(String),
        clientId: '',
      })

      // Verify ISO 8601 format
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should apply default values for missing metrics', () => {
      const taskWithMissingFields: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-status', name: 'Status', type: 'drop_down', value: 'Publicado' },
        ],
      }

      const result = normalizer.normalizePost(taskWithMissingFields, fieldMap)

      expect(result.metrics).toEqual({
        alcance: 0,
        engajamento: 0,
        impressoes: 0,
        cliques: 0,
      })
    })

    it('should handle missing image attachment', () => {
      const taskWithoutImage: ClickUpTask = {
        ...mockTask,
        attachments: [],
      }

      const result = normalizer.normalizePost(taskWithoutImage, fieldMap)

      expect(result.imageUrl).toBeNull()
    })

    it('should normalize status to valid PostStatus', () => {
      const statuses = ['Publicado', 'Agendado', 'Rascunho', 'Arquivado']

      statuses.forEach((status) => {
        const taskWithStatus: ClickUpTask = {
          ...mockTask,
          custom_fields: [
            { id: 'field-status', name: 'Status', type: 'drop_down', value: status },
          ],
        }

        const result = normalizer.normalizePost(taskWithStatus, fieldMap)
        expect(result.status).toBe(status)
      })
    })

    it('should default to Rascunho for invalid status', () => {
      const taskWithInvalidStatus: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-status', name: 'Status', type: 'drop_down', value: 'InvalidStatus' },
        ],
      }

      const result = normalizer.normalizePost(taskWithInvalidStatus, fieldMap)

      expect(result.status).toBe('Rascunho')
    })

    it('should set publishedAt to null for non-published posts', () => {
      const taskNotPublished: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-status', name: 'Status', type: 'drop_down', value: 'Agendado' },
        ],
      }

      const result = normalizer.normalizePost(taskNotPublished, fieldMap)

      expect(result.publishedAt).toBeNull()
    })

    it('should handle numeric string values for metrics', () => {
      const taskWithStringNumbers: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-alcance', name: 'Alcance', type: 'text', value: '1500' },
          { id: 'field-engajamento', name: 'Engajamento', type: 'text', value: '750' },
        ],
      }

      const result = normalizer.normalizePost(taskWithStringNumbers, fieldMap)

      expect(result.metrics.alcance).toBe(1500)
      expect(result.metrics.engajamento).toBe(750)
    })
  })

  describe('normalizeTransaction', () => {
    const fieldMap: FieldMapping['financial'] = {
      valor: 'field-valor',
      tipo: 'field-tipo',
      status: 'field-status',
      dataVencimento: 'field-vencimento',
      impostosTaxas: 'field-impostos',
      parcelamento: 'field-parcelamento',
    }

    const mockTask: ClickUpTask = {
      id: 'task-456',
      name: 'Payment from Client',
      description: 'Monthly payment',
      status: { status: 'open', color: '#000000' },
      date_created: '1704067200000',
      date_updated: '1704067200000',
      custom_fields: [
        { id: 'field-valor', name: 'Valor', type: 'number', value: 5000 },
        { id: 'field-tipo', name: 'Tipo', type: 'drop_down', value: 'Entrada' },
        { id: 'field-status', name: 'Status', type: 'drop_down', value: 'Pago' },
        { id: 'field-vencimento', name: 'Data de Vencimento', type: 'date', value: '1704672000000' },
        { id: 'field-impostos', name: 'Impostos/Taxas', type: 'number', value: 500 },
        { id: 'field-parcelamento', name: 'Parcelamento', type: 'text', value: '3/10' },
      ],
      attachments: [],
      list: { id: 'list-456', name: 'Financial List' },
    }

    it('should normalize a complete transaction', () => {
      const result = normalizer.normalizeTransaction(mockTask, fieldMap)

      expect(result).toEqual({
        id: 'task-456',
        descricao: 'Payment from Client',
        valor: 5000,
        tipo: 'Entrada',
        status: 'Pago',
        dataVencimento: expect.any(String),
        impostosTaxas: 500,
        parcelamento: {
          current: 3,
          total: 10,
          valuePerInstallment: 500,
        },
        createdAt: expect.any(String),
        clientId: '',
      })
    })

    it('should apply default values for missing fields', () => {
      const taskWithMissingFields: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-tipo', name: 'Tipo', type: 'drop_down', value: 'Entrada' },
          { id: 'field-status', name: 'Status', type: 'drop_down', value: 'Pago' },
        ],
      }

      const result = normalizer.normalizeTransaction(taskWithMissingFields, fieldMap)

      expect(result.valor).toBe(0)
      expect(result.impostosTaxas).toBe(0)
      expect(result.parcelamento).toBeNull()
    })

    it('should normalize transaction type', () => {
      const types: Array<'Entrada' | 'Saída'> = ['Entrada', 'Saída']

      types.forEach((tipo) => {
        const taskWithType: ClickUpTask = {
          ...mockTask,
          custom_fields: [
            { id: 'field-tipo', name: 'Tipo', type: 'drop_down', value: tipo },
          ],
        }

        const result = normalizer.normalizeTransaction(taskWithType, fieldMap)
        expect(result.tipo).toBe(tipo)
      })
    })

    it('should default to Entrada for invalid type', () => {
      const taskWithInvalidType: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-tipo', name: 'Tipo', type: 'drop_down', value: 'InvalidType' },
        ],
      }

      const result = normalizer.normalizeTransaction(taskWithInvalidType, fieldMap)

      expect(result.tipo).toBe('Entrada')
    })

    it('should normalize transaction status', () => {
      const statuses: Array<'Pago' | 'Pendente' | 'Atrasado'> = ['Pago', 'Pendente', 'Atrasado']

      statuses.forEach((status) => {
        const taskWithStatus: ClickUpTask = {
          ...mockTask,
          custom_fields: [
            { id: 'field-status', name: 'Status', type: 'drop_down', value: status },
          ],
        }

        const result = normalizer.normalizeTransaction(taskWithStatus, fieldMap)
        expect(result.status).toBe(status)
      })
    })

    it('should default to Pendente for invalid status', () => {
      const taskWithInvalidStatus: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-status', name: 'Status', type: 'drop_down', value: 'InvalidStatus' },
        ],
      }

      const result = normalizer.normalizeTransaction(taskWithInvalidStatus, fieldMap)

      expect(result.status).toBe('Pendente')
    })

    it('should parse valid parcelamento string', () => {
      const parcelamentos = ['1/12', '5/10', '10/10']

      parcelamentos.forEach((parcelamento) => {
        const [current, total] = parcelamento.split('/').map(Number)
        const taskWithParcelamento: ClickUpTask = {
          ...mockTask,
          custom_fields: [
            { id: 'field-valor', name: 'Valor', type: 'number', value: 1000 },
            { id: 'field-parcelamento', name: 'Parcelamento', type: 'text', value: parcelamento },
          ],
        }

        const result = normalizer.normalizeTransaction(taskWithParcelamento, fieldMap)

        expect(result.parcelamento).toEqual({
          current,
          total,
          valuePerInstallment: 1000 / total,
        })
      })
    })

    it('should return null for invalid parcelamento format', () => {
      const invalidFormats = ['invalid', '1-10', '1/0', '0/10', '11/10', '']

      invalidFormats.forEach((format) => {
        const taskWithInvalidParcelamento: ClickUpTask = {
          ...mockTask,
          custom_fields: [
            { id: 'field-parcelamento', name: 'Parcelamento', type: 'text', value: format },
          ],
        }

        const result = normalizer.normalizeTransaction(taskWithInvalidParcelamento, fieldMap)

        expect(result.parcelamento).toBeNull()
      })
    })

    it('should return null for missing parcelamento', () => {
      const taskWithoutParcelamento: ClickUpTask = {
        ...mockTask,
        custom_fields: mockTask.custom_fields.filter((f) => f.id !== 'field-parcelamento'),
      }

      const result = normalizer.normalizeTransaction(taskWithoutParcelamento, fieldMap)

      expect(result.parcelamento).toBeNull()
    })

    it('should calculate valuePerInstallment correctly', () => {
      const taskWithParcelamento: ClickUpTask = {
        ...mockTask,
        custom_fields: [
          { id: 'field-valor', name: 'Valor', type: 'number', value: 1200 },
          { id: 'field-parcelamento', name: 'Parcelamento', type: 'text', value: '4/12' },
        ],
      }

      const result = normalizer.normalizeTransaction(taskWithParcelamento, fieldMap)

      expect(result.parcelamento?.valuePerInstallment).toBe(100)
    })
  })

  describe('date normalization', () => {
    const fieldMap: FieldMapping['performance'] = {
      alcance: 'field-alcance',
      engajamento: 'field-engajamento',
      impressoes: 'field-impressoes',
      cliques: 'field-cliques',
      status: 'field-status',
      imagem: 'field-imagem',
    }

    it('should convert timestamp to ISO 8601', () => {
      const mockTask: ClickUpTask = {
        id: 'task-1',
        name: 'Test',
        description: '',
        status: { status: 'open', color: '#000000' },
        date_created: '1704067200000', // Unix timestamp
        date_updated: '1704067200000',
        custom_fields: [],
        attachments: [],
        list: { id: 'list-1', name: 'List' },
      }

      const result = normalizer.normalizePost(mockTask, fieldMap)

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle ISO date strings', () => {
      const mockTask: ClickUpTask = {
        id: 'task-1',
        name: 'Test',
        description: '',
        status: { status: 'open', color: '#000000' },
        date_created: '2024-01-01T00:00:00Z',
        date_updated: '2024-01-01T00:00:00Z',
        custom_fields: [],
        attachments: [],
        list: { id: 'list-1', name: 'List' },
      }

      const result = normalizer.normalizePost(mockTask, fieldMap)

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should use current date for invalid dates', () => {
      const mockTask: ClickUpTask = {
        id: 'task-1',
        name: 'Test',
        description: '',
        status: { status: 'open', color: '#000000' },
        date_created: 'invalid-date',
        date_updated: 'invalid-date',
        custom_fields: [],
        attachments: [],
        list: { id: 'list-1', name: 'List' },
      }

      const result = normalizer.normalizePost(mockTask, fieldMap)

      const now = new Date()
      const resultDate = new Date(result.createdAt)
      const timeDiff = Math.abs(now.getTime() - resultDate.getTime())

      // Should be within 1 second of current time
      expect(timeDiff).toBeLessThan(1000)
    })
  })
})
