/**
 * fast-check Generators for ClickUp API Types
 * 
 * These generators create arbitrary ClickUp task objects for property-based testing.
 * They are used across multiple test suites to ensure consistent test data generation.
 * 
 * Configuration: 100 iterations per property test (as per Testing Strategy)
 */

import * as fc from 'fast-check'
import type { ClickUpTask, CustomField, Attachment, FieldMapping } from '@/services/clickup/types'

/**
 * Generates arbitrary custom field values based on field type
 */
export const customFieldValueArbitrary = (type: CustomField['type']): fc.Arbitrary<any> => {
  switch (type) {
    case 'number':
      return fc.double({ min: 0, max: 1000000, noNaN: true, noDefaultInfinity: true })
    case 'text':
      return fc.string({ minLength: 0, maxLength: 100 })
    case 'drop_down':
      return fc.record({
        id: fc.string({ minLength: 1 }),
        name: fc.constantFrom('Publicado', 'Agendado', 'Rascunho', 'Arquivado', 'Pago', 'Pendente', 'Atrasado', 'Entrada', 'Saída'),
        color: fc.hexaString({ minLength: 6, maxLength: 6 }),
      })
    case 'date':
      return fc.integer({ min: 1577836800000, max: 1893456000000 }) // 2020-2030 in milliseconds
    case 'url':
      return fc.webUrl()
    case 'attachment':
      return fc.array(
        fc.record({
          id: fc.string({ minLength: 1 }),
          url: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 50 }),
          extension: fc.constantFrom('jpg', 'png', 'gif', 'pdf', 'doc'),
        }),
        { maxLength: 3 }
      )
    default:
      return fc.string()
  }
}

/**
 * Generates arbitrary CustomField objects
 */
export const customFieldArbitrary = (
  name?: string,
  type?: CustomField['type']
): fc.Arbitrary<CustomField> => {
  const fieldType = type || fc.sample(fc.constantFrom<CustomField['type']>('number', 'text', 'drop_down', 'date', 'url', 'attachment'), 1)[0]
  
  return fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.constant(name || fc.sample(fc.string({ minLength: 1, maxLength: 20 }), 1)[0]),
    type: fc.constant(fieldType),
    value: customFieldValueArbitrary(fieldType),
    type_config: fc.option(
      fc.record({
        options: fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }),
          }),
          { maxLength: 5 }
        ),
      }),
      { nil: undefined }
    ),
  })
}

/**
 * Generates arbitrary Attachment objects
 */
export const attachmentArbitrary: fc.Arbitrary<Attachment> = fc.record({
  id: fc.string({ minLength: 1 }),
  url: fc.webUrl(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  extension: fc.constantFrom('jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'),
})

/**
 * Generates arbitrary ClickUpTask objects for Performance Module
 * 
 * Includes custom fields: Alcance, Engajamento, Impressões, Cliques, Status, Imagem
 */
export const clickUpTaskPerformanceArbitrary = (clientId?: string): fc.Arbitrary<ClickUpTask> => {
  return fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    status: fc.record({
      status: fc.constantFrom('Publicado', 'Agendado', 'Rascunho', 'Arquivado'),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }),
    }),
    date_created: fc
      .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map((d) => d.getTime().toString()),
    date_updated: fc
      .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map((d) => d.getTime().toString()),
    custom_fields: fc.constant([
      {
        id: 'alcance-field-id',
        name: 'Alcance',
        type: 'number' as const,
        value: fc.sample(fc.integer({ min: 0, max: 100000 }), 1)[0],
      },
      {
        id: 'engajamento-field-id',
        name: 'Engajamento',
        type: 'number' as const,
        value: fc.sample(fc.integer({ min: 0, max: 10000 }), 1)[0],
      },
      {
        id: 'impressoes-field-id',
        name: 'Impressões',
        type: 'number' as const,
        value: fc.sample(fc.integer({ min: 0, max: 500000 }), 1)[0],
      },
      {
        id: 'cliques-field-id',
        name: 'Cliques',
        type: 'number' as const,
        value: fc.sample(fc.integer({ min: 0, max: 5000 }), 1)[0],
      },
      {
        id: 'status-field-id',
        name: 'Status',
        type: 'drop_down' as const,
        value: fc.sample(
          fc.constantFrom('Publicado', 'Agendado', 'Rascunho', 'Arquivado'),
          1
        )[0],
      },
      {
        id: 'client-id-field-id',
        name: 'client_id',
        type: 'text' as const,
        value: clientId || fc.sample(fc.string({ minLength: 1 }), 1)[0],
      },
    ]),
    attachments: fc.sample(fc.array(attachmentArbitrary, { maxLength: 3 }), 1)[0],
    list: fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.constant('Performance Posts'),
    }),
  })
}

/**
 * Generates arbitrary ClickUpTask objects for Financial Module
 * 
 * Includes custom fields: Valor, Tipo, Status, Data_de_Vencimento, Impostos_Taxas, Parcelamento
 */
export const clickUpTaskFinancialArbitrary = (clientId?: string): fc.Arbitrary<ClickUpTask> => {
  return fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    status: fc.record({
      status: fc.constantFrom('Pago', 'Pendente', 'Atrasado'),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }),
    }),
    date_created: fc
      .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map((d) => d.getTime().toString()),
    date_updated: fc
      .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
      .map((d) => d.getTime().toString()),
    custom_fields: fc.constant([
      {
        id: 'valor-field-id',
        name: 'Valor',
        type: 'number' as const,
        value: fc.sample(fc.double({ min: 100, max: 100000, noNaN: true, noDefaultInfinity: true }), 1)[0],
      },
      {
        id: 'tipo-field-id',
        name: 'Tipo',
        type: 'drop_down' as const,
        value: fc.sample(fc.constantFrom('Entrada', 'Saída'), 1)[0],
      },
      {
        id: 'status-field-id',
        name: 'Status',
        type: 'drop_down' as const,
        value: fc.sample(fc.constantFrom('Pago', 'Pendente', 'Atrasado'), 1)[0],
      },
      {
        id: 'data-vencimento-field-id',
        name: 'Data_de_Vencimento',
        type: 'date' as const,
        value: fc.sample(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.getTime()),
          1
        )[0],
      },
      {
        id: 'impostos-taxas-field-id',
        name: 'Impostos_Taxas',
        type: 'number' as const,
        value: fc.sample(fc.double({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true }), 1)[0],
      },
      {
        id: 'parcelamento-field-id',
        name: 'Parcelamento',
        type: 'text' as const,
        value: fc.sample(
          fc.option(
            fc.tuple(fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 12 }))
              .filter(([current, total]) => current <= total)
              .map(([current, total]) => `${current}/${total}`),
            { nil: null }
          ),
          1
        )[0],
      },
      {
        id: 'client-id-field-id',
        name: 'client_id',
        type: 'text' as const,
        value: clientId || fc.sample(fc.string({ minLength: 1 }), 1)[0],
      },
    ]),
    attachments: fc.constant([]),
    list: fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.constant('Financial Transactions'),
    }),
  })
}

/**
 * Generates arbitrary FieldMapping for Performance Module
 */
export const performanceFieldMappingArbitrary: fc.Arbitrary<FieldMapping['performance']> = fc.constant({
  alcance: 'alcance-field-id',
  engajamento: 'engajamento-field-id',
  impressoes: 'impressoes-field-id',
  cliques: 'cliques-field-id',
  status: 'status-field-id',
  imagem: 'imagem-field-id',
})

/**
 * Generates arbitrary FieldMapping for Financial Module
 */
export const financialFieldMappingArbitrary: fc.Arbitrary<FieldMapping['financial']> = fc.constant({
  valor: 'valor-field-id',
  tipo: 'tipo-field-id',
  status: 'status-field-id',
  dataVencimento: 'data-vencimento-field-id',
  impostosTaxas: 'impostos-taxas-field-id',
  parcelamento: 'parcelamento-field-id',
})

/**
 * Generates a complete FieldMapping object
 */
export const fieldMappingArbitrary: fc.Arbitrary<FieldMapping> = fc.record({
  performance: performanceFieldMappingArbitrary,
  financial: financialFieldMappingArbitrary,
})
