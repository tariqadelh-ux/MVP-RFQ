# Context Summary for Claude Desktop - RFQ Automation MVP

## Project Overview
You're building an MVP RFQ (Request for Quotation) automation system with 4 interconnected n8n workflows and a minimal dashboard. The system is moving from demo (hard-coded) to production (AI-driven with Supabase storage).

---

## Current Supabase Tables (9 Total)

### 1. **rfq_requests** - Main RFQ records
- Stores: RFQ details, project info, status, vendor counts, timestamps
- Key fields: rfq_id (BQ-YYYYMMDDHHMMSS), status, vendor_count, response_deadline

### 2. **vendors** - Vendor master data  
- Stores: Vendor info, performance metrics, contact details
- Key fields: vendor_id (9V-NNNN), vendor_email (unique), last_contacted

### 3. **vendor_offers** - Vendor quotations
- Stores: Price offers, compliance status, evaluation results
- Key fields: rfq_id, vendor_id, unit_price, compliance_status

### 4. **rfq_events** - Audit trail
- Stores: All system events with timestamps
- Key fields: event_type, rfq_id, vendor_email, nine_com_number, project_name

### 5. **workflow_executions** - Workflow history
- Stores: Execution logs for all workflows
- Key fields: workflow_name, status, rfq_id, vendor_count

### 6. **email_logs** - Email tracking
- Stores: Processed emails from Gmail
- Key fields: message_id, rfq_id, from_email, processed_at

### 7. **extraction_quality_issues** - AI extraction problems
- Stores: Low-confidence extractions needing review
- Key fields: quality_score, missing_fields, status

### 8. **gatekeeper_logs** - Scheduled check results
- Stores: Commercial gatekeeper execution logs
- Key fields: rfqs_checked, rfqs_triggered, triggered_rfq_ids

### 9. **purchase_orders** - Final POs
- Stores: Approved purchase orders
- Key fields: po_number, rfq_id, vendor_id, po_value

---

## 4-Workflow MVP Architecture

### Workflow 1: Main Processor (COMPLETED)
- **Trigger**: Email from management with procurement memo
- **Actions**: 
  - Extract project details using GPT-4o
  - Lookup vendors in AVL (Google Sheets)
  - Send RFQ emails to vendors
  - Create records in rfq_requests, vendors, rfq_events
- **Tables Used**: rfq_requests (write), vendors (upsert), rfq_events (write), workflow_executions (write)

### Workflow 2: Vendor Response Processing (TO BUILD)
- **Trigger**: Email from vendors with quotations
- **Actions**:
  - Extract offer details from email/PDF using AI
  - Check compliance against requirements
  - Send TBC if needed
  - Create vendor_offers records
- **Tables Used**: vendor_offers (write), rfq_requests (update counts), rfq_events (write), vendors (update metrics)

### Workflow 3: Commercial Gatekeeper (TO BUILD)
- **Trigger**: Scheduled (every 2 hours)
- **Actions**:
  - Check RFQs for response quorum
  - Move qualified RFQs to evaluation
  - Log check results
- **Tables Used**: rfq_requests (read/update status), gatekeeper_logs (write), rfq_events (write)

### Workflow 4: Evaluation & Decision (TO BUILD)
- **Trigger**: Webhook from dashboard
- **Actions**:
  - Present decision summary
  - Handle PO approval/rejection
  - Create purchase orders
- **Tables Used**: rfq_requests (update), purchase_orders (write), vendors (update), rfq_events (write)

---

## Supabase Fields Written by Main Processor

### rfq_requests Table Writes:
```sql
- rfq_id (generated as BQ-YYYYMMDDHHMMSS)
- nine_com_number (from memo)
- project_name (from memo)
- project_id (from memo)
- material_description (from memo)
- specifications (from memo)
- quantity (from memo)
- critical_requirements (from memo)
- wbs_code (from memo)
- estimated_value (from memo)
- delivery_location (from memo)
- delivery_timeline (from memo)
- status ('initiated' → 'awaiting_responses' or 'pending_avl')
- response_deadline (calculated as 7 days)
- vendor_count (after sending emails)
```

### vendors Table Writes:
```sql
- vendor_name (from AVL or email)
- vendor_email (from AVL)
- contact_person (from AVL)
- phone_number (from AVL)
- last_contacted (current timestamp)
```

### rfq_events Table Writes:
```sql
Event Type: 'email_sent'
- rfq_id
- event_type = 'email_sent'
- vendor_email
- vendor_name

Event Type: 'avl_not_found'  
- rfq_id
- event_type = 'avl_not_found'
- nine_com_number
- project_name
```

### workflow_executions Table Writes:
```sql
- workflow_name = 'RFQ Generation'
- status = 'success'
- rfq_id
- vendor_count
- completed_at
```

---

## Stripped-Down MVP Dashboard Features

### Executive Overview Tab (Only these features for MVP):

**Phase 1 (After Workflow 1):**
- 3 KPI cards: Active RFQs | Today's Sent | Pending AVL
- Recent RFQs table (10 rows): RFQ ID, Project, Status, Created, Vendors

**Phase 2 (After Workflow 2):**
- Add to KPIs: Response Rate | Compliance Rate
- Enhance table: Add "X/Y responded" column

**Phase 3 (After Workflow 3):**
- Add: Average Cycle Time metric
- Add: Simple status distribution (text counts)

**Phase 4 (After Workflow 4):**
- Add: Monthly Savings metric
- Add: Completed RFQs with final prices

### Audit Trail Tab (Only these features for MVP):
- Event log table: Timestamp, Type, RFQ ID, Description
- Basic filters: Date range, Event type
- Pagination: 20 per page
- CSV export (Phase 4 only)

### REMOVED from Ambitious Dashboard:
- ❌ RFQ Tracker tab (Kanban board)
- ❌ Vendor Rankings tab
- ❌ AI recommendations
- ❌ Expandable KPI cards
- ❌ Complex charts/visualizations
- ❌ Demo mode
- ❌ Real-time notifications
- ❌ Project details modal
- ❌ User profiles
- ❌ Settings page

---

## Dashboard Development by Workflow

### After Testing Workflow 1:
Display:
- Active RFQ count from `rfq_requests`
- Today's sent count from `rfq_sent_at`
- Basic event log from `rfq_events`

### After Building Workflow 2:
Add:
- Response metrics from `vendor_offers`
- Compliance tracking
- Vendor response events

### After Building Workflow 3:
Add:
- Cycle time calculations
- Status progression tracking
- Gatekeeper effectiveness

### After Building Workflow 4:
Add:
- Financial metrics
- PO tracking
- Complete audit trail
- Export functionality

---

## Key Consistency Requirements

### 1. RFQ ID Format
Always use: `BQ-YYYYMMDDHHMMSS` format

### 2. Status Values (Exact Strings)
```
'initiated'
'awaiting_responses'  
'pending_avl'
'under_evaluation'
'po_issued'
'rejected'
```

### 3. Event Types
Workflow-specific, documented in SUPABASE_FIELD_MAPPINGS.md

### 4. Vendor Identification
- Use vendor_email for matching (unique)
- vendor_id auto-generated as 9V-NNNN

### 5. Timestamps
All use TIMESTAMPTZ with timezone

---

## Testing Points for Main Processor

1. **Email Processing**
   - Gmail trigger receives management email
   - Attachment (memo) extracted successfully

2. **AI Extraction**
   - GPT-4o extracts all fields from memo
   - Quality score logged if low confidence

3. **AVL Lookup**
   - Google Sheets searched for 9COM number
   - Vendor list retrieved or marked pending

4. **Email Sending**
   - RFQ emails sent to all vendors
   - Each send logged as event

5. **Database Updates**
   - rfq_requests created with status
   - vendors upserted
   - rfq_events logged
   - workflow_executions recorded

---

## Next Steps for Claude Desktop Session

1. **Validate Schema Consistency**
   - Review all Supabase tables
   - Ensure field types match n8n usage
   - Check for missing indexes

2. **Standardize Enums**
   - Create type definitions for all status values
   - Document allowed event_type values
   - Define validation rules

3. **Document Field Mappings**
   - Which workflow writes which fields
   - Required vs optional fields
   - Default values

4. **Define MVP Queries**
   - Write SQL for each dashboard metric
   - Test query performance
   - Create database functions if needed

5. **Create Test Data**
   - Sample RFQs in various states
   - Test vendor responses
   - Verify dashboard displays correctly

---

## Important Notes

- **Service Role Key**: Use for n8n (not anon key) to bypass RLS
- **Nullable Fields**: Most fields optional for flexibility
- **Auto-Generated**: vendor_id (9V-NNNN), event titles
- **JSON Fields**: Use for variable/complex data (details, technical_compliance)
- **Performance**: Add indexes for common queries
