# Vendor Handling Testing Guide

## Quick Test Instructions

### 1. Import the Updated Workflow
- Import `My workflow 11 (3).json` into n8n
- The workflow now includes automatic vendor creation/update logic

### 2. Test Scenario B (Without Clearing Vendors)
You can now run Scenario B without deleting existing vendors:

```
Subject: RFQ-2024-11-002 Heat Exchanger Order
From: binquraya.procurement.demo+management@gmail.com

RFQ Number: RFQ-2024-11-002
9COM Number: 450-012547
Project Name: Project Eagle - Aramco Site 7 Expansion
Material Description: High-Pressure Shell & Tube Heat Exchanger
Quantity: 2
Specifications: All wetted parts must be Stainless Steel Grade 316/316L
Response Deadline: November 16, 2024
WBS Code: PEA7PRC02
```

**Expected Behavior**:
- Vendors A, B, C: Will be UPDATED (already exist)
- Vendors D, E, F: Will be CREATED (new vendors)
- All 6 vendors will receive RFQ emails

### 3. Check Database Results

**vendors table**:
- Should now have 6 vendors (A, B, C, D, E, F)
- `last_contacted` timestamp updated for all 6

**rfq_events table**:
- Should have 6 email_sent events with proper vendor information

**workflow_executions table**:
- `vendor_count` should show 6

### 4. Test Other Scenarios

The workflow will now handle any vendor combination:
- **Scenario C**: Different vendors → automatically created
- **Scenario D**: Mix of existing and new → properly handled
- **Re-runs**: Same vendors → updated, not duplicated

## No More Manual Steps! 🎉

You no longer need to:
- Delete existing vendors between tests
- Worry about duplicate key errors
- Switch between Create/Update operations

The workflow automatically detects and handles everything!
