/**
 * Financial Module Types
 * 
 * Domain types for the Financial module
 */

export type TransactionType = 'Entrada' | 'Saída'

export type TransactionStatus = 'Pago' | 'Pendente' | 'Atrasado'

export interface Installment {
  current: number
  total: number
  valuePerInstallment: number
}

export interface Transaction {
  id: string
  descricao: string
  valor: number
  tipo: TransactionType
  status: TransactionStatus
  dataVencimento: string
  impostosTaxas: number
  parcelamento: Installment | null
  createdAt: string
  clientId: string
}

export interface FinancialSummary {
  faturamentoBruto: number
  faturamentoLiquido: number
  saldoAtual: number
  totalImpostos: number
  period: {
    startDate: string
    endDate: string
  }
}

export interface CashFlowProjection {
  projecaoEntradas: number
  projecaoSaidas: number
  saldoProjetado: number
  futureTransactions: Transaction[]
}

export interface GetTransactionsRequest {
  period?: 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}

export interface GetTransactionsResponse {
  transactions: Transaction[]
  summary: FinancialSummary
  projections: CashFlowProjection
}

export interface CreateTransactionRequest {
  valor: number
  tipo: TransactionType
  status: TransactionStatus
  dataVencimento: string
  impostosTaxas?: number
  parcelamento?: string
  descricao?: string
}

export interface CreateTransactionResponse {
  success: boolean
  transaction: Transaction
  clickupTaskId: string
}
