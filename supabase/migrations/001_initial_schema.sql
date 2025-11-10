-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RFQ Requests Table
CREATE TABLE rfq_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL,
  project_name TEXT,
  commodity_code TEXT NOT NULL,
  material_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_of_measure TEXT,
  estimated_value DECIMAL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'initiated',
  current_stage INTEGER DEFAULT 1,
  
  -- Important dates
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  rfq_sent_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  evaluation_started_at TIMESTAMPTZ,
  decision_made_at TIMESTAMPTZ,
  po_issued_at TIMESTAMPTZ,
  expected_delivery_date DATE,
  
  -- Metrics
  invited_vendor_count INTEGER DEFAULT 0,
  responded_vendor_count INTEGER DEFAULT 0,
  compliant_vendor_count INTEGER DEFAULT 0,
  cycle_time_hours INTEGER,
  
  -- Decision data
  selected_vendor_id UUID,
  po_number TEXT,
  final_price DECIMAL,
  cost_savings DECIMAL,
  
  -- Metadata
  created_by TEXT,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rfq_status ON rfq_requests(status);
CREATE INDEX idx_rfq_dates ON rfq_requests(initiated_at DESC);
CREATE INDEX idx_rfq_project ON rfq_requests(project_id);

-- 2. Vendors Table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT NOT NULL,
  contact_person TEXT,
  phone_number TEXT,
  
  -- Classification
  vendor_type TEXT,
  vendor_tier TEXT,
  
  -- Performance metrics
  total_rfqs_invited INTEGER DEFAULT 0,
  total_rfqs_responded INTEGER DEFAULT 0,
  total_rfqs_won INTEGER DEFAULT 0,
  average_response_time_hours DECIMAL,
  average_score DECIMAL,
  compliance_rate DECIMAL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  approval_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_email ON vendors(vendor_email);
CREATE INDEX idx_vendor_active ON vendors(is_active, is_approved);

-- 3. Vendor Offers Table
CREATE TABLE vendor_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT NOT NULL REFERENCES rfq_requests(rfq_id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  
  -- Response tracking
  response_received_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_hours DECIMAL,
  
  -- Technical data (AI-extracted)
  material_offered TEXT NOT NULL,
  material_grade TEXT,
  compliance_status TEXT NOT NULL,
  technical_deviations TEXT[],
  certifications TEXT[],
  
  -- Commercial data (AI-extracted)
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_in_sar DECIMAL,
  
  delivery_days INTEGER NOT NULL,
  delivery_date DATE,
  payment_terms TEXT NOT NULL,
  incoterms TEXT,
  warranty_months INTEGER,
  
  -- Scoring
  price_score DECIMAL,
  delivery_score DECIMAL,
  payment_score DECIMAL,
  warranty_score DECIMAL,
  compliance_score DECIMAL,
  total_score DECIMAL,
  rank INTEGER,
  
  -- Documents
  email_message_id TEXT,
  attachments JSONB,
  
  -- TBC handling
  tbc_issued BOOLEAN DEFAULT false,
  tbc_issued_at TIMESTAMPTZ,
  tbc_response_at TIMESTAMPTZ,
  tbc_resolution TEXT,
  
  -- AI extraction metadata
  ai_confidence DECIMAL,
  ai_extraction_log JSONB,
  manual_review_required BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_rfq ON vendor_offers(rfq_id);
CREATE INDEX idx_offer_vendor ON vendor_offers(vendor_id);
CREATE INDEX idx_offer_score ON vendor_offers(total_score DESC);

-- 4. RFQ Events Table
CREATE TABLE rfq_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  details JSONB,
  
  -- Context
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  
  -- Change tracking
  previous_status TEXT,
  new_status TEXT,
  changed_by TEXT,
  
  -- Performance
  processing_time_ms INTEGER,
  
  -- Metadata
  source TEXT,
  workflow_execution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_rfq ON rfq_events(rfq_id, event_timestamp DESC);
CREATE INDEX idx_event_type ON rfq_events(event_type);
CREATE INDEX idx_event_timestamp ON rfq_events(event_timestamp DESC);

-- 5. Workflow Executions Table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Context
  rfq_id TEXT,
  trigger_source TEXT,
  
  -- Error handling
  error_message TEXT,
  error_node TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Data
  input_data JSONB,
  output_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_status ON workflow_executions(status, started_at DESC);
CREATE INDEX idx_workflow_rfq ON workflow_executions(rfq_id);

-- 6. Email Logs Table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Email details
  message_id TEXT UNIQUE,
  thread_id TEXT,
  direction TEXT NOT NULL,
  
  from_email TEXT NOT NULL,
  to_emails TEXT[],
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  
  -- Processing
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  processing_status TEXT,
  
  -- AI extraction
  ai_extracted_data JSONB,
  attachments_processed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_rfq ON email_logs(rfq_id);
CREATE INDEX idx_email_message ON email_logs(message_id);

-- Database Functions

-- 1. Update RFQ Metrics
CREATE OR REPLACE FUNCTION update_rfq_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rfq_requests
  SET 
    responded_vendor_count = (
      SELECT COUNT(*) FROM vendor_offers WHERE rfq_id = NEW.rfq_id
    ),
    compliant_vendor_count = (
      SELECT COUNT(*) FROM vendor_offers 
      WHERE rfq_id = NEW.rfq_id AND compliance_status = 'compliant'
    ),
    updated_at = NOW()
  WHERE rfq_id = NEW.rfq_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rfq_metrics_trigger
AFTER INSERT OR UPDATE ON vendor_offers
FOR EACH ROW EXECUTE FUNCTION update_rfq_metrics();

-- 2. Calculate Cycle Time
CREATE OR REPLACE FUNCTION calculate_cycle_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_issued_at IS NOT NULL AND OLD.po_issued_at IS NULL THEN
    NEW.cycle_time_hours = EXTRACT(EPOCH FROM (NEW.po_issued_at - NEW.initiated_at)) / 3600;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_cycle_time_trigger
BEFORE UPDATE ON rfq_requests
FOR EACH ROW EXECUTE FUNCTION calculate_cycle_time();

-- 3. Update Timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_rfq_requests_updated_at BEFORE UPDATE ON rfq_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendor_offers_updated_at BEFORE UPDATE ON vendor_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Views for Dashboard

-- 1. Active RFQs View
CREATE VIEW active_rfqs AS
SELECT 
  r.*,
  COUNT(DISTINCT vo.id) as offer_count,
  MAX(vo.total_score) as highest_score,
  MIN(vo.total_price) as lowest_price
FROM rfq_requests r
LEFT JOIN vendor_offers vo ON r.rfq_id = vo.rfq_id
WHERE r.status NOT IN ('closed', 'cancelled')
GROUP BY r.id;

-- 2. Vendor Performance View
CREATE VIEW vendor_performance AS
SELECT 
  v.*,
  COUNT(DISTINCT vo.rfq_id) as total_quotes,
  AVG(vo.total_score) as avg_score,
  SUM(CASE WHEN r.selected_vendor_id = v.id THEN 1 ELSE 0 END) as wins
FROM vendors v
LEFT JOIN vendor_offers vo ON v.id = vo.vendor_id
LEFT JOIN rfq_requests r ON vo.rfq_id = r.rfq_id
GROUP BY v.id;

-- Initial Data - Demo Vendors
INSERT INTO vendors (vendor_id, vendor_name, vendor_email, vendor_type, vendor_tier, is_approved) VALUES
  ('9V-1001', 'Vendor A Industries', 'vendor.a.demo@gmail.com', 'manufacturer', 'tier1', true),
  ('9V-1002', 'Vendor B Solutions', 'vendor.b.demo@gmail.com', 'trader', 'tier2', true),
  ('9V-1003', 'Vendor C Global', 'vendor.c.demo@gmail.com', 'distributor', 'tier1', true);
