# Instagram Integration API Documentation

## Overview

This document provides complete API documentation for the Instagram Business Integration endpoints. All endpoints require authentication via JWT token and support multi-tenant isolation.

**Base URL**: `http://localhost:3000/api` (development) or `https://your-domain.com/api` (production)

**Authentication**: All endpoints require `Authorization: Bearer {jwt_token}` header

## Account Management Endpoints

### Add Instagram Account

Creates a new Instagram Business account configuration.

```http
POST /admin/instagram/accounts
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "accountName": "ALUA Produtora",
  "businessAccountId": "123456789",
  "accessToken": "EAAB...",
  "clickupListId": "list-123"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountName | string | Yes | Display name for the account (1-255 chars) |
| businessAccountId | string | Yes | Instagram Business Account ID (numeric) |
| accessToken | string | Yes | Long-lived Instagram API access token |
| clickupListId | string | Yes | ClickUp list ID for task creation |

**Response (Success - 201):**

```json
{
  "success": true,
  "accountId": "acc-uuid-123",
  "accountName": "ALUA Produtora",
  "businessAccountId": "123456789",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "message": "Account configured successfully"
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid access token or missing permissions",
  "details": {
    "missingPermissions": [
      "instagram_business_content_read"
    ]
  }
}
```

**Error Codes:**

| Code | Status | Description |
|------|--------|-------------|
| INVALID_CREDENTIALS | 400 | Token is invalid or expired |
| MISSING_PERMISSIONS | 400 | Token lacks required permissions |
| INVALID_BUSINESS_ACCOUNT_ID | 400 | Business account ID format is invalid |
| CLICKUP_LIST_NOT_FOUND | 400 | ClickUp list doesn't exist or not accessible |
| ACCOUNT_LIMIT_EXCEEDED | 400 | Maximum 3 accounts allowed |
| DUPLICATE_ACCOUNT | 400 | Account already configured |
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| FORBIDDEN | 403 | User doesn't have permission |
| INTERNAL_ERROR | 500 | Server error |

---

### List Instagram Accounts

Retrieves all configured Instagram accounts for the current client.

```http
GET /admin/instagram/accounts
Authorization: Bearer {jwt_token}
```

**Query Parameters:** None

**Response (Success - 200):**

```json
{
  "success": true,
  "accounts": [
    {
      "accountId": "acc-uuid-123",
      "accountName": "ALUA Produtora",
      "businessAccountId": "123456789",
      "isActive": true,
      "lastSyncTime": "2024-01-15T10:25:00Z",
      "nextSyncTime": "2024-01-15T10:30:00Z",
      "lastError": null,
      "postsCount": 42,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "accountId": "acc-uuid-456",
      "accountName": "ALUA Eventos",
      "businessAccountId": "987654321",
      "isActive": false,
      "lastSyncTime": "2024-01-14T15:00:00Z",
      "nextSyncTime": null,
      "lastError": "Invalid access token",
      "postsCount": 28,
      "createdAt": "2024-01-10T14:30:00Z"
    }
  ],
  "total": 2
}
```

**Response (Error - 401):**

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid authentication token"
}
```

---

### Update Instagram Account

Updates configuration for an existing Instagram account.

```http
PUT /admin/instagram/accounts/{accountId}
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "accountName": "ALUA Produtora Updated",
  "clickupListId": "list-456",
  "isActive": true
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | Account UUID |

**Request Body (all optional):**

| Parameter | Type | Description |
|-----------|------|-------------|
| accountName | string | New display name |
| clickupListId | string | New ClickUp list ID |
| isActive | boolean | Enable/disable account |

**Response (Success - 200):**

```json
{
  "success": true,
  "accountId": "acc-uuid-123",
  "accountName": "ALUA Produtora Updated",
  "isActive": true,
  "updatedAt": "2024-01-15T10:35:00Z",
  "message": "Account updated successfully"
}
```

**Response (Error - 404):**

```json
{
  "success": false,
  "error": "ACCOUNT_NOT_FOUND",
  "message": "Account with ID acc-uuid-123 not found"
}
```

---

### Delete Instagram Account

Deletes an Instagram account configuration and all associated data.

```http
DELETE /admin/instagram/accounts/{accountId}
Authorization: Bearer {jwt_token}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | Account UUID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| confirm | string | Yes | Must be "yes" to confirm deletion |

**Response (Success - 200):**

```json
{
  "success": true,
  "accountId": "acc-uuid-123",
  "message": "Account deleted successfully",
  "deletedAt": "2024-01-15T10:40:00Z",
  "dataDeleted": {
    "postsCount": 42,
    "mappingsCount": 42,
    "syncHistoryCount": 288
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "CONFIRMATION_REQUIRED",
  "message": "Deletion requires confirmation. Add ?confirm=yes to the request"
}
```

---

## Sync Operations

### Manual Sync Trigger

Triggers an immediate synchronization for all active accounts.

```http
POST /admin/instagram/sync
Authorization: Bearer {jwt_token}
```

**Request Body:** None

**Response (Success - 200):**

```json
{
  "success": true,
  "syncId": "sync-uuid-789",
  "results": [
    {
      "accountId": "acc-uuid-123",
      "accountName": "ALUA Produtora",
      "status": "success",
      "postsProcessed": 12,
      "tasksCreated": 3,
      "tasksUpdated": 9,
      "metricsUpdated": 12,
      "duration": 8500,
      "timestamp": "2024-01-15T10:45:00Z",
      "errors": []
    },
    {
      "accountId": "acc-uuid-456",
      "accountName": "ALUA Eventos",
      "status": "partial",
      "postsProcessed": 8,
      "tasksCreated": 1,
      "tasksUpdated": 7,
      "metricsUpdated": 8,
      "duration": 5200,
      "timestamp": "2024-01-15T10:45:00Z",
      "errors": [
        {
          "type": "CLICKUP_API",
          "message": "Failed to update task task-456",
          "context": {
            "postId": "post-789",
            "taskId": "task-456"
          }
        }
      ]
    }
  ],
  "totalDuration": 13700,
  "message": "Sync completed with 1 partial failure"
}
```

**Response (Error - 503):**

```json
{
  "success": false,
  "error": "SYNC_IN_PROGRESS",
  "message": "Another sync is already running. Please wait for it to complete"
}
```

---

### Get Sync History

Retrieves the history of synchronization operations.

```http
GET /admin/instagram/sync-history?accountId={accountId}&limit=10&offset=0
Authorization: Bearer {jwt_token}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| accountId | string | - | Filter by account ID (optional) |
| limit | number | 10 | Number of records to return (1-100) |
| offset | number | 0 | Pagination offset |
| status | string | - | Filter by status: success, partial, failed |
| startDate | string | - | ISO 8601 date (e.g., 2024-01-15) |
| endDate | string | - | ISO 8601 date (e.g., 2024-01-16) |

**Response (Success - 200):**

```json
{
  "success": true,
  "history": [
    {
      "syncId": "sync-uuid-789",
      "accountId": "acc-uuid-123",
      "accountName": "ALUA Produtora",
      "status": "success",
      "postsProcessed": 12,
      "tasksCreated": 3,
      "tasksUpdated": 9,
      "metricsUpdated": 12,
      "duration": 8500,
      "errorMessage": null,
      "startedAt": "2024-01-15T10:45:00Z",
      "completedAt": "2024-01-15T10:45:08Z"
    },
    {
      "syncId": "sync-uuid-790",
      "accountId": "acc-uuid-123",
      "accountName": "ALUA Produtora",
      "status": "failed",
      "postsProcessed": 0,
      "tasksCreated": 0,
      "tasksUpdated": 0,
      "metricsUpdated": 0,
      "duration": 2100,
      "errorMessage": "Circuit breaker triggered after 5 consecutive failures",
      "startedAt": "2024-01-15T10:40:00Z",
      "completedAt": "2024-01-15T10:40:02Z"
    }
  ],
  "total": 288,
  "limit": 10,
  "offset": 0
}
```

---

### Get Account Status

Retrieves the current status of all Instagram accounts.

```http
GET /admin/instagram/status
Authorization: Bearer {jwt_token}
```

**Query Parameters:** None

**Response (Success - 200):**

```json
{
  "success": true,
  "accounts": [
    {
      "accountId": "acc-uuid-123",
      "accountName": "ALUA Produtora",
      "isActive": true,
      "lastSyncTime": "2024-01-15T10:45:00Z",
      "nextSyncTime": "2024-01-15T10:50:00Z",
      "lastSyncStatus": "success",
      "lastError": null,
      "circuitBreakerStatus": "closed",
      "credentialStatus": "valid",
      "credentialExpiresAt": "2025-01-15T00:00:00Z",
      "postsCount": 42,
      "lastPostDate": "2024-01-15T09:30:00Z",
      "metrics": {
        "totalAlcance": 15420,
        "totalEngajamento": 1250,
        "totalImpressions": 28500,
        "averageEngajamentoRate": 4.4
      }
    },
    {
      "accountId": "acc-uuid-456",
      "accountName": "ALUA Eventos",
      "isActive": false,
      "lastSyncTime": "2024-01-14T15:00:00Z",
      "nextSyncTime": null,
      "lastSyncStatus": "failed",
      "lastError": "Invalid access token",
      "circuitBreakerStatus": "open",
      "credentialStatus": "expired",
      "credentialExpiresAt": "2024-01-10T00:00:00Z",
      "postsCount": 28,
      "lastPostDate": "2024-01-14T14:30:00Z",
      "metrics": {
        "totalAlcance": 8900,
        "totalEngajamento": 620,
        "totalImpressions": 16200,
        "averageEngajamentoRate": 3.8
      }
    }
  ],
  "syncSchedule": {
    "frequency": 5,
    "unit": "minutes",
    "nextGlobalSync": "2024-01-15T10:50:00Z"
  }
}
```

---

## Data Schemas

### Account Object

```typescript
interface InstagramAccount {
  accountId: string                    // UUID
  accountName: string                  // Display name
  businessAccountId: string            // Instagram Business Account ID
  isActive: boolean                    // Account enabled/disabled
  lastSyncTime: string | null          // ISO 8601 timestamp
  nextSyncTime: string | null          // ISO 8601 timestamp
  lastError: string | null             // Last error message
  postsCount: number                   // Total posts synced
  createdAt: string                    // ISO 8601 timestamp
  updatedAt: string                    // ISO 8601 timestamp
}
```

### Sync Result Object

```typescript
interface SyncResult {
  accountId: string
  accountName: string
  status: 'success' | 'partial' | 'failed'
  postsProcessed: number
  tasksCreated: number
  tasksUpdated: number
  metricsUpdated: number
  duration: number                     // milliseconds
  timestamp: string                    // ISO 8601
  errors: SyncError[]
}

interface SyncError {
  type: 'INSTAGRAM_API' | 'CLICKUP_API' | 'VALIDATION' | 'UNKNOWN'
  message: string
  context: Record<string, any>
}
```

### Post Object

```typescript
interface InstagramPost {
  id: string                           // Instagram post ID
  caption: string                      // Post caption/description
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  mediaUrl: string | null              // URL to media
  timestamp: string                    // ISO 8601 publication date
  permalink: string                    // Instagram post URL
  publishedAt: string                  // ISO 8601
}
```

### Metrics Object

```typescript
interface InstagramMetrics {
  postId: string
  alcance: number                      // Reach (unique users)
  engajamento: number                  // Total engagement
  impressoes: number                   // Total impressions
  cliques: number                      // Total clicks
  likes: number                        // Total likes
  comments: number                     // Total comments
  retrievedAt: string                  // ISO 8601 timestamp
}
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Account retrieved |
| 201 | Created | Account created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Account doesn't exist |
| 409 | Conflict | Duplicate account |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |
| 503 | Service Unavailable | Sync in progress |

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_CREDENTIALS | 400 | Instagram credentials invalid |
| MISSING_PERMISSIONS | 400 | Token lacks required permissions |
| INVALID_INPUT | 400 | Request validation failed |
| ACCOUNT_NOT_FOUND | 404 | Account doesn't exist |
| UNAUTHORIZED | 401 | Missing/invalid JWT |
| FORBIDDEN | 403 | User lacks permission |
| SYNC_IN_PROGRESS | 503 | Another sync running |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

### API Rate Limits

- **Requests per minute**: 60 (per user)
- **Concurrent requests**: 5 (per user)
- **Sync operations**: 1 (per account, per 5 minutes)

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705329900
```

### Rate Limit Response (429)

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Examples

### JavaScript/TypeScript

```typescript
// Add account
const response = await fetch('/api/admin/instagram/accounts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    accountName: 'ALUA Produtora',
    businessAccountId: '123456789',
    accessToken: 'EAAB...',
    clickupListId: 'list-123'
  })
})

const data = await response.json()
if (data.success) {
  console.log('Account created:', data.accountId)
} else {
  console.error('Error:', data.error, data.message)
}

// List accounts
const listResponse = await fetch('/api/admin/instagram/accounts', {
  headers: { 'Authorization': `Bearer ${token}` }
})

const accounts = await listResponse.json()
console.log('Accounts:', accounts.accounts)

// Manual sync
const syncResponse = await fetch('/api/admin/instagram/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})

const syncResult = await syncResponse.json()
console.log('Sync results:', syncResult.results)
```

### cURL

```bash
# Add account
curl -X POST http://localhost:3000/api/admin/instagram/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "ALUA Produtora",
    "businessAccountId": "123456789",
    "accessToken": "EAAB...",
    "clickupListId": "list-123"
  }'

# List accounts
curl -X GET http://localhost:3000/api/admin/instagram/accounts \
  -H "Authorization: Bearer $TOKEN"

# Manual sync
curl -X POST http://localhost:3000/api/admin/instagram/sync \
  -H "Authorization: Bearer $TOKEN"

# Get sync history
curl -X GET "http://localhost:3000/api/admin/instagram/sync-history?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get account status
curl -X GET http://localhost:3000/api/admin/instagram/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## Webhooks (Future)

Webhook support is planned for future releases to enable real-time synchronization.

```http
POST /api/instagram/webhooks
Content-Type: application/json
X-Hub-Signature-256: sha256=...

{
  "object": "instagram",
  "entry": [
    {
      "id": "123456789",
      "time": 1705329900,
      "changes": [
        {
          "value": {
            "media_id": "post-123",
            "caption": "New post",
            "media_type": "IMAGE"
          },
          "field": "media"
        }
      ]
    }
  ]
}
```

---

## Support

For API issues or questions:

1. Check error codes and messages above
2. Review logs in Admin interface
3. Check sync history for details
4. Contact system administrator

## Related Documentation

- [Service README](../lib/services/instagram/README.md)
- [Deployment Guide](./INSTAGRAM_DEPLOYMENT.md)
- [Monitoring Guide](./INSTAGRAM_MONITORING.md)
