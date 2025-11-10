# Production Ready Checklist for RFQ Workflow

## 1. Error Handling & Resilience

### Add Continue on Fail
For all critical nodes that might fail, add:
```json
{
  "continueOnFail": true
}
```

Especially for:
- Extract Text from PDF (might fail if no PDF)
- AI extraction nodes (might fail on unusual formats)
- Google Sheets lookup (AVL might not exist)
- Email sending (vendor email might be invalid)

### Add Retry Logic
For external service calls:
- Google Sheets API
- OpenAI API
- Gmail API
- Supabase operations

## 2. Data Validation Improvements

### Add a "Validate RFQ Data" node after extraction:

```javascript
// Comprehensive validation for production
const items = $input.all();
const validationResults = [];

for (const item of items) {
  const data = item.json.output || item.json;
  const errors = [];
  const warnings = [];
  
  // 1. RFQ Number Validation
  const rfqNumber = data.rfqNumber || '';
  if (!rfqNumber) {
    errors.push('RFQ Number is required but not found');
  } else {
    // Check for common RFQ patterns
    const validPatterns = [
      /^RFQ[-\s#]?\d+/i,           // RFQ-123, RFQ#123, RFQ 123
      /^[A-Z]{2,}-\d+/,            // BQ-123456, PO-123
      /^\d{4}\/\d+/,               // 2024/001
      /^[A-Z]+-\d{4}-\d+/,         // ABC-2024-001
      /^REQ[-\s]?\d+/i,            // REQ-123 (Request)
      /^QR[-\s]?\d+/i              // QR-123 (Quote Request)
    ];
    
    if (!validPatterns.some(p => p.test(rfqNumber))) {
      warnings.push(`Unusual RFQ format: ${rfqNumber}`);
    }
  }
  
  // 2. 9COM Number Validation
  const nineComNumber = data.nineComNumber || '';
  if (nineComNumber && !/^\d{3}-\d{6}$/.test(nineComNumber)) {
    warnings.push(`9COM format should be XXX-XXXXXX, got: ${nineComNumber}`);
  }
  
  // 3. Quantity Validation
  const quantity = data.quantity || '';
  if (quantity) {
    // Extract numeric value
    const numMatch = quantity.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) {
      warnings.push(`No numeric quantity found in: ${quantity}`);
    }
  }
  
  // 4. Response Deadline Validation
  const deadline = data.responseDeadline || '';
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (isNaN(deadlineDate.getTime())) {
      warnings.push(`Invalid deadline format: ${deadline}`);
    } else if (deadlineDate < now) {
      errors.push('Response deadline is in the past');
    } else if (deadlineDate < new Date(now.getTime() + 24*60*60*1000)) {
      warnings.push('Response deadline is less than 24 hours away');
    }
  }
  
  // 5. Email Format in Document
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const documentText = JSON.stringify(data);
  const foundEmails = documentText.match(emailRegex) || [];
  
  if (foundEmails.length > 0) {
    warnings.push(`Found ${foundEmails.length} email(s) in document - ensure vendor emails are from AVL`);
  }
  
  // Return validation results
  validationResults.push({
    json: {
      ...data,
      _validation: {
        errors: errors,
        warnings: warnings,
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        isValid: errors.length === 0,
        validatedAt: new Date().toISOString()
      }
    }
  });
}

// Log validation summary
const totalErrors = validationResults.reduce((sum, r) => sum + r.json._validation.errors.length, 0);
const totalWarnings = validationResults.reduce((sum, r) => sum + r.json._validation.warnings.length, 0);

console.log(`Validation complete: ${totalErrors} errors, ${totalWarnings} warnings`);

// Fail if critical errors exist
if (totalErrors > 0) {
  const allErrors = validationResults.flatMap(r => r.json._validation.errors);
  throw new Error(`Validation failed: ${allErrors.join('; ')}`);
}

return validationResults;
```

## 3. Logging & Monitoring

### Enhanced Logging for "Log Workflow Execution"

Add these fields to capture more detail:
- `extracted_rfq_id`: The actual RFQ extracted
- `extraction_method`: pdf/email_body/uploaded_memo
- `validation_warnings`: Count of warnings
- `ai_model_used`: Which GPT model processed it
- `processing_time_ms`: Time taken

### Add Event Logging Throughout

Log these events in `rfq_events`:
- `extraction_started`
- `extraction_completed`
- `validation_passed`
- `validation_failed`
- `avl_lookup_started`
- `vendor_loop_started`
- `vendor_loop_completed`

## 4. Performance Optimizations

### Batch Database Operations
Instead of individual inserts for each vendor email event, collect and batch:

```javascript
// Collect all vendor events
const vendorEvents = vendors.map(v => ({
  rfq_id: rfqId,
  event_type: 'email_sent',
  vendor_email: v.email,
  vendor_name: v.name,
  event_timestamp: new Date()
}));

// Single batch insert
// Use Supabase bulk insert instead of loop
```

### Add Caching for AVL Lookup
Cache successful AVL lookups for 1 hour to reduce API calls:

```javascript
// Check if we've looked up this 9COM recently
const cacheKey = `avl_${nineComNumber}`;
const cachedResult = $getWorkflowStaticData(cacheKey);

if (cachedResult && cachedResult.timestamp > Date.now() - 3600000) {
  return cachedResult.data;
}

// Otherwise, do lookup and cache result
const result = // ... lookup logic
$setWorkflowStaticData(cacheKey, {
  data: result,
  timestamp: Date.now()
});
```

## 5. Security Considerations

### Sanitize All User Input
Before database operations:

```javascript
// Sanitize function for SQL injection prevention
function sanitizeForDB(value) {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/'/g, "''")           // Escape single quotes
    .replace(/\\/g, '\\\\')        // Escape backslashes
    .replace(/\x00/g, '')          // Remove null bytes
    .replace(/[\x08\x09\x1a]/g, '') // Remove other problematic chars
    .trim();
}

// Apply to all string fields before DB insert
Object.keys(data).forEach(key => {
  if (typeof data[key] === 'string') {
    data[key] = sanitizeForDB(data[key]);
  }
});
```

### Validate File Uploads
If processing uploaded files:

```javascript
// Validate file type and size
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

if (!allowedMimeTypes.includes(file.mimeType)) {
  throw new Error('Invalid file type. Only PDF and Word documents allowed.');
}

if (file.size > 10 * 1024 * 1024) { // 10MB limit
  throw new Error('File too large. Maximum size is 10MB.');
}
```

## 6. Testing Scenarios

Test these edge cases:
1. RFQ with future date in number (RFQ-2025-001)
2. Multiple RFQ numbers in one document
3. RFQ with special characters (RFQ/2024#001-REV2)
4. Non-English RFQ documents
5. RFQ with conflicting deadlines
6. Corrupted PDF files
7. HTML email with no plain text
8. Email with 50+ vendor requirements

## 7. Documentation for Each Node

Add description to each node explaining:
- Purpose
- Expected input format
- Expected output format
- Error handling behavior
- Business logic implemented

Example:
```
Description: "Extracts RFQ number from document. Expects rfqNumber in format XXX-YYYY-NNN or similar. 
Outputs: {rfqId: string, submissionDeadline: ISO date}. 
Fails if no RFQ number found."
```

## 8. Monitoring Dashboard Queries

Prepare these queries for monitoring:

```sql
-- Daily RFQ processing stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_rfqs,
  COUNT(CASE WHEN status = 'awaiting_responses' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'pending_avl' THEN 1 END) as avl_issues,
  AVG(vendor_count) as avg_vendors_per_rfq
FROM rfq_requests
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Extraction quality trends
SELECT 
  DATE(created_at) as date,
  extraction_method,
  AVG(quality_score) as avg_quality,
  COUNT(*) as count
FROM extraction_quality_issues
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), extraction_method
ORDER BY date DESC;

-- Common RFQ formats
SELECT 
  SUBSTRING(rfq_id FROM '^[A-Z]+-') as rfq_prefix,
  COUNT(*) as usage_count
FROM rfq_requests
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY rfq_prefix
ORDER BY usage_count DESC
LIMIT 10;
```

## Ready for Production When:

- [ ] All nodes have error handling
- [ ] Validation catches malformed data
- [ ] Logging captures full audit trail
- [ ] Performance optimizations implemented
- [ ] Security measures in place
- [ ] Test scenarios pass
- [ ] Documentation complete
- [ ] Monitoring queries prepared
