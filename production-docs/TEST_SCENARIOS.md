# Test Scenarios Using Your Email Templates

## Pre-Test Setup

### 1. Email Accounts Required
- Management: `binquraya.procurement.demo+management@gmail.com`
- Procurement: `binquraya.procurement.demo@gmail.com` (monitored by workflows)
- Vendor A: `vendor.a.demo@gmail.com`
- Vendor B: `vendor.b.demo@gmail.com`
- Vendor C: `vendor.c.demo@gmail.com`

### 2. Files to Upload to Google Drive
- `/Templates/Project_Initiation_Docs_Sample/PE-7-MEMO-001_Procurement_Initiation (1) (3).pdf`
- `/Templates/9COM_to_AVL_Master_List.xlsx` (if using AVL lookup)

### 3. Credentials to Configure in n8n
- Gmail OAuth (for procurement email monitoring)
- Google Drive (for document access)
- OpenAI ChatGPT 5
- Supabase API

## Test Scenario 1: Complete Happy Path

### Step 1: Initiate RFQ via Webhook
```bash
curl -X POST https://your-n8n.com/webhook/create-rfq \
  -H "Content-Type: application/json" \
  -d '{
    "project_memo_id": "[Google Drive ID of PE-7-MEMO-001]"
  }'
```

**Expected Results:**
- RFQ created with ID like `BQ-20251029145623`
- 3 emails sent to vendors
- Supabase `rfq_requests` has new entry
- Events logged: `RFQ_INITIATED`, `RFQ_SENT`

### Step 2: Send Compliant Vendor Response
Using the template from `Vendor_A_Compliant_Email.md`:

```
From: vendor.a.demo@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: RE: RFQ BQ-20251029145623 - Heat Exchanger Quote

Dear Bin Quraya,

Please find attached our quotation for the heat exchanger.

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_316L
[END_TECHNICAL_DATA]

Best regards,
Vendor A Industries

Attachment: vendor_a_quote.pdf
```

**Expected Results:**
- Email processed within 5 minutes
- Material grade extracted: `SS_316L`
- Marked as compliant
- No TBC email sent
- PDF analyzed for pricing
- `vendor_offers` table updated

### Step 3: Send Non-Compliant Vendor Response
Using the template from `Vendor_B_Non_Compliant_Email.md`:

```
From: vendor.b.demo@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: RE: RFQ BQ-20251029145623 - Our Best Offer

Dear Bin Quraya,

Our best offer attached.

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_304
[END_TECHNICAL_DATA]

Regards,
Vendor B Solutions

Attachment: vendor_b_quote.pdf
```

**Expected Results:**
- Material grade extracted: `SS_304`
- Marked as non-compliant
- TBC email sent automatically
- Event logged: `TBC_SENT`
- Still extracts pricing for record

### Step 4: Wait for Gatekeeper Check
- Wait 1 hour (or manually trigger for testing)
- Gatekeeper runs and checks vendor status

**Expected Results:**
- Finds only 1 compliant vendor (Vendor A)
- Does NOT trigger evaluation yet
- Logs check: "Waiting for more vendors (have 1, need 2)"

### Step 5: Send Third Vendor Response
```
From: vendor.c.demo@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: RE: RFQ BQ-20251029145623 - Vendor C Quotation

Dear Bin Quraya,

Please find our competitive offer attached.

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_316/316L
[END_TECHNICAL_DATA]

Best regards,
Vendor C Global

Attachment: Vendor C Global - Quotation (1).pdf
```

**Expected Results:**
- Material grade accepted (316/316L = 316L)
- Marked as compliant
- Now have 2 compliant vendors

### Step 6: Next Gatekeeper Check Triggers Evaluation
- Within next hour, Gatekeeper runs again
- Finds 2 compliant vendors

**Expected Results:**
- Triggers Commercial Evaluation
- Emails management with decision package
- Ranks vendors by score
- Event logged: `EVALUATION_COMPLETED`

### Step 7: Approve Purchase Order
```bash
curl -X POST https://your-n8n.com/webhook/rfq-decision \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE_PO",
    "rfqId": "BQ-20251029145623",
    "vendorId": "[winning vendor ID]",
    "vendorName": "Vendor A Industries",
    "userId": "khalid.almansour",
    "comments": "Best overall value"
  }'
```

**Expected Results:**
- PO generated and emailed to winner
- Regret letters sent to others
- All statuses updated in Supabase
- Event logged: `PO_ISSUED`

## Test Scenario 2: Management Email Initiation

### If Adding Email Trigger to Main Processor:
Send email exactly as in `Memo_Email_Management.md`:

```
From: binquraya.procurement.demo+management@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: URGENT: Procurement Required - Project Eagle Heat Exchanger

[Full email content from template]

Attachment: PE-7-MEMO-001_Procurement_Initiation (1) (3).pdf
```

**Expected Results:**
- Email triggers Main Processor
- Extracts from email AND attachment
- Creates RFQ and continues normal flow

## Test Scenario 3: Edge Cases

### Test 3A: Vendor Without Tags
```
From: vendor.a.demo@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: Quotation for RFQ BQ-20251029145623

Please find attached our quote. 
Material grade is stainless steel 316L as requested.

Attachment: vendor_a_quote.pdf
```

**Expected Results:**
- AI still extracts "316L" from email body
- Falls back to PDF analysis
- Should still work correctly

### Test 3B: Multiple Attachments
```
From: vendor.b.demo@gmail.com
To: binquraya.procurement.demo@gmail.com

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_316L
[END_TECHNICAL_DATA]

Attachments:
- Commercial_Proposal.pdf
- Technical_Datasheet.pdf
- Company_Profile.pdf
```

**Expected Results:**
- Processes all attachments
- Finds pricing in Commercial_Proposal.pdf
- Extracts technical details from datasheet

### Test 3C: Amended Quotation
```
From: vendor.b.demo@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: REVISED: RFQ BQ-20251029145623

Following your TBC, please find revised offer with SS 316L.

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_316L
[END_TECHNICAL_DATA]

Attachment: vendor_b_revised_quote.pdf
```

**Expected Results:**
- Updates existing vendor offer
- Changes compliance status to compliant
- Logs revision event

## SQL Queries to Monitor Test Progress

### Check RFQ Status
```sql
-- View current RFQ state
SELECT 
  rfq_id,
  status,
  invited_vendor_count,
  created_at,
  response_deadline
FROM rfq_requests
WHERE rfq_id LIKE 'BQ-2025%'
ORDER BY created_at DESC;
```

### Monitor Vendor Responses
```sql
-- See vendor offers and compliance
SELECT 
  vo.rfq_id,
  v.vendor_name,
  vo.material_offered,
  vo.compliance_status,
  vo.unit_price,
  vo.created_at
FROM vendor_offers vo
JOIN vendors v ON vo.vendor_id = v.id
ORDER BY vo.created_at DESC;
```

### Track Email Processing
```sql
-- Check email processing status
SELECT 
  from_email,
  subject,
  processed_at,
  rfq_id,
  has_attachment
FROM email_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### View Event Timeline
```sql
-- See complete event flow
SELECT 
  event_timestamp,
  event_type,
  title,
  description,
  vendor_name,
  details
FROM rfq_events
WHERE rfq_id = 'BQ-20251029145623'
ORDER BY event_timestamp;
```

## Success Criteria

### Email Processor Success
- ✓ Processes emails within 5 minutes
- ✓ Correctly extracts material grades from tags
- ✓ Identifies compliance status accurately
- ✓ Sends TBC only for non-compliant materials
- ✓ Extracts pricing from PDF attachments

### Gatekeeper Success  
- ✓ Runs every hour automatically
- ✓ Correctly counts compliant vendors
- ✓ Triggers evaluation at right time
- ✓ Logs all checks to database

### Commercial Evaluation Success
- ✓ Scores vendors based on actual data
- ✓ Generates meaningful recommendations
- ✓ Sends formatted decision email
- ✓ Updates all vendor scores

### End-to-End Success
- ✓ Complete flow works without manual intervention
- ✓ All events logged for dashboard
- ✓ Final PO sent to winner
- ✓ All data in Supabase for reporting

## Troubleshooting Common Issues

### Emails Not Processing
1. Check Gmail IMAP is enabled
2. Verify OAuth credentials
3. Check email filter/search query
4. Look at workflow execution logs

### Material Grade Not Detected
1. Check tag format is exact
2. Verify AI prompt includes tag parsing
3. Check PDF text extraction worked
4. Review AI response format

### Gatekeeper Not Triggering
1. Verify schedule is active
2. Check vendor compliance status in DB
3. Confirm RFQ status is correct
4. Review gatekeeper logs

### Webhook Errors
1. Verify webhook URL is accessible
2. Check request body format
3. Review error logs in n8n
4. Test with curl directly

This completes your test scenarios using your actual email templates!
