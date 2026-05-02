# Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Portal de Performance + Gestão Financeira database schema implemented in Supabase PostgreSQL.

## Architecture

The database follows a **multi-tenant architecture** with **Row Level Security (RLS)** to ensure complete data isolation between clients. The schema extends Supabase's built-in authentication system with custom tables for user profiles and client configurations.

### Design Principles

1. **Multi-Tenancy**: Each client's data is isolated using `client_id` as the tenant identifier
2. **Security First**: RLS policies enforce access control at the database level
3. **Extensibility**: JSONB fields allow dynamic configuration without schema changes
4. **Auditability**: All tables include `created_at` and `updated_at` timestamps
5. **Referential Integrity**: Foreign keys ensure data consistency

## Tables

### 1. profiles

Extends Supabase's `auth.users` table with application-specific user information.

#### Schema

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'internal')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FOREIGN KEY → auth.users | User's unique identifier (matches Supabase auth.users.id) |
| `email` | TEXT | NOT NULL | User's email address (duplicated for convenience) |
| `client_id` | TEXT | NOT NULL | Tenant identifier linking user to their data |
| `role` | TEXT | NOT NULL, CHECK | User role: 'client' or 'internal' |
| `metadata` | JSONB | DEFAULT '{}' | Additional user information (name, company, etc.) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### Indexes

```sql
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

- **idx_profiles_client_id**: Optimizes queries filtering by client_id (most common operation)
- **idx_profiles_email**: Optimizes user lookup by email

#### Roles

- **client**: External users who can view their performance metrics only
- **internal**: Agency staff with access to both performance and financial modules

#### Metadata Structure

The `metadata` JSONB field can contain:

```json
{
  "name": "User Full Name",
  "company": "Company Name",
  "department": "Department Name",
  "phone": "+1234567890",
  "preferences": {
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo"
  }
}
```

#### Example Queries

```sql
-- Get user profile with client_id
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Get all users for a specific client
SELECT * FROM public.profiles WHERE client_id = 'client-123';

-- Get internal users only
SELECT * FROM public.profiles WHERE role = 'internal';

-- Search users by name
SELECT * FROM public.profiles WHERE metadata->>'name' ILIKE '%john%';
```

### 2. client_config

Stores client-specific configuration for ClickUp integration and field mappings.

#### Schema

```sql
CREATE TABLE public.client_config (
  client_id TEXT PRIMARY KEY,
  clickup_performance_list_id TEXT NOT NULL,
  clickup_financial_list_id TEXT,
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `client_id` | TEXT | PRIMARY KEY | Unique client identifier (tenant ID) |
| `clickup_performance_list_id` | TEXT | NOT NULL | ClickUp list ID for performance/social media posts |
| `clickup_financial_list_id` | TEXT | NULL | ClickUp list ID for financial transactions (optional) |
| `field_mappings` | JSONB | NOT NULL, DEFAULT '{}' | Maps custom field names to ClickUp field IDs |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Configuration creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### Field Mappings Structure

The `field_mappings` JSONB field contains mappings for both modules:

```json
{
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
}
```

#### Why JSONB for Field Mappings?

1. **Flexibility**: Add new custom fields without schema migrations
2. **Client-Specific**: Each client can have different ClickUp custom field IDs
3. **Queryable**: PostgreSQL JSONB supports indexing and querying
4. **Extensibility**: Easy to add new modules or field types

#### Example Queries

```sql
-- Get client configuration
SELECT * FROM public.client_config WHERE client_id = 'client-123';

-- Get performance list ID for a client
SELECT clickup_performance_list_id 
FROM public.client_config 
WHERE client_id = 'client-123';

-- Get specific field mapping
SELECT field_mappings->'performance'->>'alcance' as alcance_field_id
FROM public.client_config 
WHERE client_id = 'client-123';

-- Update field mappings
UPDATE public.client_config
SET field_mappings = jsonb_set(
  field_mappings,
  '{performance,alcance}',
  '"new_field_id"'
)
WHERE client_id = 'client-123';
```

## Row Level Security (RLS)

RLS policies enforce multi-tenant data isolation at the database level, ensuring users can only access data belonging to their client_id.

### Why RLS?

1. **Defense in Depth**: Security enforced at database level, not just application level
2. **Automatic Enforcement**: Policies apply to all queries, preventing accidental data leaks
3. **Supabase Integration**: Works seamlessly with Supabase Auth JWT tokens
4. **Audit Trail**: Policy violations are logged automatically

### profiles Table Policies

#### 1. Users can view own profile

```sql
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);
```

**Purpose**: Users can only SELECT their own profile record.

**Logic**: Compares the authenticated user's ID (`auth.uid()`) with the profile's `id`.

#### 2. Users can update own profile

```sql
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);
```

**Purpose**: Users can only UPDATE their own profile record.

**Logic**: Same as SELECT policy - ensures users can't modify other users' profiles.

#### 3. Users can insert own profile

```sql
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

**Purpose**: Users can only INSERT a profile for themselves.

**Logic**: Uses `WITH CHECK` to validate the inserted `id` matches `auth.uid()`.

#### 4. Service role can manage all profiles

```sql
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');
```

**Purpose**: Backend services with service_role key can manage all profiles.

**Logic**: Checks if the JWT contains `role = 'service_role'`.

### client_config Table Policies

#### 1. Users can view own client config

```sql
CREATE POLICY "Users can view own client config" 
  ON public.client_config
  FOR SELECT 
  USING (
    client_id IN (
      SELECT client_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
```

**Purpose**: Users can only SELECT config for their own client_id.

**Logic**: Subquery checks if the config's `client_id` matches the user's `client_id` from their profile.

#### 2. Internal users can update client config

```sql
CREATE POLICY "Internal users can update client config" 
  ON public.client_config
  FOR UPDATE 
  USING (
    client_id IN (
      SELECT client_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'internal'
    )
  );
```

**Purpose**: Only internal role users can UPDATE their client's config.

**Logic**: Subquery checks both `client_id` match AND user has `role = 'internal'`.

#### 3. Internal users can insert client config

```sql
CREATE POLICY "Internal users can insert client config" 
  ON public.client_config
  FOR INSERT 
  WITH CHECK (
    client_id IN (
      SELECT client_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'internal'
    )
  );
```

**Purpose**: Only internal role users can INSERT new client configs.

**Logic**: Same as UPDATE policy - validates role and client_id match.

#### 4. Service role can manage all client configs

```sql
CREATE POLICY "Service role can manage all client configs" 
  ON public.client_config
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');
```

**Purpose**: Backend services can manage all client configurations.

**Logic**: Checks for service_role in JWT.

## Multi-Tenant Data Flow

### Authentication Flow

```
1. User logs in via Supabase Auth
   ↓
2. Supabase generates JWT with user ID
   ↓
3. Application queries profiles table
   ↓
4. RLS policy checks: auth.uid() = profiles.id
   ↓
5. User's profile (including client_id) is returned
   ↓
6. Application uses client_id for all subsequent queries
```

### Data Access Flow

```
1. User requests data (e.g., performance posts)
   ↓
2. Application queries client_config with user's client_id
   ↓
3. RLS policy validates: client_id matches user's client_id
   ↓
4. Configuration (ClickUp list IDs, field mappings) is returned
   ↓
5. Application calls ClickUp API with list ID
   ↓
6. Application filters ClickUp data by client_id
   ↓
7. Data is returned to user
```

### Security Guarantees

1. **User A cannot access User B's profile** - Enforced by `auth.uid() = id` policy
2. **User A cannot access Client B's config** - Enforced by client_id subquery policy
3. **Client users cannot modify configs** - Enforced by role check in UPDATE/INSERT policies
4. **All queries are automatically filtered** - RLS applies to all database operations

## Performance Considerations

### Indexes

The schema includes strategic indexes to optimize common queries:

1. **idx_profiles_client_id**: Speeds up queries filtering by client_id (most common)
2. **idx_profiles_email**: Speeds up user lookup by email during authentication

### Query Optimization Tips

```sql
-- GOOD: Uses index on client_id
SELECT * FROM profiles WHERE client_id = 'client-123';

-- GOOD: Uses index on email
SELECT * FROM profiles WHERE email = 'user@example.com';

-- AVOID: Full table scan (no index on metadata)
SELECT * FROM profiles WHERE metadata->>'name' = 'John';

-- BETTER: Create GIN index if needed
CREATE INDEX idx_profiles_metadata ON profiles USING GIN (metadata);
```

### JSONB Performance

JSONB fields are efficient for:
- Storage (binary format)
- Querying (supports operators and indexing)
- Updates (partial updates without rewriting entire JSON)

For frequently queried JSONB paths, consider GIN indexes:

```sql
-- Index for querying field_mappings
CREATE INDEX idx_client_config_field_mappings 
ON client_config USING GIN (field_mappings);
```

## Maintenance

### Updating Timestamps

Consider adding triggers to automatically update `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_config_updated_at
  BEFORE UPDATE ON public.client_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Backup Strategy

1. **Supabase Automatic Backups**: Enabled by default (daily backups, 7-day retention)
2. **Manual Backups**: Use `pg_dump` for critical data
3. **Point-in-Time Recovery**: Available on Supabase Pro plan

### Monitoring

Monitor these metrics:
- Query performance (slow queries)
- RLS policy violations (security audit)
- Table size growth
- Index usage statistics

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Requirements Traceability

| Requirement | Implementation | Location |
|-------------|----------------|----------|
| 2.1 - Extract client_id from JWT | profiles.client_id column | profiles table |
| 2.2 - Filter by client_id | RLS policies with client_id checks | All policies |
| 2.3 - Deny cross-client access | RLS USING clauses | All policies |
| 18.1 - Modular architecture | Separate profiles and client_config tables | Schema design |
| 20.4 - Extensible field mappings | field_mappings JSONB column | client_config table |

## Migration History

| Version | Date | Description | Files |
|---------|------|-------------|-------|
| 20240101000000 | 2024-01-01 | Create profiles table | create_profiles_table.sql |
| 20240101000001 | 2024-01-01 | Create client_config table | create_client_config_table.sql |
| 20240101000002 | 2024-01-01 | Configure RLS policies | configure_row_level_security.sql |

## Testing

### Unit Tests

Test RLS policies with different user contexts:

```sql
-- Test as client user
SET request.jwt.claims = '{"sub": "client-user-id", "role": "authenticated"}';

-- Should succeed: viewing own profile
SELECT * FROM profiles WHERE id = 'client-user-id';

-- Should fail: viewing other user's profile
SELECT * FROM profiles WHERE id = 'other-user-id';

-- Should fail: updating client config (not internal role)
UPDATE client_config SET clickup_performance_list_id = 'new-id' WHERE client_id = 'client-123';
```

### Integration Tests

Test complete data flow:

1. Create user in Supabase Auth
2. Insert profile with client_id
3. Insert client_config
4. Authenticate as user
5. Query profile (should succeed)
6. Query client_config (should succeed)
7. Attempt to query other client's config (should fail)

## Troubleshooting

See the main README.md for common issues and solutions.

## Additional Resources

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
