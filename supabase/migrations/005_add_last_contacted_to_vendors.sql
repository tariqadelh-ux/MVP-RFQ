-- Migration: Add last_contacted field to vendors table
-- Date: October 30, 2025
-- Purpose: Track vendor communication history for better vendor management

-- Add last_contacted field to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;

-- Add index for queries on last_contacted
CREATE INDEX IF NOT EXISTS idx_vendors_last_contacted ON vendors(last_contacted DESC);

-- Add comment for documentation
COMMENT ON COLUMN vendors.last_contacted IS 'Timestamp of the last time this vendor was contacted (e.g., sent an RFQ)';
