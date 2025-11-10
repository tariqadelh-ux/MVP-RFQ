# Workflow Orchestration Design - Fully Automated RFQ System

## Overview
This document describes how all n8n workflows are interconnected to create a fully automated RFQ processing system that runs 24/7 without manual intervention.

## Workflow Interaction Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTOMATIC WORKFLOW ORCHESTRATION                   │
└─────────────────────────────────────────────────────────────────────────┘

1. INITIATION (Two Entry Points)
   │
   ├─→ A. Main Processor (RFQ Creation)
   │   - Trigger: Webhook from external system OR Schedule
   │   - Creates RFQ in Supabase
   │   - Sends emails to vendors
   │   - Logs: RFQ_INITIATED event
   │
   └─→ B. Email Processor (Vendor Responses) 
       - Trigger: Gmail IMAP (polls every 5 mins)
       - Extracts vendor data with ChatGPT 5
       - Stores offers in Supabase
       - Logs: VENDOR_RESPONDED event

2. MONITORING & DECISION
   │
   ├─→ Commercial Gatekeeper
   │   - Trigger: Schedule (every hour)
   │   - Queries Supabase for approved vendors
   │   - Auto-triggers evaluation when:
   │     • 3+ vendors responded (quorum)
   │     • 7 days passed with 2+ vendors
   │   - Logs: EVALUATION_TRIGGERED event
   │
   └─→ Commercial Evaluation
       - Trigger: Webhook from Gatekeeper
       - Pulls all offers from Supabase
       - AI generates recommendation
       - Logs: DECISION_READY event
       - Notifies management

3. FINAL ACTIONS
   │
   └─→ Webhook Handler
       - Trigger: Dashboard actions
       - Processes: APPROVE_PO / REJECT_ALL / NEGOTIATE
       - Updates Supabase statuses
       - Sends final emails
       - Logs: PO_ISSUED / RFQ_REJECTED / NEGOTIATION_STARTED
```

## Automatic Triggers Configuration

### 1. Email Processor - Continuous Monitoring
```json
{
  "trigger": "Gmail IMAP Email",
  "config": {
    "pollInterval": 5,  // minutes
    "mailbox": "INBOX",
    "filter": "is:unread subject:RFQ OR subject:Quotation",
    "action": "markAsRead"
  }
}
```

### 2. Commercial Gatekeeper - Hourly Check
```json
{
  "trigger": "Schedule",
  "config": {
    "rule": "0 * * * *",  // Every hour
    "timezone": "Asia/Riyadh"
  }
}
```

### 3. Main Processor - Multiple Triggers
```json
{
  "triggers": [
    {
      "type": "Webhook",
      "path": "/api/create-rfq",
      "method": "POST"
    },
    {
      "type": "Supabase Realtime",
      "table": "rfq_requests",
      "event": "INSERT",
      "filter": "status=eq.draft"
    }
  ]
}
```

## Supabase Event-Driven Architecture

### Database Triggers (PostgreSQL Functions)

```sql
-- 1. Auto-trigger gatekeeper check when vendor approved
CREATE OR REPLACE FUNCTION notify_vendor_approved()
RETURNS trigger AS $$
BEGIN
  IF NEW.compliance_status = 'compliant' 
     AND OLD.compliance_status != 'compliant' THEN
    PERFORM pg_notify(
      'vendor_approved',
      json_build_object(
        'rfq_id', NEW.rfq_id,
        'vendor_id', NEW.vendor_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_approved_trigger
AFTER UPDATE ON vendor_offers
FOR EACH ROW EXECUTE FUNCTION notify_vendor_approved();

-- 2. Auto-trigger evaluation when quorum reached
CREATE OR REPLACE FUNCTION check_evaluation_criteria()
RETURNS trigger AS $$
DECLARE
  approved_count INTEGER;
  first_approval_date TIMESTAMP;
  days_elapsed INTEGER;
BEGIN
  -- Count approved vendors
  SELECT COUNT(*), MIN(updated_at)
  INTO approved_count, first_approval_date
  FROM vendor_offers
  WHERE rfq_id = NEW.rfq_id
    AND compliance_status = 'compliant';
  
  -- Calculate days since first approval
  days_elapsed := EXTRACT(DAY FROM NOW() - first_approval_date);
  
  -- Check if evaluation should trigger
  IF approved_count >= 3 OR 
     (approved_count >= 2 AND days_elapsed >= 7) THEN
    
    -- Call n8n webhook to trigger evaluation
    PERFORM net.http_post(
      url := 'https://n8n.yourdomain.com/webhook/trigger-evaluation',
      body := json_build_object(
        'rfq_id', NEW.rfq_id,
        'vendor_count', approved_count,
        'trigger_reason', CASE 
          WHEN approved_count >= 3 THEN 'quorum_reached'
          ELSE 'timeout_with_minimum'
        END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Workflow Communication Methods

### 1. Direct Webhook Calls
```javascript
// From Commercial Gatekeeper to Commercial Evaluation
const response = await $http.request({
  method: 'POST',
  url: 'http://localhost:5678/webhook/commercial-evaluation',
  body: {
    rfq_id: rfqId,
    vendor_ids: approvedVendorIds,
    trigger_reason: 'quorum_reached'
  }
});
```

### 2. Supabase as Message Queue
```javascript
// Write event
await supabase.from('workflow_queue').insert({
  workflow_name: 'commercial_evaluation',
  payload: { rfq_id: '450-012547', vendors: [...] },
  status: 'pending'
});

// Read and process (in target workflow)
const { data: tasks } = await supabase
  .from('workflow_queue')
  .select('*')
  .eq('workflow_name', 'commercial_evaluation')
  .eq('status', 'pending')
  .limit(10);
```

### 3. Event Broadcasting via Supabase Realtime
```javascript
// Publisher workflow
await supabase.from('rfq_events').insert({
  event_type: 'VENDOR_APPROVED',
  rfq_id: rfqId,
  details: { vendor: vendorName }
});

// Subscriber workflow
const channel = supabase
  .channel('rfq-events')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'rfq_events' },
    (payload) => {
      if (payload.new.event_type === 'VENDOR_APPROVED') {
        // Trigger next action
      }
    }
  )
  .subscribe();
```

## Workflow Dependencies & Sequence

```yaml
Main Processor:
  creates: RFQ in Supabase
  triggers: Email notifications to vendors
  waits_for: Nothing (initiator)

Email Processor:
  depends_on: RFQ exists in Supabase
  monitors: Gmail continuously
  triggers: Nothing directly (writes to Supabase)
  
Commercial Gatekeeper:
  depends_on: Vendor offers in Supabase
  monitors: Supabase every hour
  triggers: Commercial Evaluation (via webhook)

Commercial Evaluation:
  depends_on: Webhook from Gatekeeper
  reads: All vendor offers from Supabase
  triggers: Management notification
  
Webhook Handler:
  depends_on: External dashboard actions
  updates: Supabase records
  triggers: Final vendor notifications
```

## Error Recovery & Resilience

### 1. Workflow Retry Configuration
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 60000,  // 1 minute
  "continueOnFail": false
}
```

### 2. Dead Letter Queue
```sql
-- Table for failed operations
CREATE TABLE workflow_dlq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  error_message TEXT,
  payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Periodic retry job
CREATE OR REPLACE FUNCTION retry_failed_workflows()
RETURNS void AS $$
DECLARE
  failed_task RECORD;
BEGIN
  FOR failed_task IN 
    SELECT * FROM workflow_dlq 
    WHERE retry_count < 5 
    AND created_at > NOW() - INTERVAL '24 hours'
  LOOP
    -- Retry logic here
    PERFORM net.http_post(
      url := 'https://n8n.yourdomain.com/webhook/' || failed_task.workflow_name,
      body := failed_task.payload
    );
    
    UPDATE workflow_dlq 
    SET retry_count = retry_count + 1 
    WHERE id = failed_task.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring & Observability

### 1. Workflow Health Checks
```javascript
// Health check endpoint in each workflow
if ($request.path === '/health') {
  return {
    status: 'healthy',
    workflow: $workflow.name,
    lastExecution: $workflow.lastExecutionTime,
    activeExecutions: $workflow.activeExecutions
  };
}
```

### 2. Centralized Monitoring Dashboard Queries
```sql
-- Workflow execution status
SELECT 
  workflow_name,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as failed,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration_seconds
FROM workflow_executions
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY workflow_name;

-- RFQ pipeline status
SELECT 
  r.rfq_id,
  r.status,
  r.created_at,
  COUNT(DISTINCT vo.vendor_id) as responses_received,
  COUNT(DISTINCT CASE WHEN vo.compliance_status = 'compliant' THEN vo.vendor_id END) as approved_vendors
FROM rfq_requests r
LEFT JOIN vendor_offers vo ON r.rfq_id = vo.rfq_id
GROUP BY r.rfq_id, r.status, r.created_at
ORDER BY r.created_at DESC;
```

## Implementation Priority

1. **Phase 1 - Core Automation**
   - Email Processor with Gmail trigger ✅
   - Supabase integration for all workflows
   - Basic webhook connections

2. **Phase 2 - Intelligence Layer**
   - Commercial Gatekeeper with smart triggers
   - AI-powered evaluation
   - Event broadcasting

3. **Phase 3 - Advanced Features**
   - Database triggers for real-time reactions
   - Dead letter queue for reliability
   - Monitoring dashboard

## Testing the Orchestration

### Integration Test Scenarios

1. **Happy Path Test**
   ```
   1. Trigger Main Processor → RFQ created
   2. Send 3 vendor emails → Email Processor captures
   3. Wait 1 hour → Gatekeeper triggers evaluation
   4. Check decision email → Verify recommendation
   5. Approve PO → Verify vendor notification
   ```

2. **Timeout Test**
   ```
   1. Create RFQ
   2. Send only 2 vendor responses
   3. Wait 7 days (simulated)
   4. Verify Gatekeeper triggers evaluation
   ```

3. **Error Recovery Test**
   ```
   1. Disconnect Supabase temporarily
   2. Send vendor email
   3. Verify retry attempts
   4. Reconnect and verify processing
   ```

## Environment Variables Required

```env
# n8n Configuration
N8N_WEBHOOK_BASE_URL=https://n8n.yourdomain.com

# Workflow Webhooks
WEBHOOK_COMMERCIAL_EVAL=/webhook/commercial-evaluation
WEBHOOK_DASHBOARD=/webhook/dashboard-status
WEBHOOK_ERROR_HANDLER=/webhook/error-notification

# Polling Intervals
EMAIL_POLL_MINUTES=5
GATEKEEPER_CHECK_HOURS=1

# Timeouts
VENDOR_RESPONSE_DAYS=7
MIN_VENDORS_REQUIRED=2
QUORUM_VENDORS=3
```

This orchestration design ensures your RFQ system runs completely automatically, with workflows triggering each other based on events and schedules, no manual intervention required!
