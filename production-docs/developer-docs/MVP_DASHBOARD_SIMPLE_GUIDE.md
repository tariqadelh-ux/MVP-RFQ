# MVP Dashboard Simple Guide

## What This System Does
The RFQ system automatically processes procurement request emails and sends them to qualified vendors.

## The Workflow "Dominos" (Process Steps)
Think of each RFQ as going through these steps like falling dominos:

```
📧 Email Received → 🤖 AI Extraction → ✅ Quality Check → 📋 Create RFQ → 
🔍 Find Vendors → 📤 Send Emails → ⏳ Await Responses
```

**Your dashboard should show where each RFQ is in this process!**

---

## Test Scenarios Explained

### 🟢 Scenario A: Everything Works Perfectly
**What happens**: Email with PDF attachment → AI extracts all data → Finds 3 vendors → Sends 3 emails

**Database Impact**:
- `rfq_requests`: 1 new RFQ (status: "awaiting_responses", vendor_count: 3)
- `vendors`: Creates/updates Vendor A, B, C
- `rfq_events`: 3 "email_sent" events
- `workflow_executions`: 1 success entry

### 🟡 Scenario B: No PDF (Email Text Only) 
**What happens**: Email without attachment → AI extracts from email body → Same outcome as A

**Database Impact**:
- `rfq_requests`: 1 new RFQ (identical to Scenario A)
- `vendors`: Reuses A,B,C + Creates new D,E,F (total 6 vendors now)
- `rfq_events`: 3 "email_sent" events (but with vendor duplicates issue - known bug)
- `workflow_executions`: 1 success entry

**Note**: This proves the system works without PDFs!

### 🔴 Scenario C: No Vendors Found
**What happens**: Email processed → AI extracts → NO vendors in Google Sheets → Alerts sent

**Database Impact**:
- `rfq_requests`: 1 new RFQ (status: "pending_avl", vendor_count: 0) ⚠️
- `vendors`: No new vendors
- `rfq_events`: 1 "avl_not_found" event
- `workflow_executions`: 1 success entry (workflow completed, just no vendors)

**Dashboard Alert**: Show these prominently - they need manual vendor assignment!

### ⚫ Scenario D: Poor Quality Data
**What happens**: Vague email → AI can't extract required fields → Stops early → Dev notified

**Database Impact**:
- `rfq_requests`: NO entry (never created)
- `extraction_quality_issues`: 1 entry with details of what's missing
- `workflow_executions`: 1 entry (rfq_id is NULL)

**Dashboard Alert**: Show quality issues that need manual review!

---

## Simple Dashboard Layout

### 1. Main View - RFQ Pipeline (The Dominos Tracker)
Show each RFQ as a card moving through stages:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  INITIATED  │→ │ PROCESSING  │→ │VENDORS FOUND│→ │EMAILS SENT  │
│      2      │  │      1      │  │      0      │  │      3      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### 2. Alerts Section (Top of Dashboard)
```
⚠️ NEEDS ATTENTION (2)

🔴 RFQ-2024-11-003: No vendors found - assign manually
🟡 Poor Quality: 1 RFQ failed extraction - review email
```

### 3. Key Metrics (Summary Cards)
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Total RFQs │ │ Success    │ │Need Action │ │Avg Vendors │
│     4      │ │    50%     │ │     2      │ │     3      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### 4. Recent Activity Feed
```
11:57 AM - ✅ RFQ-2024-11-001: Sent to 3 vendors
10:45 AM - ✅ RFQ-2024-11-002: Sent to 3 vendors  
09:30 AM - ⚠️ RFQ-2024-11-003: No vendors found
08:15 AM - ❌ Quality issue: Missing critical fields
```

---

## SQL Queries You Need

### Get All RFQs with Status
```sql
SELECT 
  rfq_id,
  project_name,
  status,
  vendor_count,
  created_at,
  CASE 
    WHEN status = 'pending_avl' THEN 'No Vendors - Need Assignment'
    WHEN status = 'awaiting_responses' THEN 'Emails Sent - Waiting'
    ELSE status
  END as status_display
FROM rfq_requests
ORDER BY created_at DESC;
```

### Get Alerts (Things Needing Action)
```sql
-- RFQs with no vendors
SELECT * FROM rfq_requests WHERE status = 'pending_avl'
UNION ALL
-- Quality issues
SELECT rfq_id, 'Quality Issue' as status, created_at, NULL as project_name, NULL as vendor_count 
FROM extraction_quality_issues WHERE status = 'pending_manual_review';
```

### Get Pipeline Counts (For Dominos View)
```sql
SELECT 
  COUNT(CASE WHEN status = 'initiated' THEN 1 END) as initiated,
  COUNT(CASE WHEN vendor_count = 0 THEN 1 END) as finding_vendors,
  COUNT(CASE WHEN vendor_count > 0 AND status = 'awaiting_responses' THEN 1 END) as emails_sent
FROM rfq_requests
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Get Activity Timeline
```sql
SELECT 
  event_timestamp,
  rfq_id,
  event_type,
  title,
  vendor_name
FROM rfq_events
ORDER BY event_timestamp DESC
LIMIT 20;
```

---

## What Makes Each Scenario Different

| Scenario | Input | Vendors | Final Status | Alert Needed? |
|----------|-------|---------|--------------|---------------|
| A | PDF + complete data | 3 found | awaiting_responses | No |
| B | Email text only | 3 found | awaiting_responses | No |
| C | Any input | 0 found | pending_avl | YES - Assign vendors |
| D | Vague/incomplete | N/A | Never created | YES - Fix & resubmit |

---

## Quick Implementation Checklist

1. **Main Dashboard**
   - [ ] RFQ list with status badges
   - [ ] Filter by status
   - [ ] Sort by date

2. **Dominos Pipeline View**
   - [ ] Visual progress tracker
   - [ ] Count at each stage
   - [ ] Click to see RFQs at that stage

3. **Alerts Section**
   - [ ] Red alerts for pending_avl
   - [ ] Yellow alerts for quality issues
   - [ ] Quick action buttons

4. **Metrics**
   - [ ] Total RFQs today/week
   - [ ] Success rate %
   - [ ] Average vendors per RFQ
   - [ ] Items needing attention

5. **Activity Feed**
   - [ ] Recent events from rfq_events
   - [ ] Color coded by type
   - [ ] Links to RFQ details

---

## Remember
- **Scenarios A & B are success cases** (80% of volume)
- **Scenarios C & D need manual intervention** (20% - show as alerts!)
- The workflow name in n8n is "RFQ Main Processor - Production v1"
- All test data is already in the database from our testing
