-- Instagram Business Integration Database Schema
-- This migration creates all necessary tables for Instagram integration

-- ============================================================================
-- Table: instagram_credentials
-- Purpose: Store encrypted Instagram Business API credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  business_account_id VARCHAR(255) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  clickup_list_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT account_id_format CHECK (account_id ~ '^\d+$'),
  CONSTRAINT business_account_id_format CHECK (business_account_id ~ '^\d+$')
);

-- ============================================================================
-- Table: instagram_post_mappings
-- Purpose: Map Instagram posts to ClickUp tasks for deduplication
-- ============================================================================

CREATE TABLE IF NOT EXISTS instagram_post_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_post_id VARCHAR(255) NOT NULL,
  instagram_account_id VARCHAR(255) NOT NULL REFERENCES instagram_credentials(account_id) ON DELETE CASCADE,
  clickup_task_id VARCHAR(255) NOT NULL,
  clickup_list_id VARCHAR(255) NOT NULL,
  last_metrics_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint to prevent duplicate mappings
  UNIQUE(instagram_post_id, instagram_account_id)
);

-- ============================================================================
-- Table: instagram_sync_history
-- Purpose: Track sync job execution history for monitoring and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS instagram_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) NOT NULL REFERENCES instagram_credentials(account_id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  posts_processed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  tasks_updated INTEGER DEFAULT 0,
  metrics_updated INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============================================================================
-- Table: instagram_audit_logs
-- Purpose: Audit trail for all credential and sync operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS instagram_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'SYNC')),
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('CREDENTIAL', 'MAPPING', 'SYNC')),
  resource_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changes JSONB,
  status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE')),
  error_message TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- instagram_credentials indexes
CREATE INDEX IF NOT EXISTS idx_instagram_credentials_account_id 
  ON instagram_credentials(account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_credentials_is_active 
  ON instagram_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_instagram_credentials_created_by 
  ON instagram_credentials(created_by);

-- instagram_post_mappings indexes
CREATE INDEX IF NOT EXISTS idx_instagram_post_mappings_post_id 
  ON instagram_post_mappings(instagram_post_id);

CREATE INDEX IF NOT EXISTS idx_instagram_post_mappings_account_id 
  ON instagram_post_mappings(instagram_account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_post_mappings_clickup_task_id 
  ON instagram_post_mappings(clickup_task_id);

-- instagram_sync_history indexes
CREATE INDEX IF NOT EXISTS idx_instagram_sync_history_account_id 
  ON instagram_sync_history(account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_sync_history_created_at 
  ON instagram_sync_history(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_instagram_sync_history_status 
  ON instagram_sync_history(status);

-- instagram_audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_instagram_audit_logs_user_id 
  ON instagram_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_instagram_audit_logs_resource_id 
  ON instagram_audit_logs(resource_id);

CREATE INDEX IF NOT EXISTS idx_instagram_audit_logs_timestamp 
  ON instagram_audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_instagram_audit_logs_action 
  ON instagram_audit_logs(action);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see credentials they created
CREATE POLICY instagram_credentials_select_policy 
  ON instagram_credentials 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY instagram_credentials_insert_policy 
  ON instagram_credentials 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY instagram_credentials_update_policy 
  ON instagram_credentials 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY instagram_credentials_delete_policy 
  ON instagram_credentials 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Policy: Users can see post mappings for their credentials
CREATE POLICY instagram_post_mappings_select_policy 
  ON instagram_post_mappings 
  FOR SELECT 
  USING (
    instagram_account_id IN (
      SELECT account_id FROM instagram_credentials WHERE created_by = auth.uid()
    )
  );

CREATE POLICY instagram_post_mappings_insert_policy 
  ON instagram_post_mappings 
  FOR INSERT 
  WITH CHECK (
    instagram_account_id IN (
      SELECT account_id FROM instagram_credentials WHERE created_by = auth.uid()
    )
  );

CREATE POLICY instagram_post_mappings_update_policy 
  ON instagram_post_mappings 
  FOR UPDATE 
  USING (
    instagram_account_id IN (
      SELECT account_id FROM instagram_credentials WHERE created_by = auth.uid()
    )
  );

-- Policy: Users can see sync history for their credentials
CREATE POLICY instagram_sync_history_select_policy 
  ON instagram_sync_history 
  FOR SELECT 
  USING (
    account_id IN (
      SELECT account_id FROM instagram_credentials WHERE created_by = auth.uid()
    )
  );

CREATE POLICY instagram_sync_history_insert_policy 
  ON instagram_sync_history 
  FOR INSERT 
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM instagram_credentials WHERE created_by = auth.uid()
    )
  );

-- Policy: Users can see audit logs for their resources
CREATE POLICY instagram_audit_logs_select_policy 
  ON instagram_audit_logs 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY instagram_audit_logs_insert_policy 
  ON instagram_audit_logs 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_instagram_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instagram_credentials_updated_at_trigger
BEFORE UPDATE ON instagram_credentials
FOR EACH ROW
EXECUTE FUNCTION update_instagram_credentials_updated_at();

CREATE OR REPLACE FUNCTION update_instagram_post_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instagram_post_mappings_updated_at_trigger
BEFORE UPDATE ON instagram_post_mappings
FOR EACH ROW
EXECUTE FUNCTION update_instagram_post_mappings_updated_at();

-- ============================================================================
-- Data Retention Policies
-- ============================================================================

-- Cleanup old sync history (keep last 90 days)
-- This should be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_sync_history()
RETURNS void AS $$
BEGIN
  DELETE FROM instagram_sync_history 
  WHERE started_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleaned up old sync history records';
END;
$$ LANGUAGE plpgsql;

-- Cleanup old audit logs (keep last 180 days)
-- This should be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM instagram_audit_logs 
  WHERE timestamp < NOW() - INTERVAL '180 days';
  
  RAISE NOTICE 'Cleaned up old audit log records';
END;
$$ LANGUAGE plpgsql;

-- Cleanup orphaned post mappings (posts older than 90 days with no recent metrics)
-- This should be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_orphaned_post_mappings()
RETURNS void AS $$
BEGIN
  DELETE FROM instagram_post_mappings 
  WHERE last_metrics_update IS NULL 
    OR last_metrics_update < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleaned up orphaned post mapping records';
END;
$$ LANGUAGE plpgsql;
