-- Migration: Add auto-title generation for rfq_events
-- Date: October 31, 2025
-- Purpose: Fix n8n workflow insert errors by auto-generating event titles

-- Create a function to generate default titles based on event_type
CREATE OR REPLACE FUNCTION generate_event_title(p_event_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE p_event_type
    WHEN 'email_sent' THEN 'RFQ Email Sent to Vendor'
    WHEN 'vendor_responded' THEN 'Vendor Response Received'
    WHEN 'avl_not_found' THEN 'AVL Lookup Failed'
    WHEN 'tbc_sent' THEN 'Technical Bid Clarification Sent'
    WHEN 'evaluation_started' THEN 'Commercial Evaluation Started'
    WHEN 'po_issued' THEN 'Purchase Order Issued'
    WHEN 'rfq_created' THEN 'RFQ Created'
    WHEN 'workflow_error' THEN 'Workflow Error Occurred'
    WHEN 'status_change' THEN 'RFQ Status Changed'
    WHEN 'vendor_selected' THEN 'Vendor Selected for Award'
    WHEN 'rfq_cancelled' THEN 'RFQ Cancelled'
    WHEN 'deadline_extended' THEN 'Response Deadline Extended'
    ELSE INITCAP(REPLACE(p_event_type, '_', ' '))
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to auto-generate title if not provided
CREATE OR REPLACE FUNCTION set_default_event_title()
RETURNS TRIGGER AS $$
BEGIN
  -- If title is null or empty, generate one based on event_type
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title := generate_event_title(NEW.event_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS set_event_title_trigger ON rfq_events;
CREATE TRIGGER set_event_title_trigger
  BEFORE INSERT ON rfq_events
  FOR EACH ROW
  EXECUTE FUNCTION set_default_event_title();

-- Make title nullable since we have a default now
ALTER TABLE rfq_events 
ALTER COLUMN title DROP NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN rfq_events.title IS 'Event title - auto-generated based on event_type if not provided';
