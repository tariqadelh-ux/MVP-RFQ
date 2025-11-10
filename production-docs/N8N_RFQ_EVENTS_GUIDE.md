# n8n RFQ Events Logging Guide

## Overview
The `rfq_events` table is your audit trail for all RFQ-related activities. It now has smart auto-generation for the title field!

## What Changed
The `title` field is now:
1. **Optional** - You don't need to provide it
2. **Auto-generated** - Based on the event_type you provide
3. **Smart** - Different event types get appropriate, descriptive titles

## Event Type → Title Mapping

| event_type | Auto-Generated Title |
|------------|---------------------|
| email_sent | RFQ Email Sent to Vendor |
| vendor_responded | Vendor Response Received |
| avl_not_found | AVL Lookup Failed |
| tbc_sent | Technical Bid Clarification Sent |
| evaluation_started | Commercial Evaluation Started |
| po_issued | Purchase Order Issued |
| rfq_created | RFQ Created |
| workflow_error | Workflow Error Occurred |
| Other types | Title Case Version (e.g., "Status Change") |

## Configuring Your Log Event Node

### Required Fields Only
```javascript
{
  "rfq_id": "{{ $json.rfqId }}",
  "event_type": "email_sent",
  "vendor_email": "{{ $json.email }}",
  "vendor_name": "{{ $json.vendorName }}"
}
```

### With Optional Fields
```javascript
{
  "rfq_id": "{{ $json.rfqId }}",
  "event_type": "email_sent",
  "vendor_email": "{{ $json.email }}",
  "vendor_name": "{{ $json.vendorName }}",
  "description": "Sent RFQ package for high-pressure heat exchanger",
  "nine_com_number": "{{ $json.nineComNumber }}",
  "project_name": "{{ $json.projectName }}"
}
```

### Custom Title (Override Auto-Generation)
```javascript
{
  "rfq_id": "{{ $json.rfqId }}",
  "event_type": "email_sent",
  "title": "Urgent RFQ Sent - Fast Track Project", // Your custom title
  "vendor_email": "{{ $json.email }}"
}
```

## Common Event Types to Use

### For Workflow 1 (RFQ Creation)
- `rfq_created` - When RFQ is first created
- `email_sent` - When RFQ sent to vendor
- `avl_not_found` - When AVL lookup fails
- `workflow_error` - When any error occurs

### For Workflow 2 (Vendor Response)
- `vendor_responded` - When vendor email received
- `tbc_sent` - When clarification needed
- `offer_received` - When valid offer processed

### For Workflow 3 & 4 (Evaluation)
- `evaluation_started` - When commercial evaluation begins
- `vendor_selected` - When winner chosen
- `po_issued` - When PO sent
- `rfq_cancelled` - If RFQ cancelled

## Benefits of This Approach

1. **Less Configuration** - Don't worry about titles
2. **Consistent Logging** - All events have meaningful titles
3. **Flexible** - Can still override with custom titles
4. **Error Prevention** - No more "null title" errors

## Testing Your Configuration

1. Run your workflow with just required fields
2. Check the rfq_events table - title should be auto-generated
3. Try different event_types to see the titles

---

Your workflow should now work perfectly! The title field is handled automatically based on the event type.
