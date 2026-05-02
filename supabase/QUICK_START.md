# Database Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Apply Migrations

**Using Supabase Dashboard** (Easiest):

1. Go to your Supabase project → **SQL Editor**
2. Copy and paste each file content in order:
   - `migrations/20240101000000_create_profiles_table.sql`
   - `migrations/20240101000001_create_client_config_table.sql`
   - `migrations/20240101000002_configure_row_level_security.sql`
3. Click **Run** for each

**Using Supabase CLI** (Recommended):

```bash
supabase db push
```

### Step 2: Verify

Run this in SQL Editor:

```sql
-- Should return 2 rows
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'client_config');
```

### Step 3: Create Test User

1. Go to **Authentication** → **Users** → **Add user**
2. Create a test user (e.g., `test@example.com`)
3. Copy the user's UUID

### Step 4: Insert Test Data

Edit `seed.sql` and replace:
- `'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'` with your user's UUID
- `'123456789'` with your ClickUp Performance List ID
- `'987654321'` with your ClickUp Financial List ID
- Custom field IDs in `field_mappings`

Then run in SQL Editor:

```sql
-- Paste content from seed.sql here
```

### Step 5: Test

```sql
-- Should return your test user's profile
SELECT * FROM profiles;

-- Should return your test client config
SELECT * FROM client_config;
```

## ✅ Done!

Your database is ready. The application can now:
- Authenticate users
- Load user profiles with client_id
- Load client-specific ClickUp configurations
- Enforce multi-tenant data isolation

## 📚 Need More Info?

- **Detailed Setup**: See `migrations/README.md`
- **Schema Details**: See `SCHEMA_DOCUMENTATION.md`
- **Implementation Summary**: See `TASK_16_IMPLEMENTATION_SUMMARY.md`

## 🆘 Troubleshooting

### "permission denied for table profiles"

**Solution**: RLS is enabled. Make sure you're authenticated with a valid JWT token.

### "relation 'profiles' does not exist"

**Solution**: Migrations haven't been applied. Go back to Step 1.

### "new row violates row-level security policy"

**Solution**: The data you're trying to insert doesn't match your user's client_id.

## 🔄 Rollback

If you need to start over:

```sql
-- Run this in SQL Editor
-- WARNING: This deletes all data!
```

Then paste content from `migrations/rollback.sql`.
