# Test Email Setup Guide for RFQ Scenarios

## Overview
You need to create test email accounts for testing vendors in scenarios B, E, F, and G. Each scenario tests different workflow paths. We're using a mix of Yahoo and Outlook accounts.

## Required Test Email Accounts

### Account Password (Same for all accounts)
**Password**: TestRFQ2024!

### For Scenario B (Email Body Only)
- **vendor.d_test@yahoo.com** - Vendor D Test Corp (Yahoo)
- **vendor.e.test@outlook.com** - Vendor E Supplies (Outlook)
- **vendor.f.test@outlook.com** - Vendor F Industries (Outlook)

### For Scenario E (Multiple Items) 
- **vendor.m.multi@outlook.com** - Multi-Item Vendor M
- **vendor.n.multi@outlook.com** - Multi-Item Vendor N
- **vendor.o.multi@outlook.com** - Multi-Item Vendor O

### For Scenario F (Special Characters)
- **vendor.x.special@outlook.com** - Vendor X & Co.
- **vendor.y.special@outlook.com** - Vendor Y (Special) Ltd.
- **vendor.z.special@outlook.com** - Vendor Z "Quality" Inc.

### For Scenario G (Invalid Emails)
- **vendor.valid1@outlook.com** - Valid Vendor 1
- **vendor.valid2@outlook.com** - Valid Vendor 2
- Note: Third vendor will have an invalid email (vendor.invalid@fake.com)

## Setup Instructions

### 1. For Yahoo Account (Vendor D only)
1. Go to [Yahoo Sign Up](https://login.yahoo.com/account/create)
2. Create account with:
   - First Name: Vendor D
   - Last Name: Test Corp
   - Email: vendor.d_test@yahoo.com (underscore format)
   - Password: **TestRFQ2024!**

### 2. For Outlook Accounts (All others)
1. Go to [Outlook Sign Up](https://signup.live.com/)
2. Create each account with:
   - Email: Use the exact email addresses above (with dots)
   - Password: **TestRFQ2024!** (same for all accounts)
   - First Name: Use vendor letter (e.g., "Vendor E")
   - Last Name: Use company type (e.g., "Supplies")
   
**Note**: Outlook allows dots in email addresses and doesn't require phone verification for multiple accounts

### 3. Update Google Sheets AVL

After creating the accounts, add them to your Google Sheets AVL:

#### For Scenario B (9COM: 450-012547 - same as Scenario A)
```
9COM_Number | Vendor_Name        | Vendor_Email              | AVL_Document_ID
450-012547  | Vendor D Test Corp | vendor.d_test@yahoo.com   | [same doc ID]
450-012547  | Vendor E Supplies  | vendor.e.test@outlook.com | [same doc ID]
450-012547  | Vendor F Industries| vendor.f.test@outlook.com | [same doc ID]
```

#### For Scenario E (9COM: 890-123456 - new multi-item 9COM)
```
9COM_Number | Vendor_Name          | Vendor_Email                | AVL_Document_ID
890-123456  | Multi-Item Vendor M  | vendor.m.multi@outlook.com  | [create new]
890-123456  | Multi-Item Vendor N  | vendor.n.multi@outlook.com  | [create new]
890-123456  | Multi-Item Vendor O  | vendor.o.multi@outlook.com  | [create new]
```

#### For Scenario F (9COM: 567-890123 - special characters test)
```
9COM_Number | Vendor_Name           | Vendor_Email                  | AVL_Document_ID
567-890123  | Vendor X & Co.        | vendor.x.special@outlook.com  | [create new]
567-890123  | Vendor Y (Special) Ltd| vendor.y.special@outlook.com  | [create new]
567-890123  | Vendor Z "Quality" Inc| vendor.z.special@outlook.com  | [create new]
```

#### For Scenario G (9COM: 234-567890 - mixed valid/invalid)
```
9COM_Number | Vendor_Name    | Vendor_Email               | AVL_Document_ID
234-567890  | Valid Vendor 1 | vendor.valid1@outlook.com  | [create new]
234-567890  | Valid Vendor 2 | vendor.valid2@outlook.com  | [create new]
234-567890  | Invalid Vendor | vendor.invalid@fake.com    | [create new]
```

## Test Emails for Each Scenario

### Scenario B: Email Body Only
```
Subject: RFQ-2024-11-002 Heat Exchanger Order

Hello Team,

We need to procure the following items for our Project Eagle expansion:

RFQ Number: RFQ-2024-11-002
9COM Number: 450-012547
Project Name: Project Eagle - Aramco Site 7 Expansion
Material Description: High-Pressure Shell & Tube Heat Exchanger
Quantity: 2
Specifications: All wetted parts must be Stainless Steel Grade 316/316L
Response Deadline: [One week from today]
WBS Code: PEA7PRC02

Please provide your best quotation.

Thanks
```

### Scenario C: AVL Not Found
```
Subject: RFQ-2024-11-003 Special Equipment

RFQ Number: RFQ-2024-11-003
9COM Number: 999-999999 (invalid)
Project: Test Project
Item: Special Equipment
Quantity: 1
```

### Scenario D: Poor Quality Extraction
```
Subject: Procurement Request

Need equipment urgently. 
Please process.
```

### Scenario E: Multiple Items
```
Subject: RFQ-2024-11-005 Multiple Equipment Order

RFQ Number: RFQ-2024-11-005
9COM Numbers: 890-123456, 123-456789, 345-678901
Project: Multi-Item Test Project

Item 1: Pressure Vessels - Quantity: 3
Item 2: Control Valves - Quantity: 15  
Item 3: Flow Meters - Quantity: 8

Specifications vary per item - see attached requirements.
```

### Scenario F: Special Characters
```
Subject: RFQ-2024-11-006 Equipment & Parts

RFQ Number: RFQ-2024-11-006
9COM Number: 567-890123
Project: Test & Validation "Phase 2"
Item: Valve (3/4") & Fittings
Vendor Requirement: Must have >5 years' experience
Budget: <$50,000
```

### Scenario G: Invalid Vendor Emails
```
Subject: RFQ-2024-11-007 Standard Equipment

RFQ Number: RFQ-2024-11-007
9COM Number: 234-567890
Project: Email Test Project
Item: Standard Heat Exchanger
Quantity: 1
```

## Notes
- Use the same Gmail account to send all test emails
- DON'T clear the database - we want to keep all test data
- Check both Yahoo and Outlook spam folders after sending RFQs
- Document any email delivery issues
- Mixed email providers (Yahoo + Outlook) is fine for testing

## Quick Reference - All Test Accounts
```
Password for all: TestRFQ2024!

Scenario B: vendor.d_test@yahoo.com, vendor.e.test@outlook.com, vendor.f.test@outlook.com
Scenario E: vendor.m.multi@outlook.com, vendor.n.multi@outlook.com, vendor.o.multi@outlook.com
Scenario F: vendor.x.special@outlook.com, vendor.y.special@outlook.com, vendor.z.special@outlook.com
Scenario G: vendor.valid1@outlook.com, vendor.valid2@outlook.com (+ fake email)
```

## Chrome Profile Assignments (Accounts Created)
✅ **Scenario B Vendors - Created and Logged In:**
- **vendor.d_test@yahoo.com** → Logged in Tariq Al-Hashim's Chrome profile
- **vendor.e.test@outlook.com** → Logged in Bin qurayas Chrome profile  
- **vendor.f.test@outlook.com** → Logged in vendor B's Chrome profile

⏳ **Still Need to Create:**
- Scenario E: vendor.m.multi, vendor.n.multi, vendor.o.multi (Outlook)
- Scenario F: vendor.x.special, vendor.y.special, vendor.z.special (Outlook)
- Scenario G: vendor.valid1, vendor.valid2 (Outlook)
