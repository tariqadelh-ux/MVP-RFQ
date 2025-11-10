-- Migration: Add project-related fields to rfq_events table
-- Date: October 30, 2025
-- Purpose: Enable better querying and filtering of events by project identifiers

-- Add project-related columns to rfq_events table
ALTER TABLE rfq_events 
ADD COLUMN IF NOT EXISTS nine_com_number TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT,
ADD COLUMN IF NOT EXISTS project_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rfq_events_nine_com ON rfq_events(nine_com_number);
CREATE INDEX IF NOT EXISTS idx_rfq_events_project ON rfq_events(project_name);
CREATE INDEX IF NOT EXISTS idx_rfq_events_project_id ON rfq_events(project_id);

-- Add comments for documentation
COMMENT ON COLUMN rfq_events.nine_com_number IS '9COM reference number from project initiation';
COMMENT ON COLUMN rfq_events.project_name IS 'Project name associated with this event';
COMMENT ON COLUMN rfq_events.project_id IS 'Project identifier for cross-referencing';
