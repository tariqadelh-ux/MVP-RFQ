# Email Processor Workflow Transformation Guide

## Overview
This guide details how the email processor workflow was transformed from a demo with hard-coded vendor logic to a production-ready system using ChatGPT 5 and Supabase.

## Key Transformations

### 1. Email Monitoring (Lines 3-20)
**Before**: Manual trigger or basic Gmail trigger
**After**: Production Gmail trigger with:
- Every 5 minutes polling
- Automatic filtering for RFQ emails
- Attachment download enabled
- Unread email filtering

### 2. Vendor Detection (Lines 22-65)
**Before**: Hard-coded vendor mapping
```javascript
if (email.includes('vendor.a')) {
  vendorName = 'Vendor A Industries';
}
```

**After**: ChatGPT 5 extraction
```json
{
  "model": "gpt-5",
  "messages": [
    {
      "role": "system",
      "content": "Extract vendor information from RFQ response emails..."
    }
  ],
  "temperature": 0.1
}
```

### 3. Data Storage
**Before**: Google Sheets updates
**After**: Supabase database with:
- `email_logs` - Email tracking
- `vendors` - Automatic vendor creation
- `vendor_offers` - Quotation storage
- `rfq_events` - Real-time event logging

### 4. Document Analysis
**Before**: Fixed material grade extraction
**After**: ChatGPT 5 document analysis that:
- Extracts pricing from any format
- Validates technical compliance
- Handles multiple currencies
- Extracts delivery and payment terms

## Configuration Steps

### Step 1: Set Up n8n Credentials

1. **OpenAI ChatGPT 5 Credential**
   - Name: `OpenAI ChatGPT 5`
   - API Key: Your ChatGPT 5 API key
   - Model Access: Ensure gpt-5 is available

2. **Supabase Credential**
   - Name: `Supabase Production`
   - Host: `https://wmxtnjkofbfxcjigimwe.supabase.co`
   - Service Role Key: (Get from Supabase dashboard)

3. **Gmail Credential**
   - Name: `Gmail RFQ Monitor`
   - Configure OAuth2 with proper scopes
   - Enable Gmail API in Google Console

### Step 2: Import the Workflow

1. Copy `email-processor-production.json`
2. In n8n, go to Workflows > Import
3. Paste the JSON content
4. Update credential references

### Step 3: Configure Nodes

#### Gmail Trigger Node
- Verify email filter query matches your RFQ format
- Adjust polling interval if needed (default: 5 minutes)
- Test with a sample RFQ email

#### ChatGPT 5 Nodes
Both extraction nodes use the same pattern:
1. System prompt defines the extraction task
2. Temperature set to 0.1 for consistency
3. JSON response format enforced

#### Supabase Nodes
Each node targets specific tables:
- `email_logs` - Records all incoming emails
- `vendors` - Creates new vendors automatically
- `vendor_offers` - Stores quotation data
- `rfq_events` - Logs events for dashboard

### Step 4: Test the Workflow

1. **Send Test Email**
   ```
   Subject: RFQ 450-012547 - Vendor Response
   Body: Attached is our quotation for heat exchangers
   Attachment: PDF quotation
   ```

2. **Verify Data Flow**
   - Check email appears in `email_logs`
   - Vendor created/found in `vendors`
   - Event logged in `rfq_events`
   - If attachment, document analyzed

3. **Monitor Execution**
   - Check n8n execution logs
   - Verify Supabase data insertion
   - Review ChatGPT confidence scores

## Production Considerations

### Error Handling
The workflow includes:
- Error trigger for all failures
- Error logging to `workflow_executions`
- Graceful handling of missing data

### Performance
- Processes emails individually to avoid timeouts
- ChatGPT 5 provides faster response times
- Supabase operations are optimized

### Monitoring
Track these metrics:
- Email processing time
- AI extraction accuracy
- Vendor response rates
- Error frequency

## Troubleshooting

### Common Issues

1. **Gmail Not Triggering**
   - Verify OAuth scopes include email read
   - Check filter query syntax
   - Ensure emails marked as unread

2. **ChatGPT Errors**
   - Verify API key has gpt-5 access
   - Check rate limits not exceeded
   - Review prompt for clarity

3. **Supabase Failures**
   - Confirm service role key is correct
   - Check RLS policies allow inserts
   - Verify table names match schema

### Debug Mode
Enable debug mode by:
1. Setting workflow to manual execution
2. Using test email data
3. Checking each node output

## Migration Checklist

- [ ] Create n8n credentials for OpenAI, Supabase, Gmail
- [ ] Import production workflow JSON
- [ ] Update credential references in all nodes
- [ ] Test with sample vendor email
- [ ] Verify data appears in Supabase
- [ ] Check event logging works
- [ ] Enable workflow for production
- [ ] Monitor first 24 hours of operation

## Rollback Plan

If issues arise:
1. Disable production workflow
2. Re-enable demo workflow temporarily
3. Investigate Supabase error logs
4. Fix issues and re-deploy

## Next Steps

After email processor is working:
1. Transform commercial evaluation workflow
2. Update webhook handler for dashboard
3. Add comprehensive error notifications
4. Implement performance monitoring
