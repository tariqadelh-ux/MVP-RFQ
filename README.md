# MVP-RFQ

## MVP RFQ Automation System

An automated Request for Quotation (RFQ) processing system built with n8n workflows and Supabase.

### Overview

This system automates the RFQ process by:
- Processing incoming RFQ emails with AI extraction
- Looking up approved vendors from Google Sheets AVL
- Automatically distributing RFQs to qualified vendors
- Tracking all activities and responses in Supabase

### Key Components

1. **n8n Workflows**
   - Main Processor (Workflow 1): Email intake and vendor distribution
   - Response Handler (Workflow 2): Vendor response processing
   - Follow-up Automation (Workflow 3): Reminder emails
   - Dashboard Integration (Workflow 4): Real-time updates

2. **Database**
   - Supabase PostgreSQL for data persistence
   - Tables: rfq_requests, vendors, rfq_events, workflow_executions

3. **Integrations**
   - Gmail for email monitoring
   - Google Sheets for AVL lookup
   - Google Drive for document storage
   - OpenAI for intelligent data extraction

### Documentation

- `/production-docs/` - Complete system documentation
- `/supabase/` - Database schema and migrations
- `/workflows MVP/` - n8n workflow files and fixes

### Quick Start

1. Set up Supabase project with provided schema
2. Configure n8n with Gmail, Google, and OpenAI credentials
3. Import main workflow from `workflows MVP/Updated N8n workflow/`
4. Update Google Sheets with vendor AVL data
5. Test with scenarios in `TEST_SCENARIOS_DATABASE_RESULTS.md`

### MVP Dashboard

See `production-docs/MVP_DASHBOARD_DEVELOPER_REFERENCE.md` for building the dashboard.

### Status

✅ Main workflow tested and production-ready
✅ Database schema finalized
✅ Test scenarios documented
🚧 Dashboard development in progress
