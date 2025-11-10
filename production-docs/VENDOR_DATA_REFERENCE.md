# Vendor Test Data Reference

## Overview
Standard test vendors for the Bin Quraya RFQ system. These vendors represent typical scenarios encountered in production.

**IMPORTANT**: In production, the AI must extract this data from actual emails/documents, not use hard-coded values.

## Test Vendor Accounts

### Email Configuration
All test vendors use Gmail accounts with the following settings:
- IMAP enabled for n8n monitoring
- App-specific passwords configured
- Labels for RFQ tracking

## Standard Test Vendors

### 1. Vendor A Industries (Premium Vendor)
**Profile**: Established manufacturer with high quality but premium pricing

```yaml
Company Details:
  vendor_id: "9V-1102"
  vendor_name: "Vendor A Industries"
  email: "vendor.a.demo@gmail.com"
  contact_person: "Ahmad Hassan"
  phone: "+966-13-8234567"
  type: "Manufacturer"
  tier: "Tier 1"
  
Typical Response Pattern:
  response_time: "Within 2-3 days"
  document_format: "Professional PDF on letterhead"
  completeness: "All information provided"
  
Standard Quotation:
  material_offered: "SS 316L" # Always compliant
  price: "$48,500"
  price_sar: "SAR 181,875"
  delivery: "70 days"
  payment_terms: "30/70"
  incoterms: "DDP Yanbu"
  warranty: "24 months"
  
Scoring Results:
  price_score: 75.3 # Higher price
  delivery_score: 85.7 # Longer delivery
  payment_score: 85.0 # Good terms
  warranty_score: 100.0 # Best warranty
  compliance_score: 100.0 # Always compliant
  total_score: 85.0 # Usually ranks 2nd
  
Strengths:
  - Highest quality products
  - Best warranty terms
  - Full technical compliance
  - Established relationship
  
Weaknesses:
  - Premium pricing
  - Longer delivery times
```

### 2. Vendor B Solutions (Non-Compliant)
**Profile**: Competitive pricing but occasional compliance issues

```yaml
Company Details:
  vendor_id: "9V-4354"
  vendor_name: "Vendor B Solutions"
  email: "vendor.b.demo@gmail.com"
  contact_person: "Mohammed Al-Rashid"
  phone: "+966-11-4567890"
  type: "Trader"
  tier: "Tier 2"
  
Typical Response Pattern:
  response_time: "Within 1-2 days"
  document_format: "Basic PDF or Excel"
  completeness: "May miss some details"
  
Standard Quotation:
  material_offered: "SS 304" # Wrong grade!
  price: "$41,000"
  price_sar: "SAR 153,750"
  delivery: "55 days"
  payment_terms: "20/80"
  incoterms: "FOB Jeddah"
  warranty: "18 months"
  
TBC Required:
  issue: "Material grade SS 304 instead of required SS 316L"
  clarification: "Please confirm if SS 316L is available"
  typical_response: "May offer SS 316L at +15% price"
  
Scoring Results:
  price_score: 89.0 # Good price
  delivery_score: 100.0 # Fastest delivery
  payment_score: 75.0 # Okay terms
  warranty_score: 75.0 # Standard warranty
  compliance_score: 0.0 # Non-compliant
  total_score: 68.0 # Usually ranks 3rd
  
Strengths:
  - Competitive pricing
  - Quick delivery
  - Fast response time
  
Weaknesses:
  - Material compliance issues
  - Limited warranty
  - Requires clarifications
```

### 3. Vendor C Trading (Best Value)
**Profile**: Balanced offering with best overall value

```yaml
Company Details:
  vendor_id: "9V-3291"
  vendor_name: "Vendor C Trading"
  email: "vendor.c.demo@gmail.com"
  contact_person: "Fatima Al-Zahrani"
  phone: "+966-12-3456789"
  type: "Distributor"
  tier: "Tier 1"
  
Typical Response Pattern:
  response_time: "Within 3-4 days"
  document_format: "Professional PDF with attachments"
  completeness: "Complete with certifications"
  
Standard Quotation:
  material_offered: "SS 316L" # Compliant
  price: "$36,500"
  price_sar: "SAR 136,875"
  delivery: "60 days"
  payment_terms: "10/90"
  incoterms: "DDP Yanbu"
  warranty: "12 months"
  
Scoring Results:
  price_score: 100.0 # Best price
  delivery_score: 91.7 # Good delivery
  payment_score: 65.0 # Less favorable terms
  warranty_score: 50.0 # Minimum warranty
  compliance_score: 100.0 # Compliant
  total_score: 84.5 # Usually wins
  
Strengths:
  - Best pricing
  - Reasonable delivery
  - Full compliance
  - Good track record
  
Weaknesses:
  - Shorter warranty
  - Stricter payment terms
  - Slower response time
```

## Additional Test Scenarios

### 4. Late Responder Vendor
```yaml
vendor_name: "Vendor D Manufacturing"
email: "vendor.d.demo@gmail.com"
behavior: "Responds after deadline"
use_case: "Testing late response handling"
```

### 5. Incomplete Response Vendor
```yaml
vendor_name: "Vendor E Supplies"
email: "vendor.e.demo@gmail.com"
behavior: "Sends partial information"
use_case: "Testing follow-up automation"
```

### 6. No Response Vendor
```yaml
vendor_name: "Vendor F International"
email: "vendor.f.demo@gmail.com"
behavior: "Never responds to RFQs"
use_case: "Testing non-response scenarios"
```

## Email Templates for Testing

### Vendor A Email Format
```
Subject: RE: RFQ-2024-001 - Quotation for Heat Exchanger

Dear Procurement Team,

Thank you for your inquiry. Please find attached our technical and commercial offer for the requested heat exchangers.

We confirm:
- Material: SS 316L as per ASTM A240
- Compliance with Aramco standards
- All required certifications available

Best regards,
Ahmad Hassan
Sales Manager
Vendor A Industries
```

### Vendor B Email Format  
```
Subject: Quotation - RFQ-2024-001

Hi,

Please see attached quotation for heat exchangers.
Note: We're offering SS 304 which has similar properties at better price.

Thanks,
Mohammed
Vendor B Solutions
```

### Vendor C Email Format
```
Subject: Commercial Offer - RFQ-2024-001 Heat Exchanger

Dear Sir/Madam,

We are pleased to submit our best offer for the subject requirement.

Material offered: SS 316L (exact match to your specification)
Delivery: 60 days from PO
Price validity: 30 days

Attached:
1. Commercial offer
2. Technical datasheet
3. Compliance matrix

Regards,
Fatima Al-Zahrani
Business Development Manager
Vendor C Trading Co.
```

## Test Data Variations

### Price Variations by Quantity
```yaml
quantity_1:
  vendor_a: "$48,500"
  vendor_b: "$41,000"
  vendor_c: "$36,500"
  
quantity_5:
  vendor_a: "$235,000" # 3% discount
  vendor_b: "$195,000" # 5% discount
  vendor_c: "$173,875" # 4.5% discount
  
quantity_10_plus:
  vendor_a: "$460,750" # 5% discount
  vendor_b: "$369,000" # 10% discount
  vendor_c: "$328,500" # 10% discount
```

### Delivery Variations by Season
```yaml
normal_period:
  vendor_a: "70 days"
  vendor_b: "55 days"
  vendor_c: "60 days"
  
peak_season: # Add 20-30%
  vendor_a: "90 days"
  vendor_b: "70 days"
  vendor_c: "75 days"
  
urgent_delivery: # Express options
  vendor_a: "45 days (+15% price)"
  vendor_b: "35 days (+20% price)"
  vendor_c: "40 days (+18% price)"
```

## Vendor Performance History

### Historical Metrics
```yaml
vendor_a:
  total_rfqs: 47
  won_rfqs: 12
  win_rate: "25.5%"
  avg_response_time: "2.3 days"
  on_time_delivery: "98%"
  quality_issues: 0
  
vendor_b:
  total_rfqs: 52
  won_rfqs: 8
  win_rate: "15.4%"
  avg_response_time: "1.8 days"
  on_time_delivery: "92%"
  quality_issues: 2
  
vendor_c:
  total_rfqs: 44
  won_rfqs: 19
  win_rate: "43.2%"
  avg_response_time: "3.1 days"
  on_time_delivery: "95%"
  quality_issues: 1
```

## Usage in Production

### Email Monitoring
```javascript
// n8n Email Trigger Configuration
{
  "mailbox": "INBOX",
  "customQuery": "is:unread subject:RFQ",
  "checkInterval": 5, // minutes
  "markAsRead": true
}
```

### AI Extraction Testing
When testing AI extraction, use these emails to verify:
1. Vendor name extraction accuracy
2. Price parsing (including currency)
3. Technical specification identification
4. Compliance determination
5. Multi-document handling

### Dashboard Testing
Expected KPI values with all three vendors:
- Response Rate: 75% (3 of 4 respond)
- Compliance Rate: 66.7% (2 of 3 compliant)
- Average Response Time: 2.4 days
- Cost Savings: $12,000 (highest - selected)
- Cycle Time: ~6 days

## Troubleshooting Common Issues

### Email Not Detected
- Check IMAP settings
- Verify subject line format
- Confirm sender email matches

### Wrong Data Extraction
- Review AI prompts
- Check document format
- Verify OCR quality

### Scoring Discrepancies
- Validate formula weights
- Check for null values
- Verify score calculations
