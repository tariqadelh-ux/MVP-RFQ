# RFQ Automation System - Technical Specification
## Developer Implementation Guide for MVP Dashboard

---

# System Overview

The RFQ Automation System processes procurement emails from management, extracts requirements using AI, creates RFQs in Supabase, and manages vendor communications automatically. Your task is to build a dashboard that visualizes this data.

**Current Status:** Workflow 1 (Main Processor) is built and generating data in Supabase.

---

# Workflow 1: Main Processor - What It Does

## Process Flow
1. **Email arrives** from management with procurement request (PDF or email body)
2. **AI extracts** project details, materials, specifications, quantities
3. **System generates** unique RFQ ID (format: `BQ-YYYYMMDDHHMMSS`)
4. **Looks up vendors** in Google Sheets AVL (Approved Vendor List) using 9COM number
5. **Sends RFQ emails** to all approved vendors
6. **Updates database** with all transaction details

## RFQ Lifecycle Status Flow
```
initiated → awaiting_responses → [Future: under_evaluation → po_issued/rejected]
                ↓
           pending_avl (if vendor list not found)
```

---

# Database Tables & Fields

## 1. rfq_requests (Main RFQ Table)

| Field | Type | Description | Sample Data | Dashboard Usage |
|-------|------|-------------|-------------|-----------------|
| rfq_id | TEXT | Unique ID | BQ-20251101143022 | Display in all views |
| nine_com_number | TEXT | Aramco reference | 450-012547 | Search/filter |
| project_name | TEXT | Project title | Project Eagle - Site 7 | Display in tables |
| project_id | TEXT | WBS code | PE-A7-PRC-01 | Additional info |
| material_description | TEXT | What to procure | Heat Exchanger | Display in details |
| specifications | TEXT | Technical specs | SS 316/316L | Detailed view |
| quantity | INTEGER | Amount needed | 1 | Display in tables |
| critical_requirements | TEXT | Must-haves | All wetted parts SS316L | Detailed view |
| status | TEXT | Current state | awaiting_responses | STATUS TRACKER |
| response_deadline | TIMESTAMPTZ | Vendor due date | 2025-11-08T17:00:00Z | Countdown timer |
| vendor_count | INTEGER | Vendors contacted | 4 | KPI metric |
| created_at | TIMESTAMPTZ | Creation time | 2025-11-01T14:30:22Z | Sorting/filtering |
| rfq_sent_at | TIMESTAMPTZ | When sent | 2025-11-01T14:35:00Z | "Today's Sent" KPI |
| initiated_at | TIMESTAMPTZ | Process start | 2025-11-01T14:30:00Z | Cycle time calc |
| responded_vendor_count | INTEGER | Responses received | 0 | Response tracking |

**Status Values:**
- `initiated` = Created but not sent
- `awaiting_responses` = Sent to vendors, waiting for quotes
- `pending_avl` = Vendor list not found, manual intervention needed
- `under_evaluation` = (Future) Evaluating responses
- `po_issued` = (Future) Purchase order created
- `rejected` = (Future) RFQ cancelled

## 2. vendors

| Field | Type | Description | Sample Data | Dashboard Usage |
|-------|------|-------------|-------------|-----------------|
| vendor_email | TEXT | Primary key | vendor.a@example.com | Unique identifier |
| vendor_name | TEXT | Company name | ABC Suppliers Ltd | Display name |
| contact_person | TEXT | Contact name | John Smith | Contact info |
| phone_number | TEXT | Phone | +966501234567 | Contact info |
| last_contacted | TIMESTAMPTZ | Last RFQ sent | 2025-11-01T14:35:00Z | Activity tracking |
| total_rfqs_invited | INTEGER | Total RFQs sent | 15 | Vendor metrics |

## 3. rfq_events

| Field | Type | Description | Sample Data | Dashboard Usage |
|-------|------|-------------|-------------|-----------------|
| rfq_id | TEXT | Links to RFQ | BQ-20251101143022 | Join key |
| event_type | TEXT | Event category | email_sent | Audit trail |
| vendor_email | TEXT | For vendor events | vendor@example.com | Vendor tracking |
| event_timestamp | TIMESTAMPTZ | When occurred | 2025-11-01T14:35:00Z | Timeline |
| description | TEXT | Human readable | RFQ sent to vendor | Display text |
| details | JSONB | Extra metadata | {"message_id": "abc"} | Advanced filtering |

**Event Types:**
- `rfq_initiated` = New RFQ created
- `email_sent` = RFQ sent to vendor  
- `avl_not_found` = Vendor list not found
- `workflow_success` = Process completed
- `vendor_responded` = (Future) Quote received
- `evaluation_started` = (Future) Review began

## 4. workflow_executions

| Field | Type | Description | Sample Data | Dashboard Usage |
|-------|------|-------------|-------------|-----------------|
| workflow_name | TEXT | Which workflow | RFQ Generation | Process tracking |
| rfq_id | TEXT | Related RFQ | BQ-20251101143022 | Join key |
| status | TEXT | Result | success/error | Health monitoring |
| vendor_count | INTEGER | Vendors processed | 4 | Process metrics |
| duration_ms | INTEGER | Processing time | 330000 | Performance |
| started_at | TIMESTAMPTZ | Start time | 2025-11-01T14:30:00Z | Timeline |

## 5. extraction_quality_issues

| Field | Type | Description | Sample Data | Dashboard Usage |
|-------|------|-------------|-------------|-----------------|
| email_id | TEXT | Gmail ID | 18c3d4e5f6g7h8i9 | Troubleshooting |
| quality_score | DECIMAL | 0-100 scale | 65.5 | Quality metrics |
| missing_fields | TEXT[] | Missing data | {nine_com_number} | Alert generation |
| status | TEXT | Current state | pending_manual_review | Action items |

---

# MVP Dashboard Features - Phase 1

## Manual Workflow Triggers (Progressive Enhancement)
Starting from Phase 2, add manual trigger buttons between tracker nodes to give users control over workflow progression. These buttons will:
- Appear as lightning bolt icons (⚡) between tracker stages
- Trigger the next workflow via webhook/API
- Only show when appropriate based on RFQ state
- Provide manual override for automated processes

## 1. RFQ Status Tracker Bar (Top of Dashboard)
**Visual progress indicator - starts simple, expands with each phase**

### Phase 1 Tracker (Current - Only Workflow 1 nodes):
Show where the RFQ is in the initial processing:

```
[RFQ Created] → [Vendors Found] → [Emails Sent] → [Awaiting]
      ✓              ✓                ✓            ● (current)
```

**Data Source for Phase 1:**
```sql
SELECT 
  rfq_id,
  status,
  project_name,
  CASE 
    WHEN created_at IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as rfq_created,
  CASE 
    WHEN vendor_count > 0 THEN 'completed'
    WHEN status = 'pending_avl' THEN 'error'
    ELSE 'pending'
  END as vendors_found,
  CASE 
    WHEN rfq_sent_at IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END as emails_sent,
  CASE 
    WHEN status = 'awaiting_responses' THEN 'active'
    WHEN status = 'pending_avl' THEN 'error'
    ELSE 'pending'
  END as awaiting
FROM rfq_requests
WHERE rfq_id = ?
```

**Visual States:**
- ✓ Completed (green)
- ● Active/Current (blue pulsing)
- ○ Pending (gray)
- ⚠ Error/Stuck (yellow/red for pending_avl)

### How Tracker Expands in Future Phases:

**Phase 2 (After Vendor Response Workflow):**
Add one node: `→ [Responses Received]`

**Phase 3 (After Gatekeeper Workflow):**
Add one node: `→ [Ready for Review]`

**Phase 4 (After Decision Workflow):**
Add final nodes: `→ [Decision Made] → [PO Sent]`

**Final tracker will have 7-8 nodes total, not 15-20. Keep it simple!**

## 2. Executive Overview Page

### KPI Cards (Top Row)
Display three primary metrics:

**Active RFQs**
- Query: `SELECT COUNT(*) FROM rfq_requests WHERE status IN ('initiated', 'awaiting_responses')`
- Shows: Currently active procurement requests

**Today's Sent**
- Query: `SELECT COUNT(*) FROM rfq_requests WHERE DATE(rfq_sent_at) = CURRENT_DATE`
- Shows: RFQs distributed today

**Pending AVL**
- Query: `SELECT COUNT(*) FROM rfq_requests WHERE status = 'pending_avl'`
- Shows: RFQs waiting for vendor list

### Recent RFQs Table
Display last 10 RFQs with key information:

**Columns to Display:**
- RFQ ID (clickable to show tracker)
- Project Name
- Material Description
- Status (color-coded badge)
- Vendors Contacted
- Response Deadline (show countdown if active)
- Created Date

**Data Query:**
```sql
SELECT 
  rfq_id,
  project_name,
  material_description,
  status,
  vendor_count,
  response_deadline,
  created_at
FROM rfq_requests
ORDER BY created_at DESC
LIMIT 10
```

**Status Badge Colors:**
- `initiated` = Gray
- `awaiting_responses` = Blue
- `pending_avl` = Yellow
- `under_evaluation` = Purple (future)
- `po_issued` = Green (future)
- `rejected` = Red (future)

## 3. Audit Trail Page

### Event Log Table
Show chronological history of all system events:

**Columns to Display:**
- Timestamp (formatted as relative time)
- Event Type (human-friendly labels)
- RFQ ID (linkable)
- Description
- Vendor (if applicable)

**Data Query:**
```sql
SELECT 
  e.event_timestamp,
  e.event_type,
  e.rfq_id,
  e.description,
  e.vendor_email,
  r.project_name
FROM rfq_events e
LEFT JOIN rfq_requests r ON e.rfq_id = r.rfq_id
ORDER BY e.event_timestamp DESC
LIMIT 20 OFFSET ?
```

### Filters to Implement:
- Date range selector
- Event type filter (dropdown)
- RFQ ID search
- Vendor email filter

---

# Dashboard Features - Phase 2
**After Workflow 2 (Vendor Response Processing) is built**

## Tracker Bar Update:
Add **[Responses Received]** node to tracker with **manual trigger button**:
```
[RFQ Created] → [Vendors Found] → [Emails Sent] → [Awaiting] →[⚡]→ [Responses Received]
                                                                  ↑
                                                      "Check Responses" button
```

**Manual Trigger Button:**
- **Label:** "Check for Responses" 
- **Position:** Between [Awaiting] and [Responses Received]
- **Action:** Triggers Workflow 2 via webhook
- **Visibility:** Only show when status = 'awaiting_responses'
- **API Call:**
```javascript
POST /api/trigger-workflow
{
  "workflow": "vendor_response_check",
  "rfq_id": "BQ-20251101143022"
}
```

**Button Data Check:**
```sql
-- Show button if awaiting responses and time has passed
SELECT 
  rfq_id,
  CASE 
    WHEN status = 'awaiting_responses' 
    AND responded_vendor_count < vendor_count
    AND NOW() > created_at + INTERVAL '1 hour'
    THEN true
    ELSE false
  END as show_response_check_button
FROM rfq_requests
WHERE rfq_id = ?
```

New status check:
```sql
CASE 
  WHEN responded_vendor_count > 0 THEN 'in_progress'
  WHEN responded_vendor_count >= vendor_count THEN 'completed'
  ELSE 'pending'
END as responses_received
```

## Additional KPIs to Add:
- **Response Rate**: `(responded_vendor_count / vendor_count) * 100`
- **Compliance Rate**: `(compliant_vendor_count / responded_vendor_count) * 100`
- **Pending TBC**: Count of vendors awaiting clarification

## Enhanced RFQ Table:
Add columns:
- Responses Received (X/Y format)
- Latest Response Time
- Compliance Status

## New Data Sources:
Table: **vendor_offers** (will be created by Workflow 2)
- Stores vendor quotations
- Links to rfq_requests via rfq_id
- Contains pricing, compliance status, technical details

---

# Dashboard Features - Phase 3
**After Workflow 3 (Commercial Gatekeeper) is built**

## Tracker Bar Update:
Add **[Ready for Review]** node with **evaluation trigger button**:
```
[RFQ Created] → [Vendors Found] → [Emails Sent] → [Awaiting] →[⚡]→ 
[Responses Received] →[⚡]→ [Ready for Review]
                        ↑
              "Evaluate Responses" button
```

**Manual Trigger Buttons:**

1. **"Check for Responses"** (from Phase 2)
   - Triggers Workflow 2 to check vendor emails

2. **"Evaluate Responses"** (NEW)
   - **Label:** "Start Evaluation"
   - **Position:** Between [Responses Received] and [Ready for Review]
   - **Action:** Triggers Workflow 3 (Commercial Gatekeeper)
   - **Visibility:** Only show when responded_vendor_count >= 2 OR deadline passed
   - **API Call:**
   ```javascript
   POST /api/trigger-workflow
   {
     "workflow": "commercial_gatekeeper",
     "rfq_id": "BQ-20251101143022",
     "action": "evaluate"
   }
   ```

**Button Visibility Logic:**
```sql
-- Show evaluation button if enough responses received
SELECT 
  rfq_id,
  responded_vendor_count,
  vendor_count,
  response_deadline,
  CASE 
    WHEN responded_vendor_count >= 3 THEN true  -- Quorum reached
    WHEN responded_vendor_count >= 2 AND NOW() > response_deadline THEN true
    WHEN NOW() > response_deadline + INTERVAL '2 days' THEN true  -- Force evaluation
    ELSE false
  END as show_evaluation_button
FROM rfq_requests
WHERE rfq_id = ?
```

New status check:
```sql
CASE 
  WHEN status = 'under_evaluation' THEN 'active'
  ELSE 'pending'
END as ready_for_review
```

## Process Efficiency Metrics:
- **Average Cycle Time**: Time from initiated to evaluation
- **Ready for Evaluation**: Count of RFQs with sufficient responses
- **Bottleneck Analysis**: Which stage takes longest

## Status Distribution Chart:
Visual breakdown of RFQs by status (pie or bar chart)

## New Data Sources:
Table: **gatekeeper_logs** (will be created by Workflow 3)
- Tracks automated evaluation triggers
- Records quorum decisions

---

# Dashboard Features - Phase 4
**After Workflow 4 (Evaluation & Decision) is built**

## Tracker Bar Update (Final):
Complete tracker with **decision and PO trigger buttons**:
```
[RFQ Created] → [Vendors Found] → [Emails Sent] → [Awaiting] →[⚡]→ 
[Responses Received] →[⚡]→ [Ready for Review] →[⚡]→ [Decision Made] →[⚡]→ [PO Sent]
                                                  ↑                      ↑
                                        "Make Decision"          "Issue PO"
```

**Manual Trigger Buttons (Complete Set):**

1. **"Check for Responses"** (Phase 2)
   - Triggers vendor email checking

2. **"Evaluate Responses"** (Phase 3)  
   - Triggers commercial evaluation

3. **"Make Decision"** (NEW)
   - **Label:** "Review & Decide"
   - **Position:** Between [Ready for Review] and [Decision Made]
   - **Action:** Opens decision modal/form
   - **Visibility:** Only when status = 'under_evaluation'
   - **API Call:**
   ```javascript
   POST /api/trigger-workflow
   {
     "workflow": "evaluation_decision",
     "rfq_id": "BQ-20251101143022",
     "action": "review"
   }
   ```

4. **"Issue PO"** (NEW)
   - **Label:** "Generate PO"
   - **Position:** Between [Decision Made] and [PO Sent]
   - **Action:** Triggers PO generation and sending
   - **Visibility:** Only when decision = 'approved'
   - **API Call:**
   ```javascript
   POST /api/trigger-workflow
   {
     "workflow": "purchase_order_generation",
     "rfq_id": "BQ-20251101143022",
     "vendor_id": "selected_vendor_id",
     "action": "generate_po"
   }
   ```

**Button States & Colors:**
```javascript
// Button styling based on state
const buttonStyles = {
  available: "bg-blue-500 hover:bg-blue-600 text-white",  // Ready to click
  processing: "bg-yellow-500 animate-pulse",              // Workflow running
  completed: "bg-green-500 cursor-not-allowed",           // Already done
  disabled: "bg-gray-300 cursor-not-allowed"              // Not yet available
}
```

**Complete Button Visibility Query:**
```sql
SELECT 
  rfq_id,
  status,
  -- Check Responses button
  CASE 
    WHEN status = 'awaiting_responses' THEN 'available'
    WHEN responded_vendor_count >= vendor_count THEN 'completed'
    ELSE 'disabled'
  END as check_responses_button,
  
  -- Evaluate button
  CASE 
    WHEN responded_vendor_count >= 2 AND status = 'awaiting_responses' THEN 'available'
    WHEN status = 'under_evaluation' THEN 'processing'
    WHEN status IN ('po_issued', 'rejected') THEN 'completed'
    ELSE 'disabled'
  END as evaluate_button,
  
  -- Decision button
  CASE 
    WHEN status = 'under_evaluation' THEN 'available'
    WHEN decision_made_at IS NOT NULL THEN 'completed'
    ELSE 'disabled'
  END as decision_button,
  
  -- Issue PO button
  CASE 
    WHEN decision_made_at IS NOT NULL AND selected_vendor_id IS NOT NULL 
         AND status != 'po_issued' THEN 'available'
    WHEN status = 'po_issued' THEN 'completed'
    ELSE 'disabled'
  END as issue_po_button
FROM rfq_requests
WHERE rfq_id = ?
```

Final tracker shows complete procurement lifecycle with manual control points.

## Financial Metrics:
- **Monthly Savings**: Calculated from awarded POs
- **Average Discount**: Comparison to estimates
- **Vendor Win Rate**: Which vendors win most

## Decision Dashboard:
- Pending decisions requiring action
- Recent PO awards
- Rejected RFQs with reasons

## New Data Sources:
Table: **purchase_orders** (will be created by Workflow 4)
- Final PO details
- Selected vendor
- Final pricing

---

# Key Implementation Notes

## RFQ ID Format
Always format as: `BQ-YYYYMMDDHHMMSS`
- BQ = Bin Quraya prefix
- Example: `BQ-20251101143022`

## Timestamp Handling
- All timestamps are TIMESTAMPTZ (with timezone)
- Display in local time for users
- Use relative time for recent events ("2 hours ago")

## Real-time Updates (Optional for MVP)
- Can use Supabase real-time subscriptions
- Or simple polling every 30 seconds
- Not required for initial version

## Performance Considerations
- Add indexes on frequently queried fields
- Use pagination for large result sets
- Consider caching for KPI queries

## Error Handling
- Show user-friendly messages for failed queries
- Log errors for debugging
- Provide retry mechanisms

---

---

# API Endpoints for Workflow Triggers

## Webhook Configuration (Starting Phase 2)

### Base Endpoint Structure:
```
POST /api/trigger-workflow
Authorization: Bearer [token]
Content-Type: application/json
```

### Phase 2: Vendor Response Check
```json
{
  "workflow": "vendor_response_check",
  "rfq_id": "BQ-20251101143022",
  "action": "check_emails"
}
```
**n8n Webhook URL:** Configure in Workflow 2 as HTTP trigger

### Phase 3: Commercial Gatekeeper
```json
{
  "workflow": "commercial_gatekeeper", 
  "rfq_id": "BQ-20251101143022",
  "action": "evaluate",
  "force": false  // Set true to bypass quorum rules
}
```
**n8n Webhook URL:** Configure in Workflow 3 as HTTP trigger (in addition to schedule)

### Phase 4: Decision & PO
```json
{
  "workflow": "evaluation_decision",
  "rfq_id": "BQ-20251101143022",
  "action": "review" | "approve" | "reject",
  "selected_vendor_id": "vendor@example.com",  // For approve action
  "rejection_reason": "Budget exceeded"        // For reject action
}
```
**n8n Webhook URL:** Configure in Workflow 4 as primary trigger

### Response Format:
```json
{
  "success": true,
  "workflow_execution_id": "12345",
  "message": "Workflow triggered successfully",
  "estimated_completion": "2-3 minutes"
}
```

---

# Testing Checklist

## Phase 1 Deliverables:
- [ ] RFQ Status Tracker bar working for any selected RFQ (4 nodes only)
- [ ] Three KPI cards showing correct counts
- [ ] Recent RFQs table with 10 rows
- [ ] Status badges with appropriate colors
- [ ] Clickable RFQ IDs that update tracker
- [ ] Audit trail with 20 events per page
- [ ] Pagination working on audit trail
- [ ] Basic filters on audit trail
- [ ] Responsive layout for mobile
- [ ] Loading states for all queries
- [ ] Error handling for failed connections

## Phase 2+ Button Testing:
- [ ] Trigger buttons appear at correct positions in tracker
- [ ] Buttons only visible when conditions are met
- [ ] Button states (available/processing/completed/disabled) display correctly
- [ ] API calls trigger workflows successfully
- [ ] Loading animation while workflow processes
- [ ] Success/error feedback to user
- [ ] Tracker updates after workflow completion

## Data Validation:
- [ ] RFQ IDs match expected format
- [ ] Dates display correctly
- [ ] Status values are from allowed list
- [ ] Vendor counts are accurate
- [ ] Event types map to friendly names

---

# Common Queries for Reference

## Get RFQ with Full Details:
```sql
SELECT 
  r.*,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT CASE WHEN e.event_type = 'email_sent' THEN e.vendor_email END) as vendors_emailed
FROM rfq_requests r
LEFT JOIN rfq_events e ON r.rfq_id = e.rfq_id
WHERE r.rfq_id = ?
GROUP BY r.rfq_id
```

## Daily Activity Summary:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as rfqs_created,
  AVG(vendor_count) as avg_vendors,
  COUNT(CASE WHEN status = 'pending_avl' THEN 1 END) as avl_issues
FROM rfq_requests
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC
```

## Vendor Activity:
```sql
SELECT 
  v.vendor_name,
  v.vendor_email,
  COUNT(DISTINCT e.rfq_id) as rfqs_involved,
  MAX(v.last_contacted) as last_activity
FROM vendors v
JOIN rfq_events e ON v.vendor_email = e.vendor_email
WHERE e.event_type = 'email_sent'
GROUP BY v.vendor_name, v.vendor_email
ORDER BY rfqs_involved DESC
```
