# Instagram Business Integration Service

## Overview

The Instagram Business Integration Service provides a complete solution for synchronizing Instagram Business account data with the ALUA Produtora system. This service automatically fetches posts and metrics from Instagram, creates/updates ClickUp tasks, and maintains the Performance Dashboard with current data.

**Key Features:**
- Multi-account support (up to 3 Instagram Business accounts)
- Automatic synchronization every 5 minutes
- Secure credential storage with AES-256-GCM encryption
- Exponential backoff retry strategy with circuit breaker
- Rate limiting and batch processing
- Comprehensive error handling and logging
- Full audit trail for compliance

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Instagram Business API                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              InstagramService (instagram.service.ts)         │
│  - Validate credentials                                      │
│  - Fetch recent posts                                        │
│  - Fetch post metrics                                        │
│  - Retry with exponential backoff                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Normalizer   │ │ Mapper       │ │ Cache        │
│ (normalize   │ │ (map to      │ │ (store       │
│  posts &     │ │  ClickUp)    │ │  posts &     │
│  metrics)    │ │              │ │  metrics)    │
└──────────────┘ └──────────────┘ └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              InstagramSyncJob (instagram-sync.job.ts)        │
│  - Orchestrate sync process                                 │
│  - Handle multiple accounts                                 │
│  - Manage sync scheduling                                   │
│  - Store sync history                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Supabase DB  │ │ ClickUp API  │ │ Logging      │
│ (store       │ │ (create/     │ │ (audit &     │
│  credentials │ │  update      │ │  monitoring) │
│  & mappings) │ │  tasks)      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Project Structure

```
lib/
├── services/
│   ├── instagram/
│   │   ├── instagram.service.ts          # Main Instagram API service
│   │   ├── README.md                     # This file
│   │   └── __tests__/
│   │       └── instagram.service.test.ts # Unit tests
│   ├── credential-manager.ts             # Secure credential storage
│   ├── post-clickup-mapper.ts            # Instagram → ClickUp mapping
│   └── cache-manager.ts                  # Cache management
├── jobs/
│   └── instagram-sync.job.ts             # Sync job scheduler
├── utils/
│   ├── instagram/
│   │   ├── instagram-normalizer.ts       # Data normalization
│   │   └── __tests__/
│   │       └── instagram-normalizer.property.test.ts
│   ├── retry-strategy.ts                 # Retry logic
│   ├── rate-limiter.ts                   # Rate limiting
│   ├── batch-processor.ts                # Batch processing
│   └── logger.ts                         # Structured logging
├── types/
│   └── instagram.types.ts                # TypeScript types
└── config/
    └── instagram.config.ts               # Configuration

app/api/admin/instagram/
├── route.ts                              # POST/GET accounts
├── [accountId]/route.ts                  # PUT/DELETE account
├── sync/route.ts                         # POST manual sync
├── sync-history/route.ts                 # GET sync history
└── status/route.ts                       # GET account status

modules/admin/components/
├── InstagramAccountForm.tsx              # Add/edit account form
├── InstagramAccountList.tsx              # List of accounts
├── SyncJobStatus.tsx                     # Current sync status
└── SyncHistory.tsx                       # Sync history viewer

modules/performance/
├── components/
│   └── InstagramPostCard.tsx             # Post display component
└── hooks/
    └── useInstagramData.ts               # Data fetching hook
```

## Environment Variables

### Required Variables

```bash
# Encryption key for storing Instagram access tokens (32-byte hex string)
# Generate with: openssl rand -hex 32
INSTAGRAM_ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here

# Supabase configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Optional Variables (with defaults)

```bash
# Sync Job Configuration
INSTAGRAM_SYNC_FREQUENCY_MINUTES=5              # Default: 5 (min: 5, max: 60)
INSTAGRAM_MAX_CONCURRENT_ACCOUNTS=3             # Default: 3 (max: 10)
INSTAGRAM_SYNC_TIMEOUT_SECONDS=120              # Default: 120

# Rate Limiting
INSTAGRAM_RATE_LIMIT_POSTS_PER_SECOND=10        # Default: 10
INSTAGRAM_RATE_LIMIT_METRICS_PER_SECOND=20      # Default: 20
INSTAGRAM_RATE_LIMIT_MAX_CONCURRENT_REQUESTS=5  # Default: 5

# Cache Configuration
INSTAGRAM_CACHE_TTL_SECONDS=300                 # Default: 300 (5 minutes)
INSTAGRAM_CACHE_MAX_SIZE=1000                   # Default: 1000
INSTAGRAM_CACHE_STRATEGY=LRU                    # Default: LRU (or FIFO)

# Logging
INSTAGRAM_LOG_LEVEL=info                        # Default: info (debug, info, warn, error)
INSTAGRAM_DEBUG_MODE=false                      # Default: false

# Optional: External credential vault
INSTAGRAM_VAULT_URL=                            # Optional vault service URL
```

## Synchronization Flow

### 5-Minute Sync Cycle

```
1. Sync Job Triggered (every 5 minutes)
   ↓
2. Get Active Accounts from Database
   ↓
3. For Each Account (parallel processing, max 3):
   ├─ Fetch Recent Posts from Instagram API
   ├─ For Each Post:
   │  ├─ Check if Post Already Exists (by Instagram_Post_ID)
   │  ├─ Fetch Updated Metrics from Instagram API
   │  ├─ Validate Metrics (consistency checks)
   │  ├─ Create/Update ClickUp Task
   │  ├─ Update Post-ClickUp Mapping
   │  └─ Cache Post Data (5-minute TTL)
   └─ Update Sync History
   ↓
4. Sync Complete
   ├─ Log Results
   ├─ Send Alerts (if errors)
   └─ Update Dashboard Cache
```

### Error Handling

```
API Call Fails
   ↓
Retry with Exponential Backoff
   ├─ Attempt 1: Wait 1 second
   ├─ Attempt 2: Wait 2 seconds
   ├─ Attempt 3: Wait 4 seconds
   └─ Attempt 4: Wait 8 seconds (max 60s)
   ↓
After 3 Failed Retries
   ├─ Log Error with Full Context
   ├─ Skip Operation
   └─ Continue with Next Post/Account
   ↓
After 5 Consecutive Failures
   ├─ Trigger Circuit Breaker
   ├─ Stop Retrying
   ├─ Send Alert to Admins
   └─ Pause Sync for Account
```

## Configuring Instagram Accounts

### Step 1: Get Instagram Business Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "Instagram Graph API" product
4. Generate a long-lived access token with permissions:
   - `instagram_business_content_read`
   - `instagram_business_insights_read`
5. Get your Instagram Business Account ID from your Instagram settings

### Step 2: Configure in ALUA

1. Go to Admin → Instagram Integration
2. Click "Add Account"
3. Fill in the form:
   - **Account Name**: Display name (e.g., "ALUA Produtora")
   - **Business Account ID**: Your Instagram Business Account ID
   - **Access Token**: The long-lived token from Meta
   - **ClickUp List**: Select the ClickUp list for task creation
4. Click "Save"
5. System will validate credentials and start syncing

### Step 3: Monitor Sync

1. View sync status in Admin → Instagram Integration
2. Check sync history for any errors
3. View posts in Performance Dashboard

## API Endpoints

### Account Management

```bash
# Add new account
POST /api/admin/instagram/accounts
Content-Type: application/json
Authorization: Bearer {token}

{
  "accountName": "ALUA Produtora",
  "businessAccountId": "123456789",
  "accessToken": "EAAB...",
  "clickupListId": "list-123"
}

# List accounts
GET /api/admin/instagram/accounts
Authorization: Bearer {token}

# Update account
PUT /api/admin/instagram/accounts/{accountId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "accountName": "New Name",
  "clickupListId": "list-456",
  "isActive": true
}

# Delete account
DELETE /api/admin/instagram/accounts/{accountId}
Authorization: Bearer {token}
```

### Sync Operations

```bash
# Manual sync trigger
POST /api/admin/instagram/sync
Authorization: Bearer {token}

# Get sync history
GET /api/admin/instagram/sync-history?accountId={id}&limit=10&offset=0
Authorization: Bearer {token}

# Get account status
GET /api/admin/instagram/status
Authorization: Bearer {token}
```

## Troubleshooting

### Common Issues

#### 1. "Invalid Access Token"
- **Cause**: Token is expired or invalid
- **Solution**: 
  - Generate a new long-lived token from Meta for Developers
  - Update the account in Admin interface
  - Manually trigger sync

#### 2. "Missing Permissions"
- **Cause**: Token doesn't have required permissions
- **Solution**:
  - Go to Meta for Developers
  - Add `instagram_business_content_read` and `instagram_business_insights_read` permissions
  - Generate a new token
  - Update the account

#### 3. "Sync Timeout"
- **Cause**: Sync took longer than 120 seconds
- **Solution**:
  - Check Instagram API status
  - Reduce `INSTAGRAM_MAX_CONCURRENT_ACCOUNTS` if processing too many accounts
  - Increase `INSTAGRAM_SYNC_TIMEOUT_SECONDS` if needed

#### 4. "Circuit Breaker Triggered"
- **Cause**: 5 consecutive sync failures
- **Solution**:
  - Check logs for error details
  - Verify Instagram API credentials
  - Check network connectivity
  - Wait 30 minutes for circuit breaker to reset
  - Or manually trigger sync from Admin interface

#### 5. "Posts Not Appearing in Dashboard"
- **Cause**: Cache not updated or sync failed silently
- **Solution**:
  - Check sync history for errors
  - Manually trigger sync from Admin interface
  - Clear browser cache
  - Check that ClickUp list is correctly configured

### Debugging

#### Enable Debug Logging

```bash
# In .env.local
INSTAGRAM_LOG_LEVEL=debug
INSTAGRAM_DEBUG_MODE=true
```

#### Check Logs

```bash
# View recent logs
tail -f logs/instagram-sync.log

# Search for errors
grep "ERROR" logs/instagram-sync.log

# View specific account logs
grep "account-id-123" logs/instagram-sync.log
```

#### Manual Sync Test

```bash
# Trigger manual sync via API
curl -X POST http://localhost:3000/api/admin/instagram/sync \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# Check response for errors
```

## Performance Considerations

### Caching Strategy

- **Posts**: Cached for 5 minutes (configurable via `INSTAGRAM_CACHE_TTL_SECONDS`)
- **Metrics**: Cached with posts
- **Account Status**: Cached for 1 minute
- **Cache Size**: Max 1000 items (configurable via `INSTAGRAM_CACHE_MAX_SIZE`)
- **Strategy**: LRU (Least Recently Used) by default

### Rate Limiting

- **Posts API**: 10 requests/second
- **Metrics API**: 20 requests/second
- **Concurrent Requests**: Max 5 simultaneous
- **Batch Processing**: 10 posts per batch with 100ms delay between batches

### Database Optimization

- Indexed on `instagram_post_id` for fast lookups
- Indexed on `account_id` for account-specific queries
- Indexed on `created_at` for time-range queries
- Partitioned by account for multi-tenant isolation

## Security

### Credential Storage

- Access tokens are encrypted with AES-256-GCM
- Encryption key stored in environment variables (never in code)
- Tokens never exposed in logs or API responses
- Server-side only credential retrieval (no client-side access)

### Audit Logging

All credential operations are logged:
- CREATE: New account added
- UPDATE: Account configuration changed
- DELETE: Account removed
- VALIDATE: Credentials validated
- SYNC: Sync job executed

### Multi-Tenant Isolation

- All queries filtered by `client_id`
- Row-level security (RLS) enforced in Supabase
- Posts from one account never visible to another
- Credentials isolated per account

## Monitoring and Alerts

### Key Metrics

- **Sync Success Rate**: % of successful syncs
- **Average Sync Duration**: Time to complete sync
- **Posts Processed**: Number of posts per sync
- **Tasks Created/Updated**: ClickUp task operations
- **Error Rate**: % of failed operations

### Alert Conditions

- Sync failure (3 consecutive failures)
- Circuit breaker triggered
- Credential expiration
- API rate limit exceeded
- Sync timeout exceeded

### Dashboard

Access monitoring dashboard at: `/admin/instagram/monitoring`

## Maintenance

### Regular Tasks

- **Weekly**: Review sync history for errors
- **Monthly**: Check credential expiration dates
- **Quarterly**: Review and optimize cache settings
- **Annually**: Audit all configured accounts

### Backup and Recovery

- Sync history retained for 90 days
- Credentials backed up in Supabase
- Manual sync available for recovery
- Reconciliation tool for fixing inconsistencies

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review logs in Admin interface
3. Check sync history for error details
4. Contact system administrator

## Related Documentation

- [API Documentation](../../docs/INSTAGRAM_API.md)
- [Deployment Guide](../../docs/INSTAGRAM_DEPLOYMENT.md)
- [Monitoring Guide](../../docs/INSTAGRAM_MONITORING.md)
- [Design Document](../../.kiro/specs/instagram-business-integration/design.md)
- [Requirements Document](../../.kiro/specs/instagram-business-integration/requirements.md)
