# Workflow Connection Flow

## The Complete Data Flow

```
1. Monitor Procurement Emails
   ↓
2. Extract Email Content and Attachments
   ↓
3. Extract Text from PDF
   ↓
4. Check PDF Extraction Status
   ├─ PDF Found → Extract Procurement Details with AI
   └─ No PDF → Prepare Email Body Text → Extract from Email Body (Fallback)
   
5. Both paths merge at → Merge Extraction Results
   ↓
6. Assess Extraction Quality
   ↓
7. Is Quality Acceptable?
   ├─ YES → Process RFQ Data ←── THIS IS WHERE IT CONNECTS!
   └─ NO → Log Quality Issue → Notify Dev Team
   
8. Process RFQ Data (extracts RFQ number from AI output)
   ↓
9. Validate RFQ Data
   ↓
10. Insert RFQ Request
    ↓
11. Lookup AVL in Google Sheets
    ├─ Found → Download AVL → Extract Vendors → Send RFQs
    └─ Not Found → Log Event → Update Status → Wait → Retry
```

## The Connection You're Looking For

The "Process RFQ Data" node receives data from:
- **"Is Quality Acceptable?"** node (when quality check passes)

It's part of the main flow after the AI has extracted the procurement details and the quality has been assessed as acceptable.

## Why It Might Look Disconnected

In the n8n visual editor, the connection might not be immediately obvious because:
1. The "Is Quality Acceptable?" node is a conditional node with two outputs
2. The "YES" branch connects to "Process RFQ Data"
3. The "NO" branch goes to error handling

## To Verify in n8n

1. Look for the "Is Quality Acceptable?" node
2. It should have two output connections:
   - True/Yes → Process RFQ Data
   - False/No → Log Extraction Quality Issue

The workflow is correctly connected. The Process RFQ Data node is not a starting point - it's part of the middle of the flow after AI extraction and quality assessment.
