-- Enable Row Level Security on all tables
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RFQ Requests Policies
-- Authenticated users can read all
CREATE POLICY "Read access for authenticated users" ON rfq_requests
  FOR SELECT TO authenticated USING (true);

-- Service role has full access
CREATE POLICY "Service role full access" ON rfq_requests
  FOR ALL TO service_role USING (true);

-- Anon users can read specific fields only (for public API)
CREATE POLICY "Public read limited fields" ON rfq_requests
  FOR SELECT TO anon 
  USING (status IN ('open', 'closed'));

-- Vendors Policies
CREATE POLICY "Vendors read for authenticated" ON vendors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Vendors full access for service" ON vendors
  FOR ALL TO service_role USING (true);

-- Vendor Offers Policies
CREATE POLICY "Offers read for authenticated" ON vendor_offers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Offers insert for service" ON vendor_offers
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Offers update for service" ON vendor_offers
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Offers delete for service" ON vendor_offers
  FOR DELETE TO service_role USING (true);

-- RFQ Events Policies
-- Everyone can read events (for dashboard)
CREATE POLICY "Events read for all" ON rfq_events
  FOR SELECT TO authenticated, anon USING (true);

-- Only service role can write events
CREATE POLICY "Events write for service" ON rfq_events
  FOR INSERT TO service_role WITH CHECK (true);

-- Workflow Executions Policies
-- Only service role and authenticated admins can access
CREATE POLICY "Executions read for authenticated" ON workflow_executions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Executions write for service" ON workflow_executions
  FOR ALL TO service_role USING (true);

-- Email Logs Policies
CREATE POLICY "Email logs read for authenticated" ON email_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Email logs write for service" ON email_logs
  FOR ALL TO service_role USING (true);

-- Create custom roles for more granular access
-- Vendor role (future enhancement)
CREATE ROLE vendor_user;
GRANT USAGE ON SCHEMA public TO vendor_user;
GRANT SELECT ON vendors TO vendor_user;
GRANT SELECT ON vendor_offers TO vendor_user;

-- Admin role
CREATE ROLE rfq_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rfq_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rfq_admin;

-- Analyst role (read-only)
CREATE ROLE rfq_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rfq_analyst;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role or is in admin email list
  RETURN auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' 
    OR auth.jwt() ->> 'email' IN (
      'admin@binquraya.com',
      'procurement@binquraya.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced policies using admin function
CREATE POLICY "Admin full access to rfq_requests" ON rfq_requests
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Real-time subscriptions configuration
-- Allow authenticated users to listen to changes
ALTER publication supabase_realtime ADD TABLE rfq_events;
ALTER publication supabase_realtime ADD TABLE vendor_offers;
ALTER publication supabase_realtime ADD TABLE rfq_requests;

-- Grant necessary permissions for real-time
GRANT SELECT ON rfq_events TO anon, authenticated;
GRANT SELECT ON vendor_offers TO authenticated;
GRANT SELECT ON rfq_requests TO authenticated;
