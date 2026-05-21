/**
 * Financial API Route - /api/transactions
 * 
 * BFF endpoint for retrieving and creating financial transactions from ClickUp
 * Implements JWT validation, multi-tenant filtering, data normalization, and financial calculations
 */

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { ClickUpService } from '@/services/clickup/client'
import { dataNormalizer } from '@/services/clickup/normalizer'
import { filterByClientId } from '@/services/clickup/filters'
import { extractClientIdFromToken, extractRoleFromToken } from '@/services/auth/jwt'
import { env } from '@/lib/env'
import { compressedJsonResponse } from '@/lib/api/compression'
import {
  calculateGrossRevenue,
  calculateNetRevenue,
  calculateBalance,
  calculateProjectedIncome,
  calculateProjectedExpenses,
  getUpcomingTransactions,
  processInstallments,
} from '@/modules/finance/utils/calculations'
import type {
  GetTransactionsResponse,
  CreateTransactionRequest,
  CreateTransactionResponse,
  Transaction,
  FinancialSummary,
  CashFlowProjection,
} from '@/modules/finance/types/transaction.types'
import type { FieldMapping } from '@/services/clickup/types'

// Field mapping for financial custom fields
// TODO: Move this to database configuration (client_config table)
const FINANCIAL_FIELD_MAP: FieldMapping['financial'] = {
  valor: process.env.CLICKUP_FIELD_VALOR || '',
  tipo: process.env.CLICKUP_FIELD_TIPO || '',
  status: process.env.CLICKUP_FIELD_STATUS_FINANCIAL || '',
  dataVencimento: process.env.CLICKUP_FIELD_DATA_VENCIMENTO || '',
  impostosTaxas: process.env.CLICKUP_FIELD_IMPOSTOS_TAXAS || '',
  parcelamento: process.env.CLICKUP_FIELD_PARCELAMENTO || '',
}

/**
 * Calculate date range based on period filter
 */
function getDateRange(period?: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()

  if (period === 'week') {
    // Last 7 days
    startDate.setDate(endDate.getDate() - 7)
  } else if (period === 'month') {
    // Last 30 days
    startDate.setDate(endDate.getDate() - 30)
  } else if (period === 'year') {
    // Last 365 days
    startDate.setDate(endDate.getDate() - 365)
  } else {
    // Default to last 30 days
    startDate.setDate(endDate.getDate() - 30)
  }

  // Reset time to start of day for startDate
  startDate.setHours(0, 0, 0, 0)
  
  // Reset time to end of day for endDate
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

/**
 * Filter transactions by date range
 */
function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.dataVencimento)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

/**
 * GET /api/transactions
 * 
 * Query Parameters:
 * - period: 'week' | 'month' | 'year' (optional, defaults to 'month')
 * - startDate: ISO 8601 date string (optional, overrides period)
 * - endDate: ISO 8601 date string (optional, overrides period)
 * 
 * Headers:
 * - Authorization: Bearer <JWT token>
 * 
 * Returns:
 * - 200: Success with transactions, summary, and projections
 * - 400: Bad request (invalid parameters)
 * - 401: Unauthorized (missing or invalid JWT)
 * - 403: Forbidden (missing client_id in JWT)
 * - 500: Internal server error
 * - 502: Bad gateway (ClickUp API error)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate JWT and extract client_id and role
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const clientId = extractClientIdFromToken(token)
    const role = extractRoleFromToken(token)

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client_id in JWT token' },
        { status: 403 }
      )
    }

    // 2. Check if user has permission to access financial data
    // Only internal users can access financial data
    if (role !== 'internal') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas usuários internos podem acessar dados financeiros.' },
        { status: 403 }
      )
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Validate period parameter
    if (period !== 'week' && period !== 'month' && period !== 'year') {
      return NextResponse.json(
        { error: 'Invalid period parameter. Must be "week", "month", or "year"' },
        { status: 400 }
      )
    }

    // 3. Calculate date range for filtering
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      // Use custom date range if provided
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
    } else {
      // Use period-based date range
      const dateRange = getDateRange(period)
      startDate = dateRange.startDate
      endDate = dateRange.endDate
    }

    // 4. Check if using temporary ClickUp credentials (development mode)
    const isUsingTempClickUp = 
      env.clickup.apiKey === 'temp_clickup_key_for_development' ||
      env.clickup.apiKey.startsWith('temp_') ||
      env.clickup.financialListId === '' ||
      env.clickup.financialListId.startsWith('temp_')

    let transactions: Transaction[] = []

    if (isUsingTempClickUp) {
      // Return mock data for development
      console.log('Using mock financial data (no ClickUp connection)')
      
      const mockTransactions: Transaction[] = [
        // Entradas (Receitas)
        {
          id: 'mock-trans-1',
          descricao: 'Pagamento Cliente - Projeto Website',
          valor: 8500.00,
          tipo: 'Entrada',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          impostosTaxas: 1275.00, // 15% de impostos
          parcelamento: null,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-2',
          descricao: 'Mensalidade - Gestão de Redes Sociais',
          valor: 3200.00,
          tipo: 'Entrada',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 480.00,
          parcelamento: null,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-3',
          descricao: 'Consultoria - Estratégia Digital',
          valor: 5000.00,
          tipo: 'Entrada',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 750.00,
          parcelamento: null,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-4',
          descricao: 'Projeto E-commerce - Parcela 1/3',
          valor: 4000.00,
          tipo: 'Entrada',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 600.00,
          parcelamento: { current: 1, total: 3, valuePerInstallment: 4000.00 },
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-5',
          descricao: 'Campanha de Anúncios - Cliente Premium',
          valor: 6800.00,
          tipo: 'Entrada',
          status: 'Pendente',
          dataVencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          impostosTaxas: 1020.00,
          parcelamento: null,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-6',
          descricao: 'Projeto E-commerce - Parcela 2/3',
          valor: 4000.00,
          tipo: 'Entrada',
          status: 'Pendente',
          dataVencimento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 600.00,
          parcelamento: { current: 2, total: 3, valuePerInstallment: 4000.00 },
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        
        // Saídas (Despesas)
        {
          id: 'mock-trans-7',
          descricao: 'Salários - Equipe',
          valor: 12000.00,
          tipo: 'Saída',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-8',
          descricao: 'Aluguel - Escritório',
          valor: 2500.00,
          tipo: 'Saída',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-9',
          descricao: 'Assinatura - Ferramentas SaaS',
          valor: 890.00,
          tipo: 'Saída',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-10',
          descricao: 'Fornecedor - Serviços de Design',
          valor: 1800.00,
          tipo: 'Saída',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-11',
          descricao: 'Investimento em Anúncios - Meta Ads',
          valor: 3500.00,
          tipo: 'Saída',
          status: 'Pago',
          dataVencimento: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-12',
          descricao: 'Contador - Serviços Contábeis',
          valor: 800.00,
          tipo: 'Saída',
          status: 'Pendente',
          dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-13',
          descricao: 'Internet e Telefonia',
          valor: 450.00,
          tipo: 'Saída',
          status: 'Pendente',
          dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
        {
          id: 'mock-trans-14',
          descricao: 'Energia Elétrica',
          valor: 620.00,
          tipo: 'Saída',
          status: 'Pendente',
          dataVencimento: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          impostosTaxas: 0,
          parcelamento: null,
          createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          clientId,
        },
      ]

      transactions = mockTransactions
    } else {
      // Real ClickUp integration
      const clickupService = new ClickUpService(env.clickup.apiKey)

      // 5. Fetch tasks from ClickUp financial list
      let clickupTasks
      try {
        clickupTasks = await clickupService.getTasksByList(
          env.clickup.financialListId,
          {
            archived: false,
            include_closed: false,
          }
        )
      } catch (error) {
        console.error('ClickUp API error:', error)
        return NextResponse.json(
          { 
            error: 'Failed to fetch data from ClickUp API',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 502 }
        )
      }

      // 6. Normalize ClickUp tasks to Transaction objects
      transactions = clickupTasks.map((task) => {
        const transaction = dataNormalizer.normalizeTransaction(task, FINANCIAL_FIELD_MAP)
        // Set client_id from JWT
        return { ...transaction, clientId }
      })

      // 7. Filter by client_id (multi-tenant isolation)
      transactions = filterByClientId(transactions, clientId)
    }

    // 8. Filter by date range (for summary calculations)
    const filteredTransactions = filterTransactionsByDateRange(transactions, startDate, endDate)

    // 9. Execute financial calculations
    const faturamentoBruto = calculateGrossRevenue(filteredTransactions, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })

    const faturamentoLiquido = calculateNetRevenue(filteredTransactions, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })

    const saldoAtual = calculateBalance(transactions) // Use all transactions for balance

    const totalImpostos = filteredTransactions
      .filter(t => t.tipo === 'Entrada')
      .reduce((sum, t) => sum + (t.impostosTaxas || 0), 0)

    // 10. Calculate projections
    const futureTransactions = getUpcomingTransactions(transactions)
    const projecaoEntradas = calculateProjectedIncome(transactions)
    const projecaoSaidas = calculateProjectedExpenses(transactions)
    const saldoProjetado = saldoAtual + projecaoEntradas - projecaoSaidas

    // 11. Process installments for future transactions
    const allFutureTransactions: Transaction[] = [...futureTransactions]
    
    transactions.forEach((transaction) => {
      if (transaction.parcelamento) {
        const installments = processInstallments(transaction)
        allFutureTransactions.push(...installments)
      }
    })

    // Sort future transactions by due date
    allFutureTransactions.sort((a, b) => {
      const dateA = new Date(a.dataVencimento)
      const dateB = new Date(b.dataVencimento)
      return dateA.getTime() - dateB.getTime()
    })

    // 12. Build response
    const summary: FinancialSummary = {
      faturamentoBruto,
      faturamentoLiquido,
      saldoAtual,
      totalImpostos,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }

    const projections: CashFlowProjection = {
      projecaoEntradas,
      projecaoSaidas,
      saldoProjetado,
      futureTransactions: allFutureTransactions,
    }

    const response: GetTransactionsResponse = {
      transactions: filteredTransactions,
      summary,
      projections,
    }

    // 13. Return JSON response with cache headers and compression
    return compressedJsonResponse(response, 200, {
      'Cache-Control': 'private, max-age=300', // 5 minutes cache
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/transactions:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * 
 * Request Body:
 * - valor: number (required)
 * - tipo: 'Entrada' | 'Saída' (required)
 * - status: 'Pago' | 'Pendente' | 'Atrasado' (required)
 * - dataVencimento: ISO 8601 date string (required)
 * - impostosTaxas: number (optional)
 * - parcelamento: string in format "X/Y" (optional)
 * - descricao: string (optional)
 * 
 * Headers:
 * - Authorization: Bearer <JWT token>
 * 
 * Returns:
 * - 201: Created successfully
 * - 400: Bad request (validation error)
 * - 401: Unauthorized (missing or invalid JWT)
 * - 403: Forbidden (missing client_id in JWT)
 * - 500: Internal server error
 * - 502: Bad gateway (ClickUp API error)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate JWT and extract client_id
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const clientId = extractClientIdFromToken(token)

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client_id in JWT token' },
        { status: 403 }
      )
    }

    // 2. Parse request body
    let body: CreateTransactionRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // 3. Validate required fields
    const validationErrors: string[] = []

    if (typeof body.valor !== 'number' || body.valor <= 0) {
      validationErrors.push('valor must be a positive number')
    }

    if (body.tipo !== 'Entrada' && body.tipo !== 'Saída') {
      validationErrors.push('tipo must be either "Entrada" or "Saída"')
    }

    if (body.status !== 'Pago' && body.status !== 'Pendente' && body.status !== 'Atrasado') {
      validationErrors.push('status must be "Pago", "Pendente", or "Atrasado"')
    }

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

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      )
    }

    // 4. Build custom fields for ClickUp
    const customFields: Array<{ id: string; value: any }> = [
      {
        id: FINANCIAL_FIELD_MAP.valor,
        value: body.valor,
      },
      {
        id: FINANCIAL_FIELD_MAP.tipo,
        value: body.tipo,
      },
      {
        id: FINANCIAL_FIELD_MAP.status,
        value: body.status,
      },
      {
        id: FINANCIAL_FIELD_MAP.dataVencimento,
        value: new Date(body.dataVencimento).getTime(),
      },
    ]

    if (body.impostosTaxas !== undefined) {
      customFields.push({
        id: FINANCIAL_FIELD_MAP.impostosTaxas,
        value: body.impostosTaxas,
      })
    }

    if (body.parcelamento) {
      customFields.push({
        id: FINANCIAL_FIELD_MAP.parcelamento,
        value: body.parcelamento,
      })
    }

    // 5. Initialize ClickUp service
    const clickupService = new ClickUpService(env.clickup.apiKey)

    // 6. Create task in ClickUp
    let clickupTask
    try {
      clickupTask = await clickupService.createTask(
        env.clickup.financialListId,
        {
          name: body.descricao || `${body.tipo} - R$ ${body.valor.toFixed(2)}`,
          description: body.descricao || '',
          custom_fields: customFields,
        }
      )
    } catch (error) {
      console.error('ClickUp API error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to create transaction in ClickUp API',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 502 }
      )
    }

    // 7. Normalize the created task to Transaction object
    const transaction = dataNormalizer.normalizeTransaction(clickupTask, FINANCIAL_FIELD_MAP)
    const transactionWithClientId = { ...transaction, clientId }

    // 8. Build response
    const response: CreateTransactionResponse = {
      success: true,
      transaction: transactionWithClientId,
      clickupTaskId: clickupTask.id,
    }

    // 9. Return success response
    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/transactions:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
