-- Add nine_com_number column to rfq_requests table
-- This aligns with the workflow field naming conventions

ALTER TABLE rfq_requests 
ADD COLUMN IF NOT EXISTS nine_com_number TEXT;

-- Copy existing commodity_code values to nine_com_number if they exist
UPDATE rfq_requests 
SET nine_com_number = commodity_code 
WHERE nine_com_number IS NULL AND commodity_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN rfq_requests.nine_com_number IS '9COM reference number(s) - can be comma-separated for multi-item RFQs';
