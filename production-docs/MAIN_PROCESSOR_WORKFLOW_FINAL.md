# Main Processor Workflow - Final Production Version

## Overview
The **Automated Procurement RFQ Generation and Vendor Distribution System** is the first and most critical workflow in the RFQ automation system. It monitors Gmail for procurement requests from management, extracts requirements using AI, creates RFQs in Supabase, and distributes them to approved vendors.

## Workflow Identity
- **Name**: Automated Procurement RFQ Generation and Vendor Distribution System
- **ID**: wO12XpPCGbXMgm5M
- **Trigger**: Gmail IMAP (5-minute polling)
- **Status**: Production-Ready

## Key Features

### 1. **Intelligent Document Processing**
- Automatically identifies and scores PDF relevance from multiple attachments
- Falls back to email body extraction if PDF extraction fails
- Handles multiple memo formats and intelligently matches them

### 2. **Retry Logic and Error Recovery**
- AVL retry mechanism: Waits 1 hour and retries if AVL not found
- Memo upload retry: Monitors Google Drive folder for manual uploads
- Quality assessment: Flags low-quality extractions for manual review

### 3. **Comprehensive Logging**
- Every action is logged to Supabase for audit trail
- Extraction quality issues tracked separately
- Workflow execution history maintained

### 4. **Smart Vendor Management**
- Upserts vendor records to avoid duplicates
- Tracks last contacted timestamp
- Sends personalized RFQ emails to each vendor

## Process Flow

### Phase 1: Email Monitoring and Initial Processing
1. **Monitor Procurement Emails** - Polls Gmail every 5 minutes
2. **Check If Already Processed** - Prevents duplicate processing
3. **Extract Email Content and Attachments** - Identifies primary PDF

### Phase 2: Data Extraction with Quality Control
4. **Extract Text from PDF** - Primary extraction method
5. **AI Extraction** - Uses GPT-4 to extract procurement details
6. **Quality Assessment** - Checks completeness of extraction
7. **Fallback to Email Body** - If PDF extraction fails

### Phase 3: RFQ Creation and AVL Lookup
8. **Generate RFQ ID** - Creates unique identifier (BQ-YYYYMMDDHHMMSS)
9. **Insert RFQ Request** - Stores in Supabase
10. **Lookup AVL in Google Sheets** - Finds approved vendor list

### Phase 4: Vendor Processing
11. **Download AVL Document** - Gets vendor list from Google Drive
12. **Extract Vendor Details with AI** - Parses vendor information
13. **Vendor Loop** - For each vendor:
    - Upsert vendor record
    - Send RFQ email
    - Log email sent event

### Phase 5: Completion and Cleanup
14. **Update RFQ Status** - Sets to "awaiting_responses"
15. **Mark Email as Processed** - Adds Gmail label
16. **Log Workflow Execution** - Records success

## Error Handling Paths

### AVL Not Found Path
- Logs AVL not found event
- Notifies dev team
- Updates RFQ status to "pending_avl"
- Waits 1 hour and retries

### Low Quality Extraction Path
- Logs extraction quality issue
- Notifies dev team for manual upload
- Waits for memo upload to Google Drive
- Intelligently matches uploaded files
- Re-extracts from uploaded memo

## Supabase Tables Used

### 1. **rfq_requests** (Main RFQ Records)
```sql
Fields Written:
- rfq_id (TEXT) - Unique identifier
- nine_com_number (TEXT) - 9COM reference
- project_name (TEXT)
- project_id (TEXT)
- material_description (TEXT)
- specifications (TEXT)
- quantity (INTEGER)
- critical_requirements (TEXT)
- wbs_code (TEXT)
- estimated_value (NUMERIC)
- delivery_location (TEXT)
- delivery_timeline (TEXT)
- status (TEXT) - 'initiated', 'awaiting_responses', 'pending_avl'
- response_deadline (TIMESTAMPTZ)
- vendor_count (INTEGER) - Updated after sending emails
```

### 2. **vendors** (Vendor Master Data)
```sql
Fields Written:
- vendor_name (TEXT)
- vendor_email (TEXT)
- contact_person (TEXT)
- phone_number (TEXT)
- last_contacted (TIMESTAMPTZ) - Set to current time
```

### 3. **rfq_events** (Event Logging)
```sql
Fields Written:
- rfq_id (TEXT)
- event_type (TEXT) - 'email_sent', 'avl_not_found'
- vendor_email (TEXT) - For email_sent events
- vendor_name (TEXT) - For email_sent events
- nine_com_number (TEXT) - For avl_not_found events
- project_name (TEXT) - For avl_not_found events
- event_timestamp (TIMESTAMPTZ)
```

### 4. **workflow_executions** (Workflow History)
```sql
Fields Written:
- workflow_name (TEXT) - 'RFQ Generation'
- status (TEXT) - 'success'
- rfq_id (TEXT)
- vendor_count (INTEGER)
- completed_at (TIMESTAMPTZ)
```

### 5. **extraction_quality_issues** (Quality Tracking)
```sql
Fields Written:
- email_id (TEXT) - Gmail message ID
- extraction_method (TEXT) - 'pdf' or 'email_body'
- quality_score (NUMERIC)
- missing_fields (TEXT[])
- status (TEXT) - 'pending_manual_review'
- created_at (TIMESTAMPTZ)
```

## Environment Variables Required
```env
# Gmail Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=https://wmxtnjkofbfxcjigimwe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Drive/Sheets Configuration
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret

# Workflow Configuration
MANAGEMENT_EMAIL=binquraya.procurement.demo+management@gmail.com
PROCUREMENT_TEAM_EMAIL=binquraya.procurement.demo@gmail.com
DEV_TEAM_EMAIL=Tariq.alhashim@davonmt.com
PROJECT_INITIATION_FOLDER_ID=1ApIYu-Gwng55rT4Isb2AKgrAS03-T1y8
```

## Key Improvements in This Version

1. **Multiple PDF Handling**: Intelligently scores and selects the most relevant PDF
2. **Retry Mechanisms**: Both AVL and memo upload have retry loops
3. **Quality Assessment**: Validates extraction completeness before proceeding
4. **Intelligent File Matching**: Uses relevance scoring for uploaded memos
5. **Comprehensive Error Handling**: Multiple fallback paths and notifications
6. **Vendor Upsert**: Prevents duplicate vendor records
7. **Last Contacted Tracking**: Maintains vendor engagement history

## Integration Points for Next Workflows

### Data Available for Workflow 2 (Vendor Response Processing):
- Active RFQs with status "awaiting_responses" in `rfq_requests`
- Vendor list with emails in `vendors` table
- RFQ sent timestamps in `rfq_events`

### Data Available for Workflow 3 (Commercial Gatekeeper):
- RFQ status and vendor counts in `rfq_requests`
- Email sent events in `rfq_events`
- Workflow execution history in `workflow_executions`

### Data Available for Workflow 4 (Evaluation & Decision Handler):
- Complete RFQ details in `rfq_requests`
- Vendor information in `vendors`
- Full event history in `rfq_events`

## Testing Checklist

- [ ] Gmail trigger receives test procurement email
- [ ] PDF extraction works with sample procurement memo
- [ ] AI extracts all required fields correctly
- [ ] RFQ record created in Supabase
- [ ] AVL lookup finds correct vendor list
- [ ] Vendor records created/updated
- [ ] RFQ emails sent to all vendors
- [ ] Email marked as processed in Gmail
- [ ] All events logged correctly
- [ ] Error paths work (AVL not found, low quality extraction)

## Notes for Dashboard Development

This workflow provides the following data points for dashboard:
- Total RFQs created (count of `rfq_requests`)
- RFQs by status (group by `status` field)
- Vendor participation (from `vendor_count` field)
- Extraction quality metrics (from `extraction_quality_issues`)
- Processing time trends (from `workflow_executions`)
- Event timeline (from `rfq_events`)

---

*This workflow forms the foundation of the automated RFQ system, ensuring reliable procurement request processing with comprehensive error handling and audit trails.*
