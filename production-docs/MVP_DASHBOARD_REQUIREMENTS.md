# MVP Dashboard Requirements

## Scope: Minimal Viable Dashboard (Q4 2025)

### Core Principle
Build incrementally, workflow by workflow. Each workflow completion unlocks new dashboard features.

## Dashboard Structure

### Two Tabs Only (MVP)
1. **Executive Overview** - High-level metrics and status
2. **Audit Trail** - Event history and tracking

### Removed from MVP
- ❌ RFQ Tracker tab (Kanban board)
- ❌ Vendor Rankings tab
- ❌ AI Recommendations panel
- ❌ Complex visualizations
- ❌ Demo mode
- ❌ Expandable/collapsible cards
- ❌ Real-time notifications
- ❌ User management

---

## Phase 1 - After Workflow 1 (Main Processor) - CURRENT

### Executive Overview Tab
**Single Row of Basic KPIs:**
```
Active RFQs: [Count]  |  Today's Sent: [Count]  |  Pending AVL: [Count]
```

**Recent Activity List (Simple Table):**
- RFQ ID | Project Name | Status | Created | Vendors Invited
- Limited to last 10 RFQs

### Audit Trail Tab
**Basic Event Log:**
- Timestamp | Event Type | RFQ ID | Description
- Simple date filter (Today/Week/Month)
- Pagination (20 per page)

### Data Sources (Phase 1)
```sql
-- Active RFQs
SELECT COUNT(*) FROM rfq_requests 
WHERE status IN ('initiated', 'awaiting_responses');

-- Today's Sent
SELECT COUNT(*) FROM rfq_requests 
WHERE DATE(rfq_sent_at) = CURRENT_DATE;

-- Pending AVL
SELECT COUNT(*) FROM rfq_requests 
WHERE status = 'pending_avl';

-- Recent RFQs
SELECT rfq_id, project_name, status, created_at, vendor_count
FROM rfq_requests
ORDER BY created_at DESC
LIMIT 10;

-- Audit Events
SELECT event_timestamp, event_type, rfq_id, description
FROM rfq_events
ORDER BY event_timestamp DESC;
```

---

## Phase 2 - After Workflow 2 (Vendor Response)

### Executive Overview Tab Additions
**Enhanced KPI Row:**
```
Active RFQs: [Count]  |  Response Rate: [X%]  |  Compliance Rate: [X%]  |  Pending TBC: [Count]
```

**Recent Activity List Enhancement:**
- Add "Responses" column showing X/Y vendors responded

### Audit Trail Tab Enhancement
- Add vendor email filter
- Show vendor response events

### New Data Sources (Phase 2)
```sql
-- Response Rate
SELECT 
  AVG(CASE WHEN responded_vendor_count > 0 
      THEN responded_vendor_count::float / vendor_count 
      ELSE 0 END) * 100 as response_rate
FROM rfq_requests;

-- Compliance Rate
SELECT 
  AVG(CASE WHEN responded_vendor_count > 0 
      THEN compliant_vendor_count::float / responded_vendor_count 
      ELSE 0 END) * 100 as compliance_rate
FROM rfq_requests;

-- Pending TBC
SELECT COUNT(DISTINCT rfq_id) FROM vendor_offers 
WHERE compliance_status = 'tbc_required';
```

---

## Phase 3 - After Workflow 3 (Commercial Gatekeeper)

### Executive Overview Tab Additions
**Process Efficiency Section:**
```
Average Cycle Time: [X hours]  |  Ready for Evaluation: [Count]
```

**Status Distribution (Simple Bar):**
- Awaiting Responses: X
- Under Evaluation: Y
- Decision Pending: Z

### Audit Trail Tab Enhancement
- Add status change tracking
- Show gatekeeper trigger events

### New Data Sources (Phase 3)
```sql
-- Average Cycle Time
SELECT AVG(EXTRACT(EPOCH FROM (evaluation_started_at - initiated_at))/3600) as avg_hours
FROM rfq_requests
WHERE evaluation_started_at IS NOT NULL;

-- Ready for Evaluation
SELECT COUNT(*) FROM rfq_requests 
WHERE status = 'under_evaluation';
```

---

## Phase 4 - After Workflow 4 (Evaluation & Decision)

### Executive Overview Tab - Final MVP State
**Complete KPI Dashboard:**
```
Row 1: Active RFQs | Completed This Month | Response Rate | Compliance Rate
Row 2: Avg Cycle Time | Monthly Savings | Pending Decisions | Critical Alerts
```

**Enhanced Activity List:**
- Add Final Price column
- Show savings per RFQ
- Highlight completed vs rejected

**Monthly Summary Box:**
- Total RFQs Processed
- Total Savings Achieved
- Average Processing Time

### Audit Trail Tab - Final MVP State
- Full event history with all workflow events
- Advanced filters (date, status, vendor, event type)
- Export to CSV capability

### New Data Sources (Phase 4)
```sql
-- Monthly Savings (40 hours saved per PO * $100/hour assumption)
SELECT COUNT(*) * 40 * 100 as monthly_savings
FROM rfq_requests
WHERE status = 'po_issued' 
AND DATE_PART('month', decision_made_at) = DATE_PART('month', CURRENT_DATE);

-- Critical Alerts
SELECT COUNT(*) FROM vendor_offers
WHERE compliance_status = 'non_compliant'
AND created_at > NOW() - INTERVAL '7 days';
```

---

## Technical Requirements

### Frontend (All Phases)
- Next.js 14 with App Router
- Tailwind CSS for styling
- Supabase JS Client for data
- No complex state management (MVP)
- Static refresh (no real-time in MVP)

### Data Refresh
- Manual refresh button
- Auto-refresh every 60 seconds
- No WebSocket/real-time subscriptions (MVP)

### Responsive Design
- Desktop first
- Basic mobile view (table scrolling)
- No mobile-specific features (MVP)

## Success Metrics for MVP
1. Load time < 2 seconds
2. All queries optimized with indexes
3. Clear visual hierarchy
4. Zero external dependencies beyond Supabase
5. Works on Chrome, Firefox, Safari

## Post-MVP Roadmap (Reference Only)
- Real-time updates
- Vendor rankings
- AI insights
- Advanced analytics
- Mobile app
- API access
- Multi-tenant support
