/**
 * Financial Calculations Module
 * 
 * Pure functions for financial calculations and projections.
 * All functions are side-effect free and testable with property-based testing.
 */

import { Transaction, Installment } from '../types/transaction.types'

/**
 * Period filter interface for date range filtering
 */
export interface PeriodFilter {
  startDate?: string
  endDate?: string
}

/**
 * Calculates gross revenue (Faturamento Bruto)
 * 
 * Property 7: Gross Revenue Calculation
 * For any collection of transactions within a time period, calculating gross revenue
 * SHALL equal the sum of the Valor field for all transactions where Tipo equals "Entrada"
 * and the transaction falls within the period.
 * 
 * @param transactions - Array of transactions
 * @param period - Optional period filter with startDate and endDate
 * @returns Sum of all income transaction values within the period
 * 
 * Requirements: 7.1
 */
export function calculateGrossRevenue(
  transactions: Transaction[],
  period?: PeriodFilter
): number {
  return transactions
    .filter(t => t.tipo === 'Entrada')
    .filter(t => {
      if (!period) return true
      
      const transactionDate = new Date(t.dataVencimento)
      const startDate = period.startDate ? new Date(period.startDate) : null
      const endDate = period.endDate ? new Date(period.endDate) : null
      
      if (startDate && transactionDate < startDate) return false
      if (endDate && transactionDate > endDate) return false
      
      return true
    })
    .reduce((sum, t) => sum + t.valor, 0)
}

/**
 * Calculates net revenue (Faturamento Líquido)
 * 
 * Property 8: Net Revenue Calculation
 * For any collection of income transactions, calculating net revenue
 * SHALL equal the gross revenue minus the sum of Impostos_Taxas for all income transactions.
 * 
 * @param transactions - Array of transactions
 * @param period - Optional period filter with startDate and endDate
 * @returns Gross revenue minus total taxes and fees
 * 
 * Requirements: 7.2
 */
export function calculateNetRevenue(
  transactions: Transaction[],
  period?: PeriodFilter
): number {
  const grossRevenue = calculateGrossRevenue(transactions, period)
  
  const totalTaxes = transactions
    .filter(t => t.tipo === 'Entrada')
    .filter(t => {
      if (!period) return true
      
      const transactionDate = new Date(t.dataVencimento)
      const startDate = period.startDate ? new Date(period.startDate) : null
      const endDate = period.endDate ? new Date(period.endDate) : null
      
      if (startDate && transactionDate < startDate) return false
      if (endDate && transactionDate > endDate) return false
      
      return true
    })
    .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)
  
  return grossRevenue - totalTaxes
}

/**
 * Calculates current balance (Saldo Atual)
 * 
 * Property 9: Current Balance Calculation
 * For any collection of transactions, calculating current balance SHALL equal
 * the sum of Valor for all transactions where Status equals "Pago" and Tipo equals "Entrada",
 * minus the sum of Valor for all transactions where Status equals "Pago" and Tipo equals "Saída".
 * 
 * @param transactions - Array of transactions
 * @returns Paid income minus paid expenses
 * 
 * Requirements: 7.3
 */
export function calculateBalance(transactions: Transaction[]): number {
  const paidIncome = transactions
    .filter(t => t.tipo === 'Entrada' && t.status === 'Pago')
    .reduce((sum, t) => sum + t.valor, 0)
  
  const paidExpenses = transactions
    .filter(t => t.tipo === 'Saída' && t.status === 'Pago')
    .reduce((sum, t) => sum + t.valor, 0)
  
  return paidIncome - paidExpenses
}

/**
 * Filters and sorts upcoming transactions
 * 
 * Property 11: Future Transaction Filtering
 * For any collection of transactions and the current date, filtering for future transactions
 * SHALL return only transactions where Data_de_Vencimento is strictly greater than the current date.
 * 
 * Property 10: Transaction Sorting Invariant
 * Sorting by Data_de_Vencimento in ascending order SHALL produce a list where for every
 * adjacent pair of transactions (i, i+1), the date of transaction i is less than or equal
 * to the date of transaction i+1.
 * 
 * @param transactions - Array of transactions
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Array of future transactions sorted by due date
 * 
 * Requirements: 9.1, 8.4
 */
export function getUpcomingTransactions(
  transactions: Transaction[],
  referenceDate?: Date
): Transaction[] {
  const today = referenceDate || new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day
  
  return transactions
    .filter(t => {
      const dueDate = new Date(t.dataVencimento)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate > today
    })
    .sort((a, b) => {
      const dateA = new Date(a.dataVencimento)
      const dateB = new Date(b.dataVencimento)
      return dateA.getTime() - dateB.getTime()
    })
}

/**
 * Calculates projected income
 * 
 * Property 12: Projected Income Calculation
 * For any collection of transactions, calculating projected income SHALL equal
 * the sum of Valor for all future transactions where Tipo equals "Entrada".
 * 
 * @param transactions - Array of transactions
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Sum of future income transactions
 * 
 * Requirements: 9.2
 */
export function calculateProjectedIncome(
  transactions: Transaction[],
  referenceDate?: Date
): number {
  const upcomingTransactions = getUpcomingTransactions(transactions, referenceDate)
  
  return upcomingTransactions
    .filter(t => t.tipo === 'Entrada')
    .reduce((sum, t) => sum + t.valor, 0)
}

/**
 * Calculates projected expenses
 * 
 * Property 13: Projected Expenses Calculation
 * For any collection of transactions, calculating projected expenses SHALL equal
 * the sum of Valor for all future transactions where Tipo equals "Saída".
 * 
 * @param transactions - Array of transactions
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Sum of future expense transactions
 * 
 * Requirements: 9.3
 */
export function calculateProjectedExpenses(
  transactions: Transaction[],
  referenceDate?: Date
): number {
  const upcomingTransactions = getUpcomingTransactions(transactions, referenceDate)
  
  return upcomingTransactions
    .filter(t => t.tipo === 'Saída')
    .reduce((sum, t) => sum + t.valor, 0)
}

/**
 * Parses installment string format "X/Y"
 * 
 * Property 14: Parcelamento Parsing
 * For any installment string in format "X/Y", parsing SHALL extract current and total
 * installment numbers where 1 ≤ X ≤ Y.
 * 
 * @param parcelamentoStr - Installment string in format "X/Y" (e.g., "3/10")
 * @returns Object with current and total installment numbers, or null if invalid
 * 
 * Requirements: 10.1
 */
export function parseParcelamento(
  parcelamentoStr: string | null | undefined
): { current: number; total: number } | null {
  if (!parcelamentoStr) return null
  
  const match = parcelamentoStr.match(/^(\d+)\/(\d+)$/)
  if (!match) return null
  
  const current = parseInt(match[1], 10)
  const total = parseInt(match[2], 10)
  
  // Validate range: 1 ≤ current ≤ total
  if (current < 1 || total < 1 || current > total) return null
  
  return { current, total }
}

/**
 * Calculates per-installment value
 * 
 * Property 15: Per-Installment Value Calculation
 * For any transaction with installments, calculating per-installment value
 * SHALL equal Valor divided by total number of installments.
 * 
 * @param totalValue - Total transaction value
 * @param totalInstallments - Total number of installments
 * @returns Value per installment
 * 
 * Requirements: 10.3
 */
export function calculatePerInstallmentValue(
  totalValue: number,
  totalInstallments: number
): number {
  if (totalInstallments <= 0) return 0
  return totalValue / totalInstallments
}

/**
 * Processes installments and distributes remaining installments across future months
 * 
 * Property 16: Installment Distribution
 * For any transaction with installments, processing SHALL distribute remaining installments
 * across future months, generating separate entries for each installment.
 * 
 * @param transaction - Transaction with installment information
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Array of future installment transactions
 * 
 * Requirements: 10.4, 10.5
 */
export function processInstallments(
  transaction: Transaction,
  referenceDate?: Date
): Transaction[] {
  if (!transaction.parcelamento) return []
  
  const { current, total, valuePerInstallment } = transaction.parcelamento
  const remainingInstallments = total - current
  
  if (remainingInstallments <= 0) return []
  
  const today = referenceDate || new Date()
  const futureInstallments: Transaction[] = []
  
  for (let i = 1; i <= remainingInstallments; i++) {
    const installmentDate = new Date(transaction.dataVencimento)
    installmentDate.setMonth(installmentDate.getMonth() + i)
    
    const futureInstallment: Transaction = {
      ...transaction,
      id: `${transaction.id}-installment-${current + i}`,
      valor: valuePerInstallment,
      dataVencimento: installmentDate.toISOString(),
      parcelamento: {
        current: current + i,
        total: total,
        valuePerInstallment: valuePerInstallment,
      },
      descricao: `${transaction.descricao} (Parcela ${current + i}/${total})`,
    }
    
    futureInstallments.push(futureInstallment)
  }
  
  return futureInstallments
}
