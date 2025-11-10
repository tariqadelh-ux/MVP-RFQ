# Email Processing Guide - How Your System Handles Real Emails

## Overview
This guide shows exactly how your production workflows process the actual email formats from management and vendors.

## 1. Management RFQ Initiation Email

### Email Format (from Memo_Email_Management.md)
```
From: BQ Management Demo <binquraya.procurement.demo+management@gmail.com>
To: Bin Quraya Procurement <binquraya.procurement.demo@gmail.com>
Subject: [Will vary - contains project details]
Attachment: Procurement_Memo_450-012547.pdf
```

### How Main Processor Handles This

**Option 1: Email-Triggered RFQ Creation** (Add to Main Processor)
```json
{
  "name": "Gmail Trigger - Management Memos",
  "type": "n8n-nodes-base.emailReadImap",
  "parameters": {
    "mailbox": "INBOX",
    "postProcessAction": "markAsRead",
    "customEmailConfig": "from:binquraya.procurement.demo+management@gmail.com"
  }
}
```

**Current: Webhook-Triggered** (Already implemented)
- Dashboard or external system calls webhook with memo file ID
- Workflow downloads memo from Google Drive
- ChatGPT 5 extracts all project details

### What ChatGPT 5 Extracts from Management Email
```json
{
  "project_name": "Eagle - Aramco Site 7 Expansion",
  "nine_com_number": "450-012547",
  "wbs_code": "PE-A7-PRC-01",
  "material_description": "High-Pressure Shell & Tube Heat Exchanger",
  "quantity": 1,
  "design_standard": "ASME Section VIII Div. 1",
  "design_pressure": "20 bar",
  "design_temperature": "180°C",
  "required_material_grade": "SS 316/316L",
  "critical_requirement": "All wetted parts must be SS 316L",
  "delivery_location": "Jubail"
}
```

## 2. Vendor Response Emails

### Email Format A - Compliant Vendor
```
From: Vendor A <vendor.a.demo@gmail.com>
To: binquraya.procurement.demo@gmail.com
Subject: [Contains RFQ reference]

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_316L
[END_TECHNICAL_DATA]

Attachment: vendor_a_quote.pdf
```

### Email Format B - Non-Compliant Vendor
```
From: Vendor B <vendor.b.demo@gmail.com>
To: binquraya.procurement.demo@gmail.com

[START_TECHNICAL_DATA]
MATERIAL_GRADE: SS_304
[END_TECHNICAL_DATA]

Attachment: vendor_b_quote.pdf
```

### How Email Processor Handles These

#### Step 1: Gmail IMAP Trigger
```javascript
// Already configured to check every 5 minutes
"customQuery": "is:unread subject:RFQ OR subject:Quotation"
```

#### Step 2: ChatGPT 5 Vendor Extraction
The AI is already configured to extract:
- Vendor name from email
- RFQ reference from subject/body
- **NEW BENEFIT**: Can also parse the technical data tags!

#### Step 3: Enhanced Extraction with Tags
We can enhance the Code node to check for tags first:

```javascript
// In "Parse AI Response" node, add:
const emailBody = $json.text || $json.snippet;
let materialGrade = null;

// Check for technical data tags
const tagMatch = emailBody.match(/\[START_TECHNICAL_DATA\][\s\S]*MATERIAL_GRADE:\s*(\S+)[\s\S]*\[END_TECHNICAL_DATA\]/);
if (tagMatch) {
  materialGrade = tagMatch[1];
  console.log('Found material grade in tags:', materialGrade);
}
```

#### Step 4: Attachment Processing
The PDF quotations (vendor_a_quote.pdf, vendor_b_quote.pdf) are processed by:
1. Extract PDF Text node
2. ChatGPT 5 analyzes full document
3. Extracts pricing, delivery, payment terms

## 3. Critical Material Compliance Check

### Current Implementation
The workflow already checks for SS 316L compliance:

```javascript
// In "Requires TBC?" node
const isCompliant = materialGrade === 'SS_316L' || 
                   materialGrade === 'SS_316/316L' ||
                   materialGrade === 'SS 316L';

if (!isCompliant) {
  // Triggers TBC (Technical Bid Clarification) email
}
```

### What Happens with Non-Compliant (SS_304)
1. System detects SS_304 ≠ SS_316L
2. Automatically sends TBC email to vendor
3. Logs non-compliance in Supabase
4. Vendor must resubmit with correct material

## 4. Supabase Storage for These Emails

### Email Log Entry
```sql
INSERT INTO email_logs (
  message_id,
  from_email,
  subject,
  rfq_id,
  direction,
  has_technical_tags,  -- New field we could add
  raw_technical_data   -- Store the tag content
) VALUES (
  'msg123',
  'vendor.a.demo@gmail.com',
  'RE: RFQ 450-012547',
  '450-012547',
  'inbound',
  true,
  'MATERIAL_GRADE: SS_316L'
);
```

### Vendor Offer Entry
```sql
INSERT INTO vendor_offers (
  rfq_id,
  vendor_id,
  material_offered,
  compliance_status,
  technical_data_source  -- 'tags' or 'pdf_extraction'
) VALUES (
  '450-012547',
  '9V-1102',
  'SS_316L',
  'compliant',
  'tags'
);
```

## 5. Processing Flow for Your Actual Emails

### Complete Flow Example

1. **Management sends memo** (Memo_Email_Management.md)
   - Main Processor extracts project details
   - Creates RFQ in Supabase
   - Sends RFQ to vendors

2. **Vendor A responds** (Vendor_A_Compliant_Email.md)
   - Email Processor detects tags: `MATERIAL_GRADE: SS_316L`
   - Marks as compliant immediately
   - Extracts full details from PDF attachment
   - Stores in Supabase

3. **Vendor B responds** (Vendor_B_Non_Compliant_Email.md)
   - Email Processor detects tags: `MATERIAL_GRADE: SS_304`
   - Marks as non-compliant
   - Sends TBC automatically
   - Still extracts pricing for reference

4. **Gatekeeper checks hourly**
   - Finds only Vendor A is compliant
   - Waits for more compliant vendors or timeout

5. **Evaluation triggers**
   - Scores all compliant vendors
   - Vendor A wins (if best score)
   - Sends decision email

## 6. Enhancements for Your Email Format

### 1. Add Tag Parser to Email Processor
```javascript
// Enhanced parsing in Code node
function parseTechnicalTags(emailBody) {
  const tags = {};
  const tagSection = emailBody.match(/\[START_TECHNICAL_DATA\]([\s\S]*?)\[END_TECHNICAL_DATA\]/);
  
  if (tagSection) {
    const lines = tagSection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/(\w+):\s*(.+)/);
      if (match) {
        tags[match[1].toLowerCase()] = match[2].trim();
      }
    });
  }
  
  return tags;
}
```

### 2. Priority Processing for Tagged Emails
```javascript
// Prioritize emails with technical tags
if (emailBody.includes('[START_TECHNICAL_DATA]')) {
  // Fast-track processing
  // Immediate compliance check
  // Skip some AI extraction steps
}
```

### 3. Management Email Router
Add a router in Email Processor to handle management emails differently:
```javascript
if (fromEmail.includes('management@gmail.com')) {
  // Route to RFQ creation flow
  // Extract project details
  // Create new RFQ
} else {
  // Regular vendor response flow
}
```

## Testing with Your Email Templates

### Test Scenario 1: Management Initiates RFQ
1. Send email matching Memo_Email_Management.md format
2. Attach the procurement memo PDF
3. Watch Main Processor create RFQ and send to vendors

### Test Scenario 2: Compliant Vendor Response
1. Send email matching Vendor_A_Compliant_Email.md
2. Include `MATERIAL_GRADE: SS_316L` in tags
3. Attach vendor_a_quote.pdf
4. Verify system marks as compliant

### Test Scenario 3: Non-Compliant Vendor Response  
1. Send email matching Vendor_B_Non_Compliant_Email.md
2. Include `MATERIAL_GRADE: SS_304` in tags
3. Attach vendor_b_quote.pdf
4. Verify system sends TBC email

## Key Advantages of Your Email Format

1. **Technical Tags**: Make extraction 100% accurate for critical data
2. **Simple Vendor Emails**: Easy for vendors to respond
3. **Structured Management Emails**: Clear project information
4. **PDF Attachments**: Detailed commercial data in standard format

## Monitoring Email Processing

```sql
-- Check tag parsing success rate
SELECT 
  COUNT(*) as total_emails,
  COUNT(CASE WHEN has_technical_tags THEN 1 END) as with_tags,
  COUNT(CASE WHEN compliance_status = 'compliant' THEN 1 END) as compliant
FROM email_logs e
JOIN vendor_offers v ON e.rfq_id = v.rfq_id
WHERE e.created_at > NOW() - INTERVAL '7 days';

-- Track processing speed
SELECT 
  vendor_name,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))) as avg_seconds
FROM email_logs
GROUP BY vendor_name;
```

Your email format is actually PERFECT for automation - the technical tags make critical data extraction foolproof!
