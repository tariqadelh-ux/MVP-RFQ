# Email Templates Testing Guide

This folder contains all email templates for testing the RFQ automation workflows.

## 1. Management Procurement Initiation Email
**File:** `Memo_Email_Management.md`  
**Purpose:** Triggers Workflow 1 (Main Processor)  
**From:** binquraya.procurement.demo+management@gmail.com  
**To:** binquraya.procurement.demo@gmail.com  
**Attachment Required:** PE-7-MEMO-001_Procurement_Initiation (1) (3).pdf  
**Key Data:**
- 9COM Number: 450-012547
- Project: Eagle - Aramco Site 7 Expansion
- Material: High-Pressure Shell & Tube Heat Exchanger
- Critical: SS 316/316L required

## 2. Vendor A Response (Compliant)
**File:** `Vendor_A_Compliant_Email.md`  
**Purpose:** Tests Workflow 2 (Vendor Response Processing) - Happy Path  
**From:** vendor.a.demo@gmail.com  
**To:** binquraya.procurement.demo@gmail.com  
**Attachment Required:** vendor_a_quote.pdf  
**Expected Result:** Compliant vendor offer created

## 3. Vendor B Response (Non-Compliant)
**File:** `Vendor_B_Non_Compliant_Email.md`  
**Purpose:** Tests Workflow 2 - TBC Path  
**From:** vendor.b.demo@gmail.com  
**To:** binquraya.procurement.demo@gmail.com  
**Attachment Required:** vendor_b_quote.pdf  
**Expected Result:** Non-compliant status, TBC email sent

## 4. Vendor C Response (Compliant - Minimal)
**File:** `Vendor_C_Compliant_Email.md`  
**Purpose:** Tests Workflow 2 - Minimal email with technical data tags  
**From:** vendor.c.demo@gmail.com  
**To:** binquraya.procurement.demo@gmail.com  
**Attachment Required:** Vendor C Global - Quotation (1).pdf  
**Expected Result:** Compliant vendor offer created
**Note:** Very brief email with structured data tags

## Testing Sequence

### Phase 1: RFQ Creation
1. Send `Memo_Email_Management.md` email with attachment
2. Wait for Workflow 1 to create RFQ and send to vendors
3. Verify emails sent to vendor list from AVL

### Phase 2: Vendor Responses  
1. Send `Vendor_A_Compliant_Email.md` - should process normally
2. Send `Vendor_B_Non_Compliant_Email.md` - should trigger TBC
3. Send `Vendor_C_Compliant_Email.md` - tests minimal email format
4. Check vendor_offers table for compliance status (2 compliant, 1 non-compliant)

### Phase 3: Gatekeeper & Evaluation
With 3 vendor responses (2 compliant), the gatekeeper should trigger evaluation immediately

## Notes
- All emails use the RFQ ID format: BQ-YYYYMMDDHHMMSS
- Ensure Gmail labels are cleared before testing
- Check Supabase tables after each phase
- Monitor n8n execution view for any errors
