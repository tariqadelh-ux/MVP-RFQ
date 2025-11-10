# MVP Development Phases - Workflow-by-Workflow

## Overview
Each workflow completion triggers specific dashboard development. This document outlines what to build after each workflow is tested and working.

---

## Current State (October 31, 2025)
- ✅ Workflow 1 (Main Processor) - Built and ready for testing
- ✅ Database schema - Complete with all tables
- ⏳ Dashboard - Not started
- 🔲 Workflows 2-4 - Not built

---

## Phase 1: After Main Processor Testing *(Current Phase)*

### Immediate Actions
1. **Test Workflow 1** with real email
2. Verify all Supabase writes are working
3. Check `rfq_requests`, `vendors`, `rfq_events` tables have data

### Dashboard Development (Week 1)
**Day 1-2: Setup**
```bash
# Create Next.js project
npx create-next-app@latest rfq-dashboard --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js
npm install @tanstack/react-query  # For data fetching
npm install date-fns  # For date formatting
```

**Day 3-4: Basic Structure**
```
/app
  /layout.tsx         # Main layout with tabs
  /page.tsx          # Redirect to /overview
  /overview/page.tsx  # Executive Overview
  /audit/page.tsx    # Audit Trail
  /api/             # API routes if needed
/components
  /KPICard.tsx      # Reusable KPI component
  /DataTable.tsx    # Basic table component
/lib
  /supabase.ts      # Supabase client setup
  /queries.ts       # All SQL queries
```

**Day 5: Implement Features**

*Executive Overview:*
```typescript
// Three KPI cards showing:
const kpis = [
  {
    title: "Active RFQs",
    query: "SELECT COUNT(*) FROM rfq_requests WHERE status IN ('initiated', 'awaiting_responses')"
  },
  {
    title: "Sent Today",
    query: "SELECT COUNT(*) FROM rfq_requests WHERE DATE(rfq_sent_at) = CURRENT_DATE"
  },
  {
    title: "Pending AVL",
    query: "SELECT COUNT(*) FROM rfq_requests WHERE status = 'pending_avl'"
  }
];

// Recent RFQs table
const recentRFQs = await supabase
  .from('rfq_requests')
  .select('rfq_id, project_name, status, created_at, vendor_count')
  .order('created_at', { ascending: false })
  .limit(10);
```

*Audit Trail:*
```typescript
// Simple paginated table
const events = await supabase
  .from('rfq_events')
  .select('event_timestamp, event_type, rfq_id, description')
  .order('event_timestamp', { ascending: false })
  .range(0, 19);  // 20 per page
```

### Expected Outcome
- Dashboard shows real data from Workflow 1
- Can track RFQ creation and sending
- Basic audit trail of all events

---

## Phase 2: After Vendor Response Workflow

### Prerequisites
- Build Workflow 2 with AI builder
- Test with vendor response emails
- Verify `vendor_offers` table is populated

### Dashboard Enhancements (3 days)

**New KPIs:**
```typescript
// Add to overview
const responseRate = await supabase.rpc('calculate_response_rate');
const complianceRate = await supabase.rpc('calculate_compliance_rate');
const pendingTBC = await supabase
  .from('vendor_offers')
  .select('count')
  .eq('compliance_status', 'tbc_required');
```

**Enhanced RFQ Table:**
```typescript
// Add response tracking
const rfqsWithResponses = await supabase
  .from('rfq_requests')
  .select(`
    *,
    vendor_offers(count)
  `)
  .order('created_at', { ascending: false });
```

**Create Database Functions:**
```sql
-- Add these via Supabase SQL editor
CREATE OR REPLACE FUNCTION calculate_response_rate()
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT AVG(
      CASE 
        WHEN vendor_count > 0 
        THEN responded_vendor_count::numeric / vendor_count 
        ELSE 0 
      END
    ) * 100
    FROM rfq_requests
    WHERE vendor_count > 0
  );
END;
$$ LANGUAGE plpgsql;
```

### Expected Outcome
- Dashboard shows vendor response metrics
- Can track which RFQs have responses
- Compliance tracking visible

---

## Phase 3: After Commercial Gatekeeper

### Prerequisites
- Build Workflow 3 (scheduled)
- Run several cycles to populate `gatekeeper_logs`
- Verify status transitions are working

### Dashboard Enhancements (2 days)

**Process Metrics Section:**
```typescript
// Add cycle time calculation
const cycleTime = await supabase
  .from('rfq_requests')
  .select('initiated_at, evaluation_started_at')
  .not('evaluation_started_at', 'is', null)
  .then(data => {
    // Calculate average hours
    const times = data.data.map(r => 
      (new Date(r.evaluation_started_at) - new Date(r.initiated_at)) / 3600000
    );
    return times.reduce((a, b) => a + b, 0) / times.length;
  });
```

**Status Distribution Chart:**
```typescript
// Simple status counts
const statusCounts = await supabase
  .from('rfq_requests')
  .select('status')
  .then(data => {
    const counts = {};
    data.data.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  });
```

### Expected Outcome
- Process efficiency metrics visible
- Can see RFQ pipeline status
- Gatekeeper effectiveness tracked

---

## Phase 4: After Evaluation & Decision Workflow

### Prerequisites
- Build Workflow 4
- Complete several RFQ cycles end-to-end
- Have POs created in system

### Dashboard Completion (3 days)

**Financial Metrics:**
```typescript
// Monthly savings calculation
const monthlySavings = await supabase
  .from('rfq_requests')
  .select('count')
  .eq('status', 'po_issued')
  .gte('decision_made_at', startOfMonth)
  .then(data => data.count * 40 * 100); // 40 hours * $100/hr

// Add final price tracking
const completedRFQs = await supabase
  .from('rfq_requests')
  .select(`
    rfq_id,
    project_name,
    estimated_value,
    final_price,
    cost_savings,
    selected_vendor_id,
    vendors!selected_vendor_id(vendor_name)
  `)
  .eq('status', 'po_issued')
  .order('decision_made_at', { ascending: false });
```

**Enhanced Audit Trail:**
```typescript
// Add filters
const [dateFilter, setDateFilter] = useState('week');
const [statusFilter, setStatusFilter] = useState('all');
const [eventTypeFilter, setEventTypeFilter] = useState('all');

const filteredEvents = await supabase
  .from('rfq_events')
  .select('*')
  .gte('event_timestamp', getFilterDate(dateFilter))
  .eq(statusFilter !== 'all' ? 'new_status' : '', statusFilter)
  .eq(eventTypeFilter !== 'all' ? 'event_type' : '', eventTypeFilter);
```

**Add CSV Export:**
```typescript
const exportToCSV = (data) => {
  const csv = [
    ['RFQ ID', 'Project', 'Status', 'Vendor Count', 'Final Price'],
    ...data.map(row => [
      row.rfq_id,
      row.project_name,
      row.status,
      row.vendor_count,
      row.final_price || 'N/A'
    ])
  ].map(row => row.join(',')).join('\n');
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rfq-export.csv';
  a.click();
};
```

### Expected Outcome
- Complete MVP dashboard
- Full RFQ lifecycle visibility
- Basic reporting capabilities
- Export functionality

---

## Testing Strategy Per Phase

### Phase 1 Testing
```bash
# Send test management email
# Check Workflow 1 execution
# Verify dashboard shows:
- [ ] Active RFQ count increases
- [ ] New RFQ appears in recent list
- [ ] Events logged in audit trail
```

### Phase 2 Testing
```bash
# Send vendor response emails
# Check Workflow 2 execution
# Verify dashboard shows:
- [ ] Response rate updates
- [ ] Compliance metrics appear
- [ ] Vendor events in audit
```

### Phase 3 Testing
```bash
# Wait for scheduled trigger
# Or manually trigger gatekeeper
# Verify dashboard shows:
- [ ] Status transitions
- [ ] Cycle time metrics
- [ ] Gatekeeper events
```

### Phase 4 Testing
```bash
# Complete full RFQ cycle
# Approve PO in system
# Verify dashboard shows:
- [ ] Monthly savings
- [ ] Completed RFQs
- [ ] Full audit trail
```

---

## Development Tips

### 1. Start Simple
- No animations initially
- Basic Tailwind styling
- Focus on data accuracy

### 2. Use React Query
```typescript
// Example query hook
const useActiveRFQs = () => {
  return useQuery({
    queryKey: ['activeRFQs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_requests')
        .select('count')
        .in('status', ['initiated', 'awaiting_responses']);
      
      if (error) throw error;
      return data[0].count;
    },
    refetchInterval: 60000 // Refresh every minute
  });
};
```

### 3. Error Handling
```typescript
// Consistent error display
const ErrorMessage = ({ error }) => (
  <div className="bg-red-50 p-4 rounded">
    <p className="text-red-800">Error loading data: {error.message}</p>
  </div>
);
```

### 4. Loading States
```typescript
// Skeleton loaders for better UX
const KPISkeleton = () => (
  <div className="animate-pulse">
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
);
```

---

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel Deployment
```bash
# After each phase
git add .
git commit -m "Phase X dashboard complete"
vercel --prod
```

### Performance Optimization
- Add indexes for common queries
- Use Supabase views for complex queries
- Implement proper caching

---

## Success Criteria

### MVP Complete When:
1. ✅ All 4 workflows tested and working
2. ✅ Dashboard shows real-time data
3. ✅ Executive can see key metrics
4. ✅ Full audit trail available
5. ✅ Basic export functionality
6. ✅ Mobile responsive
7. ✅ < 2 second load times

### NOT Required for MVP:
- ❌ User authentication
- ❌ Real-time updates
- ❌ Complex visualizations
- ❌ Vendor portal
- ❌ Email notifications
- ❌ Advanced analytics
