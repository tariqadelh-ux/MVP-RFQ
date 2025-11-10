# Scenario E AVL Setup Summary

## Google Sheets Update
Use the prompt in `GOOGLE_SHEETS_UPDATE_PROMPT.md` to add these rows:

| 9COM_Number | Commodity_Name | AVL_Document_ID |
|-------------|----------------|-----------------|
| 890-123456 | Pressure Vessel Heat Exchanger | 1SBfkN_uDqgVHRP32BrWRpPbznA8cuQ0_ |
| 123-456789 | Pipe Fittings and Valves | 1HdUcnznBm57-kVN5_TfFYzEX-bpCgcpJ |

## AVL PDFs Already Created
You've uploaded:
- **AVL-890-123456.pdf** (ID: 1SBfkN_uDqgVHRP32BrWRpPbznA8cuQ0_)
  - Contains: Vendors M, N, O
- **AVL-123-456789.pdf** (ID: 1HdUcnznBm57-kVN5_TfFYzEX-bpCgcpJ)
  - Contains: Vendors P, Q

## Test Email Accounts Needed
Create these Outlook accounts (all with password: TestRFQ2024!):
- vendor.m_multi@outlook.com - Multi-Item Vendor M
- vendor.n_multi@outlook.com - Multi-Item Vendor N
- vendor.o_multi@outlook.com - Multi-Item Vendor O
- vendor.p_pipe@outlook.com - Piping Vendor P
- vendor.q_pipe@outlook.com - Piping Vendor Q

## Test Email to Send
```
To: binquraya.procurement.demo@gmail.com
Subject: RFQ-2024-11-005 Multiple Equipment Order

RFQ Number: RFQ-2024-11-005
PROJECT: Multi - Eastern Province Expansion

ITEM 1:
- 9COM: 890-123456
- Description: Pressure Vessel Heat Exchanger
- Quantity: 2 units
- Material: SS 316L

ITEM 2:
- 9COM: 123-456789
- Description: Pipe Fittings
- Quantity: 100 pieces
- Material: CS ASTM A234

Both items needed within 60 days. Send to all relevant vendors.
WBS: MUL7PRC05

Regards,
Procurement Team
```

## Expected Result
- Workflow will capture BOTH 9COMs
- Will only lookup first one (890-123456)
- Will send emails to vendors M, N, O only
- Vendors P, Q will NOT receive emails (limitation of MVP)
- This demonstrates the multi-item handling and its current limitations

## Files Updated
- `GOOGLE_SHEETS_AVL_LOOKUP_REFERENCE.md` - How the lookup works
- `TEST_EMAIL_SETUP_GUIDE.md` - Updated with all vendor emails
- `SCENARIO_E_TEST_GUIDE.md` - Complete test instructions
