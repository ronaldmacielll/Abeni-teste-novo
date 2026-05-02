-- Migration: Create profiles table
-- Description: Creates the profiles table that extends Supabase auth.users with client_id and role information
-- Requirements: 2.1, 18.1

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'internal')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users with client_id and role for multi-tenant access control';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN public.profiles.email IS 'User email address (duplicated from auth.users for convenience)';
COMMENT ON COLUMN public.profiles.client_id IS 'Unique identifier linking user to their ClickUp lists and data';
COMMENT ON COLUMN public.profiles.role IS 'User role: client (view performance only) or internal (full access)';
COMMENT ON COLUMN public.profiles.metadata IS 'Additional user metadata (name, company, etc.)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';
