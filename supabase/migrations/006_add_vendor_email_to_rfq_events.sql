-- Migration: Add vendor_email field to rfq_events table
-- Date: October 30, 2025
-- Purpose: Track vendor email directly in events for better filtering and reporting

-- Add vendor_email field to rfq_events table
ALTER TABLE rfq_events 
ADD COLUMN IF NOT EXISTS vendor_email TEXT;

-- Add index for queries on vendor_email
CREATE INDEX IF NOT EXISTS idx_rfq_events_vendor_email ON rfq_events(vendor_email);

-- Add comment for documentation
COMMENT ON COLUMN rfq_events.vendor_email IS 'Email address of the vendor associated with this event';
