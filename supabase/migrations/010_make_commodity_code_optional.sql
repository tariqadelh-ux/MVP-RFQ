-- Migration: Make commodity_code optional for workflow compatibility
-- Date: October 31, 2025
-- Purpose: Fix n8n workflow insert errors by making commodity_code nullable

-- The workflow doesn't provide commodity_code, so we make it optional
ALTER TABLE rfq_requests 
ALTER COLUMN commodity_code DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN rfq_requests.commodity_code IS '9COM code - Made optional for workflow compatibility. Can be derived from nine_com_number if needed.';
