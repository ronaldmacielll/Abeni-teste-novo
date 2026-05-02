/**
 * Property-Based Tests for Transaction Normalization
 * 
 * Property 6: Transaction Normalization Completeness
 * 
 * For any ClickUp task object with financial custom fields, transforming it to a Transaction object SHALL:
 * - Extract all specified custom fields (Valor, Tipo, Status, Data_de_Vencimento, Impostos_Taxas, Parcelamento)
 * - Map custom field IDs to human-readable property names
 * - Provide default values for any missing custom fields
 * - Convert all date fields to ISO 8601 format
 * - Remove unnecessary ClickUp metadata fields
 * - Produce a valid Transaction object with all required fields present
 * 
 * Validates: Requirements 6.2, 6.3, 17.2, 17.3, 17.4, 17.5, 20.1
 */

import * as fc from 'fast-check'
import { DataNormalizer } from './normalizer'
import type { ClickUpTask, FieldMapping, CustomField } from './types'
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '@/modules/finance/types/transaction.types'

describe('Property 6: Transaction Normalization Completeness', () => {
  const normalizer = new DataNormalizer()

  // Field mapping for financial module
  const fieldMap: FieldMapping['financial'] = {
    valor: 'field-valor',
    tipo: 'field-tipo',
    status: 'field-status',
    dataVencimento: 'field-data-vencimento',
    impostosTaxas: 'field-impostos-taxas',
    parcelamento: 'field-parcelamento',
  }

  // Arbitraries (generators) for property-based testing

  /**
   * Generates valid TransactionType values
   */
  const transactionTypeArbitrary = fc.constantFrom<TransactionType>('Entrada', 'Saída')

  /**
   * Generates valid TransactionStatus values
   */
  const transactionStatusArbitrary = fc.constantFrom<TransactionStatus>(
    'Pago',
    'Pendente',
    'Atrasado'
  )

  /**
   * Generates arbitrary numeric values (valid and invalid)
   */
  const numericValueArbitrary = fc.oneof(
    fc.integer({ min: 0, max: 1000000 }), // Valid integers
    fc.double({ min: 0, max: 1000000, noNaN: true }), // Valid floats
    fc.constant(null), // Missing values
    fc.constant(undefined), // Undefined values
    fc.string(), // String representations
    fc.constant('not-a-number') // Invalid strings
  )

  /**
   * Generates arbitrary parcelamento strings
   */
  const parcelamentoArbitrary = fc.oneof(
    fc
      .tuple(fc.integer({ min: 1, max: 24 }), fc.integer({ min: 1, max: 24 }))
      .filter(([current, total]) => current <= total)
      .map(([current, total]) => `${current}/${total}`), // Valid format
    fc.constant(null), // Missing
    fc.constant(undefined), // Undefined
    fc.string(), // Invalid format
    fc.constant('0/0'), // Invalid range
    fc.constant('5/3'), // Current > total
    fc.constant('invalid/format') // Invalid format
  )

  /**
   * Generates arbitrary date values (valid and invalid)
   */
  const dateArbitrary = fc.oneof(
    fc.integer({ min: 0, max: Date.now() }).map(String), // Unix timestamp as string
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString()), // ISO string
    fc.constant('invalid-date'), // Invalid date
    fc.constant(''), // Empty string
    fc.constant(null) // Null
  )

  /**
   * Generates a custom field for a specific financial field
   */
  const financialCustomFieldArbitrary = (fieldId: string, fieldName: string, valueArb: fc.Arbitrary<any>) =>
    fc.record({
      id: fc.constant(fieldId),
      name: fc.constant(fieldName),
      type: fc.constantFrom('number', 'text', 'date', 'drop_down'),
      value: valueArb,
    }) as fc.Arbitrary<CustomField>

  /**
   * Generates an array of custom fields (may be complete or incomplete)
   */
  const customFieldsArbitrary = fc
    .tuple(
      fc.option(financialCustomFieldArbitrary('field-valor', 'Valor', numericValueArbitrary), {
        nil: undefined,
      }),
      fc.option(
        financialCustomFieldArbitrary(
          'field-tipo',
          'Tipo',
          fc.oneof(transactionTypeArbitrary, fc.string(), fc.constant(null))
        ),
        { nil: undefined }
      ),
      fc.option(
        financialCustomFieldArbitrary(
          'field-status',
          'Status',
          fc.oneof(transactionStatusArbitrary, fc.string(), fc.constant(null))
        ),
        { nil: undefined }
      ),
      fc.option(
        financialCustomFieldArbitrary('field-data-vencimento', 'Data de Vencimento', dateArbitrary),
        { nil: undefined }
      ),
      fc.option(
        financialCustomFieldArbitrary('field-impostos-taxas', 'Impostos/Taxas', numericValueArbitrary),
        { nil: undefined }
      ),
      fc.option(
        financialCustomFieldArbitrary('field-parcelamento', 'Parcelamento', parcelamentoArbitrary),
        { nil: undefined }
      )
    )
    .map((fields) => fields.filter((f): f is CustomField => f !== undefined))

  /**
   * Generates arbitrary ClickUp tasks for financial data
   */
  const clickUpTaskArbitrary: fc.Arbitrary<ClickUpTask> = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    description: fc.string(),
    status: fc.record({
      status: fc.string(),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }).map((s) => `#${s}`),
    }),
    date_created: dateArbitrary,
    date_updated: dateArbitrary,
    custom_fields: customFieldsArbitrary,
    attachments: fc.constant([]),
    list: fc.record({
      id: fc.string(),
      name: fc.string(),
    }),
  })

  /**
   * Property 6.1: All required fields are present in normalized Transaction
   */
  it('should always produce a Transaction with all required fields present', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // All required fields must be present
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('descricao')
        expect(result).toHaveProperty('valor')
        expect(result).toHaveProperty('tipo')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('dataVencimento')
        expect(result).toHaveProperty('impostosTaxas')
        expect(result).toHaveProperty('parcelamento')
        expect(result).toHaveProperty('createdAt')
        expect(result).toHaveProperty('clientId')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.2: Custom field IDs are mapped to human-readable property names
   */
  it('should map custom field IDs to human-readable property names', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // Result should not contain ClickUp field IDs
        const resultString = JSON.stringify(result)
        expect(resultString).not.toContain('field-valor')
        expect(resultString).not.toContain('field-tipo')
        expect(resultString).not.toContain('field-status')
        expect(resultString).not.toContain('field-data-vencimento')
        expect(resultString).not.toContain('field-impostos-taxas')
        expect(resultString).not.toContain('field-parcelamento')

        // Result should contain human-readable names
        expect(result).toHaveProperty('valor')
        expect(result).toHaveProperty('tipo')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('dataVencimento')
        expect(result).toHaveProperty('impostosTaxas')
        expect(result).toHaveProperty('parcelamento')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.3: Missing numeric fields default to 0
   */
  it('should provide default value of 0 for missing numeric fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // Valor and impostosTaxas must be numbers
        expect(typeof result.valor).toBe('number')
        expect(typeof result.impostosTaxas).toBe('number')

        // Must be non-negative
        expect(result.valor).toBeGreaterThanOrEqual(0)
        expect(result.impostosTaxas).toBeGreaterThanOrEqual(0)

        // Must not be NaN
        expect(result.valor).not.toBeNaN()
        expect(result.impostosTaxas).not.toBeNaN()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.4: Missing optional fields default to null
   */
  it('should provide default value of null for missing optional fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // parcelamento can be null or object
        expect(
          result.parcelamento === null || typeof result.parcelamento === 'object'
        ).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.5: All date fields are converted to ISO 8601 format
   */
  it('should convert all date fields to ISO 8601 format', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // ISO 8601 regex pattern
        const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

        // createdAt must be valid ISO 8601
        expect(result.createdAt).toMatch(iso8601Pattern)
        expect(() => new Date(result.createdAt)).not.toThrow()
        expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt)

        // dataVencimento must be valid ISO 8601
        expect(result.dataVencimento).toMatch(iso8601Pattern)
        expect(() => new Date(result.dataVencimento)).not.toThrow()
        expect(new Date(result.dataVencimento).toISOString()).toBe(result.dataVencimento)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.6: Unnecessary ClickUp metadata is removed
   */
  it('should remove unnecessary ClickUp metadata fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // Result should not contain ClickUp-specific metadata
        expect(result).not.toHaveProperty('description')
        expect(result).not.toHaveProperty('date_updated')
        expect(result).not.toHaveProperty('custom_fields')
        expect(result).not.toHaveProperty('attachments')
        expect(result).not.toHaveProperty('list')

        // Result should only have Transaction interface properties
        const allowedKeys = [
          'id',
          'descricao',
          'valor',
          'tipo',
          'status',
          'dataVencimento',
          'impostosTaxas',
          'parcelamento',
          'createdAt',
          'clientId',
        ]
        const resultKeys = Object.keys(result)
        resultKeys.forEach((key) => {
          expect(allowedKeys).toContain(key)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.7: Tipo is always a valid TransactionType
   */
  it('should always produce a valid TransactionType', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        const validTypes: TransactionType[] = ['Entrada', 'Saída']
        expect(validTypes).toContain(result.tipo)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.8: Status is always a valid TransactionStatus
   */
  it('should always produce a valid TransactionStatus', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        const validStatuses: TransactionStatus[] = ['Pago', 'Pendente', 'Atrasado']
        expect(validStatuses).toContain(result.status)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.9: ID and descricao are preserved from source task
   */
  it('should preserve id and descricao from source ClickUp task', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        expect(result.id).toBe(task.id)
        expect(result.descricao).toBe(task.name)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.10: Normalization is idempotent for valid inputs
   */
  it('should produce consistent results for the same input', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result1 = normalizer.normalizeTransaction(task, fieldMap)
        const result2 = normalizer.normalizeTransaction(task, fieldMap)

        expect(result1).toEqual(result2)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.11: Type safety - result conforms to Transaction interface
   */
  it('should produce a result that conforms to Transaction interface types', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        // Type checks
        expect(typeof result.id).toBe('string')
        expect(typeof result.descricao).toBe('string')
        expect(typeof result.valor).toBe('number')
        expect(typeof result.tipo).toBe('string')
        expect(typeof result.status).toBe('string')
        expect(typeof result.dataVencimento).toBe('string')
        expect(typeof result.impostosTaxas).toBe('number')
        expect(
          result.parcelamento === null || typeof result.parcelamento === 'object'
        ).toBe(true)
        expect(typeof result.createdAt).toBe('string')
        expect(typeof result.clientId).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.12: Numeric string values are correctly converted to numbers
   */
  it('should convert numeric string values to actual numbers', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.constant([
            {
              id: 'field-valor',
              name: 'Valor',
              type: 'text' as const,
              value: '5000.50',
            },
            {
              id: 'field-impostos-taxas',
              name: 'Impostos/Taxas',
              type: 'text' as const,
              value: '750.25',
            },
          ]),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.valor).toBeCloseTo(5000.50, 2)
          expect(result.impostosTaxas).toBeCloseTo(750.25, 2)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 6.13: Invalid numeric values default to 0
   */
  it('should default to 0 for invalid numeric values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.constant([
            {
              id: 'field-valor',
              name: 'Valor',
              type: 'text' as const,
              value: 'not-a-number',
            },
            {
              id: 'field-impostos-taxas',
              name: 'Impostos/Taxas',
              type: 'text' as const,
              value: 'invalid',
            },
          ]),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.valor).toBe(0)
          expect(result.impostosTaxas).toBe(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 6.14: clientId is initialized as empty string
   */
  it('should initialize clientId as empty string (to be set by BFF)', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        expect(result.clientId).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.15: Valid parcelamento is correctly parsed
   */
  it('should correctly parse valid parcelamento strings', () => {
    fc.assert(
      fc.property(
        fc
          .tuple(
            fc.integer({ min: 1, max: 24 }),
            fc.integer({ min: 1, max: 24 }),
            fc.double({ min: 100, max: 100000, noNaN: true })
          )
          .filter(([current, total]) => current <= total)
          .chain(([current, total, valor]) =>
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              description: fc.string(),
              status: fc.record({
                status: fc.string(),
                color: fc.string(),
              }),
              date_created: fc.constant('2024-01-01'),
              date_updated: fc.constant('2024-01-01'),
              custom_fields: fc.constant([
                {
                  id: 'field-valor',
                  name: 'Valor',
                  type: 'number' as const,
                  value: valor,
                },
                {
                  id: 'field-parcelamento',
                  name: 'Parcelamento',
                  type: 'text' as const,
                  value: `${current}/${total}`,
                },
              ]),
              attachments: fc.constant([]),
              list: fc.record({
                id: fc.string(),
                name: fc.string(),
              }),
              _expected: fc.constant({ current, total, valor }),
            })
          ) as fc.Arbitrary<ClickUpTask & { _expected: { current: number; total: number; valor: number } }>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.parcelamento).not.toBeNull()
          expect(result.parcelamento?.current).toBe(task._expected.current)
          expect(result.parcelamento?.total).toBe(task._expected.total)
          expect(result.parcelamento?.valuePerInstallment).toBeCloseTo(
            task._expected.valor / task._expected.total,
            2
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.16: Invalid parcelamento defaults to null
   */
  it('should default to null for invalid parcelamento values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.oneof(
            fc.constant([
              {
                id: 'field-parcelamento',
                name: 'Parcelamento',
                type: 'text' as const,
                value: 'invalid-format',
              },
            ]),
            fc.constant([
              {
                id: 'field-parcelamento',
                name: 'Parcelamento',
                type: 'text' as const,
                value: '5/3', // current > total
              },
            ]),
            fc.constant([
              {
                id: 'field-parcelamento',
                name: 'Parcelamento',
                type: 'text' as const,
                value: '0/0', // invalid range
              },
            ]),
            fc.constant([
              {
                id: 'field-parcelamento',
                name: 'Parcelamento',
                type: 'text' as const,
                value: null,
              },
            ])
          ),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.parcelamento).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.17: Invalid tipo defaults to 'Entrada'
   */
  it('should default to Entrada for invalid tipo values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.constant([
            {
              id: 'field-tipo',
              name: 'Tipo',
              type: 'text' as const,
              value: 'InvalidType',
            },
          ]),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.tipo).toBe('Entrada')
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 6.18: Invalid status defaults to 'Pendente'
   */
  it('should default to Pendente for invalid status values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.constant([
            {
              id: 'field-status',
              name: 'Status',
              type: 'text' as const,
              value: 'InvalidStatus',
            },
          ]),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizeTransaction(task, fieldMap)

          expect(result.status).toBe('Pendente')
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 6.19: Parcelamento valuePerInstallment is always positive when present
   */
  it('should always have positive valuePerInstallment when parcelamento is present', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        if (result.parcelamento !== null) {
          expect(result.parcelamento.valuePerInstallment).toBeGreaterThanOrEqual(0)
          expect(result.parcelamento.valuePerInstallment).not.toBeNaN()
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6.20: Parcelamento current is always <= total when present
   */
  it('should always have current <= total when parcelamento is present', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizeTransaction(task, fieldMap)

        if (result.parcelamento !== null) {
          expect(result.parcelamento.current).toBeLessThanOrEqual(
            result.parcelamento.total
          )
          expect(result.parcelamento.current).toBeGreaterThanOrEqual(1)
          expect(result.parcelamento.total).toBeGreaterThanOrEqual(1)
        }
      }),
      { numRuns: 100 }
    )
  })
})
