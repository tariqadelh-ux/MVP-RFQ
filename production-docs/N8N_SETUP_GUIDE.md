# n8n Production Setup Guide

## Overview
This guide walks through setting up all production workflows in n8n with proper credentials, environment variables, and automatic orchestration.

## Prerequisites

1. **n8n Instance**: Running n8n (self-hosted or cloud)
2. **Supabase Project**: Active project with schema deployed
3. **Gmail Account**: With OAuth2 enabled
4. **Google Drive**: With API access
5. **OpenAI Account**: With ChatGPT 5 API access

## Environment Variables

Add these to your n8n environment:

```bash
# n8n Configuration
N8N_WEBHOOK_BASE_URL=https://your-n8n-domain.com

# Supabase Configuration
SUPABASE_URL=https://lqrdkfnvuihoexample.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Dashboard Configuration
DASHBOARD_URL=https://your-dashboard-domain.com

# Email Configuration
GMAIL_POLL_INTERVAL=5  # minutes
```

## Step 1: Create Credentials

### 1.1 Supabase API Credential
1. Go to n8n → Credentials → Add Credential
2. Select "Supabase API"
3. Name: `supabase-api`
4. URL: Your Supabase URL (without /rest/v1)
5. Service Role Key: From Supabase dashboard → Settings → API

### 1.2 OpenAI ChatGPT 5 Credential
1. Add Credential → OpenAI API
2. Name: `openai-chatgpt5`
3. API Key: Your OpenAI API key

### 1.3 Gmail OAuth2
1. Add Credential → Gmail OAuth2
2. Name: `gmail-oauth2`
3. Follow OAuth2 setup flow
4. Ensure these scopes are enabled:
   - Gmail Send
   - Gmail Read
   - Gmail Modify

### 1.4 Google Sheets OAuth2
1. Add Credential → Google Sheets OAuth2
2. Name: `google-sheets-oauth`
3. Use same OAuth app as Gmail

### 1.5 Google Drive OAuth2
1. Add Credential → Google Drive OAuth2
2. Name: `google-drive-oauth`
3. Use same OAuth app as Gmail

## Step 2: Import Workflows

### Import Order (Important!)
Import workflows in this specific order to avoid dependency issues:

1. **Email Processor** (`email-processor-production.json`)
2. **Commercial Evaluation** (`commercial-evaluation-production.json`)
3. **Commercial Gatekeeper** (`commercial-gatekeeper-production.json`)
4. **Main Processor** (`main-processor-production.json`)
5. **Webhook Handler** (`webhook-handler-production.json`)

### Import Steps
1. Go to n8n → Workflows
2. Click "Add Workflow" → "Import from File"
3. Select the JSON file
4. After import, update webhook URLs if needed

## Step 3: Configure Webhook URLs

After importing, update internal webhook calls:

### In Commercial Gatekeeper
Find the "Trigger Commercial Evaluation" node and update:
```json
"url": "http://localhost:5678/webhook/commercial-evaluation"
```
Change to your actual n8n URL if not running locally.

### In Main Processor
The webhook path is: `/webhook/create-rfq`
Full URL: `https://your-n8n-domain.com/webhook/create-rfq`

### In Webhook Handler
The webhook path is: `/webhook/rfq-decision`
Full URL: `https://your-n8n-domain.com/webhook/rfq-decision`

## Step 4: Gmail IMAP Configuration

### Enable IMAP in Gmail
1. Gmail Settings → Forwarding and POP/IMAP
2. Enable IMAP
3. Save Changes

### Configure Email Processor
1. Open Email Processor workflow
2. Edit "Gmail IMAP Trigger" node
3. Set:
   - Mailbox: `INBOX`
   - Poll Interval: `5` minutes
   - Search Query: `is:unread subject:RFQ OR subject:Quotation`

## Step 5: Configure Scheduled Triggers

### Commercial Gatekeeper Schedule
1. Open Commercial Gatekeeper workflow
2. Edit "Check Every Hour" node
3. Verify schedule is set to run every hour
4. Activate the workflow

## Step 6: Test Individual Workflows

### Test Email Processor
```bash
# Send test email to your Gmail with:
Subject: RFQ 450-012547 - Vendor Response
Body: Attached is our quotation for the heat exchanger
Attachment: Sample quotation PDF
```

### Test Main Processor
```bash
curl -X POST https://your-n8n-domain.com/webhook/create-rfq \
  -H "Content-Type: application/json" \
  -d '{
    "project_memo_id": "your-google-drive-file-id",
    "avl_sheet_id": "your-google-sheet-id"
  }'
```

### Test Commercial Evaluation
Wait for Gatekeeper to trigger it automatically, or manually trigger with:
```bash
curl -X POST http://localhost:5678/webhook/commercial-evaluation \
  -H "Content-Type: application/json" \
  -d '{
    "rfq_id": "BQ-20251029123456",
    "vendor_count": 3,
    "trigger_reason": "Manual test"
  }'
```

## Step 7: Activate All Workflows

### Activation Order
1. Email Processor - Activate first (continuous monitoring)
2. Commercial Evaluation - Activate second (receives triggers)
3. Webhook Handler - Activate third (receives dashboard actions)
4. Commercial Gatekeeper - Activate fourth (scheduled checks)
5. Main Processor - Activate last (creates new RFQs)

## Step 8: Monitor Workflow Health

### Check Supabase Logs
```sql
-- Recent workflow executions
SELECT * FROM workflow_executions 
ORDER BY started_at DESC 
LIMIT 20;

-- Recent RFQ events
SELECT * FROM rfq_events 
ORDER BY event_timestamp DESC 
LIMIT 50;

-- Active RFQs
SELECT * FROM rfq_requests 
WHERE status IN ('awaiting_responses', 'evaluation_in_progress');
```

### n8n Execution History
1. Go to n8n → Executions
2. Filter by workflow
3. Check for errors or warnings

## Step 9: Production Checklist

- [ ] All credentials created and tested
- [ ] Environment variables set
- [ ] Workflows imported in correct order
- [ ] Webhook URLs updated to production URLs
- [ ] Gmail IMAP enabled and configured
- [ ] Scheduled triggers verified
- [ ] Individual workflow tests passed
- [ ] All workflows activated
- [ ] Monitoring queries saved
- [ ] Error notifications configured

## Step 10: Setup Error Notifications

### Email Notifications for Errors
1. In each workflow, the Error Trigger is already configured
2. Update email addresses in error notification nodes
3. Consider adding Slack or SMS notifications

### Dashboard for Monitoring
Create a simple monitoring dashboard showing:
- Active RFQs count
- Pending evaluations
- Recent errors
- Workflow execution status

## Troubleshooting

### Common Issues

1. **Gmail not receiving emails**
   - Check IMAP is enabled
   - Verify OAuth scopes
   - Check spam folder

2. **Webhooks not triggering**
   - Verify webhook URLs are accessible
   - Check n8n is publicly accessible
   - Review webhook logs

3. **Supabase connection errors**
   - Verify Service Role Key
   - Check Supabase URL format
   - Ensure RLS policies allow access

4. **OpenAI errors**
   - Check API key is valid
   - Verify ChatGPT 5 model access
   - Monitor token usage

## Maintenance

### Daily Tasks
- Check execution logs for errors
- Monitor email processing queue
- Verify scheduled tasks are running

### Weekly Tasks
- Review workflow performance
- Check Supabase storage usage
- Update vendor email filters if needed

### Monthly Tasks
- Archive old execution logs
- Review and optimize workflows
- Update documentation

## Support Resources

- n8n Documentation: https://docs.n8n.io
- Supabase Documentation: https://supabase.com/docs
- OpenAI API Reference: https://platform.openai.com/docs
- Project Repository: [Your GitHub repo]

---

**Important**: Keep this guide updated as you modify workflows or discover new configuration requirements!
