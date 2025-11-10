# Google Sheets AVL Lookup Reference

## How the AVL Lookup Works

The Google Sheets serves as a **simple lookup table** that maps 9COM numbers to Google Drive document IDs.

### Sheet Structure (3 columns):
1. **9COM_Number** - The commodity code (format: XXX-XXXXXX)
2. **Commodity_Name** - Description of the commodity
3. **AVL_Document_ID** - Google Drive ID of the AVL PDF document

### Workflow Process:
1. **Lookup Phase**: Workflow searches for 9COM number in column A
2. **Document Retrieval**: Gets the corresponding document ID from column C
3. **Download**: Downloads the AVL PDF from Google Drive using the ID
4. **AI Extraction**: AI reads the PDF and extracts all vendor details
5. **Vendor Processing**: Creates/updates vendors and sends emails

### Current Entries:
| 9COM_Number | Commodity_Name | AVL_Document_ID |
|-------------|----------------|-----------------|
| 450-012547 | High-Pressure Heat Exchanger | 1R9AUUXBHUbVAuhkCQMxZq5vQB6hVNvs |
| 680-009132 | 6" Pipe Fittings, Sch 40 | 1iiWY5vUkuEHv1uUkDu-Jrm68g7OUo_3g |
| 870-011123 | Control Valves, 4-Inch | 1xYz789ABC123def456 |
| 890-123456 | Pressure Vessel Heat Exchanger | 1SBfkN_uDqgVHRP32BrWRpPbznA8cuQ0_ |
| 123-456789 | Pipe Fittings and Valves | 1HdUcnznBm57-kVN5_TfFYzEX-bpCgcpJ |

### Important Notes:
- The Google Sheet does NOT contain vendor information
- All vendor details are extracted from the AVL PDFs
- Each 9COM can have multiple vendors in its AVL document
- The workflow only uses the first 9COM for multi-item RFQs (current limitation)

### Document Locations:
- **Google Sheet Name**: 9COM_to_AVL_Master_List
- **Google Sheet ID**: 1WvecSZypSWc4uQpDABjwbm4tujvIP09zMz-HgMNbdF0
- **AVL PDFs Folder**: Google Drive (various locations)

### Test Scenario Documents:
- **AVL-890-123456.pdf**: Contains vendors M, N, O (heat exchangers)
- **AVL-123-456789.pdf**: Contains vendors P, Q (pipe fittings)

Last Updated: November 10, 2025
