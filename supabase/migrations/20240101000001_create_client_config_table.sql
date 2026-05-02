-- Migration: Create client_config table
-- Description: Creates the client_config table to store ClickUp list IDs and field mappings per client
-- Requirements: 18.1, 20.4

-- Create client_config table
CREATE TABLE IF NOT EXISTS public.client_config (
  client_id TEXT PRIMARY KEY,
  clickup_performance_list_id TEXT NOT NULL,
  clickup_financial_list_id TEXT,
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.client_config IS 'Client-specific configuration for ClickUp integration and field mappings';
COMMENT ON COLUMN public.client_config.client_id IS 'Unique client identifier (primary key)';
COMMENT ON COLUMN public.client_config.clickup_performance_list_id IS 'ClickUp list ID for performance/social media posts';
COMMENT ON COLUMN public.client_config.clickup_financial_list_id IS 'ClickUp list ID for financial transactions (optional for client-only users)';
COMMENT ON COLUMN public.client_config.field_mappings IS 'JSON mapping of custom field names to ClickUp field IDs for dynamic field resolution';
COMMENT ON COLUMN public.client_config.created_at IS 'Timestamp when configuration was created';
COMMENT ON COLUMN public.client_config.updated_at IS 'Timestamp when configuration was last updated';

-- Example field_mappings structure:
-- {
--   "performance": {
--     "alcance": "field_id_1",
--     "engajamento": "field_id_2",
--     "impressoes": "field_id_3",
--     "cliques": "field_id_4",
--     "status": "field_id_5",
--     "imagem": "field_id_6"
--   },
--   "financial": {
--     "valor": "field_id_7",
--     "tipo": "field_id_8",
--     "status": "field_id_9",
--     "dataVencimento": "field_id_10",
--     "impostosTaxas": "field_id_11",
--     "parcelamento": "field_id_12"
--   }
-- }
