# API Documentation

## Overview

This document describes the REST API endpoints provided by the Portal de Performance + Gestão Financeira application. All endpoints follow the Backend-for-Frontend (BFF) pattern and are implemented as Next.js API Routes.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All API endpoints require authentication via JWT token in the Authorization header.

### Request Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Flow

1. User authenticates via Supabase Auth at `/login`
2. Supabase returns a JWT token containing `client_id` claim
3. Client includes JWT token in all subsequent API requests
4. BFF validates token and extracts `client_id` for multi-tenant filtering

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional context
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Missing or invalid JWT token |
| `403` | Forbidden - Valid token but insufficient permissions |
| `404` | Not Found - Resource does not exist |
| `422` | Unprocessable Entity - Validation failed |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server-side error |
| `502` | Bad Gateway - ClickUp API unavailable |
| `503` | Service Unavailable - Temporary service disruption |

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_TOKEN` | 401 | JWT token is missing, expired, or malformed |
| `INVALID_CLIENT_ID` | 403 | client_id in token doesn't match requested resource |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `CLICKUP_API_ERROR` | 502 | ClickUp API returned an error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests to ClickUp API |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Endpoints

---

## Performance Module

### GET /api/posts

Retrieves social media posts with performance metrics for the authenticated client.

#### Request

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Time period filter: `week` or `month` |

**Example Request:**

```http
GET /api/posts?period=week
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

**Success Response (200 OK):**

```json
{
  "posts": [
    {
      "id": "abc123",
      "title": "Post sobre produto X",
      "imageUrl": "https://example.com/image.jpg",
      "status": "Publicado",
      "metrics": {
        "alcance": 15420,
        "engajamento": 1234,
        "impressoes": 28500,
        "cliques": 567
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "publishedAt": "2024-01-15T14:00:00Z",
      "clientId": "client_abc"
    }
  ],
  "metadata": {
    "total": 12,
    "period": "week",
    "startDate": "2024-01-08T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z"
  }
}
```

**Post Object Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ClickUp task ID |
| `title` | string | Post title/description |
| `imageUrl` | string \| null | URL of post image (null if no image) |
| `status` | string | Post status: `Publicado`, `Agendado`, `Rascunho`, `Arquivado` |
| `metrics` | object | Performance metrics |
| `metrics.alcance` | number | Reach count |
| `metrics.engajamento` | number | Engagement count |
| `metrics.impressoes` | number | Impressions count |
| `metrics.cliques` | number | Clicks count |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `publishedAt` | string \| null | ISO 8601 timestamp of publication |
| `clientId` | string | Multi-tenant identifier |

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "JWT token is missing or invalid"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "INVALID_CLIENT_ID",
    "message": "You don't have permission to access this resource"
  }
}

// 502 Bad Gateway
{
  "error": {
    "code": "CLICKUP_API_ERROR",
    "message": "Failed to fetch data from ClickUp API",
    "details": {
      "retryAfter": 5000
    }
  }
}
```

#### Caching

- **Cache Strategy**: React Query with 5-minute stale time
- **Revalidation**: Background revalidation on window focus
- **Cache Key**: `['posts', period, clientId]`

#### Rate Limiting

- **Limit**: Inherited from ClickUp API limits
- **Retry Strategy**: Exponential backoff [1s, 2s, 4s]

---

## Financial Module

### GET /api/transactions

Retrieves financial transactions with calculated summaries and projections for the authenticated client.

#### Request

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Time period: `week`, `month`, or `year` |
| `startDate` | string | No | - | ISO 8601 start date (overrides period) |
| `endDate` | string | No | - | ISO 8601 end date (overrides period) |

**Example Request:**

```http
GET /api/transactions?period=month
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

**Success Response (200 OK):**

```json
{
  "transactions": [
    {
      "id": "txn_123",
      "descricao": "Pagamento Cliente A",
      "valor": 5000.00,
      "tipo": "Entrada",
      "status": "Pago",
      "dataVencimento": "2024-01-15T00:00:00Z",
      "impostosTaxas": 450.00,
      "parcelamento": {
        "current": 3,
        "total": 10,
        "valuePerInstallment": 500.00
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "clientId": "client_abc"
    }
  ],
  "summary": {
    "faturamentoBruto": 120000.00,
    "faturamentoLiquido": 95000.00,
    "saldoAtual": 45000.00,
    "totalImpostos": 25000.00,
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z"
    }
  },
  "projections": {
    "projecaoEntradas": 35000.00,
    "projecaoSaidas": 18000.00,
    "saldoProjetado": 62000.00,
    "futureTransactions": [
      {
        "id": "txn_456",
        "descricao": "Pagamento futuro",
        "valor": 3000.00,
        "tipo": "Entrada",
        "status": "Pendente",
        "dataVencimento": "2024-02-15T00:00:00Z",
        "impostosTaxas": 270.00,
        "parcelamento": null,
        "createdAt": "2024-01-20T10:00:00Z",
        "clientId": "client_abc"
      }
    ]
  }
}
```

**Transaction Object Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | ClickUp task ID |
| `descricao` | string | Transaction description |
| `valor` | number | Amount in BRL |
| `tipo` | string | Type: `Entrada` (income) or `Saída` (expense) |
| `status` | string | Status: `Pago`, `Pendente`, `Atrasado` |
| `dataVencimento` | string | Due date (ISO 8601) |
| `impostosTaxas` | number | Taxes and fees amount |
| `parcelamento` | object \| null | Installment information |
| `parcelamento.current` | number | Current installment number |
| `parcelamento.total` | number | Total installments |
| `parcelamento.valuePerInstallment` | number | Value per installment |
| `createdAt` | string | ISO 8601 timestamp |
| `clientId` | string | Multi-tenant identifier |

**Financial Summary Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `faturamentoBruto` | number | Gross revenue (sum of all income) |
| `faturamentoLiquido` | number | Net revenue (gross - taxes) |
| `saldoAtual` | number | Current balance (paid income - paid expenses) |
| `totalImpostos` | number | Total taxes and fees |
| `period` | object | Period information |

**Cash Flow Projection Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `projecaoEntradas` | number | Projected income |
| `projecaoSaidas` | number | Projected expenses |
| `saldoProjetado` | number | Projected balance |
| `futureTransactions` | array | Transactions with future due dates |

**Error Responses:**

```json
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid period parameter",
    "details": {
      "field": "period",
      "allowedValues": ["week", "month", "year"]
    }
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "JWT token is missing or invalid"
  }
}
```

---

### POST /api/transactions

Creates a new financial transaction in ClickUp.

#### Request

**Request Body:**

```json
{
  "valor": 5000.00,
  "tipo": "Entrada",
  "status": "Pendente",
  "dataVencimento": "2024-02-15T00:00:00Z",
  "impostosTaxas": 450.00,
  "parcelamento": "1/10",
  "descricao": "Pagamento Cliente X - Projeto Y"
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `valor` | number | Yes | Amount in BRL (must be > 0) |
| `tipo` | string | Yes | Type: `Entrada` or `Saída` |
| `status` | string | Yes | Status: `Pago`, `Pendente`, or `Atrasado` |
| `dataVencimento` | string | Yes | Due date (ISO 8601 format) |
| `impostosTaxas` | number | No | Taxes and fees (default: 0) |
| `parcelamento` | string | No | Installment format: "current/total" (e.g., "3/10") |
| `descricao` | string | No | Transaction description |

**Validation Rules:**

- `valor`: Must be a positive number
- `tipo`: Must be exactly "Entrada" or "Saída"
- `status`: Must be "Pago", "Pendente", or "Atrasado"
- `dataVencimento`: Must be valid ISO 8601 date
- `impostosTaxas`: Must be non-negative number
- `parcelamento`: Must match format "X/Y" where 1 ≤ X ≤ Y

**Example Request:**

```http
POST /api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "valor": 5000.00,
  "tipo": "Entrada",
  "status": "Pendente",
  "dataVencimento": "2024-02-15T00:00:00Z",
  "impostosTaxas": 450.00,
  "descricao": "Pagamento Cliente X"
}
```

#### Response

**Success Response (201 Created):**

```json
{
  "success": true,
  "transaction": {
    "id": "txn_new_123",
    "descricao": "Pagamento Cliente X",
    "valor": 5000.00,
    "tipo": "Entrada",
    "status": "Pendente",
    "dataVencimento": "2024-02-15T00:00:00Z",
    "impostosTaxas": 450.00,
    "parcelamento": null,
    "createdAt": "2024-01-20T15:30:00Z",
    "clientId": "client_abc"
  },
  "clickupTaskId": "abc123xyz"
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing required field
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: valor",
    "details": {
      "field": "valor",
      "required": true
    }
  }
}

// 400 Bad Request - Invalid value
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid value for field: tipo",
    "details": {
      "field": "tipo",
      "value": "InvalidType",
      "allowedValues": ["Entrada", "Saída"]
    }
  }
}

// 422 Unprocessable Entity - Invalid parcelamento format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parcelamento format",
    "details": {
      "field": "parcelamento",
      "value": "15/10",
      "expectedFormat": "X/Y where 1 ≤ X ≤ Y"
    }
  }
}

// 502 Bad Gateway - ClickUp API error
{
  "error": {
    "code": "CLICKUP_API_ERROR",
    "message": "Failed to create task in ClickUp",
    "details": {
      "clickupError": "List not found"
    }
  }
}
```

---

## Data Normalization

### ClickUp to Domain Object Transformation

The BFF layer transforms ClickUp task objects into domain-specific objects (Post or Transaction) with the following guarantees:

1. **Field Mapping**: Custom field IDs are mapped to human-readable property names
2. **Default Values**: Missing fields receive appropriate defaults:
   - Numbers: `0`
   - Strings: `""`
   - Optional fields: `null`
3. **Date Conversion**: All dates converted to ISO 8601 format
4. **Metadata Removal**: Unnecessary ClickUp metadata is stripped
5. **Type Safety**: All objects conform to TypeScript interfaces

### Custom Field Mapping

#### Performance Module

| ClickUp Custom Field | Domain Property | Type | Default |
|---------------------|-----------------|------|---------|
| Alcance | `metrics.alcance` | number | 0 |
| Engajamento | `metrics.engajamento` | number | 0 |
| Impressões | `metrics.impressoes` | number | 0 |
| Cliques | `metrics.cliques` | number | 0 |
| Status | `status` | string | "Rascunho" |
| Imagem | `imageUrl` | string \| null | null |

#### Financial Module

| ClickUp Custom Field | Domain Property | Type | Default |
|---------------------|-----------------|------|---------|
| Valor | `valor` | number | 0 |
| Tipo | `tipo` | string | "Entrada" |
| Status | `status` | string | "Pendente" |
| Data_de_Vencimento | `dataVencimento` | string | current date |
| Impostos_Taxas | `impostosTaxas` | number | 0 |
| Parcelamento | `parcelamento` | object \| null | null |

---

## Multi-Tenant Security

### Client ID Isolation

All API endpoints enforce multi-tenant isolation:

1. **JWT Validation**: Token signature and expiration verified
2. **Client ID Extraction**: `client_id` claim extracted from JWT
3. **Data Filtering**: All ClickUp queries filtered by `client_id`
4. **Authorization Check**: Resource `client_id` must match JWT `client_id`

### Security Flow

```
Request → Validate JWT → Extract client_id → Query ClickUp → Filter by client_id → Return data
```

If any step fails, appropriate error response is returned (401 or 403).

---

## Rate Limiting

### ClickUp API Limits

The application inherits rate limits from ClickUp API:

- **Standard Plan**: 100 requests per minute
- **Business Plan**: 1000 requests per minute

### Retry Strategy

When rate limit is exceeded (429 status):

1. **Exponential Backoff**: [1000ms, 2000ms, 4000ms]
2. **Max Retries**: 3 attempts
3. **Retry Header**: Respects `Retry-After` header from ClickUp

### Client-Side Handling

React Query automatically handles retries for transient errors:

```typescript
{
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
}
```

---

## Caching Strategy

### React Query Configuration

```typescript
{
  staleTime: 5 * 60 * 1000,        // 5 minutes
  cacheTime: 10 * 60 * 1000,       // 10 minutes
  refetchOnWindowFocus: true,       // Revalidate on focus
  refetchOnReconnect: true,         // Revalidate on reconnect
  refetchInterval: false            // No polling
}
```

### Cache Keys

- **Posts**: `['posts', period, clientId]`
- **Transactions**: `['transactions', period, clientId]`

### Cache Invalidation

Cache is invalidated on:
- Successful POST request (transaction creation)
- Manual refetch trigger
- Window focus (background revalidation)

---

## Compression

### Response Compression

The BFF implements automatic compression for responses > 1KB:

- **Algorithm**: gzip
- **Compression Level**: 6 (balanced)
- **Content-Type**: `application/json`
- **Header**: `Content-Encoding: gzip`

### Client Support

Modern browsers automatically decompress gzip responses.

---

## Testing

### API Testing

The API endpoints are tested with:

1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Full request/response cycle
3. **Property-Based Tests**: fast-check for data transformations
4. **E2E Tests**: Playwright for complete user flows

### Test Coverage

- ✅ Authentication flow
- ✅ Multi-tenant isolation
- ✅ Data normalization
- ✅ Error handling
- ✅ Validation logic
- ✅ Rate limiting
- ✅ Cache behavior

---

## Changelog

### Version 1.0.0 (Current)

- Initial API implementation
- Performance module endpoints
- Financial module endpoints
- Multi-tenant security
- Property-based testing

---

## Support

For API support or questions, contact the development team.

---

**Last Updated**: January 2024
