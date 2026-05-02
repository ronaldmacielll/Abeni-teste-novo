# Database Migrations

This directory contains SQL migration files for the Supabase database schema.

## Overview

The database schema implements a multi-tenant architecture with Row Level Security (RLS) to ensure data isolation between clients.

### Tables

1. **profiles** - Extends Supabase auth.users with client_id and role information
2. **client_config** - Stores ClickUp list IDs and field mappings per client

### Security

Row Level Security (RLS) policies enforce:
- Users can only access their own profile data
- Users can only access configuration for their client_id
- Internal users have additional permissions to manage client configurations
- Service role has full access for administrative operations

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. `20240101000000_create_profiles_table.sql` - Creates profiles table with indexes
2. `20240101000001_create_client_config_table.sql` - Creates client_config table
3. `20240101000002_configure_row_level_security.sql` - Configures RLS policies

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content in order
4. Click **Run** for each migration

### Option 2: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push

# Or apply migrations manually
supabase db execute -f supabase/migrations/20240101000000_create_profiles_table.sql
supabase db execute -f supabase/migrations/20240101000001_create_client_config_table.sql
supabase db execute -f supabase/migrations/20240101000002_configure_row_level_security.sql
```

### Option 3: psql (Direct Database Connection)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run each migration
\i supabase/migrations/20240101000000_create_profiles_table.sql
\i supabase/migrations/20240101000001_create_client_config_table.sql
\i supabase/migrations/20240101000002_configure_row_level_security.sql
```

## Verification

After applying migrations, verify the schema:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'client_config');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'client_config');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'client_config');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Rollback

If you need to rollback migrations, use the rollback script:

```bash
# Using Supabase CLI
supabase db execute -f supabase/migrations/rollback.sql

# Or via SQL Editor in Supabase Dashboard
```

See `rollback.sql` for the rollback script.

## Seed Data

After applying migrations, you can insert test data:

```sql
-- Create a test user profile (replace UUID with actual auth.users id)
INSERT INTO public.profiles (id, email, client_id, role, metadata)
VALUES (
  'user-uuid-from-auth-users',
  'test@example.com',
  'client-test-123',
  'internal',
  '{"name": "Test User", "company": "Test Company"}'::jsonb
);

-- Create test client configuration
INSERT INTO public.client_config (
  client_id,
  clickup_performance_list_id,
  clickup_financial_list_id,
  field_mappings
)
VALUES (
  'client-test-123',
  'your_performance_list_id',
  'your_financial_list_id',
  '{
    "performance": {
      "alcance": "field_id_1",
      "engajamento": "field_id_2",
      "impressoes": "field_id_3",
      "cliques": "field_id_4",
      "status": "field_id_5",
      "imagem": "field_id_6"
    },
    "financial": {
      "valor": "field_id_7",
      "tipo": "field_id_8",
      "status": "field_id_9",
      "dataVencimento": "field_id_10",
      "impostosTaxas": "field_id_11",
      "parcelamento": "field_id_12"
    }
  }'::jsonb
);
```

## Schema Diagram

```
┌─────────────────────────────────────────┐
│ auth.users (Supabase managed)           │
│ ─────────────────────────────────────── │
│ id (UUID, PK)                           │
│ email                                   │
│ ...                                     │
└─────────────────────────────────────────┘
                  │
                  │ (1:1)
                  ▼
┌─────────────────────────────────────────┐
│ public.profiles                         │
│ ─────────────────────────────────────── │
│ id (UUID, PK, FK → auth.users)          │
│ email (TEXT)                            │
│ client_id (TEXT) ◄──────────────┐       │
│ role (TEXT)                     │       │
│ metadata (JSONB)                │       │
│ created_at (TIMESTAMPTZ)        │       │
│ updated_at (TIMESTAMPTZ)        │       │
│                                 │       │
│ Indexes:                        │       │
│ - idx_profiles_client_id        │       │
│ - idx_profiles_email            │       │
└─────────────────────────────────────────┘
                                  │
                                  │ (N:1)
                                  ▼
┌─────────────────────────────────────────┐
│ public.client_config                    │
│ ─────────────────────────────────────── │
│ client_id (TEXT, PK)                    │
│ clickup_performance_list_id (TEXT)      │
│ clickup_financial_list_id (TEXT)        │
│ field_mappings (JSONB)                  │
│ created_at (TIMESTAMPTZ)                │
│ updated_at (TIMESTAMPTZ)                │
└─────────────────────────────────────────┘
```

## RLS Policy Summary

### profiles table

| Policy Name | Operation | Rule |
|------------|-----------|------|
| Users can view own profile | SELECT | auth.uid() = id |
| Users can update own profile | UPDATE | auth.uid() = id |
| Users can insert own profile | INSERT | auth.uid() = id |
| Service role can manage all profiles | ALL | role = 'service_role' |

### client_config table

| Policy Name | Operation | Rule |
|------------|-----------|------|
| Users can view own client config | SELECT | client_id matches user's client_id |
| Internal users can update client config | UPDATE | client_id matches AND role = 'internal' |
| Internal users can insert client config | INSERT | client_id matches AND role = 'internal' |
| Service role can manage all client configs | ALL | role = 'service_role' |

## Requirements Mapping

- **Requirement 2.1**: JWT client_id extraction → Implemented via profiles.client_id
- **Requirement 2.2**: Multi-tenant filtering → Implemented via RLS policies
- **Requirement 2.3**: Authorization enforcement → Implemented via RLS policies
- **Requirement 18.1**: Modular architecture → Separate tables for profiles and config
- **Requirement 20.4**: Extensibility → field_mappings JSONB allows dynamic fields

## Troubleshooting

### Issue: "permission denied for table profiles"

**Cause**: RLS is enabled but no policy allows the operation.

**Solution**: Ensure the user has a valid JWT token and the appropriate role.

### Issue: "new row violates row-level security policy"

**Cause**: Trying to insert/update data that doesn't match RLS policy conditions.

**Solution**: Verify the client_id in the data matches the authenticated user's client_id.

### Issue: "relation 'profiles' does not exist"

**Cause**: Migrations haven't been applied.

**Solution**: Apply migrations in order as described above.

## Additional Resources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
