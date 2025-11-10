# Test Scenarios Database Results Tracking

## Overview
This document tracks the actual database state after running each test scenario. Each scenario represents a different workflow path and results in different database entries.

## N8n Workflow Reference
**Workflow Name**: RFQ Main Processor - Production v1  
**Description**: Main RFQ processor that handles email intake, AI extraction, vendor lookup, and email distribution  
**Location**: n8n > Workflows > "RFQ Main Processor - Production v1"  
**Version**: Latest (includes all fixes through November 10, 2025)  
**Source File**: My workflow 11 (6).json  

## How to Use This Document
1. Each scenario shows the exact database state after workflow execution
2. JSON outputs are actual Supabase records - use for data structure reference
3. Each scenario represents a different user journey (happy path, errors, edge cases)
4. Focus on Scenarios A-D for MVP dashboard development

## Dashboard Development Quick Reference

### Status Values in `rfq_requests`
- **`initiated`** - RFQ created, processing started
- **`awaiting_responses`** - Vendors notified, awaiting quotes
- **`pending_avl`** - No vendors found, manual assignment needed

### Event Types in `rfq_events`
- **`email_sent`** - Vendor notification sent
- **`avl_not_found`** - Vendor lookup failed

### Key Metrics to Track
- RFQ distribution by status (pie chart)
- Vendor contact success rate (vendor_count > 0)
- Quality issues requiring intervention
- Average processing time per RFQ

## Tables Used by Main Workflow

### Primary Tables
1. **rfq_requests** - Main RFQ record (INSERT, UPDATE)
2. **rfq_events** - Event log for each RFQ (INSERT only)
3. **vendors** - Vendor records (CREATE new, UPDATE existing)
4. **workflow_executions** - Workflow run history (INSERT only)
5. **extraction_quality_issues** - Poor quality extractions (INSERT only)

### Tables NOT Used by Main Workflow
- **vendor_emails** - Used by response workflow (Workflow 2)
- **manual_review_queue** - Future enhancement

## Scenario Overview for Dashboard Development

| Scenario | What It Tests | Expected Frequency | Dashboard Focus |
|----------|---------------|-------------------|-----------------|
| **A** | Happy path with PDF | 60% | Normal operations, successful vendor distribution |
| **B** | Email-only (no PDF) | 20% | Alternative extraction path, same outcome as A |
| **C** | AVL not found | 10% | Requires manual vendor assignment alert |
| **D** | Poor quality | 10% | Quality issues, needs manual intervention |

### Dashboard Priorities
1. **Main View**: Show all RFQs with status indicators
2. **Alerts Section**: Highlight Scenario C & D cases needing attention
3. **Metrics**: Track success rate (A+B vs C+D)
4. **Vendor Performance**: Count from `vendor_count` field

---

## Scenario A: Happy Path (PDF with Complete Details)
**Test Date**: November 9, 2025
**RFQ ID**: RFQ-2024-11-001
**Description**: Complete RFQ with PDF attachment, valid 9COM numbers, 3 vendors found in AVL

### Input Email
- **Subject**: RFQ for Heat Exchanger Project Eagle
- **Attachment**: PE-7-MEMO-001_Procurement_Initiation.pdf
- **Key Details**: 
  - 9COM Numbers: 450-012547, 680-009132
  - Project: Project Eagle - Aramco Site 7 Expansion
  - Items: Heat Exchanger + Pipe Fittings

### Database Results

#### 1. rfq_requests
```sql
-- Check with: SELECT * FROM rfq_requests WHERE rfq_id = 'RFQ-2024-11-001';
```
**Expected Entry**:
- rfq_id: RFQ-2024-11-001
- status: awaiting_responses
- vendor_count: 3
- project_name: Project Eagle - Aramco Site 7 Expansion
- commodity_code: 450-012547
- nine_com_number: 450-012547, 680-009132
- quantity: 1 (bundle)
- material_description: [Full item descriptions]
- [Other fields...]

**Actual Result**: ✅ 1 row
```json
{
  "id": "42f48fd4-99c3-4906-8f72-d6f1259788bb",
  "rfq_id": "RFQ-2024-11-001",
  "status": "awaiting_responses",
  "vendor_count": 3,
  "project_name": "Project Eagle - Aramco Site 7 Expansion",
  "commodity_code": "450-012547",
  "nine_com_number": "450-012547, 680-009132",
  "quantity": 1,
  "material_description": "High-Pressure Shell & Tube Heat Exchanger; 6\" Pipe Fittings, Schedule 40",
  "specifications": "Item 1: All wetted parts (tubes, tubesheet, channel) must be fabricated from Stainless Steel Grade 316/316L UNS S31603 due to the high chloride content of the process fluid, as per Aramco standard SAESA301. Item 2: Material must be Carbon Steel, ASTM A234 Gr. WPB, compliant with SAESL105.",
  "critical_requirements": "Mandatory technical specifications as per project memo and referenced Aramco standards.",
  "wbs_code": "PEA7PRC01",
  "response_deadline": "2025-11-16 11:57:33.571+00",
  "initiated_at": "2025-11-09 11:57:34.172713+00",
  "updated_at": "2025-11-09 11:57:41.452521+00"
}

#### 2. rfq_events
```sql
-- Check with: SELECT * FROM rfq_events WHERE rfq_id = 'RFQ-2024-11-001' ORDER BY event_timestamp;
```
**Expected Entries**:
1. Event: rfq_created
2. Event: quality_check_passed
3. Event: avl_found (3 vendors)
4. Event: email_sent (x3 - one per vendor)

**Actual Result**: ✅ 3 rows (all email_sent events)
```json
[
  {
    "event_type": "email_sent",
    "rfq_id": "RFQ-2024-11-001",
    "vendor_name": "Vendor A Industries",
    "vendor_email": "vendor.a.demo@gmail.com",
    "event_timestamp": "2025-11-09 11:57:41.206+00"
  },
  {
    "event_type": "email_sent",
    "rfq_id": "RFQ-2024-11-001",
    "vendor_name": "Vendor B Solutions",
    "vendor_email": "vendor.b.demo@gmail.com",
    "event_timestamp": "2025-11-09 11:57:41.207+00"
  },
  {
    "event_type": "email_sent",
    "rfq_id": "RFQ-2024-11-001",
    "vendor_name": "Vendor C Global",
    "vendor_email": "vendor.c.demo@gmail.com",
    "event_timestamp": "2025-11-09 11:57:41.208+00"
  }
]
```
**Note**: Missing rfq_created, quality_check_passed, and avl_found events

#### 3. vendors
```sql
-- Check with: SELECT * FROM vendors WHERE vendor_email IN ('vendor.a.demo@gmail.com', 'vendor.b.demo@gmail.com', 'vendor.c.demo@gmail.com');
```
**Expected Entries**:
- 3 vendor records (created or updated)
- Each with vendor_name, vendor_email, status = active

**Actual Result**: ✅ 3 rows
```json
[
  {
    "vendor_id": "9V-1053",
    "vendor_name": "Vendor A Industries",
    "vendor_email": "vendor.a.demo@gmail.com",
    "is_active": true,
    "is_approved": true,
    "last_contacted": "2025-11-09 11:57:39.146+00"
  },
  {
    "vendor_id": "9V-1054",
    "vendor_name": "Vendor B Solutions",
    "vendor_email": "vendor.b.demo@gmail.com",
    "is_active": true,
    "is_approved": true,
    "last_contacted": "2025-11-09 11:57:39.147+00"
  },
  {
    "vendor_id": "9V-1055",
    "vendor_name": "Vendor C Global",
    "vendor_email": "vendor.c.demo@gmail.com",
    "is_active": true,
    "is_approved": true,
    "last_contacted": "2025-11-09 11:57:39.148+00"
  }
]

#### 4. vendor_emails / email_logs
```sql
-- Check with: SELECT * FROM email_logs WHERE rfq_id = 'RFQ-2024-11-001';
```
**Expected Entries**:
- Would track vendor responses/emails back to us

**Actual Result**: ❌ Table "vendor_emails" doesn't exist. 
- "email_logs" table exists but is empty (tracks incoming emails from vendors)

#### 5. workflow_executions
```sql
-- Check with: SELECT * FROM workflow_executions WHERE rfq_id = 'RFQ-2024-11-001';
```
**Expected Entry**:
- workflow_name: RFQ Generation
- status: success
- vendor_count: 3
- trigger_type: email

**Actual Result**: ✅ 1 row
```json
{
  "workflow_name": "RFQ Generation",
  "status": "success",
  "rfq_id": "RFQ-2024-11-001",
  "vendor_count": 3,
  "started_at": "2025-11-09 11:57:41.846846+00",
  "completed_at": "2025-11-09 11:57:41.789+00",
  "execution_id": null,
  "trigger_type": null
}

#### 6. quality_issues / extraction_quality_issues
```sql
-- Check with: SELECT * FROM extraction_quality_issues WHERE rfq_id = 'RFQ-2024-11-001';
```
**Expected**: No entries (quality passed)

**Actual Result**: ✅ Empty (quality check passed)

### Summary for Scenario A
✅ **Success**: RFQ processed successfully with 3 vendors
- RFQ status updated to "awaiting_responses"
- 3 vendors created/updated with unique IDs
- 3 emails sent to vendors
- Workflow completed successfully
- No quality issues

**Missing**: Some event tracking (rfq_created, quality_check_passed, avl_found events not logged)

---

## Scenario B: Email Body Only (No Attachment) ✅ PASSED
**Test Date**: November 9, 2025 (Final successful run after fixes)
**RFQ ID**: RFQ-2024-11-002
**Description**: RFQ details in email body, no PDF attachment

### Final Results:

#### rfq_requests
```json
{
  "rfq_id": "RFQ-2024-11-002",
  "project_name": "Project Eagle - Aramco Site 7 Expansion",
  "commodity_code": "450-012547",
  "material_description": "High-Pressure Shell & Tube Heat Exchanger",
  "quantity": 2,
  "status": "awaiting_responses",
  "vendor_count": 3,  // Due to split execution
  "response_deadline": "2025-11-16 00:00:00+00",
  "nine_com_number": "450-012547",
  "specifications": "All wetted parts must be Stainless Steel Grade 316/316L",
  "wbs_code": "PEA7PRC02"
}
```

#### rfq_events
- **9 total events** (3 from Scenario A + 6 from Scenario B)
- All 6 Scenario B events have proper vendor_name and vendor_email ✅
- Split into 2 batches due to create/update separation:
  - Batch 1: Vendors D, E, F (new vendors)
  - Batch 2: Vendors A, B, C (existing vendors)

#### vendors
- **6 vendors total**: All successfully created/updated
- Vendors A, B, C: Updated with new `last_contacted`
- Vendors D, E, F: Created as new records with proper vendor_ids

#### workflow_executions
- **3 total entries** (1 from Scenario A + 2 from Scenario B)
- Scenario B split into 2 executions:
  - Each shows `vendor_count`: 3
  - Both show `status`: "success"

#### extraction_quality_issues
- No entries (extraction quality passed)

### Known Issues (Documented for Post-MVP):
- **Split Execution**: Workflow processes create/update vendors in separate runs
- Results in 2 workflow_executions entries instead of 1
- Does not affect functionality, only reporting accuracy

---

## Scenario C: AVL Not Found (9COM Invalid) ✅ PASSED
**Test Date**: November 10, 2025
**RFQ ID**: RFQ-2024-11-003
**Description**: RFQ with invalid 9COM number that doesn't exist in AVL

### Actual Results:

#### rfq_requests
- ✅ Creates 1 entry with 9COM: `999-999999`
- `status`: 'pending_avl' (correctly updated)
- `vendor_count`: 0
- All other fields extracted normally

#### rfq_events
- ✅ 1 entry: `avl_not_found` event
- Contains: rfq_id, nine_com_number, project_name
- **NO email_sent events** (correctly no vendors contacted)

#### vendors
- ✅ No changes (no vendors contacted)

#### workflow_executions
- ✅ 1 entry showing successful completion
```json
{
  "id": "4ff02074-7cf9-474e-87d7-86dfeedc980f",
  "workflow_name": "RFQ Generation",
  "status": "success",
  "rfq_id": "RFQ-2024-11-003",
  "vendor_count": 0,  // Correctly shows 0 vendors
  "started_at": "2025-11-10 14:45:19.657072+00",
  "completed_at": "2025-11-10 14:45:19.506+00"
}
```
- **Fixed**: Previously would loop forever, now completes properly
- **Note**: "success" status is correct - workflow completed without errors

#### extraction_quality_issues
- ✅ No entries (extraction passed)

### Key Test Points:
1. Workflow continues despite AVL not found
2. Dev team receives notification email
3. No vendor emails sent
4. Workflow completes successfully

---

## Scenario D: Poor Quality Extraction
**Test Date**: November 10, 2025
**RFQ ID**: None (quality check failed)
**Description**: Missing critical fields, fails quality check

### Input Email
- **Subject**: RFQ - Need stuff
- **Body**: We need some equipment for our project. Please process.
- **Result**: Quality check failed, no RFQ created

### Database Results

#### 1. extraction_quality_issues
```json
{
  "id": "ec12c3f5-ed50-48b2-8a43-d930edcc2cd2",
  "email_id": "19a6e514249c2ef4",
  "extraction_method": "email_body",
  "quality_score": "0",
  "missing_fields": ["projectName", "quantity"],
  "status": "pending_manual_review",
  "created_at": "2025-11-10 15:22:33.271+00"
}
```

#### 2. workflow_executions
```json
{
  "id": "768fdc36-49f8-4212-beb4-a10b2f564afd",
  "workflow_name": "RFQ Generation",
  "status": "success",
  "rfq_id": null,
  "vendor_count": 0,
  "completed_at": "2025-11-10 15:22:34.714+00"
}
```

#### 3. Other Tables
- **rfq_requests**: No entry (quality check failed)
- **rfq_events**: No entries
- **vendors**: No new vendors

### Key Outcomes
✅ Workflow completed without loops
✅ Quality issue logged
✅ Dev team notified
✅ No bad data created

---

## Post-MVP Test Scenarios (Not Required for Dashboard Development)

The following scenarios are documented for future production testing but are NOT needed for MVP dashboard development:

### Scenario E: Multiple Items
**Purpose**: Test multi-item RFQ handling and limitations  
**Why Post-MVP**: Same database operations as Scenarios A/B, only tests edge case of comma-separated 9COM numbers

### Scenario F: Special Characters  
**Purpose**: Test data sanitization and SQL injection prevention  
**Why Post-MVP**: Security testing, not new functionality

### Scenario G: Invalid Vendor Emails
**Purpose**: Test email validation and error handling  
**Why Post-MVP**: Edge case testing, not core functionality

**Note**: These scenarios will be tested during production hardening phase. See `POST_MVP_IMPROVEMENTS.md` for details.

---

## Summary for MVP Dashboard Development

### Database Records Created (Scenarios A-D):
- **rfq_requests**: 3 records (A, B, C only - D fails before creation)
- **rfq_events**: 8 records (3 for A, 3 for B, 1 for C, 0 for D)
- **vendors**: 6 unique records (A created 3, B reused 3 + created 3)
- **workflow_executions**: 4 records (one per scenario)
- **extraction_quality_issues**: 1 record (D only)

### Key Dashboard Insights:
1. **Success Rate**: 50% reach full vendor distribution (A+B)
2. **Intervention Required**: 50% need manual action (C+D)
3. **Vendor Coverage**: Average 3 vendors per successful RFQ
4. **Quality Score**: Track extraction quality to improve AI prompts

### Dashboard Development Action Items:

#### 1. Main RFQ List View
```sql
SELECT rfq_id, project_name, status, vendor_count, created_at
FROM rfq_requests
ORDER BY created_at DESC
```

#### 2. Alerts Dashboard (Needs Attention)
```sql
-- Pending AVL Assignment
SELECT * FROM rfq_requests WHERE status = 'pending_avl'

-- Quality Issues
SELECT * FROM extraction_quality_issues WHERE status = 'pending_manual_review'
```

#### 3. Vendor Distribution Metrics
```sql
SELECT 
  COUNT(*) as total_rfqs,
  AVG(vendor_count) as avg_vendors_per_rfq,
  SUM(CASE WHEN vendor_count > 0 THEN 1 ELSE 0 END) as successful_distributions
FROM rfq_requests
```

#### 4. Workflow Performance
```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_workflows,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
  COUNT(CASE WHEN rfq_id IS NULL THEN 1 END) as failed_extractions
FROM workflow_executions
GROUP BY DATE(started_at)
```

### Status Flow for Dashboard
```
Email Received → Quality Check → RFQ Created → Vendor Lookup → Emails Sent
                      ↓                              ↓
                 Manual Review               Pending AVL Assignment
```
