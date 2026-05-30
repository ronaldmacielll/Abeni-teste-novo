# Instagram Integration API - Error Codes Reference

This document provides a comprehensive reference of all error codes and messages returned by the Instagram Integration API endpoints.

## HTTP Status Codes

### 200 OK
Request succeeded. Response body contains the requested data.

### 201 Created
Resource was successfully created. Response body contains the created resource.

### 400 Bad Request
The request was invalid or malformed. Common causes:
- Missing required fields
- Invalid field values
- Validation errors

### 401 Unauthorized
Authentication failed or is missing. Common causes:
- Missing Authorization header
- Invalid or expired JWT token
- Token format is incorrect

### 403 Forbidden
Authentication succeeded but user lacks permission. Common causes:
- User role is not 'internal'
- User does not own the resource
- Multi-tenant isolation violation

### 404 Not Found
The requested resource does not exist.

### 500 Internal Server Error
An unexpected server error occurred. Check logs for details.

### 502 Bad Gateway
Upstream service (Instagram API, ClickUp API) is unavailable.

### 503 Service Unavailable
The service is temporarily unavailable.

## Error Response Format

All error responses follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {} // Optional: additional context
}
```

## Endpoint-Specific Error Codes

### POST /api/admin/instagram/accounts

#### VALIDATION_ERROR
**Status**: 400
**Message**: "Validation error"
**Details**: Array of validation errors with field names and messages

**Example**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["accountName"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

#### INVALID_REQUEST_BODY
**Status**: 400
**Message**: "Invalid request body"
**Cause**: Request body is not valid JSON or missing required fields

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"
**Cause**: Authorization header is missing or doesn't start with "Bearer "

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"
**Cause**: JWT token doesn't contain client_id claim

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can manage Instagram accounts"
**Cause**: User role is not 'internal'

#### CLICKUP_LIST_NOT_FOUND
**Status**: 400
**Message**: "ClickUp list does not exist or is not accessible"
**Cause**: The provided ClickUp list ID is invalid or user doesn't have access

#### CLICKUP_VALIDATION_FAILED
**Status**: 400
**Message**: "Failed to validate ClickUp list"
**Cause**: Error communicating with ClickUp API (network error, API error, etc.)

#### INVALID_INSTAGRAM_CREDENTIALS
**Status**: 400
**Message**: "Invalid Instagram credentials or insufficient permissions"
**Cause**: 
- Access token is invalid or expired
- Token doesn't have required permissions
- Business account ID is invalid

#### INSTAGRAM_VALIDATION_FAILED
**Status**: 400
**Message**: "Failed to validate Instagram credentials"
**Cause**: Error communicating with Instagram API (network error, API error, etc.)

#### CREDENTIAL_STORAGE_FAILED
**Status**: 500
**Message**: "Failed to store account credentials"
**Cause**: Error storing encrypted credentials in database

#### ACCOUNT_MAPPING_FAILED
**Status**: 500
**Message**: "Failed to create account mapping"
**Cause**: Error creating account mapping in database

#### INTERNAL_SERVER_ERROR
**Status**: 500
**Message**: "Internal server error"
**Details**: Error message from the exception
**Cause**: Unexpected server error

### GET /api/admin/instagram/accounts

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can view Instagram accounts"

#### CREDENTIALS_RETRIEVAL_FAILED
**Status**: 500
**Message**: "Failed to retrieve accounts"
**Cause**: Error querying credentials from database

#### INTERNAL_SERVER_ERROR
**Status**: 500
**Message**: "Internal server error"

### PUT /api/admin/instagram/accounts/:accountId

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can manage Instagram accounts"

#### ACCOUNT_NOT_FOUND
**Status**: 404
**Message**: "Instagram account not found"
**Cause**: Account with provided ID doesn't exist or doesn't belong to user

#### CLICKUP_LIST_NOT_FOUND
**Status**: 400
**Message**: "ClickUp list does not exist or is not accessible"

#### UPDATE_FAILED
**Status**: 500
**Message**: "Failed to update account"

### DELETE /api/admin/instagram/accounts/:accountId

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can manage Instagram accounts"

#### MISSING_CONFIRMATION
**Status**: 400
**Message**: "Deletion requires confirmation"
**Cause**: Query parameter `confirm=true` is missing

#### ACCOUNT_NOT_FOUND
**Status**: 404
**Message**: "Instagram account not found"

#### DELETE_FAILED
**Status**: 500
**Message**: "Failed to delete account"

### POST /api/admin/instagram/sync

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can trigger sync"

#### NO_ACTIVE_ACCOUNTS
**Status**: 400
**Message**: "No active Instagram accounts configured"

#### SYNC_FAILED
**Status**: 500
**Message**: "Failed to trigger sync"

### GET /api/admin/instagram/sync-history

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can view sync history"

#### HISTORY_RETRIEVAL_FAILED
**Status**: 500
**Message**: "Failed to retrieve sync history"

### GET /api/admin/instagram/status

#### MISSING_AUTH_HEADER
**Status**: 401
**Message**: "Missing or invalid authorization header"

#### MISSING_CLIENT_ID
**Status**: 403
**Message**: "Missing client_id in JWT token"

#### INSUFFICIENT_PERMISSIONS
**Status**: 403
**Message**: "Only internal users can view status"

#### STATUS_RETRIEVAL_FAILED
**Status**: 500
**Message**: "Failed to retrieve status"

## Common Error Scenarios

### Scenario: Token Expired
**Error**: INVALID_INSTAGRAM_CREDENTIALS
**Message**: "Invalid Instagram credentials or insufficient permissions"
**Solution**: Refresh the Instagram access token and update the account configuration

### Scenario: ClickUp API Rate Limited
**Error**: CLICKUP_VALIDATION_FAILED
**Message**: "Failed to validate ClickUp list"
**Solution**: Wait a few minutes and retry. Consider implementing exponential backoff

### Scenario: Network Timeout
**Error**: INSTAGRAM_VALIDATION_FAILED or CLICKUP_VALIDATION_FAILED
**Message**: "Failed to validate [service]"
**Solution**: Check network connectivity and retry

### Scenario: Invalid Permissions
**Error**: INVALID_INSTAGRAM_CREDENTIALS
**Message**: "Invalid Instagram credentials or insufficient permissions"
**Solution**: Ensure token has these permissions:
- instagram_business_content_read
- instagram_business_insights_read

## Debugging Tips

1. **Check Authorization Header**: Ensure it's in format `Authorization: Bearer <token>`
2. **Verify JWT Claims**: Decode JWT to verify it contains `client_id` and `role` claims
3. **Check User Role**: Only 'internal' role users can access admin endpoints
4. **Validate Input**: Ensure all required fields are provided and valid
5. **Check Logs**: Server logs contain detailed error information for debugging
6. **Test with curl**: Use curl to test endpoints with different parameters

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Instagram API**: 10 posts/second, 20 metrics/second
- **ClickUp API**: 5 requests/second
- **Sync Job**: 1 sync per account per 5 minutes

If rate limited, the API will return a 429 status code with retry information.

## Monitoring and Alerts

The system logs all errors with context for monitoring:
- Error type and message
- Request parameters (sanitized)
- User ID and client ID
- Timestamp
- Stack trace (for debugging)

Monitor these error patterns:
- Repeated INVALID_INSTAGRAM_CREDENTIALS → Token may be expiring
- Repeated CLICKUP_VALIDATION_FAILED → ClickUp API issues
- Repeated CREDENTIAL_STORAGE_FAILED → Database issues
