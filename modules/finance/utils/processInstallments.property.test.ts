/**
 * Property-Based Tests for Installment Processing
 * 
 * Property 16: Installment Distribution
 * 
 * For any transaction with parcelamento "X/Y" and due date D, distributing remaining
 * installments across future months SHALL:
 * - Generate (Y - X) separate transaction entries for remaining installments
 * - Assign each entry a value equal to valuePerInstallment
 * - Assign each entry a due date in sequential months starting from D + 1 month
 * - Preserve all other transaction properties (Tipo, Status, etc.) in each entry
 * - Ensure the sum of all generated entry values equals the remaining installment value
 * 
 * **Validates: Requirements 10.4, 10.5**
 */

import * as fc from 'fast-check'
import { processInstallments } from './calculations'
import type { Transaction, TransactionType, TransactionStatus, Installment } from '../types/transaction.types'

describe('Property 16: Installment Distribution', () => {
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
  const monetaryValueArbitrary = fc.double({
    min: 100,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  })

  /**
   * Generates arbitrary dates within a reasonable range
   */
  const dateArbitrary = fc
    .date({
      min: new Date('2020-01-01'),
      max: new Date('2030-12-31'),
    })
    .map((d) => d.toISOString())

  /**
   * Generates valid installment information where current <= total
   */
  const installmentArbitrary: fc.Arbitrary<Installment> = fc
    .tuple(
      fc.integer({ min: 1, max: 50 }), // total installments
      fc.integer({ min: 1, max: 50 })  // current installment
    )
    .filter(([total, current]) => current <= total)
    .chain(([total, current]) =>
      monetaryValueArbitrary.map((totalValue) => ({
        current,
        total,
        valuePerInstallment: totalValue / total,
      }))
    )

  /**
   * Generates arbitrary Transaction objects with installments
   */
  const transactionWithInstallmentArbitrary: fc.Arbitrary<Transaction> = fc.record({
    id: fc.string({ minLength: 1 }),
    descricao: fc.string(),
    valor: monetaryValueArbitrary,
    tipo: transactionTypeArbitrary,
    status: transactionStatusArbitrary,
    dataVencimento: dateArbitrary,
    impostosTaxas: monetaryValueArbitrary,
    parcelamento: installmentArbitrary,
    createdAt: dateArbitrary,
    clientId: fc.string(),
  })

  /**
   * Generates arbitrary Transaction objects without installments
   */
  const transactionWithoutInstallmentArbitrary: fc.Arbitrary<Transaction> = fc.record({
    id: fc.string({ minLength: 1 }),
    descricao: fc.string(),
    valor: monetaryValueArbitrary,
    tipo: transactionTypeArbitrary,
    status: transactionStatusArbitrary,
    dataVencimento: dateArbitrary,
    impostosTaxas: monetaryValueArbitrary,
    parcelamento: fc.constant(null),
    createdAt: dateArbitrary,
    clientId: fc.string(),
  })

  /**
   * Property 16.1: Correct number of future installments generated
   * Should generate (total - current) installments
   */
  it('should generate the correct number of future installment entries', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento) {
          expect(result).toHaveLength(0)
          return
        }

        const { current, total } = transaction.parcelamento
        const expectedCount = total - current

        expect(result).toHaveLength(expectedCount)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.2: Each installment has correct calculated value
   * Each installment should have value equal to valuePerInstallment
   */
  it('should assign each installment the correct valuePerInstallment', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento) {
          expect(result).toHaveLength(0)
          return
        }

        const { valuePerInstallment } = transaction.parcelamento

        result.forEach((installment) => {
          expect(installment.valor).toBeCloseTo(valuePerInstallment, 10)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.3: Installments distributed across consecutive future months
   * Each installment should be in the next sequential month
   */
  it('should distribute installments across consecutive future months', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento || result.length === 0) {
          return
        }

        const originalDate = new Date(transaction.dataVencimento)

        result.forEach((installment, index) => {
          const installmentDate = new Date(installment.dataVencimento)
          const expectedDate = new Date(originalDate)
          expectedDate.setMonth(expectedDate.getMonth() + index + 1)

          // Compare year and month (day might differ due to month-end handling)
          expect(installmentDate.getFullYear()).toBe(expectedDate.getFullYear())
          expect(installmentDate.getMonth()).toBe(expectedDate.getMonth())
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.4: Sum of all installment values equals total remaining value
   * Sum of generated installments should equal (total - current) * valuePerInstallment
   */
  it('should ensure sum of all installment values equals remaining installment value', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento || result.length === 0) {
          return
        }

        const { current, total, valuePerInstallment } = transaction.parcelamento
        const remainingInstallments = total - current
        const expectedTotal = remainingInstallments * valuePerInstallment

        const actualTotal = result.reduce((sum, installment) => sum + installment.valor, 0)

        expect(actualTotal).toBeCloseTo(expectedTotal, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.5: Transaction type preserved in all installments
   */
  it('should preserve transaction type in all generated installments', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        result.forEach((installment) => {
          expect(installment.tipo).toBe(transaction.tipo)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.6: Transaction status preserved in all installments
   */
  it('should preserve transaction status in all generated installments', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        result.forEach((installment) => {
          expect(installment.status).toBe(transaction.status)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.7: Client ID preserved in all installments
   */
  it('should preserve clientId in all generated installments', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        result.forEach((installment) => {
          expect(installment.clientId).toBe(transaction.clientId)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.8: Taxes preserved in all installments
   */
  it('should preserve impostosTaxas in all generated installments', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        result.forEach((installment) => {
          expect(installment.impostosTaxas).toBe(transaction.impostosTaxas)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.9: Each installment has unique ID
   */
  it('should generate unique IDs for each installment', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        const ids = result.map((installment) => installment.id)
        const uniqueIds = new Set(ids)

        expect(uniqueIds.size).toBe(ids.length)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.10: Each installment has correct parcelamento information
   */
  it('should set correct parcelamento information for each installment', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento || result.length === 0) {
          return
        }

        const { current, total, valuePerInstallment } = transaction.parcelamento

        result.forEach((installment, index) => {
          expect(installment.parcelamento).not.toBeNull()
          expect(installment.parcelamento!.current).toBe(current + index + 1)
          expect(installment.parcelamento!.total).toBe(total)
          expect(installment.parcelamento!.valuePerInstallment).toBeCloseTo(valuePerInstallment, 10)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.11: Description includes installment information
   */
  it('should include installment information in description', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (!transaction.parcelamento || result.length === 0) {
          return
        }

        const { current, total } = transaction.parcelamento

        result.forEach((installment, index) => {
          const expectedInstallmentNumber = current + index + 1
          expect(installment.descricao).toContain(`Parcela ${expectedInstallmentNumber}/${total}`)
          expect(installment.descricao).toContain(transaction.descricao)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.12: Empty result for transaction without parcelamento
   */
  it('should return empty array for transactions without parcelamento', () => {
    fc.assert(
      fc.property(transactionWithoutInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        expect(result).toHaveLength(0)
        expect(Array.isArray(result)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.13: Empty result when current equals total (last installment)
   */
  it('should return empty array when current installment equals total', () => {
    fc.assert(
      fc.property(
        transactionWithInstallmentArbitrary.map((t) => ({
          ...t,
          parcelamento: t.parcelamento
            ? { ...t.parcelamento, current: t.parcelamento.total }
            : null,
        })),
        (transaction) => {
          const result = processInstallments(transaction)

          expect(result).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.14: Empty result when current exceeds total (invalid state)
   */
  it('should return empty array when current exceeds total', () => {
    fc.assert(
      fc.property(
        transactionWithInstallmentArbitrary.map((t) => ({
          ...t,
          parcelamento: t.parcelamento
            ? { ...t.parcelamento, current: t.parcelamento.total + 1 }
            : null,
        })),
        (transaction) => {
          const result = processInstallments(transaction)

          expect(result).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.15: First installment (1/N) generates N-1 future installments
   */
  it('should generate N-1 installments for first installment (1/N)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        monetaryValueArbitrary,
        (total, totalValue) => {
          const transaction: Transaction = {
            id: 'test-1',
            descricao: 'Test Transaction',
            valor: totalValue,
            tipo: 'Entrada',
            status: 'Pendente',
            dataVencimento: new Date('2024-01-15').toISOString(),
            impostosTaxas: 0,
            parcelamento: {
              current: 1,
              total: total,
              valuePerInstallment: totalValue / total,
            },
            createdAt: new Date().toISOString(),
            clientId: 'test-client',
          }

          const result = processInstallments(transaction)

          expect(result).toHaveLength(total - 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.16: Single installment (1/1) generates no future installments
   */
  it('should generate no installments for single installment (1/1)', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, (totalValue) => {
        const transaction: Transaction = {
          id: 'test-1',
          descricao: 'Test Transaction',
          valor: totalValue,
          tipo: 'Entrada',
          status: 'Pago',
          dataVencimento: new Date('2024-01-15').toISOString(),
          impostosTaxas: 0,
          parcelamento: {
            current: 1,
            total: 1,
            valuePerInstallment: totalValue,
          },
          createdAt: new Date().toISOString(),
          clientId: 'test-client',
        }

        const result = processInstallments(transaction)

        expect(result).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.17: Reference date parameter affects filtering (not generation)
   * processInstallments generates all remaining installments regardless of reference date
   */
  it('should generate all remaining installments regardless of reference date', () => {
    fc.assert(
      fc.property(
        transactionWithInstallmentArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (transaction, referenceDate) => {
          const result1 = processInstallments(transaction)
          const result2 = processInstallments(transaction, referenceDate)

          // Both should generate the same number of installments
          expect(result1).toHaveLength(result2.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.18: Installment dates are always in the future relative to original date
   */
  it('should generate installment dates in the future relative to original transaction date', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (result.length === 0) return

        const originalDate = new Date(transaction.dataVencimento)

        result.forEach((installment) => {
          const installmentDate = new Date(installment.dataVencimento)
          expect(installmentDate.getTime()).toBeGreaterThan(originalDate.getTime())
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.19: Installments are ordered chronologically
   */
  it('should generate installments in chronological order', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        if (result.length <= 1) return

        for (let i = 0; i < result.length - 1; i++) {
          const currentDate = new Date(result[i].dataVencimento)
          const nextDate = new Date(result[i + 1].dataVencimento)

          expect(currentDate.getTime()).toBeLessThan(nextDate.getTime())
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.20: Idempotency - calling function multiple times returns same result
   */
  it('should return the same result when called multiple times with same input', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result1 = processInstallments(transaction)
        const result2 = processInstallments(transaction)
        const result3 = processInstallments(transaction)

        expect(result1).toHaveLength(result2.length)
        expect(result2).toHaveLength(result3.length)

        // Compare each installment
        result1.forEach((installment, index) => {
          expect(installment.valor).toBeCloseTo(result2[index].valor, 10)
          expect(installment.dataVencimento).toBe(result2[index].dataVencimento)
          expect(installment.tipo).toBe(result2[index].tipo)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.21: Edge case - handling month-end dates correctly
   */
  it('should handle month-end dates correctly when adding months', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 12 }),
        monetaryValueArbitrary,
        (total, totalValue) => {
          // Test with January 31st - should handle February correctly
          const transaction: Transaction = {
            id: 'test-1',
            descricao: 'Test Transaction',
            valor: totalValue,
            tipo: 'Entrada',
            status: 'Pendente',
            dataVencimento: new Date('2024-01-31').toISOString(),
            impostosTaxas: 0,
            parcelamento: {
              current: 1,
              total: total,
              valuePerInstallment: totalValue / total,
            },
            createdAt: new Date().toISOString(),
            clientId: 'test-client',
          }

          const result = processInstallments(transaction)

          // Should generate installments without errors
          expect(result).toHaveLength(total - 1)

          // Each installment should have a valid date
          result.forEach((installment) => {
            const date = new Date(installment.dataVencimento)
            expect(date.toString()).not.toBe('Invalid Date')
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 16.22: All generated installments are valid Transaction objects
   */
  it('should generate valid Transaction objects with all required fields', () => {
    fc.assert(
      fc.property(transactionWithInstallmentArbitrary, (transaction) => {
        const result = processInstallments(transaction)

        result.forEach((installment) => {
          // Check all required fields exist
          expect(installment.id).toBeDefined()
          expect(typeof installment.id).toBe('string')
          expect(installment.descricao).toBeDefined()
          expect(typeof installment.descricao).toBe('string')
          expect(installment.valor).toBeDefined()
          expect(typeof installment.valor).toBe('number')
          expect(installment.tipo).toBeDefined()
          expect(['Entrada', 'Saída']).toContain(installment.tipo)
          expect(installment.status).toBeDefined()
          expect(['Pago', 'Pendente', 'Atrasado']).toContain(installment.status)
          expect(installment.dataVencimento).toBeDefined()
          expect(typeof installment.dataVencimento).toBe('string')
          expect(installment.impostosTaxas).toBeDefined()
          expect(typeof installment.impostosTaxas).toBe('number')
          expect(installment.createdAt).toBeDefined()
          expect(typeof installment.createdAt).toBe('string')
          expect(installment.clientId).toBeDefined()
          expect(typeof installment.clientId).toBe('string')
        })
      }),
      { numRuns: 100 }
    )
  })
})
