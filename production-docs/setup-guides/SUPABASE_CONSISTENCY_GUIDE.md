# Supabase Database Consistency Guide for RFQ Workflows

This guide documents all Supabase tables and fields used by the RFQ automation system to ensure consistency across all workflows.

## Table Structure and Usage

### 1. rfq_requests (Main RFQ Records)

**Purpose**: Central table storing all RFQ information from creation to completion

**Fields Used by Workflows**:
```sql
- id (UUID) - Auto-generated primary key
- rfq_id (TEXT UNIQUE) - Format: BQ-YYYYMMDDHHMMSS
- nine_com_number (TEXT) - 9COM reference from procurement
- project_id (TEXT) - Project identifier
- project_name (TEXT) - Human-readable project name
- commodity_code (TEXT) - Not used by Workflow 1, available for future
- material_description (TEXT) - What's being procured
- specifications (TEXT) - Technical specifications required
- quantity (INTEGER) - Amount needed
- unit_of_measure (TEXT) - Not used by Workflow 1, available
- critical_requirements (TEXT) - Must-have requirements (e.g., SS 316L)
- wbs_code (TEXT) - Work breakdown structure code
- estimated_value (NUMERIC) - Budget information
- delivery_location (TEXT) - Where to deliver
- delivery_timeline (TEXT) - When needed
- status (TEXT) - Values: 'initiated', 'awaiting_responses', 'pending_avl', 'under_evaluation', 'po_issued', 'rejected'
- current_stage (INTEGER) - Not used yet, for workflow tracking
- response_deadline (TIMESTAMPTZ) - When vendors must respond by
- vendor_count (INTEGER) - Total vendors contacted
- invited_vendor_count (INTEGER) - Initial vendor count
- responded_vendor_count (INTEGER) - How many have responded
- compliant_vendor_count (INTEGER) - How many are compliant
- selected_vendor_id (UUID) - Winner (Workflow 4)
- po_number (TEXT) - Purchase order number (Workflow 4)
- final_price (NUMERIC) - Winning price (Workflow 4)
- rfq_sent_at (TIMESTAMPTZ) - When RFQ emails sent
- evaluation_started_at (TIMESTAMPTZ) - When evaluation began (Workflow 4)
- decision_made_at (TIMESTAMPTZ) - When decision made (Workflow 4)
- po_issued_at (TIMESTAMPTZ) - When PO sent (Workflow 4)
```

**Status Flow**:
- 'initiated' → 'awaiting_responses' → 'under_evaluation' → 'po_issued'/'rejected'
- Alternative: 'initiated' → 'pending_avl' (if AVL not found)

### 2. vendors (Vendor Master Data)

**Purpose**: Central vendor repository with performance metrics

**Fields Used by Workflows**:
```sql
- id (UUID) - Auto-generated primary key
- vendor_id (TEXT UNIQUE) - Format: 9V-XXXX (not used by Workflow 1)
- vendor_name (TEXT) - Company name
- vendor_email (TEXT) - Primary email for RFQs
- contact_person (TEXT) - Contact name
- phone_number (TEXT) - Contact phone
- last_contacted (TIMESTAMPTZ) - Updated when RFQ sent
- is_active (BOOLEAN) - Default true
- is_approved (BOOLEAN) - Default true
- total_rfqs_invited (INTEGER) - Increment in future
- total_rfqs_responded (INTEGER) - Increment when response received
- total_rfqs_won (INTEGER) - Increment when selected
```

**Upsert Logic**: Create if not exists based on vendor_email

### 3. vendor_offers (Quotation Details)

**Purpose**: Store all vendor responses with extracted data

**Fields Used by Workflows** (Workflow 2):
```sql
- id (UUID) - Auto-generated primary key
- rfq_id (TEXT) - Links to rfq_requests
- vendor_id (UUID) - Links to vendors.id
- response_received_at (TIMESTAMPTZ) - When email received
- material_offered (TEXT) - What vendor is offering
- material_grade (TEXT) - CRITICAL for compliance check
- compliance_status (TEXT) - Values: 'compliant', 'non-compliant', 'clarification_needed'
- technical_deviations (TEXT[]) - Array of deviations
- certifications (TEXT[]) - Array of certifications
- unit_price (NUMERIC) - Price per unit
- total_price (NUMERIC) - Total quotation value
- currency (TEXT) - Default 'USD'
- delivery_days (INTEGER) - Days to deliver
- delivery_date (DATE) - Calculated from current + days
- payment_terms (TEXT) - e.g., "30/70", "Net 30"
- warranty_months (INTEGER) - Warranty period
- email_message_id (TEXT) - Gmail message ID
- ai_confidence (NUMERIC) - AI extraction confidence
- ai_extraction_log (JSONB) - Full AI response
- manual_review_required (BOOLEAN) - If confidence < 0.8
- tbc_issued (BOOLEAN) - Technical bid clarification sent
- tbc_issued_at (TIMESTAMPTZ) - When TBC sent
- attachments (JSONB) - [{name, url, type}]
- price_score (NUMERIC) - Set by Workflow 4
- delivery_score (NUMERIC) - Set by Workflow 4
- payment_score (NUMERIC) - Set by Workflow 4
- warranty_score (NUMERIC) - Set by Workflow 4
- compliance_score (NUMERIC) - Set by Workflow 4
- total_score (NUMERIC) - Set by Workflow 4
- rank (INTEGER) - Set by Workflow 4
```

### 4. rfq_events (Complete Audit Trail)

**Purpose**: Log every significant event for audit and dashboard

**Event Types**:
- 'rfq_initiated' - RFQ created
- 'email_sent' - RFQ sent to vendor
- 'avl_not_found' - AVL lookup failed
- 'vendor_responded' - Quote received
- 'tbc_sent' - Clarification requested
- 'evaluation_triggered' - Ready for scoring
- 'evaluation_completed' - Scores calculated
- 'po_approved' - PO issued
- 'rfq_rejected' - All vendors rejected
- 'negotiation_requested' - Better terms requested

**Fields Used**:
```sql
- id (UUID) - Auto-generated primary key
- rfq_id (TEXT) - Always required
- event_type (TEXT) - From list above
- event_timestamp (TIMESTAMPTZ) - When it happened
- title (TEXT) - Human-readable title
- description (TEXT) - Details
- details (JSONB) - Event-specific extra data
- vendor_id (UUID) - If vendor-specific
- vendor_name (TEXT) - For quick reference
- vendor_email (TEXT) - For filtering
- nine_com_number (TEXT) - From RFQ
- project_name (TEXT) - From RFQ
- project_id (TEXT) - From RFQ
- source (TEXT) - 'workflow', 'manual', 'system'
- workflow_execution_id (TEXT) - Links to execution
```

### 5. workflow_executions (Monitoring & Debugging)

**Purpose**: Track every workflow run for debugging

**Fields Used**:
```sql
- id (UUID) - Auto-generated primary key
- workflow_name (TEXT) - Which workflow ran
- execution_id (TEXT) - n8n execution ID
- status (TEXT) - 'running', 'success', 'error'
- started_at (TIMESTAMPTZ) - Start time
- completed_at (TIMESTAMPTZ) - End time
- duration_ms (INTEGER) - How long it took
- rfq_id (TEXT) - If RFQ-specific
- vendor_count (INTEGER) - Vendors processed
- trigger_source (TEXT) - 'email', 'schedule', 'webhook'
- error_message (TEXT) - If failed
- error_node (TEXT) - Which node failed
```

### 6. extraction_quality_issues (AI Quality Tracking)

**Purpose**: Track when AI extraction needs help

**Fields Used**:
```sql
- id (UUID) - Auto-generated primary key
- email_id (TEXT) - Gmail message ID
- extraction_method (TEXT) - 'pdf' or 'email_body'
- quality_score (NUMERIC) - Percentage complete
- missing_fields (TEXT[]) - What's missing
- status (TEXT) - 'pending_manual_review', 'resolved'
- created_at (TIMESTAMPTZ) - When logged
```

### 7. email_logs (Email Communication Tracking)

**Purpose**: Track all email communications

**Fields Used** (Workflow 2):
```sql
- id (UUID) - Auto-generated primary key
- rfq_id (TEXT) - If identified
- vendor_id (UUID) - If vendor email
- message_id (TEXT UNIQUE) - Gmail ID
- direction (TEXT) - 'inbound', 'outbound'
- from_email (TEXT) - Sender
- to_emails (TEXT[]) - Recipients
- subject (TEXT) - Email subject
- received_at (TIMESTAMPTZ) - Email date
- processed_at (TIMESTAMPTZ) - When processed
- processing_status (TEXT) - 'processed', 'rfq_not_identified'
- ai_extracted_data (JSONB) - What AI found
- attachments_processed (BOOLEAN) - PDFs handled
```

### 8. gatekeeper_logs (Quorum Decision Tracking)

**Purpose**: Track gatekeeper decisions (Workflow 3)

**Fields Will Use**:
```sql
- id (UUID) - Auto-generated primary key
- rfq_id (TEXT) - RFQ being checked
- check_timestamp (TIMESTAMPTZ) - When checked
- vendor_count (INTEGER) - Compliant vendors found
- decision (TEXT) - 'proceed', 'wait'
- trigger_reason (TEXT) - Why proceeding
```

### 9. purchase_orders (Final PO Records)

**Purpose**: Store issued purchase orders (Workflow 4)

**Fields Will Use**:
```sql
- id (UUID) - Auto-generated primary key
- po_number (TEXT UNIQUE) - Generated PO number
- rfq_id (TEXT) - Links to rfq_requests
- vendor_id (UUID) - Winner
- po_date (DATE) - Issue date
- delivery_date (DATE) - Expected delivery
- total_amount (NUMERIC) - PO value
- currency (TEXT) - Currency
- status (TEXT) - 'active', 'completed', 'cancelled'
```

## Key Relationships

1. **rfq_requests** ← → **vendor_offers** (One-to-Many via rfq_id)
2. **vendors** ← → **vendor_offers** (One-to-Many via vendor_id)
3. **rfq_requests** ← → **rfq_events** (One-to-Many via rfq_id)
4. **rfq_requests** → **purchase_orders** (One-to-One via rfq_id)

## Critical Business Rules

1. **Material Grade Compliance**:
   - Accepted grades: ["SS 316L", "316L", "316/316L", "AISI 316L"]
   - Any other grade triggers TBC and non-compliant status

2. **Gatekeeper Quorum** (Workflow 3):
   - 3+ compliant vendors = Proceed
   - 2 compliant vendors AND 7+ days = Proceed
   - Otherwise = Wait

3. **Status Transitions**:
   - Only move forward, never backward
   - 'pending_avl' is a side branch for missing AVL

4. **Vendor Upsert**:
   - Match on vendor_email
   - Always update last_contacted

## Dashboard Queries

These tables enable queries like:
```sql
-- Active RFQs by status
SELECT status, COUNT(*) FROM rfq_requests GROUP BY status;

-- Vendor response rate
SELECT 
  vendor_count,
  responded_vendor_count,
  ROUND(responded_vendor_count::NUMERIC / vendor_count * 100, 2) as response_rate
FROM rfq_requests
WHERE vendor_count > 0;

-- Compliance rate
SELECT 
  COUNT(CASE WHEN compliance_status = 'compliant' THEN 1 END) as compliant,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN compliance_status = 'compliant' THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as compliance_rate
FROM vendor_offers;
```

---

*Use this guide to ensure all workflows interact with Supabase consistently.*
