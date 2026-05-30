# Instagram Integration - Production Fixes Quick Reference

## 10 Critical Fixes Implemented

### 1. Token Expiration Check ✅
- **File**: `lib/services/instagram/instagram.service.ts`
- **What**: Validates token hasn't expired before using it
- **Why**: Prevents sync failures with expired tokens
- **Status**: DONE

### 2. ClickUp List Validation ✅
- **File**: `app/api/admin/instagram/route.ts`
- **What**: Verifies ClickUp list exists before saving config
- **Why**: Prevents invalid list IDs from being stored
- **Status**: DONE

### 3. Sync Lock Protection ✅
- **File**: `lib/jobs/instagram-sync.job.ts`
- **What**: Prevents concurrent syncs on same account
- **Why**: Avoids data duplication and race conditions
- **Status**: Already implemented

### 4. Data Cleanup Job ✅
- **Files**: 
  - `lib/database/migrations/001_instagram_integration.sql`
  - `lib/jobs/instagram-cleanup.job.ts` (NEW)
- **What**: Removes old sync history and audit logs daily
- **Why**: Prevents database from growing indefinitely
- **Status**: DONE

### 5. Cache Size Limits ✅
- **File**: `lib/services/cache-manager.ts`
- **What**: Limits cache to 1000 entries with LRU eviction
- **Why**: Prevents memory leaks
- **Status**: Already implemented

### 6. Period Validation ✅
- **File**: `modules/performance/hooks/useInstagramData.ts`
- **What**: Validates period is 'week' or 'month' with Zod
- **Why**: Prevents invalid API requests
- **Status**: DONE

### 7. Pagination Support ✅
- **File**: `app/api/admin/instagram/route.ts`
- **What**: Added limit/offset pagination to GET /accounts
- **Why**: Improves performance with many accounts
- **Status**: DONE

### 8. Real-Time Form Validation ✅
- **File**: `modules/admin/components/InstagramAccountForm.tsx`
- **What**: Validates fields as user types
- **Why**: Better UX with immediate feedback
- **Status**: DONE

### 9. Image Error Handling ✅
- **File**: `modules/performance/components/InstagramPostCard.tsx`
- **What**: Shows placeholder when image fails to load
- **Why**: Better UX when images unavailable
- **Status**: Already implemented

### 10. API Error Documentation ✅
- **File**: `docs/INSTAGRAM_API_ERRORS.md` (NEW)
- **What**: Comprehensive error code reference
- **Why**: Easier troubleshooting and integration
- **Status**: DONE

---

## Files Modified

### Core Services
- `lib/services/instagram/instagram.service.ts` - Token expiration check
- `lib/services/cache-manager.ts` - Already has size limits
- `lib/jobs/instagram-sync.job.ts` - Already has lock protection

### API Routes
- `app/api/admin/instagram/route.ts` - ClickUp validation + pagination

### Frontend
- `modules/admin/components/InstagramAccountForm.tsx` - Real-time validation
- `modules/performance/hooks/useInstagramData.ts` - Period validation
- `modules/performance/components/InstagramPostCard.tsx` - Already has error handling

### Database
- `lib/database/migrations/001_instagram_integration.sql` - Cleanup functions

### New Files
- `lib/jobs/instagram-cleanup.job.ts` - Data cleanup job
- `docs/INSTAGRAM_API_ERRORS.md` - Error documentation
- `PRODUCTION_FIXES_SUMMARY.md` - Detailed summary
- `FIXES_QUICK_REFERENCE.md` - This file

---

## Testing Commands

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- lib/services/instagram/instagram.service.test.ts

# Run with coverage
npm run test -- --coverage

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

---

## Deployment Steps

1. **Verify Build**
   ```bash
   npm run build
   ```

2. **Run Tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

3. **Deploy to Staging**
   ```bash
   git push origin production-fixes
   # Deploy via Vercel
   ```

4. **Verify in Staging**
   - Test account configuration
   - Test sync job
   - Check cleanup job runs
   - Monitor logs

5. **Deploy to Production**
   - Merge to main
   - Deploy via Vercel
   - Monitor production logs

---

## Monitoring Checklist

### Daily
- [ ] Sync success rate > 95%
- [ ] No token expiration errors
- [ ] No ClickUp validation errors
- [ ] Cleanup job completed

### Weekly
- [ ] Database size stable
- [ ] Cache hit rate > 80%
- [ ] Error rate < 1%
- [ ] No memory leaks

### Monthly
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify cleanup effectiveness
- [ ] Plan improvements

---

## Rollback Procedure

If issues occur:

1. **Stop Sync Job**
   ```typescript
   syncJob.stop()
   ```

2. **Disable Cleanup Job**
   - Remove from scheduler
   - Or set `enabled: false`

3. **Revert Code**
   ```bash
   git revert <commit-hash>
   npm run build
   # Redeploy
   ```

4. **Restore from Backup**
   - If data corruption
   - Use Supabase backup

5. **Investigate**
   - Check logs
   - Identify root cause
   - Fix and redeploy

---

## Key Metrics

### Success Indicators
- Sync success rate: 95%+
- Token expiration errors: 0
- ClickUp validation errors: 0
- Database size: Stable
- Cache hit rate: 80%+
- API error rate: <1%

### Performance Targets
- Sync duration: <120 seconds
- API response time: <500ms
- Cache memory: <50MB
- Database queries: <100ms

---

## Support & Troubleshooting

### Common Issues

**Issue**: Sync failures with "token expired"
- **Solution**: Token expiration check now prevents this
- **Action**: Monitor for any remaining cases

**Issue**: ClickUp list not found errors
- **Solution**: Validation now catches this at config time
- **Action**: Users will see error immediately

**Issue**: Database growing too large
- **Solution**: Cleanup job removes old data daily
- **Action**: Monitor database size weekly

**Issue**: Slow API responses with many accounts
- **Solution**: Pagination now supported
- **Action**: Use limit/offset parameters

**Issue**: Form validation confusing
- **Solution**: Real-time validation provides immediate feedback
- **Action**: Users see errors as they type

---

## Documentation

- **API Errors**: `docs/INSTAGRAM_API_ERRORS.md`
- **Setup Guide**: `docs/INSTAGRAM_SETUP.md`
- **Architecture**: `docs/INSTAGRAM_ARCHITECTURE.md`
- **Deployment**: `docs/INSTAGRAM_DEPLOYMENT.md`

---

## Contact & Support

For issues or questions:
1. Check error logs: `logs/instagram-*.log`
2. Review documentation: `docs/INSTAGRAM_*.md`
3. Check monitoring dashboard
4. Contact development team

---

**Last Updated**: May 29, 2026
**Status**: ✅ All Fixes Implemented and Ready for Production
