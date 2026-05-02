-- Seed Data for Development and Testing
-- Description: Inserts sample data for testing the multi-tenant portal
-- NOTE: Replace UUIDs with actual auth.users IDs from your Supabase Auth

-- ============================================================================
-- SEED PROFILES
-- ============================================================================

-- Internal User (Full Access)
-- Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with actual auth.users UUID
INSERT INTO public.profiles (id, email, client_id, role, metadata)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin@agency.com',
  'agency-internal',
  'internal',
  '{
    "name": "Admin User",
    "company": "Digital Agency",
    "department": "Management"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  client_id = EXCLUDED.client_id,
  role = EXCLUDED.role,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Client User 1 (Performance Module Only)
-- Replace 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' with actual auth.users UUID
INSERT INTO public.profiles (id, email, client_id, role, metadata)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'client1@example.com',
  'client-acme-corp',
  'client',
  '{
    "name": "John Doe",
    "company": "ACME Corporation"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  client_id = EXCLUDED.client_id,
  role = EXCLUDED.role,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Client User 2 (Performance Module Only)
-- Replace 'cccccccc-cccc-cccc-cccc-cccccccccccc' with actual auth.users UUID
INSERT INTO public.profiles (id, email, client_id, role, metadata)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'client2@example.com',
  'client-tech-startup',
  'client',
  '{
    "name": "Jane Smith",
    "company": "Tech Startup Inc"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  client_id = EXCLUDED.client_id,
  role = EXCLUDED.role,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- SEED CLIENT CONFIGURATIONS
-- ============================================================================

-- Agency Internal Configuration
INSERT INTO public.client_config (
  client_id,
  clickup_performance_list_id,
  clickup_financial_list_id,
  field_mappings
)
VALUES (
  'agency-internal',
  '123456789',  -- Replace with actual ClickUp Performance List ID
  '987654321',  -- Replace with actual ClickUp Financial List ID
  '{
    "performance": {
      "alcance": "custom_field_alcance_id",
      "engajamento": "custom_field_engajamento_id",
      "impressoes": "custom_field_impressoes_id",
      "cliques": "custom_field_cliques_id",
      "status": "custom_field_status_id",
      "imagem": "custom_field_imagem_id"
    },
    "financial": {
      "valor": "custom_field_valor_id",
      "tipo": "custom_field_tipo_id",
      "status": "custom_field_status_id",
      "dataVencimento": "custom_field_data_vencimento_id",
      "impostosTaxas": "custom_field_impostos_taxas_id",
      "parcelamento": "custom_field_parcelamento_id"
    }
  }'::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET
  clickup_performance_list_id = EXCLUDED.clickup_performance_list_id,
  clickup_financial_list_id = EXCLUDED.clickup_financial_list_id,
  field_mappings = EXCLUDED.field_mappings,
  updated_at = NOW();

-- ACME Corporation Configuration
INSERT INTO public.client_config (
  client_id,
  clickup_performance_list_id,
  clickup_financial_list_id,
  field_mappings
)
VALUES (
  'client-acme-corp',
  '111111111',  -- Replace with actual ClickUp Performance List ID for ACME
  NULL,         -- Client users don't have access to financial module
  '{
    "performance": {
      "alcance": "custom_field_alcance_id",
      "engajamento": "custom_field_engajamento_id",
      "impressoes": "custom_field_impressoes_id",
      "cliques": "custom_field_cliques_id",
      "status": "custom_field_status_id",
      "imagem": "custom_field_imagem_id"
    }
  }'::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET
  clickup_performance_list_id = EXCLUDED.clickup_performance_list_id,
  clickup_financial_list_id = EXCLUDED.clickup_financial_list_id,
  field_mappings = EXCLUDED.field_mappings,
  updated_at = NOW();

-- Tech Startup Configuration
INSERT INTO public.client_config (
  client_id,
  clickup_performance_list_id,
  clickup_financial_list_id,
  field_mappings
)
VALUES (
  'client-tech-startup',
  '222222222',  -- Replace with actual ClickUp Performance List ID for Tech Startup
  NULL,         -- Client users don't have access to financial module
  '{
    "performance": {
      "alcance": "custom_field_alcance_id",
      "engajamento": "custom_field_engajamento_id",
      "impressoes": "custom_field_impressoes_id",
      "cliques": "custom_field_cliques_id",
      "status": "custom_field_status_id",
      "imagem": "custom_field_imagem_id"
    }
  }'::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET
  clickup_performance_list_id = EXCLUDED.clickup_performance_list_id,
  clickup_financial_list_id = EXCLUDED.clickup_financial_list_id,
  field_mappings = EXCLUDED.field_mappings,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify profiles were inserted
SELECT 
  id,
  email,
  client_id,
  role,
  metadata->>'name' as name,
  metadata->>'company' as company,
  created_at
FROM public.profiles
ORDER BY role DESC, email;

-- Verify client configs were inserted
SELECT 
  client_id,
  clickup_performance_list_id,
  clickup_financial_list_id,
  jsonb_pretty(field_mappings) as field_mappings,
  created_at
FROM public.client_config
ORDER BY client_id;

-- ============================================================================
-- NOTES
-- ============================================================================

-- To use this seed data:
-- 1. First create users in Supabase Auth with the emails above
-- 2. Copy the auth.users UUIDs
-- 3. Replace the placeholder UUIDs in this file
-- 4. Get your ClickUp List IDs from ClickUp
-- 5. Get your ClickUp Custom Field IDs using the ClickUp API
-- 6. Replace the placeholder IDs in field_mappings
-- 7. Run this script in Supabase SQL Editor

-- To get ClickUp Custom Field IDs:
-- curl -X GET \
--   'https://api.clickup.com/api/v2/list/YOUR_LIST_ID/field' \
--   -H 'Authorization: YOUR_CLICKUP_API_KEY'
