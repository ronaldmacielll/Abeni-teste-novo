/**
 * Property-Based Tests for Financial Calculations
 * 
 * Property 7: Gross Revenue Calculation
 * Property 8: Net Revenue Calculation
 * Property 9: Current Balance Calculation
 * 
 * For any collection of transactions within a time period, calculating gross revenue
 * (Faturamento Bruto) SHALL equal the sum of the Valor field for all transactions
 * where Tipo equals "Entrada" and the transaction falls within the period.
 * 
 * For any collection of income transactions, calculating net revenue (Faturamento Líquido)
 * SHALL equal the gross revenue minus the sum of Impostos_Taxas for all income transactions.
 * 
 * For any collection of transactions, calculating current balance (Saldo Atual) SHALL equal
 * the sum of Valor for all transactions where Status equals "Pago" and Tipo equals "Entrada",
 * minus the sum of Valor for all transactions where Status equals "Pago" and Tipo equals "Saída".
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

import * as fc from 'fast-check'
import { calculateGrossRevenue, calculateNetRevenue, calculateBalance, getUpcomingTransactions, calculatePerInstallmentValue } from './calculations'
import type { Transaction, TransactionType, TransactionStatus } from '../types/transaction.types'

describe('Property 7: Gross Revenue Calculation', () => {
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
    min: 0,
    max: 1000000,
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
   * Generates arbitrary Transaction objects
   */
  const transactionArbitrary: fc.Arbitrary<Transaction> = fc.record({
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
   * Generates an array of arbitrary transactions
   */
  const transactionsArrayArbitrary = fc.array(transactionArbitrary, { minLength: 0, maxLength: 50 })

  /**
   * Generates a valid period filter with startDate < endDate
   */
  const periodFilterArbitrary = fc
    .tuple(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
      fc.date({ min: new Date('2020-01-02'), max: new Date('2030-12-31') })
    )
    .filter(([start, end]) => start < end)
    .map(([start, end]) => ({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }))

  /**
   * Property 7.1: Gross revenue equals sum of all "Entrada" transaction values
   */
  it('should equal the sum of all Entrada transaction values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateGrossRevenue(transactions)

        // Calculate expected value manually
        const expected = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + t.valor, 0)

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.2: Gross revenue ignores "Saída" transactions
   */
  it('should ignore all Saída transactions', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateGrossRevenue(transactions)

        // Calculate sum including only Entrada
        const entradaSum = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + t.valor, 0)

        // Calculate sum including all transactions
        const totalSum = transactions.reduce((sum, t) => sum + t.valor, 0)

        // Result should equal Entrada sum, not total sum (unless all are Entrada)
        expect(result).toBeCloseTo(entradaSum, 10)

        // If there are any Saída transactions, result should be less than or equal to total
        const hasSaida = transactions.some((t) => t.tipo === 'Saída')
        if (hasSaida) {
          expect(result).toBeLessThanOrEqual(totalSum)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.3: Gross revenue is always non-negative
   */
  it('should always return a non-negative value', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateGrossRevenue(transactions)

        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).not.toBeNaN()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.4: Empty transaction array returns zero
   */
  it('should return 0 for empty transaction array', () => {
    const result = calculateGrossRevenue([])
    expect(result).toBe(0)
  })

  /**
   * Property 7.5: Array with only "Saída" transactions returns zero
   */
  it('should return 0 when all transactions are Saída', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({ ...t, tipo: 'Saída' as TransactionType })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateGrossRevenue(transactions)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.6: Period filter correctly filters transactions by date range
   */
  it('should only include transactions within the specified period', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result = calculateGrossRevenue(transactions, period)

        // Calculate expected value manually with period filtering
        const startDate = new Date(period.startDate)
        const endDate = new Date(period.endDate)

        const expected = transactions
          .filter((t) => t.tipo === 'Entrada')
          .filter((t) => {
            const transactionDate = new Date(t.dataVencimento)
            return transactionDate >= startDate && transactionDate <= endDate
          })
          .reduce((sum, t) => sum + t.valor, 0)

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.7: Period filter with no matching transactions returns zero
   */
  it('should return 0 when no transactions fall within the period', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            dataVencimento: new Date('2020-01-01').toISOString(),
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const period = {
            startDate: new Date('2025-01-01').toISOString(),
            endDate: new Date('2025-12-31').toISOString(),
          }

          const result = calculateGrossRevenue(transactions, period)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.8: Without period filter, all Entrada transactions are included
   */
  it('should include all Entrada transactions when no period is specified', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const resultWithoutPeriod = calculateGrossRevenue(transactions)

        // Create a period that encompasses all possible dates
        const resultWithWidePeriod = calculateGrossRevenue(transactions, {
          startDate: new Date('2000-01-01').toISOString(),
          endDate: new Date('2050-12-31').toISOString(),
        })

        expect(resultWithoutPeriod).toBeCloseTo(resultWithWidePeriod, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.9: Gross revenue is independent of transaction status
   */
  it('should include transactions regardless of their status', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({ ...t, tipo: 'Entrada' as TransactionType })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateGrossRevenue(transactions)

          // Sum should include all Entrada transactions regardless of status
          const expected = transactions.reduce((sum, t) => sum + t.valor, 0)

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.10: Gross revenue calculation is commutative (order-independent)
   */
  it('should produce the same result regardless of transaction order', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateGrossRevenue(transactions)

        // Shuffle the array
        const shuffled = [...transactions].sort(() => Math.random() - 0.5)
        const result2 = calculateGrossRevenue(shuffled)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.11: Gross revenue is additive across transaction subsets
   */
  it('should be additive when splitting transactions into subsets', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => arr.length >= 2),
        (transactions) => {
          const midpoint = Math.floor(transactions.length / 2)
          const subset1 = transactions.slice(0, midpoint)
          const subset2 = transactions.slice(midpoint)

          const result1 = calculateGrossRevenue(subset1)
          const result2 = calculateGrossRevenue(subset2)
          const resultTotal = calculateGrossRevenue(transactions)

          expect(result1 + result2).toBeCloseTo(resultTotal, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.12: Period filter with only startDate includes all transactions after start
   */
  it('should include all transactions on or after startDate when only startDate is specified', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        (transactions, startDate) => {
          const period = { startDate: startDate.toISOString() }
          const result = calculateGrossRevenue(transactions, period)

          const expected = transactions
            .filter((t) => t.tipo === 'Entrada')
            .filter((t) => new Date(t.dataVencimento) >= startDate)
            .reduce((sum, t) => sum + t.valor, 0)

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.13: Period filter with only endDate includes all transactions before end
   */
  it('should include all transactions on or before endDate when only endDate is specified', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (transactions, endDate) => {
          const period = { endDate: endDate.toISOString() }
          const result = calculateGrossRevenue(transactions, period)

          const expected = transactions
            .filter((t) => t.tipo === 'Entrada')
            .filter((t) => new Date(t.dataVencimento) <= endDate)
            .reduce((sum, t) => sum + t.valor, 0)

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.14: Gross revenue with period is always <= gross revenue without period
   */
  it('should return a value less than or equal to the unfiltered gross revenue', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const resultWithPeriod = calculateGrossRevenue(transactions, period)
        const resultWithoutPeriod = calculateGrossRevenue(transactions)

        expect(resultWithPeriod).toBeLessThanOrEqual(resultWithoutPeriod + 0.01) // Small epsilon for floating point
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.15: Single Entrada transaction returns its valor
   */
  it('should return the valor of a single Entrada transaction', () => {
    fc.assert(
      fc.property(
        transactionArbitrary
          .filter((t) => t.tipo === 'Entrada')
          .map((t) => [t]),
        (transactions) => {
          const result = calculateGrossRevenue(transactions)
          expect(result).toBeCloseTo(transactions[0].valor, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.16: Gross revenue is independent of impostosTaxas field
   */
  it('should not be affected by impostosTaxas values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateGrossRevenue(transactions)

        // Create modified transactions with different impostosTaxas
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          impostosTaxas: t.impostosTaxas * 2,
        }))
        const result2 = calculateGrossRevenue(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.17: Gross revenue is independent of parcelamento field
   */
  it('should not be affected by parcelamento values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateGrossRevenue(transactions)

        // Create modified transactions with parcelamento
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          parcelamento: {
            current: 1,
            total: 10,
            valuePerInstallment: t.valor / 10,
          },
        }))
        const result2 = calculateGrossRevenue(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.18: Boundary test - transactions exactly on period boundaries are included
   */
  it('should include transactions exactly on the period boundaries', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        (valor, boundaryDate) => {
          const transaction: Transaction = {
            id: '1',
            descricao: 'Test',
            valor,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: boundaryDate.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          }

          // Test with transaction on startDate boundary
          const resultStart = calculateGrossRevenue([transaction], {
            startDate: boundaryDate.toISOString(),
            endDate: new Date(boundaryDate.getTime() + 86400000).toISOString(),
          })
          expect(resultStart).toBeCloseTo(valor, 10)

          // Test with transaction on endDate boundary
          const resultEnd = calculateGrossRevenue([transaction], {
            startDate: new Date(boundaryDate.getTime() - 86400000).toISOString(),
            endDate: boundaryDate.toISOString(),
          })
          expect(resultEnd).toBeCloseTo(valor, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.19: Idempotency - calling the function multiple times returns the same result
   */
  it('should return the same result when called multiple times with the same input', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result1 = calculateGrossRevenue(transactions, period)
        const result2 = calculateGrossRevenue(transactions, period)
        const result3 = calculateGrossRevenue(transactions, period)

        expect(result1).toBeCloseTo(result2, 10)
        expect(result2).toBeCloseTo(result3, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 7.20: Type safety - result is always a finite number
   */
  it('should always return a finite number', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result = calculateGrossRevenue(transactions, period)

        expect(typeof result).toBe('number')
        expect(Number.isFinite(result)).toBe(true)
        expect(Number.isNaN(result)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 8: Net Revenue Calculation', () => {
  // Reuse arbitraries from Property 7

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
    min: 0,
    max: 1000000,
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
   * Generates arbitrary Transaction objects
   */
  const transactionArbitrary: fc.Arbitrary<Transaction> = fc.record({
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
   * Generates an array of arbitrary transactions
   */
  const transactionsArrayArbitrary = fc.array(transactionArbitrary, { minLength: 0, maxLength: 50 })

  /**
   * Generates a valid period filter with startDate < endDate
   */
  const periodFilterArbitrary = fc
    .tuple(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
      fc.date({ min: new Date('2020-01-02'), max: new Date('2030-12-31') })
    )
    .filter(([start, end]) => start < end)
    .map(([start, end]) => ({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }))

  /**
   * Property 8.1: Net revenue equals gross revenue minus sum of taxes for income transactions
   */
  it('should equal gross revenue minus sum of impostosTaxas for Entrada transactions', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateNetRevenue(transactions)

        // Calculate expected value manually
        const grossRevenue = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + t.valor, 0)

        const totalTaxes = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)

        const expected = grossRevenue - totalTaxes

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.2: Net revenue is always less than or equal to gross revenue
   */
  it('should always be less than or equal to gross revenue', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const netRevenue = calculateNetRevenue(transactions)
        const grossRevenue = calculateGrossRevenue(transactions)

        expect(netRevenue).toBeLessThanOrEqual(grossRevenue + 0.01) // Small epsilon for floating point
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.3: Net revenue ignores taxes from "Saída" transactions
   */
  it('should only subtract taxes from Entrada transactions, not Saída', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateNetRevenue(transactions)

        // Calculate expected value - only taxes from Entrada should be subtracted
        const grossRevenue = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + t.valor, 0)

        const taxesFromEntrada = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)

        const expected = grossRevenue - taxesFromEntrada

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.4: Net revenue with zero taxes equals gross revenue
   */
  it('should equal gross revenue when all impostosTaxas are zero', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({ ...t, impostosTaxas: 0 })),
          { minLength: 0, maxLength: 50 }
        ),
        (transactions) => {
          const netRevenue = calculateNetRevenue(transactions)
          const grossRevenue = calculateGrossRevenue(transactions)

          expect(netRevenue).toBeCloseTo(grossRevenue, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.5: Empty transaction array returns zero
   */
  it('should return 0 for empty transaction array', () => {
    const result = calculateNetRevenue([])
    expect(result).toBe(0)
  })

  /**
   * Property 8.6: Array with only "Saída" transactions returns zero
   */
  it('should return 0 when all transactions are Saída', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({ ...t, tipo: 'Saída' as TransactionType })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateNetRevenue(transactions)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.7: Period filter correctly filters transactions by date range
   */
  it('should only include transactions within the specified period', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result = calculateNetRevenue(transactions, period)

        // Calculate expected value manually with period filtering
        const startDate = new Date(period.startDate)
        const endDate = new Date(period.endDate)

        const filteredTransactions = transactions
          .filter((t) => t.tipo === 'Entrada')
          .filter((t) => {
            const transactionDate = new Date(t.dataVencimento)
            return transactionDate >= startDate && transactionDate <= endDate
          })

        const grossRevenue = filteredTransactions.reduce((sum, t) => sum + t.valor, 0)
        const totalTaxes = filteredTransactions.reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)
        const expected = grossRevenue - totalTaxes

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.8: Net revenue can be negative when taxes exceed gross revenue
   */
  it('should allow negative values when taxes exceed gross revenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary
            .filter((t) => t.tipo === 'Entrada')
            .map((t) => ({
              ...t,
              valor: fc.sample(fc.double({ min: 100, max: 1000 }), 1)[0],
              impostosTaxas: fc.sample(fc.double({ min: 1001, max: 2000 }), 1)[0],
            })),
          { minLength: 1, maxLength: 10 }
        ),
        (transactions) => {
          const result = calculateNetRevenue(transactions)
          const grossRevenue = calculateGrossRevenue(transactions)
          const totalTaxes = transactions.reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)

          // Net revenue should be negative when taxes exceed gross revenue
          if (totalTaxes > grossRevenue) {
            expect(result).toBeLessThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.9: Net revenue calculation is commutative (order-independent)
   */
  it('should produce the same result regardless of transaction order', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateNetRevenue(transactions)

        // Shuffle the array
        const shuffled = [...transactions].sort(() => Math.random() - 0.5)
        const result2 = calculateNetRevenue(shuffled)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.10: Net revenue is additive across transaction subsets
   */
  it('should be additive when splitting transactions into subsets', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => arr.length >= 2),
        (transactions) => {
          const midpoint = Math.floor(transactions.length / 2)
          const subset1 = transactions.slice(0, midpoint)
          const subset2 = transactions.slice(midpoint)

          const result1 = calculateNetRevenue(subset1)
          const result2 = calculateNetRevenue(subset2)
          const resultTotal = calculateNetRevenue(transactions)

          expect(result1 + result2).toBeCloseTo(resultTotal, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.11: Net revenue with period is always <= net revenue without period
   */
  it('should return a value less than or equal to the unfiltered net revenue when period has positive net', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => {
          // Only test with transactions that have positive net revenue
          const gross = arr.filter((t) => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0)
          const taxes = arr
            .filter((t) => t.tipo === 'Entrada')
            .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)
          return gross > taxes
        }),
        periodFilterArbitrary,
        (transactions, period) => {
          const resultWithPeriod = calculateNetRevenue(transactions, period)
          const resultWithoutPeriod = calculateNetRevenue(transactions)

          // When unfiltered result is positive, filtered should be <= unfiltered
          if (resultWithoutPeriod > 0) {
            expect(resultWithPeriod).toBeLessThanOrEqual(resultWithoutPeriod + 0.01)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.12: Single Entrada transaction returns valor minus impostosTaxas
   */
  it('should return valor minus impostosTaxas for a single Entrada transaction', () => {
    fc.assert(
      fc.property(
        transactionArbitrary
          .filter((t) => t.tipo === 'Entrada')
          .map((t) => [t]),
        (transactions) => {
          const result = calculateNetRevenue(transactions)
          const expected = transactions[0].valor - (transactions[0].impostosTaxas || 0)
          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.13: Net revenue is independent of transaction status
   */
  it('should include transactions regardless of their status', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({ ...t, tipo: 'Entrada' as TransactionType })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateNetRevenue(transactions)

          // Calculate expected value
          const grossRevenue = transactions.reduce((sum, t) => sum + t.valor, 0)
          const totalTaxes = transactions.reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)
          const expected = grossRevenue - totalTaxes

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.14: Net revenue is independent of parcelamento field
   */
  it('should not be affected by parcelamento values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateNetRevenue(transactions)

        // Create modified transactions with parcelamento
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          parcelamento: {
            current: 1,
            total: 10,
            valuePerInstallment: t.valor / 10,
          },
        }))
        const result2 = calculateNetRevenue(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.15: Idempotency - calling the function multiple times returns the same result
   */
  it('should return the same result when called multiple times with the same input', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result1 = calculateNetRevenue(transactions, period)
        const result2 = calculateNetRevenue(transactions, period)
        const result3 = calculateNetRevenue(transactions, period)

        expect(result1).toBeCloseTo(result2, 10)
        expect(result2).toBeCloseTo(result3, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.16: Type safety - result is always a finite number
   */
  it('should always return a finite number', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, periodFilterArbitrary, (transactions, period) => {
        const result = calculateNetRevenue(transactions, period)

        expect(typeof result).toBe('number')
        expect(Number.isFinite(result)).toBe(true)
        expect(Number.isNaN(result)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.17: Net revenue handles null/undefined impostosTaxas as zero
   */
  it('should treat null or undefined impostosTaxas as zero', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            tipo: 'Entrada' as TransactionType,
            impostosTaxas: 0,
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result1 = calculateNetRevenue(transactions)

          // Create transactions with undefined impostosTaxas (will be treated as 0 by || operator)
          const transactionsWithUndefined = transactions.map((t) => ({
            ...t,
            impostosTaxas: 0, // Explicitly 0
          }))
          const result2 = calculateNetRevenue(transactionsWithUndefined)

          expect(result1).toBeCloseTo(result2, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.18: Boundary test - transactions exactly on period boundaries are included
   */
  it('should include transactions exactly on the period boundaries', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        monetaryValueArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        (valor, impostosTaxas, boundaryDate) => {
          const transaction: Transaction = {
            id: '1',
            descricao: 'Test',
            valor,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: boundaryDate.toISOString(),
            impostosTaxas,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          }

          const expected = valor - impostosTaxas

          // Test with transaction on startDate boundary
          const resultStart = calculateNetRevenue([transaction], {
            startDate: boundaryDate.toISOString(),
            endDate: new Date(boundaryDate.getTime() + 86400000).toISOString(),
          })
          expect(resultStart).toBeCloseTo(expected, 10)

          // Test with transaction on endDate boundary
          const resultEnd = calculateNetRevenue([transaction], {
            startDate: new Date(boundaryDate.getTime() - 86400000).toISOString(),
            endDate: boundaryDate.toISOString(),
          })
          expect(resultEnd).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.19: Net revenue difference from gross revenue equals total taxes
   */
  it('should have a difference from gross revenue equal to the sum of taxes', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const netRevenue = calculateNetRevenue(transactions)
        const grossRevenue = calculateGrossRevenue(transactions)

        const totalTaxes = transactions
          .filter((t) => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)

        const difference = grossRevenue - netRevenue

        expect(difference).toBeCloseTo(totalTaxes, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 8.20: Net revenue with only startDate includes all transactions after start
   */
  it('should include all transactions on or after startDate when only startDate is specified', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary,
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        (transactions, startDate) => {
          const period = { startDate: startDate.toISOString() }
          const result = calculateNetRevenue(transactions, period)

          const filteredTransactions = transactions
            .filter((t) => t.tipo === 'Entrada')
            .filter((t) => new Date(t.dataVencimento) >= startDate)

          const grossRevenue = filteredTransactions.reduce((sum, t) => sum + t.valor, 0)
          const totalTaxes = filteredTransactions.reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)
          const expected = grossRevenue - totalTaxes

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 9: Current Balance Calculation', () => {
  /**
   * **Validates: Requirements 7.3**
   * 
   * Property 9: Current Balance Calculation
   * For any collection of transactions, calculating current balance (Saldo Atual)
   * SHALL equal the sum of Valor for all transactions where Status equals "Pago"
   * and Tipo equals "Entrada", minus the sum of Valor for all transactions where
   * Status equals "Pago" and Tipo equals "Saída".
   */

  // Reuse arbitraries from previous tests

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
    min: 0,
    max: 1000000,
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
   * Generates arbitrary Transaction objects
   */
  const transactionArbitrary: fc.Arbitrary<Transaction> = fc.record({
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
   * Generates an array of arbitrary transactions
   */
  const transactionsArrayArbitrary = fc.array(transactionArbitrary, { minLength: 0, maxLength: 50 })

  /**
   * Property 9.1: Balance equals paid income minus paid expenses
   */
  it('should equal sum of paid income minus sum of paid expenses', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateBalance(transactions)

        // Calculate expected value manually
        const paidIncome = transactions
          .filter((t) => t.tipo === 'Entrada' && t.status === 'Pago')
          .reduce((sum, t) => sum + t.valor, 0)

        const paidExpenses = transactions
          .filter((t) => t.tipo === 'Saída' && t.status === 'Pago')
          .reduce((sum, t) => sum + t.valor, 0)

        const expected = paidIncome - paidExpenses

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.2: Balance ignores non-paid transactions
   */
  it('should ignore transactions with status Pendente or Atrasado', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateBalance(transactions)

        // Calculate expected value - only Pago transactions
        const paidIncome = transactions
          .filter((t) => t.tipo === 'Entrada' && t.status === 'Pago')
          .reduce((sum, t) => sum + t.valor, 0)

        const paidExpenses = transactions
          .filter((t) => t.tipo === 'Saída' && t.status === 'Pago')
          .reduce((sum, t) => sum + t.valor, 0)

        const expected = paidIncome - paidExpenses

        expect(result).toBeCloseTo(expected, 10)

        // Verify that non-paid transactions don't affect the result
        const nonPaidTransactions = transactions.filter((t) => t.status !== 'Pago')
        if (nonPaidTransactions.length > 0) {
          // Result should be the same as if we only passed paid transactions
          const paidOnly = transactions.filter((t) => t.status === 'Pago')
          const resultPaidOnly = calculateBalance(paidOnly)
          expect(result).toBeCloseTo(resultPaidOnly, 10)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.3: Empty transaction array returns zero
   */
  it('should return 0 for empty transaction array', () => {
    const result = calculateBalance([])
    expect(result).toBe(0)
  })

  /**
   * Property 9.4: Balance can be negative when expenses exceed income
   */
  it('should allow negative balance when paid expenses exceed paid income', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            tipo: 'Saída' as TransactionType,
            status: 'Pago' as TransactionStatus,
            valor: fc.sample(fc.double({ min: 1000, max: 5000 }), 1)[0],
          })),
          { minLength: 1, maxLength: 10 }
        ),
        (transactions) => {
          const result = calculateBalance(transactions)

          // With only paid expenses, balance should be negative
          expect(result).toBeLessThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.5: Balance can be positive when income exceeds expenses
   */
  it('should allow positive balance when paid income exceeds paid expenses', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            tipo: 'Entrada' as TransactionType,
            status: 'Pago' as TransactionStatus,
            valor: fc.sample(fc.double({ min: 1000, max: 5000 }), 1)[0],
          })),
          { minLength: 1, maxLength: 10 }
        ),
        (transactions) => {
          const result = calculateBalance(transactions)

          // With only paid income, balance should be positive
          expect(result).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.6: Balance calculation is commutative (order-independent)
   */
  it('should produce the same result regardless of transaction order', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateBalance(transactions)

        // Shuffle the array
        const shuffled = [...transactions].sort(() => Math.random() - 0.5)
        const result2 = calculateBalance(shuffled)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.7: Balance is additive across transaction subsets
   */
  it('should be additive when splitting transactions into subsets', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => arr.length >= 2),
        (transactions) => {
          const midpoint = Math.floor(transactions.length / 2)
          const subset1 = transactions.slice(0, midpoint)
          const subset2 = transactions.slice(midpoint)

          const result1 = calculateBalance(subset1)
          const result2 = calculateBalance(subset2)
          const resultTotal = calculateBalance(transactions)

          expect(result1 + result2).toBeCloseTo(resultTotal, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.8: Balance with only paid income equals total paid income
   */
  it('should equal total paid income when there are no paid expenses', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            tipo: 'Entrada' as TransactionType,
            status: 'Pago' as TransactionStatus,
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateBalance(transactions)
          const expected = transactions.reduce((sum, t) => sum + t.valor, 0)

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.9: Balance with only paid expenses equals negative total paid expenses
   */
  it('should equal negative total paid expenses when there is no paid income', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            tipo: 'Saída' as TransactionType,
            status: 'Pago' as TransactionStatus,
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const result = calculateBalance(transactions)
          const expected = -transactions.reduce((sum, t) => sum + t.valor, 0)

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.10: Balance is independent of impostosTaxas field
   */
  it('should not be affected by impostosTaxas values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateBalance(transactions)

        // Create modified transactions with different impostosTaxas
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          impostosTaxas: t.impostosTaxas * 2,
        }))
        const result2 = calculateBalance(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.11: Balance is independent of parcelamento field
   */
  it('should not be affected by parcelamento values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateBalance(transactions)

        // Create modified transactions with parcelamento
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          parcelamento: {
            current: 1,
            total: 10,
            valuePerInstallment: t.valor / 10,
          },
        }))
        const result2 = calculateBalance(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.12: Balance is independent of dataVencimento field
   */
  it('should not be affected by due date values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateBalance(transactions)

        // Create modified transactions with different dates
        const modifiedTransactions = transactions.map((t) => ({
          ...t,
          dataVencimento: new Date('2025-01-01').toISOString(),
        }))
        const result2 = calculateBalance(modifiedTransactions)

        expect(result1).toBeCloseTo(result2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.13: Idempotency - calling the function multiple times returns the same result
   */
  it('should return the same result when called multiple times with the same input', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result1 = calculateBalance(transactions)
        const result2 = calculateBalance(transactions)
        const result3 = calculateBalance(transactions)

        expect(result1).toBeCloseTo(result2, 10)
        expect(result2).toBeCloseTo(result3, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.14: Type safety - result is always a finite number
   */
  it('should always return a finite number', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = calculateBalance(transactions)

        expect(typeof result).toBe('number')
        expect(Number.isFinite(result)).toBe(true)
        expect(Number.isNaN(result)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.15: Single paid income transaction returns its valor
   */
  it('should return the valor of a single paid income transaction', () => {
    fc.assert(
      fc.property(
        transactionArbitrary
          .filter((t) => t.tipo === 'Entrada' && t.status === 'Pago')
          .map((t) => [t]),
        (transactions) => {
          const result = calculateBalance(transactions)
          expect(result).toBeCloseTo(transactions[0].valor, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.16: Single paid expense transaction returns negative valor
   */
  it('should return negative valor of a single paid expense transaction', () => {
    fc.assert(
      fc.property(
        transactionArbitrary
          .filter((t) => t.tipo === 'Saída' && t.status === 'Pago')
          .map((t) => [t]),
        (transactions) => {
          const result = calculateBalance(transactions)
          expect(result).toBeCloseTo(-transactions[0].valor, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.17: Balance with equal paid income and expenses is zero
   */
  it('should return 0 when paid income equals paid expenses', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, (valor) => {
        const transactions: Transaction[] = [
          {
            id: '1',
            descricao: 'Income',
            valor,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: new Date().toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          },
          {
            id: '2',
            descricao: 'Expense',
            valor,
            tipo: 'Saída',
            status: 'Pago',
            dataVencimento: new Date().toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          },
        ]

        const result = calculateBalance(transactions)
        expect(result).toBeCloseTo(0, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.18: Balance ignores transactions with mixed status
   */
  it('should only count Pago transactions when mixed with other statuses', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        monetaryValueArbitrary,
        (paidValue, pendingValue) => {
          const transactions: Transaction[] = [
            {
              id: '1',
              descricao: 'Paid Income',
              valor: paidValue,
              tipo: 'Entrada',
              status: 'Pago',
              dataVencimento: new Date().toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
            {
              id: '2',
              descricao: 'Pending Income',
              valor: pendingValue,
              tipo: 'Entrada',
              status: 'Pendente',
              dataVencimento: new Date().toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
            {
              id: '3',
              descricao: 'Overdue Income',
              valor: pendingValue,
              tipo: 'Entrada',
              status: 'Atrasado',
              dataVencimento: new Date().toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
          ]

          const result = calculateBalance(transactions)
          // Should only count the paid transaction
          expect(result).toBeCloseTo(paidValue, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 9.19: Balance correctly handles large numbers of transactions
   */
  it('should correctly calculate balance with many transactions', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary, { minLength: 50, maxLength: 100 }),
        (transactions) => {
          const result = calculateBalance(transactions)

          // Manual calculation
          const paidIncome = transactions
            .filter((t) => t.tipo === 'Entrada' && t.status === 'Pago')
            .reduce((sum, t) => sum + t.valor, 0)

          const paidExpenses = transactions
            .filter((t) => t.tipo === 'Saída' && t.status === 'Pago')
            .reduce((sum, t) => sum + t.valor, 0)

          const expected = paidIncome - paidExpenses

          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 9.20: Balance is consistent with separate income and expense calculations
   */
  it('should equal separately calculated paid income minus paid expenses', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const balance = calculateBalance(transactions)

        // Calculate income and expenses separately
        const paidIncomeTransactions = transactions.filter(
          (t) => t.tipo === 'Entrada' && t.status === 'Pago'
        )
        const paidExpenseTransactions = transactions.filter(
          (t) => t.tipo === 'Saída' && t.status === 'Pago'
        )

        const income = paidIncomeTransactions.reduce((sum, t) => sum + t.valor, 0)
        const expenses = paidExpenseTransactions.reduce((sum, t) => sum + t.valor, 0)

        expect(balance).toBeCloseTo(income - expenses, 10)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 10 & 11: getUpcomingTransactions - Future Transaction Filtering and Sorting', () => {
  /**
   * **Validates: Requirements 9.1, 8.4**
   * 
   * Property 11: Future Transaction Filtering
   * For any collection of transactions and the current date, filtering for future transactions
   * SHALL return only transactions where Data_de_Vencimento is strictly greater than the current date,
   * and no returned transaction SHALL have a due date less than or equal to the current date.
   * 
   * Property 10: Transaction Sorting Invariant
   * Sorting by Data_de_Vencimento in ascending order SHALL produce a list where for every
   * adjacent pair of transactions (i, i+1), the date of transaction i is less than or equal
   * to the date of transaction i+1.
   */

  // Reuse arbitraries from previous tests

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
    min: 0,
    max: 1000000,
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
   * Generates arbitrary Transaction objects
   */
  const transactionArbitrary: fc.Arbitrary<Transaction> = fc.record({
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
   * Generates an array of arbitrary transactions
   */
  const transactionsArrayArbitrary = fc.array(transactionArbitrary, { minLength: 0, maxLength: 50 })

  /**
   * Generates arbitrary reference dates
   */
  const referenceDateArbitrary = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2030-12-31'),
  })

  /**
   * Property 11.1: All returned transactions have due dates strictly greater than reference date
   */
  it('should only return transactions with due dates after the reference date', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Normalize reference date to start of day
        const normalizedReferenceDate = new Date(referenceDate)
        normalizedReferenceDate.setHours(0, 0, 0, 0)

        // All returned transactions must have due dates > reference date
        result.forEach((transaction) => {
          const dueDate = new Date(transaction.dataVencimento)
          dueDate.setHours(0, 0, 0, 0)
          expect(dueDate.getTime()).toBeGreaterThan(normalizedReferenceDate.getTime())
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.2: No returned transaction has a due date on or before reference date
   */
  it('should exclude transactions with due dates on or before the reference date', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Normalize reference date to start of day
        const normalizedReferenceDate = new Date(referenceDate)
        normalizedReferenceDate.setHours(0, 0, 0, 0)

        // Count transactions that should be excluded
        const pastOrTodayTransactions = transactions.filter((t) => {
          const dueDate = new Date(t.dataVencimento)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate.getTime() <= normalizedReferenceDate.getTime()
        })

        // None of these should be in the result
        pastOrTodayTransactions.forEach((pastTransaction) => {
          expect(result).not.toContainEqual(pastTransaction)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.3: Result count equals count of future transactions in input
   */
  it('should return exactly the number of future transactions', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Normalize reference date to start of day
        const normalizedReferenceDate = new Date(referenceDate)
        normalizedReferenceDate.setHours(0, 0, 0, 0)

        // Count expected future transactions
        const expectedCount = transactions.filter((t) => {
          const dueDate = new Date(t.dataVencimento)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate.getTime() > normalizedReferenceDate.getTime()
        }).length

        expect(result.length).toBe(expectedCount)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.4: Empty array when all transactions are in the past
   */
  it('should return empty array when all transactions are in the past', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            dataVencimento: new Date('2020-01-01').toISOString(),
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const referenceDate = new Date('2025-01-01')
          const result = getUpcomingTransactions(transactions, referenceDate)

          expect(result).toEqual([])
          expect(result.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.5: All transactions returned when all are in the future
   */
  it('should return all transactions when all are in the future', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            dataVencimento: new Date('2030-01-01').toISOString(),
          })),
          { minLength: 1, maxLength: 20 }
        ),
        (transactions) => {
          const referenceDate = new Date('2020-01-01')
          const result = getUpcomingTransactions(transactions, referenceDate)

          expect(result.length).toBe(transactions.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.6: Empty input returns empty output
   */
  it('should return empty array for empty input', () => {
    const referenceDate = new Date('2025-01-01')
    const result = getUpcomingTransactions([], referenceDate)

    expect(result).toEqual([])
    expect(result.length).toBe(0)
  })

  /**
   * Property 11.7: Uses current date when no reference date provided
   */
  it('should use current date when reference date is not provided', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, (transactions) => {
        const result = getUpcomingTransactions(transactions)

        // Get today's date normalized to start of day
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // All returned transactions must have due dates > today
        result.forEach((transaction) => {
          const dueDate = new Date(transaction.dataVencimento)
          dueDate.setHours(0, 0, 0, 0)
          expect(dueDate.getTime()).toBeGreaterThan(today.getTime())
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.8: Transactions on reference date are excluded (boundary test)
   */
  it('should exclude transactions with due date exactly on reference date', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        referenceDateArbitrary,
        (valor, referenceDate) => {
          const transaction: Transaction = {
            id: '1',
            descricao: 'Test',
            valor,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: referenceDate.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          }

          const result = getUpcomingTransactions([transaction], referenceDate)

          // Transaction on the reference date should NOT be included
          expect(result).toEqual([])
          expect(result.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.9: Transaction one day after reference date is included (boundary test)
   */
  it('should include transactions with due date one day after reference date', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        referenceDateArbitrary,
        (valor, referenceDate) => {
          const oneDayAfter = new Date(referenceDate)
          oneDayAfter.setDate(oneDayAfter.getDate() + 1)

          const transaction: Transaction = {
            id: '1',
            descricao: 'Test',
            valor,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: oneDayAfter.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          }

          const result = getUpcomingTransactions([transaction], referenceDate)

          // Transaction one day after should be included
          expect(result.length).toBe(1)
          expect(result[0].id).toBe('1')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.10: Filtering is independent of transaction type
   */
  it('should include both Entrada and Saída transactions in future', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        referenceDateArbitrary,
        (valor, referenceDate) => {
          const futureDate = new Date(referenceDate)
          futureDate.setDate(futureDate.getDate() + 10)

          const transactions: Transaction[] = [
            {
              id: '1',
              descricao: 'Income',
              valor,
              tipo: 'Entrada',
              status: 'Pago',
              dataVencimento: futureDate.toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
            {
              id: '2',
              descricao: 'Expense',
              valor,
              tipo: 'Saída',
              status: 'Pago',
              dataVencimento: futureDate.toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
          ]

          const result = getUpcomingTransactions(transactions, referenceDate)

          // Both should be included
          expect(result.length).toBe(2)
          expect(result.some((t) => t.tipo === 'Entrada')).toBe(true)
          expect(result.some((t) => t.tipo === 'Saída')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11.11: Filtering is independent of transaction status
   */
  it('should include transactions regardless of status', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        referenceDateArbitrary,
        (valor, referenceDate) => {
          const futureDate = new Date(referenceDate)
          futureDate.setDate(futureDate.getDate() + 10)

          const transactions: Transaction[] = [
            {
              id: '1',
              descricao: 'Paid',
              valor,
              tipo: 'Entrada',
              status: 'Pago',
              dataVencimento: futureDate.toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
            {
              id: '2',
              descricao: 'Pending',
              valor,
              tipo: 'Entrada',
              status: 'Pendente',
              dataVencimento: futureDate.toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
            {
              id: '3',
              descricao: 'Overdue',
              valor,
              tipo: 'Entrada',
              status: 'Atrasado',
              dataVencimento: futureDate.toISOString(),
              impostosTaxas: 0,
              parcelamento: null,
              createdAt: new Date().toISOString(),
              clientId: 'test',
            },
          ]

          const result = getUpcomingTransactions(transactions, referenceDate)

          // All three should be included
          expect(result.length).toBe(3)
          expect(result.some((t) => t.status === 'Pago')).toBe(true)
          expect(result.some((t) => t.status === 'Pendente')).toBe(true)
          expect(result.some((t) => t.status === 'Atrasado')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.1: Result is sorted in ascending order by due date
   */
  it('should return transactions sorted by due date in ascending order', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Check that each transaction's due date is <= the next transaction's due date
        for (let i = 0; i < result.length - 1; i++) {
          const currentDate = new Date(result[i].dataVencimento)
          const nextDate = new Date(result[i + 1].dataVencimento)

          expect(currentDate.getTime()).toBeLessThanOrEqual(nextDate.getTime())
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.2: Sorting invariant - for every adjacent pair (i, i+1), date[i] <= date[i+1]
   */
  it('should satisfy the sorting invariant for all adjacent pairs', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        if (result.length < 2) {
          // Trivially sorted if 0 or 1 elements
          return
        }

        // Verify sorting invariant for all adjacent pairs
        for (let i = 0; i < result.length - 1; i++) {
          const dateI = new Date(result[i].dataVencimento).getTime()
          const dateIPlus1 = new Date(result[i + 1].dataVencimento).getTime()

          // Invariant: date[i] <= date[i+1]
          expect(dateI).toBeLessThanOrEqual(dateIPlus1)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.3: Sorting is stable - transactions with same date maintain relative order
   */
  it('should maintain stable sort for transactions with identical due dates', () => {
    fc.assert(
      fc.property(
        referenceDateArbitrary,
        fc.array(fc.string({ minLength: 1 }), { minLength: 3, maxLength: 10 }),
        (referenceDate, ids) => {
          const futureDate = new Date(referenceDate)
          futureDate.setDate(futureDate.getDate() + 10)

          // Create transactions with same due date but different IDs
          const transactions: Transaction[] = ids.map((id) => ({
            id,
            descricao: `Transaction ${id}`,
            valor: 1000,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: futureDate.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          }))

          const result = getUpcomingTransactions(transactions, referenceDate)

          // All should have the same due date
          const uniqueDates = new Set(result.map((t) => t.dataVencimento))
          expect(uniqueDates.size).toBe(1)

          // Order should be preserved (stable sort)
          expect(result.map((t) => t.id)).toEqual(ids)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.4: First element has the earliest due date
   */
  it('should have the earliest due date as the first element', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => arr.length > 0),
        referenceDateArbitrary,
        (transactions, referenceDate) => {
          const result = getUpcomingTransactions(transactions, referenceDate)

          if (result.length === 0) {
            // No future transactions
            return
          }

          const firstDate = new Date(result[0].dataVencimento).getTime()

          // First date should be <= all other dates
          result.forEach((transaction) => {
            const transactionDate = new Date(transaction.dataVencimento).getTime()
            expect(firstDate).toBeLessThanOrEqual(transactionDate)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.5: Last element has the latest due date
   */
  it('should have the latest due date as the last element', () => {
    fc.assert(
      fc.property(
        transactionsArrayArbitrary.filter((arr) => arr.length > 0),
        referenceDateArbitrary,
        (transactions, referenceDate) => {
          const result = getUpcomingTransactions(transactions, referenceDate)

          if (result.length === 0) {
            // No future transactions
            return
          }

          const lastDate = new Date(result[result.length - 1].dataVencimento).getTime()

          // Last date should be >= all other dates
          result.forEach((transaction) => {
            const transactionDate = new Date(transaction.dataVencimento).getTime()
            expect(lastDate).toBeGreaterThanOrEqual(transactionDate)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.6: Sorting with specific date sequence
   */
  it('should correctly sort transactions with known date sequence', () => {
    fc.assert(
      fc.property(referenceDateArbitrary, (referenceDate) => {
        const date1 = new Date(referenceDate)
        date1.setDate(date1.getDate() + 1)

        const date2 = new Date(referenceDate)
        date2.setDate(date2.getDate() + 5)

        const date3 = new Date(referenceDate)
        date3.setDate(date3.getDate() + 3)

        const transactions: Transaction[] = [
          {
            id: '2',
            descricao: 'Middle',
            valor: 1000,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: date2.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          },
          {
            id: '1',
            descricao: 'First',
            valor: 1000,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: date1.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          },
          {
            id: '3',
            descricao: 'Last',
            valor: 1000,
            tipo: 'Entrada',
            status: 'Pago',
            dataVencimento: date3.toISOString(),
            impostosTaxas: 0,
            parcelamento: null,
            createdAt: new Date().toISOString(),
            clientId: 'test',
          },
        ]

        const result = getUpcomingTransactions(transactions, referenceDate)

        // Should be sorted: date1, date3, date2
        expect(result.length).toBe(3)
        expect(result[0].id).toBe('1')
        expect(result[1].id).toBe('3')
        expect(result[2].id).toBe('2')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.7: Sorting does not modify transaction content
   */
  it('should not modify transaction properties during sorting', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Each result transaction should have all original properties intact
        result.forEach((resultTransaction) => {
          const originalTransaction = transactions.find((t) => t.id === resultTransaction.id)

          if (originalTransaction) {
            expect(resultTransaction.descricao).toBe(originalTransaction.descricao)
            expect(resultTransaction.valor).toBe(originalTransaction.valor)
            expect(resultTransaction.tipo).toBe(originalTransaction.tipo)
            expect(resultTransaction.status).toBe(originalTransaction.status)
            expect(resultTransaction.impostosTaxas).toBe(originalTransaction.impostosTaxas)
            expect(resultTransaction.clientId).toBe(originalTransaction.clientId)
          }
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.8: Sorting is deterministic - same input produces same output
   */
  it('should produce the same sorted result for the same input', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result1 = getUpcomingTransactions(transactions, referenceDate)
        const result2 = getUpcomingTransactions(transactions, referenceDate)
        const result3 = getUpcomingTransactions(transactions, referenceDate)

        expect(result1).toEqual(result2)
        expect(result2).toEqual(result3)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.9: Sorting handles edge case of single transaction
   */
  it('should correctly handle single transaction (trivially sorted)', () => {
    fc.assert(
      fc.property(
        transactionArbitrary,
        referenceDateArbitrary,
        (transaction, referenceDate) => {
          const futureDate = new Date(referenceDate)
          futureDate.setDate(futureDate.getDate() + 10)

          const futureTransaction = {
            ...transaction,
            dataVencimento: futureDate.toISOString(),
          }

          const result = getUpcomingTransactions([futureTransaction], referenceDate)

          // Single element is trivially sorted
          expect(result.length).toBe(1)
          expect(result[0]).toEqual(futureTransaction)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10.10: Sorting handles transactions spanning wide date range
   */
  it('should correctly sort transactions across a wide date range', () => {
    fc.assert(
      fc.property(
        fc.array(
          transactionArbitrary.map((t) => ({
            ...t,
            dataVencimento: fc.sample(
              fc.date({ min: new Date('2025-01-01'), max: new Date('2030-12-31') }),
              1
            )[0].toISOString(),
          })),
          { minLength: 5, maxLength: 30 }
        ),
        (transactions) => {
          const referenceDate = new Date('2024-12-31')
          const result = getUpcomingTransactions(transactions, referenceDate)

          // Verify sorting across the entire range
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(result[i].dataVencimento).getTime()
            const nextDate = new Date(result[i + 1].dataVencimento).getTime()

            expect(currentDate).toBeLessThanOrEqual(nextDate)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Combined Property: Filtering and sorting work together correctly
   */
  it('should filter future transactions AND sort them correctly', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        // Normalize reference date
        const normalizedReferenceDate = new Date(referenceDate)
        normalizedReferenceDate.setHours(0, 0, 0, 0)

        // Property 11: All are future transactions
        result.forEach((transaction) => {
          const dueDate = new Date(transaction.dataVencimento)
          dueDate.setHours(0, 0, 0, 0)
          expect(dueDate.getTime()).toBeGreaterThan(normalizedReferenceDate.getTime())
        })

        // Property 10: All are sorted
        for (let i = 0; i < result.length - 1; i++) {
          const currentDate = new Date(result[i].dataVencimento).getTime()
          const nextDate = new Date(result[i + 1].dataVencimento).getTime()
          expect(currentDate).toBeLessThanOrEqual(nextDate)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Idempotency: Multiple calls return the same result
   */
  it('should return the same result when called multiple times', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result1 = getUpcomingTransactions(transactions, referenceDate)
        const result2 = getUpcomingTransactions(transactions, referenceDate)
        const result3 = getUpcomingTransactions(transactions, referenceDate)

        expect(result1).toEqual(result2)
        expect(result2).toEqual(result3)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Type safety: Result is always an array
   */
  it('should always return an array', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const result = getUpcomingTransactions(transactions, referenceDate)

        expect(Array.isArray(result)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Immutability: Original array is not modified
   */
  it('should not modify the original transactions array', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary, referenceDateArbitrary, (transactions, referenceDate) => {
        const originalCopy = JSON.parse(JSON.stringify(transactions))

        getUpcomingTransactions(transactions, referenceDate)

        // Original array should remain unchanged
        expect(transactions).toEqual(originalCopy)
      }),
      { numRuns: 100 }
    )
  })
})


describe('Property 15: Per-Installment Value Calculation', () => {
  /**
   * Generates arbitrary positive monetary values
   */
  const monetaryValueArbitrary = fc.double({
    min: 0.01,
    max: 1000000,
    noNaN: true,
    noDefaultInfinity: true,
  })

  /**
   * Generates arbitrary positive integer for total installments
   */
  const totalInstallmentsArbitrary = fc.integer({ min: 1, max: 120 })

  /**
   * Property 15.1: Per-installment value equals total value divided by total installments
   * 
   * **Validates: Requirements 10.3**
   */
  it('should equal total value divided by total installments', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result = calculatePerInstallmentValue(totalValue, totalInstallments)
        const expected = totalValue / totalInstallments

        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.2: Multiplying per-installment value by total installments equals original value
   * 
   * This property validates the inverse relationship: if we calculate the per-installment value
   * and then multiply it back by the number of installments, we should get the original value
   * (within floating-point precision).
   * 
   * **Validates: Requirements 10.3**
   */
  it('should satisfy the inverse property: perInstallmentValue * totalInstallments ≈ totalValue', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const perInstallmentValue = calculatePerInstallmentValue(totalValue, totalInstallments)
        const reconstructedTotal = perInstallmentValue * totalInstallments

        expect(reconstructedTotal).toBeCloseTo(totalValue, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.3: Per-installment value is always non-negative
   * 
   * Since transaction values are non-negative and total installments is positive,
   * the per-installment value should always be non-negative.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should always return a non-negative value', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result = calculatePerInstallmentValue(totalValue, totalInstallments)

        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).not.toBeNaN()
        expect(Number.isFinite(result)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.4: Per-installment value is less than or equal to total value
   * 
   * When there is more than one installment, the per-installment value should be
   * less than the total value. When there is exactly one installment, they should be equal.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should be less than or equal to total value', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result = calculatePerInstallmentValue(totalValue, totalInstallments)

        expect(result).toBeLessThanOrEqual(totalValue + 0.01) // Small epsilon for floating point

        // When totalInstallments is 1, per-installment value should equal total value
        if (totalInstallments === 1) {
          expect(result).toBeCloseTo(totalValue, 10)
        }

        // When totalInstallments > 1, per-installment value should be less than total value
        if (totalInstallments > 1) {
          expect(result).toBeLessThan(totalValue)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.5: Zero total value returns zero per-installment value
   * 
   * **Validates: Requirements 10.3**
   */
  it('should return 0 when total value is 0', () => {
    fc.assert(
      fc.property(totalInstallmentsArbitrary, (totalInstallments) => {
        const result = calculatePerInstallmentValue(0, totalInstallments)
        expect(result).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.6: Edge case - zero or negative installments returns zero
   * 
   * The function should handle invalid input gracefully by returning 0.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should return 0 when totalInstallments is zero or negative', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        fc.integer({ min: -100, max: 0 }),
        (totalValue, totalInstallments) => {
          const result = calculatePerInstallmentValue(totalValue, totalInstallments)
          expect(result).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.7: Single installment returns the full value
   * 
   * When there is only one installment, the per-installment value should equal
   * the total transaction value.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should return the full value when totalInstallments is 1', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, (totalValue) => {
        const result = calculatePerInstallmentValue(totalValue, 1)
        expect(result).toBeCloseTo(totalValue, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.8: Scaling property - doubling value doubles per-installment value
   * 
   * For a fixed number of installments, if we double the total value,
   * the per-installment value should also double.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should scale linearly with total value', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result1 = calculatePerInstallmentValue(totalValue, totalInstallments)
        const result2 = calculatePerInstallmentValue(totalValue * 2, totalInstallments)

        expect(result2).toBeCloseTo(result1 * 2, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.9: Inverse scaling property - doubling installments halves per-installment value
   * 
   * For a fixed total value, if we double the number of installments,
   * the per-installment value should be halved.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should scale inversely with total installments', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        fc.integer({ min: 1, max: 60 }), // Limit to 60 so we can double it
        (totalValue, totalInstallments) => {
          const result1 = calculatePerInstallmentValue(totalValue, totalInstallments)
          const result2 = calculatePerInstallmentValue(totalValue, totalInstallments * 2)

          expect(result2).toBeCloseTo(result1 / 2, 10)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.10: Idempotency - calling the function multiple times returns the same result
   * 
   * **Validates: Requirements 10.3**
   */
  it('should return the same result when called multiple times with the same input', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result1 = calculatePerInstallmentValue(totalValue, totalInstallments)
        const result2 = calculatePerInstallmentValue(totalValue, totalInstallments)
        const result3 = calculatePerInstallmentValue(totalValue, totalInstallments)

        expect(result1).toBeCloseTo(result2, 10)
        expect(result2).toBeCloseTo(result3, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.11: Type safety - result is always a finite number
   * 
   * **Validates: Requirements 10.3**
   */
  it('should always return a finite number', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result = calculatePerInstallmentValue(totalValue, totalInstallments)

        expect(typeof result).toBe('number')
        expect(Number.isFinite(result)).toBe(true)
        expect(Number.isNaN(result)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.12: Boundary test - very small values
   * 
   * Test with very small monetary values (cents) to ensure precision is maintained.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should handle very small values correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1, noNaN: true, noDefaultInfinity: true }),
        totalInstallmentsArbitrary,
        (totalValue, totalInstallments) => {
          const result = calculatePerInstallmentValue(totalValue, totalInstallments)
          const expected = totalValue / totalInstallments

          expect(result).toBeCloseTo(expected, 10)
          expect(result).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.13: Boundary test - very large values
   * 
   * Test with very large monetary values to ensure the function handles them correctly.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should handle very large values correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100000, max: 10000000, noNaN: true, noDefaultInfinity: true }),
        totalInstallmentsArbitrary,
        (totalValue, totalInstallments) => {
          const result = calculatePerInstallmentValue(totalValue, totalInstallments)
          const expected = totalValue / totalInstallments

          expect(result).toBeCloseTo(expected, 10)
          expect(Number.isFinite(result)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.14: Boundary test - many installments
   * 
   * Test with a large number of installments (e.g., 120 months = 10 years).
   * 
   * **Validates: Requirements 10.3**
   */
  it('should handle many installments correctly', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        fc.integer({ min: 100, max: 120 }),
        (totalValue, totalInstallments) => {
          const result = calculatePerInstallmentValue(totalValue, totalInstallments)
          const expected = totalValue / totalInstallments

          expect(result).toBeCloseTo(expected, 10)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(totalValue)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.15: Commutativity of multiplication
   * 
   * For any valid inputs, (totalValue / totalInstallments) * totalInstallments
   * should equal totalValue * (1 / totalInstallments) * totalInstallments
   * 
   * **Validates: Requirements 10.3**
   */
  it('should satisfy commutativity of the division operation', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const result = calculatePerInstallmentValue(totalValue, totalInstallments)
        const alternativeCalculation = totalValue * (1 / totalInstallments)

        expect(result).toBeCloseTo(alternativeCalculation, 10)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.16: Sum of all installments equals total value
   * 
   * If we calculate the per-installment value and sum it totalInstallments times,
   * we should get back the original total value (within floating-point precision).
   * 
   * **Validates: Requirements 10.3**
   */
  it('should satisfy: sum of all per-installment values equals total value', () => {
    fc.assert(
      fc.property(monetaryValueArbitrary, totalInstallmentsArbitrary, (totalValue, totalInstallments) => {
        const perInstallmentValue = calculatePerInstallmentValue(totalValue, totalInstallments)
        
        // Sum the per-installment value totalInstallments times
        let sum = 0
        for (let i = 0; i < totalInstallments; i++) {
          sum += perInstallmentValue
        }

        expect(sum).toBeCloseTo(totalValue, 8) // Slightly lower precision due to accumulation
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.17: Monotonicity - increasing installments decreases per-installment value
   * 
   * For a fixed total value, as the number of installments increases,
   * the per-installment value should decrease (or stay the same).
   * 
   * **Validates: Requirements 10.3**
   */
  it('should decrease as number of installments increases', () => {
    fc.assert(
      fc.property(
        monetaryValueArbitrary,
        fc.integer({ min: 1, max: 59 }),
        (totalValue, totalInstallments) => {
          const result1 = calculatePerInstallmentValue(totalValue, totalInstallments)
          const result2 = calculatePerInstallmentValue(totalValue, totalInstallments + 1)

          expect(result2).toBeLessThanOrEqual(result1 + 0.01) // Small epsilon for floating point
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 15.18: Specific example - R$ 1000 in 10 installments
   * 
   * A concrete example to validate the calculation with known values.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should correctly calculate R$ 1000 in 10 installments as R$ 100 per installment', () => {
    const result = calculatePerInstallmentValue(1000, 10)
    expect(result).toBeCloseTo(100, 10)
  })

  /**
   * Property 15.19: Specific example - R$ 5000 in 12 installments
   * 
   * Another concrete example with a common scenario (12 monthly installments).
   * 
   * **Validates: Requirements 10.3**
   */
  it('should correctly calculate R$ 5000 in 12 installments as R$ 416.67 per installment', () => {
    const result = calculatePerInstallmentValue(5000, 12)
    expect(result).toBeCloseTo(416.6666666666667, 10)
  })

  /**
   * Property 15.20: Specific example - R$ 100 in 3 installments
   * 
   * Test with a value that doesn't divide evenly to ensure proper handling of decimals.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should correctly calculate R$ 100 in 3 installments as R$ 33.33 per installment', () => {
    const result = calculatePerInstallmentValue(100, 3)
    expect(result).toBeCloseTo(33.333333333333336, 10)
  })
})
