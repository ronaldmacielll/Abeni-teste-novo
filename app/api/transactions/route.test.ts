/**
 * Integration tests for /api/transactions endpoint
 * 
 * Tests JWT validation, multi-tenant filtering, period filtering, transaction creation,
 * validation, and error handling for both GET and POST methods
 */

import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { ClickUpService } from '@/services/clickup/client'
import type { ClickUpTask } from '@/services/clickup/types'

// Mock dependencies
jest.mock('@/services/clickup/client')
jest.mock('@/services/auth/jwt')
jest.mock('@/lib/env', () => ({
  env: {
    clickup: {
      apiKey: 'test-api-key',
      performanceListId: 'test-list-id',
      financialListId: 'test-financial-list-id',
      baseUrl: 'https://api.clickup.com/api/v2',
    },
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
    },
    app: {
      baseUrl: 'http://localhost:3000',
      environment: 'development',
    },
    jwt: {
      secret: 'test-secret',
    },
  },
}))

const mockClickUpService = ClickUpService as jest.MockedClass<typeof ClickUpService>
const mockExtractClientIdFromToken = jest.requireMock('@/services/auth/jwt').extractClientIdFromToken

// Helper to create mock ClickUp task for financial transaction
function createMockFinancialTask(overrides: Partial<ClickUpTask> = {}): ClickUpTask {
  return {
    id: 'task-1',
    name: 'Receita de Serviço',
    description: 'Pagamento de cliente',
    status: {
      status: 'Pago',
      color: '#00ff00',
    },
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    custom_fields: [
      { id: 'valor-id', name: 'Valor', type: 'number', value: 5000 },
      { id: 'tipo-id', name: 'Tipo', type: 'text', value: 'Entrada' },
      { id: 'status-financial-id', name: 'Status', type: 'text', value: 'Pago' },
      { id: 'data-vencimento-id', name: 'Data Vencimento', type: 'date', value: new Date().getTime() },
      { id: 'impostos-taxas-id', name: 'Impostos/Taxas', type: 'number', value: 500 },
      { id: 'parcelamento-id', name: 'Parcelamento', type: 'text', value: null },
    ],
    list: {
      id: 'test-financial-list-id',
      name: 'Financial',
    },
    ...overrides,
  }
}

// Helper to create mock NextRequest
function createMockRequest(url: string, options: { headers?: Record<string, string>; body?: any; method?: string } = {}): NextRequest {
  const { headers = {}, body, method = 'GET' } = options
  
  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  }
  
  if (body) {
    requestInit.body = JSON.stringify(body)
  }
  
  return new NextRequest(url, requestInit)
}

describe('GET /api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables for field mapping
    process.env.CLICKUP_FIELD_VALOR = 'valor-id'
    process.env.CLICKUP_FIELD_TIPO = 'tipo-id'
    process.env.CLICKUP_FIELD_STATUS_FINANCIAL = 'status-financial-id'
    process.env.CLICKUP_FIELD_DATA_VENCIMENTO = 'data-vencimento-id'
    process.env.CLICKUP_FIELD_IMPOSTOS_TAXAS = 'impostos-taxas-id'
    process.env.CLICKUP_FIELD_PARCELAMENTO = 'parcelamento-id'
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 401 when Authorization header is malformed', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'InvalidFormat token123' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 403 when client_id is missing from JWT', async () => {
      mockExtractClientIdFromToken.mockReturnValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Missing client_id in JWT token')
    })

    it('should extract client_id from JWT token', async () => {
      const mockClientId = 'client-123'
      mockExtractClientIdFromToken.mockReturnValue(mockClientId)
      
      const mockGetTasksByList = jest.fn().mockResolvedValue([])
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      await GET(request)

      expect(mockExtractClientIdFromToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetTasksByList).toHaveBeenCalled()
    })
  })

  describe('Period Filtering', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue([])
    })

    it('should default to month period when not specified', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.period).toBeDefined()
    })

    it('should accept week period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions?period=week', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.period.startDate).toBeDefined()
      expect(data.summary.period.endDate).toBeDefined()
    })

    it('should accept month period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions?period=month', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.period.startDate).toBeDefined()
    })

    it('should accept year period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions?period=year', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.period.startDate).toBeDefined()
    })

    it('should return 400 for invalid period parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions?period=invalid', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid period parameter')
    })
  })

  describe('Data Retrieval and Normalization', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should fetch transactions from ClickUp and normalize them', async () => {
      const mockTasks = [createMockFinancialTask()]
      const mockGetTasksByList = jest.fn().mockResolvedValue(mockTasks)
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockGetTasksByList).toHaveBeenCalledWith('test-financial-list-id', {
        archived: false,
        include_closed: false,
      })
      expect(data.transactions).toBeDefined()
      expect(Array.isArray(data.transactions)).toBe(true)
    })

    it('should include financial summary in response', async () => {
      const mockTasks = [createMockFinancialTask()]
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue(mockTasks)
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.summary.faturamentoBruto).toBeDefined()
      expect(data.summary.faturamentoLiquido).toBeDefined()
      expect(data.summary.saldoAtual).toBeDefined()
      expect(data.summary.totalImpostos).toBeDefined()
    })

    it('should include cash flow projections in response', async () => {
      const mockTasks = [createMockFinancialTask()]
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue(mockTasks)
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projections).toBeDefined()
      expect(data.projections.projecaoEntradas).toBeDefined()
      expect(data.projections.projecaoSaidas).toBeDefined()
      expect(data.projections.saldoProjetado).toBeDefined()
      expect(data.projections.futureTransactions).toBeDefined()
    })

    it('should filter transactions by client_id', async () => {
      const clientId = 'client-123'
      mockExtractClientIdFromToken.mockReturnValue(clientId)
      
      const mockTasks = [createMockFinancialTask()]
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue(mockTasks)
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.transactions.every((t: any) => t.clientId === clientId)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should return 502 when ClickUp API fails', async () => {
      const mockGetTasksByList = jest.fn().mockRejectedValue(
        new Error('ClickUp API error: 500 Internal Server Error')
      )
      mockClickUpService.prototype.getTasksByList = mockGetTasksByList
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('Failed to fetch data from ClickUp API')
      expect(data.message).toContain('ClickUp API error')
    })

    it('should return 500 for unexpected errors', async () => {
      mockExtractClientIdFromToken.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Response Headers', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
      mockClickUpService.prototype.getTasksByList = jest.fn().mockResolvedValue([])
    })

    it('should include cache control headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        headers: { authorization: 'Bearer valid-token' },
      })
      
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=300')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })
})

describe('POST /api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables for field mapping
    process.env.CLICKUP_FIELD_VALOR = 'valor-id'
    process.env.CLICKUP_FIELD_TIPO = 'tipo-id'
    process.env.CLICKUP_FIELD_STATUS_FINANCIAL = 'status-financial-id'
    process.env.CLICKUP_FIELD_DATA_VENCIMENTO = 'data-vencimento-id'
    process.env.CLICKUP_FIELD_IMPOSTOS_TAXAS = 'impostos-taxas-id'
    process.env.CLICKUP_FIELD_PARCELAMENTO = 'parcelamento-id'
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: { valor: 1000, tipo: 'Entrada', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 401 when Authorization header is malformed', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'InvalidFormat token123' },
        body: { valor: 1000, tipo: 'Entrada', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing or invalid authorization header')
    })

    it('should return 403 when client_id is missing from JWT', async () => {
      mockExtractClientIdFromToken.mockReturnValue(null)
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Entrada', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Missing client_id in JWT token')
    })
  })

  describe('Valid Transaction Creation', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should create transaction with valid data', async () => {
      const mockCreatedTask = createMockFinancialTask()
      const mockCreateTask = jest.fn().mockResolvedValue(mockCreatedTask)
      mockClickUpService.prototype.createTask = mockCreateTask
      
      const transactionData = {
        valor: 5000,
        tipo: 'Entrada' as const,
        status: 'Pago' as const,
        dataVencimento: '2024-01-15',
        descricao: 'Pagamento de cliente',
      }
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: transactionData,
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.transaction).toBeDefined()
      expect(data.clickupTaskId).toBe(mockCreatedTask.id)
      expect(mockCreateTask).toHaveBeenCalledWith(
        'test-financial-list-id',
        expect.objectContaining({
          name: transactionData.descricao,
          description: transactionData.descricao,
        })
      )
    })

    it('should create transaction with optional fields', async () => {
      const mockCreatedTask = createMockFinancialTask()
      const mockCreateTask = jest.fn().mockResolvedValue(mockCreatedTask)
      mockClickUpService.prototype.createTask = mockCreateTask
      
      const transactionData = {
        valor: 5000,
        tipo: 'Entrada' as const,
        status: 'Pago' as const,
        dataVencimento: '2024-01-15',
        impostosTaxas: 500,
        parcelamento: '3/10',
        descricao: 'Pagamento parcelado',
      }
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: transactionData,
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockCreateTask).toHaveBeenCalled()
    })
  })

  describe('Required Field Validation', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should return 400 when valor is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { tipo: 'Entrada', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('valor must be a positive number')
    })

    it('should return 400 when valor is not a positive number', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: -100, tipo: 'Entrada', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('valor must be a positive number')
    })

    it('should return 400 when tipo is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('tipo must be either "Entrada" or "Saída"')
    })

    it('should return 400 when tipo is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Invalid', status: 'Pago', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('tipo must be either "Entrada" or "Saída"')
    })

    it('should return 400 when status is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Entrada', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('status must be "Pago", "Pendente", or "Atrasado"')
    })

    it('should return 400 when status is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Entrada', status: 'Invalid', dataVencimento: '2024-01-01' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('status must be "Pago", "Pendente", or "Atrasado"')
    })

    it('should return 400 when dataVencimento is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Entrada', status: 'Pago' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('dataVencimento is required')
    })

    it('should return 400 when dataVencimento is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { valor: 1000, tipo: 'Entrada', status: 'Pago', dataVencimento: 'invalid-date' },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('dataVencimento must be a valid ISO 8601 date')
    })
  })

  describe('Optional Field Validation', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should return 400 when impostosTaxas is negative', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { 
          valor: 1000, 
          tipo: 'Entrada', 
          status: 'Pago', 
          dataVencimento: '2024-01-01',
          impostosTaxas: -100,
        },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('impostosTaxas must be a non-negative number')
    })

    it('should return 400 when parcelamento format is invalid', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { 
          valor: 1000, 
          tipo: 'Entrada', 
          status: 'Pago', 
          dataVencimento: '2024-01-01',
          parcelamento: 'invalid',
        },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('parcelamento must be in format "X/Y"')
    })

    it('should return 400 when parcelamento has invalid range', async () => {
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { 
          valor: 1000, 
          tipo: 'Entrada', 
          status: 'Pago', 
          dataVencimento: '2024-01-01',
          parcelamento: '5/3',
        },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.details).toContain('parcelamento must have valid range')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockExtractClientIdFromToken.mockReturnValue('client-123')
    })

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: new Headers({ authorization: 'Bearer valid-token' }),
        body: 'invalid-json',
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should return 502 when ClickUp API fails', async () => {
      const mockCreateTask = jest.fn().mockRejectedValue(
        new Error('ClickUp API error: 500 Internal Server Error')
      )
      mockClickUpService.prototype.createTask = mockCreateTask
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { 
          valor: 1000, 
          tipo: 'Entrada', 
          status: 'Pago', 
          dataVencimento: '2024-01-01',
        },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('Failed to create transaction in ClickUp API')
      expect(data.message).toContain('ClickUp API error')
    })

    it('should return 500 for unexpected errors', async () => {
      mockExtractClientIdFromToken.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      
      const request = createMockRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: { 
          valor: 1000, 
          tipo: 'Entrada', 
          status: 'Pago', 
          dataVencimento: '2024-01-01',
        },
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
