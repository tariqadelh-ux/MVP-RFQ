# n8n Vendor Upsert Configuration Guide

## Overview
The vendors table now has auto-generated vendor_id values, making it easier to insert new vendors from your workflow.

## What Changed
1. **vendor_id** is now auto-generated in format `9V-NNNN` (e.g., 9V-1000, 9V-1001)
2. **vendor_email** now has a unique constraint for upsert operations
3. You don't need to provide vendor_id anymore!

## Configuring the Upsert Vendor Node

### For INSERT Operations
If you want to always create new vendor records:
1. Set Operation to: **Create**
2. Provide these fields:
   - vendor_name
   - vendor_email
   - contact_person (optional)
   - phone_number (optional)
   - last_contacted

### For UPSERT Operations (Recommended)
If you want to update existing vendors or create new ones:

1. Set Operation to: **Upsert**
2. Set Conflict Fields to: **vendor_email**
3. Provide the same fields as above

This way:
- If a vendor with that email exists: it updates the record
- If no vendor with that email exists: it creates a new one with auto-generated vendor_id

## Example Data
```javascript
{
  "vendor_name": "Vendor A Industries",
  "vendor_email": "vendor.a.demo@gmail.com",
  "contact_person": "John Smith",
  "phone_number": "+1-555-0123",
  "last_contacted": "{{ $now }}"
}
```

## What Happens Behind the Scenes

1. **New Vendor**: Gets assigned the next vendor_id (9V-1000, 9V-1001, etc.)
2. **Existing Vendor**: Updates their information and last_contacted timestamp
3. **Duplicate Email**: Updates the existing record (doesn't create duplicate)

## Testing Your Configuration

1. Run your workflow with a test vendor
2. Check the vendors table in Supabase
3. Run again with the same email - it should update, not duplicate

## Common Issues

### "duplicate key value violates unique constraint"
- **Cause**: Trying to insert with duplicate vendor_email
- **Solution**: Use Upsert operation instead of Create

### "null value in column vendor_id"
- **Cause**: Old database schema or cached connection
- **Solution**: Refresh your n8n workflow and try again

---

Your workflow should now work perfectly! The vendor_id is handled automatically by the database.
