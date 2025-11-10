# WORKFLOW 1 PRODUCTION READY CHECKLIST

## Workflow: Main Processor AI B
## Production Readiness Date: November 1, 2025
## Status: ⚠️ NEEDS CRITICAL FIXES

---

## Tables Written by This Workflow

### Primary Tables (Direct Writes):

| Table | Operation | When | Fields Written |
|-------|-----------|------|----------------|
| **rfq_requests** | INSERT | After extraction | rfq_id, nine_com_number, project_name, project_id, material_description, specifications, quantity, unit, delivery_location, delivery_timeline, submission_deadline, status, original_email_id, created_at |
| **rfq_requests** | UPDATE | After vendor loop | status='awaiting_responses', vendor_count |
| **rfq_requests** | UPDATE | AVL not found | status='pending_avl' |
| **vendors** | UPSERT | Per vendor in loop | vendor_email, vendor_name, contact_person, phone_number, last_contacted |
| **rfq_events** | INSERT | Per vendor email | rfq_id, event_type='rfq_sent', vendor_email, vendor_name, event_timestamp |
| **rfq_events** | INSERT | AVL not found | rfq_id, event_type='avl_not_found', nine_com_number, project_name, event_timestamp |
| **workflow_executions** | INSERT | Workflow complete | workflow_name, status, rfq_id, vendor_count, completed_at |
| **extraction_quality_issues** | INSERT | Poor extraction | email_id, extraction_method, quality_score, missing_fields, status |

---

## Complete Data Flow

### 📧 Stage 1: Email Ingestion
```
Monitor Procurement Emails (Gmail Trigger)
  ↓ [Email + Attachments]
Workflow Configuration (Add Settings)
  ↓ [Email + Config]
Check If Already Processed
  ↓ [If not processed]
Extract Email Content and Attachments
```

### 🤖 Stage 2: AI Extraction
```
Route 1 (PDF):                    Route 2 (No PDF):
Extract Text from PDF        →     Extract from Email Body
  ↓                                   ↓
Extract Procurement Details     Extract from Email (Fallback)
  ↓                                   ↓
OpenAI GPT-4                     OpenAI GPT-4 for Email
  ↓                                   ↓
Structured Parser                Structured Parser
  ↓                                   ↓
        Merge Extraction Results ←────┘
              ↓
        Assess Extraction Quality
```

### 💾 Stage 3: Database & AVL
```
Generate RFQ ID (RFQ-YYYY-MM-DD-XXXX)
  ↓
Insert RFQ Request → [rfq_requests]
  ↓
Lookup AVL in Google Sheets
  ↓
AVL Found? ──No──→ Update Status to pending_avl
  ↓ Yes              Log AVL Not Found Event
Download AVL         Notify Dev Team
  ↓                  Wait 1 Hour (Retry)
Extract Vendor List
  ↓
Extract Vendor Details with AI
```

### 📨 Stage 4: Vendor Processing Loop
```
Prepare Vendor Loop Data (Split to items)
  ↓ [For each vendor]
Upsert Vendor Record → [vendors]
  ↓
Send RFQ Email to Vendor
  ↓
Log Email Sent Event → [rfq_events]
  ↓ [After all vendors]
Aggregate Vendor Count
  ↓
Update RFQ Status to Awaiting Responses → [rfq_requests]
```

### ✅ Stage 5: Completion
```
Mark Email as Processed (Add Label)
  ↓
Log Workflow Execution → [workflow_executions]
```

---

## Test Checklist with Expected Data

### ✅ Pre-Production Test Cases

#### Test 1: Complete Happy Path
- [ ] Send email with valid PDF attachment
- [ ] Verify RFQ ID generated (format: RFQ-2025-11-01-XXXX)
- [ ] Check rfq_requests inserted with all fields
- [ ] Confirm AVL lookup successful
- [ ] Verify vendors table updated
- [ ] Check all vendor emails sent
- [ ] Verify status = 'awaiting_responses'
- [ ] Confirm workflow_executions logged

#### Test 2: No Attachment Fallback
- [ ] Send email without attachment
- [ ] Verify email body extraction triggered
- [ ] Check quality score calculated
- [ ] Confirm workflow continues normally

#### Test 3: AVL Not Found
- [ ] Use unknown 9COM number
- [ ] Verify status = 'pending_avl'
- [ ] Check retry mechanism activates
- [ ] Confirm dev team notified

#### Test 4: Single Vendor
- [ ] AVL with one vendor only
- [ ] Verify vendor_count = 1
- [ ] Check single email sent

#### Test 5: Data Validation
- [ ] Test with missing optional fields
- [ ] Test with special characters
- [ ] Test with long text fields
- [ ] Verify no database errors

---

## MVP Dashboard Phase 1 Requirements

### Required Data Points Available: ✅

| Dashboard Component | Data Source | Status |
|-------------------|------------|---------|
| **Active RFQs Count** | rfq_requests WHERE status IN ('draft', 'awaiting_responses') | ✅ Available |
| **Today's Sent** | rfq_events WHERE event_type='rfq_sent' AND date=today | ✅ Available |
| **Pending AVL** | rfq_requests WHERE status='pending_avl' | ✅ Available |
| **Recent RFQs List** | rfq_requests ORDER BY created_at DESC | ✅ Available |
| **Vendor Send Count** | COUNT from rfq_events GROUP BY vendor_email | ✅ Available |
| **Success Rate** | workflow_executions status counts | ✅ Available |
| **Audit Trail** | rfq_events WHERE rfq_id=? | ✅ Available |

---

## Critical Modifications Needed

### 🔴 MUST FIX (Blockers):

1. **Add Error Handling**
```javascript
// Add to all Supabase nodes
"onError": {
  "retry": true,
  "maxRetries": 3,
  "retryDelay": 1000
}
```

2. **Add Data Validation**
```javascript
// Add to Generate RFQ ID node
if (!nineComNumber || nineComNumber.length < 3) {
  throw new Error('Invalid 9COM number');
}
if (quantity && quantity <= 0) {
  throw new Error('Invalid quantity');
}
```

3. **Fix Field Length Issues**
```javascript
// Add to Prepare Vendor Loop Data
projectName: (procurementOutput.projectName || '').substring(0, 255)
```

4. **Add Maximum Retry Logic**
```javascript
// Add to Track Retry Count nodes
if (retryCount >= 3) {
  // Update status to 'failed'
  // Send escalation email
  return [];
}
```

### 🟡 SHOULD FIX (Important):

1. **Batch Vendor Emails**
   - Use SplitInBatches node
   - Process 10 vendors in parallel

2. **Add Connection Pooling**
   - Configure Supabase connection limits
   - Add request throttling

3. **Implement Caching**
   - Cache AVL lookups
   - Store vendor details for reuse

### 🟢 NICE TO HAVE (Post-MVP):

1. **Add Metrics Collection**
   - Processing time per stage
   - AI token usage
   - Email delivery rates

2. **Implement Dead Letter Queue**
   - Failed extraction queue
   - Manual review interface

3. **Add Advanced Monitoring**
   - Prometheus metrics
   - Grafana dashboards

---

## Environment Variables Required

```env
# Gmail Configuration
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret

# Supabase Configuration  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI Configuration
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4

# Google Drive Configuration
GDRIVE_FOLDER_ID=1ApIYu-Gwng55rT4Isb2AKgrAS03-T1y8

# Workflow Configuration
MANAGEMENT_EMAIL=binquraya.procurement.demo+management@gmail.com
PROCUREMENT_EMAIL=binquraya.procurement.demo@gmail.com
DEV_TEAM_EMAIL=Tariq.alhashim@davonmt.com
SUBMISSION_DEADLINE_DAYS=7
```

---

## Production Deployment Checklist

### Pre-Deployment:
- [ ] All critical fixes implemented
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Test scenarios passed
- [ ] Error handling verified
- [ ] Credentials validated

### Deployment:
- [ ] Workflow imported to production n8n
- [ ] Webhook URLs updated
- [ ] Gmail labels created
- [ ] Initial AVL sheet populated
- [ ] Monitoring configured

### Post-Deployment:
- [ ] Send test email
- [ ] Verify end-to-end flow
- [ ] Check all database writes
- [ ] Confirm email delivery
- [ ] Monitor for 24 hours

---

## Performance Expectations

### Current Performance:
- Email to RFQ Creation: ~8 seconds
- Per Vendor Processing: ~2 seconds
- Total for 5 vendors: ~18 seconds

### After Optimization:
- Email to RFQ Creation: ~5 seconds
- Parallel vendor processing: ~3 seconds total
- Total for 5 vendors: ~8 seconds

### Scalability:
- Current: Handles 50 RFQs/hour
- After optimization: 200 RFQs/hour
- Maximum vendors per RFQ: 100

---

## Monitoring & Alerts

### Key Metrics to Track:
1. RFQs processed per hour
2. Average processing time
3. AI extraction success rate
4. Email delivery success rate
5. Database operation latency

### Alert Thresholds:
- Processing time > 30 seconds
- Extraction quality < 0.6
- Email failure rate > 5%
- Database errors > 0
- Retry count > 2

---

## Known Limitations

1. **Gmail API Rate Limits:** 250 quota units per user per second
2. **OpenAI Rate Limits:** Depends on tier (typically 10,000 tokens/min)
3. **Supabase Connections:** Default 60 connections
4. **Google Sheets API:** 100 requests per 100 seconds
5. **Processing Capacity:** ~200 RFQs per hour maximum

---

## Support Contacts

- **n8n Issues:** Internal DevOps Team
- **Database Issues:** Supabase Support
- **AI/Extraction Issues:** Review OpenAI logs
- **Email Delivery:** Check Gmail API Dashboard
- **Business Logic:** Procurement Team Lead
