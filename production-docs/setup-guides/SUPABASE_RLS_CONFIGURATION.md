# Supabase Row Level Security (RLS) Configuration

## Overview
This document details the RLS policies configured for the RFQ automation system's Supabase tables.

## Key Concepts

### Role Types in Supabase:
- **anon**: Public/anonymous access (uses Anon Key)
- **authenticated**: Logged-in users (uses Anon Key with JWT)
- **service_role**: Full access (uses Service Role Key - what n8n typically uses)

### RLS Policy Components:
- **USING**: Controls which rows can be selected/updated/deleted
- **WITH CHECK**: Controls which rows can be inserted/updated (required for INSERT)

## Current RLS Policies

### rfq_requests Table

1. **Service role full access**
   - Role: service_role
   - Operations: ALL (SELECT, INSERT, UPDATE, DELETE)
   - USING: true
   - WITH CHECK: true
   - Purpose: Allows n8n complete access when using Service Role Key

2. **Allow authenticated insert**
   - Role: authenticated
   - Operations: INSERT
   - WITH CHECK: true
   - Purpose: Allows authenticated users to create RFQs

3. **Allow anon insert**
   - Role: anon
   - Operations: INSERT
   - WITH CHECK: true
   - Purpose: Allows anonymous users to create RFQs (if n8n uses Anon Key)

4. **Read access for authenticated users**
   - Role: authenticated
   - Operations: SELECT
   - USING: true
   - Purpose: Allows authenticated users to read all RFQs

5. **Public read limited fields**
   - Role: anon
   - Operations: SELECT
   - USING: (status = ANY (ARRAY['open', 'closed']))
   - Purpose: Public can only see open/closed RFQs

## Common Issues and Solutions

### Issue: "new row violates row-level security policy"
**Cause**: Missing or incorrect WITH CHECK clause for INSERT operations
**Solution**: Ensure INSERT policies have `WITH CHECK (true)` or appropriate conditions

### Issue: Cannot update records
**Cause**: UPDATE requires both USING and WITH CHECK clauses
**Solution**: Add both clauses to UPDATE policies

## n8n Configuration

For n8n to work properly with Supabase:

1. **Preferred**: Use Service Role Key in n8n Supabase credentials
   - This bypasses most RLS restrictions
   - Located in: Supabase Dashboard > Settings > API > Service Role Key

2. **Alternative**: Use Anon Key with proper RLS policies
   - Requires comprehensive RLS policies for all operations
   - More secure but more complex to manage

## SQL to Check Current Policies

```sql
-- View all policies for a table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'rfq_requests'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('rfq_requests', 'vendors', 'vendor_offers', 'rfq_events');
```

## Best Practices

1. **Always include WITH CHECK for INSERT/UPDATE**: Without it, inserts will fail
2. **Test with different keys**: Verify behavior with both Service Role and Anon keys
3. **Use service_role for automation**: Workflows should use Service Role Key for reliability
4. **Keep policies simple**: Complex policies can cause unexpected behavior
5. **Document policy intent**: Comment on why each policy exists

## Troubleshooting Commands

```sql
-- Temporarily disable RLS (for testing only!)
ALTER TABLE rfq_requests DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;

-- Grant all permissions to service role (if needed)
GRANT ALL ON rfq_requests TO service_role;
```

---

*Last Updated: October 31, 2025*
