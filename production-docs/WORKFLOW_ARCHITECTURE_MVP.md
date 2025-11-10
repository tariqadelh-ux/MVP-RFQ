# MVP Workflow Architecture - 4 Workflows Design

## Architecture Decision: October 30, 2025

After analysis and implementation, we've consolidated from 5 workflows to 4 workflows for the MVP RFQ Automation System. This document captures the final architecture and AI builder prompts used.

## Why 4 Workflows Instead of 5?

### Key Benefits:
1. **Different Triggers**: Email monitoring (IMAP), hourly schedules, and webhooks require separate workflows
2. **Parallel Processing**: Multiple RFQs at different stages need independent processing
3. **Error Isolation**: One workflow failing won't crash the entire system
4. **Easier Monitoring**: Track each stage separately
5. **Combined Logic**: Evaluation and decision handling merged since they operate on the same data

## The 4 MVP Workflows

### 1. RFQ Creation & Management Workflow
**Trigger**: Gmail IMAP - monitors for procurement emails every 5 minutes
**Purpose**: Creates RFQs from management emails and sends to vendors
**Key Features**:
- PDF memo extraction
- AI-powered data extraction
- AVL lookup and vendor selection
- Automated RFQ distribution

### 2. Vendor Response Processing Workflow  
**Trigger**: Gmail IMAP - monitors for vendor responses every 5 minutes
**Purpose**: Processes vendor quotations and compliance checks
**Key Features**:
- PDF quotation extraction
- Material compliance verification
- Automatic TBC for non-compliant offers
- Real-time offer storage

### 3. Commercial Gatekeeper Workflow
**Trigger**: Schedule - runs every hour
**Purpose**: Determines when RFQs are ready for evaluation
**Key Features**:
- Quorum logic (3+ vendors or 2+ after 7 days)
- Automatic status progression
- Audit trail of decisions

### 4. Evaluation & Decision Handler Workflow
**Trigger**: Dual - webhooks from both gatekeeper and dashboard
**Purpose**: Handles commercial evaluation AND manual decisions
**Key Features**:
- Commercial scoring algorithm
- AI-generated executive summaries
- PO issuance
- Vendor communication
- Complete decision handling

## Data Flow

```
Management Email → Workflow 1 → RFQ Created → Vendors Notified
                                      ↓
Vendor Emails → Workflow 2 → Offers Stored → Compliance Checked
                                      ↓
Hourly Check → Workflow 3 → Quorum Met → Trigger Evaluation
                                      ↓
Evaluation → Workflow 4 → Score & Rank → Email Report
                    ↓
Dashboard Decision → Workflow 4 → PO/Rejection/Negotiation
```

## Database Tables Used

1. **rfq_requests** - Main RFQ records
2. **vendors** - Vendor master data with performance metrics
3. **vendor_offers** - Quotations with scores and compliance
4. **rfq_events** - Complete audit trail
5. **workflow_executions** - Workflow run history
6. **purchase_orders** - Final PO records
7. **email_logs** - Email communication tracking
8. **gatekeeper_logs** - Gatekeeper decision history

## Key Design Decisions

1. **Email-First Architecture**: Everything starts with email, no manual data entry
2. **AI-Powered Extraction**: ChatGPT handles all unstructured data extraction
3. **Real-Time Updates**: Supabase provides instant dashboard updates
4. **Compliance Focus**: Material grade checking is mandatory
5. **Audit Everything**: Complete trail for compliance and analysis

## Implementation Status

- [x] Workflow 1: RFQ Creation & Management - Built with AI Builder
- [ ] Workflow 2: Vendor Response Processing - In Progress
- [ ] Workflow 3: Commercial Gatekeeper - Pending
- [ ] Workflow 4: Evaluation & Decision Handler - Pending

## AI Model Configuration

All workflows use:
- **Model**: GPT-4o (initially planned for GPT-5)
- **Purpose**: Document extraction, email generation, summarization
- **Temperature**: 0.3 for consistency

## Environment Requirements

- n8n instance with Gmail OAuth
- OpenAI API access
- Supabase project with proper schema
- Google Sheets/Drive access for AVL

## Next Steps

1. Complete remaining 3 workflows using AI Builder
2. Configure all credentials in n8n
3. Test end-to-end flow with sample data
4. Deploy to production environment

---

*This architecture represents the production-ready design for 24/7 automated RFQ processing.*
