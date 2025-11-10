# Cursor AI Context: RFQ Automation System - Testing Phase

## Project Overview
I'm building an automated RFQ (Request for Quotation) system for procurement processes. The system consists of 4 main workflows plus a reminder workflow (1B). Currently, I have Workflow 1 (Main Processor AI B) built with 48 nodes in n8n, and I'm now in the testing phase before moving to dashboard development and subsequent workflows.

## Current Status
- ✅ Workflow 1: Built but needs testing and critical fixes
- 📋 Database: 8 Supabase tables designed and ready
- 🧪 Current Phase: Testing all scenarios to populate database
- 🎯 Next: Dashboard Phase 1, then Workflows 1B, 2, 3, 4

## Document References

### Core Implementation Documents
1. **Main_Processor_AI_B.json** - The actual workflow file (48 nodes) in n8n format
2. **WORKFLOW_1_PRODUCTION_READY.md** - Production checklist showing what tables are written and data flow
3. **WORKFLOW_NODE_FIXES.md** - Critical fixes needed (RFQ ID format, validation, error handling)

### Testing Documents
4. **RFQ_WORKFLOW_TEST_EXECUTION_GUIDE.md** - Complete test scenarios A-G with exact emails and expected database results
5. **TEST_RESULTS_SUMMARY.md** - Previous test results showing pass/fail status
6. **TEST_SCENARIOS.md** - Detailed test cases from project knowledge

### Database Documents
7. **SUPABASE_SCHEMA.md** - Complete database schema with 8 tables
8. **SUPABASE_CONSISTENCY_GUIDE.md** - Field usage and data consistency rules
9. **SUPABASE_FIELD_MAPPINGS.md** - Which workflow writes which fields
10. **SUPABASE_TABLES_USAGE.md** - Detailed table usage by each workflow
11. **DATABASE_CLEANUP_RECOMMENDATIONS.md** - Future cleanup tasks (post-MVP)

### Project Management Documents
12. **PROJECT_OVERVIEW.md** - Overall project status and architecture
13. **CONTEXT_SUMMARY.md** - Key decisions and standards (RFQ ID format, status values)
14. **MVP_DEVELOPMENT_PHASES.md** - Development phases after each workflow

### Next Phase Documents
15. **VENDOR_FOLLOWUP_WORKFLOW.md** - Specifications for Workflow 1B (reminder system)
16. **RFQ_DASHBOARD_TECHNICAL_SPEC.md** - Dashboard requirements for developer
17. **DASHBOARD_FEATURES.md** - Detailed dashboard functionality

### Workflow 2 Document
18. **WORKFLOW_2_VENDOR_RESPONSE_PROMPT.md** - Specifications for next workflow

## Critical Information

### RFQ ID Format Issue
**Current (WRONG):** RFQ-YYYY-MM-DD-XXXX
**Required (CORRECT):** BQ-YYYYMMDDHHMMSS

This must be fixed in the "Generate RFQ ID" node before production.

### Email Accounts for Testing
- Management: binquraya.procurement.demo+management@gmail.com
- Procurement: binquraya.procurement.demo@gmail.com
- Vendors: Use Yahoo emails (Gmail limit exhausted)

### Database Tables Being Populated
- **rfq_requests** - Main RFQ records
- **vendors** - Vendor master data
- **rfq_events** - Event logging
- **workflow_executions** - Process tracking
- **extraction_quality_issues** - AI quality issues

### Tables NOT Used Yet (Future Workflows)
- **vendor_offers** - For Workflow 2
- **gatekeeper_logs** - For Workflow 3
- **purchase_orders** - For Workflow 4
- **email_logs** - Deprecated (use rfq_events instead)

## Current Task: Test Execution

I need to execute test scenarios A through G as detailed in **RFQ_WORKFLOW_TEST_EXECUTION_GUIDE.md**:

### Test Scenarios to Execute
1. **Scenario A:** Happy path with PDF attachment (already have email content)
2. **Scenario B:** Email body only (no PDF)
3. **Scenario C:** AVL not found (9COM: 999-999999)
4. **Scenario D:** Poor quality extraction
5. **Scenario E:** Multiple items in one memo
6. **Scenario F:** Special characters (Müller™, José)
7. **Scenario G:** Invalid vendor emails

### For Each Test, I Need To:
1. Send the test email as specified
2. Monitor n8n workflow execution
3. Run SQL verification queries
4. Document results and any issues found
5. Note what data populates in each table

### IMPORTANT: Expected Test Outcomes
- **Not all scenarios will complete successfully** (this is intentional)
- **Scenario C**: Will get stuck at AVL (status: 'pending_avl', 0 vendors contacted)
- **Scenario D**: May fail at extraction (status: 'initiated', no vendors)
- **Scenario G**: Will have partial failures (some vendor emails invalid)
- This variety shows the full system capability including error states

## Immediate Help Needed

1. **Guide me through each test scenario** step by step
2. **Help create Yahoo vendor emails** for scenarios B, E, F, G only (A uses existing Gmail)
3. **Note**: vendor.a/b/c.demo@gmail.com are ONLY for Scenario A
4. **Generate SQL queries** to verify data after each test
5. **Track issues** beyond the known ones
6. **Update documentation** as we discover new information

## Important Decisions to Make

### Workflow Trigger Change
I'm considering changing Workflow 1 from email-triggered to button-triggered (webhook) like the other workflows. This would:
- ✅ Make testing easier
- ✅ Provide more control
- ✅ Align with other workflows
- ❓ Need to decide before dashboard development

Please advise on this architectural decision.

## Documentation Update Instructions

As we test and discover new information, please:

1. **Update outdated fields** in existing documents if we find discrepancies
2. **Add new findings** to TEST_RESULTS_SUMMARY.md
3. **Document any new issues** in WORKFLOW_NODE_FIXES.md
4. **Update status** in PROJECT_OVERVIEW.md after milestones

## Next Phases After Testing

### Phase 1: Dashboard Development (Immediately After Testing)
- Developer needs populated database
- Use RFQ_DASHBOARD_TECHNICAL_SPEC.md
- Focus on 4-node progress tracker initially

### Phase 2: Workflow 1B - Vendor Follow-up (Next Week)
- Build reminder system per VENDOR_FOLLOWUP_WORKFLOW.md
- Scheduled every 2 hours
- 3-day, 1-day, and same-day reminders

### Phase 3: Workflow 2 - Vendor Response Processing
- Process vendor emails
- Check material compliance
- Use WORKFLOW_2_VENDOR_RESPONSE_PROMPT.md

### Phase 4: Workflows 3 & 4
- Commercial Gatekeeper
- Evaluation & Decision Handler

## Commands and Queries You Should Know

### Reset Test Data
```sql
DELETE FROM workflow_executions WHERE workflow_name = 'RFQ Generation';
DELETE FROM rfq_events WHERE rfq_id LIKE 'RFQ-%' OR rfq_id LIKE 'BQ-%';
DELETE FROM extraction_quality_issues WHERE created_at > NOW() - INTERVAL '7 days';
DELETE FROM vendors WHERE created_at > NOW() - INTERVAL '7 days';
DELETE FROM rfq_requests WHERE rfq_id LIKE 'RFQ-%' OR rfq_id LIKE 'BQ-%';
```

### Check Latest RFQ
```sql
SELECT * FROM rfq_requests ORDER BY created_at DESC LIMIT 1;
```

### Monitor Events
```sql
SELECT event_type, vendor_name, event_timestamp 
FROM rfq_events 
WHERE rfq_id = (SELECT rfq_id FROM rfq_requests ORDER BY created_at DESC LIMIT 1)
ORDER BY event_timestamp;
```

### Vendor Status
```sql
SELECT vendor_name, vendor_email, last_contacted, total_rfqs_invited
FROM vendors 
WHERE last_contacted > NOW() - INTERVAL '1 hour'
ORDER BY last_contacted DESC;
```

## Key Questions to Answer Through Testing

1. Does the workflow handle all scenarios without breaking?
2. Is data correctly populated in all 5 active tables?
3. What happens with invalid data (special characters, missing fields)?
4. Does the AVL retry mechanism work properly?
5. Are all events logged correctly for the dashboard?
6. What's the actual RFQ ID format being generated?
7. Do vendor emails send successfully?

## Success Criteria

After all testing is complete, we should have:
- 8 RFQs in various statuses (NOT all successful - intentionally showing different failure points)
- 15+ unique vendors (Gmail for Scenario A only, Yahoo for others)
- 40+ events logged (including failures, retries, and partial completions)
- Multiple extraction quality issues documented
- Database showing full spectrum: success, partial success, stuck at AVL, extraction failures
- Rich data for dashboard to display all possible states
- Clear list of fixes needed
- Updated documentation

**Expected Status Distribution:**
- 3-4 RFQs: 'awaiting_responses' (successful)
- 1 RFQ: 'pending_avl' (stuck at AVL)
- 1 RFQ: 'initiated' (extraction failed)
- 1 RFQ: 'partial_sent' (some vendors unreachable)

---

**Please help me systematically work through the test scenarios, starting with Scenario A (Happy Path) using the email content I've already provided. Let's ensure we populate the database comprehensively so the developer can build the dashboard with real data.**

**Current Action: Start with Scenario A test execution**
