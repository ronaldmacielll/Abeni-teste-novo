/**
 * fast-check Generators for Transaction Types
 * 
 * These generators create arbitrary Transaction objects for property-based testing
 * of financial calculations and business logic.
 * 
 * Configuration: 100 iterations per property test (as per Testing Strategy)
 */

import * as fc from 'fast-check'
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  Installment,
} from '@/modules/finance/types/transaction.types'

/**
 * Generates valid TransactionType values
 */
export const transactionTypeArbitrary: fc.Arbitrary<TransactionType> = fc.constantFrom<TransactionType>(
  'Entrada',
  'Saída'
)

/**
 * Generates valid TransactionStatus values
 */
export const transactionStatusArbitrary: fc.Arbitrary<TransactionStatus> = fc.constantFrom<TransactionStatus>(
  'Pago',
  'Pendente',
  'Atrasado'
)

/**
 * Generates arbitrary positive monetary values
 * Range: 0 to 1,000,000 BRL
 */
export const monetaryValueArbitrary: fc.Arbitrary<number> = fc.double({
  min: 0,
  max: 1000000,
  noNaN: true,
  noDefaultInfinity: true,
})

/**
 * Generates arbitrary tax/fee values
 * Range: 0 to 50,000 BRL
 */
export const taxValueArbitrary: fc.Arbitrary<number> = fc.double({
  min: 0,
  max: 50000,
  noNaN: true,
  noDefaultInfinity: true,
})

/**
 * Generates arbitrary dates within a reasonable range (2020-2030)
 * Returns ISO 8601 string
 */
export const dateArbitrary: fc.Arbitrary<string> = fc
  .date({
    min: new Date('2020-01-01'),
    max: new Date('2030-12-31'),
  })
  .map((d) => d.toISOString())

/**
 * Generates arbitrary past dates (before today)
 */
export const pastDateArbitrary: fc.Arbitrary<string> = fc
  .date({
    min: new Date('2020-01-01'),
    max: new Date(),
  })
  .map((d) => d.toISOString())

/**
 * Generates arbitrary future dates (after today)
 */
export const futureDateArbitrary: fc.Arbitrary<string> = fc
  .date({
    min: new Date(),
    max: new Date('2030-12-31'),
  })
  .map((d) => d.toISOString())

/**
 * Generates arbitrary Installment objects
 * Ensures current <= total
 */
export const installmentArbitrary: fc.Arbitrary<Installment> = fc
  .tuple(
    fc.integer({ min: 1, max: 12 }), // current
    fc.integer({ min: 1, max: 12 })  // total
  )
  .filter(([current, total]) => current <= total)
  .chain(([current, total]) =>
    fc.record({
      current: fc.constant(current),
      total: fc.constant(total),
      valuePerInstallment: monetaryValueArbitrary,
    })
  )

/**
 * Generates arbitrary parcelamento strings in format "X/Y"
 * Ensures X <= Y
 */
export const parcelamentoStringArbitrary: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 12 })
  )
  .filter(([current, total]) => current <= total)
  .map(([current, total]) => `${current}/${total}`)

/**
 * Generates arbitrary Transaction objects
 * 
 * @param overrides - Optional partial transaction to override generated values
 */
export const transactionArbitrary = (
  overrides?: Partial<Transaction>
): fc.Arbitrary<Transaction> => {
  return fc.record({
    id: fc.string({ minLength: 1 }),
    descricao: fc.string({ minLength: 1, maxLength: 200 }),
    valor: monetaryValueArbitrary,
    tipo: transactionTypeArbitrary,
    status: transactionStatusArbitrary,
    dataVencimento: dateArbitrary,
    impostosTaxas: taxValueArbitrary,
    parcelamento: fc.option(installmentArbitrary, { nil: null }),
    createdAt: dateArbitrary,
    clientId: fc.string({ minLength: 1 }),
    ...overrides,
  })
}

/**
 * Generates an array of arbitrary transactions
 * 
 * @param minLength - Minimum array length (default: 0)
 * @param maxLength - Maximum array length (default: 50)
 */
export const transactionsArrayArbitrary = (
  minLength: number = 0,
  maxLength: number = 50
): fc.Arbitrary<Transaction[]> => {
  return fc.array(transactionArbitrary(), { minLength, maxLength })
}

/**
 * Generates arbitrary "Entrada" (income) transactions
 */
export const entradaTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  tipo: 'Entrada' as TransactionType,
})

/**
 * Generates arbitrary "Saída" (expense) transactions
 */
export const saidaTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  tipo: 'Saída' as TransactionType,
})

/**
 * Generates arbitrary "Pago" (paid) transactions
 */
export const pagoTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  status: 'Pago' as TransactionStatus,
})

/**
 * Generates arbitrary "Pendente" (pending) transactions
 */
export const pendenteTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  status: 'Pendente' as TransactionStatus,
})

/**
 * Generates arbitrary "Atrasado" (overdue) transactions
 */
export const atrasadoTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  status: 'Atrasado' as TransactionStatus,
})

/**
 * Generates arbitrary transactions with future due dates
 */
export const futureTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  dataVencimento: fc.sample(futureDateArbitrary, 1)[0],
})

/**
 * Generates arbitrary transactions with past due dates
 */
export const pastTransactionArbitrary: fc.Arbitrary<Transaction> = transactionArbitrary({
  dataVencimento: fc.sample(pastDateArbitrary, 1)[0],
})

/**
 * Generates arbitrary transactions with installments
 */
export const installmentTransactionArbitrary: fc.Arbitrary<Transaction> = fc
  .tuple(transactionArbitrary(), installmentArbitrary)
  .map(([transaction, installment]) => ({
    ...transaction,
    parcelamento: installment,
  }))

/**
 * Generates a valid period filter with startDate < endDate
 */
export const periodFilterArbitrary: fc.Arbitrary<{ startDate: string; endDate: string }> = fc
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
 * Generates a period filter with only startDate
 */
export const periodFilterStartOnlyArbitrary: fc.Arbitrary<{ startDate: string }> = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') })
  .map((start) => ({
    startDate: start.toISOString(),
  }))

/**
 * Generates a period filter with only endDate
 */
export const periodFilterEndOnlyArbitrary: fc.Arbitrary<{ endDate: string }> = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map((end) => ({
    endDate: end.toISOString(),
  }))

/**
 * Generates transactions with guaranteed positive net revenue
 * (gross revenue > taxes)
 */
export const positiveNetRevenueTransactionsArbitrary: fc.Arbitrary<Transaction[]> = fc
  .array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      descricao: fc.string({ minLength: 1, maxLength: 200 }),
      valor: fc.double({ min: 1000, max: 100000, noNaN: true, noDefaultInfinity: true }),
      tipo: fc.constant('Entrada' as TransactionType),
      status: transactionStatusArbitrary,
      dataVencimento: dateArbitrary,
      impostosTaxas: fc.double({ min: 0, max: 500, noNaN: true, noDefaultInfinity: true }), // Low taxes
      parcelamento: fc.constant(null),
      createdAt: dateArbitrary,
      clientId: fc.string({ minLength: 1 }),
    }),
    { minLength: 1, maxLength: 20 }
  )

/**
 * Generates transactions with guaranteed negative net revenue
 * (taxes > gross revenue)
 */
export const negativeNetRevenueTransactionsArbitrary: fc.Arbitrary<Transaction[]> = fc
  .array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      descricao: fc.string({ minLength: 1, maxLength: 200 }),
      valor: fc.double({ min: 100, max: 1000, noNaN: true, noDefaultInfinity: true }),
      tipo: fc.constant('Entrada' as TransactionType),
      status: transactionStatusArbitrary,
      dataVencimento: dateArbitrary,
      impostosTaxas: fc.double({ min: 1001, max: 5000, noNaN: true, noDefaultInfinity: true }), // High taxes
      parcelamento: fc.constant(null),
      createdAt: dateArbitrary,
      clientId: fc.string({ minLength: 1 }),
    }),
    { minLength: 1, maxLength: 10 }
  )

/**
 * Generates a mixed collection of income and expense transactions
 */
export const mixedTransactionsArbitrary: fc.Arbitrary<Transaction[]> = fc
  .tuple(
    fc.array(entradaTransactionArbitrary, { maxLength: 25 }),
    fc.array(saidaTransactionArbitrary, { maxLength: 25 })
  )
  .map(([entradas, saidas]) => [...entradas, ...saidas])
