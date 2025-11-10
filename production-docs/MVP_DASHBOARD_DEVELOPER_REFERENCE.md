# MVP Dashboard Developer Reference

## Quick Start
This document provides everything you need to build the MVP dashboard for the RFQ system.

## n8n Workflow Access
**Name**: RFQ Main Processor - Production v1  
**Location**: Your n8n instance > Workflows > "RFQ Main Processor - Production v1"  
**What it does**: Processes incoming RFQ emails, extracts data with AI, finds vendors, and sends RFQ emails

## Supabase Tables You'll Use

### 1. rfq_requests (Main RFQ Table)
```sql
-- Key columns:
rfq_id (text, primary key) -- Format: RFQ-YYYY-MM-XXX
project_name (text)
status (text) -- Values: 'initiated', 'awaiting_responses', 'pending_avl'
vendor_count (integer) -- Number of vendors contacted
created_at (timestamp)
response_deadline (date)
commodity_code (text) -- 9COM number like '450-012547'
material_description (text)
specifications (text)
```

### 2. rfq_events (Activity Log)
```sql
-- Key columns:
rfq_id (text, foreign key)
event_type (text) -- Values: 'email_sent', 'avl_not_found'
event_timestamp (timestamp)
vendor_name (text)
vendor_email (text)
title (text) -- Human readable event description
```

### 3. vendors (Vendor Directory)
```sql
-- Key columns:
vendor_email (text, unique)
vendor_name (text)
last_contacted (timestamp)
is_active (boolean)
```

### 4. workflow_executions (Processing History)
```sql
-- Key columns:
rfq_id (text)
status (text) -- 'success' or 'error'
started_at (timestamp)
vendor_count (integer)
error_message (text) -- If failed
```

### 5. extraction_quality_issues (Quality Problems)
```sql
-- Key columns:
rfq_id (text)
quality_score (integer) -- 0-100
missing_fields (text[]) -- Array of missing field names
status (text) -- 'pending_manual_review'
```

## MVP Dashboard Components

### 1. Main Dashboard View
```sql
-- RFQ Summary
SELECT 
  r.rfq_id,
  r.project_name,
  r.status,
  r.vendor_count,
  r.created_at,
  r.response_deadline,
  COUNT(e.id) as event_count
FROM rfq_requests r
LEFT JOIN rfq_events e ON r.rfq_id = e.rfq_id
GROUP BY r.rfq_id
ORDER BY r.created_at DESC
LIMIT 50;
```

**Display as**: Table with status badges, sortable columns

### 2. Alerts Section (Top Priority)
```sql
-- Needs Attention
SELECT 
  'Pending AVL' as alert_type,
  rfq_id,
  project_name,
  created_at
FROM rfq_requests 
WHERE status = 'pending_avl'

UNION ALL

SELECT 
  'Quality Issue' as alert_type,
  rfq_id,
  NULL as project_name,
  created_at
FROM extraction_quality_issues
WHERE status = 'pending_manual_review'
ORDER BY created_at DESC;
```

**Display as**: Alert cards with action buttons

### 3. Key Metrics
```sql
-- Today's Stats
WITH daily_stats AS (
  SELECT 
    COUNT(*) as total_rfqs,
    SUM(CASE WHEN vendor_count > 0 THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'pending_avl' THEN 1 ELSE 0 END) as pending_avl
  FROM rfq_requests
  WHERE DATE(created_at) = CURRENT_DATE
)
SELECT 
  total_rfqs,
  successful,
  pending_avl,
  CASE 
    WHEN total_rfqs > 0 
    THEN ROUND(successful::numeric / total_rfqs * 100, 1)
    ELSE 0 
  END as success_rate
FROM daily_stats;
```

**Display as**: Metric cards

### 4. RFQ Detail View (Drill-down)
```sql
-- Get RFQ with timeline
SELECT * FROM rfq_requests WHERE rfq_id = $1;

-- Event timeline
SELECT 
  event_timestamp,
  event_type,
  title,
  vendor_name,
  vendor_email
FROM rfq_events 
WHERE rfq_id = $1
ORDER BY event_timestamp DESC;

-- Quality issues if any
SELECT * FROM extraction_quality_issues WHERE rfq_id = $1;
```

**Display as**: Detail page with timeline

## Status Meanings

| Status | Description | Action Required |
|--------|-------------|-----------------|
| `initiated` | RFQ created, processing | None - automatic |
| `awaiting_responses` | Vendors notified | Monitor responses |
| `pending_avl` | No vendors found | Manual vendor assignment |

## Event Types

| Event | Description | Shows User |
|-------|-------------|------------|
| `email_sent` | RFQ sent to vendor | Vendor name, timestamp |
| `avl_not_found` | Vendor lookup failed | Alert to assign vendors |

## Test Data Reference

See `TEST_SCENARIOS_DATABASE_RESULTS.md` for actual JSON data from each scenario:
- **Scenario A**: Happy path - 3 vendors contacted
- **Scenario B**: No PDF - same outcome as A
- **Scenario C**: AVL not found - needs manual action
- **Scenario D**: Poor quality - blocked before RFQ creation

## MVP Features Priority

1. **Must Have**:
   - RFQ list with filters
   - Alert dashboard for pending items
   - Basic metrics (total, success rate)
   - Status indicators

2. **Nice to Have**:
   - RFQ timeline view
   - Vendor performance metrics
   - Export functionality

3. **Post-MVP**:
   - Vendor response tracking
   - Advanced analytics
   - Automated vendor assignment

## Quick SQL Snippets

```sql
-- Count by status
SELECT status, COUNT(*) 
FROM rfq_requests 
GROUP BY status;

-- Recent quality issues
SELECT * FROM extraction_quality_issues 
ORDER BY created_at DESC 
LIMIT 10;

-- Vendor activity
SELECT 
  vendor_name,
  COUNT(*) as rfq_count,
  MAX(last_contacted) as last_active
FROM vendors v
JOIN rfq_events e ON v.vendor_email = e.vendor_email
GROUP BY vendor_name
ORDER BY rfq_count DESC;
```

## Environment Setup

1. Connect to Supabase using provided credentials
2. Test queries in Supabase SQL editor first
3. Use RLS policies if implementing user authentication
4. Consider real-time subscriptions for live updates

## Support

- Workflow issues: Check n8n execution logs
- Data issues: Review `workflow_executions` table
- Missing vendors: Check `status = 'pending_avl'` in `rfq_requests`
