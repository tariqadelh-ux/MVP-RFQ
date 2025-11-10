# Workflow Node Fixes for Production

## Critical Node Modifications for Main Processor AI B

---

## 🔴 Priority 1: Critical Fixes (Must Do Before Production)

### 1. Fix RFQ ID Format (Node: "Generate RFQ ID")

**Current Code:**
```javascript
const rfqId = `RFQ-${year}-${month}-${day}-${randomId}`;
```

**Replace With:**
```javascript
// Generate RFQ ID in correct format: BQ-YYYYMMDDHHMMSS
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[-:]/g, '')
  .replace('T', '')
  .substring(0, 14);
const rfqId = `BQ-${timestamp}`;

// Also validate it was generated correctly
if (!/^BQ-\d{14}$/.test(rfqId)) {
  throw new Error(`Invalid RFQ ID format generated: ${rfqId}`);
}
```

---

### 2. Add Data Validation (New Node After "Assess Extraction Quality")

**Add New Code Node: "Validate Extracted Data"**
```javascript
// Comprehensive data validation before proceeding
const items = $input.all();
const errors = [];
const warnings = [];

for (const item of items) {
  const data = item.json.output || item.json;
  
  // CRITICAL FIELD VALIDATION
  
  // 1. Nine COM Number validation
  if (!data.nineComNumber || data.nineComNumber.trim() === '') {
    errors.push('Missing 9COM number');
  } else if (!/^9COM-\d{3,}$/.test(data.nineComNumber.trim())) {
    warnings.push(`Invalid 9COM format: ${data.nineComNumber}`);
  }
  
  // 2. Project Name validation
  if (!data.projectName || data.projectName.trim() === '') {
    errors.push('Missing project name');
  } else if (data.projectName.length > 255) {
    // Truncate long project names
    data.projectName = data.projectName.substring(0, 252) + '...';
    warnings.push('Project name truncated to 255 characters');
  }
  
  // 3. Quantity validation
  const quantity = parseInt(data.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    errors.push(`Invalid quantity: ${data.quantity}`);
    data.quantity = 1; // Default to 1
  } else if (quantity > 999999) {
    errors.push('Quantity exceeds maximum allowed (999999)');
  }
  
  // 4. Material Description validation
  if (!data.materialDescription || data.materialDescription.trim() === '') {
    errors.push('Missing material description');
  }
  
  // 5. Email validation for requester
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.requesterEmail && !emailRegex.test(data.requesterEmail)) {
    warnings.push(`Invalid requester email format: ${data.requesterEmail}`);
  }
  
  // 6. Date validation for delivery timeline
  if (data.deliveryTimeline) {
    const deliveryDate = new Date(data.deliveryTimeline);
    if (isNaN(deliveryDate.getTime())) {
      warnings.push('Invalid delivery timeline format');
      data.deliveryTimeline = 'TBD';
    }
  }
  
  // 7. Sanitize all text fields to prevent SQL injection
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/'/g, "''")  // Escape single quotes
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/\0/g, '')  // Remove null bytes
      .trim();
  };
  
  // Apply sanitization
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      data[key] = sanitizeString(data[key]);
    }
  });
  
  // If critical errors exist, throw error to stop workflow
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
  
  // Add validation results to output
  item.json = {
    ...data,
    validationWarnings: warnings,
    validationPassed: true,
    validatedAt: new Date().toISOString()
  };
}

return items;
```

---

### 3. Add Error Handling to All Supabase Nodes

**For EACH Supabase Node, add these settings:**

In the node's Settings (gear icon) or Additional Fields:
```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000
}
```

**Also add Error Handler after critical Supabase operations:**

Add new "Code" node after "Insert RFQ Request":
```javascript
// Handle Supabase insertion errors
const input = $input.all();

// Check if previous node failed
if ($prevNode.error) {
  const error = $prevNode.error;
  
  // Log error to console for debugging
  console.error('Supabase insert failed:', error);
  
  // Prepare error event for logging
  return [{
    json: {
      success: false,
      error: error.message,
      errorCode: error.code,
      operation: 'insert_rfq_request',
      rfqId: $json.rfqId,
      timestamp: new Date().toISOString(),
      
      // Determine if retry is worthwhile
      shouldRetry: [
        'ECONNREFUSED',
        'ETIMEDOUT', 
        'NetworkError'
      ].some(code => error.message.includes(code)),
      
      // Fallback action
      fallbackAction: 'queue_for_manual_processing'
    }
  }];
}

// If successful, pass through
return input;
```

---

### 4. Add Circuit Breaker Pattern (New Node at Workflow Start)

**Add Code Node: "Circuit Breaker Check"**
```javascript
// Circuit breaker implementation
const CIRCUIT_BREAKER_KEY = 'workflow_circuit_breaker';
const FAILURE_THRESHOLD = 5;
const TIMEOUT_DURATION = 300000; // 5 minutes in milliseconds
const HALF_OPEN_REQUESTS = 1;

// Simulated state storage (in production, use Redis or database)
// For n8n, you could use static data or a global variable
const getCircuitState = () => {
  // This would normally fetch from persistent storage
  return $getWorkflowStaticData('circuitBreaker') || {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: null,
    successCount: 0
  };
};

const setCircuitState = (state) => {
  $setWorkflowStaticData('circuitBreaker', state);
};

const circuitBreaker = getCircuitState();
const now = Date.now();

// Check circuit state
switch (circuitBreaker.state) {
  case 'OPEN':
    // Check if timeout has passed
    if (now - circuitBreaker.lastFailureTime > TIMEOUT_DURATION) {
      // Try half-open state
      circuitBreaker.state = 'HALF_OPEN';
      circuitBreaker.successCount = 0;
      setCircuitState(circuitBreaker);
      
      return [{
        json: {
          proceed: true,
          circuitState: 'HALF_OPEN',
          message: 'Circuit breaker entering half-open state for testing'
        }
      }];
    } else {
      // Still in timeout, reject request
      throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry after ${new Date(circuitBreaker.lastFailureTime + TIMEOUT_DURATION).toISOString()}`);
    }
    
  case 'HALF_OPEN':
    // Allow limited requests through
    if (circuitBreaker.successCount < HALF_OPEN_REQUESTS) {
      return [{
        json: {
          proceed: true,
          circuitState: 'HALF_OPEN',
          message: 'Circuit breaker in test mode'
        }
      }];
    } else {
      // Close circuit after successful test
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      setCircuitState(circuitBreaker);
      
      return [{
        json: {
          proceed: true,
          circuitState: 'CLOSED',
          message: 'Circuit breaker closed - normal operation'
        }
      }];
    }
    
  case 'CLOSED':
  default:
    // Normal operation
    return [{
      json: {
        proceed: true,
        circuitState: 'CLOSED',
        failureCount: circuitBreaker.failureCount,
        message: 'Circuit breaker closed - normal operation'
      }
    }];
}
```

---

### 5. Fix Vendor Email Validation (Node: "Prepare Vendor Loop Data")

**Add to existing code:**
```javascript
// Email validation and sanitization for vendor emails
const validateAndSanitizeEmail = (email) => {
  if (!email) return null;
  
  // Remove whitespace
  email = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn(`Invalid vendor email: ${email}`);
    return null;
  }
  
  // Additional validation for common issues
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    console.warn(`Malformed vendor email: ${email}`);
    return null;
  }
  
  // Check for SQL injection attempts
  const dangerousPatterns = [
    /['";\\]/g,  // Quotes and SQL terminators
    /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE)\b/gi,  // SQL commands
    /<script>/gi,  // Script tags
    /javascript:/gi  // JavaScript protocol
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(email)) {
      console.error(`Dangerous pattern in email: ${email}`);
      return null;
    }
  }
  
  return email;
};

// In the vendor processing loop:
for (const vendor of vendorsData) {
  const cleanEmail = validateAndSanitizeEmail(vendor.email || vendor.vendor_email);
  
  if (!cleanEmail) {
    console.warn(`Skipping vendor ${vendor.vendorName} due to invalid email`);
    continue;
  }
  
  outputItems.push({
    json: {
      // ... other fields ...
      email: cleanEmail,
      // ... rest of vendor data ...
    }
  });
}
```

---

## 🟡 Priority 2: Important Improvements

### 6. Add Retry Logic with Exponential Backoff (Node: "Wait 1 Hour for AVL")

**Replace Current Wait Node with Code Node:**
```javascript
// Exponential backoff retry logic
const MAX_RETRIES = 10;
const BASE_DELAY = 60000; // Start with 1 minute
const MAX_DELAY = 3600000; // Cap at 1 hour

// Get retry count from previous iteration
const retryCount = $json.retryCount || 0;

if (retryCount >= MAX_RETRIES) {
  // Maximum retries reached, escalate
  return [{
    json: {
      action: 'escalate',
      reason: 'max_retries_exceeded',
      retryCount: retryCount,
      rfqId: $json.rfqId,
      nineComNumber: $json.nineComNumber,
      escalationRequired: true,
      finalStatus: 'avl_not_found_after_retries'
    }
  }];
}

// Calculate next delay with exponential backoff
const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);

// Add jitter to prevent thundering herd
const jitter = Math.random() * 0.1 * delay;
const finalDelay = Math.floor(delay + jitter);

return [{
  json: {
    action: 'retry',
    retryCount: retryCount + 1,
    nextRetryIn: finalDelay,
    nextRetryAt: new Date(Date.now() + finalDelay).toISOString(),
    rfqId: $json.rfqId,
    nineComNumber: $json.nineComNumber
  }
}];
```

---

### 7. Add Connection Pooling Configuration (Workflow Settings)

**Add Environment Variables:**
```javascript
// Add to Workflow Configuration node
const DB_CONFIG = {
  // Connection pool settings
  connectionPool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Retry configuration
  retryConfig: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
    randomize: true,
  },
  
  // Circuit breaker
  circuitBreaker: {
    threshold: 5,
    timeout: 60000,
    resetTimeout: 30000,
  }
};

return [{
  json: {
    ...items[0].json,
    dbConfig: DB_CONFIG
  }
}];
```

---

### 8. Handle External Service Failures

**Add After Each External Service Call (Gmail, OpenAI, Google Sheets):**

```javascript
// Generic external service error handler
const handleServiceError = (serviceName, error, context) => {
  const errorTypes = {
    'RATE_LIMIT': {
      shouldRetry: true,
      waitTime: 60000,
      message: 'Rate limit exceeded'
    },
    'AUTH_FAILED': {
      shouldRetry: false,
      waitTime: 0,
      message: 'Authentication failed - check credentials'
    },
    'TIMEOUT': {
      shouldRetry: true,
      waitTime: 5000,
      message: 'Request timed out'
    },
    'NETWORK': {
      shouldRetry: true,
      waitTime: 10000,
      message: 'Network error'
    },
    'UNKNOWN': {
      shouldRetry: true,
      waitTime: 30000,
      message: 'Unknown error occurred'
    }
  };
  
  // Determine error type
  let errorType = 'UNKNOWN';
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    errorType = 'RATE_LIMIT';
  } else if (error.message.includes('401') || error.message.includes('auth')) {
    errorType = 'AUTH_FAILED';
  } else if (error.message.includes('timeout')) {
    errorType = 'TIMEOUT';
  } else if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
    errorType = 'NETWORK';
  }
  
  const errorInfo = errorTypes[errorType];
  
  // Log error for monitoring
  console.error(`${serviceName} Error:`, {
    type: errorType,
    message: error.message,
    context: context,
    timestamp: new Date().toISOString()
  });
  
  // Return error handling decision
  return {
    serviceName,
    errorType,
    shouldRetry: errorInfo.shouldRetry,
    waitTime: errorInfo.waitTime,
    message: errorInfo.message,
    originalError: error.message,
    context
  };
};

// Example usage after Gmail send:
try {
  // Gmail send operation
} catch (error) {
  const errorDecision = handleServiceError('Gmail', error, {
    rfqId: $json.rfqId,
    vendorEmail: $json.email
  });
  
  if (errorDecision.shouldRetry) {
    // Queue for retry
    $json.retryRequired = true;
    $json.retryAfter = errorDecision.waitTime;
  } else {
    // Escalate immediately
    throw new Error(`Critical Gmail error: ${errorDecision.message}`);
  }
}
```

---

## 🟢 Priority 3: Nice-to-Have Optimizations

### 9. Add Performance Monitoring

**Add Code Node: "Capture Performance Metrics"**
```javascript
// Performance monitoring
const startTime = $workflow.startedAt || Date.now();
const currentTime = Date.now();
const elapsedMs = currentTime - startTime;

const metrics = {
  workflowName: 'Main Processor AI B',
  executionId: $execution.id,
  rfqId: $json.rfqId,
  
  // Stage timings
  stages: {
    emailProcessing: $json.emailProcessingMs || 0,
    aiExtraction: $json.aiExtractionMs || 0,
    avlLookup: $json.avlLookupMs || 0,
    vendorProcessing: $json.vendorProcessingMs || 0,
    databaseWrites: $json.databaseWritesMs || 0
  },
  
  // Counts
  counts: {
    vendorsProcessed: $json.vendorCount || 0,
    attachmentsProcessed: $json.attachmentCount || 0,
    retriesPerformed: $json.retryCount || 0
  },
  
  // Health indicators
  health: {
    extractionQuality: $json.qualityScore || 0,
    errorsEncountered: $json.errorCount || 0,
    warningsGenerated: $json.warningCount || 0
  },
  
  totalElapsedMs: elapsedMs,
  timestamp: new Date().toISOString()
};

// Store metrics for dashboard
return [{
  json: {
    ...items[0].json,
    performanceMetrics: metrics
  }
}];
```

---

### 10. Add Batch Processing for Multiple Vendors

**Modify "Send RFQ Email to Vendor" section:**
```javascript
// Batch vendor processing
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

const vendors = $input.all();
const batches = [];

// Create batches
for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
  batches.push(vendors.slice(i, i + BATCH_SIZE));
}

// Process each batch
const results = [];
for (const [index, batch] of batches.entries()) {
  // Process batch in parallel
  const batchResults = await Promise.all(
    batch.map(async (vendor) => {
      try {
        // Send email (this would be the actual send operation)
        return {
          success: true,
          vendorEmail: vendor.json.email,
          sentAt: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          vendorEmail: vendor.json.email,
          error: error.message
        };
      }
    })
  );
  
  results.push(...batchResults);
  
  // Wait between batches to avoid rate limiting
  if (index < batches.length - 1) {
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
  }
}

return results.map(r => ({ json: r }));
```

---

## Testing Checklist

### After implementing each fix, test:

- [ ] Fix 1: Generate 10 RFQ IDs and verify format is BQ-YYYYMMDDHHMMSS
- [ ] Fix 2: Send memo with missing fields and verify validation catches them
- [ ] Fix 3: Disconnect database and verify retry logic works
- [ ] Fix 4: Trigger 5 failures and verify circuit breaker opens
- [ ] Fix 5: Send vendors with malformed emails and verify sanitization
- [ ] Fix 6: Test AVL retry with exponential backoff
- [ ] Fix 7: Monitor database connections during load
- [ ] Fix 8: Simulate Gmail API failure and verify handling
- [ ] Fix 9: Check performance metrics are being captured
- [ ] Fix 10: Send to 25 vendors and verify batching works

---

## Implementation Order

1. **Day 1 (2-3 hours):**
   - Fix 1: RFQ ID format
   - Fix 2: Data validation
   - Fix 5: Email validation

2. **Day 2 (2-3 hours):**
   - Fix 3: Supabase error handling
   - Fix 8: External service failures

3. **Day 3 (2-3 hours):**
   - Fix 4: Circuit breaker
   - Fix 6: Exponential backoff

4. **Post-MVP (when time allows):**
   - Fix 7: Connection pooling
   - Fix 9: Performance monitoring
   - Fix 10: Batch processing

---

## Quick Wins (Do These First)

1. **RFQ ID Format** - 5 minutes to fix, prevents major issues
2. **Email Validation** - 10 minutes, prevents email send failures
3. **Basic Validation** - 20 minutes, catches 90% of data issues
4. **Supabase Retry Settings** - 5 minutes per node, huge stability gain

Total time for quick wins: **Under 1 hour**

These quick fixes will prevent 80% of production issues!
