# Scenario D (Poor Quality Extraction) Test Guide

## Overview
With the memo loop removed, Scenario D will now complete successfully even when extraction quality is poor.

## Test Email
Send to: `binquraya.procurement.demo+management@gmail.com`

```
Subject: Need materials
From: vendor.g_test@outlook.com

Body:
We need some equipment for our project. Please process.

Thanks
```

## Expected Workflow Path
1. Email received and processed
2. PDF extraction fails (no attachment)
3. Email body extraction runs
4. **Quality check FAILS** (missing critical fields: 9COM number, project name, quantity)
5. Log extraction quality issue to `extraction_quality_issues` table
6. Send notification email to dev team
7. **NEW**: Skip memo retry loop
8. Mark email as processed
9. Log workflow execution with status "success"

## Database Entries to Check

### 1. `extraction_quality_issues`
```json
{
  "email_id": "[message_id]",
  "extraction_method": "email_body",
  "quality_score": 0,
  "missing_fields": ["nineComNumber", "projectName", "quantity"],
  "status": "pending_manual_review",
  "created_at": "[timestamp]"
}
```

### 2. `workflow_executions`
```json
{
  "workflow_name": "RFQ Generation",
  "status": "success",
  "rfq_id": null,  // No RFQ created due to poor quality
  "vendor_count": 0,
  "completed_at": "[timestamp]"
}
```

### 3. `rfq_requests`
- **No entry created** (quality check failed before RFQ creation)

### 4. `rfq_events`
- **No entries created** (no RFQ to log events for)

### 5. `vendors`
- **No new vendors created**

## Dev Team Notification
Check the dev team email (`Tariq.alhashim@davonmt.com`) for:
- Subject: "ACTION REQUIRED: Manual Document Upload Needed for RFQ Processing"
- Contains extraction quality assessment
- Shows missing fields
- Instructions for manual intervention

## Key Differences from Before
- **BEFORE**: Workflow would enter infinite loop waiting for memo upload
- **AFTER**: Workflow completes immediately after notifying dev team
- Email is marked as processed
- Workflow execution is logged
- No pending "Wait" nodes

## Success Criteria
✅ Workflow completes (doesn't get stuck)
✅ Quality issue logged in database
✅ Dev team notification sent
✅ Email marked as processed
✅ Workflow execution logged with vendor_count = 0
✅ No infinite loops or waiting states
