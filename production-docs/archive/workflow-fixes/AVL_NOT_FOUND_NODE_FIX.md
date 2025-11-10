# AVL Not Found Nodes Fix

## "Log AVL Not Found Event" Node Fields

Add/update these fields in the Supabase node:

1. **rfq_id** (string)
   ```
   {{ $('Process RFQ Data').first().json.rfqId }}
   ```

2. **event_type** (string)
   ```
   avl_not_found
   ```

3. **nine_com_number** (string)
   ```
   {{ $('Insert RFQ Request').first().json.nine_com_number || $('Process RFQ Data').first().json.nineComNumber }}
   ```

4. **project_name** (string)
   ```
   {{ $('Insert RFQ Request').first().json.project_name || $('Process RFQ Data').first().json.projectName }}
   ```

5. **event_timestamp** (string)
   ```
   {{ $now }}
   ```

6. **title** (string)
   ```
   AVL Lookup Failed - Manual Assignment Required
   ```

7. **description** (string)
   ```
   No AVL found for 9COM {{ $('Insert RFQ Request').first().json.nine_com_number || $('Process RFQ Data').first().json.nineComNumber }}
   ```

## Why These References?

- **From "Process RFQ Data"**: Contains the original extracted data (rfqId, nineComNumber, projectName)
- **From "Insert RFQ Request"**: Contains the database field names (nine_com_number, project_name)
- The AVL lookup returns empty data when no match is found, so we can't use `$json`

## Email Template

The complete fixed HTML has been saved to `AVL_NOT_FOUND_EMAIL_TEMPLATE.html` with all references updated to pull from the correct nodes.
