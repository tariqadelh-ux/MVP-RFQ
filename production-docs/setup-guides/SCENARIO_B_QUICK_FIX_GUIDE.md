# Scenario B Quick Fix Guide

## Steps to Fix Vendor Creation Issue

### 1. Delete Existing Vendors in Supabase
Go to your Supabase dashboard and delete vendors A, B, and C from the `vendors` table. This will allow us to create all 6 vendors fresh.

### 2. Change "Upsert Vendor Record" Node Configuration

1. Open the node "Upsert Vendor Record" in n8n
2. Change these settings:
   - **Operation**: Change from `Update` to `Create`
   - **Remove** the Select Conditions section (it's not needed for Create)
   - Keep all the Fields to Send as they are

### 3. Run Scenario B Again

Send the test email again:

**Subject**: RFQ-2024-11-002 Heat Exchanger Order

**Body**:
```
RFQ Number: RFQ-2024-11-002
9COM Number: 450-012547
Project Name: Project Eagle - Aramco Site 7 Expansion
Material Description: High-Pressure Shell & Tube Heat Exchanger
Quantity: 2
Specifications: All wetted parts must be Stainless Steel Grade 316/316L
Response Deadline: November 16, 2024
WBS Code: PEA7PRC02
```

## Expected Results

After running with these changes, you should see:
1. **6 new vendors** created in the `vendors` table
2. **6 email events** in `rfq_events` with vendor_name and vendor_email populated
3. **vendor_count = 6** in `workflow_executions`
4. All vendor emails sent successfully

## Note
This is a temporary fix for testing. After MVP, we'll implement proper upsert logic as documented in `POST_MVP_IMPROVEMENTS.md`.
