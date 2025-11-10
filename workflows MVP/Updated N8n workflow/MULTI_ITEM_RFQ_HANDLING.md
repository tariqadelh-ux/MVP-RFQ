# Multi-Item RFQ Handling

## Problem
The workflow received an RFQ with multiple items:
- 9COM Numbers: "450012547, 680009132" (2 items)
- Quantities: "Item 1: 1; Item 2: 120"
- Different specifications for each item

The database expects:
- `quantity` as INTEGER (not a string)
- Single values for lookup operations

## Solution
Added a "Transform for Database" node that:

### 1. Quantity Processing
```javascript
// Multi-item RFQs are treated as a single bundle
if (isMultiItem) {
  quantityValue = 1; // One RFQ bundle
} else {
  // Single item - extract actual quantity
  const match = quantityStr.match(/\d+/);
  quantityValue = match ? parseInt(match[0], 10) : 1;
}
```

### 2. 9COM Number Handling
- **primaryNineComNumber**: First 9COM (450-012547) - formatted with dash for AVL lookup
- **allNineComNumbers**: Full list (450-012547, 680-009132) - all formatted with dashes
- Automatic formatting: Adds dash if missing (XXX-XXXXXX format)

### 3. Database Fields
```
rfq_requests table:
- quantity: 1 (one RFQ bundle for multi-item, actual quantity for single-item)
- nine_com_number: "450-012547, 680-009132" (full list with dashes)
- commodity_code: "450-012547" (primary with dash)
- material_description: Contains all items with quantities
- specifications: Contains all item specifications
```

## Impact
- Multi-item RFQs are now supported
- AVL lookup uses the primary 9COM number from `commodity_code` field
- Full item details preserved in text fields (material_description, specifications)
- Quantity represents 1 RFQ bundle for multi-item, actual quantity for single-item

## Google Sheets Lookup Fix
The "Lookup AVL in Google Sheets" node now correctly references:
```
{{ $json.commodity_code || $json.primaryNineComNumber || $json.nine_com_number || ... }}
```
This ensures it uses the database field name `commodity_code` after insertion.

## Test Results
✅ Successfully tested with Scenario A:
- Input: "450012547, 680009132" → Output: "450-012547, 680-009132"
- Google Sheets lookup worked correctly with formatted 9COM
- 3 vendors found and emails sent

## Future Enhancement
Consider creating a separate `rfq_line_items` table to properly normalize multi-item RFQs with:
- Individual quantities per item
- Separate 9COM numbers
- Item-specific specifications
