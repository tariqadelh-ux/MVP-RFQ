# Workflow 2: Vendor Response Processing - Detailed n8n AI Builder Prompt

## Complete Prompt for n8n AI Workflow Builder

```
Create a workflow that monitors Gmail for vendor responses to RFQs and processes their quotations automatically. This workflow must integrate with an existing Supabase database structure.

TRIGGER:
- Monitor Gmail inbox every 5 minutes for emails
- Filter for unread emails where:
  - Subject contains "RFQ" or "quotation" or "quote"
  - From email is NOT from management domain (binquraya.procurement.demo+management@gmail.com)
- Must download all attachments, especially PDFs

WORKFLOW CONFIGURATION NODE:
Create a Set node with these configuration values:
- procurementTeamEmail: binquraya.procurement.demo@gmail.com
- devTeamEmail: Tariq.alhashim@davonmt.com  
- criticalMaterialGrades: ["SS 316L", "316L", "316/316L", "AISI 316L"]

PROCESS FLOW:

1. Check if email already processed:
   - Look for "VENDOR_RESPONSE_PROCESSED" label
   - Skip if already processed

2. Extract RFQ reference from email:
   - Use AI to identify RFQ number (format: BQ-YYYYMMDDHHMMSS)
   - Extract vendor email address
   - If no RFQ reference found, log to email_logs table and skip

3. Verify RFQ exists in Supabase:
   Table: rfq_requests
   Operation: Get Many
   Filter: rfq_id equals extracted RFQ number AND status equals "awaiting_responses"
   If not found: Log event and notify team

4. Look up or create vendor:
   Table: vendors
   Operation: Get Many
   Filter: vendor_email equals sender email
   If not found: Create new vendor record with email and name extracted from email

5. Process quotation attachment:
   - Extract text from PDF quotation
   - Use AI (GPT-4) to extract these specific fields:
     * Unit price and currency
     * Total price
     * Delivery timeline (in days)
     * Payment terms (e.g., "30/70", "Net 30")
     * Warranty period (in months)
     * Material grade offered (CRITICAL for compliance)
     * Certifications provided
     * Any technical deviations
   - Calculate delivery date from current date + delivery days

6. CRITICAL Compliance Check:
   - Compare extracted material_grade against criticalMaterialGrades array
   - If material grade is NOT in approved list:
     * Set compliance_status to "non-compliant"
     * Set tbc_issued to true
     * Set tbc_issued_at to current timestamp
     * Prepare and send TBC (Technical Bid Clarification) email
   - If compliant:
     * Set compliance_status to "compliant"

7. Store vendor offer in Supabase:
   Table: vendor_offers
   Operation: Create row
   Fields to populate:
   - rfq_id: From step 3
   - vendor_id: From step 4
   - response_received_at: Current timestamp
   - material_offered: From AI extraction
   - material_grade: From AI extraction (CRITICAL)
   - compliance_status: From compliance check
   - technical_deviations: Array from AI extraction
   - certifications: Array from AI extraction
   - unit_price: From AI extraction
   - total_price: From AI extraction
   - currency: From AI extraction (default "USD")
   - delivery_days: From AI extraction
   - delivery_date: Calculated date
   - payment_terms: From AI extraction
   - warranty_months: From AI extraction
   - email_message_id: Gmail message ID
   - ai_confidence: From AI extraction confidence
   - manual_review_required: Set true if AI confidence < 0.8

8. Log vendor response event:
   Table: rfq_events
   Operation: Create row
   Fields:
   - rfq_id: Current RFQ
   - event_type: "vendor_responded"
   - vendor_id: From vendor lookup
   - vendor_name: From vendor record
   - vendor_email: Sender email
   - nine_com_number: From rfq_requests lookup
   - project_name: From rfq_requests lookup
   - title: "Vendor Response Received"
   - description: "Quotation received from {vendor_name}"
   - event_timestamp: Current timestamp

9. If TBC needed, send clarification email:
   Subject: "Technical Clarification Required - RFQ {rfq_id}"
   Body: Professional email requesting clarification on material grade
   Must include: Required grade (SS 316L), offered grade, request for confirmation
   
10. Log TBC event if sent:
    Table: rfq_events
    Operation: Create row
    Fields:
    - rfq_id: Current RFQ
    - event_type: "tbc_sent"
    - vendor_id: From vendor lookup
    - vendor_name: From vendor record
    - vendor_email: Recipient email
    - title: "TBC Sent - Material Grade"
    - description: "Non-compliant grade: {offered_grade}"
    - details: JSON with offered_grade and required_grade

11. Update RFQ metrics:
    Table: rfq_requests
    Operation: Update row
    Filter: rfq_id equals current RFQ
    Fields:
    - responded_vendor_count: Increment by 1
    - compliant_vendor_count: Increment by 1 ONLY if compliant

12. Log email in email_logs:
    Table: email_logs
    Operation: Create row
    Fields:
    - rfq_id: Current RFQ (if identified)
    - vendor_id: From vendor lookup
    - message_id: Gmail message ID
    - direction: "inbound"
    - from_email: Sender email
    - subject: Email subject
    - received_at: Email date
    - processed_at: Current timestamp
    - processing_status: "processed"
    - ai_extracted_data: JSON of all extracted data
    - attachments_processed: true

13. Mark email as processed:
    Add Gmail label: "VENDOR_RESPONSE_PROCESSED"

14. Log workflow execution:
    Table: workflow_executions
    Operation: Create row
    Fields:
    - workflow_name: "Vendor Response Processing"
    - status: "success"
    - rfq_id: Current RFQ (if identified)
    - completed_at: Current timestamp

ERROR HANDLING:

- If PDF extraction fails:
  * Try extracting from email body
  * Set manual_review_required to true in vendor_offers
  * Notify dev team

- If no RFQ reference found:
  * Log to email_logs with processing_status "rfq_not_identified"
  * Forward to procurement team for manual review

- If AI extraction confidence low:
  * Still save the data but flag for review
  * Create extraction_quality_issues record

- For any errors:
  * Log to workflow_executions with error details
  * Send notification to dev team
  * Continue processing other emails

CRITICAL SUPABASE SCHEMA NOTES:

1. vendor_offers table expects:
   - material_grade as TEXT (not array)
   - compliance_status as TEXT with values: 'compliant', 'non-compliant', 'clarification_needed'
   - technical_deviations as TEXT array
   - certifications as TEXT array

2. rfq_events table has these additional fields:
   - nine_com_number (TEXT)
   - project_name (TEXT) 
   - vendor_email (TEXT)
   - details (JSONB) for additional event-specific data

3. All timestamps should use {{ $now }} in n8n

4. vendor_id fields are UUID type - use the id from vendors table, not vendor_id

The workflow must accurately identify material compliance issues, maintain vendor communication, and provide complete audit trail for dashboard reporting.
```

## Configuration for AI Model Nodes

### OpenAI GPT-4 Configuration
- Model: gpt-4o
- Temperature: 0.3
- System Message: "You are a procurement specialist extracting structured data from vendor quotations. Pay special attention to material grades and technical specifications."

### Output Parser Schema
```json
{
  "unitPrice": "100.50",
  "currency": "USD",
  "totalPrice": "10050.00",
  "deliveryDays": "30",
  "paymentTerms": "30/70",
  "warrantyMonths": "12",
  "materialGrade": "SS 316L",
  "certifications": ["ISO 9001", "Material Test Certificate"],
  "technicalDeviations": ["None"],
  "extractionConfidence": 0.95
}
```

## Testing Data

### Test Email 1 - Compliant Response
- Subject: "Re: RFQ BQ-20241030123456 - Quotation"
- From: vendor.a.demo@gmail.com
- Body: Contains quotation details
- Attachment: PDF with SS 316L material

### Test Email 2 - Non-Compliant Response  
- Subject: "Quotation for RFQ BQ-20241030123456"
- From: vendor.b.demo@gmail.com
- Body: Contains quotation details
- Attachment: PDF with SS 304 material (triggers TBC)

## Integration with Other Workflows

### Receives from Workflow 1:
- Active RFQs with status "awaiting_responses"
- Vendor records in vendors table
- Nine_com_number and project details in rfq_requests

### Provides to Workflow 3:
- Vendor offers in vendor_offers table
- Updated responded_vendor_count in rfq_requests
- Compliance status for gatekeeper logic

### Provides to Workflow 4:
- Complete vendor offers for scoring
- Compliance status for filtering
- TBC history for consideration

## Dashboard Metrics Enabled
- Response rate by vendor
- Compliance rate tracking
- TBC issuance frequency
- Response time analysis
- Material grade distribution
