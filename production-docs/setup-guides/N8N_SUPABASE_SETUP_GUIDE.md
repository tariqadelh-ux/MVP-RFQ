# n8n Supabase Credential Setup Guide

## 🚨 CRITICAL: Use the Correct API Key!

The #1 cause of "row-level security policy" errors is using the wrong API key in n8n.

## Step 1: Get Your Service Role Key

1. Open [Supabase Dashboard](https://app.supabase.com/project/wmxtnjkofbfxcjigimwe/settings/api)
2. Go to **Settings** → **API**
3. Find the section labeled **Project API keys**
4. You will see two keys:
   - **anon (public)**: ❌ DO NOT USE THIS
   - **service_role (secret)**: ✅ USE THIS ONE

5. Copy the **service_role** key (it's much longer than the anon key)

## Step 2: Configure n8n Credentials

1. In n8n, go to **Credentials** (left sidebar)
2. Find your Supabase credential or create a new one
3. Set it up as follows:

```
Host: https://wmxtnjkofbfxcjigimwe.supabase.co
Service Role Secret: [PASTE YOUR SERVICE ROLE KEY HERE]
```

⚠️ **Make sure you're pasting the service_role key, NOT the anon key!**

## Step 3: Verify Your Setup

### Quick Test in n8n:

1. Create a simple workflow with just a Supabase node
2. Configure it to read from `rfq_requests` table:
   - Operation: Get Many
   - Table: rfq_requests
   - Return All: Yes
3. Execute the node

If this works, your credentials are correct!

## Step 4: Update Your Main Processor Workflow

1. Open your Main Processor AI workflow
2. Click on ANY Supabase node
3. In the credentials dropdown, make sure it's using the credential with the Service Role Key
4. Save the workflow

## Common Mistakes to Avoid

### ❌ Using the Anon Key
The anon key looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndteHRuamtvZmJmeGNqaWdpbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDQ2NjEsImV4cCI6MjA3NzMyMDY2MX0.6dmU9_-ZING89JUVqbWm2_EQA6t4xaAcEzEd_IqLpDE
```

### ✅ Using the Service Role Key
The service role key is MUCH longer and starts similarly but has different content.

## Troubleshooting

### Still Getting RLS Errors?

1. **Double-check your key**: The service role key is significantly longer than the anon key
2. **Check all Supabase nodes**: Each node in your workflow needs to use the same credential
3. **Try a fresh credential**: Delete and recreate the Supabase credential in n8n

### Test Query
Run this in your Supabase SQL editor to check RLS status:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'rfq_requests';
```

## TEMPORARY: RLS Disabled for Testing

I've temporarily disabled RLS on rfq_requests to help you test. Once you've confirmed your workflow works:

1. Test your workflow - it should work now
2. Fix your credentials to use the service_role key
3. Let me know so I can re-enable RLS for security

---

**Remember**: The service_role key has FULL database access. Keep it secure and only use it in server-side applications like n8n!
