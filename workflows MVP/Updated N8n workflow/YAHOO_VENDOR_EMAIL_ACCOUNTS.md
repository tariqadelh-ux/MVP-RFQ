# Yahoo Vendor Email Accounts for RFQ Testing

## Overview
Since Gmail accounts have reached their limit, we need to create Yahoo email accounts for vendors in test scenarios B, E, F, and G. Scenario A already uses the existing vendor.a/b/c.demo@gmail.com accounts.

## Required Yahoo Email Accounts

### For Scenario B: Email Body Only (Pipe Fittings - 9COM: 680-009132)
1. **quicksource.trading@yahoo.com**
   - Company: QuickSource Trading
   - Contact: Amy Chen
   - Phone: +966-50-444-4444

2. **direct.procurement@yahoo.com**
   - Company: Direct Procurement Ltd
   - Contact: Robert Brown
   - Phone: +966-50-555-5555

### For Scenario E: Multiple Items (Both 9COMs: 450-012547 & 680-009132)
3. **premier.supplies.co@yahoo.com**
   - Company: Premier Supplies Co
   - Contact: Lisa Anderson
   - Phone: +966-50-666-6666

4. **bulkorder.systems@yahoo.com**
   - Company: BulkOrder Systems
   - Contact: David Kim
   - Phone: +966-50-777-7777

5. **multiitem.specialists@yahoo.com**
   - Company: MultiItem Specialists
   - Contact: Carlos Rodriguez
   - Phone: +966-50-888-8888

6. **consolidated.supplies@yahoo.com**
   - Company: Consolidated Supplies
   - Contact: Maria Garcia
   - Phone: +966-50-999-9999

### For Scenario F: Special Characters (Heat Exchanger - 9COM: 450-012547)
7. **abc.industries.yahoo@yahoo.com**
   - Company: ABC Industries
   - Contact: John Smith
   - Phone: +966-50-111-1111

8. **globaltech.vendor@yahoo.com**
   - Company: Global Tech Solutions
   - Contact: Sarah Johnson
   - Phone: +966-50-222-2222

9. **eagle.manufacturing@yahoo.com**
   - Company: Eagle Manufacturing
   - Contact: Mike Wilson
   - Phone: +966-50-333-3333

### For Scenario G: Invalid Email Testing (9COM: 680-009132)
10. **valid.vendor.test@yahoo.com**
    - Company: Valid Vendor Co
    - Contact: Test User
    - Phone: +966-50-000-0000

## Email Account Creation Tips

### Yahoo Mail Requirements:
- Use realistic names (avoid "test" in the actual email)
- Phone verification may be required
- Use a consistent password pattern for easy management
- Enable "Less secure app access" if needed for SMTP

### Suggested Password Pattern:
- Base: `RfqTest2025!`
- Add first letter of company name
- Example: `RfqTest2025!Q` for QuickSource

### Recovery Email:
- Use your binquraya.procurement.demo@gmail.com as recovery

## AVL Google Sheets Setup

### Sheet 1: Heat Exchanger Vendors (9COM: 450-012547)
```
Company Name | Email | Contact Person | Phone
ABC Industries | abc.industries.yahoo@yahoo.com | John Smith | +966-50-111-1111
Global Tech Solutions | globaltech.vendor@yahoo.com | Sarah Johnson | +966-50-222-2222
Eagle Manufacturing | eagle.manufacturing@yahoo.com | Mike Wilson | +966-50-333-3333
```

### Sheet 2: Pipe Fittings Vendors (9COM: 680-009132)
```
Company Name | Email | Contact Person | Phone
ABC Industries | abc.industries.yahoo@yahoo.com | John Smith | +966-50-111-1111
QuickSource Trading | quicksource.trading@yahoo.com | Amy Chen | +966-50-444-4444
Direct Procurement Ltd | direct.procurement@yahoo.com | Robert Brown | +966-50-555-5555
```

### Sheet 3: Multi-Purpose Vendors (Both 9COMs)
```
Company Name | Email | Contact Person | Phone
Premier Supplies Co | premier.supplies.co@yahoo.com | Lisa Anderson | +966-50-666-6666
BulkOrder Systems | bulkorder.systems@yahoo.com | David Kim | +966-50-777-7777
MultiItem Specialists | multiitem.specialists@yahoo.com | Carlos Rodriguez | +966-50-888-8888
Consolidated Supplies | consolidated.supplies@yahoo.com | Maria Garcia | +966-50-999-9999
```

### Sheet 4: Invalid Email Test (9COM: 680-009132)
```
Company Name | Email | Contact Person | Phone
Valid Vendor Co | valid.vendor.test@yahoo.com | Test User | +966-50-000-0000
Invalid Domain Co | invalid@email | Missing Domain | +966-50-111-1111
No TLD Corp | not.an.email | Bad Format | +966-50-222-2222
Missing Username Inc | @yahoo.com | No Username | +966-50-333-3333
Spaces Email Ltd | vendor with spaces@yahoo.com | Has Spaces | +966-50-444-4444
```

## Account Creation Checklist

- [ ] Create 10 Yahoo email accounts as listed above
- [ ] Note down passwords in secure location
- [ ] Set recovery email to binquraya.procurement.demo@gmail.com
- [ ] Test login to each account
- [ ] Update AVL Google Sheets with correct emails
- [ ] Verify no typos in email addresses

## Testing Notes

1. **Scenario A** uses existing Gmail accounts (vendor.a/b/c.demo@gmail.com)
2. **Scenario B** uses QuickSource and Direct Procurement Yahoo accounts
3. **Scenario C** intentionally has invalid 9COM (999-999999) - no vendors
4. **Scenario D** tests poor quality - may not reach vendor stage
5. **Scenario E** uses all multi-purpose vendors (4 accounts)
6. **Scenario F** uses heat exchanger Yahoo vendors (3 accounts)
7. **Scenario G** uses mix of valid and invalid emails for testing

## Alternative Approach (If Creating 10 Accounts is Too Much)

You could create fewer accounts and reuse them across scenarios:

### Minimum Required (5 accounts):
1. **vendor.one.rfq@yahoo.com** - Use for ABC Industries across scenarios
2. **vendor.two.rfq@yahoo.com** - Use for Global Tech/QuickSource
3. **vendor.three.rfq@yahoo.com** - Use for Eagle/Direct Procurement
4. **vendor.four.rfq@yahoo.com** - Use for Premier/Multi vendors
5. **vendor.five.rfq@yahoo.com** - Use for BulkOrder/Consolidated

Then map these in AVL sheets to different company names per scenario.

---

*Created: November 8, 2025*
*Purpose: RFQ Workflow 1 Testing - Yahoo Vendor Email Setup*
