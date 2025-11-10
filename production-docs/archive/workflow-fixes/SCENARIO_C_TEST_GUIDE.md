# Test Scenario C: AVL Not Found (9COM Invalid) 🚫

## Overview
This scenario tests what happens when an RFQ contains a 9COM number that doesn't exist in the Google Sheets AVL.

## Test Email

Send this email:

```
From: binquraya.procurement.demo+management@gmail.com
To: binquraya.procurement.demo@gmail.com
Subject: RFQ-2024-11-003 Emergency Procurement - Special Equipment

Urgent procurement required:

PROJECT: Emergency Repair Project
9COM: 999-999999
ITEM: Specialized Cooling Unit
QUANTITY: 2 units
CRITICAL: Need within 15 days
SPECIFICATIONS: Industrial grade, 50Hz, outdoor rated

Please expedite!
```

## Key Test Points

### 1. **Invalid 9COM Number**
- Using `999-999999` which doesn't exist in AVL
- This should trigger the "AVL not found" path

### 2. **Expected Workflow Behavior**
The workflow should:
1. Extract RFQ details successfully
2. Pass quality checks
3. Insert RFQ request
4. **FAIL at "Lookup AVL in Google Sheets"**
5. Go to "AVL Found?" → False path
6. Continue to "Download AVL Document" → "Notify Dev Team - AVL Not Found"
7. **NOT send any vendor emails**
8. Still complete workflow execution

### 3. **Expected Database Results**

#### rfq_requests
```sql
-- Should create entry with:
rfq_id: 'RFQ-2024-11-003'
nine_com_number: '999-999999'
status: 'initiated' (or 'pending_avl')
vendor_count: 0  -- No vendors contacted
```

#### rfq_events
```sql
-- Should NOT have any email_sent events
-- Might have workflow event or AVL_not_found event (if implemented)
```

#### vendors
```sql
-- No changes to vendors table
```

#### workflow_executions
```sql
-- Should show:
workflow_name: 'RFQ Generation'
status: 'success' (workflow completed even without AVL)
vendor_count: 0
rfq_id: 'RFQ-2024-11-003'
```

#### extraction_quality_issues
```sql
-- Should be empty (quality should pass)
```

## Verification Steps

1. **Check Email Notification**
   - Dev team should receive "AVL Not Found" notification
   - Email should contain the invalid 9COM number

2. **Verify No Vendor Processing**
   - No vendor emails should be sent
   - No vendor records created/updated

3. **Check Workflow Status**
   - Workflow should complete successfully
   - Should take the "false" path at AVL check

## Quick Verification Query

```sql
-- Run after test
SELECT 
    'RFQ Created' as check, COUNT(*) as result
FROM rfq_requests WHERE rfq_id = 'RFQ-2024-11-003'
UNION ALL
SELECT 
    'Vendor Emails Sent', COUNT(*)
FROM rfq_events WHERE rfq_id = 'RFQ-2024-11-003' AND event_type = 'email_sent'
UNION ALL
SELECT 
    'Workflow Executions', COUNT(*)
FROM workflow_executions WHERE rfq_id = 'RFQ-2024-11-003';
```

Expected:
- RFQ Created: 1
- Vendor Emails Sent: 0 ✅
- Workflow Executions: 1

## Notes
- This tests the workflow's ability to handle missing AVL data gracefully
- The dev team notification is critical for manual intervention
- In production, this would trigger a manual AVL update process
