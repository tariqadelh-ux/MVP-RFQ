# Supabase Field Mappings for All Workflows

## Overview
This document ensures consistency in field naming, data types, and usage across all 4 workflows. Every workflow MUST use these exact field names and formats.

---

## 1. Standard Formats & Conventions

### ID Formats
- **rfq_id**: TEXT - Format: `BQ-YYYYMMDDHHMMSS` (e.g., `BQ-20251031143022`)
- **vendor_id**: UUID - Auto-generated (foreign key to vendors.id)
- **po_number**: TEXT - Format: `PO-YYYYMMDD-NNNN` (e.g., `PO-20251031-0001`)
- **execution_id**: TEXT - n8n execution ID format

### Status Values (MUST use exact strings)
- **rfq_requests.status**:
  - `'initiated'` - RFQ created, not yet sent
  - `'awaiting_responses'` - RFQ sent to vendors
  - `'pending_avl'` - AVL lookup failed, manual intervention needed
  - `'under_evaluation'` - Commercial evaluation in progress
  - `'po_issued'` - Purchase order created
  - `'rejected'` - RFQ cancelled/rejected
  - `'under_negotiation'` - Price negotiation ongoing

- **vendor_offers.compliance_status**:
  - `'compliant'` - Meets all requirements
  - `'non_compliant'` - Missing critical requirements
  - `'tbc_required'` - Technical bid clarification needed
  - `'tbc_sent'` - Clarification requested
  - `'tbc_received'` - Clarification provided

- **vendor_offers.evaluation_status**:
  - `'pending'` - Not yet evaluated
  - `'approved'` - Selected for PO
  - `'rejected'` - Not selected
  - `'shortlisted'` - In final consideration

### Event Types (rfq_events.event_type)
- **Workflow 1 Events**:
  - `'rfq_initiated'` - New RFQ created
  - `'email_sent'` - RFQ sent to vendor
  - `'avl_not_found'` - AVL lookup failed
  - `'workflow_success'` - Workflow completed

- **Workflow 2 Events**:
  - `'vendor_responded'` - Response received
  - `'attachment_processed'` - PDF/attachment extracted
  - `'tbc_sent'` - Clarification requested
  - `'compliance_checked'` - Offer validated

- **Workflow 3 Events**:
  - `'gatekeeper_triggered'` - Scheduled check ran
  - `'quorum_reached'` - Enough responses received
  - `'evaluation_started'` - Moved to evaluation

- **Workflow 4 Events**:
  - `'decision_ready'` - Evaluation complete
  - `'po_issued'` - Purchase order created
  - `'vendor_rejected'` - Vendor not selected
  - `'negotiation_started'` - Price negotiation initiated

---

## 2. Table-by-Table Field Usage

### rfq_requests Table
```sql
-- Primary Fields (ALL workflows read these)
id                    UUID      - Primary key
rfq_id               TEXT      - Unique RFQ identifier
project_id           TEXT      - Project reference
project_name         TEXT      - Human-readable project name
nine_com_number      TEXT      - 9COM reference

-- Material Details (Workflow 1 writes, others read)
material_description TEXT      - What is being procured
specifications       TEXT      - Technical specifications
quantity             INTEGER   - Required quantity
unit_of_measure      TEXT      - Units (e.g., 'EA', 'SET')
commodity_code       TEXT      - Optional commodity classification

-- Requirements (Workflow 1 writes)
critical_requirements TEXT     - Must-have features
wbs_code             TEXT      - Work breakdown structure
delivery_location    TEXT      - Where to deliver
delivery_timeline    TEXT      - When needed

-- Financial (Workflow 1 writes, Workflow 4 updates)
estimated_value      DECIMAL   - Budget estimate
final_price          DECIMAL   - Actual PO amount
cost_savings         DECIMAL   - Calculated savings

-- Status Tracking (Multiple workflows update)
status               TEXT      - Current status (see values above)
current_stage        INTEGER   - Workflow stage number

-- Vendor Metrics (Updated by multiple workflows)
vendor_count         INTEGER   - Total vendors contacted
invited_vendor_count INTEGER   - Initial invitation count
responded_vendor_count INTEGER - How many responded
compliant_vendor_count INTEGER - How many are compliant

-- Timestamps (Set by different workflows)
initiated_at         TIMESTAMPTZ - When created (W1)
rfq_sent_at         TIMESTAMPTZ - When sent (W1)
response_deadline   TIMESTAMPTZ - Due date (W1)
evaluation_started_at TIMESTAMPTZ - Eval began (W3)
decision_made_at    TIMESTAMPTZ - Decision time (W4)
po_issued_at        TIMESTAMPTZ - PO created (W4)

-- Decision Data (Workflow 4)
selected_vendor_id   UUID      - Winning vendor
po_number           TEXT       - Purchase order number

-- Metadata
created_by          TEXT       - User who created
approved_by         TEXT       - Who approved PO
notes               TEXT       - General notes
created_at          TIMESTAMPTZ - Record created
updated_at          TIMESTAMPTZ - Last modified
```

### vendors Table
```sql
-- Identity (Workflow 1 creates/updates)
id                  UUID      - Primary key
vendor_id           TEXT      - Auto-generated (9V-NNNN format)
vendor_name         TEXT      - Company name
vendor_email        TEXT      - Unique email (used for matching)

-- Contact (Workflow 1 from AVL)
contact_person      TEXT      - Primary contact name
phone_number        TEXT      - Contact phone

-- Classification (Set manually or by AI)
vendor_type         TEXT      - 'manufacturer', 'trader', 'distributor'
vendor_tier         TEXT      - 'tier1', 'tier2', 'new'

-- Performance Metrics (Updated after each RFQ)
total_rfqs_invited  INTEGER   - Times invited (W1 increments)
total_rfqs_responded INTEGER  - Times responded (W2 increments)
total_rfqs_won      INTEGER   - Times selected (W4 increments)
average_response_time_hours DECIMAL - Calculated
average_score       DECIMAL   - From evaluations
compliance_rate     DECIMAL   - % compliant offers

-- Status
is_active           BOOLEAN   - Can receive RFQs
is_approved         BOOLEAN   - Approved vendor
approval_date       DATE      - When approved

-- Tracking
last_contacted      TIMESTAMPTZ - Last RFQ sent (W1 updates)
created_at          TIMESTAMPTZ - Record created
updated_at          TIMESTAMPTZ - Last modified
```

### vendor_offers Table
```sql
-- Identity
id                  UUID      - Primary key
rfq_id             TEXT      - Links to rfq_requests
vendor_id          UUID      - Links to vendors

-- Offer Details (Workflow 2 writes)
unit_price         DECIMAL   - Price per unit
total_price        DECIMAL   - Total offer value
currency           TEXT      - Currency code
payment_terms      TEXT      - Payment conditions
delivery_terms     TEXT      - Delivery conditions
validity_period    TEXT      - Offer validity

-- Technical Details (Workflow 2 extracts)
technical_compliance JSONB    - Compliance details
offered_specifications TEXT   - What vendor offers
deviations         TEXT      - Any deviations

-- Evaluation (Workflow 2 & 4)
compliance_status  TEXT      - See values above
compliance_notes   TEXT      - Why non-compliant
evaluation_status  TEXT      - See values above
evaluation_score   DECIMAL   - Numeric score
evaluator_notes    TEXT      - Evaluation comments

-- Tracking
response_received_at TIMESTAMPTZ - When received
evaluated_at       TIMESTAMPTZ - When evaluated
created_at         TIMESTAMPTZ - Record created
updated_at         TIMESTAMPTZ - Last modified
```

### rfq_events Table
```sql
-- Core Fields (All workflows write)
id                 UUID      - Primary key
rfq_id            TEXT      - Links to RFQ
event_type        TEXT      - See event types above
event_timestamp   TIMESTAMPTZ - When it happened

-- Event Details
title             TEXT      - Auto-generated if null
description       TEXT      - Human-readable description
details           JSONB     - Additional structured data

-- Context (Various workflows)
vendor_id         UUID      - If vendor-specific
vendor_name       TEXT      - Vendor name (denormalized)
vendor_email      TEXT      - Vendor email (for searching)

-- Project Info (Workflow 1 mainly)
nine_com_number   TEXT      - 9COM reference
project_name      TEXT      - Project name
project_id        TEXT      - Project ID

-- Change Tracking (Status changes)
previous_status   TEXT      - Status before
new_status        TEXT      - Status after
changed_by        TEXT      - Who made change

-- Performance
processing_time_ms INTEGER  - How long it took

-- Metadata
source            TEXT      - 'workflow', 'manual', 'system'
workflow_execution_id TEXT  - n8n execution ID
created_at        TIMESTAMPTZ - Record created
```

### workflow_executions Table
```sql
-- Identity
id                UUID      - Primary key
workflow_name     TEXT      - Which workflow ran
execution_id      TEXT      - n8n execution ID

-- Results (All workflows)
status            TEXT      - 'success', 'error', 'warning'
error_message     TEXT      - If failed
error_details     JSONB     - Detailed error info

-- Context
rfq_id           TEXT      - Related RFQ
vendor_count     INTEGER   - Vendors processed
trigger_type     TEXT      - 'email', 'schedule', 'webhook'

-- Timing
started_at       TIMESTAMPTZ - Start time
completed_at     TIMESTAMPTZ - End time
duration_ms      INTEGER    - Total duration

-- Metadata
input_data       JSONB      - What triggered it
output_data      JSONB      - What it produced
created_at       TIMESTAMPTZ - Record created
```

### email_logs Table
```sql
-- Email Details (Workflow 1 & 2)
id               UUID       - Primary key
message_id       TEXT       - Gmail message ID
thread_id        TEXT       - Gmail thread ID
rfq_id          TEXT       - Related RFQ

-- Email Metadata
from_email      TEXT       - Sender
to_email        TEXT       - Recipients
cc_email        TEXT       - CC recipients
subject         TEXT       - Subject line
body_text       TEXT       - Plain text body
body_html       TEXT       - HTML body

-- Processing
processed_at    TIMESTAMPTZ - When processed
has_attachments BOOLEAN    - Has attachments
attachment_count INTEGER   - Number of attachments
processing_status TEXT     - Status

-- Metadata
received_at     TIMESTAMPTZ - When received
created_at      TIMESTAMPTZ - Record created
```

### extraction_quality_issues Table
```sql
-- Identity (Workflow 1 & 2)
id               UUID       - Primary key
email_id        TEXT       - Gmail message ID
rfq_id          TEXT       - Related RFQ

-- Quality Metrics
extraction_method TEXT     - 'pdf', 'email_body', 'ai'
quality_score   DECIMAL    - 0-100 score
confidence_level TEXT      - 'high', 'medium', 'low'

-- Issues
missing_fields  TEXT[]     - Array of missing fields
validation_errors JSONB    - Validation problems
extracted_data  JSONB      - What was extracted

-- Resolution
status          TEXT       - 'pending_manual_review', 'resolved'
resolved_by     TEXT       - Who fixed it
resolution_notes TEXT      - How it was fixed

-- Metadata
created_at      TIMESTAMPTZ - Record created
resolved_at     TIMESTAMPTZ - When resolved
```

### gatekeeper_logs Table
```sql
-- Execution (Workflow 3)
id              UUID       - Primary key
check_timestamp TIMESTAMPTZ - When checked
rfqs_checked    INTEGER    - How many checked
rfqs_triggered  INTEGER    - How many moved to eval

-- Results
triggered_rfq_ids TEXT[]   - Array of RFQ IDs
check_criteria  JSONB      - What criteria used
execution_details JSONB    - Detailed results

-- Metadata
created_at      TIMESTAMPTZ - Record created
```

### purchase_orders Table
```sql
-- Identity (Workflow 4)
id              UUID       - Primary key
po_number       TEXT       - Unique PO number
rfq_id         TEXT       - Source RFQ
vendor_id      UUID       - Selected vendor

-- Order Details
po_value       DECIMAL    - Total PO amount
currency       TEXT       - Currency code
payment_terms  TEXT       - Payment conditions
delivery_date  DATE       - Expected delivery

-- Approval
created_by     TEXT       - Who created
approved_by    TEXT       - Who approved
approval_notes TEXT       - Approval comments

-- Status
status         TEXT       - 'draft', 'approved', 'sent'
sent_at        TIMESTAMPTZ - When sent to vendor

-- Metadata
created_at     TIMESTAMPTZ - Record created
updated_at     TIMESTAMPTZ - Last modified
```

---

## 3. Critical Consistency Rules

### 1. NEVER Create New Fields
If a workflow needs to store data, it MUST use existing fields or the `details` JSONB field.

### 2. Always Use Exact Status Values
Status strings are case-sensitive. Always use lowercase with underscores.

### 3. Timestamp Convention
- All timestamps end with `_at`
- All timestamps are TIMESTAMPTZ (with timezone)
- Use NOW() for current timestamp

### 4. ID Relationships
- vendor_email is unique and used for upserts
- rfq_id links everything together
- vendor_id references vendors.id (UUID)

### 5. Required vs Optional
Most fields are optional to allow flexibility. Only these are required:
- All primary keys (id)
- rfq_id in all tables
- vendor_email in vendors
- event_type in rfq_events
- workflow_name in workflow_executions

### 6. JSON Fields Usage
Use JSONB fields for:
- Variable/unknown data structures
- Third-party API responses
- Complex nested data
- Arrays of objects

---

## 4. Workflow-Specific Notes

### Workflow 1 (Main Processor)
- Creates most rfq_requests fields
- Creates/updates vendors
- Logs email_sent events
- Can create extraction_quality_issues

### Workflow 2 (Vendor Response)
- Creates vendor_offers records
- Updates rfq_requests counts
- Logs vendor_responded events
- Updates vendor performance metrics

### Workflow 3 (Gatekeeper)
- Updates rfq_requests.status
- Creates gatekeeper_logs
- Logs evaluation_started events

### Workflow 4 (Evaluation)
- Updates final rfq_requests fields
- Creates purchase_orders
- Updates vendor win counts
- Logs decision events
