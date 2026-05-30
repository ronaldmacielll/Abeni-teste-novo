# Instagram Integration Monitoring and Alerting Guide

## Overview

This guide provides comprehensive monitoring and alerting setup for the Instagram Business Integration. It covers logging, metrics, dashboards, and alert configurations to ensure system health and quick issue detection.

## Structured Logging

### Log Format

All logs are structured as JSON for easy parsing and analysis:

```json
{
  "timestamp": "2024-01-15T10:45:30.123Z",
  "level": "info",
  "service": "instagram-sync",
  "action": "sync_started",
  "accountId": "acc-uuid-123",
  "accountName": "ALUA Produtora",
  "context": {
    "postsToProcess": 12,
    "maxConcurrent": 3
  },
  "duration": 8500,
  "status": "success",
  "error": null,
  "userId": "user-uuid-456"
}
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| debug | Detailed diagnostic info | "Fetching posts from Instagram API" |
| info | General informational | "Sync completed successfully" |
| warn | Warning conditions | "Sync took longer than expected" |
| error | Error conditions | "Failed to create ClickUp task" |

### Log Retention

- **Vercel Logs**: 7 days (real-time)
- **Application Logs**: 30 days (stored in Supabase)
- **Audit Logs**: 90 days (compliance requirement)

## Key Metrics

### Sync Performance Metrics

```typescript
interface SyncMetrics {
  // Timing
  syncDuration: number                 // milliseconds
  postsProcessingTime: number          // milliseconds
  metricsProcessingTime: number        // milliseconds
  clickupUpdateTime: number            // milliseconds
  
  // Volume
  postsProcessed: number
  tasksCreated: number
  tasksUpdated: number
  metricsUpdated: number
  
  // Quality
  successRate: number                  // percentage
  errorRate: number                    // percentage
  deduplicationRate: number            // percentage
  
  // Reliability
  retryCount: number
  circuitBreakerTrips: number
  timeoutCount: number
}
```

### API Performance Metrics

```typescript
interface APIMetrics {
  // Response times
  p50ResponseTime: number              // milliseconds
  p95ResponseTime: number              // milliseconds
  p99ResponseTime: number              // milliseconds
  
  // Error rates
  errorRate: number                    // percentage
  rateLimitHits: number
  timeoutCount: number
  
  // Throughput
  requestsPerSecond: number
  successfulRequests: number
  failedRequests: number
}
```

### Database Metrics

```typescript
interface DatabaseMetrics {
  // Connection pool
  activeConnections: number
  idleConnections: number
  waitingConnections: number
  
  // Query performance
  slowQueryCount: number               // > 1 second
  averageQueryTime: number             // milliseconds
  
  // Storage
  tableSize: number                    // bytes
  indexSize: number                    // bytes
  
  // Replication
  replicationLag: number               // milliseconds
}
```

## Monitoring Dashboards

### 1. Real-Time Sync Dashboard

**Location**: `/admin/instagram/monitoring`

**Displays**:
- Current sync status (running/idle)
- Accounts being processed
- Posts processed (real-time counter)
- Tasks created/updated (real-time counter)
- Errors (if any)
- Estimated completion time

**Refresh Rate**: 5 seconds

### 2. Performance Dashboard

**Metrics**:
- Sync duration trend (last 24 hours)
- Success rate trend (last 7 days)
- Average posts per sync
- Average tasks created per sync
- Error rate trend

**Refresh Rate**: 1 minute

### 3. Health Dashboard

**Metrics**:
- Account status (active/inactive/error)
- Last sync time per account
- Next scheduled sync
- Credential expiration dates
- Circuit breaker status
- Database connection pool status

**Refresh Rate**: 1 minute

### 4. Error Dashboard

**Displays**:
- Recent errors (last 24 hours)
- Error types distribution
- Error frequency by account
- Error recovery status
- Failed operations

**Refresh Rate**: 30 seconds

## Alert Configuration

### Alert 1: Sync Failure

**Condition**: Sync status = failed

**Severity**: High

**Notification**:
- Email to admin
- Slack to #instagram-alerts
- SMS (if critical)

**Action**:
1. Check logs for error details
2. Verify Instagram API status
3. Check credentials validity
4. Manually trigger retry

**Example Alert**:
```
🚨 CRITICAL: Instagram Sync Failed
Account: ALUA Produtora
Error: Invalid access token
Time: 2024-01-15 10:45:00 UTC
Action: Update credentials in Admin interface
```

### Alert 2: Circuit Breaker Triggered

**Condition**: 5 consecutive sync failures

**Severity**: Critical

**Notification**:
- Email to admin + team lead
- Slack to #instagram-alerts + @team-lead
- PagerDuty incident

**Action**:
1. Investigate root cause
2. Fix underlying issue
3. Reset circuit breaker
4. Verify sync works

**Example Alert**:
```
🔴 CRITICAL: Circuit Breaker Triggered
Account: ALUA Produtora
Failures: 5 consecutive
Last Error: Connection timeout
Status: Sync paused until manual reset
```

### Alert 3: Credential Expiration

**Condition**: Credential expires in < 7 days

**Severity**: Medium

**Notification**:
- Email to admin
- Slack to #instagram-alerts

**Action**:
1. Generate new token from Meta
2. Update credentials in Admin interface
3. Verify sync works

**Example Alert**:
```
⚠️ WARNING: Instagram Credential Expiring
Account: ALUA Produtora
Expires: 2024-01-22 (7 days)
Action: Update token in Admin interface
```

### Alert 4: High Error Rate

**Condition**: Error rate > 5% in last hour

**Severity**: Medium

**Notification**:
- Email to admin
- Slack to #instagram-alerts

**Action**:
1. Check logs for error patterns
2. Identify affected accounts
3. Investigate root cause
4. Apply fix if needed

**Example Alert**:
```
⚠️ WARNING: High Error Rate Detected
Error Rate: 8.5% (last hour)
Errors: 12 out of 141 operations
Most Common: ClickUp API timeout
```

### Alert 5: Sync Timeout

**Condition**: Sync duration > 120 seconds

**Severity**: Low

**Notification**:
- Slack to #instagram-alerts

**Action**:
1. Monitor next sync
2. Check Instagram API performance
3. Reduce concurrent accounts if needed
4. Increase timeout if necessary

**Example Alert**:
```
ℹ️ INFO: Sync Timeout
Account: ALUA Produtora
Duration: 145 seconds (limit: 120)
Status: Completed successfully
```

### Alert 6: Database Connection Issues

**Condition**: Active connections > 80% of pool

**Severity**: Medium

**Notification**:
- Email to admin
- Slack to #instagram-alerts

**Action**:
1. Check for slow queries
2. Increase connection pool if needed
3. Optimize queries
4. Monitor for memory leaks

**Example Alert**:
```
⚠️ WARNING: Database Connection Pool High
Active: 24 / 30 connections (80%)
Waiting: 5 connections
Action: Monitor for slow queries
```

### Alert 7: Rate Limit Exceeded

**Condition**: Rate limit hits > 10 in last hour

**Severity**: Low

**Notification**:
- Slack to #instagram-alerts

**Action**:
1. Check Instagram API status
2. Reduce request rate if needed
3. Implement backoff strategy
4. Monitor next sync

**Example Alert**:
```
ℹ️ INFO: Rate Limit Exceeded
Service: Instagram API
Hits: 15 (last hour)
Status: Requests backed off automatically
```

## Alert Routing

### Email Alerts

**Recipients**:
- admin@alua.com (all alerts)
- team-lead@alua.com (critical only)

**Configuration**:
```bash
# In Vercel Dashboard → Settings → Alerts
Email: admin@alua.com
Conditions: All errors
```

### Slack Alerts

**Channel**: #instagram-alerts

**Configuration**:
```bash
# In Slack → Apps → Vercel
Channel: #instagram-alerts
Events: Deployments, Errors, Performance
```

**Message Format**:
```
🚨 [CRITICAL] Instagram Sync Failed
Account: ALUA Produtora
Error: Invalid access token
Time: 2024-01-15 10:45:00 UTC
Link: https://dashboard.vercel.com/logs
```

### PagerDuty Alerts

**For Critical Issues Only**

**Configuration**:
```bash
# In PagerDuty → Integrations → Vercel
Service: Instagram Integration
Severity: Critical
```

## Logging Best Practices

### What to Log

✅ **DO Log**:
- Sync start/end with duration
- Posts processed count
- Tasks created/updated count
- Errors with full context
- API response times
- Database query times
- Retry attempts
- Circuit breaker state changes

❌ **DON'T Log**:
- Access tokens or credentials
- User passwords
- Personal information
- Full API responses (too verbose)
- Sensitive business data

### Log Examples

```typescript
// Good: Informative and secure
logger.info('Sync completed', {
  accountId: 'acc-123',
  postsProcessed: 12,
  duration: 8500,
  status: 'success'
})

// Bad: Exposes sensitive data
logger.info('Sync completed', {
  accountId: 'acc-123',
  accessToken: 'EAAB...',  // ❌ Never log tokens
  response: fullAPIResponse  // ❌ Too verbose
})

// Good: Error with context
logger.error('Failed to create ClickUp task', error, {
  postId: 'post-456',
  accountId: 'acc-123',
  retryCount: 2
})

// Bad: Insufficient context
logger.error('Error occurred')  // ❌ No context
```

## Monitoring Queries

### Supabase SQL Queries

```sql
-- Get sync statistics (last 24 hours)
SELECT 
  account_id,
  COUNT(*) as sync_count,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  SUM(posts_processed) as total_posts,
  SUM(tasks_created) as total_tasks_created,
  SUM(tasks_updated) as total_tasks_updated
FROM instagram_sync_history
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY account_id;

-- Get error statistics
SELECT 
  account_id,
  error_message,
  COUNT(*) as error_count,
  MAX(created_at) as last_error_time
FROM instagram_sync_history
WHERE status != 'success' AND created_at > NOW() - INTERVAL '7 days'
GROUP BY account_id, error_message
ORDER BY error_count DESC;

-- Get slow syncs
SELECT 
  id,
  account_id,
  duration_ms,
  posts_processed,
  created_at
FROM instagram_sync_history
WHERE duration_ms > 120000
ORDER BY created_at DESC
LIMIT 10;

-- Get credential expiration status
SELECT 
  account_id,
  account_name,
  expires_at,
  EXTRACT(DAY FROM expires_at - NOW()) as days_until_expiry,
  is_active
FROM instagram_credentials
WHERE expires_at IS NOT NULL
ORDER BY expires_at ASC;
```

## Performance Optimization

### Identify Slow Operations

```sql
-- Find slow syncs
SELECT 
  account_id,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as sync_count
FROM instagram_sync_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY account_id
HAVING AVG(duration_ms) > 60000
ORDER BY avg_duration DESC;

-- Find accounts with high error rates
SELECT 
  account_id,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM instagram_sync_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY account_id
HAVING ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) < 95
ORDER BY success_rate ASC;
```

### Optimization Actions

1. **If sync duration > 120 seconds**:
   - Reduce `INSTAGRAM_MAX_CONCURRENT_ACCOUNTS`
   - Increase `INSTAGRAM_SYNC_FREQUENCY_MINUTES`
   - Check Instagram API performance

2. **If error rate > 5%**:
   - Check credential validity
   - Verify ClickUp API status
   - Review error logs for patterns

3. **If database slow**:
   - Run `VACUUM ANALYZE`
   - Check for missing indexes
   - Optimize slow queries

## Troubleshooting Guide

### Issue: No Sync Activity

**Symptoms**: No sync history entries, posts not updating

**Investigation**:
```bash
# Check if scheduler is running
curl -X GET https://your-domain.com/api/admin/instagram/status

# Check logs
vercel logs --prod | grep sync

# Check Vercel crons
vercel crons --prod
```

**Solution**:
1. Verify Vercel cron is enabled
2. Check environment variables
3. Manually trigger sync
4. Review error logs

### Issue: High Memory Usage

**Symptoms**: Function timeouts, OOM errors

**Investigation**:
```bash
# Check function duration
vercel analytics --prod

# Check logs for memory warnings
vercel logs --prod | grep memory
```

**Solution**:
1. Reduce cache size
2. Reduce concurrent accounts
3. Increase sync frequency
4. Check for memory leaks

### Issue: Database Connection Errors

**Symptoms**: "Connection refused" errors

**Investigation**:
```sql
-- Check connection pool
SELECT count(*) FROM pg_stat_activity;

-- Check for idle connections
SELECT * FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';
```

**Solution**:
1. Verify Supabase URL and keys
2. Check Supabase status
3. Increase connection pool
4. Kill idle connections

## Dashboards and Reports

### Daily Report

**Time**: 9:00 AM UTC

**Contents**:
- Sync success rate (last 24 hours)
- Total posts processed
- Total tasks created/updated
- Error count and types
- Performance metrics

**Recipients**: admin@alua.com

### Weekly Report

**Time**: Monday 9:00 AM UTC

**Contents**:
- Sync statistics (last 7 days)
- Performance trends
- Error analysis
- Recommendations

**Recipients**: admin@alua.com, team-lead@alua.com

### Monthly Report

**Time**: 1st of month 9:00 AM UTC

**Contents**:
- Monthly statistics
- Performance trends
- Capacity analysis
- Security audit
- Recommendations

**Recipients**: admin@alua.com, team-lead@alua.com, cto@alua.com

## Related Documentation

- [Service README](../lib/services/instagram/README.md)
- [API Documentation](./INSTAGRAM_API.md)
- [Deployment Guide](./INSTAGRAM_DEPLOYMENT.md)
- [Design Document](../.kiro/specs/instagram-business-integration/design.md)
