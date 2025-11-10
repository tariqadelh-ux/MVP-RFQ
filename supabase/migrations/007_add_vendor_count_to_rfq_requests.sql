-- Migration: Add vendor_count field to rfq_requests table
-- Date: October 30, 2025
-- Purpose: Track total number of vendors involved in each RFQ for analytics and reporting

-- Add vendor_count field to rfq_requests table
ALTER TABLE rfq_requests 
ADD COLUMN IF NOT EXISTS vendor_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN rfq_requests.vendor_count IS 'Total number of vendors involved in this RFQ (invited or responded)';
