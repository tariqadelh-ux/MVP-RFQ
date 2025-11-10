# n8n AI Builder Prompts - Copy & Paste Ready

Use these prompts directly in the n8n AI Workflow Builder for each workflow.

## Workflow 1: RFQ Creation & Management

```
Create a workflow that monitors a Gmail inbox for procurement initiation emails from management and automatically creates RFQs. The workflow should:

TRIGGER:
- Monitor Gmail inbox every 5 minutes for emails with "RFQ" or "procurement" in subject from management domain
- Must be able to download and process PDF attachments

PROCESS FLOW:
1. When a procurement email arrives from management:
   - Extract the email content and identify it's a procurement request
   - Download the attached PDF procurement memo
   - Extract text from the PDF document
   
2. Use AI (ChatGPT) to intelligently extract from both email and PDF:
   - 9COM number (format: XXX-XXXXXX)
   - Project name and ID
   - Material description and specifications
   - Quantity required
   - Critical requirements (especially material grade like SS 316L)
   - WBS code and budget info
   - Delivery location and timeline
   
3. Generate a unique RFQ ID with format: BQ-YYYYMMDDHHMMSS

4. Store in Supabase rfq_requests table:
   - All extracted project information
   - Set status as "initiated"
   - Record submission deadline (7 days from now)
   
5. Look up the approved vendor list (AVL) from Google Sheets using the 9COM number
   - Download the corresponding AVL document from Google Drive
   - Extract vendor details using AI

6. For each approved vendor:
   - Create/update vendor record in Supabase vendors table
   - Send personalized RFQ email with all requirements
   - Log each email sent in Supabase rfq_events table
   
7. Update RFQ status to "awaiting_responses" with vendor count

8. Mark the original management email as processed

ERROR HANDLING:
- If PDF extraction fails, notify procurement team
- If no vendors found in AVL, use default vendor list
- Log all errors to Supabase workflow_executions table
- Never process the same email twice

The workflow should be fault-tolerant, handle attachments properly, and maintain a complete audit trail in Supabase.
```

## Workflow 2: Vendor Response Processing (DETAILED VERSION)

For the complete, production-ready prompt with all Supabase field mappings, see: `/production-docs/WORKFLOW_2_VENDOR_RESPONSE_PROMPT.md`

**Quick Summary:**
```
Create a workflow that monitors Gmail for vendor responses to RFQs and processes their quotations automatically.

TRIGGER:
- Monitor Gmail every 5 minutes for unread emails containing "RFQ" or "quotation"
- Must handle PDF attachments (quotations)

KEY FEATURES:
- AI extraction of quotation details from PDF
- Critical material grade compliance checking (SS 316L)
- Automatic TBC (Technical Bid Clarification) for non-compliant offers
- Complete Supabase integration with vendor_offers table
- Email tracking and audit trail

SUPABASE TABLES USED:
- rfq_requests (lookup active RFQs)
- vendors (upsert vendor records)
- vendor_offers (store quotation details)
- rfq_events (log all events)
- email_logs (track email processing)
- workflow_executions (monitor runs)

The workflow must accurately identify material compliance issues and maintain vendor communication.
```

## Workflow 3: Commercial Gatekeeper

```
Create a workflow that runs every hour to check if RFQs are ready for commercial evaluation.

TRIGGER:
- Schedule trigger every hour

PROCESS:
1. Query Supabase for all active RFQs with status "awaiting_responses"

2. For each RFQ:
   - Count approved/compliant vendor offers
   - Calculate days since RFQ created
   - Calculate days since first vendor response
   
3. Apply business rules:
   - If 3+ compliant vendors: Ready for evaluation
   - If 2 compliant vendors AND 7 days passed: Ready for evaluation
   - Otherwise: Continue waiting
   
4. For RFQs ready for evaluation:
   - Trigger commercial evaluation webhook
   - Update RFQ status to "under_evaluation"
   - Log gatekeeper decision with reasoning
   
5. Create summary report of all checks performed

This workflow ensures fair vendor participation while maintaining project timelines.
```

## Workflow 4: Evaluation & Decision Handler

```
Create a workflow that handles both automatic commercial evaluation and manual decision actions from the dashboard.

DUAL TRIGGERS:
- Webhook from gatekeeper for evaluation
- Webhook from dashboard for decisions (PO approval, rejection, negotiation)

EVALUATION PROCESS (from gatekeeper):
1. Fetch all compliant vendor offers for the RFQ from Supabase

2. Apply commercial scoring algorithm:
   - Price score (40% weight) - lowest price gets highest score
   - Delivery score (30% weight) - shortest delivery gets highest score
   - Payment terms score (20% weight) - best terms get highest score
   - Warranty score (10% weight) - longest warranty gets highest score
   
3. Calculate total scores and rank vendors

4. Use AI to generate executive summary including:
   - Recommendation with justification
   - Risk analysis
   - Price comparison
   - Key differentiators
   
5. Update all vendor offers with scores and rankings

6. Send evaluation report email to management with:
   - Summary table of all vendors
   - Recommendation
   - Link to dashboard for decision

DECISION HANDLING (from dashboard):
1. Validate incoming webhook data (action type, RFQ ID, vendor ID)

2. Based on action type:
   
   FOR APPROVAL:
   - Generate PO number
   - Create formal PO email using AI
   - Send PO to winning vendor
   - Send regret letters to other vendors
   - Create PO record in Supabase
   - Update RFQ status to "po_issued"
   
   FOR REJECTION:
   - Send regret letters to all vendors
   - Update RFQ status to "rejected"
   - Record rejection reason
   
   FOR NEGOTIATION:
   - Send negotiation request to specific vendor
   - Update vendor status to "under_negotiation"
   - Set follow-up reminder

3. Log all actions in Supabase with full audit trail

This combined workflow handles both automatic evaluation and manual decisions efficiently.
```

## Database Context for All Workflows

Add this context to each workflow prompt:

```
Supabase Database Structure:
- rfq_requests: Main RFQ records
- vendors: Vendor master data
- vendor_offers: Quotations and scores
- rfq_events: Complete audit trail
- workflow_executions: Error logging
- purchase_orders: Final PO records

Key fields to maintain:
- rfq_id: Unique identifier (BQ-YYYYMMDDHHMMSS)
- vendor_id: Vendor code (9V-XXXX format)
- compliance_status: 'compliant' or 'non-compliant' based on material grade
- status: Track RFQ lifecycle (initiated → awaiting_responses → under_evaluation → po_issued/rejected)
```

## Usage Instructions

1. Open n8n and click "New Workflow"
2. Select "Build with AI" option
3. Copy the entire prompt for the workflow you're building
4. Paste into the AI builder
5. Review the generated workflow
6. Configure credentials (Gmail, Supabase, OpenAI)
7. Test with sample data

## Important Notes

- All workflows use GPT-4o model (temperature 0.3)
- Gmail needs OAuth authentication, not username/password
- Supabase needs Service Role Key for full access
- Test each workflow individually before connecting them
