# Workflow Import Fix Documentation

## Issues Found in Original JSON Files

The production workflow JSON files had several issues preventing n8n import:

### 1. **Connections Using Node Names Instead of IDs**
- **Issue**: The connections object used node names (e.g., "Webhook - Create RFQ") as keys
- **Fix**: Changed to use node IDs (e.g., "webhook-trigger")

### 2. **Credential References**
- **Issue**: Referenced non-existent credential IDs like "openai-chatgpt5", "supabase-api"
- **Fix**: Removed credential references - you'll add them in n8n UI

### 3. **Extra Metadata Fields**
- **Issue**: Fields like `versionId`, `triggerCount`, `tags`, `meta`, `pinData`
- **Fix**: Removed these fields - n8n adds them automatically

### 4. **ChatGPT Model References**
- **Issue**: Referenced "gpt-5" which doesn't exist in OpenAI
- **Fix**: Changed to "gpt-4o" (you can update to GPT-5 when available)

### 5. **Supabase Authentication**
- **Issue**: Used `predefinedCredentialType` with `supabaseApi`
- **Fix**: Changed to generic HTTP auth with headers

## Import Instructions

1. **Import the Fixed File**
   - Use `main-processor-production-fixed.json`
   - Import via n8n UI: Settings → Workflows → Import

2. **Configure Credentials** (in this order):
   
   a. **OpenAI**
      - Add OpenAI credentials in n8n
      - Update all OpenAI nodes to use these credentials
      - Change model to "gpt-5" when available

   b. **Google Services**
      - Add Google Drive OAuth2
      - Add Google Sheets OAuth2
      - Add Gmail OAuth2
      - Connect to all Google nodes

   c. **Supabase** (via environment variables)
      - Set `SUPABASE_URL` in n8n environment
      - Set `SUPABASE_ANON_KEY` in n8n environment

3. **Test the Workflow**
   - Use the webhook test URL
   - Send test payload:
   ```json
   {
     "project_memo_id": "YOUR_GOOGLE_DRIVE_FILE_ID",
     "avl_sheet_id": "YOUR_GOOGLE_SHEET_ID"
   }
   ```

## Common Import Errors and Solutions

### "Invalid JSON"
- Use the fixed file, not the original
- Check for trailing commas or syntax errors

### "Node type not found"
- Ensure n8n is updated to latest version
- Install community nodes if needed

### "Invalid connection"
- Connections must reference node IDs, not names
- Each connection needs proper structure

## Environment Variables Required

```bash
# n8n environment
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Post-Import Checklist

- [ ] All nodes show green (no errors)
- [ ] OpenAI credentials configured
- [ ] Google credentials configured  
- [ ] Supabase environment variables set
- [ ] Webhook URL noted for testing
- [ ] Workflow saved and activated

## Notes for Other Workflows

Apply the same fixes to:
- `email-processor-production.json`
- `commercial-evaluation-production.json`
- `commercial-gatekeeper-production.json`
- `webhook-handler-production.json`

Key changes needed:
1. Fix connections object to use node IDs
2. Remove credential IDs
3. Remove extra metadata
4. Update authentication methods
5. Fix model references
