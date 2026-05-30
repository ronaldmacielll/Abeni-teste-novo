# Instagram Business Integration - Complete Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Overview

The Instagram Business Integration is a complete solution for synchronizing Instagram Business account data with the ALUA Produtora system. It automatically fetches posts and metrics from Instagram, creates/updates ClickUp tasks, and displays performance data in the dashboard.

**Key Capabilities**:
- ✅ Multi-account support (up to 3 accounts)
- ✅ Automatic 5-minute synchronization
- ✅ Secure credential storage (AES-256-GCM encryption)
- ✅ Exponential backoff retry strategy
- ✅ Rate limiting and batch processing
- ✅ Comprehensive error handling
- ✅ Full audit trail
- ✅ Real-time monitoring

## Quick Start

### 1. Get Instagram Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "Instagram Graph API" product
4. Generate a long-lived access token with permissions:
   - `instagram_business_content_read`
   - `instagram_business_insights_read`
5. Get your Instagram Business Account ID

### 2. Configure in ALUA

1. Go to Admin → Instagram Integration
2. Click "Add Account"
3. Fill in:
   - **Account Name**: Display name (e.g., "ALUA Produtora")
   - **Business Account ID**: Your Instagram Business Account ID
   - **Access Token**: The long-lived token from Meta
   - **ClickUp List**: Select the ClickUp list for task creation
4. Click "Save"

### 3. Monitor Sync

1. View sync status in Admin → Instagram Integration
2. Check sync history for any errors
3. View posts in Performance Dashboard

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Instagram Business API                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              InstagramService                               │
│  - Validate credentials                                      │
│  - Fetch posts and metrics                                   │
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
│              InstagramSyncJob                               │
│  - Orchestrate sync process                                 │
│  - Handle multiple accounts                                 │
│  - Manage sync scheduling                                   │
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

### Data Flow

```
1. Sync Job Triggered (every 5 minutes)
   ↓
2. Get Active Accounts from Database
   ↓
3. For Each Account (parallel, max 3):
   ├─ Fetch Recent Posts from Instagram API
   ├─ For Each Post:
   │  ├─ Check if Post Already Exists
   │  ├─ Fetch Updated Metrics
   │  ├─ Validate Metrics
   │  ├─ Create/Update ClickUp Task
   │  ├─ Update Post-ClickUp Mapping
   │  └─ Cache Post Data
   └─ Update Sync History
   ↓
4. Sync Complete
   ├─ Log Results
   ├─ Send Alerts (if errors)
   └─ Update Dashboard Cache
```

## Features

### 1. Multi-Account Support

- Configure up to 3 Instagram Business accounts
- Each account syncs independently
- Parallel processing for efficiency
- Account isolation for security

### 2. Automatic Synchronization

- Runs every 5 minutes (configurable)
- Fetches posts from last 24 hours
- Updates metrics for all posts
- Creates/updates ClickUp tasks

### 3. Secure Credential Storage

- AES-256-GCM encryption
- Server-side only access
- Never exposed in logs or API responses
- Audit trail for all access

### 4. Error Handling

- Exponential backoff retry (1s, 2s, 4s, 8s, max 60s)
- Circuit breaker after 5 consecutive failures
- Detailed error logging
- Automatic recovery

### 5. Performance Optimization

- 5-minute cache for posts
- Batch processing (10 posts per batch)
- Rate limiting (10 posts/sec, 20 metrics/sec)
- Database indexing for fast lookups

### 6. Monitoring and Alerting

- Structured JSON logging
- Real-time sync status
- Error alerts via email/Slack
- Performance dashboards

## Configuration

### Environment Variables

```bash
# Required
INSTAGRAM_ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here

# Optional (with defaults)
INSTAGRAM_SYNC_FREQUENCY_MINUTES=5              # Default: 5
INSTAGRAM_MAX_CONCURRENT_ACCOUNTS=3             # Default: 3
INSTAGRAM_SYNC_TIMEOUT_SECONDS=120              # Default: 120
INSTAGRAM_RATE_LIMIT_POSTS_PER_SECOND=10        # Default: 10
INSTAGRAM_RATE_LIMIT_METRICS_PER_SECOND=20      # Default: 20
INSTAGRAM_CACHE_TTL_SECONDS=300                 # Default: 300
INSTAGRAM_LOG_LEVEL=info                        # Default: info
```

### Generate Encryption Key

```bash
# Generate a 32-byte hex encryption key
openssl rand -hex 32

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## Usage

### Admin Interface

**Location**: `/admin/instagram`

**Features**:
- Add/edit/delete accounts
- View sync status
- View sync history
- Manually trigger sync
- Monitor account health

### API Endpoints

```bash
# Add account
POST /api/admin/instagram/accounts

# List accounts
GET /api/admin/instagram/accounts

# Update account
PUT /api/admin/instagram/accounts/{accountId}

# Delete account
DELETE /api/admin/instagram/accounts/{accountId}

# Manual sync
POST /api/admin/instagram/sync

# Get sync history
GET /api/admin/instagram/sync-history

# Get account status
GET /api/admin/instagram/status
```

### Performance Dashboard

**Location**: `/performance`

**Features**:
- View Instagram posts alongside ClickUp posts
- Filter by source (Instagram, ClickUp, All)
- Filter by account
- View all metrics (Alcance, Engajamento, Impressões, etc.)
- Sort by date, engagement, reach

## Troubleshooting

### Common Issues

#### 1. "Invalid Access Token"

**Cause**: Token is expired or invalid

**Solution**:
1. Generate a new token from Meta for Developers
2. Update the account in Admin interface
3. Manually trigger sync

#### 2. "Missing Permissions"

**Cause**: Token doesn't have required permissions

**Solution**:
1. Go to Meta for Developers
2. Add required permissions
3. Generate a new token
4. Update the account

#### 3. "Sync Timeout"

**Cause**: Sync took longer than 120 seconds

**Solution**:
1. Check Instagram API status
2. Reduce `INSTAGRAM_MAX_CONCURRENT_ACCOUNTS`
3. Increase `INSTAGRAM_SYNC_TIMEOUT_SECONDS`

#### 4. "Circuit Breaker Triggered"

**Cause**: 5 consecutive sync failures

**Solution**:
1. Check logs for error details
2. Verify credentials
3. Check network connectivity
4. Wait 30 minutes for reset or manually trigger sync

#### 5. "Posts Not Appearing"

**Cause**: Cache not updated or sync failed

**Solution**:
1. Check sync history for errors
2. Manually trigger sync
3. Clear browser cache
4. Verify ClickUp list configuration

### Debug Mode

Enable debug logging:

```bash
# In .env.local
INSTAGRAM_LOG_LEVEL=debug
INSTAGRAM_DEBUG_MODE=true
```

View logs:

```bash
# Vercel logs
vercel logs --prod

# Search for errors
grep "ERROR" logs/instagram-sync.log

# View specific account
grep "account-id-123" logs/instagram-sync.log
```

## FAQ

### Q: How often does sync run?

**A**: By default, every 5 minutes. This is configurable via `INSTAGRAM_SYNC_FREQUENCY_MINUTES` (min: 5, max: 60).

### Q: How many accounts can I configure?

**A**: Up to 3 Instagram Business accounts per client.

### Q: Are my Instagram credentials secure?

**A**: Yes. Credentials are encrypted with AES-256-GCM and never exposed in logs or API responses.

### Q: What happens if sync fails?

**A**: The system retries with exponential backoff (1s, 2s, 4s, 8s, max 60s). After 5 consecutive failures, the circuit breaker triggers and sync pauses until manually reset.

### Q: Can I manually trigger sync?

**A**: Yes. Go to Admin → Instagram Integration and click "Manual Sync" or use the API endpoint.

### Q: How long does sync take?

**A**: Typically 5-15 seconds per account. Maximum timeout is 120 seconds.

### Q: What metrics are synced?

**A**: Alcance (reach), Engajamento (engagement), Impressões (impressions), Cliques (clicks), Likes, Comments.

### Q: Can I see sync history?

**A**: Yes. Go to Admin → Instagram Integration → Sync History. History is retained for 90 days.

### Q: What if my token expires?

**A**: The system will alert you 7 days before expiration. Generate a new token and update the account in Admin interface.

### Q: Can I delete an account?

**A**: Yes. Go to Admin → Instagram Integration, select account, and click "Delete". This removes all associated data.

### Q: How do I troubleshoot sync failures?

**A**: Check the sync history for error details, review logs, verify credentials, and check Instagram API status.

### Q: Is there a webhook support?

**A**: Webhook support is planned for future releases to enable real-time synchronization.

### Q: Can I export sync history?

**A**: Yes. Use the API endpoint `GET /api/admin/instagram/sync-history` with appropriate filters.

### Q: How do I monitor performance?

**A**: Use the monitoring dashboard at `/admin/instagram/monitoring` or check logs in Vercel Dashboard.

## Related Documentation

- [Service README](../lib/services/instagram/README.md)
- [API Documentation](./INSTAGRAM_API.md)
- [Deployment Guide](./INSTAGRAM_DEPLOYMENT.md)
- [Monitoring Guide](./INSTAGRAM_MONITORING.md)
- [Design Document](../.kiro/specs/instagram-business-integration/design.md)
- [Requirements Document](../.kiro/specs/instagram-business-integration/requirements.md)

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review logs in Admin interface
3. Check sync history for error details
4. Contact system administrator

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
