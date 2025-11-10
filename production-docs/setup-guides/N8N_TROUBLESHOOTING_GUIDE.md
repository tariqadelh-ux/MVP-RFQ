# n8n Workflow Troubleshooting Guide

## Common Error: "new row violates row-level security policy"

This error message is misleading! It can be caused by several different issues:

### 1. Wrong API Key (Most Common)
**Symptom**: RLS policy violation errors
**Cause**: Using Anon Key instead of Service Role Key
**Solution**: Use the Service Role Key from Supabase Dashboard > Settings > API

### 2. Missing Required Fields (Your Case!)
**Symptom**: Same RLS error, but it's actually a constraint violation
**Cause**: Database has NOT NULL columns that workflow doesn't provide
**Solution**: Either:
- Add the missing field to your workflow
- Make the field optional in the database (what we did)

### 3. Actual RLS Issues (Rare with Service Role Key)
**Symptom**: RLS errors even with Service Role Key
**Cause**: Misconfigured RLS policies
**Solution**: Ensure policies have WITH CHECK clauses for INSERT

## How to Debug Supabase Errors in n8n

### Step 1: Test Database Connection
Create a simple test workflow:
```
1. Manual Trigger
2. Supabase Node (Get Many from any table)
3. Debug Node
```

### Step 2: Check Required Fields
Run this SQL in Supabase to see all required fields:
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table_name'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;
```

### Step 3: Test Your Insert
Use the test query in `/production-docs/TEST_INSERT_QUERY.sql`

### Step 4: Check Your Workflow Fields
In your n8n Supabase node, ensure you're providing ALL required fields:
- Look for fields marked `NOT NULL` in the database
- Check field names match exactly (case-sensitive)
- Verify data types match (text, integer, etc.)

## Field Mapping Issues We Fixed

### Issue 1: Missing commodity_code in rfq_requests
**Error**: "new row violates row-level security policy" (misleading)
**Actual Issue**: commodity_code was required but workflow didn't provide it
**Solution**: Made commodity_code nullable

### Issue 2: Missing vendor_id in vendors
**Error**: "null value in column vendor_id violates not-null constraint"
**Actual Issue**: vendor_id was required but workflow didn't provide it
**Solution**: Added auto-generation function that creates vendor_id in format 9V-NNNN

### Issue 3: Missing title in rfq_events
**Error**: "null value in column title violates not-null constraint"
**Actual Issue**: title was required but workflow didn't provide it
**Solution**: Added auto-generation based on event_type with smart defaults

Event Type → Auto-Generated Title:
- email_sent → "RFQ Email Sent to Vendor"
- vendor_responded → "Vendor Response Received"
- avl_not_found → "AVL Lookup Failed"
- tbc_sent → "Technical Bid Clarification Sent"
- evaluation_started → "Commercial Evaluation Started"
- po_issued → "Purchase Order Issued"
- Other types → Capitalized event type with underscores replaced

## Pro Tips

1. **Always check the actual error**: Supabase often returns generic RLS errors for various issues
2. **Test incrementally**: Add fields one by one to identify issues
3. **Use Debug nodes**: Place them after Supabase nodes to see what data is being sent
4. **Check the SQL editor**: Test your operations directly in Supabase first

## Quick Checks

Run these in order when troubleshooting:

1. **Check RLS Status**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'rfq_requests';
```

2. **Check Required Fields**:
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rfq_requests' 
AND is_nullable = 'NO';
```

3. **Check Current Policies**:
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'rfq_requests';
```

---

Remember: The error message isn't always accurate! Check all possible causes.
