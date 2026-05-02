# GET /api/posts

BFF endpoint for retrieving social media post metrics from ClickUp.

## Authentication

Requires a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT token must contain a `client_id` claim for multi-tenant data isolation.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Time period filter. Valid values: `week`, `month` |

## Request Example

```bash
curl -X GET "http://localhost:3000/api/posts?period=week" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Response

### Success Response (200 OK)

```json
{
  "posts": [
    {
      "id": "task-123",
      "title": "Instagram Post - Product Launch",
      "imageUrl": "https://example.com/image.jpg",
      "status": "Publicado",
      "metrics": {
        "alcance": 15000,
        "engajamento": 1200,
        "impressoes": 25000,
        "cliques": 450
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "clientId": "client-abc-123"
    }
  ],
  "metadata": {
    "total": 1,
    "period": "week",
    "startDate": "2024-01-08T00:00:00.000Z",
    "endDate": "2024-01-15T23:59:59.999Z"
  }
}
```

### Response Headers

```
Cache-Control: private, max-age=300
Content-Type: application/json
```

The response is cached for 5 minutes (300 seconds) to optimize performance.

## Error Responses

### 400 Bad Request

Invalid query parameters.

```json
{
  "error": "Invalid period parameter. Must be \"week\" or \"month\""
}
```

### 401 Unauthorized

Missing or invalid Authorization header.

```json
{
  "error": "Missing or invalid authorization header"
}
```

### 403 Forbidden

JWT token does not contain a valid `client_id`.

```json
{
  "error": "Missing client_id in JWT token"
}
```

### 500 Internal Server Error

Unexpected server error.

```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```

### 502 Bad Gateway

ClickUp API is unavailable or returned an error.

```json
{
  "error": "Failed to fetch data from ClickUp API",
  "message": "ClickUp API error: 500 Internal Server Error"
}
```

## Data Flow

1. **JWT Validation**: Extract and validate JWT token from Authorization header
2. **Client ID Extraction**: Extract `client_id` from JWT token
3. **Period Calculation**: Calculate date range based on `period` parameter
4. **ClickUp API Call**: Fetch tasks from ClickUp performance list
5. **Data Normalization**: Transform ClickUp tasks to Post objects
6. **Multi-Tenant Filtering**: Filter posts by `client_id`
7. **Date Filtering**: Filter posts by date range
8. **Response**: Return posts with metadata

## Multi-Tenant Isolation

All posts are filtered by the `client_id` extracted from the JWT token. This ensures that:
- Clients can only access their own data
- Data from different clients is never mixed
- Authorization is enforced at the BFF layer

## Caching Strategy

The endpoint implements HTTP caching with:
- **Cache-Control**: `private, max-age=300` (5 minutes)
- **Private**: Response is specific to the authenticated user
- **Max-Age**: Response can be cached for 5 minutes

Frontend applications should use React Query or SWR with:
- **staleTime**: 5 minutes (300,000ms)
- **cacheTime**: 10 minutes (600,000ms)
- **Background revalidation**: Enabled

## Environment Variables

The following environment variables must be configured:

```bash
# ClickUp API Configuration
CLICKUP_API_KEY=your_api_key
CLICKUP_PERFORMANCE_LIST_ID=your_list_id

# ClickUp Custom Field IDs
CLICKUP_FIELD_ALCANCE=field_id
CLICKUP_FIELD_ENGAJAMENTO=field_id
CLICKUP_FIELD_IMPRESSOES=field_id
CLICKUP_FIELD_CLIQUES=field_id
CLICKUP_FIELD_STATUS=field_id
CLICKUP_FIELD_IMAGEM=field_id
```

## Testing

Run the integration tests:

```bash
npm test -- app/api/posts/route.test.ts
```

The test suite covers:
- JWT validation and authorization
- Period filtering (week, month)
- Data retrieval and normalization
- Multi-tenant isolation
- Error handling (401, 403, 400, 500, 502)
- Response headers and caching

## Performance Considerations

- **ClickUp API**: Implements retry logic with exponential backoff for rate limiting
- **Response Time**: Target < 2 seconds for typical requests
- **Caching**: 5-minute cache reduces load on ClickUp API
- **Compression**: Responses > 1KB are compressed (handled by Next.js)

## Security

- **API Key Protection**: ClickUp API key is never exposed to the client
- **JWT Validation**: All requests must include a valid JWT token
- **Multi-Tenant Isolation**: Strict filtering by `client_id`
- **Error Messages**: Internal details are not exposed in error responses
