-- Rollback Script
-- Description: Removes all tables, policies, and indexes created by the migrations
-- WARNING: This will delete all data in the profiles and client_config tables!

-- ============================================================================
-- DROP POLICIES
-- ============================================================================

-- Drop profiles table policies
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Drop client_config table policies
DROP POLICY IF EXISTS "Service role can manage all client configs" ON public.client_config;
DROP POLICY IF EXISTS "Internal users can insert client config" ON public.client_config;
DROP POLICY IF EXISTS "Internal users can update client config" ON public.client_config;
DROP POLICY IF EXISTS "Users can view own client config" ON public.client_config;

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_config DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_client_id;

-- ============================================================================
-- DROP TABLES
-- ============================================================================

-- Drop client_config first (no foreign key dependencies)
DROP TABLE IF EXISTS public.client_config;

-- Drop profiles (has foreign key to auth.users)
DROP TABLE IF EXISTS public.profiles;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('profiles', 'client_config')
  ) THEN
    RAISE NOTICE 'WARNING: Some tables still exist!';
  ELSE
    RAISE NOTICE 'SUCCESS: All tables have been dropped.';
  END IF;
END $$;
