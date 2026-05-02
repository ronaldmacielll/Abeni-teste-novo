-- Migration: Configure Row Level Security (RLS)
-- Description: Implements RLS policies to enforce multi-tenant data isolation by client_id
-- Requirements: 2.2, 2.3

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on client_config table
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own profile
-- Ensures users can only SELECT their own profile record
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
-- Ensures users can only UPDATE their own profile record
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for initial profile creation)
-- Ensures users can only INSERT a profile for themselves
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can manage all profiles (for admin operations)
-- Allows backend services with service_role key to manage all profiles
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- CLIENT_CONFIG TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their client's configuration
-- Ensures users can only SELECT config for their own client_id
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

-- Policy: Internal users can update their client's configuration
-- Ensures only internal role users can UPDATE their client's config
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

-- Policy: Internal users can insert client configuration
-- Ensures only internal role users can INSERT new client configs
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

-- Policy: Service role can manage all client configs (for admin operations)
-- Allows backend services with service_role key to manage all configs
CREATE POLICY "Service role can manage all client configs" 
  ON public.client_config
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Enforces multi-tenant isolation: users can only view their own profile';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
  'Enforces multi-tenant isolation: users can only update their own profile';

COMMENT ON POLICY "Users can view own client config" ON public.client_config IS 
  'Enforces multi-tenant isolation: users can only view config for their client_id';

COMMENT ON POLICY "Internal users can update client config" ON public.client_config IS 
  'Only internal role users can modify client configuration';

COMMENT ON POLICY "Internal users can insert client config" ON public.client_config IS 
  'Only internal role users can create new client configurations';
