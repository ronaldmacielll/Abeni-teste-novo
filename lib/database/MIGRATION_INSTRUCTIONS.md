# Instagram Integration Database Migration

## Overview

This document describes how to apply the Instagram Business Integration database schema to your Supabase PostgreSQL database.

## Prerequisites

- Supabase project set up and configured
- Access to Supabase SQL Editor or psql CLI
- Proper authentication credentials

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content of `lib/database/migrations/001_instagram_integration.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify that all tables and indexes were created successfully

### Option 2: Using psql CLI

```bash
# Connect to your Supabase database
psql -h <your-supabase-host> -U postgres -d postgres

# Execute the migration file
\i lib/database/migrations/001_instagram_integration.sql

# Verify tables were created
\dt instagram_*

# Verify indexes were created
\di instagram_*
```

### Option 3: Using Node.js Script

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  const sql = fs.readFileSync('lib/database/migrations/001_instagram_integration.sql', 'utf-8')
  
  const { error } = await supabase.rpc('exec', { sql })
  
  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  
  console.log('Migration completed successfully')
}

runMigration()
```

## What Gets Created

### Tables

1. **instagram_credentials**
   - Stores encrypted Instagram Business API credentials
   - One record per configured Instagram account
   - Includes validation timestamps and expiration tracking

2. **instagram_post_mappings**
   - Maps Instagram posts to ClickUp tasks
   - Enables deduplication and update tracking
   - Tracks last metrics update time

3. **instagram_sync_history**
   - Records every sync job execution
   - Tracks success/failure and metrics
   - Useful for monitoring and debugging

4. **instagram_audit_logs**
   - Audit trail for all credential operations
   - Tracks who did what and when
   - Includes error messages for failed operations

### Indexes

- Performance indexes on frequently queried columns
- Composite indexes for common filter combinations
- Timestamp indexes for time-range queries

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only see their own credentials and related data
- Automatic enforcement of multi-tenant isolation

### Triggers

- Automatic `updated_at` timestamp updates
- Ensures data consistency

## Verification

After running the migration, verify everything was created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'instagram_%';

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND tablename LIKE 'instagram_%';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'instagram_%';
```

## Rollback

If you need to rollback the migration:

```sql
-- Drop all Instagram-related objects
DROP TRIGGER IF EXISTS instagram_post_mappings_updated_at_trigger ON instagram_post_mappings;
DROP TRIGGER IF EXISTS instagram_credentials_updated_at_trigger ON instagram_credentials;
DROP FUNCTION IF EXISTS update_instagram_post_mappings_updated_at();
DROP FUNCTION IF EXISTS update_instagram_credentials_updated_at();
DROP TABLE IF EXISTS instagram_audit_logs;
DROP TABLE IF EXISTS instagram_sync_history;
DROP TABLE IF EXISTS instagram_post_mappings;
DROP TABLE IF EXISTS instagram_credentials;
```

## Troubleshooting

### Error: "relation already exists"

This means the tables were already created. You can safely ignore this error or drop the tables first and re-run the migration.

### Error: "permission denied"

Make sure you're using a role with sufficient permissions (e.g., `postgres` or a role with `SUPERUSER` privileges).

### Error: "auth.users table not found"

Make sure Supabase Auth is enabled in your project. The migration references `auth.users` which is created by Supabase automatically.

## Next Steps

After the migration is complete:

1. Verify all tables and indexes were created
2. Test RLS policies by querying as different users
3. Proceed with implementing the CredentialManager service
4. Configure environment variables for encryption keys

## References

- [Supabase SQL Editor Documentation](https://supabase.com/docs/guides/database/sql-editor)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
