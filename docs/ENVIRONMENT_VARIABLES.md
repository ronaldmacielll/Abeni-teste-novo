# Environment Variables Guide

## Overview

This guide provides detailed information about all environment variables required for the Portal de Performance + Gestão Financeira application.

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [How to Obtain Credentials](#how-to-obtain-credentials)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Validation and Troubleshooting](#validation-and-troubleshooting)

---

## Required Variables

These variables MUST be configured for the application to function properly.

### ClickUp API Configuration

#### `CLICKUP_API_KEY`
- **Type**: Secret
- **Required**: Yes
- **Description**: API key for authenticating with ClickUp API
- **Format**: `pk_XXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Where to use**: Production, Preview, Development
- **How to obtain**: See [Obtaining ClickUp API Key](#obtaining-clickup-api-key)

#### `CLICKUP_PERFORMANCE_LIST_ID`
- **Type**: Secret
- **Required**: Yes
- **Description**: ClickUp list ID containing social media post data
- **Format**: Numeric string (e.g., `123456789`)
- **Where to use**: Production, Preview, Development
- **How to obtain**: See [Finding ClickUp List IDs](#finding-clickup-list-ids)

#### `CLICKUP_FINANCIAL_LIST_ID`
- **Type**: Secret
- **Required**: Yes
- **Description**: ClickUp list ID containing financial transaction data
- **Format**: Numeric string (e.g., `987654321`)
- **Where to use**: Production, Preview, Development
- **How to obtain**: See [Finding ClickUp List IDs](#finding-clickup-list-ids)

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Type**: Public (exposed to browser)
- **Required**: Yes
- **Description**: Supabase project URL
- **Format**: `https://[project-id].supabase.co`
- **Where to use**: Production, Preview, Development
- **How to obtain**: See [Obtaining Supabase Credentials](#obtaining-supabase-credentials)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type**: Public (exposed to browser)
- **Required**: Yes
- **Description**: Supabase anonymous/public API key
- **Format**: Long JWT string starting with `eyJ...`
- **Where to use**: Production, Preview, Development
- **How to obtain**: See [Obtaining Supabase Credentials](#obtaining-supabase-credentials)
- **Note**: This is safe to expose publicly as it only allows authenticated operations

### Application Configuration

#### `NEXT_PUBLIC_BASE_URL`
- **Type**: Public (exposed to browser)
- **Required**: Yes
- **Description**: Base URL of the application
- **Format**: Full URL with protocol
- **Examples**:
  - Development: `http://localhost:3000`
  - Staging: `https://portal-staging.vercel.app`
  - Production: `https://portal.example.com`
- **Where to use**: Production, Preview, Development

#### `JWT_SECRET`
- **Type**: Secret (NEVER expose to browser)
- **Required**: Yes
- **Description**: Secret key for signing and validating JWT tokens
- **Format**: Random base64 string (minimum 32 characters)
- **Where to use**: Production, Preview, Development
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
- **Security**: Use different secrets for each environment

#### `NODE_ENV`
- **Type**: System variable
- **Required**: Yes (auto-set by Vercel)
- **Description**: Node.js environment
- **Valid values**: `development`, `production`, `test`
- **Where to use**: All environments
- **Note**: Automatically set by Vercel, no manual configuration needed

---

## Optional Variables

These variables are optional but may be needed for specific configurations.

### ClickUp Custom Field IDs

If your ClickUp lists use custom field IDs that differ from the default mapping:

#### `CLICKUP_FIELD_ALCANCE`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for "Alcance" (Reach) metric
- **Format**: UUID or field ID string

#### `CLICKUP_FIELD_ENGAJAMENTO`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for "Engajamento" (Engagement) metric

#### `CLICKUP_FIELD_IMPRESSOES`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for "Impressões" (Impressions) metric

#### `CLICKUP_FIELD_CLIQUES`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for "Cliques" (Clicks) metric

#### `CLICKUP_FIELD_STATUS`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for post status

#### `CLICKUP_FIELD_IMAGEM`
- **Type**: Secret
- **Required**: No
- **Description**: Custom field ID for post image/thumbnail

---

## How to Obtain Credentials

### Obtaining ClickUp API Key

1. **Login to ClickUp**
   - Go to [app.clickup.com](https://app.clickup.com)
   - Sign in with your account

2. **Navigate to Settings**
   - Click your profile picture (bottom left)
   - Select "Settings"

3. **Generate API Key**
   - Click "Apps" in the left sidebar
   - Scroll to "API Token" section
   - Click "Generate" or "Regenerate"
   - Copy the API key (starts with `pk_`)

4. **Important Notes**
   - Keep this key secret - it provides full access to your ClickUp workspace
   - Never commit it to Git
   - Regenerate if compromised

### Finding ClickUp List IDs

1. **Navigate to Your List**
   - Open ClickUp
   - Go to the list you want to use (Performance or Financial)

2. **Get List ID from URL**
   - Look at the browser URL bar
   - Format: `https://app.clickup.com/[workspace]/v/li/[LIST_ID]`
   - The LIST_ID is the numeric value after `/li/`
   - Example: `https://app.clickup.com/123/v/li/987654321`
     - List ID: `987654321`

3. **Alternative: Use ClickUp API**
   ```bash
   curl -H "Authorization: YOUR_API_KEY" \
     https://api.clickup.com/api/v2/team/[TEAM_ID]/space/[SPACE_ID]/list
   ```

### Obtaining Supabase Credentials

1. **Login to Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Sign in or create account

2. **Create or Select Project**
   - Create new project or select existing one
   - Wait for project to finish provisioning

3. **Get API Credentials**
   - Go to Project Settings (gear icon)
   - Click "API" in the sidebar
   - Copy the following:
     - **Project URL**: Under "Project URL" section
     - **Anon/Public Key**: Under "Project API keys" → "anon public"

4. **Configure Database**
   - Run the SQL scripts from README.md to create required tables
   - Configure Row Level Security policies

---

## Environment-Specific Configuration

### Development Environment

Create `.env.local` file in project root:

```env
# ClickUp
CLICKUP_API_KEY=pk_dev_your_api_key_here
CLICKUP_PERFORMANCE_LIST_ID=123456789
CLICKUP_FINANCIAL_LIST_ID=987654321

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=your_dev_jwt_secret_here
NODE_ENV=development
```

### Staging/Preview Environment

Configure in Vercel Dashboard for "Preview" environment:

```env
# Use staging ClickUp lists
CLICKUP_API_KEY=pk_staging_your_api_key_here
CLICKUP_PERFORMANCE_LIST_ID=111111111
CLICKUP_FINANCIAL_LIST_ID=222222222

# Use staging Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Staging URL
NEXT_PUBLIC_BASE_URL=https://portal-staging.vercel.app
JWT_SECRET=your_staging_jwt_secret_here
NODE_ENV=production
```

### Production Environment

Configure in Vercel Dashboard for "Production" environment:

```env
# Production ClickUp lists
CLICKUP_API_KEY=pk_prod_your_api_key_here
CLICKUP_PERFORMANCE_LIST_ID=333333333
CLICKUP_FINANCIAL_LIST_ID=444444444

# Production Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Production URL
NEXT_PUBLIC_BASE_URL=https://portal.example.com
JWT_SECRET=your_production_jwt_secret_here
NODE_ENV=production
```

---

## Security Best Practices

### 1. Never Commit Secrets to Git

```bash
# .gitignore should include:
.env
.env.local
.env.development
.env.test
.env.production
.env*.local
```

### 2. Use Different Secrets Per Environment

- **Development**: Use test/development API keys
- **Staging**: Use separate staging credentials
- **Production**: Use production-only credentials

### 3. Rotate Secrets Regularly

- **JWT_SECRET**: Rotate every 90 days
- **CLICKUP_API_KEY**: Rotate every 180 days or if compromised
- **Supabase Keys**: Monitor usage, rotate if suspicious activity

### 4. Limit Access

- Only share credentials with team members who need them
- Use Vercel team permissions to control access
- Use 1Password, LastPass, or similar for secure sharing

### 5. Monitor for Leaks

- Use tools like `git-secrets` to prevent committing secrets
- Enable GitHub secret scanning
- Monitor Vercel logs for unauthorized access

### 6. Understand Public vs Secret Variables

**Public Variables** (NEXT_PUBLIC_*):
- ✅ Safe to expose in browser
- ✅ Included in client-side bundle
- ❌ Don't use for API keys or secrets

**Secret Variables**:
- ❌ Never exposed to browser
- ✅ Only available in server-side code
- ✅ Use for API keys, JWT secrets, etc.

---

## Validation and Troubleshooting

### Validating Environment Variables

The application validates environment variables at startup. Check logs for errors:

```bash
# Local development
npm run dev

# Look for validation errors:
# ❌ Error: Missing required environment variable: CLICKUP_API_KEY
# ✅ All environment variables validated successfully
```

### Common Issues

#### Issue: "Missing required environment variable"

**Solution**:
1. Check variable name spelling (case-sensitive)
2. Verify variable is set in correct environment
3. Restart development server after adding variables
4. For Vercel: Redeploy after adding variables

#### Issue: "Invalid ClickUp API key"

**Solution**:
1. Verify API key starts with `pk_`
2. Check for extra spaces or newlines
3. Regenerate API key in ClickUp if needed
4. Ensure key has proper permissions

#### Issue: "Supabase connection failed"

**Solution**:
1. Verify NEXT_PUBLIC_SUPABASE_URL format
2. Check Supabase project is active
3. Verify anon key is correct
4. Check network connectivity

#### Issue: "JWT validation failed"

**Solution**:
1. Ensure JWT_SECRET is set
2. Verify secret is at least 32 characters
3. Check secret matches between environments
4. Clear browser cookies and re-login

### Testing Environment Variables

```bash
# Test locally
npm run dev

# Verify variables are loaded
node -e "console.log(process.env.CLICKUP_API_KEY ? 'ClickUp key loaded' : 'ClickUp key missing')"

# Test Vercel deployment
vercel env pull .env.vercel
cat .env.vercel
```

### Debugging Tips

1. **Check Vercel Logs**
   ```bash
   vercel logs <deployment-url> --follow
   ```

2. **Verify Variable Scope**
   - Ensure variables are set for correct environment (Production/Preview/Development)

3. **Test API Endpoints**
   ```bash
   # Test ClickUp connection
   curl -H "Authorization: YOUR_API_KEY" \
     https://api.clickup.com/api/v2/team

   # Test Supabase connection
   curl https://YOUR_PROJECT.supabase.co/rest/v1/
   ```

---

## Quick Reference

### Required Variables Checklist

- [ ] `CLICKUP_API_KEY`
- [ ] `CLICKUP_PERFORMANCE_LIST_ID`
- [ ] `CLICKUP_FINANCIAL_LIST_ID`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV` (auto-set by Vercel)

### Variable Types

| Variable | Type | Exposed to Browser? |
|----------|------|---------------------|
| `CLICKUP_API_KEY` | Secret | ❌ No |
| `CLICKUP_PERFORMANCE_LIST_ID` | Secret | ❌ No |
| `CLICKUP_FINANCIAL_LIST_ID` | Secret | ❌ No |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Yes |
| `NEXT_PUBLIC_BASE_URL` | Public | ✅ Yes |
| `JWT_SECRET` | Secret | ❌ No |
| `NODE_ENV` | System | ✅ Yes |

---

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables Guide](https://nextjs.org/docs/basic-features/environment-variables)
- [ClickUp API Documentation](https://clickup.com/api)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: January 2024

