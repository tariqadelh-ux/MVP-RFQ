# Log Email Sent Event - Vendor Data Fix

## Issue
The "Log Email Sent Event" node was creating entries with NULL vendor_email and vendor_name fields because it was trying to reference vendor data from the "Send RFQ Email to Vendor" node output, which only contains Gmail message IDs.

## Root Cause
The Gmail "Send RFQ Email to Vendor" node:
- **Input**: Full vendor records with all fields
- **Output**: Only Gmail response (message ID, thread ID, labels)
- **Result**: Vendor data is not passed through to subsequent nodes

## Solution
Updated the field references in "Log Email Sent Event" to pull vendor data from earlier nodes in the flow:

### Old Field References:
```javascript
vendor_email: {{ $json.vendor_email || $json.email }}
vendor_name: {{ $json.vendor_name || $json.vendorName }}
```

### New Field References:
```javascript
vendor_email: {{ $('Route by Vendor Action').item.json.email || $('Create New Vendor').item.json.vendor_email || $('Update Existing Vendor').item.json.vendor_email }}
vendor_name: {{ $('Route by Vendor Action').item.json.vendorName || $('Create New Vendor').item.json.vendor_name || $('Update Existing Vendor').item.json.vendor_name }}
```

## How It Works
1. First tries to get data from "Route by Vendor Action" (has the original vendor data)
2. Falls back to "Create New Vendor" output (for newly created vendors)
3. Falls back to "Update Existing Vendor" output (for existing vendors)

## Testing
After this fix, the rfq_events table should show:
- All email_sent events with proper vendor_email and vendor_name values
- No NULL values in vendor fields

## Related Issues
This also revealed that the workflow is splitting execution:
- Run 1: Updates existing vendors (A, B, C)
- Run 2: Creates new vendors (D, E, F)
This results in two workflow_executions entries with vendor_count=3 each instead of one with vendor_count=6.
