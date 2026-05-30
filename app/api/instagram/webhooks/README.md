# Instagram Webhook Endpoint

This endpoint receives webhook events from Instagram Business API and triggers immediate synchronization of affected posts.

## Overview

The webhook endpoint implements the Instagram Business API webhook protocol:
- **GET** requests are used for webhook verification (Instagram sends a challenge)
- **POST** requests receive webhook events with signature validation

## Endpoint Details

### GET /api/instagram/webhooks

Used by Instagram to verify the webhook URL during setup.

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Must match `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` environment variable
- `hub.challenge` - Random string that must be echoed back

**Response:**
```json
{
  "hub": {
    "challenge": "challenge-string"
  }
}
```

**Status Codes:**
- `200` - Webhook verified successfully
- `400` - Missing required parameters
- `403` - Invalid verify token
- `500` - Configuration error

### POST /api/instagram/webhooks

Receives webhook events from Instagram.

**Headers:**
- `x-hub-signature-256` - HMAC-SHA256 signature of the request body (format: `sha256=<hex>`)
- `content-type` - Should be `application/json`

**Request Body:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "business-account-id",
      "time": 1234567890,
      "changes": [
        {
          "field": "feed",
          "value": {
            "media_id": "post-id",
            "caption": "Post caption",
            "media_type": "IMAGE",
            "timestamp": 1234567890
          }
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received and sync triggered",
  "accountId": "business-account-id",
  "postIds": 1
}
```

**Status Codes:**
- `200` - Webhook processed successfully
- `400` - Invalid payload or missing signature
- `403` - Invalid signature or inactive account
- `404` - Account not configured
- `500` - Server error

## Webhook Events

The endpoint handles the following event types:

### Feed Events
- **field**: `feed`
- **value.media_id**: Instagram post ID
- **Triggered when**: A new post is published or an existing post is edited

### Comments Events
- **field**: `comments`
- **value.comment_id**: Instagram comment ID
- **Triggered when**: A new comment is added to a post

### Mentions Events
- **field**: `mentions`
- **value.mention_id**: Instagram mention ID
- **Triggered when**: The account is mentioned in a post or comment

### Stories Events
- **field**: `stories`
- **value.story_id**: Instagram story ID
- **Triggered when**: A new story is published

## Signature Validation

Instagram signs all webhook requests using HMAC-SHA256. The signature is computed as:

```
signature = HMAC-SHA256(request_body, app_secret)
```

The endpoint validates the signature by:
1. Extracting the signature from the `x-hub-signature-256` header
2. Computing the expected signature using the request body and app secret
3. Comparing the signatures using constant-time comparison (to prevent timing attacks)

## Sync Triggering

When a valid webhook is received:
1. The endpoint extracts the account ID and post IDs from the webhook payload
2. It verifies that the account is configured and active
3. It triggers an immediate sync job for that account
4. The sync job fetches updated metrics from Instagram and updates ClickUp tasks

The sync job runs asynchronously in the background, so the webhook response is returned immediately.

## Environment Variables

Required environment variables:

```bash
# Instagram App Secret (used for signature validation)
INSTAGRAM_APP_SECRET=your-app-secret

# Webhook Verification Token (used for webhook URL verification)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Encryption key for storing credentials
INSTAGRAM_ENCRYPTION_KEY=your-32-byte-hex-key

# Other Instagram configuration
INSTAGRAM_SYNC_FREQUENCY_MINUTES=5
INSTAGRAM_MAX_CONCURRENT_ACCOUNTS=3
```

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env.local`:

```bash
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### 2. Register Webhook with Instagram

In the Instagram App Dashboard:

1. Go to **Settings** → **Basic**
2. Copy your **App Secret**
3. Go to **Messenger** → **Settings** → **Webhooks**
4. Click **Add Callback URL**
5. Enter your webhook URL: `https://your-domain.com/api/instagram/webhooks`
6. Enter your verify token (same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)
7. Click **Verify and Save**

### 3. Subscribe to Webhook Events

In the Instagram App Dashboard:

1. Go to **Messenger** → **Settings** → **Webhooks**
2. Select your app
3. Click **Subscribe to this object**
4. Select the events you want to receive:
   - `feed` - For new/edited posts
   - `comments` - For new comments
   - `mentions` - For mentions
   - `stories` - For new stories

## Testing

### Manual Testing

You can test the webhook endpoint using curl:

```bash
# Test webhook verification
curl -X GET "http://localhost:3000/api/instagram/webhooks?hub.mode=subscribe&hub.verify_token=test-token&hub.challenge=test-challenge"

# Test webhook event (requires valid signature)
curl -X POST http://localhost:3000/api/instagram/webhooks \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=<signature>" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "123456789",
      "time": 1234567890,
      "changes": [{
        "field": "feed",
        "value": {"media_id": "post-123"}
      }]
    }]
  }'
```

### Automated Testing

Run the test suite:

```bash
npm test -- app/api/instagram/webhooks/route.test.ts
npm test -- lib/utils/webhook-validator.test.ts
```

## Monitoring and Logging

All webhook events are logged with:
- Timestamp
- Account ID
- Event type
- Post IDs
- Processing time
- Status (success/error)

Logs are stored in the database table `instagram_webhook_events` for monitoring and debugging.

## Error Handling

The endpoint handles various error scenarios:

| Error | Status | Cause | Resolution |
|-------|--------|-------|-----------|
| Missing signature | 400 | Webhook request missing header | Check Instagram webhook configuration |
| Invalid signature | 403 | Signature validation failed | Verify app secret is correct |
| Invalid payload | 400 | Malformed JSON or missing fields | Check webhook payload format |
| Account not found | 404 | Account not configured in system | Configure account in admin interface |
| Account inactive | 403 | Account is disabled | Enable account in admin interface |
| Sync failed | 500 | Error triggering sync job | Check logs for details |

## Rate Limiting

The endpoint does not implement rate limiting itself, but Instagram enforces rate limits on webhook delivery:
- Instagram will retry failed webhooks with exponential backoff
- After multiple failures, Instagram may disable the webhook

## Security Considerations

1. **Signature Validation**: All webhook requests are validated using HMAC-SHA256
2. **Constant-Time Comparison**: Signature comparison uses constant-time comparison to prevent timing attacks
3. **Account Verification**: Only configured and active accounts can trigger syncs
4. **Async Processing**: Sync jobs run asynchronously to prevent blocking the webhook response
5. **Logging**: All webhook events are logged for audit and debugging purposes

## Future Enhancements

- [ ] Webhook retry logic with exponential backoff
- [ ] Webhook event deduplication (prevent processing duplicate events)
- [ ] Webhook event filtering (only process specific event types)
- [ ] Webhook event batching (process multiple events in a single sync)
- [ ] Webhook health monitoring (track webhook delivery success rate)
- [ ] Webhook configuration UI (enable/disable webhooks per account)

## References

- [Instagram Business API Webhooks](https://developers.facebook.com/docs/instagram-api/webhooks)
- [Webhook Signature Verification](https://developers.facebook.com/docs/instagram-api/webhooks#signature-verification)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

