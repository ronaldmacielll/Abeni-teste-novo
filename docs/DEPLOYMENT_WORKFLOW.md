# Deployment Workflow Guide

## Overview

This document outlines the complete deployment workflow for the Portal de Performance + Gestão Financeira, including branching strategy, staging process, production deployment, hotfixes, and rollback procedures.

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Development Workflow](#development-workflow)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Hotfix Process](#hotfix-process)
6. [Rollback Procedures](#rollback-procedures)
7. [CI/CD with GitHub Actions](#cicd-with-github-actions)
8. [Deployment Checklist](#deployment-checklist)

---

## Branching Strategy

We follow a **Git Flow** inspired branching model optimized for Vercel deployments.

### Branch Types

```
main (production)
  ├── staging (pre-production)
  │   ├── feature/user-authentication
  │   ├── feature/financial-dashboard
  │   └── feature/performance-metrics
  └── hotfix/critical-bug-fix
```

#### `main` Branch
- **Purpose**: Production-ready code
- **Protection**: Protected, requires PR approval
- **Deployment**: Auto-deploys to production on Vercel
- **Merge from**: `staging` branch only (except hotfixes)

#### `staging` Branch
- **Purpose**: Pre-production testing environment
- **Protection**: Protected, requires PR approval
- **Deployment**: Auto-deploys to staging environment
- **Merge from**: Feature branches
- **Merge to**: `main` after testing

#### `feature/*` Branches
- **Purpose**: New features or enhancements
- **Naming**: `feature/short-description` (e.g., `feature/add-transaction-form`)
- **Created from**: `staging` branch
- **Merge to**: `staging` branch
- **Deployment**: Creates preview deployment on Vercel

#### `hotfix/*` Branches
- **Purpose**: Critical production bug fixes
- **Naming**: `hotfix/short-description` (e.g., `hotfix/auth-token-expiry`)
- **Created from**: `main` branch
- **Merge to**: Both `main` and `staging`
- **Deployment**: Fast-track to production

#### `bugfix/*` Branches
- **Purpose**: Non-critical bug fixes
- **Naming**: `bugfix/short-description`
- **Created from**: `staging` branch
- **Merge to**: `staging` branch
- **Deployment**: Preview deployment, then staging

---

## Development Workflow

### 1. Starting New Feature

```bash
# Ensure staging is up to date
git checkout staging
git pull origin staging

# Create feature branch
git checkout -b feature/add-export-functionality

# Make changes and commit
git add .
git commit -m "feat: add CSV export for transactions"

# Push to remote
git push origin feature/add-export-functionality
```

### 2. Create Pull Request

1. **Open PR on GitHub**
   - Base: `staging`
   - Compare: `feature/add-export-functionality`

2. **PR Template** (create `.github/pull_request_template.md`):
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No console errors
   ```

3. **Vercel Preview Deployment**
   - Vercel automatically creates preview deployment
   - Review deployment URL in PR comments
   - Test functionality in preview environment

### 3. Code Review

**Reviewer Checklist**:
- [ ] Code quality and style
- [ ] Test coverage
- [ ] Performance implications
- [ ] Security considerations
- [ ] Documentation updates
- [ ] Preview deployment tested

### 4. Merge to Staging

```bash
# After PR approval
# Merge via GitHub UI (Squash and Merge recommended)

# Or via CLI
git checkout staging
git merge --squash feature/add-export-functionality
git commit -m "feat: add CSV export for transactions"
git push origin staging
```

---

## Staging Deployment

### Automatic Staging Deployment

When code is merged to `staging` branch:

1. **Vercel Auto-Deploy**
   - Triggered automatically on push to `staging`
   - Build logs available in Vercel dashboard
   - Deployment URL: `https://portal-staging.vercel.app` (or custom domain)

2. **Deployment Notifications**
   - GitHub commit status updated
   - Slack/Discord notification (if configured)
   - Email notification (if enabled)

### Manual Staging Deployment

```bash
# Deploy specific branch to staging
git checkout staging
vercel --prod --scope staging-project
```

### Staging Testing Checklist

Before promoting to production, verify:

#### Functional Testing
- [ ] Authentication flow works
- [ ] Performance dashboard loads correctly
- [ ] Financial dashboard displays accurate data
- [ ] Transaction creation succeeds
- [ ] Filters work as expected
- [ ] Navigation between modules works

#### Integration Testing
- [ ] ClickUp API integration working
- [ ] Supabase authentication working
- [ ] Multi-tenant data isolation verified
- [ ] API endpoints return correct data

#### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] Lighthouse score > 90

#### Security Testing
- [ ] JWT validation working
- [ ] Unauthorized access blocked
- [ ] CORS configured correctly
- [ ] No exposed secrets in client code

#### E2E Testing
```bash
# Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://portal-staging.vercel.app npm run test:e2e
```

### Staging Approval

Once testing is complete:

1. **Document Test Results**
   - Create test report
   - Screenshot key functionality
   - Note any issues or concerns

2. **Get Stakeholder Approval**
   - Product owner review
   - QA team sign-off
   - Technical lead approval

3. **Prepare for Production**
   - Create production deployment PR
   - Update changelog
   - Notify team of upcoming deployment

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] Stakeholder approval received
- [ ] No known critical bugs
- [ ] Database migrations prepared (if any)
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Monitoring dashboards ready

### Production Deployment Process

#### Option 1: Via Pull Request (Recommended)

```bash
# Create PR from staging to main
git checkout main
git pull origin main

# Create PR on GitHub
# Base: main
# Compare: staging
# Title: "Release: [Date] - [Brief Description]"
```

**PR Description Template**:
```markdown
## Release Summary
Brief description of changes in this release

## Changes Included
- Feature: Add CSV export
- Fix: Resolve authentication timeout
- Improvement: Optimize API response time

## Testing
- [x] All unit tests passing
- [x] All E2E tests passing
- [x] Staging environment tested
- [x] Performance benchmarks met

## Deployment Notes
- No database migrations required
- No breaking changes
- Estimated downtime: None

## Rollback Plan
Revert to deployment: [previous-deployment-url]
```

#### Option 2: Via CLI

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Merge staging
git merge staging

# Push to trigger deployment
git push origin main

# Or deploy directly
vercel --prod
```

### During Deployment

1. **Monitor Build Logs**
   - Watch Vercel dashboard
   - Check for build errors
   - Verify environment variables loaded

2. **Deployment Timeline**
   - Build time: ~2-5 minutes
   - Propagation time: ~1-2 minutes
   - Total: ~5-10 minutes

3. **Communication**
   - Post in team chat: "Deployment in progress"
   - Update status page (if applicable)

### Post-Deployment Verification

#### Immediate Checks (0-5 minutes)

```bash
# 1. Verify deployment is live
curl -I https://portal.example.com

# 2. Check health endpoint (if implemented)
curl https://portal.example.com/api/health

# 3. Test authentication
# Login via UI and verify JWT token

# 4. Check Vercel logs
vercel logs --prod --follow
```

#### Smoke Tests (5-15 minutes)

- [ ] Homepage loads
- [ ] Login successful
- [ ] Performance dashboard displays data
- [ ] Financial dashboard displays data
- [ ] Create test transaction
- [ ] Verify multi-tenant isolation

#### Monitoring (15-60 minutes)

- [ ] Check error rates in Vercel
- [ ] Monitor API response times
- [ ] Check Supabase connection pool
- [ ] Verify ClickUp API rate limits
- [ ] Review user feedback/reports

### Post-Deployment Tasks

1. **Tag Release**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0: Add CSV export"
   git push origin v1.2.0
   ```

2. **Update Changelog**
   ```markdown
   ## [1.2.0] - 2024-01-17
   ### Added
   - CSV export functionality for transactions
   
   ### Fixed
   - Authentication timeout issue
   
   ### Improved
   - API response time optimization
   ```

3. **Notify Team**
   - Post deployment summary
   - Share release notes
   - Thank contributors

4. **Close Related Issues**
   - Link deployment to GitHub issues
   - Close completed issues
   - Update project board

---

## Hotfix Process

For critical production bugs that need immediate fixing:

### 1. Create Hotfix Branch

```bash
# Create from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug
```

### 2. Implement Fix

```bash
# Make minimal changes to fix the issue
# Add tests to prevent regression
git add .
git commit -m "hotfix: resolve authentication token expiry"
```

### 3. Test Hotfix

```bash
# Run tests locally
npm run test
npm run test:e2e

# Deploy to preview for testing
vercel
```

### 4. Fast-Track Deployment

```bash
# Create PR to main (expedited review)
# Get emergency approval from tech lead

# Merge to main
git checkout main
git merge hotfix/critical-auth-bug
git push origin main

# Also merge to staging to keep in sync
git checkout staging
git merge hotfix/critical-auth-bug
git push origin staging
```

### 5. Verify Fix

- [ ] Production deployment successful
- [ ] Bug no longer reproducible
- [ ] No new issues introduced
- [ ] Monitoring shows normal metrics

### 6. Post-Hotfix

- [ ] Document root cause
- [ ] Create follow-up tasks for permanent fix
- [ ] Update runbook
- [ ] Conduct post-mortem (if major incident)

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Critical functionality broken
- Data corruption detected
- Security vulnerability introduced
- Performance degradation > 50%
- Error rate > 5%

### Rollback Methods

#### Method 1: Vercel Instant Rollback (Fastest)

```bash
# Via Dashboard
1. Go to Vercel Dashboard → Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"

# Via CLI
vercel rollback
# Or promote specific deployment
vercel promote <deployment-url>
```

**Time to rollback**: ~30 seconds

#### Method 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main

# Revert specific commit
git revert <commit-hash>
git push origin main
```

**Time to rollback**: ~5-10 minutes (includes build time)

#### Method 3: Redeploy Previous Version

```bash
# Checkout previous tag
git checkout v1.1.0

# Deploy
vercel --prod
```

### Post-Rollback

1. **Verify Rollback**
   - [ ] Application functioning normally
   - [ ] Error rates back to normal
   - [ ] User reports resolved

2. **Communicate**
   - Notify team of rollback
   - Update status page
   - Inform affected users (if applicable)

3. **Root Cause Analysis**
   - Identify what went wrong
   - Document findings
   - Create action items
   - Update deployment checklist

4. **Fix and Redeploy**
   - Fix issue in feature branch
   - Test thoroughly in staging
   - Deploy with extra caution

---

## CI/CD with GitHub Actions

### Setup GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/staging'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

### Required GitHub Secrets

Add these secrets in GitHub repository settings:

- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `STAGING_URL`: Staging environment URL

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Staging environment tested
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Database migrations prepared (if any)
- [ ] Rollback plan documented
- [ ] Team notified

### During Deployment

- [ ] Monitor build logs
- [ ] Watch for errors
- [ ] Verify environment variables
- [ ] Check deployment status
- [ ] Update team on progress

### Post-Deployment

- [ ] Smoke tests completed
- [ ] Monitoring dashboards checked
- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] User feedback monitored
- [ ] Release tagged
- [ ] Changelog published
- [ ] Team notified of completion
- [ ] Issues closed

---

## Best Practices

1. **Always test in staging first**
2. **Deploy during low-traffic hours**
3. **Have rollback plan ready**
4. **Monitor closely after deployment**
5. **Communicate with team**
6. **Document everything**
7. **Learn from incidents**
8. **Automate where possible**

---

## Additional Resources

- [Git Flow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: January 2024

