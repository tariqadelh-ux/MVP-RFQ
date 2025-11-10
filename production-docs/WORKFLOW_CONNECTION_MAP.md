# Workflow Connection Map - MVP 4-Workflow Architecture

## System Architecture Overview (Updated: October 30, 2025)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RFQ AUTOMATION SYSTEM - PRODUCTION                      │
│                                  Fully Automated 24/7                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   SUPABASE   │
                                    │   DATABASE   │
                                    └──────┬───────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
                │                          │                          │
    ┌───────────▼────────────┐   ┌────────▼────────────┐   ┌─────────▼────────────┐
    │ WORKFLOW 1:           │   │ WORKFLOW 2:         │   │ WORKFLOW 3:         │
    │ RFQ CREATION &        │   │ VENDOR RESPONSE     │   │ COMMERCIAL          │
    │ MANAGEMENT            │   │ PROCESSING          │   │ GATEKEEPER          │
    │                       │   │                     │   │                     │
    │ Trigger: Gmail (5min) │   │ Trigger: Gmail     │   │ Trigger: Schedule   │
    │ Monitors mgmt emails  │   │ (5min)              │   │ (hourly)            │
    └───────────┬───────────┘   └─────────┬───────────┘   └─────────┬───────────┘
                │                          │                          │
                │                          │                          │
                ▼                          ▼                          ▼
         Creates RFQs &             Processes vendor         Checks quorum &
         sends to vendors           quotations               triggers evaluation
                                           │                          │
                                           │                          │
                                           └──────────┬───────────────┘
                                                      │
                                                      ▼
                                          ┌───────────────────────────┐
                                          │ WORKFLOW 4:               │
                                          │ EVALUATION & DECISION     │
                                          │ HANDLER                   │
                                          │                           │
                                          │ Trigger: Dual Webhook     │
                                          │ - From Gatekeeper         │
                                          │ - From Dashboard          │
                                          └───────────────────────────┘
                                                      │
                                          ┌───────────┴───────────┐
                                          ▼                       ▼
                                   Commercial Scoring      Decision Processing
                                   & Email Report         (PO/Reject/Negotiate)
```

## Detailed Workflow Connections

### 1. RFQ Creation & Management Flow (Workflow 1)
```
Management Email with PDF
           │
           ▼
    RFQ CREATION & MANAGEMENT
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼          ▼
ChatGPT 4o   Supabase    Google      Google     Gmail API
(Extract)    (Store RFQ)  Sheets      Drive      (Send RFQs)
                          (AVL)       (Docs)
```

### 2. Vendor Response Processing Flow (Workflow 2)
```
Vendor Email with PDF Quote
           │
           ▼
    VENDOR RESPONSE PROCESSING
           │
    ┌──────┴──────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼
ChatGPT 4o   Supabase    Gmail API   PDF Extract
(Analyze)    (Store)     (Mark read)  (Get text)
    │
    ▼
Compliance Check → If non-compliant → Send TBC Email
```

### 3. Commercial Gatekeeper Flow (Workflow 3)
```
    COMMERCIAL GATEKEEPER (Runs every hour)
           │
           ▼
    Check Supabase
           │
    ┌──────┴──────┐
    ▼             ▼
< 3 vendors    >= 3 vendors
    │             OR
    │         2 vendors + 7 days
    │             │
    ▼             ▼
  Wait      Trigger Webhook
                  │
                  ▼
          WORKFLOW 4: Evaluation
```

### 4. Evaluation & Decision Handler Flow (Workflow 4)
```
    TWO TRIGGER SOURCES:
           │
    ┌──────┴──────┐
    ▼             ▼
Gatekeeper    Dashboard
Webhook       Webhook
    │             │
    ▼             ▼
EVALUATION    DECISION
    │             │
    ├─────┬───────┼──────┬──────┐
    ▼     ▼       ▼      ▼      ▼
Score   Email  APPROVE REJECT NEGOTIATE
Vendors Report    │      │      │
                  ▼      ▼      ▼
               Send PO  Regret  Request
                       letters  revision
```

## Webhook Endpoints

### Production Webhook URLs (4-Workflow Architecture)
```
Workflow 4 (Dual Purpose):
  - Evaluation:   https://your-n8n.com/webhook/evaluation-handler
  - Decisions:    https://your-n8n.com/webhook/decision-handler
```

### Internal Webhook Calls
```
Workflow 3 → Workflow 4: POST http://localhost:5678/webhook/evaluation-handler
Dashboard → Workflow 4:  POST https://your-n8n.com/webhook/decision-handler
```

## Data Flow Through Supabase

### Tables Updated by Each Workflow

#### Workflow 1: RFQ Creation & Management
- Creates → `rfq_requests`
- Creates/Updates → `vendors`
- Updates → `vendors` (last_contacted)
- Inserts → `rfq_events` (RFQ_INITIATED, RFQ_SENT, AVL_NOT_FOUND)
- Inserts → `workflow_executions`
- Inserts → `email_logs`

#### Workflow 2: Vendor Response Processing
- Inserts → `email_logs`
- Creates/Updates → `vendor_offers`
- Inserts → `rfq_events` (VENDOR_RESPONDED, TBC_SENT)
- Inserts → `workflow_executions`
- Updates → `rfq_requests` (responded_vendor_count)

#### Workflow 3: Commercial Gatekeeper
- Reads → `rfq_requests`, `vendor_offers`
- Inserts → `gatekeeper_logs`
- Inserts → `rfq_events` (EVALUATION_TRIGGERED, WAITING_VENDORS)
- Updates → `rfq_requests` (status)
- Inserts → `workflow_executions`

#### Workflow 4: Evaluation & Decision Handler
**Evaluation Mode:**
- Reads → `vendor_offers`
- Updates → `vendor_offers` (scores, ranks)
- Inserts → `rfq_events` (EVALUATION_COMPLETED)
- Updates → `rfq_requests` (status, selected_vendor_id)
- Inserts → `workflow_executions`

**Decision Mode:**
- Updates → `vendor_offers` (offer_status)
- Creates → `purchase_orders` 
- Inserts → `rfq_events` (APPROVE_PO, REJECT_ALL, REQUEST_NEGOTIATION)
- Updates → `rfq_requests` (po_number, final_price, status)
- Inserts → `workflow_executions`

## Event Types in System

### Automated Events (No Human Input)
- `RFQ_INITIATED` - Workflow 1 creates RFQ from email
- `RFQ_SENT` - Workflow 1 sends emails to vendors  
- `AVL_NOT_FOUND` - Workflow 1 can't find AVL document
- `VENDOR_RESPONDED` - Workflow 2 processes response
- `TBC_SENT` - Workflow 2 requests clarification
- `EVALUATION_TRIGGERED` - Workflow 3 triggers evaluation
- `WAITING_VENDORS` - Workflow 3 continues waiting
- `EVALUATION_COMPLETED` - Workflow 4 finishes scoring

### Manual Events (Dashboard Actions via Workflow 4)
- `APPROVE_PO` - Management approves winner
- `REJECT_ALL` - Cancel RFQ entirely
- `REQUEST_NEGOTIATION` - Ask vendor to improve offer

## Monitoring Points

### Health Check Queries
```sql
-- Workflows running?
SELECT workflow_name, COUNT(*), MAX(started_at) as last_run
FROM workflow_executions 
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY workflow_name;

-- Stuck RFQs?
SELECT rfq_id, status, created_at, 
       EXTRACT(DAY FROM NOW() - created_at) as days_old
FROM rfq_requests
WHERE status NOT IN ('completed', 'rejected', 'po_issued')
  AND created_at < NOW() - INTERVAL '14 days';

-- Email processing lag?
SELECT COUNT(*) as unprocessed
FROM email_logs
WHERE processed_at IS NULL
  AND received_at < NOW() - INTERVAL '1 hour';
```

## Failure Recovery

### If Email Processor Stops
- Emails remain unread in Gmail
- When restarted, picks up where left off
- No data loss

### If Gatekeeper Stops
- Evaluations delayed but not lost
- Next run catches all pending RFQs
- Maximum 1-hour delay

### If Evaluation Fails
- Gatekeeper will retry next hour
- Error logged to workflow_executions
- Can manually trigger via webhook

### If Webhook Handler Fails
- Dashboard shows error to user
- Can retry action
- All attempts logged

## Performance Optimization

### Batch Processing
- Email Processor: Handles multiple attachments in parallel
- Main Processor: Sends vendor emails in batch
- Evaluation: Updates all vendor scores together

### Caching Strategy
- Vendor data cached in Supabase
- AVL documents cached after first read
- Scoring model consistent across evaluations

### Rate Limiting
- OpenAI: Monitor token usage
- Gmail: 250 quota units per user per second
- Supabase: 1000 requests per minute

---

## 4-Workflow Architecture Benefits

This updated architecture (consolidated from 5 to 4 workflows) provides:
1. **Cleaner separation** - Each workflow has one primary trigger type
2. **Combined logic** - Evaluation and decisions handled together 
3. **Better maintainability** - Fewer workflows to manage
4. **Dual-trigger efficiency** - Workflow 4 handles both automated and manual triggers

This connection map shows how your fully automated RFQ system operates without any manual intervention!
