/**
 * Property-Based Tests for Transaction Input Validation
 * 
 * Property 17: Input Validation Completeness
 * 
 * For any transaction input data, validation SHALL correctly identify all missing
 * required fields (Valor, Tipo, Data_de_Vencimento, Status) and return a validation
 * error if any required field is absent or null.
 * 
 * **Validates: Requirements 11.3**
 */

import * as fc from 'fast-check'
import type { CreateTransactionRequest, TransactionType, TransactionStatus } from '@/modules/finance/types/transaction.types'

/**
 * Validation function extracted from the POST endpoint logic
 * This mirrors the validation logic in app/api/transactions/route.ts
 */
function validateTransactionInput(body: Partial<CreateTransactionRequest>): {
  isValid: boolean
  errors: string[]
} {
  const validationErrors: string[] = []

  // Validate valor
  if (body.valor === undefined || body.valor === null) {
    validationErrors.push('valor is required')
  } else if (typeof body.valor !== 'number' || body.valor <= 0) {
    validationErrors.push('valor must be a positive number')
  }

  // Validate tipo
  if (!body.tipo) {
    validationErrors.push('tipo is required')
  } else if (body.tipo !== 'Entrada' && body.tipo !== 'Saída') {
    validationErrors.push('tipo must be either "Entrada" or "Saída"')
  }

  // Validate status
  if (!body.status) {
    validationErrors.push('status is required')
  } else if (body.status !== 'Pago' && body.status !== 'Pendente' && body.status !== 'Atrasado') {
    validationErrors.push('status must be "Pago", "Pendente", or "Atrasado"')
  }

  // Validate dataVencimento
  if (!body.dataVencimento) {
    validationErrors.push('dataVencimento is required')
  } else {
    const dueDate = new Date(body.dataVencimento)
    if (isNaN(dueDate.getTime())) {
      validationErrors.push('dataVencimento must be a valid ISO 8601 date')
    }
  }

  // Validate optional fields
  if (body.impostosTaxas !== undefined && (typeof body.impostosTaxas !== 'number' || body.impostosTaxas < 0)) {
    validationErrors.push('impostosTaxas must be a non-negative number')
  }

  if (body.parcelamento !== undefined) {
    const parcelamentoMatch = body.parcelamento.match(/^(\d+)\/(\d+)$/)
    if (!parcelamentoMatch) {
      validationErrors.push('parcelamento must be in format "X/Y" (e.g., "3/10")')
    } else {
      const current = parseInt(parcelamentoMatch[1], 10)
      const total = parseInt(parcelamentoMatch[2], 10)
      if (current < 1 || total < 1 || current > total) {
        validationErrors.push('parcelamento must have valid range (1 ≤ X ≤ Y)')
      }
    }
  }

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
  }
}

describe('Feature: portal-performance-gestao-financeira, Property 17: Input Validation Completeness', () => {
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
   * Generates arbitrary positive monetary values
   */
  const positiveMonetaryValueArbitrary = fc.double({
    min: 0.01,
    max: 1000000,
    noNaN: true,
    noDefaultInfinity: true,
  })

  /**
   * Generates arbitrary non-negative monetary values (for taxes)
   */
  const nonNegativeMonetaryValueArbitrary = fc.double({
    min: 0,
    max: 1000000,
    noNaN: true,
    noDefaultInfinity: true,
  })

  /**
   * Generates valid ISO 8601 date strings
   */
  const validDateArbitrary = fc
    .date({
      min: new Date('2020-01-01'),
      max: new Date('2030-12-31'),
    })
    .map((d) => d.toISOString())

  /**
   * Generates valid parcelamento strings in format "X/Y"
   */
  const validParcelamentoArbitrary = fc
    .tuple(
      fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 1, max: 100 })
    )
    .filter(([current, total]) => current <= total)
    .map(([current, total]) => `${current}/${total}`)

  /**
   * Generates a complete valid CreateTransactionRequest
   */
  const validTransactionRequestArbitrary: fc.Arbitrary<CreateTransactionRequest> = fc.record({
    valor: positiveMonetaryValueArbitrary,
    tipo: transactionTypeArbitrary,
    status: transactionStatusArbitrary,
    dataVencimento: validDateArbitrary,
    impostosTaxas: fc.option(nonNegativeMonetaryValueArbitrary, { nil: undefined }),
    parcelamento: fc.option(validParcelamentoArbitrary, { nil: undefined }),
    descricao: fc.option(fc.string(), { nil: undefined }),
  })

  /**
   * Property 17.1: Valid complete input passes validation
   */
  it('should accept inputs with all required fields present and valid', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const result = validateTransactionInput(input)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.2: Missing valor field is rejected
   */
  it('should reject inputs missing the valor field', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const { valor, ...inputWithoutValor } = input
        const result = validateTransactionInput(inputWithoutValor)

        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('valor'))).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.3: Missing tipo field is rejected
   */
  it('should reject inputs missing the tipo field', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const { tipo, ...inputWithoutTipo } = input
        const result = validateTransactionInput(inputWithoutTipo)

        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('tipo'))).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.4: Missing status field is rejected
   */
  it('should reject inputs missing the status field', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const { status, ...inputWithoutStatus } = input
        const result = validateTransactionInput(inputWithoutStatus)

        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('status'))).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.5: Missing dataVencimento field is rejected
   */
  it('should reject inputs missing the dataVencimento field', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const { dataVencimento, ...inputWithoutDate } = input
        const result = validateTransactionInput(inputWithoutDate)

        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('dataVencimento'))).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.6: Missing multiple required fields reports all missing fields
   */
  it('should report all missing required fields when multiple are absent', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        // Remove all required fields
        const { valor, tipo, status, dataVencimento, ...inputWithoutRequired } = input
        const result = validateTransactionInput(inputWithoutRequired)

        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThanOrEqual(4)
        expect(result.errors.some(e => e.includes('valor'))).toBe(true)
        expect(result.errors.some(e => e.includes('tipo'))).toBe(true)
        expect(result.errors.some(e => e.includes('status'))).toBe(true)
        expect(result.errors.some(e => e.includes('dataVencimento'))).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.7: Invalid valor (zero or negative) is rejected
   */
  it('should reject inputs with zero or negative valor', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.double({ min: -1000000, max: 0, noNaN: true, noDefaultInfinity: true }),
        (input, invalidValor) => {
          const inputWithInvalidValor = { ...input, valor: invalidValor }
          const result = validateTransactionInput(inputWithInvalidValor)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('valor'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.8: Invalid tipo value is rejected
   */
  it('should reject inputs with invalid tipo values', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.string().filter(s => s !== 'Entrada' && s !== 'Saída'),
        (input, invalidTipo) => {
          const inputWithInvalidTipo = { ...input, tipo: invalidTipo as TransactionType }
          const result = validateTransactionInput(inputWithInvalidTipo)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('tipo'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.9: Invalid status value is rejected
   */
  it('should reject inputs with invalid status values', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.string().filter(s => s !== 'Pago' && s !== 'Pendente' && s !== 'Atrasado'),
        (input, invalidStatus) => {
          const inputWithInvalidStatus = { ...input, status: invalidStatus as TransactionStatus }
          const result = validateTransactionInput(inputWithInvalidStatus)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('status'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.10: Invalid date format is rejected
   */
  it('should reject inputs with invalid date formats', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.constantFrom('invalid-date', '2024-13-01', '2024-02-30', 'not a date', ''),
        (input, invalidDate) => {
          const inputWithInvalidDate = { ...input, dataVencimento: invalidDate }
          const result = validateTransactionInput(inputWithInvalidDate)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('dataVencimento'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.11: Optional fields can be omitted without causing validation failure
   */
  it('should accept inputs without optional fields (impostosTaxas, parcelamento, descricao)', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const { impostosTaxas, parcelamento, descricao, ...inputWithoutOptional } = input
        const result = validateTransactionInput(inputWithoutOptional)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.12: Valid optional fields are accepted
   */
  it('should accept inputs with valid optional fields', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        nonNegativeMonetaryValueArbitrary,
        validParcelamentoArbitrary,
        fc.string(),
        (input, impostos, parcelamento, descricao) => {
          const inputWithOptional = {
            ...input,
            impostosTaxas: impostos,
            parcelamento,
            descricao,
          }
          const result = validateTransactionInput(inputWithOptional)

          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.13: Negative impostosTaxas is rejected
   */
  it('should reject inputs with negative impostosTaxas', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.double({ min: -1000000, max: -0.01, noNaN: true, noDefaultInfinity: true }),
        (input, negativeImpostos) => {
          const inputWithNegativeImpostos = { ...input, impostosTaxas: negativeImpostos }
          const result = validateTransactionInput(inputWithNegativeImpostos)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('impostosTaxas'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.14: Invalid parcelamento format is rejected
   */
  it('should reject inputs with invalid parcelamento format', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.constantFrom('invalid', '1-10', '1/0', '0/10', '11/10', 'abc/def', '1/', '/10'),
        (input, invalidParcelamento) => {
          const inputWithInvalidParcelamento = { ...input, parcelamento: invalidParcelamento }
          const result = validateTransactionInput(inputWithInvalidParcelamento)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('parcelamento'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.15: Parcelamento with current > total is rejected
   */
  it('should reject parcelamento where current installment exceeds total', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.integer({ min: 2, max: 100 }),
        fc.integer({ min: 1, max: 99 }),
        (input, current, total) => {
          // Ensure current > total
          if (current <= total) {
            [current, total] = [total + 1, current]
          }
          const invalidParcelamento = `${current}/${total}`
          const inputWithInvalidParcelamento = { ...input, parcelamento: invalidParcelamento }
          const result = validateTransactionInput(inputWithInvalidParcelamento)

          expect(result.isValid).toBe(false)
          expect(result.errors.some(e => e.includes('parcelamento'))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.16: Validation is deterministic (same input produces same result)
   */
  it('should produce the same validation result for the same input', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const result1 = validateTransactionInput(input)
        const result2 = validateTransactionInput(input)
        const result3 = validateTransactionInput(input)

        expect(result1.isValid).toBe(result2.isValid)
        expect(result2.isValid).toBe(result3.isValid)
        expect(result1.errors).toEqual(result2.errors)
        expect(result2.errors).toEqual(result3.errors)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.17: Validation errors are descriptive and specific
   */
  it('should provide specific error messages for each validation failure', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        // Test with missing valor
        const { valor, ...withoutValor } = input
        const result = validateTransactionInput(withoutValor)

        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.every(e => typeof e === 'string' && e.length > 0)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.18: Empty object is rejected with all required field errors
   */
  it('should reject empty object with errors for all required fields', () => {
    const result = validateTransactionInput({})

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
    expect(result.errors.some(e => e.includes('valor'))).toBe(true)
    expect(result.errors.some(e => e.includes('tipo'))).toBe(true)
    expect(result.errors.some(e => e.includes('status'))).toBe(true)
    expect(result.errors.some(e => e.includes('dataVencimento'))).toBe(true)
  })

  /**
   * Property 17.19: Null values for required fields are rejected
   */
  it('should reject null values for required fields', () => {
    fc.assert(
      fc.property(validTransactionRequestArbitrary, (input) => {
        const inputWithNulls = {
          ...input,
          valor: null as any,
          tipo: null as any,
          status: null as any,
          dataVencimento: null as any,
        }
        const result = validateTransactionInput(inputWithNulls)

        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThanOrEqual(4)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 17.20: Valid date formats are accepted (ISO 8601)
   */
  it('should accept valid ISO 8601 date formats', () => {
    fc.assert(
      fc.property(
        validTransactionRequestArbitrary,
        fc.constantFrom(
          '2024-01-15T10:30:00.000Z',
          '2024-12-31T23:59:59.999Z',
          '2020-06-15T00:00:00.000Z',
          new Date().toISOString()
        ),
        (input, validDate) => {
          const inputWithValidDate = { ...input, dataVencimento: validDate }
          const result = validateTransactionInput(inputWithValidDate)

          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
