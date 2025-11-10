# 9COM Number Dash Formatting Fix

## Issue
Google Sheets AVL lookup was failing because:
- AI extracted: `450012547` (no dash)
- Google Sheets had: `450-012547` (with dash)
- No match found!

## Solution
Updated the "Transform for Database" node to automatically format 9COM numbers with dashes.

### Changes Made
1. **Primary 9COM Number Formatting**:
   ```javascript
   // Format 9COM numbers with dash (XXX-XXXXXX) if missing
   if (primaryNineComNumber && primaryNineComNumber.length === 9 && !primaryNineComNumber.includes('-')) {
     primaryNineComNumber = primaryNineComNumber.slice(0, 3) + '-' + primaryNineComNumber.slice(3);
   }
   ```

2. **All 9COM Numbers Formatting**:
   - Splits comma-separated 9COM numbers
   - Formats each one with a dash if needed
   - Rejoins them with proper formatting

## Result
- Input: `450012547, 680009132`
- Output: `450-012547, 680-009132`

## Impact
- Google Sheets lookup now works correctly
- Supports both formats (with or without dash)
- Automatically normalizes all 9COM numbers to standard format
- No need to manually update Google Sheets or source data
