# Vercel Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Portal de Performance + Gestão Financeira to Vercel, including configuration for staging and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Deployment Methods](#deployment-methods)
5. [Staging Environment](#staging-environment)
6. [Production Deployment](#production-deployment)
7. [Custom Domain Configuration](#custom-domain-configuration)
8. [Monitoring and Logs](#monitoring-and-logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Git repository hosted on GitHub, GitLab, or Bitbucket
- ✅ All environment variables ready (see `.env.example`)
- ✅ ClickUp API key and list IDs
- ✅ Supabase project configured
- ✅ Application tested locally

---

## Initial Setup

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deployment)

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your Git provider (GitHub, GitLab, or Bitbucket)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your Git repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables** (see next section)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (typically 2-5 minutes)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   # First deployment (creates project)
   vercel
   
   # Follow the prompts:
   # - Set up and deploy? Yes
   # - Which scope? Select your account/team
   # - Link to existing project? No
   # - What's your project's name? portal-performance-gestao-financeira
   # - In which directory is your code located? ./
   ```

4. **Add Environment Variables**
   ```bash
   # Add production environment variables
   vercel env add CLICKUP_API_KEY production
   vercel env add CLICKUP_PERFORMANCE_LIST_ID production
   vercel env add CLICKUP_FINANCIAL_LIST_ID production
   vercel env add JWT_SECRET production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add NEXT_PUBLIC_BASE_URL production
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Environment Variables Configuration

### Required Environment Variables

All environment variables from `.env.example` must be configured in Vercel:

#### ClickUp Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `CLICKUP_API_KEY` | Secret | ClickUp API key | `pk_123456_ABCDEF...` |
| `CLICKUP_PERFORMANCE_LIST_ID` | Secret | Performance list ID | `123456789` |
| `CLICKUP_FINANCIAL_LIST_ID` | Secret | Financial list ID | `987654321` |

#### Supabase Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain Text | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain Text | Supabase anonymous key | `eyJhbGc...` |

#### Application Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Plain Text | Application base URL | `https://your-app.vercel.app` |
| `JWT_SECRET` | Secret | JWT signing secret | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | Plain Text | Environment | `production` |

### Adding Environment Variables via Dashboard

1. **Navigate to Project Settings**
   - Go to your project in Vercel Dashboard
   - Click "Settings" tab
   - Click "Environment Variables" in the sidebar

2. **Add Each Variable**
   - Click "Add New"
   - Enter variable name (e.g., `CLICKUP_API_KEY`)
   - Enter variable value
   - Select environments:
     - ✅ Production
     - ✅ Preview (for staging)
     - ⬜ Development (optional)
   - Click "Save"

3. **Important Notes**
   - Variables starting with `NEXT_PUBLIC_` are exposed to the browser
   - Secret variables (API keys, JWT secrets) should NOT start with `NEXT_PUBLIC_`
   - After adding variables, redeploy for changes to take effect

### Adding Environment Variables via CLI

```bash
# Add to production only
vercel env add VARIABLE_NAME production

# Add to preview (staging) only
vercel env add VARIABLE_NAME preview

# Add to all environments
vercel env add VARIABLE_NAME production preview development

# Pull environment variables to local .env file
vercel env pull .env.local
```

### Environment Variable Security Best Practices

1. **Never commit** `.env.local` or `.env.production` to Git
2. **Use different values** for staging and production
3. **Rotate secrets regularly** (recommended: every 90 days)
4. **Use Vercel's encrypted storage** for sensitive values
5. **Limit access** to environment variables in team settings

---

## Deployment Methods

### Automatic Deployments (Recommended)

Once connected to Git, Vercel automatically deploys:

- **Production**: Every push to `main` or `master` branch
- **Preview**: Every push to other branches or pull requests

**Configuration:**
1. Go to Project Settings → Git
2. Configure:
   - Production Branch: `main` (or `master`)
   - Automatic Deployments: ✅ Enabled
   - Preview Deployments: ✅ Enabled

### Manual Deployments

#### Via CLI

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
git checkout feature-branch
vercel
```

#### Via Dashboard

1. Go to Deployments tab
2. Click "Redeploy" on any previous deployment
3. Select target environment (Production or Preview)

---

## Staging Environment

### Setting Up Staging

Vercel automatically creates preview deployments for non-production branches. To create a dedicated staging environment:

#### Option 1: Use Preview Deployments

Every pull request and non-main branch gets a unique preview URL:
- Format: `https://portal-performance-gestao-financeira-git-{branch}-{team}.vercel.app`
- Automatically created on push
- Isolated environment variables (use "Preview" scope)

#### Option 2: Create Separate Staging Project

1. **Create New Project in Vercel**
   - Import the same repository
   - Name it `portal-performance-gestao-financeira-staging`

2. **Configure Staging Branch**
   - Set production branch to `staging` or `develop`
   - Configure staging environment variables

3. **Deploy**
   - Push to staging branch triggers deployment

### Staging Environment Variables

Configure staging-specific values:

```bash
# Example staging values
NEXT_PUBLIC_BASE_URL=https://portal-staging.vercel.app
CLICKUP_PERFORMANCE_LIST_ID=<staging_list_id>
CLICKUP_FINANCIAL_LIST_ID=<staging_list_id>
NEXT_PUBLIC_SUPABASE_URL=<staging_supabase_url>
```

### Testing Staging Deployment

1. **Access Staging URL**
   - Preview URL from deployment
   - Or custom staging domain

2. **Verify Functionality**
   - Test authentication flow
   - Verify ClickUp API integration
   - Check performance dashboard
   - Test financial module
   - Verify environment variables are correct

3. **Run E2E Tests Against Staging**
   ```bash
   PLAYWRIGHT_BASE_URL=https://your-staging-url.vercel.app npm run test:e2e
   ```

---

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production:

- ✅ All tests passing locally (`npm run test`)
- ✅ E2E tests passing (`npm run test:e2e`)
- ✅ No TypeScript errors (`npm run type-check`)
- ✅ No linting errors (`npm run lint`)
- ✅ Staging deployment tested and verified
- ✅ Production environment variables configured
- ✅ Database migrations completed (if any)
- ✅ Supabase production environment ready

### Production Deployment Process

#### Automatic (Recommended)

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git merge feature-branch
   git push origin main
   ```

2. **Monitor Deployment**
   - Go to Vercel Dashboard → Deployments
   - Watch build logs in real-time
   - Verify deployment status

3. **Verify Production**
   - Access production URL
   - Test critical flows
   - Check monitoring dashboards

#### Manual via CLI

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

### Post-Deployment Verification

1. **Smoke Tests**
   - Login with test account
   - Load performance dashboard
   - Load financial dashboard
   - Create test transaction
   - Verify data filtering by client_id

2. **Performance Checks**
   - Check page load times (should be < 2s)
   - Verify API response times
   - Check Vercel Analytics

3. **Error Monitoring**
   - Check Vercel logs for errors
   - Monitor Supabase logs
   - Verify no 500 errors

### Rollback Procedure

If issues are detected in production:

1. **Via Dashboard**
   - Go to Deployments tab
   - Find last known good deployment
   - Click "..." → "Promote to Production"

2. **Via CLI**
   ```bash
   # List recent deployments
   vercel ls
   
   # Promote specific deployment
   vercel promote <deployment-url>
   ```

3. **Via Git Revert**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

---

## Custom Domain Configuration

### Adding a Custom Domain

1. **Purchase Domain**
   - Use any domain registrar (Namecheap, GoDaddy, Google Domains, etc.)

2. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Click "Add"
   - Enter your domain (e.g., `portal.example.com`)
   - Click "Add"

3. **Configure DNS**

   **Option A: Use Vercel Nameservers (Recommended)**
   - Vercel provides nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
   - Update nameservers at your domain registrar
   - Wait for DNS propagation (up to 48 hours)

   **Option B: Use CNAME Record**
   - Add CNAME record at your DNS provider:
     ```
     Type: CNAME
     Name: portal (or @ for root domain)
     Value: cname.vercel-dns.com
     TTL: 3600
     ```

4. **Verify Domain**
   - Vercel automatically verifies DNS configuration
   - SSL certificate is automatically provisioned
   - Domain becomes active when verification completes

### Multiple Domains

Configure multiple domains for different purposes:

- **Production**: `portal.example.com`
- **Staging**: `staging.portal.example.com`
- **API**: `api.portal.example.com` (optional)

### SSL/TLS Configuration

- **Automatic SSL**: Vercel automatically provisions SSL certificates via Let's Encrypt
- **Custom Certificates**: Upload custom certificates in Project Settings → Domains
- **Force HTTPS**: Enabled by default (all HTTP requests redirect to HTTPS)

---

## Monitoring and Logs

### Vercel Analytics

1. **Enable Analytics**
   - Go to Project Settings → Analytics
   - Enable "Web Analytics"
   - View real-time metrics in Analytics tab

2. **Key Metrics**
   - Page views
   - Unique visitors
   - Performance scores (Core Web Vitals)
   - Geographic distribution

### Deployment Logs

1. **Access Logs**
   - Go to Deployments tab
   - Click on any deployment
   - View "Build Logs" and "Function Logs"

2. **Real-Time Logs**
   ```bash
   # Stream logs via CLI
   vercel logs <deployment-url> --follow
   
   # Filter by function
   vercel logs <deployment-url> --follow --output api/posts
   ```

### Error Tracking

1. **Vercel Error Tracking**
   - Automatically captures runtime errors
   - View in Deployments → Function Logs

2. **Integration with External Services**
   - Sentry: Add Sentry integration for detailed error tracking
   - LogRocket: Session replay and error tracking
   - Datadog: Full observability platform

### Performance Monitoring

1. **Vercel Speed Insights**
   - Enable in Project Settings → Speed Insights
   - Tracks Core Web Vitals
   - Provides performance recommendations

2. **Custom Monitoring**
   ```typescript
   // Add to app/layout.tsx
   export function reportWebVitals(metric: any) {
     console.log(metric);
     // Send to analytics service
   }
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### Build Failures

**Issue**: Build fails with "Module not found"
```
Solution:
1. Verify all dependencies are in package.json
2. Clear Vercel cache: Settings → General → Clear Cache
3. Redeploy
```

**Issue**: TypeScript errors during build
```
Solution:
1. Run `npm run type-check` locally
2. Fix all TypeScript errors
3. Commit and push fixes
```

#### Environment Variable Issues

**Issue**: API calls failing with 401/403 errors
```
Solution:
1. Verify environment variables are set in Vercel
2. Check variable names match exactly (case-sensitive)
3. Ensure NEXT_PUBLIC_ prefix for client-side variables
4. Redeploy after adding variables
```

**Issue**: Environment variables not updating
```
Solution:
1. Environment variables are cached during build
2. Trigger new deployment after changing variables
3. Use `vercel env pull` to verify local values
```

#### Performance Issues

**Issue**: Slow API responses
```
Solution:
1. Check ClickUp API rate limits
2. Verify React Query cache configuration
3. Enable compression in API routes
4. Consider edge caching for static data
```

**Issue**: High cold start times
```
Solution:
1. Reduce bundle size (check with `npm run build`)
2. Use dynamic imports for large components
3. Optimize dependencies
4. Consider upgrading to Vercel Pro for faster cold starts
```

#### Domain Configuration Issues

**Issue**: Domain not resolving
```
Solution:
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Use `dig` or `nslookup` to check DNS:
   dig portal.example.com
4. Clear browser DNS cache
```

**Issue**: SSL certificate not provisioning
```
Solution:
1. Verify domain ownership
2. Check DNS configuration
3. Remove and re-add domain in Vercel
4. Contact Vercel support if issue persists
```

#### Authentication Issues

**Issue**: Supabase authentication failing
```
Solution:
1. Verify NEXT_PUBLIC_SUPABASE_URL is correct
2. Check Supabase project is active
3. Verify allowed redirect URLs in Supabase:
   - Add production URL to allowed URLs
   - Settings → Authentication → URL Configuration
4. Check CORS settings in Supabase
```

### Getting Help

1. **Vercel Documentation**
   - [docs.vercel.com](https://vercel.com/docs)
   - Comprehensive guides and API reference

2. **Vercel Support**
   - Dashboard → Help → Contact Support
   - Response time: 24-48 hours (Free), < 1 hour (Pro/Enterprise)

3. **Community Resources**
   - [Vercel Community](https://github.com/vercel/vercel/discussions)
   - [Next.js Discord](https://nextjs.org/discord)
   - Stack Overflow: Tag `vercel` or `next.js`

4. **Status Page**
   - [vercel-status.com](https://www.vercel-status.com)
   - Check for ongoing incidents

---

## Best Practices

### Deployment Workflow

1. **Use Git Flow**
   - Feature branches for development
   - Pull requests for code review
   - Staging branch for pre-production testing
   - Main branch for production

2. **Automated Testing**
   - Run tests in CI/CD pipeline
   - Block deployments if tests fail
   - Use GitHub Actions or Vercel Checks

3. **Environment Parity**
   - Keep staging and production environments similar
   - Use same Node.js version
   - Test with production-like data

### Security

1. **Environment Variables**
   - Never expose secrets in client-side code
   - Rotate secrets regularly
   - Use different values for staging/production

2. **Access Control**
   - Limit team member access in Vercel
   - Use role-based permissions
   - Enable 2FA for all team members

3. **Monitoring**
   - Set up error alerts
   - Monitor for unusual traffic patterns
   - Review logs regularly

### Performance

1. **Optimize Bundle Size**
   - Use dynamic imports
   - Remove unused dependencies
   - Enable tree shaking

2. **Caching Strategy**
   - Configure appropriate cache headers
   - Use React Query for data caching
   - Enable edge caching where appropriate

3. **Image Optimization**
   - Use Next.js Image component
   - Serve images from CDN
   - Use appropriate image formats (WebP)

---

## Deployment Checklist

### Initial Deployment

- [ ] Vercel account created
- [ ] Git repository connected
- [ ] Project imported to Vercel
- [ ] All environment variables configured
- [ ] First deployment successful
- [ ] Application accessible via Vercel URL
- [ ] Authentication working
- [ ] ClickUp API integration working
- [ ] All modules functional

### Staging Deployment

- [ ] Staging environment configured
- [ ] Staging environment variables set
- [ ] Staging deployment successful
- [ ] E2E tests run against staging
- [ ] Performance verified
- [ ] No errors in logs

### Production Deployment

- [ ] All pre-deployment checks passed
- [ ] Production environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Production deployment successful
- [ ] Smoke tests passed
- [ ] Monitoring enabled
- [ ] Team notified of deployment

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/domains)

---

**Last Updated**: January 2024  
**Vercel Platform Version**: Latest  
**Next.js Version**: 14.2.0+

