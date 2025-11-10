# Supabase Database Schema - Production

## Overview
Complete database design for production RFQ system. Use Supabase MCP to create all tables and policies.

**IMPORTANT**: This schema supports 24/7 production operations with complete audit trail.

## Core Tables

### 1. rfq_requests
Main table tracking each RFQ from initiation to close.

```sql
CREATE TABLE rfq_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT UNIQUE NOT NULL, -- Format: RFQ-YYYY-NNN
  project_id TEXT NOT NULL,
  project_name TEXT,
  commodity_code TEXT, -- 9COM code - Made optional for workflow compatibility
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
  vendor_count INTEGER DEFAULT 0,
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
```

### 2. vendors
Master vendor data with performance tracking.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id TEXT UNIQUE NOT NULL DEFAULT generate_vendor_id(), -- Format: 9V-NNNN (auto-generated)
  vendor_name TEXT NOT NULL,
  vendor_email TEXT UNIQUE NOT NULL, -- Unique for upsert operations
  contact_person TEXT,
  phone_number TEXT,
  
  -- Classification
  vendor_type TEXT, -- 'manufacturer', 'trader', 'distributor'
  vendor_tier TEXT, -- 'tier1', 'tier2', 'new'
  
  -- Performance metrics (updated after each RFQ)
  total_rfqs_invited INTEGER DEFAULT 0,
  total_rfqs_responded INTEGER DEFAULT 0,
  total_rfqs_won INTEGER DEFAULT 0,
  average_response_time_hours DECIMAL,
  average_score DECIMAL,
  compliance_rate DECIMAL, -- % of compliant offers
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  approval_date DATE,
  
  -- Metadata
  last_contacted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_email ON vendors(vendor_email);
CREATE INDEX idx_vendor_last_contacted ON vendors(last_contacted DESC);
CREATE INDEX idx_vendor_active ON vendors(is_active, is_approved);
```

### 3. vendor_offers
Detailed vendor quotations with AI-extracted data.

```sql
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
  compliance_status TEXT NOT NULL, -- 'compliant', 'non-compliant', 'clarification_needed'
  technical_deviations TEXT[],
  certifications TEXT[],
  
  -- Commercial data (AI-extracted)
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_in_sar DECIMAL, -- Converted to SAR
  
  delivery_days INTEGER NOT NULL,
  delivery_date DATE,
  payment_terms TEXT NOT NULL, -- e.g., "30/70"
  incoterms TEXT, -- FOB, DDP, etc.
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
  email_message_id TEXT, -- Gmail message ID
  attachments JSONB, -- [{name, url, type}]
  
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
```

### 4. rfq_events
Complete audit trail for dashboard and compliance.

```sql
CREATE TABLE rfq_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event details
  title TEXT, -- Auto-generated based on event_type if not provided
  description TEXT,
  details JSONB,
  
  -- Context
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  vendor_email TEXT,
  
  -- Project identification
  nine_com_number TEXT,
  project_name TEXT,
  project_id TEXT,
  
  -- Change tracking
  previous_status TEXT,
  new_status TEXT,
  changed_by TEXT,
  
  -- Performance
  processing_time_ms INTEGER,
  
  -- Metadata
  source TEXT, -- 'workflow', 'manual', 'system'
  workflow_execution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_rfq ON rfq_events(rfq_id, event_timestamp DESC);
CREATE INDEX idx_event_type ON rfq_events(event_type);
CREATE INDEX idx_event_timestamp ON rfq_events(event_timestamp DESC);
CREATE INDEX idx_rfq_events_nine_com ON rfq_events(nine_com_number);
CREATE INDEX idx_rfq_events_project ON rfq_events(project_name);
CREATE INDEX idx_rfq_events_project_id ON rfq_events(project_id);
CREATE INDEX idx_rfq_events_vendor_email ON rfq_events(vendor_email);
```

### 5. workflow_executions
Track n8n workflow runs for debugging and monitoring.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL, -- 'running', 'success', 'error'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Context
  rfq_id TEXT,
  trigger_source TEXT, -- 'email', 'schedule', 'manual', 'webhook'
  vendor_count INTEGER, -- Number of vendors processed
  
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
```

### 6. email_logs
Track all email communications.

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id TEXT,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Email details
  message_id TEXT UNIQUE,
  thread_id TEXT,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  
  from_email TEXT NOT NULL,
  to_emails TEXT[],
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  
  -- Processing
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  processing_status TEXT, -- 'pending', 'processed', 'failed'
  
  -- AI extraction
  ai_extracted_data JSONB,
  attachments_processed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_rfq ON email_logs(rfq_id);
CREATE INDEX idx_email_message ON email_logs(message_id);
```

## Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
```

### Basic Policies (Customize based on roles)
```sql
-- Authenticated users can read all data
CREATE POLICY "Read access for authenticated users" ON rfq_requests
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role full access" ON rfq_requests
  FOR ALL TO service_role USING (true);

-- Apply similar policies to all tables
```

## Database Functions

### 1. Generate Vendor ID
```sql
-- Sequence for vendor IDs
CREATE SEQUENCE vendor_id_seq START 1000;

-- Function to generate vendor IDs in format 9V-NNNN
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS TEXT AS $$
BEGIN
  RETURN '9V-' || LPAD(nextval('vendor_id_seq')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

### 2. Update RFQ Metrics
```sql
CREATE OR REPLACE FUNCTION update_rfq_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update responded vendor count
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
```

### 2. Calculate Cycle Time
```sql
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
```

## Views for Dashboard

### 1. Active RFQs View
```sql
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
```

### 2. Vendor Performance View
```sql
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
```

## Migration & Maintenance

### Initial Setup
1. Create Supabase project
2. Run schema creation scripts in order
3. Set up RLS policies
4. Create initial admin user
5. Configure service role key for n8n

### Monitoring Queries
```sql
-- Check workflow health
SELECT workflow_name, status, COUNT(*), AVG(duration_ms)
FROM workflow_executions
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY workflow_name, status;

-- RFQ cycle time trends
SELECT 
  DATE_TRUNC('week', initiated_at) as week,
  AVG(cycle_time_hours) as avg_cycle_time,
  COUNT(*) as rfq_count
FROM rfq_requests
WHERE status = 'closed'
GROUP BY week
ORDER BY week DESC;
```
