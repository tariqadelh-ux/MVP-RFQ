# RFQ Extraction Fix - Extract Instead of Generate

## Problem
The workflow currently generates its own RFQ ID (BQ-YYYYMMDDHHMMSS) instead of extracting the existing RFQ number from the company's email/document.

## Solution Overview

### 1. Update AI Extraction Prompts

**For "Extract Procurement Details with AI" node**, update the prompt to:

```
You are a procurement data extraction specialist. Your task is to extract structured procurement information from emails and attached documents.

CRITICAL RULES:
1. **RFQ ID/Number**: Extract EXACTLY as provided in the document. Common formats:
   - RFQ-2024-001
   - RFQ#12345
   - RFQ 2024/11/001
   - BQ-20241108123456
   - Or any other format the company uses
   
2. **Do NOT generate or modify the RFQ number** - use it exactly as written

3. If the RFQ number is not clearly labeled, look for:
   - Subject line references (e.g., "Re: RFQ 12345")
   - Document headers
   - Reference numbers
   - Quotation request numbers

Extract the following fields:
- RFQ Number/ID (EXACTLY as provided)
- 9COM Number
- Project Name and ID
- Material Description and Specifications
- Quantity and Unit
- Critical Requirements
- WBS Code
- Budget Information
- Delivery Location and Timeline
- Response Deadline
- Vendor Requirements (if specified)

Return the data in the structured format specified by the output parser.
```

### 2. Update Structured Output Parser Schemas

**For "Structured Procurement Data Parser"**, update the jsonSchemaExample to include rfqNumber:

```json
{
  "rfqNumber": "RFQ-2024-001",
  "nineComNumber": "123-456789",
  "projectName": "Pipeline Expansion Project",
  "projectId": "PRJ-2024-001",
  "materialDescription": "Stainless Steel Pipes",
  "specifications": "SS 316L, 6 inch diameter, Schedule 40",
  "quantity": "500 meters",
  "criticalRequirements": "Material grade must be SS 316L certified",
  "wbsCode": "WBS-1.2.3.4",
  "budgetInfo": "Not specified",
  "deliveryLocation": "Site A, Building 3",
  "deliveryTimeline": "Within 30 days",
  "responseDeadline": "2024-11-15",
  "vendorRequirements": "ISO 9001 certified vendors only"
}
```

### 3. Modify the "Generate RFQ ID" Node

Rename it to **"Process RFQ Data"** and update the code:

```javascript
// Process extracted RFQ data and ensure we have the RFQ ID
const items = $input.all();
const outputItems = [];

for (const item of items) {
  const data = item.json;
  
  // Get the RFQ number from AI extraction
  let rfqId = data.output?.rfqNumber || data.rfqNumber || '';
  
  // Validation: Ensure we have an RFQ ID
  if (!rfqId || rfqId.trim() === '') {
    throw new Error('RFQ Number not found in the document. Please ensure the document contains a clear RFQ reference number.');
  }
  
  // Clean up the RFQ ID (remove extra spaces but preserve format)
  rfqId = rfqId.trim();
  
  // Extract or calculate submission deadline
  let submissionDeadline = data.output?.responseDeadline || data.responseDeadline;
  
  if (!submissionDeadline) {
    // If no deadline specified, default to 7 days from now
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    submissionDeadline = defaultDeadline.toISOString();
  } else {
    // Parse the deadline if it's a string date
    try {
      submissionDeadline = new Date(submissionDeadline).toISOString();
    } catch (e) {
      // If parsing fails, use 7 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      submissionDeadline = defaultDeadline.toISOString();
    }
  }
  
  outputItems.push({
    json: {
      ...data,
      rfqId: rfqId,
      submissionDeadline: submissionDeadline,
      extractedAt: new Date().toISOString()
    }
  });
}

return outputItems;
```

### 4. Make AI More Flexible

**Update both "Extract from Email Body (Fallback)" with the same enhanced prompt** that can handle various RFQ formats:

```
You are an expert procurement data extractor. Companies send RFQs in many different formats - some formal, some informal. Your job is to intelligently extract the key information regardless of format.

EXTRACTION RULES:
1. **Be flexible** - RFQs come in many formats (formal documents, casual emails, structured forms)
2. **Extract what's there** - Don't make up missing information
3. **Use context clues** - If something isn't explicitly labeled, use context to identify it
4. **Preserve original formatting** - Especially for RFQ numbers and reference codes

COMMON RFQ PATTERNS TO RECOGNIZE:
- Formal: "RFQ Number: 2024-001"
- Email subject: "Request for Quote - Project Eagle"  
- Informal: "Please quote for the following items..."
- Reference: "As per our RFQ dated 08/11/2024"

FIELD IDENTIFICATION HINTS:
- RFQ Number: Look for "RFQ", "Quote Request", "Quotation", "Reference", "Ref#"
- Deadline: "Due by", "Submit by", "Response required by", "Closing date"
- Quantity: Numbers followed by units (pcs, units, meters, kg, etc.)
- Specifications: Technical details, standards (ISO, ASME, etc.), grades, sizes

Extract available information and map to these fields:
[List same fields as before]

Remember: Every company has their own RFQ format. Be adaptive and intelligent in your extraction.
```

### 5. Update "Insert RFQ Request" Field Mappings

Change the rfq_id field mapping from:
```
"fieldId": "rfq_id",
"fieldValue": "={{ $json.rfqId }}"
```

To ensure it uses the extracted RFQ:
```
"fieldId": "rfq_id", 
"fieldValue": "={{ $json.rfqId || $json.output.rfqNumber }}"
```

### 6. Add Validation Node (Optional but Recommended)

After "Process RFQ Data", add a validation node to ensure data quality:

```javascript
// Validate extracted RFQ data before proceeding
const items = $input.all();
const errors = [];
const warnings = [];

for (const item of items) {
  const data = item.json;
  
  // Check RFQ format (warn if unusual but don't fail)
  const rfqId = data.rfqId;
  const commonPatterns = [
    /^RFQ[-\s]?\d+/i,
    /^BQ-\d+/,
    /^\d{4}\/\d+/,
    /^[A-Z]+-\d+/
  ];
  
  const matchesCommonPattern = commonPatterns.some(pattern => pattern.test(rfqId));
  if (!matchesCommonPattern) {
    warnings.push(`Unusual RFQ format detected: ${rfqId}. Proceeding anyway.`);
  }
  
  // Validate required fields
  if (!data.output?.nineComNumber && !data.nineComNumber) {
    errors.push('9COM number is required but not found');
  }
  
  if (!data.output?.projectName && !data.projectName) {
    warnings.push('Project name not found - using RFQ ID as project identifier');
  }
  
  // Add validation results
  item.json.validation = {
    errors: errors,
    warnings: warnings,
    isValid: errors.length === 0
  };
}

// Only fail if critical errors exist
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.join(', ')}`);
}

return items;
```

## Benefits of This Approach

1. **Flexibility**: Handles any RFQ format the company uses
2. **Accuracy**: Preserves original RFQ numbers exactly
3. **Reliability**: Won't fail on unusual formats, just warns
4. **Traceability**: Maps directly to company's RFQ system
5. **Scalability**: Works with formal and informal RFQ requests

## Testing Recommendations

Test with various RFQ formats:
- Standard: "RFQ-2024-001"
- Date-based: "RFQ/2024/11/08"
- Sequential: "RFQ#12345"
- Custom: "BQ-PROC-2024-NOV-001"
- Informal: "Quote request for heat exchanger project"

## Next Steps

1. Update the workflow nodes as described
2. Test with real RFQ emails/documents
3. Monitor the `extraction_quality_issues` table for patterns
4. Refine prompts based on actual data
