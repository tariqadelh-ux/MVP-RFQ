# MVP Dashboard Simple Guide

## What This System Does
The RFQ system automatically processes procurement request emails and sends them to qualified vendors.

## The Workflow "Dominos" (Process Steps - Phase 1)
Think of each RFQ as going through these steps like falling dominos:

```
📋 RFQ Created → 🔍 Vendors Found → 📤 Emails Sent → ⏳ Awaiting
```

**Your dashboard should show where each RFQ is in this process!**

*Note: This is the simplified business view. The system does more behind the scenes (AI extraction, quality checks, etc.) but users only see these 4 major milestones.*

---

## Test Scenarios Explained

### 🟢 Scenario A: Everything Works Perfectly
**What happens**: Email with PDF attachment → AI extracts all data → Finds 3 vendors → Sends 3 emails

**Database Impact**: *(See Appendix for exact table contents)*
- `rfq_requests`: 1 new RFQ (status: "awaiting_responses", vendor_count: 3)
- `vendors`: Creates/updates Vendor A, B, C
- `rfq_events`: 3 "email_sent" events
- `workflow_executions`: 1 success entry

### 🟡 Scenario B: No PDF (Email Text Only) 
**What happens**: Email without attachment → AI extracts from email body → Same outcome as A

**Database Impact**: *(See Appendix for exact table contents)*
- `rfq_requests`: 1 new RFQ (identical to Scenario A)
- `vendors`: Reuses A,B,C + Creates new D,E,F (total 6 vendors now)
- `rfq_events`: 3 "email_sent" events (but with vendor duplicates issue - known bug)
- `workflow_executions`: 1 success entry

**Note**: This proves the system works without PDFs!

### 🔴 Scenario C: No Vendors Found
**What happens**: Email processed → AI extracts → NO vendors in Google Sheets → Alerts sent

**Database Impact**: *(See Appendix for exact table contents)*
- `rfq_requests`: 1 new RFQ (status: "pending_avl", vendor_count: 0) ⚠️
- `vendors`: No new vendors
- `rfq_events`: 1 "avl_not_found" event
- `workflow_executions`: 1 success entry (workflow completed, just no vendors)

**Dashboard Alert**: Show these prominently - they need manual vendor assignment!

### ⚫ Scenario D: Poor Quality Data
**What happens**: Vague email → AI can't extract required fields → Stops early → Dev notified

**Database Impact**: *(See Appendix for exact table contents)*
- `rfq_requests`: NO entry (never created)
- `extraction_quality_issues`: 1 entry with details of what's missing
- `workflow_executions`: 1 entry (rfq_id is NULL)

**Dashboard Alert**: Show quality issues that need manual review!

---

## Simple Dashboard Layout

### 1. Main View - RFQ Pipeline (The Dominos Tracker)
Show each RFQ as a card moving through the 4 stages:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ RFQ CREATED │→ │VENDORS FOUND│→ │EMAILS SENT  │→ │  AWAITING   │
│      2      │  │      1      │  │      3      │  │      5      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

Visual indicators:
- ✅ Completed (green background)
- 🔵 Active/Current (blue pulsing)
- ⭕ Pending (gray)
- ⚠️ Error/Stuck (red - for pending_avl status)

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
-- Based on Phase 1 tracker from technical spec
SELECT 
  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as rfq_created,
  COUNT(CASE WHEN vendor_count > 0 THEN 1 END) as vendors_found,
  COUNT(CASE WHEN rfq_sent_at IS NOT NULL THEN 1 END) as emails_sent,
  COUNT(CASE WHEN status = 'awaiting_responses' THEN 1 END) as awaiting
FROM rfq_requests
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Get Individual RFQ Stage Status
```sql
-- Determine which domino/stage an RFQ is at
SELECT 
  rfq_id,
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
WHERE rfq_id = ?;
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

---

## APPENDIX: Actual Database Contents by Scenario

### 📊 Scenario A Database Tables

#### Table: rfq_requests
| rfq_id | project_name | status | vendor_count | commodity_code | quantity | response_deadline |
|--------|--------------|--------|--------------|----------------|----------|-------------------|
| RFQ-2024-11-001 | Project Eagle - Aramco Site 7 Expansion | awaiting_responses | 3 | 450-012547 | 1 | 2025-11-16 |

**Additional columns**: `nine_com_number`: "450-012547, 680-009132", `material_description`: "High-Pressure Shell & Tube Heat Exchanger; 6\" Pipe Fittings, Schedule 40", `wbs_code`: "PEA7PRC01"

#### Table: rfq_events (3 rows)
| rfq_id | event_type | vendor_name | vendor_email | event_timestamp |
|--------|------------|-------------|--------------|-----------------|
| RFQ-2024-11-001 | email_sent | Vendor A Industries | vendor.a.demo@gmail.com | 2025-11-09 11:57:41 |
| RFQ-2024-11-001 | email_sent | Vendor B Solutions | vendor.b.demo@gmail.com | 2025-11-09 11:57:41 |
| RFQ-2024-11-001 | email_sent | Vendor C Global | vendor.c.demo@gmail.com | 2025-11-09 11:57:41 |

#### Table: vendors (3 rows)
| vendor_id | vendor_name | vendor_email | is_active | last_contacted |
|-----------|-------------|--------------|-----------|----------------|
| 9V-1053 | Vendor A Industries | vendor.a.demo@gmail.com | true | 2025-11-09 11:57:39 |
| 9V-1054 | Vendor B Solutions | vendor.b.demo@gmail.com | true | 2025-11-09 11:57:39 |
| 9V-1055 | Vendor C Global | vendor.c.demo@gmail.com | true | 2025-11-09 11:57:39 |

#### Table: workflow_executions
| workflow_name | rfq_id | status | vendor_count | started_at |
|---------------|--------|--------|--------------|------------|
| RFQ Generation | RFQ-2024-11-001 | success | 3 | 2025-11-09 11:57:41 |

---

### 📊 Scenario B Database Tables

#### Table: rfq_requests
| rfq_id | project_name | status | vendor_count | commodity_code | quantity | response_deadline |
|--------|--------------|--------|--------------|----------------|----------|-------------------|
| RFQ-2024-11-002 | Project Eagle - Aramco Site 7 Expansion | awaiting_responses | 3 | 450-012547 | 2 | 2025-11-16 |

**Note**: Same as Scenario A but `quantity`: 2 and different `wbs_code`: "PEA7PRC02"

#### Table: rfq_events (6 new rows for Scenario B)
| rfq_id | event_type | vendor_name | vendor_email | event_timestamp |
|--------|------------|-------------|--------------|-----------------|
| RFQ-2024-11-002 | email_sent | Vendor A Industries | vendor.a.demo@gmail.com | ~19:07:56 |
| RFQ-2024-11-002 | email_sent | Vendor B Solutions | vendor.b.demo@gmail.com | ~19:07:56 |
| RFQ-2024-11-002 | email_sent | Vendor C Global | vendor.c.demo@gmail.com | ~19:07:56 |
| RFQ-2024-11-002 | email_sent | Vendor D Test Corp | vendor.d_test@yahoo.com | ~19:07:56 |
| RFQ-2024-11-002 | email_sent | Vendor E Supplies | vendor.e_test@outlook.com | ~19:07:56 |
| RFQ-2024-11-002 | email_sent | Vendor F Industries | vendor.f_test@outlook.com | ~19:07:56 |

#### Table: vendors (3 new rows added)
| vendor_id | vendor_name | vendor_email | is_active | last_contacted |
|-----------|-------------|--------------|-----------|----------------|
| 9V-XXXX | Vendor D Test Corp | vendor.d_test@yahoo.com | true | 2025-11-09 ~19:07 |
| 9V-XXXX | Vendor E Supplies | vendor.e_test@outlook.com | true | 2025-11-09 ~19:07 |
| 9V-XXXX | Vendor F Industries | vendor.f_test@outlook.com | true | 2025-11-09 ~19:07 |

**Plus**: Vendors A, B, C updated with new `last_contacted` timestamp

#### Table: workflow_executions (2 new rows - split execution)
| workflow_name | rfq_id | status | vendor_count | notes |
|---------------|--------|--------|--------------|-------|
| RFQ Generation | RFQ-2024-11-002 | success | 3 | First batch |
| RFQ Generation | RFQ-2024-11-002 | success | 3 | Second batch |

---

### 📊 Scenario C Database Tables

#### Table: rfq_requests
| rfq_id | project_name | status | vendor_count | commodity_code | quantity |
|--------|--------------|--------|--------------|----------------|----------|
| RFQ-2024-11-003 | Emergency Valve Replacement | **pending_avl** | **0** | 555-000001 | 5 |

**Key difference**: `status` = "pending_avl" and `vendor_count` = 0

#### Table: rfq_events (1 row)
| rfq_id | event_type | vendor_name | vendor_email | event_timestamp | title |
|--------|------------|-------------|--------------|-----------------|-------|
| RFQ-2024-11-003 | **avl_not_found** | NULL | NULL | ~timestamp | AVL Lookup Failed - Manual Assignment Required |

**Note**: No vendors found, so vendor fields are NULL

#### Table: vendors
**No new rows added** (no vendors found to create/update)

#### Table: workflow_executions
| workflow_name | rfq_id | status | vendor_count |
|---------------|--------|--------|--------------|
| RFQ Generation | RFQ-2024-11-003 | success | **0** |

---

### 📊 Scenario D Database Tables

#### Table: rfq_requests
**NO ROWS ADDED** - Quality check failed before RFQ creation

#### Table: extraction_quality_issues (1 row)
| rfq_id | quality_score | missing_fields | status | extraction_method |
|--------|---------------|----------------|--------|-------------------|
| NULL | 0 | ["nineComNumber", "projectName", "quantity"] | pending_manual_review | email_body |

**Key fields**: Shows what was missing that caused failure

#### Table: rfq_events
**NO ROWS ADDED** - Workflow stopped before any events

#### Table: vendors
**NO ROWS ADDED** - Workflow stopped before vendor lookup

#### Table: workflow_executions
| workflow_name | rfq_id | status | vendor_count |
|---------------|--------|--------|--------------|
| RFQ Generation | **NULL** | success | **NULL** |

**Note**: Workflow technically succeeded but no RFQ was created

---

### 🎯 Summary Table: What Gets Created Per Scenario

| Scenario | rfq_requests | rfq_events | vendors | workflow_executions | extraction_quality_issues |
|----------|--------------|------------|---------|---------------------|---------------------------|
| **A** | ✅ 1 row (status: awaiting) | ✅ 3 rows (email_sent) | ✅ 3 created | ✅ 1 row | ❌ None |
| **B** | ✅ 1 row (status: awaiting) | ✅ 6 rows (email_sent) | ✅ 3 new + 3 updated | ✅ 2 rows (split) | ❌ None |
| **C** | ✅ 1 row (status: pending_avl) | ✅ 1 row (avl_not_found) | ❌ None | ✅ 1 row | ❌ None |
| **D** | ❌ None | ❌ None | ❌ None | ✅ 1 row (rfq_id: NULL) | ✅ 1 row |
