-- Migration: Fix RLS policies for n8n workflow compatibility
-- Date: October 31, 2025
-- Purpose: Fix row-level security policies to allow n8n to insert/update data

-- Fix rfq_requests table
DROP POLICY IF EXISTS "Service role full access" ON rfq_requests;
CREATE POLICY "Service role full access" ON rfq_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add insert policies for other roles
CREATE POLICY IF NOT EXISTS "Allow authenticated insert" ON rfq_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anon insert" ON rfq_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Fix vendors table
DROP POLICY IF EXISTS "Service role full access" ON vendors;
CREATE POLICY "Service role full access" ON vendors
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix vendor_offers table
DROP POLICY IF EXISTS "Service role full access" ON vendor_offers;
CREATE POLICY "Service role full access" ON vendor_offers
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix rfq_events table
DROP POLICY IF EXISTS "Service role full access" ON rfq_events;
CREATE POLICY "Service role full access" ON rfq_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix workflow_executions table
DROP POLICY IF EXISTS "Service role full access" ON workflow_executions;
CREATE POLICY "Service role full access" ON workflow_executions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix email_logs table
DROP POLICY IF EXISTS "Service role full access" ON email_logs;
CREATE POLICY "Service role full access" ON email_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix extraction_quality_issues table
DROP POLICY IF EXISTS "Service role full access" ON extraction_quality_issues;
CREATE POLICY "Service role full access" ON extraction_quality_issues
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix gatekeeper_logs table
DROP POLICY IF EXISTS "Service role full access" ON gatekeeper_logs;
CREATE POLICY "Service role full access" ON gatekeeper_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix purchase_orders table
DROP POLICY IF EXISTS "Service role full access" ON purchase_orders;
CREATE POLICY "Service role full access" ON purchase_orders
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
