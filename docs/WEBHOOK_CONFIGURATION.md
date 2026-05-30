# Webhook Configuration Interface

## Overview

The webhook configuration interface allows administrators to enable/disable webhooks per Instagram Business account and displays the webhook URL needed for Instagram setup.

**Implements Requirements:** 20.1, 20.6

## Features

### 1. Webhook Configuration Component

The `WebhookConfiguration` component provides a user-friendly interface for managing webhooks:

- **Toggle Button**: Enable/disable webhooks for an account
- **Webhook URL Display**: Shows the webhook URL with copy-to-clipboard functionality
- **Status Badge**: Displays current webhook status (Enabled/Disabled)
- **Setup Instructions**: Provides step-by-step instructions for configuring webhooks in Instagram
- **Error Handling**: Displays error messages when operations fail

### 2. API Endpoints

#### GET `/api/admin/instagram/accounts/:accountId/webhooks`

Retrieves webhook configuration for a specific account.

**Request:**
```bash
curl -X GET https://your-domain.com/api/admin/instagram/accounts/test-account-123/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "accountId": "test-account-123",
  "accountName": "My Instagram Account",
  "webhooksEnabled": true,
  "webhookUrl": "https://your-domain.com/api/instagram/webhooks",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

#### PUT `/api/admin/instagram/accounts/:accountId/webhooks`

Updates webhook configuration for a specific account.

**Request:**
```bash
curl -X PUT https://your-domain.com/api/admin/instagram/accounts/test-account-123/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooksEnabled": true
  }'
```

**Response:**
```json
{
  "success": true,
  "accountId": "test-account-123",
  "accountName": "My Instagram Account",
  "webhooksEnabled": true,
  "webhookUrl": "https://your-domain.com/api/instagram/webhooks",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

### 3. React Hook

The `useWebhookConfiguration` hook provides a convenient way to manage webhook configuration in React components:

```typescript
import { useWebhookConfiguration } from '@/modules/admin/hooks/useWebhookConfiguration'

function MyComponent() {
  const { config, isLoading, error, toggleWebhook } = useWebhookConfiguration({
    accountId: 'test-account-123',
    token: 'your-auth-token',
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <p>Webhooks: {config?.webhooksEnabled ? 'Enabled' : 'Disabled'}</p>
      <button onClick={() => toggleWebhook(!config?.webhooksEnabled)}>
        Toggle Webhooks
      </button>
    </div>
  )
}
```

## Integration Guide

### 1. Add Webhook Configuration to Admin Page

To integrate the webhook configuration interface into your admin page:

```typescript
import { WebhookConfiguration } from '@/modules/admin/components'
import { useWebhookConfiguration } from '@/modules/admin/hooks/useWebhookConfiguration'

export function AdminInstagramPage() {
  const { config, isLoading, error, toggleWebhook } = useWebhookConfiguration({
    accountId: selectedAccountId,
    token: authToken,
  })

  return (
    <WebhookConfiguration
      accountId={selectedAccountId}
      accountName={selectedAccountName}
      webhooksEnabled={config?.webhooksEnabled || false}
      webhookUrl={config?.webhookUrl || ''}
      onToggleWebhook={toggleWebhook}
      isLoading={isLoading}
      error={error}
    />
  )
}
```

### 2. Database Setup

The webhook configuration requires a new table in Supabase:

```sql
CREATE TABLE instagram_webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) NOT NULL UNIQUE REFERENCES instagram_credentials(account_id),
  webhooks_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instagram_webhook_config_account_id ON instagram_webhook_config(account_id);
```

### 3. Environment Variables

Ensure the following environment variables are set:

```bash
# Webhook configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token
INSTAGRAM_APP_SECRET=your-app-secret
```

## Usage Flow

### For Administrators

1. **Navigate to Admin Instagram Page**
   - Go to the Instagram administration interface
   - Select an account from the list

2. **View Webhook Configuration**
   - The webhook configuration section displays the current status
   - Shows whether webhooks are enabled or disabled

3. **Enable/Disable Webhooks**
   - Click the toggle button to enable or disable webhooks
   - The system will update the configuration

4. **Copy Webhook URL**
   - Click the "Copy" button to copy the webhook URL to clipboard
   - Use this URL when configuring webhooks in Instagram

5. **Configure in Instagram**
   - Follow the provided instructions to configure webhooks in Instagram App Dashboard
   - Paste the webhook URL in the callback URL field
   - Subscribe to the desired events (feed, comments, mentions, stories)

### For Developers

#### Using the Component

```typescript
import { WebhookConfiguration } from '@/modules/admin/components'

<WebhookConfiguration
  accountId="account-123"
  accountName="My Account"
  webhooksEnabled={true}
  webhookUrl="https://example.com/api/instagram/webhooks"
  onToggleWebhook={async (accountId, enabled) => {
    // Handle webhook toggle
  }}
/>
```

#### Using the Hook

```typescript
import { useWebhookConfiguration } from '@/modules/admin/hooks/useWebhookConfiguration'

const { config, toggleWebhook, isLoading, error } = useWebhookConfiguration({
  accountId: 'account-123',
  token: 'auth-token',
})

// Toggle webhook
await toggleWebhook(true)
```

#### Using the API

```typescript
// Get webhook configuration
const response = await fetch('/api/admin/instagram/account-123/webhooks', {
  headers: { 'Authorization': 'Bearer token' },
})
const config = await response.json()

// Update webhook configuration
const updateResponse = await fetch('/api/admin/instagram/account-123/webhooks', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ webhooksEnabled: true }),
})
const updatedConfig = await updateResponse.json()
```

## Webhook Events

When webhooks are enabled, the system receives real-time notifications from Instagram for:

- **Feed Events**: New posts published or edited
- **Comments Events**: New comments on posts
- **Mentions Events**: Account mentions in posts or comments
- **Stories Events**: New stories published

Each event triggers an immediate sync for the affected post, ensuring metrics are updated in real-time.

## Error Handling

The webhook configuration interface handles various error scenarios:

| Error | Cause | Resolution |
|-------|-------|-----------|
| Account not found | Account ID doesn't exist | Verify account ID is correct |
| Invalid token | Authentication failed | Re-authenticate and try again |
| Failed to update | Server error | Check server logs and retry |
| Network error | Connection issue | Check internet connection and retry |

## Performance Considerations

- **Caching**: Webhook configuration is cached for 5 minutes
- **Real-time Updates**: Configuration changes are reflected immediately
- **Async Operations**: Toggle operations run asynchronously without blocking UI
- **Error Recovery**: Failed operations can be retried without page reload

## Security

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Only account owners can modify webhook configuration
- **Encryption**: Webhook URLs are transmitted over HTTPS
- **Validation**: All inputs are validated before processing

## Testing

### Unit Tests

```bash
npm test -- modules/admin/components/WebhookConfiguration.test.tsx
npm test -- modules/admin/hooks/useWebhookConfiguration.test.ts
npm test -- app/api/admin/instagram/[accountId]/webhooks/route.test.ts
```

### Integration Tests

```bash
npm test -- --testPathPattern="webhook"
```

### Manual Testing

1. **Enable Webhooks**
   - Navigate to admin page
   - Select an account
   - Click toggle to enable webhooks
   - Verify status changes to "Enabled"

2. **Copy Webhook URL**
   - Click copy button
   - Verify URL is copied to clipboard
   - Paste in Instagram configuration

3. **Disable Webhooks**
   - Click toggle to disable webhooks
   - Verify status changes to "Disabled"

4. **Error Handling**
   - Try with invalid token
   - Try with non-existent account
   - Verify error messages display correctly

## Future Enhancements

- [ ] Webhook event history viewer
- [ ] Webhook delivery status monitoring
- [ ] Webhook retry configuration
- [ ] Webhook event filtering
- [ ] Webhook event batching
- [ ] Webhook health dashboard

## References

- [Instagram Business API Webhooks](https://developers.facebook.com/docs/instagram-api/webhooks)
- [Webhook Signature Verification](https://developers.facebook.com/docs/instagram-api/webhooks#signature-verification)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

## Support

For issues or questions about webhook configuration:

1. Check the error message displayed in the UI
2. Review the server logs for detailed error information
3. Verify environment variables are correctly set
4. Ensure database table exists and is properly configured
5. Contact support with error details and account ID
