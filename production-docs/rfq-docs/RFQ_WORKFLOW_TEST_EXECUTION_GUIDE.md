# RFQ Workflow 1 - Complete Test Execution Guide

## Test Environment Setup

### Required Accounts
- **Management Email:** binquraya.procurement.demo+management@gmail.com
- **Procurement Email:** binquraya.procurement.demo@gmail.com (monitored by workflow)
- **Vendor Emails:** Use Yahoo emails (Gmail limit reached)

### Pre-Test Database Reset
```sql
-- Optional: Clear test data from previous runs
DELETE FROM workflow_executions WHERE workflow_name = 'RFQ Generation';
DELETE FROM rfq_events WHERE rfq_id LIKE 'RFQ-%' OR rfq_id LIKE 'BQ-%';
DELETE FROM extraction_quality_issues WHERE created_at > NOW() - INTERVAL '7 days';
DELETE FROM vendors WHERE created_at > NOW() - INTERVAL '7 days';
DELETE FROM rfq_requests WHERE rfq_id LIKE 'RFQ-%' OR rfq_id LIKE 'BQ-%';
```

### AVL Setup in Google Sheets
Create these vendor groups in your AVL master sheet:

```
Heat Exchanger Vendors (9COM: 450-012547):
ABC Industries | abc.industries@yahoo.com | John Smith | +966-50-111-1111
Global Tech Solutions | globaltech.vendor@yahoo.com | Sarah Johnson | +966-50-222-2222
Eagle Manufacturing | eagle.mfg@yahoo.com | Mike Wilson | +966-50-333-3333

Pipe Fittings Vendors (9COM: 680-009132):
ABC Industries | abc.industries@yahoo.com | John Smith | +966-50-111-1111
QuickSource Trading | quicksource@yahoo.com | Amy Chen | +966-50-444-4444
Direct Procurement Ltd | direct.proc@yahoo.com | Robert Brown | +966-50-555-5555

Multi-Purpose Vendors (9COM: 450-012547 AND 680-009132):
Premier Supplies Co | premier.supplies@yahoo.com | Lisa Anderson | +966-50-666-6666
BulkOrder Systems | bulk.orders@yahoo.com | David Kim | +966-50-777-7777
MultiItem Specialists | multi.item@yahoo.com | Carlos Rodriguez | +966-50-888-8888
Consolidated Supplies | consolidated@yahoo.com | Maria Garcia | +966-50-999-9999
```

---

## Test Scenario A: Happy Path ✅

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: RFQ Required - Eagle Project Heat Exchanger Procurement

Dear Procurement Team,

Please initiate the RFQ process for the following critical equipment requirement:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT DETAILS:
- Project Name: Eagle - Aramco Site 7 Expansion
- 9COM Number: 450-012547
- WBS Code: PE-A7-PRC-01
- Priority: HIGH

ITEM SPECIFICATION:
- Description: High-Pressure Shell & Tube Heat Exchanger
- Quantity: 1 Unit
- Design Standard: ASME Section VIII Div. 1
- Design Pressure: 20 bar
- Design Temperature: 180°C 

CRITICAL REQUIREMENT:
All wetted parts (tubes, tubesheet, channel, and nozzles) MUST be
fabricated from Stainless Steel Grade 316/316L (UNS S31603) per
Aramco Standard SAES-A-301.

NO SUBSTITUTIONS PERMITTED - This is a high-chloride service
application where SS 304 is NOT acceptable.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBMISSION REQUIREMENTS:
✓ Technical specifications confirming material grade compliance
✓ Pricing (DDP Jubail basis preferred)
✓ Delivery timeline from PO date
✓ Payment terms proposal
✓ Material test certificates (MTC as per EN 10204 3.1)

TIMELINE:
- RFQ Issue: ASAP
- Vendor Response Deadline: 7 days from RFQ issue
- Technical Evaluation: 2 days
- Commercial Evaluation: 1 day
- PO Award Target: Within 10 days total

This equipment is on the critical path for Project Eagle. Any delays
will impact the overall project schedule and may result in liquidated
damages.

Please use the attached detailed procurement memo for full technical
specifications and requirements.

Contact me if you need any clarifications.

Best regards,
Khalid Al-Mansour
Lead Engineer - Pressure Systems
Engineering Department
Bin Quraya Management & Trading
Mobile: +966 50 XXX XXXX
Email: engineering@binquraya.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attachment: PE-7-MEMO-001_Procurement_Initiation.pdf
```

### Expected Database Population

#### rfq_requests
```sql
rfq_id: 'RFQ-2025-11-08-XXXX' (❌ Wrong format - should be BQ-YYYYMMDDHHMMSS)
nine_com_number: '450-012547'
project_name: 'Eagle - Aramco Site 7 Expansion'
project_id: 'PE-A7-PRC-01'
material_description: 'High-Pressure Shell & Tube Heat Exchanger'
specifications: 'ASME Section VIII Div. 1, 20 bar, 180°C'
quantity: 1
critical_requirements: 'SS 316/316L per SAES-A-301'
wbs_code: 'PE-A7-PRC-01'
delivery_location: 'Jubail'
delivery_timeline: '45 days from PO'
status: 'awaiting_responses'
vendor_count: 3
invited_vendor_count: 3
response_deadline: [7 days from now]
```

#### vendors (3 records)
```sql
1. ABC Industries | abc.industries@yahoo.com | last_contacted: NOW()
2. Global Tech Solutions | globaltech.vendor@yahoo.com | last_contacted: NOW()
3. Eagle Manufacturing | eagle.mfg@yahoo.com | last_contacted: NOW()
```

#### rfq_events (5 events)
```sql
1. event_type: 'RFQ_INITIATED' | timestamp: T+0
2. event_type: 'EMAIL_SENT' | vendor: ABC Industries | timestamp: T+10s
3. event_type: 'EMAIL_SENT' | vendor: Global Tech | timestamp: T+12s
4. event_type: 'EMAIL_SENT' | vendor: Eagle Mfg | timestamp: T+14s
5. event_type: 'RFQ_SENT' | description: 'RFQ sent to 3 vendors' | timestamp: T+15s
```

#### workflow_executions
```sql
workflow_name: 'RFQ Generation'
status: 'success'
rfq_id: 'RFQ-2025-11-08-XXXX'
vendor_count: 3
completed_at: [timestamp]
```

### Verification Queries
```sql
-- Check RFQ created
SELECT * FROM rfq_requests WHERE created_at > NOW() - INTERVAL '10 minutes';

-- Check vendors contacted
SELECT vendor_name, vendor_email, last_contacted 
FROM vendors WHERE last_contacted > NOW() - INTERVAL '10 minutes';

-- Check events logged
SELECT event_type, vendor_name, event_timestamp 
FROM rfq_events WHERE rfq_id = (SELECT rfq_id FROM rfq_requests ORDER BY created_at DESC LIMIT 1);
```

---

## Test Scenario B: Email Body Only (No Attachment) 📧

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: URGENT: Pipe Fittings Required - Project Falcon

Dear Procurement Team,

Please process this RFQ immediately - no time to create formal memo.

PROJECT: Falcon - Yanbu Refinery Upgrade
9COM: 680-009132
ITEM: Industrial Pipe Fittings Set
QUANTITY: 50 pieces
MATERIAL: Carbon Steel ASTM A234 WPB
DELIVERY: Yanbu Port - 30 days
WBS: PF-YR-MEC-02

Need quotes from approved vendors ASAP. Standard payment terms apply.

Regards,
Ahmed Hassan
Project Manager
```

### Expected Database Population

#### rfq_requests
```sql
rfq_id: 'RFQ-2025-11-08-YYYY'
nine_com_number: '680-009132'
project_name: 'Falcon - Yanbu Refinery Upgrade'
material_description: 'Industrial Pipe Fittings Set'
quantity: 50
status: 'awaiting_responses'
vendor_count: 3
```

#### vendors (1 existing + 2 new)
```sql
1. ABC Industries (UPDATED - total_rfqs_invited++)
2. QuickSource Trading (NEW)
3. Direct Procurement Ltd (NEW)
```

#### extraction_quality_issues
```sql
extraction_method: 'email_body'
quality_score: 0.7
missing_fields: ['specifications', 'design_standards']
status: 'acceptable'
```

---

## Test Scenario C: AVL Not Found (9COM Invalid) ❌

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: Emergency Procurement - Special Equipment

Urgent procurement required:

PROJECT: Emergency Repair Project
9COM: 999-999999
ITEM: Specialized Cooling Unit
QUANTITY: 2 units
CRITICAL: Need within 15 days

Please expedite!

Attachment: Emergency_Memo.pdf
```

### Expected Database Population

#### rfq_requests
```sql
rfq_id: 'RFQ-2025-11-08-ZZZZ'
nine_com_number: '999-999999'
status: 'pending_avl' ⚠️
vendor_count: 0
```

#### rfq_events
```sql
event_type: 'AVL_NOT_FOUND'
nine_com_number: '999-999999'
description: 'No AVL found, awaiting manual update'
```

#### extraction_quality_issues
```sql
issue_type: 'avl_missing'
missing_fields: ['vendor_list']
status: 'awaiting_resolution'
```

---

## Test Scenario D: Poor Quality Extraction 📉

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: Need stuff

Hi,

Can you order some equipment for the project? The code is somewhere around 450-012547 I think.

We need it soon.

Thanks
```

### Expected Database Population

#### rfq_requests
```sql
rfq_id: 'RFQ-2025-11-08-AAAA'
nine_com_number: '450-012547' (if extracted)
status: 'initiated'
vendor_count: 0 (workflow may halt)
```

#### extraction_quality_issues
```sql
quality_score: 0.3
missing_fields: ['project_name', 'quantity', 'specifications', 'delivery_location']
status: 'poor_quality'
```

---

## Test Scenario E: Multiple Items 📦

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: Multiple Items RFQ - Project Multi Phase 1

Dear Team,

Please process RFQ for the following items:

PROJECT: Multi - Eastern Province Expansion

ITEM 1:
- 9COM: 450-012547
- Description: Heat Exchanger
- Quantity: 2 units
- Material: SS 316L

ITEM 2:
- 9COM: 680-009132
- Description: Pipe Fittings
- Quantity: 100 pieces
- Material: CS ASTM A234

Both items needed within 60 days. Send to all relevant vendors.

Regards,
Procurement Team

Attachment: Multi_Item_Memo.pdf
```

### Expected Database Population

#### rfq_requests (2 records or 1 combined)
```sql
-- Scenario 1: Creates 2 separate RFQs
1. rfq_id: 'RFQ-2025-11-08-BBBB' | nine_com: '450-012547' | quantity: 2
2. rfq_id: 'RFQ-2025-11-08-CCCC' | nine_com: '680-009132' | quantity: 100

-- Scenario 2: Creates 1 combined RFQ
rfq_id: 'RFQ-2025-11-08-BBBB'
nine_com_number: '450-012547,680-009132'
vendor_count: 7 (all vendors for both items)
```

#### vendors (7 unique vendors contacted)
```sql
ABC Industries (both 9COMs)
Global Tech, Eagle Mfg (450-012547)
QuickSource, Direct Procurement (680-009132)
Premier Supplies, BulkOrder (both 9COMs)
```

---

## Test Scenario F: Special Characters 🔤

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: RFQ für Müller™ Projekt - José's Equipment

Procurement Team,

Please initiate RFQ for:

PROJECT: Müller™ & Associates - José's Division
9COM: 450-012547
ITEM: Wärmetauscher (Heat Exchanger)
SPECIFICATIONS: DIN/ASME compliant
QUANTITY: 1 Stück
DELIVERY: König Abdul Aziz Port

Special notes: Contact Señor García at vendor

Mit freundlichen Grüßen,
Klaus Müller

Attachment: Müller_Specifications.pdf
```

### Expected Database Population

#### rfq_requests
```sql
rfq_id: 'RFQ-2025-11-08-DDDD'
project_name: 'Müller™ & Associates - José''s Division' (escaped quotes)
specifications: 'DIN/ASME compliant'
notes: 'Contact Señor García'
```

#### Verification
- Check Unicode characters stored correctly
- Verify email sends with special chars
- Confirm no encoding errors

---

## Test Scenario G: Invalid Vendor Emails 📧❌

### Setup
Modify AVL to include invalid emails:
```
9COM: 680-009132 Vendors:
valid.vendor@yahoo.com | Valid Vendor Co
invalid@email | Missing domain
not.an.email | No TLD
@yahoo.com | No username
vendor with spaces@yahoo.com | Spaces in email
```

### Email to Send
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: Test Invalid Vendor Emails

PROJECT: Email Validation Test
9COM: 680-009132
ITEM: Test Equipment
QUANTITY: 1

Please send to all vendors in AVL.

Attachment: Test_Memo.pdf
```

### Expected Database Population

#### rfq_requests
```sql
status: 'partial_sent'
vendor_count: 1 (only valid vendor)
invited_vendor_count: 5 (attempted)
```

#### rfq_events
```sql
event_type: 'EMAIL_SENT' | vendor: valid.vendor@yahoo.com
event_type: 'EMAIL_FAILED' | vendor: invalid@email | error: 'Invalid format'
event_type: 'EMAIL_FAILED' | vendor: not.an.email | error: 'Invalid format'
event_type: 'EMAIL_FAILED' | vendor: @yahoo.com | error: 'Missing username'
event_type: 'EMAIL_FAILED' | vendor: vendor with spaces@yahoo.com | error: 'Invalid chars'
```

---

## Post-Test Verification Dashboard

### Run These Queries After All Tests

#### 1. Overall Summary
```sql
-- RFQ Status Distribution
SELECT status, COUNT(*) as count, 
       ROUND(AVG(vendor_count), 1) as avg_vendors
FROM rfq_requests
GROUP BY status
ORDER BY count DESC;

-- Expected:
-- awaiting_responses | 5 | 3.2
-- pending_avl | 1 | 0
-- initiated | 1 | 0
-- partial_sent | 1 | 1
```

#### 2. Vendor Performance
```sql
-- Top Vendors by Engagement
SELECT vendor_name, vendor_email,
       total_rfqs_invited,
       last_contacted
FROM vendors
ORDER BY total_rfqs_invited DESC
LIMIT 5;

-- Expected: ABC Industries at top with 3-4 RFQs
```

#### 3. Event Timeline
```sql
-- Event Types Distribution
SELECT event_type, COUNT(*) as occurrences
FROM rfq_events
GROUP BY event_type
ORDER BY occurrences DESC;

-- Expected:
-- EMAIL_SENT | ~25
-- RFQ_INITIATED | 8
-- RFQ_SENT | 5
-- EMAIL_FAILED | 4
-- AVL_NOT_FOUND | 1
```

#### 4. Quality Issues
```sql
-- Extraction Quality Analysis
SELECT issue_type, 
       ROUND(AVG(quality_score), 2) as avg_score,
       COUNT(*) as issues
FROM extraction_quality_issues
GROUP BY issue_type;

-- Expected multiple issue types with varying scores
```

#### 5. Workflow Performance
```sql
-- Success Rate
SELECT 
    COUNT(*) as total_executions,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
FROM workflow_executions;

-- Expected: ~75% success rate
```

---

## Test Execution Schedule

### Day 1: Foundation (2 hours)
1. **10:00 AM** - Setup AVL in Google Sheets
2. **10:15 AM** - Scenario A (Happy Path)
3. **10:30 AM** - Verify data, fix RFQ ID format if needed
4. **10:45 AM** - Scenario B (Email Only)
5. **11:00 AM** - Scenario C (AVL Not Found)
6. **11:15 AM** - Check retry mechanism
7. **11:30 AM** - Review morning results

### Day 2: Edge Cases (2 hours)
8. **10:00 AM** - Scenario D (Poor Quality)
9. **10:20 AM** - Scenario E (Multiple Items)
10. **10:40 AM** - Scenario F (Special Characters)
11. **11:00 AM** - Scenario G (Invalid Emails)
12. **11:20 AM** - Run verification queries
13. **11:40 AM** - Document findings

---

## Critical Issues to Watch

### During Testing
1. **RFQ ID Format** - Will be wrong (RFQ-YYYY-MM-DD-XXXX instead of BQ-YYYYMMDDHHMMSS)
2. **No Retry Limit** - AVL not found could loop indefinitely
3. **No Data Validation** - Long strings could break database inserts
4. **Email Failures** - No error handling for Gmail API issues

### Quick Fixes If Needed
```javascript
// Fix RFQ ID in n8n "Generate RFQ ID" node:
BQ-{{$now.format('YYYYMMDDHHmmss')}}

// Add validation in "Prepare Vendor Loop Data" node:
projectName: (projectName || '').substring(0, 255)

// Add retry limit check:
if (retryCount >= 3) return [];
```

---

## Success Criteria

### After All Tests Complete:
- ✅ 8 RFQs created with various statuses
- ✅ 15+ unique vendors in database
- ✅ 40+ events logged
- ✅ Multiple extraction quality issues documented
- ✅ Email send/failure patterns visible
- ✅ Retry mechanisms tested
- ✅ Special character handling verified
- ✅ Dashboard has rich data to display

### Ready for Dashboard Development When:
1. All test scenarios executed
2. Database populated with diverse data
3. Queries return expected results
4. No critical errors in workflow
5. Documentation updated with findings

---

## Next Steps After Testing

1. **Share results with developer** for dashboard Phase 1
2. **Apply critical fixes** from WORKFLOW_NODE_FIXES.md
3. **Build Workflow 1B** (Vendor Follow-up) per VENDOR_FOLLOWUP_WORKFLOW.md
4. **Start Workflow 2** development (Vendor Response Processing)
5. **Update PROJECT_OVERVIEW.md** with current status

---

*Test Guide Version: 1.0*
*Last Updated: November 8, 2025*
*For: Main Processor AI B Workflow Testing*
