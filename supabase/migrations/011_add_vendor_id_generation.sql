-- Migration: Add auto-generation for vendor_id
-- Date: October 31, 2025
-- Purpose: Fix n8n workflow insert errors by auto-generating vendor_id

-- Create a sequence for vendor IDs starting at 1000
CREATE SEQUENCE IF NOT EXISTS vendor_id_seq START 1000;

-- Create a function to generate vendor IDs in format 9V-NNNN
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS TEXT AS $$
BEGIN
  RETURN '9V-' || LPAD(nextval('vendor_id_seq')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Set vendor_id to use this function as default
ALTER TABLE vendors 
ALTER COLUMN vendor_id SET DEFAULT generate_vendor_id();

-- Add unique constraint on vendor_email for upsert operations
ALTER TABLE vendors 
ADD CONSTRAINT vendors_vendor_email_key UNIQUE (vendor_email);

-- Comment on the vendor_id column
COMMENT ON COLUMN vendors.vendor_id IS 'Unique vendor identifier in format 9V-NNNN (auto-generated)';

-- Create index on vendor_email for performance
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(vendor_email);
