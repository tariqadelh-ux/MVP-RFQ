# Vendor Follow-Up Reminder Workflow (Workflow 1B/5)

## Purpose
Automated system to send reminder emails to non-responsive vendors at strategic intervals before RFQ deadline.

---

## Workflow Type & Trigger
- **Type:** Scheduled Workflow (separate from Main Processor)
- **Trigger:** Every 2 hours during business hours (9 AM - 5 PM)
- **Alternative:** Can run hourly for more precision

---

## Reminder Schedule
1. **First Reminder:** 3 days before deadline
2. **Second Reminder:** 1 day before deadline  
3. **Final Reminder:** On deadline day (morning)
4. **Extension Notice:** If needed after deadline

---

## Database Changes Required

### Add to rfq_requests table:
```sql
ALTER TABLE rfq_requests 
ADD COLUMN IF NOT EXISTS first_reminder_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS second_reminder_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_reminder_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deadline_extended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS extension_count INTEGER DEFAULT 0;
```

### Create vendor_reminders table:
```sql
CREATE TABLE IF NOT EXISTS vendor_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id TEXT NOT NULL REFERENCES rfq_requests(rfq_id),
  vendor_email TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('first', 'second', 'final', 'extension')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  days_before_deadline INTEGER,
  response_received_after BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_email, reminder_type)
);
```

---

## Workflow Logic

### Step 1: Check for RFQs Needing First Reminder
```sql
SELECT * FROM rfq_requests
WHERE status = 'awaiting_responses'
  AND first_reminder_sent IS NULL
  AND response_deadline <= NOW() + INTERVAL '3 days'
  AND response_deadline > NOW();
```

### Step 2: Identify Non-Responsive Vendors
```sql
-- Get vendors who were sent RFQ but haven't responded
SELECT DISTINCT v.vendor_email, v.vendor_name
FROM rfq_events re
JOIN vendors v ON re.vendor_email = v.vendor_email
WHERE re.rfq_id = ?
  AND re.event_type = 'email_sent'
  AND v.vendor_email NOT IN (
    SELECT vendor_email FROM vendor_offers WHERE rfq_id = ?
  );
```

### Step 3: Send Reminder Email
- Personalized email with RFQ details
- Countdown to deadline
- Clear call-to-action
- Note if already submitted (in case they did)

### Step 4: Log Reminder
- Update rfq_requests.first_reminder_sent
- Insert into vendor_reminders table
- Create rfq_event with type 'first_reminder_sent'

### Step 5: Repeat for Second and Final Reminders
Same logic but checking different time windows

---

## Email Templates

### First Reminder (3 days before):
**Subject:** 🔔 Reminder: RFQ {rfq_id} - Response Due in 3 Days

**Key Message:** Friendly reminder with all RFQ details

### Second Reminder (1 day before):
**Subject:** ⚠️ Urgent: RFQ {rfq_id} - Response Due Tomorrow

**Key Message:** Urgent tone, emphasize deadline

### Final Reminder (Deadline day):
**Subject:** 🚨 Final Notice: RFQ {rfq_id} - Response Due Today

**Key Message:** Final chance, deadline is today

---

## Key Features

### Smart Reminder Logic:
- Only reminds vendors who haven't responded
- Stops reminding once response received
- Tracks effectiveness of each reminder type

### Deadline Extension:
- If < 2 responses after deadline, can auto-extend
- Notifies procurement team of extension need
- Maximum 1 extension per RFQ

### Performance Tracking:
```sql
-- Check reminder effectiveness
SELECT 
  reminder_type,
  COUNT(*) as reminders_sent,
  SUM(CASE WHEN response_received_after THEN 1 ELSE 0 END) as responses_triggered,
  ROUND(100.0 * SUM(CASE WHEN response_received_after THEN 1 ELSE 0 END) / COUNT(*), 2) as effectiveness_rate
FROM vendor_reminders
GROUP BY reminder_type;
```

---

## Implementation Options

### Option A: Integrated into Workflow 1 (Not Recommended)
- Would keep workflow running for 7+ days
- Risk losing reminders if n8n restarts
- Hard to modify reminder schedule

### Option B: Separate Scheduled Workflow (RECOMMENDED) ✅
- Independent of main processor
- Can handle all RFQs in one run
- Easy to modify schedule
- More resilient to failures

### Option C: Manual Trigger from Dashboard
- Add "Send Reminder" button in Phase 2
- Triggers workflow via webhook
- Good for testing, not for production

---

## Integration with Dashboard (Phase 2+)

### Add Reminder Status Indicators:
```javascript
// Visual indicators in RFQ table
if (first_reminder_sent) show "📧"
if (second_reminder_sent) show "📧📧"  
if (final_reminder_sent) show "📧📧📧"
```

### Add Manual Reminder Button:
```javascript
// Only show if deadline approaching and no response
if (daysUntilDeadline <= 3 && responded_vendor_count < vendor_count) {
  showButton("Send Reminder Now")
}
```

---

## Testing the Workflow

### Test Case 1: First Reminder
1. Create RFQ with deadline 3 days from now
2. Run workflow
3. Verify emails sent to non-responsive vendors only
4. Check vendor_reminders table populated

### Test Case 2: Vendor Responds After Reminder
1. Send first reminder
2. Simulate vendor response
3. Run second reminder workflow
4. Verify vendor NOT reminded again

### Test Case 3: Deadline Extension
1. Set deadline to yesterday
2. Set responded_vendor_count = 1
3. Run workflow
4. Verify extension logic triggers

---

## Success Metrics
- **Response Rate Improvement:** Track % of vendors responding after reminders
- **Optimal Timing:** Which reminder (1st, 2nd, final) is most effective
- **Reduction in Manual Follow-ups:** Less manual work for procurement team

---

## Notes
- Consider timezone differences for international vendors
- Business days vs calendar days for deadlines
- Option to exclude certain vendors from reminders
- Can add SMS/WhatsApp reminders in future phases
