# AI Configurations - OpenAI Integration

## Overview
Complete OpenAI configurations for production RFQ automation. All prompts are designed for high accuracy, structured output, and error handling.

**Model**: GPT-4 (or GPT-5 when available)
**Temperature**: 0.1 (for consistency)
**Response Format**: JSON for all extractions

## 1. Email Processor Workflow

### Initial Email Analysis
Identifies vendor and extracts basic information from quotation emails.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.1,
  "system_message": `You are an expert procurement analyst for Bin Quraya. 
    Extract vendor information from quotation emails with 100% accuracy.
    Always return valid JSON even if some fields are unknown.`,
  
  "user_message": `Analyze this email and extract:
    Email content: {{email_body}}
    Subject: {{email_subject}}
    From: {{from_email}}
    
    Extract and return as JSON:
    {
      "vendor_name": "Full company name",
      "vendor_email": "email address",
      "vendor_id": "9V-XXXX if mentioned",
      "contact_person": "name of person signing",
      "rfq_reference": "RFQ number being responded to",
      "has_attachments": true/false,
      "attachment_names": ["list of attachments"],
      "email_intent": "quotation_submission|clarification|other",
      "confidence_score": 0.0-1.0
    }`,
    
  "response_format": { "type": "json_object" }
}
```

### Vendor Document Analysis
Extracts detailed commercial and technical data from attachments.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.1,
  "system_message": `You are a technical procurement specialist analyzing vendor quotations for Bin Quraya.
    Focus on extracting exact data for heat exchanger quotations.
    Material grade is critical - SS 316L is required.
    Look for both stated prices and calculated totals.`,
  
  "user_message": `Analyze this vendor quotation document:
    Document content: {{document_text}}
    RFQ Requirement: Heat Exchanger, Material SS 316L
    
    Extract ALL of the following:
    {
      "technical_data": {
        "item_description": "exact description from quotation",
        "material_grade": "extract carefully - SS 316L, SS 304, etc.",
        "material_compliance": "compliant|non-compliant|unclear",
        "quantity_offered": number,
        "technical_deviations": ["list any deviations from RFQ"],
        "certifications_mentioned": ["ISO 9001", "Aramco approval", etc.]
      },
      "commercial_data": {
        "unit_price": number,
        "total_price": number,
        "currency": "USD|SAR|EUR",
        "price_basis": "per unit|lump sum",
        "delivery_period_days": number,
        "delivery_terms": "exact text",
        "payment_terms": "e.g., 30/70, 10/90",
        "incoterms": "FOB|CIF|DDP|etc.",
        "validity_days": number,
        "warranty_period_months": number
      },
      "extracted_sections": {
        "price_section": "copy exact price text",
        "delivery_section": "copy exact delivery text",
        "terms_section": "copy exact terms text"
      },
      "confidence_scores": {
        "material_confidence": 0.0-1.0,
        "price_confidence": 0.0-1.0,
        "overall_confidence": 0.0-1.0
      }
    }`,
    
  "response_format": { "type": "json_object" }
}
```

### Technical Compliance Check
Validates material specifications against requirements.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.1,
  "system_message": `You are a materials engineer validating technical compliance for Bin Quraya.
    The requirement is SS 316L stainless steel for heat exchangers.
    Be strict about material grades - only exact matches are compliant.`,
  
  "user_message": `Validate technical compliance:
    Required: {{rfq_requirements}}
    Offered: {{vendor_technical_data}}
    
    Determine:
    {
      "material_compliance": {
        "is_compliant": true/false,
        "material_offered": "exact grade",
        "material_required": "SS 316L",
        "compliance_reason": "explanation"
      },
      "requires_tbc": true/false,
      "tbc_items": [
        {
          "issue": "description",
          "clarification_needed": "what to ask vendor"
        }
      ],
      "compliance_summary": "brief summary"
    }`,
    
  "response_format": { "type": "json_object" }
}
```

## 2. Commercial Evaluation Workflow

### Multi-Vendor Comparison
Analyzes all vendor offers simultaneously for scoring.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.1,
  "system_message": `You are a procurement analyst preparing vendor evaluation for Bin Quraya.
    Apply the standard scoring formula fairly and accurately.
    Consider total cost of ownership, not just price.`,
  
  "user_message": `Analyze and score these vendor offers:
    Vendors: {{vendor_offers_json}}
    
    Scoring weights:
    - Price: 35%
    - Delivery: 30%
    - Payment Terms: 20%
    - Warranty: 10%
    - Compliance: 5%
    
    Calculate scores using:
    - Price Score = (Lowest Price / Vendor Price) × 100
    - Delivery Score = (Shortest Delivery / Vendor Delivery) × 100
    - Payment Score = Based on cash flow favorability
    - Warranty Score = (Vendor Warranty / Max Warranty) × 100
    - Compliance Score = 100 if compliant, 0 if not
    
    Return:
    {
      "vendor_scores": [
        {
          "vendor_name": "name",
          "scores": {
            "price_score": number,
            "delivery_score": number,
            "payment_score": number,
            "warranty_score": number,
            "compliance_score": number,
            "total_score": number
          },
          "rank": number,
          "strengths": ["list"],
          "weaknesses": ["list"]
        }
      ],
      "recommendation": {
        "recommended_vendor": "name",
        "reason": "explanation",
        "risk_factors": ["list"],
        "alternative_vendors": ["ranked list"]
      }
    }`,
    
  "response_format": { "type": "json_object" }
}
```

### Executive Summary Generation
Creates management-ready decision summary.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.3,
  "system_message": `You are preparing an executive summary for Bin Quraya management.
    Be concise, highlight key points, and focus on business value.
    Use professional language and clear recommendations.`,
  
  "user_message": `Create executive summary for RFQ {{rfq_id}}:
    Material: {{material_description}}
    Vendor Analysis: {{vendor_scores}}
    
    Generate:
    {
      "executive_summary": {
        "overview": "2-3 sentence summary",
        "participation": "X vendors invited, Y responded",
        "recommendation": "Recommended vendor and why",
        "financial_impact": {
          "recommended_price": "$X",
          "highest_quote": "$Y", 
          "potential_savings": "$Z",
          "savings_percentage": "XX%"
        },
        "key_findings": [
          "Finding 1",
          "Finding 2",
          "Finding 3"
        ],
        "risks_and_mitigation": [
          {
            "risk": "description",
            "mitigation": "action"
          }
        ],
        "next_steps": [
          "Award PO to recommended vendor",
          "Notify unsuccessful vendors",
          "Schedule delivery follow-up"
        ]
      }
    }`,
    
  "response_format": { "type": "json_object" }
}
```

## 3. Purchase Order Generation

### PO Data Extraction
Prepares data for purchase order creation.

```javascript
{
  "model": "gpt-4",
  "temperature": 0.1,
  "system_message": `Extract precise purchase order data from approved vendor selection.
    Ensure all commercial terms are accurately captured.`,
  
  "user_message": `Generate PO data from:
    Selected Vendor: {{selected_vendor}}
    RFQ Details: {{rfq_details}}
    
    Extract:
    {
      "po_header": {
        "vendor_name": "exact name",
        "vendor_id": "9V-XXXX",
        "vendor_address": "if available",
        "contact_person": "name",
        "contact_email": "email",
        "contact_phone": "phone"
      },
      "po_lines": [
        {
          "line_number": 1,
          "description": "detailed description",
          "material_code": "450-012547",
          "quantity": number,
          "unit": "EA/SET/etc",
          "unit_price": number,
          "total_price": number
        }
      ],
      "commercial_terms": {
        "payment_terms": "exact terms",
        "delivery_terms": "period and date",
        "incoterms": "FOB/DDP/etc",
        "warranty": "period",
        "special_conditions": ["list"]
      },
      "amounts": {
        "subtotal": number,
        "tax_rate": 0.15,
        "tax_amount": number,
        "total_amount": number,
        "currency": "USD"
      }
    }`,
    
  "response_format": { "type": "json_object" }
}
```

## 4. Error Handling & Validation

### AI Extraction Validation
Validates AI-extracted data for completeness and accuracy.

```javascript
{
  "model": "gpt-4", 
  "temperature": 0.1,
  "system_message": `Validate extracted data for completeness and accuracy.
    Flag any missing critical fields or suspicious values.`,
  
  "user_message": `Validate this extracted data:
    {{extracted_data}}
    
    Check for:
    {
      "validation_result": {
        "is_valid": true/false,
        "completeness_score": 0.0-1.0,
        "missing_fields": ["list critical missing fields"],
        "suspicious_values": [
          {
            "field": "field name",
            "value": "suspicious value",
            "reason": "why suspicious"
          }
        ],
        "requires_manual_review": true/false,
        "review_reasons": ["list reasons"]
      }
    }`,
    
  "response_format": { "type": "json_object" }
}
```

## 5. Implementation Best Practices

### n8n Configuration
```javascript
// OpenAI Node Settings
{
  "authentication": "apiKey",
  "resource": "textCompletion", 
  "model": "gpt-4",
  "temperature": 0.1,
  "maxTokens": 2000,
  "topP": 1,
  "frequencyPenalty": 0,
  "presencePenalty": 0,
  "timeout": 30000 // 30 seconds
}
```

### Error Handling
1. **Retry Logic**: Retry failed extractions up to 3 times
2. **Fallback**: Queue for manual review if AI confidence < 0.7
3. **Validation**: Always validate JSON structure before use
4. **Logging**: Log all AI calls with inputs/outputs for debugging

### Cost Optimization
1. **Caching**: Cache repeated analyses (same document)
2. **Batching**: Process multiple items in single call when possible
3. **Truncation**: Limit document text to relevant sections
4. **Model Selection**: Use GPT-3.5 for simple extractions

### Monitoring
Track these metrics:
- Average confidence scores by document type
- Extraction success rate
- Manual review rate
- API costs per RFQ
- Processing time per document

## 6. Testing Prompts

### Test Scenarios
1. **Standard Quotation**: Vendor A with correct material
2. **Non-Compliant**: Vendor B with SS 304 instead of SS 316L
3. **Missing Data**: Quotation without delivery terms
4. **Complex Format**: Multi-page PDF with tables
5. **Foreign Currency**: Quotation in EUR requiring conversion

### Validation Dataset
Maintain a set of pre-validated documents for testing:
- 10 compliant quotations
- 5 non-compliant quotations  
- 5 edge cases (missing data, unusual formats)
- Expected outputs for each

## Future Enhancements
1. **Fine-tuning**: Create custom model for Bin Quraya documents
2. **Multi-language**: Support Arabic quotations
3. **Image Analysis**: Extract from scanned documents
4. **Learning Loop**: Improve from corrections
5. **Predictive**: Suggest optimal vendors before RFQ
