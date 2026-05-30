# Instagram Integration Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Instagram Business Integration to production on Vercel. It covers environment setup, database configuration, scheduler setup, and production verification.

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Code reviewed and merged to main branch
- [ ] Environment variables prepared
- [ ] Database migrations tested
- [ ] Staging environment verified
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

## Environment Variables

### Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# ============================================================================
# Supabase Configuration (Production)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# ============================================================================
# Instagram Integration Configuration
# ============================================================================

# REQUIRED: Encryption key for storing Instagram access tokens
# Generate with: openssl rand -hex 32
# IMPORTANT: Keep this secret and never commit to version control
INSTAGRAM_ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here

# Optional: External credential vault service URL
# If not set, credentials are stored encrypted in Supabase
INSTAGRAM_VAULT_URL=

# ============================================================================
# Sync Job Configuration
# ============================================================================

# Frequency of automatic Instagram sync in minutes
# Recommended: 5 minutes for production
# Min: 5, Max: 60
INSTAGRAM_SYNC_FREQUENCY_MINUTES=5

# Maximum number of Instagram accounts to process in parallel
# Recommended: 3 for production
# Max: 10
INSTAGRAM_MAX_CONCURRENT_ACCOUNTS=3

# Timeout for sync job in seconds
# Recommended: 120 for production
INSTAGRAM_SYNC_TIMEOUT_SECONDS=120

# ============================================================================
# Rate Limiting Configuration
# ============================================================================

# Instagram API rate limits (per second)
INSTAGRAM_RATE_LIMIT_POSTS_PER_SECOND=10
INSTAGRAM_RATE_LIMIT_METRICS_PER_SECOND=20
INSTAGRAM_RATE_LIMIT_MAX_CONCURRENT_REQUESTS=5

# ============================================================================
# Cache Configuration
# ============================================================================

# Cache TTL in seconds (5 minutes = 300)
INSTAGRAM_CACHE_TTL_SECONDS=300

# Maximum items in cache
INSTAGRAM_CACHE_MAX_SIZE=1000

# Cache strategy: 'LRU' (Least Recently Used) or 'FIFO'
INSTAGRAM_CACHE_STRATEGY=LRU

# ============================================================================
# Logging Configuration
# ============================================================================

# Log level: 'debug', 'info', 'warn', 'error'
# Recommended: 'info' for production
INSTAGRAM_LOG_LEVEL=info

# Enable detailed logging for debugging
# Recommended: false for production
INSTAGRAM_DEBUG_MODE=false

# ============================================================================
# ClickUp Integration (Existing)
# ============================================================================

CLICKUP_API_KEY=your_clickup_api_key
CLICKUP_PERFORMANCE_LIST_ID=your_performance_list_id

# ============================================================================
# Application Configuration
# ============================================================================

NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
JWT_SECRET=your_production_jwt_secret
```

### Vercel Environment Setup

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from above
3. Set environment to: Production
4. Click "Save"

**Important**: Never commit `.env.production` to version control. Use Vercel's UI or CLI to set variables.

## Database Setup

### 1. Create Tables in Supabase

Run the migration SQL in Supabase SQL Editor:

```sql
-- Create instagram_credentials table
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  account_id VARCHAR(255) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  clickup_list_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES auth.users(id)
);

-- Create instagram_post_mappings table
CREATE TABLE IF NOT EXISTS instagram_post_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  instagram_post_id VARCHAR(255) NOT NULL,
  instagram_account_id VARCHAR(255) NOT NULL REFERENCES instagram_credentials(account_id),
  clickup_task_id VARCHAR(255) NOT NULL,
  clickup_list_id VARCHAR(255) NOT NULL,
  last_metrics_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instagram_post_id, instagram_account_id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES auth.users(id)
);

-- Create instagram_sync_history table
CREATE TABLE IF NOT EXISTS instagram_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  account_id VARCHAR(255) NOT NULL REFERENCES instagram_credentials(account_id),
  status VARCHAR(50) NOT NULL,
  posts_processed INTEGER,
  tasks_created INTEGER,
  tasks_updated INTEGER,
  metrics_updated INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_instagram_credentials_client_id ON instagram_credentials(client_id);
CREATE INDEX idx_instagram_credentials_account_id ON instagram_credentials(account_id);
CREATE INDEX idx_instagram_credentials_is_active ON instagram_credentials(is_active);
CREATE INDEX idx_instagram_post_mappings_client_id ON instagram_post_mappings(client_id);
CREATE INDEX idx_instagram_post_mappings_post_id ON instagram_post_mappings(instagram_post_id);
CREATE INDEX idx_instagram_post_mappings_account_id ON instagram_post_mappings(instagram_account_id);
CREATE INDEX idx_instagram_sync_history_client_id ON instagram_sync_history(client_id);
CREATE INDEX idx_instagram_sync_history_account_id ON instagram_sync_history(account_id);
CREATE INDEX idx_instagram_sync_history_created_at ON instagram_sync_history(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_sync_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instagram_credentials
CREATE POLICY "Users can view their own credentials"
  ON instagram_credentials FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own credentials"
  ON instagram_credentials FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own credentials"
  ON instagram_credentials FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can delete their own credentials"
  ON instagram_credentials FOR DELETE
  USING (client_id = auth.uid());

-- Create RLS policies for instagram_post_mappings
CREATE POLICY "Users can view their own mappings"
  ON instagram_post_mappings FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own mappings"
  ON instagram_post_mappings FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own mappings"
  ON instagram_post_mappings FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can delete their own mappings"
  ON instagram_post_mappings FOR DELETE
  USING (client_id = auth.uid());

-- Create RLS policies for instagram_sync_history
CREATE POLICY "Users can view their own sync history"
  ON instagram_sync_history FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own sync history"
  ON instagram_sync_history FOR INSERT
  WITH CHECK (client_id = auth.uid());
```

### 2. Verify Tables

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'instagram_%';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'instagram_%';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'instagram_%';
```

## Scheduler Setup

### Option 1: Vercel Cron (Recommended)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/admin/instagram/sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This triggers the sync endpoint every 5 minutes.

### Option 2: External Scheduler (AWS EventBridge, etc.)

If using external scheduler:

1. Create a scheduled event that calls:
   ```
   POST https://your-domain.com/api/admin/instagram/sync
   Authorization: Bearer {service_token}
   ```

2. Set frequency to every 5 minutes

3. Configure retry policy (3 retries with exponential backoff)

### Option 3: Node.js Cron (For Self-Hosted)

If self-hosting, the cron job is automatically started in `lib/jobs/instagram-sync.job.ts`:

```typescript
// Automatically started on server initialization
const syncJob = new InstagramSyncJob(config)
syncJob.start()
```

## Deployment Steps

### 1. Pre-Deployment Testing

```bash
# Run all tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Check for build errors
npm run lint
```

### 2. Deploy to Staging

```bash
# Deploy to staging environment
vercel --prod --env staging

# Run smoke tests
npm run test:smoke

# Verify endpoints
curl -X GET https://staging.your-domain.com/api/admin/instagram/status \
  -H "Authorization: Bearer $STAGING_TOKEN"
```

### 3. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Verify deployment
curl -X GET https://your-domain.com/api/admin/instagram/status \
  -H "Authorization: Bearer $PROD_TOKEN"
```

### 4. Post-Deployment Verification

```bash
# Check health endpoint
curl -X GET https://your-domain.com/api/health

# Verify database connection
curl -X GET https://your-domain.com/api/admin/instagram/accounts \
  -H "Authorization: Bearer $PROD_TOKEN"

# Check logs
vercel logs --prod

# Monitor metrics
# Go to Vercel Dashboard → Monitoring
```

## Monitoring and Alerting

### 1. Configure Logging

Logs are automatically sent to:
- Vercel Logs (real-time)
- Supabase Logs (database operations)
- Application Logs (structured JSON)

### 2. Set Up Alerts

Configure alerts in Vercel Dashboard:

**Alert 1: High Error Rate**
- Condition: Error rate > 5%
- Action: Send email notification

**Alert 2: Sync Failures**
- Condition: Sync status = failed
- Action: Send email + Slack notification

**Alert 3: Performance Degradation**
- Condition: Response time > 5 seconds
- Action: Send email notification

### 3. Monitor Key Metrics

```bash
# View real-time logs
vercel logs --prod --follow

# Check error rate
vercel analytics --prod

# Monitor database performance
# Go to Supabase Dashboard → Database → Performance
```

## Rollback Procedure

### If Deployment Fails

```bash
# Rollback to previous version
vercel rollback

# Or manually deploy previous commit
git checkout <previous-commit>
vercel --prod
```

### If Database Migration Fails

```bash
# Rollback migration in Supabase
# Go to Supabase Dashboard → SQL Editor
# Run rollback script (save before deploying)

-- Drop tables if needed
DROP TABLE IF EXISTS instagram_sync_history CASCADE;
DROP TABLE IF EXISTS instagram_post_mappings CASCADE;
DROP TABLE IF EXISTS instagram_credentials CASCADE;
```

### If Scheduler Fails

```bash
# Check scheduler status
curl -X GET https://your-domain.com/api/admin/instagram/status \
  -H "Authorization: Bearer $PROD_TOKEN"

# Manually trigger sync
curl -X POST https://your-domain.com/api/admin/instagram/sync \
  -H "Authorization: Bearer $PROD_TOKEN"

# Check logs for errors
vercel logs --prod | grep "sync"
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM instagram_credentials 
WHERE client_id = 'user-id' AND is_active = true;

-- Vacuum and analyze
VACUUM ANALYZE instagram_credentials;
VACUUM ANALYZE instagram_post_mappings;
VACUUM ANALYZE instagram_sync_history;
```

### 2. Cache Optimization

```bash
# Monitor cache hit rate
# In logs, look for cache_hit_rate metric

# Adjust cache settings if needed
INSTAGRAM_CACHE_TTL_SECONDS=600        # Increase to 10 minutes
INSTAGRAM_CACHE_MAX_SIZE=2000          # Increase max items
```

### 3. Rate Limiting Optimization

```bash
# Monitor rate limit hits
# In logs, look for rate_limit_exceeded events

# Adjust if needed
INSTAGRAM_RATE_LIMIT_POSTS_PER_SECOND=15
INSTAGRAM_RATE_LIMIT_METRICS_PER_SECOND=25
```

## Troubleshooting

### Issue: Sync Not Running

**Symptoms**: No sync history, posts not updating

**Solution**:
1. Check Vercel cron status: `vercel crons --prod`
2. Verify environment variables are set
3. Check logs: `vercel logs --prod | grep sync`
4. Manually trigger: `curl -X POST https://your-domain.com/api/admin/instagram/sync`

### Issue: Database Connection Errors

**Symptoms**: "Connection refused" errors in logs

**Solution**:
1. Verify Supabase URL and keys in environment
2. Check Supabase status: https://status.supabase.com
3. Verify RLS policies are correct
4. Check database connection pool: Supabase Dashboard → Database → Connections

### Issue: High Memory Usage

**Symptoms**: Vercel function timeout, OOM errors

**Solution**:
1. Reduce `INSTAGRAM_CACHE_MAX_SIZE`
2. Reduce `INSTAGRAM_MAX_CONCURRENT_ACCOUNTS`
3. Increase `INSTAGRAM_SYNC_FREQUENCY_MINUTES` (sync less often)
4. Check for memory leaks in logs

### Issue: Slow Sync Performance

**Symptoms**: Sync takes > 120 seconds

**Solution**:
1. Check Instagram API status
2. Reduce number of posts fetched per sync
3. Increase `INSTAGRAM_SYNC_TIMEOUT_SECONDS`
4. Check database query performance
5. Verify network connectivity

## Maintenance

### Daily Tasks

- Monitor error rate in Vercel Dashboard
- Check sync history for failures
- Review logs for warnings

### Weekly Tasks

- Review performance metrics
- Check database size and growth
- Verify backup status

### Monthly Tasks

- Review and optimize cache settings
- Analyze sync performance trends
- Update documentation if needed

### Quarterly Tasks

- Review security settings
- Audit credential access logs
- Plan capacity upgrades if needed

## Security Checklist

- [ ] INSTAGRAM_ENCRYPTION_KEY is strong (32-byte hex)
- [ ] Environment variables not committed to git
- [ ] RLS policies enabled on all tables
- [ ] JWT tokens validated on all endpoints
- [ ] HTTPS enforced (Vercel default)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Backup strategy in place
- [ ] Incident response plan documented

## Support and Escalation

### For Issues

1. Check logs: `vercel logs --prod`
2. Review error codes in API documentation
3. Check Supabase status
4. Check Instagram API status
5. Contact support if needed

### Escalation Path

1. **Level 1**: Check logs and documentation
2. **Level 2**: Review database and API status
3. **Level 3**: Contact Vercel support
4. **Level 4**: Contact Supabase support
5. **Level 5**: Contact Instagram API support

## Related Documentation

- [Service README](../lib/services/instagram/README.md)
- [API Documentation](./INSTAGRAM_API.md)
- [Monitoring Guide](./INSTAGRAM_MONITORING.md)
- [Design Document](../.kiro/specs/instagram-business-integration/design.md)
