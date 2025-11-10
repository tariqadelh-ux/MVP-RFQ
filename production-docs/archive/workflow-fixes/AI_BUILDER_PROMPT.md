# AI Builder Prompt for RFQ Extraction

## Prompt for n8n AI Builder

I need to modify my RFQ workflow to extract existing RFQ numbers from emails/documents instead of generating new ones. 

### Requirements:

1. **Extract, Don't Generate**
   - The RFQ number/ID already exists in the email or attached document
   - Extract it EXACTLY as written (could be RFQ-2024-001, RFQ#12345, etc.)
   - Never generate or modify the RFQ number

2. **Flexible Extraction**
   - RFQs come in many formats - formal PDFs, casual emails, structured forms
   - Use context clues to identify fields when not explicitly labeled
   - Handle both "RFQ Number:" and informal references like "Quote request for..."

3. **Required Fields to Extract**:
   - RFQ Number/ID (exactly as provided)
   - 9COM Number
   - Project Name
   - Material Description
   - Specifications
   - Quantity
   - Delivery Location & Timeline
   - Response Deadline
   - Critical Requirements
   - WBS Code (if available)
   - Budget Info (if available)
   - Vendor Requirements (if specified)

4. **Output Structure**
   - Use structured output parser
   - Return empty string or "Not specified" for missing optional fields
   - NEVER make up or hallucinate data
   - Preserve original formatting of codes/numbers

5. **Error Handling**
   - If no RFQ number found, this is a critical error
   - Other fields can be optional but log if missing
   - Validate that extracted RFQ follows some recognizable pattern

Please update the AI extraction nodes to be production-ready and handle real-world RFQ variations intelligently.
