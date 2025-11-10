# Scenario E (Multiple Items) Test Guide

## Overview
Tests the workflow's ability to handle RFQs with multiple different items (multi-line RFQs).

## Current Implementation (MVP)
- Stores as single RFQ with `quantity = 1` (bundle approach)
- Multiple items stored in `material_description` and `specifications`
- Multiple 9COM numbers stored comma-separated in `nine_com_number`
- First 9COM used for AVL lookup

## Test Email
Send to: `binquraya.procurement.demo@gmail.com`

```
From: Your management account
Subject: RFQ-2024-11-005 Multiple Equipment Order

RFQ Number: RFQ-2024-11-005
PROJECT: Multi - Eastern Province Expansion

ITEM 1:
- 9COM: 890-123456
- Description: Pressure Vessel Heat Exchanger
- Quantity: 2 units
- Material: SS 316L

ITEM 2:
- 9COM: 123-456789
- Description: Pipe Fittings
- Quantity: 100 pieces
- Material: CS ASTM A234

Both items needed within 60 days. Send to all relevant vendors.
WBS: MUL7PRC05

Regards,
Procurement Team
```

## Expected Workflow Behavior

### 1. AI Extraction
Should extract:
- `rfqNumber`: "RFQ-2024-11-005"
- `nineComNumber`: "890-123456, 123-456789" (both numbers)
- `projectName`: "Multi - Eastern Province Expansion"
- `quantity`: "2 units; 100 pieces" or similar
- `materialDescription`: Details of both items
- `wbsCode`: "MUL7PRC05"

### 2. Data Transformation
"Transform for Database" node will:
- Set `processedQuantity`: 1 (bundle)
- Set `primaryNineComNumber`: "890-123456" (first one)
- Set `allNineComNumbers`: "890-123456, 123-456789"
- Mark as `isMultiItem`: true

### 3. Database Storage
`rfq_requests` will have:
- `quantity`: 1
- `commodity_code`: "890-123456" (for AVL lookup)
- `nine_com_number`: "890-123456, 123-456789"
- Both items' details in `material_description` and `specifications`

### 4. AVL Lookup
- Uses only the FIRST 9COM (890-123456)
- Will find vendors M, N, O
- Won't look up second 9COM (123-456789) - current limitation

### 5. Vendor Emails
All 3 vendors (M, N, O) will receive emails showing:
- Both items listed
- Individual quantities
- All specifications
- Note: Vendors P, Q won't receive emails (they're for second 9COM)

## Database Entries to Check

### 1. `rfq_requests`
```sql
SELECT * FROM rfq_requests WHERE rfq_id = 'RFQ-2024-11-005';
```

Expected:
- `quantity`: 1
- `nine_com_number`: "890-123456, 123-456789"
- `commodity_code`: "890-123456"
- `material_description`: Contains both items

### 2. `rfq_events`
- 3 email_sent events (vendors M, N, O only)

### 3. `workflow_executions`
- `vendor_count`: 3
- `status`: "success"

## Key Points to Verify

✅ Both 9COM numbers captured (890-123456, 123-456789)
✅ Both items' details preserved  
✅ Quantity stored as 1 (bundle)  
✅ AVL lookup uses first 9COM only (890-123456)
✅ Email contains all item details  
✅ Vendors M, N, O contacted (but not P, Q)

## Known Limitations (MVP)
⚠️ Only first 9COM (890-123456) used for vendor lookup
⚠️ Second 9COM's vendors (P, Q) are ignored
⚠️ Can't assign different vendors to different items
⚠️ Quantity is simplified to "1 bundle"
⚠️ No line-item level tracking

## Post-MVP Enhancement
See `POST_MVP_IMPROVEMENTS.md` for planned `rfq_line_items` table implementation.
