# n8n Workflow Import Guide - COMPLETE

## ✅ All Workflows Fixed!

I've successfully fixed all 5 production workflows for import into n8n. The fixed files are:

1. ✅ `main-processor-production-fixed.json`
2. ✅ `email-processor-production-fixed.json`
3. ✅ `commercial-evaluation-production-fixed.json`
4. ✅ `commercial-gatekeeper-production-fixed.json`
5. ✅ `webhook-handler-production-fixed.json`

## What Was Wrong?

The original workflow files had several issues:

1. **JSON Syntax Error**: `webhook-handler-production.json` had an extra quote on line 338
2. **Connections Using Names**: All workflows used node names instead of IDs in connections
3. **Credential References**: Referenced non-existent credentials 
4. **ChatGPT Model**: Referenced "gpt-5" which doesn't exist yet
5. **Extra Metadata**: Contains fields that n8n doesn't accept during import

## Import Instructions

### Step 1: Import Workflows

1. Open n8n interface
2. Go to **Workflows** section
3. Click **Import** button
4. Import in this order:
   - `main-processor-production-fixed.json`
   - `email-processor-production-fixed.json`
   - `commercial-gatekeeper-production-fixed.json`
   - `commercial-evaluation-production-fixed.json`
   - `webhook-handler-production-fixed.json`

### Step 2: Configure Credentials

After importing, you need to add credentials for each service:

#### OpenAI (for ChatGPT)
1. Go to **Credentials** → **New**
2. Select **OpenAI API**
3. Enter your API key
4. Name it (e.g., "OpenAI Production")
5. Update all OpenAI nodes to use this credential

#### Google Services
1. **Google Drive OAuth2**
   - For downloading memos and AVL documents
2. **Google Sheets OAuth2**
   - For reading AVL master list
3. **Gmail OAuth2**
   - For sending emails and monitoring inbox

#### Supabase
Add these environment variables to n8n:
```bash
SUPABASE_URL=https://tlqrihucsovwiixfqkib.supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

### Step 3: Update Model References

When ChatGPT 5 becomes available:
1. Edit each OpenAI node
2. Change model from `gpt-4o` to `gpt-5`

### Step 4: Configure Triggers

#### Email Processor
- IMAP trigger is set to check every 5 minutes
- Configure Gmail OAuth2 credentials

#### Commercial Gatekeeper
- Schedule trigger runs every hour
- Will activate automatically once saved

#### Webhook URLs
After activating workflows, note these URLs:
- Main Processor: `https://your-n8n.com/webhook/create-rfq`
- Commercial Evaluation: `https://your-n8n.com/webhook/commercial-evaluation`
- Webhook Handler: `https://your-n8n.com/webhook/rfq-decision`

### Step 5: Test Each Workflow

#### Test Main Processor:
```bash
curl -X POST https://your-n8n.com/webhook/create-rfq \
  -H "Content-Type: application/json" \
  -d '{
    "project_memo_id": "YOUR_GOOGLE_DRIVE_FILE_ID",
    "avl_sheet_id": "YOUR_GOOGLE_SHEET_ID"
  }'
```

#### Test Email Processor:
- Send a test email with subject containing "RFQ"
- Wait up to 5 minutes for processing

#### Test Commercial Gatekeeper:
- Will run automatically every hour
- Or manually execute from n8n UI

## Troubleshooting

### "Node type not found"
- Update n8n to latest version
- Ensure all node packages are installed

### "Invalid credentials"
- Double-check all credentials are configured
- Test each credential individually

### "Environment variable not found"
- Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set
- Restart n8n after adding environment variables

### Workflow doesn't trigger
- Check webhook URLs are correct
- Ensure workflows are activated (toggle switch ON)
- Check trigger configurations

## Quick Checklist

Before running in production:

- [ ] All 5 workflows imported successfully
- [ ] OpenAI credentials configured
- [ ] Google Drive OAuth configured
- [ ] Google Sheets OAuth configured
- [ ] Gmail OAuth configured
- [ ] Supabase environment variables set
- [ ] All workflows show green (no errors)
- [ ] Webhook URLs documented
- [ ] Test data prepared
- [ ] Workflows activated

## Next Steps

1. Run end-to-end test with your templates
2. Monitor workflow executions in n8n
3. Check Supabase for data population
4. Verify email notifications work
5. Test dashboard interactions

## Support Files

- Original workflows: `/workflows MVP/*-production.json`
- Fixed workflows: `/workflows MVP/*-production-fixed.json`
- Fix script: `/scripts/fix-workflows.js`
- This guide: `/production-docs/WORKFLOW_IMPORT_GUIDE.md`

---

**Note**: The workflows are now ready for production use. They will automatically process RFQs 24/7 once activated and properly configured.
