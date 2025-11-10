-- Migration: Add vendor_count field to workflow_executions table
-- Date: October 30, 2025
-- Purpose: Track how many vendors were processed in each workflow execution

-- Add vendor_count field to workflow_executions table
ALTER TABLE workflow_executions 
ADD COLUMN IF NOT EXISTS vendor_count INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN workflow_executions.vendor_count IS 'Number of vendors processed in this workflow execution';
