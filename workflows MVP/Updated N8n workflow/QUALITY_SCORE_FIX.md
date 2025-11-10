# Quality Score Calculation Fix

## Problem
The workflow was rejecting valid RFQs because the quality score calculation was too simplistic. Even when all critical fields were present, the score could be below 80% if optional fields were missing.

### Example Case
- All 4 critical fields present: ✅ (nineComNumber, projectName, materialDescription, quantity)
- 8 out of 12 total fields filled
- Old quality score: 67% (8/12)
- Result: Failed quality check despite having all critical data

## Solution
Implemented a weighted scoring system that prioritizes critical fields:

### New Scoring Logic
```javascript
if (missingCriticalFields.length === 0) {
    // Base score of 80% when all critical fields present
    // Plus up to 20% bonus for optional fields
    const optionalFieldsRatio = (filledFields - criticalFields.length) / 
                                (allExpectedFields.length - criticalFields.length);
    qualityScore = Math.round(80 + (20 * optionalFieldsRatio));
} else {
    // Heavy penalty for missing critical fields
    qualityScore = Math.max(0, completenessScore - (missingCriticalFields.length * 25));
}
```

### Benefits
1. **Critical Fields Guarantee Pass**: If all critical fields are present, the minimum score is 80%
2. **Optional Fields Add Bonus**: Additional fields improve the score up to 100%
3. **Missing Critical Fields Fail**: Any missing critical field heavily penalizes the score

### Example Calculation
For the case that was failing:
- Critical fields present: 4/4
- Optional fields filled: 4/8
- New quality score: 80% + (20% × 0.5) = **90%**
- Result: Passes quality check ✅

## Impact
This fix ensures that RFQs with all essential information proceed to processing, while still encouraging completeness through the bonus scoring for optional fields.
