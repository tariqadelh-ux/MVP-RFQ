# RFQ Process Flow - Detailed Production Guide

## Overview
Complete 6-stage RFQ automation process from initiation to purchase order. Based on real Bin Quraya operations with ~95% automation, requiring human input only for final vendor selection.

## Stage 1: Initiation
**Trigger**: New RFQ requirement identified

### Production Requirements
- Monitor procurement initiation folder continuously
- AI extracts project details from PE-7-MEMO documents
- Auto-generate RFQ package from templates

### Key Actions
1. **AI Document Analysis**
   - Extract: Project ID, 9COM code, description, quantity
   - Parse PE-7-MEMO for technical requirements
   - Identify applicable standards (Aramco SAES-A-301)

2. **Automatic Package Creation**
   - Pull correct AVL from 9COM mapping
   - Include technical compliance matrix
   - Add commercial evaluation template
   - Generate unique RFQ ID

### Dashboard Update
```json
{
  "event": "RFQ_INITIATED",
  "rfqId": "RFQ-2024-001",
  "projectId": "P-SAOO-0092548",
  "material": "450-012547 SS 316L Heat Exchanger",
  "status": "Preparing RFQ Package"
}
```

## Stage 2: RFQ Distribution
**Trigger**: RFQ package ready + approved vendors identified

### Production Requirements  
- Send to ALL approved vendors simultaneously
- Track email delivery status
- Start response timer (7 days)
- Schedule automatic reminders

### Key Actions
1. **Vendor List Processing**
   - Query AVL for commodity code
   - Get all active vendor emails
   - Validate vendor status

2. **Email Distribution**
   - Personalized emails per vendor
   - Attach complete RFQ package
   - Include clear deadlines
   - Set up bounce handling

### Dashboard Update
```json
{
  "event": "RFQ_SENT",
  "vendorCount": 12,
  "dueDate": "2024-11-20",
  "status": "Awaiting Vendor Responses"
}
```

## Stage 3: Vendor Response Collection
**Trigger**: Email from vendor with quotation

### Production Requirements
- Monitor emails 24/7 (5-minute intervals minimum)
- AI extracts ALL vendor data automatically
- Handle any attachment format (PDF, Excel, Word)
- No hard-coded vendor names or formats

### Key Actions
1. **Email Processing**
   ```javascript
   // AI Prompt for Email Analysis
   "Extract vendor details from this quotation email:
   - Vendor name and ID
   - Contact person and email
   - RFQ reference number
   - Attached files
   Return as structured JSON"
   ```

2. **Document Extraction**
   ```javascript
   // AI Prompt for Document Analysis
   "Extract commercial and technical data:
   - Item description and material grade
   - Unit price and total price
   - Delivery period
   - Payment terms (e.g., 30/70)
   - Incoterms (FOB, DDP, etc.)
   - Warranty period
   - Technical compliance statement
   Identify any deviations from requirements"
   ```

3. **Data Storage**
   - Save to Supabase vendor_offers table
   - Store original documents in Google Drive
   - Log response timestamp

### Dashboard Update
```json
{
  "event": "VENDOR_RESPONDED",
  "vendorName": "Vendor A Industries",
  "responseTime": "2 days 4 hours",
  "documentsReceived": ["quotation.pdf", "compliance_matrix.xlsx"],
  "initialCompliance": "Pending Technical Review"
}
```

## Stage 4: Technical Review
**Trigger**: Vendor response received

### Production Requirements
- Automatic technical compliance check
- AI validates material specifications
- Flag non-compliant offers immediately
- Generate TBC for clarifications

### Key Actions
1. **Compliance Validation**
   - Check material grade (SS 316L required)
   - Verify Aramco standards compliance
   - Validate certifications
   - Check delivery against requirements

2. **TBC Generation** (if needed)
   ```
   IF material != "SS 316L" OR missing_certifications:
     - Generate Technical Bid Clarification
     - Email vendor automatically
     - Set 48-hour deadline
     - Track TBC status
   ```

### Dashboard Update
```json
{
  "event": "VENDOR_APPROVED", // or "TBC_ISSUED"
  "vendorName": "Vendor A Industries",
  "technicalStatus": "Compliant",
  "material": "SS 316L",
  "certifications": ["ISO 9001", "Aramco Approved"]
}
```

## Stage 5: Commercial Evaluation
**Trigger**: All vendor responses collected OR deadline reached

### Production Requirements
- Wait for ALL vendors or deadline
- Apply weighted scoring formula
- Generate comparison matrix
- Prepare decision package

### Key Scoring Formula
```javascript
totalScore = (priceScore * 0.35) + 
             (deliveryScore * 0.30) + 
             (paymentScore * 0.20) +
             (warrantyScore * 0.10) +
             (complianceScore * 0.05)

// Where:
// priceScore = (lowestPrice / vendorPrice) * 100
// deliveryScore = (shortestDelivery / vendorDelivery) * 100
// paymentScore = Based on payment terms favorability
// warrantyScore = (vendorWarranty / maxWarranty) * 100
// complianceScore = Binary (100 if compliant, 0 if not)
```

### Decision Package Contents
1. **Executive Summary** (AI-generated)
2. **Detailed Comparison Matrix**
3. **Technical Compliance Summary**
4. **Price Analysis**
5. **Delivery Timeline Comparison**
6. **Risk Assessment**
7. **Recommendation** (top 3 vendors)

### Dashboard Update
```json
{
  "event": "DECISION_READY",
  "topVendor": {
    "name": "Vendor C Trading",
    "score": 84.5,
    "price": "$36,500",
    "delivery": "60 days",
    "savings": "$12,000 vs highest"
  },
  "alternativeVendors": [...],
  "status": "Awaiting Management Approval"
}
```

## Stage 6: Award & Close
**Trigger**: Management approves vendor selection

### Production Requirements
- Generate PO automatically
- Send award notification
- Send regret letters to others
- Archive all documentation

### Key Actions
1. **Purchase Order Generation**
   - Pull approved vendor details
   - Include all commercial terms
   - Add standard T&Cs
   - Generate PO number

2. **Notifications**
   - Award email to selected vendor
   - Regret letters to others
   - Internal notifications to stakeholders
   - Update procurement systems

3. **Documentation**
   - Archive complete RFQ folder
   - Store decision rationale
   - Update vendor performance metrics
   - Close RFQ in system

### Dashboard Update
```json
{
  "event": "RFQ_CLOSED",
  "poNumber": "PO-2024-1847",
  "awardedVendor": "Vendor C Trading",
  "totalValue": "$36,500",
  "expectedDelivery": "2025-01-15",
  "cycleTime": "6 days 14 hours",
  "status": "Purchase Order Issued"
}
```

## Production Monitoring Points

### Critical KPIs to Track
1. **Response Rate**: Vendors responded / Vendors invited
2. **Compliance Rate**: Compliant offers / Total offers  
3. **Cycle Time**: PO issue date - RFQ initiation
4. **Cost Savings**: Highest quote - Selected quote
5. **First-Time-Right**: Offers without TBC / Total offers

### Error Handling
- **Email Bounce**: Flag and notify procurement
- **No Responses**: Escalate after deadline
- **All Non-Compliant**: Trigger re-tendering
- **AI Extraction Failure**: Manual review queue

## Continuous Improvement
- AI learns from each RFQ cycle
- Pattern recognition for vendor behavior
- Optimization of scoring weights
- Predictive analytics for delivery performance
