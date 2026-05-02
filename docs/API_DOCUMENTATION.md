# API Documentation

## Overview

This document provides comprehensive documentation for the Portal de Performance + Gestão Financeira API endpoints. The API follows a Backend-for-Frontend (BFF) architecture pattern where all ClickUp API interactions are handled server-side through Next.js API Routes.

**Base URL**: `/api`

**Authentication**: All endpoints require JWT authentication via the `Authorization` header.

**Content Type**: `application/json`

**Compression**: Responses larger than 1KB are automatically compressed using gzip.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Performance Module](#performance-module)
   - [GET /api/posts](#get-apiposts)
3. [Financial Module](#financial-module)
   - [GET /api/transactions](#get-apitransactions)
   - [POST /api/transactions](#post-apitransactions)
4. [Error Responses](#error-responses)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## Authentication

All API endpoints require authentication using JWT (JSON Web Token) in the `Authorization` header.

### Header Format

```
Authorization: Bearer <JWT_TOKEN>
```

### JWT Claims

The JWT token must contain the following claims:

- `client_id` (string): Unique identifier linking the user to their ClickUp lists
- `exp` (number): Token expiration timestamp
- `sub` (string): User ID

### Authentication Errors

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 401 | `MISSING_AUTH_HEADER` | Authorization header is missing or malformed |
| 401 | `INVALID_TOKEN` | JWT token is invalid or expired |
| 403 | `MISSING_CLIENT_ID` | JWT token does not contain client_id claim |

---

## Performance Module

### GET /api/posts

Retrieves social media post metrics for the authenticated client.

#### Endpoint

```
GET /api/posts
```

#### Authentication

Required. JWT token must contain valid `client_id` claim.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Time period filter. Valid values: `week`, `month` |

#### Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Status Code**: `200 OK`

**Response Body**:

```typescript
{
  posts: Post[],
  metadata: {
    total: number,
    period: string,
    startDate: string,    // ISO 8601 format
    endDate: string       // ISO 8601 format
  }
}
```

**Post Object Schema**:

```typescript
{
  id: string,                    // ClickUp task ID
  title: string,                 // Post title
  imageUrl: string | null,       // Image URL or null if no image
  status: PostStatus,            // Post publication status
  metrics: {
    alcance: number,             // Reach metric
    engajamento: number,         // Engagement metric
    impressoes: number,          // Impressions metric
    cliques: number              // Clicks metric
  },
  createdAt: string,             // ISO 8601 timestamp
  publishedAt: string | null,    // ISO 8601 timestamp or null
  clientId: string               // Client identifier
}
```

**PostStatus Values**:
- `Publicado` - Published
- `Agendado` - Scheduled
- `Rascunho` - Draft
- `Arquivado` - Archived

#### Response Headers

```http
Content-Type: application/json
Cache-Control: private, max-age=300
Content-Encoding: gzip
```

#### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid period parameter |
| 401 | Missing or invalid authorization header |
| 403 | Missing client_id in JWT token |
| 500 | Internal server error |
| 502 | ClickUp API error |

#### Example Request

```bash
curl -X GET "https://example.com/api/posts?period=week" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Example Response

```json
{
  "posts": [
    {
      "id": "abc123",
      "title": "Campanha de Verão 2024",
      "imageUrl": "https://example.com/image.jpg",
      "status": "Publicado",
      "metrics": {
        "alcance": 15420,
        "engajamento": 1250,
        "impressoes": 28900,
        "cliques": 450
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T14:00:00.000Z",
      "clientId": "client-123"
    },
    {
      "id": "def456",
      "title": "Post Institucional",
      "imageUrl": null,
      "status": "Agendado",
      "metrics": {
        "alcance": 0,
        "engajamento": 0,
        "impressoes": 0,
        "cliques": 0
      },
      "createdAt": "2024-01-16T09:00:00.000Z",
      "publishedAt": null,
      "clientId": "client-123"
    }
  ],
  "metadata": {
    "total": 2,
    "period": "week",
    "startDate": "2024-01-10T00:00:00.000Z",
    "endDate": "2024-01-17T23:59:59.999Z"
  }
}
```

#### Caching

Responses are cached for 5 minutes (`max-age=300`). The cache is private and specific to each authenticated client.

#### Multi-Tenant Isolation

The endpoint automatically filters posts to return only data associated with the `client_id` from the JWT token. Clients cannot access posts from other clients.

---

## Financial Module

### GET /api/transactions

Retrieves financial transactions with calculated summaries and projections.

#### Endpoint

```
GET /api/transactions
```

#### Authentication

Required. JWT token must contain valid `client_id` claim.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Time period filter. Valid values: `week`, `month`, `year` |
| `startDate` | string | No | - | Custom start date (ISO 8601 format). Overrides `period` if provided with `endDate` |
| `endDate` | string | No | - | Custom end date (ISO 8601 format). Overrides `period` if provided with `startDate` |

#### Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Status Code**: `200 OK`

**Response Body**:

```typescript
{
  transactions: Transaction[],
  summary: FinancialSummary,
  projections: CashFlowProjection
}
```

**Transaction Object Schema**:

```typescript
{
  id: string,                    // ClickUp task ID
  descricao: string,             // Transaction description
  valor: number,                 // Amount in BRL
  tipo: TransactionType,         // "Entrada" or "Saída"
  status: TransactionStatus,     // Payment status
  dataVencimento: string,        // Due date (ISO 8601)
  impostosTaxas: number,         // Taxes and fees amount
  parcelamento: Installment | null,  // Installment info or null
  createdAt: string,             // ISO 8601 timestamp
  clientId: string               // Client identifier
}
```

**TransactionType Values**:
- `Entrada` - Income
- `Saída` - Expense

**TransactionStatus Values**:
- `Pago` - Paid
- `Pendente` - Pending
- `Atrasado` - Overdue

**Installment Object Schema**:

```typescript
{
  current: number,               // Current installment number
  total: number,                 // Total number of installments
  valuePerInstallment: number    // Calculated value per installment
}
```

**FinancialSummary Object Schema**:

```typescript
{
  faturamentoBruto: number,      // Gross revenue (sum of all income)
  faturamentoLiquido: number,    // Net revenue (gross - taxes)
  saldoAtual: number,            // Current balance (paid income - paid expenses)
  totalImpostos: number,         // Total taxes and fees
  period: {
    startDate: string,           // ISO 8601 format
    endDate: string              // ISO 8601 format
  }
}
```

**CashFlowProjection Object Schema**:

```typescript
{
  projecaoEntradas: number,      // Projected income
  projecaoSaidas: number,        // Projected expenses
  saldoProjetado: number,        // Projected balance
  futureTransactions: Transaction[]  // Transactions with future due dates
}
```

#### Response Headers

```http
Content-Type: application/json
Cache-Control: private, max-age=300
Content-Encoding: gzip
```

#### Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid period parameter or date format |
| 401 | Missing or invalid authorization header |
| 403 | Missing client_id in JWT token |
| 500 | Internal server error |
| 502 | ClickUp API error |

#### Example Request

```bash
curl -X GET "https://example.com/api/transactions?period=month" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Example Response

```json
{
  "transactions": [
    {
      "id": "txn-001",
      "descricao": "Pagamento Cliente A",
      "valor": 5000.00,
      "tipo": "Entrada",
      "status": "Pago",
      "dataVencimento": "2024-01-15T00:00:00.000Z",
      "impostosTaxas": 450.00,
      "parcelamento": null,
      "createdAt": "2024-01-10T10:00:00.000Z",
      "clientId": "client-123"
    },
    {
      "id": "txn-002",
      "descricao": "Fornecedor XYZ",
      "valor": 2000.00,
      "tipo": "Saída",
      "status": "Pendente",
      "dataVencimento": "2024-01-20T00:00:00.000Z",
      "impostosTaxas": 0,
      "parcelamento": {
        "current": 3,
        "total": 10,
        "valuePerInstallment": 200.00
      },
      "createdAt": "2024-01-05T14:30:00.000Z",
      "clientId": "client-123"
    }
  ],
  "summary": {
    "faturamentoBruto": 5000.00,
    "faturamentoLiquido": 4550.00,
    "saldoAtual": 3000.00,
    "totalImpostos": 450.00,
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    }
  },
  "projections": {
    "projecaoEntradas": 8000.00,
    "projecaoSaidas": 3500.00,
    "saldoProjetado": 7500.00,
    "futureTransactions": [
      {
        "id": "txn-003",
        "descricao": "Pagamento Cliente B",
        "valor": 8000.00,
        "tipo": "Entrada",
        "status": "Pendente",
        "dataVencimento": "2024-02-05T00:00:00.000Z",
        "impostosTaxas": 720.00,
        "parcelamento": null,
        "createdAt": "2024-01-20T11:00:00.000Z",
        "clientId": "client-123"
      }
    ]
  }
}
```

#### Caching

Responses are cached for 5 minutes (`max-age=300`). The cache is private and specific to each authenticated client.

#### Multi-Tenant Isolation

The endpoint automatically filters transactions to return only data associated with the `client_id` from the JWT token.

---

### POST /api/transactions

Creates a new financial transaction in the system.

#### Endpoint

```
POST /api/transactions
```

#### Authentication

Required. JWT token must contain valid `client_id` claim.

#### Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body

```typescript
{
  valor: number,                 // Required. Amount in BRL (must be positive)
  tipo: TransactionType,         // Required. "Entrada" or "Saída"
  status: TransactionStatus,     // Required. "Pago", "Pendente", or "Atrasado"
  dataVencimento: string,        // Required. Due date (ISO 8601 format)
  impostosTaxas?: number,        // Optional. Taxes and fees (must be non-negative)
  parcelamento?: string,         // Optional. Format: "X/Y" (e.g., "3/10")
  descricao?: string             // Optional. Transaction description
}
```

#### Request Body Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `valor` | number | Yes | Must be a positive number |
| `tipo` | string | Yes | Must be "Entrada" or "Saída" |
| `status` | string | Yes | Must be "Pago", "Pendente", or "Atrasado" |
| `dataVencimento` | string | Yes | Must be valid ISO 8601 date |
| `impostosTaxas` | number | No | Must be non-negative number |
| `parcelamento` | string | No | Must match format "X/Y" where 1 ≤ X ≤ Y |
| `descricao` | string | No | Any string value |

#### Response

**Status Code**: `201 Created`

**Response Body**:

```typescript
{
  success: boolean,
  transaction: Transaction,
  clickupTaskId: string
}
```

#### Response Headers

```http
Content-Type: application/json
```

#### Error Responses

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | One or more fields failed validation |
| 400 | `INVALID_JSON` | Request body is not valid JSON |
| 401 | `MISSING_AUTH_HEADER` | Authorization header is missing or malformed |
| 403 | `MISSING_CLIENT_ID` | JWT token does not contain client_id claim |
| 500 | `INTERNAL_ERROR` | Internal server error |
| 502 | `CLICKUP_API_ERROR` | Failed to create transaction in ClickUp API |

#### Example Request

```bash
curl -X POST "https://example.com/api/transactions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 3500.00,
    "tipo": "Entrada",
    "status": "Pendente",
    "dataVencimento": "2024-02-15T00:00:00.000Z",
    "impostosTaxas": 315.00,
    "parcelamento": "1/5",
    "descricao": "Pagamento Projeto ABC"
  }'
```

#### Example Success Response

```json
{
  "success": true,
  "transaction": {
    "id": "txn-new-001",
    "descricao": "Pagamento Projeto ABC",
    "valor": 3500.00,
    "tipo": "Entrada",
    "status": "Pendente",
    "dataVencimento": "2024-02-15T00:00:00.000Z",
    "impostosTaxas": 315.00,
    "parcelamento": {
      "current": 1,
      "total": 5,
      "valuePerInstallment": 700.00
    },
    "createdAt": "2024-01-17T15:30:00.000Z",
    "clientId": "client-123"
  },
  "clickupTaskId": "abc123xyz"
}
```

#### Example Validation Error Response

```json
{
  "error": "Validation failed",
  "details": [
    "valor must be a positive number",
    "parcelamento must be in format \"X/Y\" (e.g., \"3/10\")"
  ]
}
```

---

## Error Responses

All error responses follow a consistent format:

### Error Response Schema

```typescript
{
  error: string,                 // Error message
  message?: string,              // Additional error details
  details?: string[]             // Array of validation errors (for 400 responses)
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | External service (ClickUp API) error |

### Error Response Examples

#### 400 Bad Request

```json
{
  "error": "Invalid period parameter. Must be \"week\", \"month\", or \"year\""
}
```

#### 401 Unauthorized

```json
{
  "error": "Missing or invalid authorization header"
}
```

#### 403 Forbidden

```json
{
  "error": "Missing client_id in JWT token"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Unexpected error occurred"
}
```

#### 502 Bad Gateway

```json
{
  "error": "Failed to fetch data from ClickUp API",
  "message": "Connection timeout"
}
```

---

## Rate Limiting

The API implements rate limiting to protect against abuse and ensure fair usage.

### Rate Limit Headers

All responses include rate limit information in headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642435200
```

### Rate Limit Rules

- **Authenticated requests**: 100 requests per minute per client_id
- **Failed authentication attempts**: 10 attempts per 15 minutes per IP address

### Rate Limit Exceeded Response

**Status Code**: `429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Examples

### Complete Workflow Example

#### 1. Authenticate and Get JWT Token

```bash
# Login request (handled by Supabase Auth)
curl -X POST "https://example.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Response includes JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "clientId": "client-123"
  }
}
```

#### 2. Fetch Performance Data

```bash
curl -X GET "https://example.com/api/posts?period=week" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3. Fetch Financial Data

```bash
curl -X GET "https://example.com/api/transactions?period=month" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 4. Create New Transaction

```bash
curl -X POST "https://example.com/api/transactions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "valor": 5000.00,
    "tipo": "Entrada",
    "status": "Pendente",
    "dataVencimento": "2024-02-01T00:00:00.000Z",
    "impostosTaxas": 450.00,
    "descricao": "Pagamento Cliente XYZ"
  }'
```

### JavaScript/TypeScript Example

```typescript
// API client configuration
const API_BASE_URL = 'https://example.com/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Fetch posts
async function fetchPosts(period: 'week' | 'month') {
  const response = await fetch(`${API_BASE_URL}/posts?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

// Fetch transactions
async function fetchTransactions(period: 'week' | 'month' | 'year') {
  const response = await fetch(`${API_BASE_URL}/transactions?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

// Create transaction
async function createTransaction(data: CreateTransactionRequest) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const posts = await fetchPosts('week');
  console.log('Posts:', posts);

  const transactions = await fetchTransactions('month');
  console.log('Transactions:', transactions);

  const newTransaction = await createTransaction({
    valor: 3000.00,
    tipo: 'Entrada',
    status: 'Pago',
    dataVencimento: '2024-02-01T00:00:00.000Z',
    impostosTaxas: 270.00,
    descricao: 'Novo pagamento',
  });
  console.log('Created:', newTransaction);
} catch (error) {
  console.error('API Error:', error);
}
```

### Python Example

```python
import requests
from typing import Dict, Any

API_BASE_URL = 'https://example.com/api'
JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Fetch posts
def fetch_posts(period: str = 'month') -> Dict[str, Any]:
    response = requests.get(
        f'{API_BASE_URL}/posts',
        params={'period': period},
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Fetch transactions
def fetch_transactions(period: str = 'month') -> Dict[str, Any]:
    response = requests.get(
        f'{API_BASE_URL}/transactions',
        params={'period': period},
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Create transaction
def create_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    response = requests.post(
        f'{API_BASE_URL}/transactions',
        json=data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Usage
try:
    posts = fetch_posts('week')
    print('Posts:', posts)

    transactions = fetch_transactions('month')
    print('Transactions:', transactions)

    new_transaction = create_transaction({
        'valor': 3000.00,
        'tipo': 'Entrada',
        'status': 'Pago',
        'dataVencimento': '2024-02-01T00:00:00.000Z',
        'impostosTaxas': 270.00,
        'descricao': 'Novo pagamento'
    })
    print('Created:', new_transaction)
except requests.exceptions.HTTPError as e:
    print(f'API Error: {e}')
```

---

## Additional Notes

### Data Freshness

- API responses are cached for 5 minutes
- Cached data is revalidated in the background
- Use cache-busting techniques (e.g., adding a timestamp query parameter) if real-time data is required

### Security Considerations

1. **Never expose JWT tokens** in client-side code or logs
2. **Always use HTTPS** for API requests in production
3. **Rotate JWT tokens** regularly (recommended: every 24 hours)
4. **Validate all input** on both client and server side
5. **Monitor for suspicious activity** (unusual request patterns, failed auth attempts)

### Performance Tips

1. **Use appropriate period filters** to reduce payload size
2. **Implement client-side caching** with React Query or SWR
3. **Paginate large result sets** (future enhancement)
4. **Compress request bodies** for large POST requests

### Support

For API support or to report issues:
- Email: api-support@example.com
- Documentation: https://docs.example.com
- Status Page: https://status.example.com

---

**Last Updated**: January 2024  
**API Version**: 1.0.0
