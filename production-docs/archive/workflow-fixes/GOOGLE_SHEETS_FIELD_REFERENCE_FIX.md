# Google Sheets AVL Lookup Field Reference Fix

## Issue
The "Lookup AVL in Google Sheets" node was failing with "Cannot read properties of undefined (reading 'toString')" because it was trying to reference fields that don't exist after the "Insert RFQ Request" node.

## Root Cause
After "Insert RFQ Request", the data structure changes:
- `primaryNineComNumber` → `commodity_code` (in database)
- `allNineComNumbers` → `nine_com_number` (in database)

## Fix Applied
Updated the lookupValue in "Lookup AVL in Google Sheets" node to:
```javascript
{{ $json.commodity_code || $json.primaryNineComNumber || $json.nine_com_number || $json.nineComNumber || $json.output.nineComNumber }}
```

This ensures it first checks for `commodity_code` (which is what the database returns) before falling back to other possible field names.

## Data Flow
1. **Transform for Database** node creates:
   - `primaryNineComNumber`: "450012547"
   - `allNineComNumbers`: "450012547, 680009132"
   
2. **Insert RFQ Request** stores:
   - `commodity_code`: "450012547" (from primaryNineComNumber)
   - `nine_com_number`: "450012547, 680009132" (from allNineComNumbers)
   
3. **Lookup AVL in Google Sheets** now correctly uses:
   - `commodity_code` from the database response

## Result
The AVL lookup should now work correctly with the primary 9COM number stored in the `commodity_code` field.
