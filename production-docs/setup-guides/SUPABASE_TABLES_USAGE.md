# Supabase Tables Usage by Workflow

This document shows EXACTLY which columns each workflow reads and writes. Use this as the definitive reference when building workflows to ensure consistency.

---

## Table 1: rfq_requests

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create | Read | Read | Read |
| rfq_id | TEXT | ✓ Write | Read | Read | Read |
| project_id | TEXT | ✓ Write | Read | Read | Read |
| project_name | TEXT | ✓ Write | Read | Read | Read |
| nine_com_number | TEXT | ✓ Write | Read | - | - |
| commodity_code | TEXT | ✓ Write (optional) | - | - | - |
| material_description | TEXT | ✓ Write | Read | - | Read |
| specifications | TEXT | ✓ Write | Read | - | - |
| quantity | INTEGER | ✓ Write | Read | - | Read |
| unit_of_measure | TEXT | ✓ Write | - | - | - |
| critical_requirements | TEXT | ✓ Write | Read | - | - |
| wbs_code | TEXT | ✓ Write | - | - | - |
| estimated_value | DECIMAL | ✓ Write | - | - | Read |
| delivery_location | TEXT | ✓ Write | - | - | - |
| delivery_timeline | TEXT | ✓ Write | - | - | - |
| status | TEXT | ✓ Write 'initiated'/'awaiting_responses' | Read | ✓ Update 'under_evaluation' | ✓ Update 'po_issued'/'rejected' |
| current_stage | INTEGER | ✓ Write 1 | Update 2 | Update 3 | Update 4 |
| vendor_count | INTEGER | ✓ Update after sends | ✓ Update if new | - | - |
| invited_vendor_count | INTEGER | ✓ Update | - | - | - |
| responded_vendor_count | INTEGER | - | ✓ Update +1 | Read | - |
| compliant_vendor_count | INTEGER | - | ✓ Update +1 | Read | - |
| cycle_time_hours | INTEGER | - | - | ✓ Calculate | - |
| selected_vendor_id | UUID | - | - | - | ✓ Write |
| po_number | TEXT | - | - | - | ✓ Write |
| final_price | DECIMAL | - | - | - | ✓ Write |
| cost_savings | DECIMAL | - | - | - | ✓ Calculate |
| initiated_at | TIMESTAMPTZ | ✓ Write NOW() | - | Read | - |
| rfq_sent_at | TIMESTAMPTZ | ✓ Write NOW() | - | - | - |
| response_deadline | TIMESTAMPTZ | ✓ Write +7 days | Read | Read | - |
| evaluation_started_at | TIMESTAMPTZ | - | - | ✓ Write NOW() | - |
| decision_made_at | TIMESTAMPTZ | - | - | - | ✓ Write NOW() |
| po_issued_at | TIMESTAMPTZ | - | - | - | ✓ Write if PO |
| expected_delivery_date | DATE | - | - | - | ✓ Write |
| created_by | TEXT | ✓ Write 'system' | - | - | - |
| approved_by | TEXT | - | - | - | ✓ Write |
| notes | TEXT | ✓ Write if needed | - | - | ✓ Update |
| created_at | TIMESTAMPTZ | Auto | - | - | - |
| updated_at | TIMESTAMPTZ | Auto | Auto | Auto | Auto |

---

## Table 2: vendors

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create/Read | Read | - | Read |
| vendor_id | TEXT | Auto-generated | Read | - | Read |
| vendor_name | TEXT | ✓ Write/Update | Read | - | Read |
| vendor_email | TEXT | ✓ Write (unique) | Match on this | - | - |
| contact_person | TEXT | ✓ Write from AVL | - | - | - |
| phone_number | TEXT | ✓ Write from AVL | - | - | - |
| vendor_type | TEXT | - | ✓ Update if found | - | - |
| vendor_tier | TEXT | - | - | - | - |
| total_rfqs_invited | INTEGER | ✓ Update +1 | - | - | - |
| total_rfqs_responded | INTEGER | - | ✓ Update +1 | - | - |
| total_rfqs_won | INTEGER | - | - | - | ✓ Update +1 |
| average_response_time_hours | DECIMAL | - | ✓ Calculate | - | - |
| average_score | DECIMAL | - | - | - | ✓ Update |
| compliance_rate | DECIMAL | - | ✓ Calculate | - | - |
| is_active | BOOLEAN | Check before send | - | - | - |
| is_approved | BOOLEAN | Check before send | - | - | - |
| approval_date | DATE | - | - | - | - |
| last_contacted | TIMESTAMPTZ | ✓ Write NOW() | - | - | - |
| created_at | TIMESTAMPTZ | Auto | - | - | - |
| updated_at | TIMESTAMPTZ | Auto | Auto | - | Auto |

---

## Table 3: vendor_offers

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | - | ✓ Create | Read | Read |
| rfq_id | TEXT | - | ✓ Write | Read | Read |
| vendor_id | UUID | - | ✓ Write | Read | Read |
| unit_price | DECIMAL | - | ✓ Write | - | Read |
| total_price | DECIMAL | - | ✓ Write | - | Read |
| currency | TEXT | - | ✓ Write | - | Read |
| payment_terms | TEXT | - | ✓ Write | - | Read |
| delivery_terms | TEXT | - | ✓ Write | - | Read |
| validity_period | TEXT | - | ✓ Write | - | - |
| technical_compliance | JSONB | - | ✓ Write | - | Read |
| offered_specifications | TEXT | - | ✓ Write | - | Read |
| deviations | TEXT | - | ✓ Write | - | Read |
| compliance_status | TEXT | - | ✓ Write 'compliant'/'non_compliant'/'tbc_required' | Read | Read |
| compliance_notes | TEXT | - | ✓ Write | - | Read |
| evaluation_status | TEXT | - | ✓ Write 'pending' | - | ✓ Update 'approved'/'rejected' |
| evaluation_score | DECIMAL | - | - | - | ✓ Write |
| evaluator_notes | TEXT | - | - | - | ✓ Write |
| response_received_at | TIMESTAMPTZ | - | ✓ Write NOW() | - | - |
| evaluated_at | TIMESTAMPTZ | - | - | - | ✓ Write NOW() |
| created_at | TIMESTAMPTZ | - | Auto | - | - |
| updated_at | TIMESTAMPTZ | - | Auto | - | Auto |

---

## Table 4: rfq_events

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create | ✓ Create | ✓ Create | ✓ Create |
| rfq_id | TEXT | ✓ Write | ✓ Write | ✓ Write | ✓ Write |
| event_type | TEXT | ✓ 'rfq_initiated'/'email_sent'/'avl_not_found' | ✓ 'vendor_responded'/'tbc_sent' | ✓ 'evaluation_started' | ✓ 'po_issued'/'vendor_rejected' |
| event_timestamp | TIMESTAMPTZ | Auto NOW() | Auto NOW() | Auto NOW() | Auto NOW() |
| title | TEXT | Auto-generated | Auto-generated | Auto-generated | Auto-generated |
| description | TEXT | ✓ Write | ✓ Write | ✓ Write | ✓ Write |
| details | JSONB | ✓ Write context | ✓ Write offer summary | ✓ Write criteria | ✓ Write decision |
| vendor_id | UUID | ✓ Write (email_sent) | ✓ Write | - | ✓ Write |
| vendor_name | TEXT | ✓ Write (email_sent) | ✓ Write | - | ✓ Write |
| vendor_email | TEXT | ✓ Write (email_sent) | ✓ Write | - | - |
| nine_com_number | TEXT | ✓ Write (avl_not_found) | - | - | - |
| project_name | TEXT | ✓ Write (avl_not_found) | - | - | - |
| project_id | TEXT | ✓ Write (avl_not_found) | - | - | - |
| previous_status | TEXT | - | - | ✓ Write | ✓ Write |
| new_status | TEXT | - | - | ✓ Write | ✓ Write |
| changed_by | TEXT | ✓ 'system' | ✓ 'system' | ✓ 'gatekeeper' | ✓ Write user |
| processing_time_ms | INTEGER | ✓ Write | ✓ Write | ✓ Write | - |
| source | TEXT | ✓ 'workflow' | ✓ 'workflow' | ✓ 'workflow' | ✓ 'manual'/'workflow' |
| workflow_execution_id | TEXT | ✓ Write n8n ID | ✓ Write n8n ID | ✓ Write n8n ID | ✓ Write n8n ID |
| created_at | TIMESTAMPTZ | Auto | Auto | Auto | Auto |

---

## Table 5: workflow_executions

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create | ✓ Create | ✓ Create | ✓ Create |
| workflow_name | TEXT | ✓ 'RFQ Generation' | ✓ 'Vendor Response' | ✓ 'Commercial Gatekeeper' | ✓ 'Evaluation Decision' |
| execution_id | TEXT | ✓ Write n8n ID | ✓ Write n8n ID | ✓ Write n8n ID | ✓ Write n8n ID |
| status | TEXT | ✓ 'success'/'error' | ✓ 'success'/'error' | ✓ 'success' | ✓ 'success'/'error' |
| error_message | TEXT | ✓ If error | ✓ If error | - | ✓ If error |
| error_details | JSONB | ✓ If error | ✓ If error | - | ✓ If error |
| rfq_id | TEXT | ✓ Write | ✓ Write | - | ✓ Write |
| vendor_count | INTEGER | ✓ Write count | - | ✓ Write checked | - |
| trigger_type | TEXT | ✓ 'email' | ✓ 'email' | ✓ 'schedule' | ✓ 'webhook' |
| started_at | TIMESTAMPTZ | ✓ Write | ✓ Write | ✓ Write | ✓ Write |
| completed_at | TIMESTAMPTZ | ✓ Write | ✓ Write | ✓ Write | ✓ Write |
| duration_ms | INTEGER | ✓ Calculate | ✓ Calculate | ✓ Calculate | ✓ Calculate |
| input_data | JSONB | ✓ Email details | ✓ Email details | ✓ Criteria | ✓ Decision data |
| output_data | JSONB | ✓ Results | ✓ Offer data | ✓ Triggered RFQs | ✓ PO details |
| created_at | TIMESTAMPTZ | Auto | Auto | Auto | Auto |

---

## Table 6: email_logs

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create | ✓ Create | - | - |
| message_id | TEXT | ✓ Write Gmail ID | ✓ Write Gmail ID | - | - |
| thread_id | TEXT | ✓ Write Gmail thread | ✓ Write Gmail thread | - | - |
| rfq_id | TEXT | ✓ Write after creation | ✓ Write matched | - | - |
| from_email | TEXT | ✓ Write sender | ✓ Write vendor | - | - |
| to_email | TEXT | ✓ Write recipients | ✓ Write | - | - |
| cc_email | TEXT | ✓ Write if exists | ✓ Write if exists | - | - |
| subject | TEXT | ✓ Write | ✓ Write | - | - |
| body_text | TEXT | ✓ Write plain | ✓ Write plain | - | - |
| body_html | TEXT | ✓ Write HTML | ✓ Write HTML | - | - |
| processed_at | TIMESTAMPTZ | ✓ Write NOW() | ✓ Write NOW() | - | - |
| has_attachments | BOOLEAN | ✓ Write | ✓ Write | - | - |
| attachment_count | INTEGER | ✓ Write count | ✓ Write count | - | - |
| processing_status | TEXT | ✓ 'processed' | ✓ 'processed' | - | - |
| received_at | TIMESTAMPTZ | ✓ Write email date | ✓ Write email date | - | - |
| created_at | TIMESTAMPTZ | Auto | Auto | - | - |

---

## Table 7: extraction_quality_issues

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | ✓ Create if needed | ✓ Create if needed | - | - |
| email_id | TEXT | ✓ Write Gmail ID | ✓ Write Gmail ID | - | - |
| rfq_id | TEXT | ✓ Write if known | ✓ Write | - | - |
| extraction_method | TEXT | ✓ 'pdf'/'email_body' | ✓ 'pdf'/'email_body' | - | - |
| quality_score | DECIMAL | ✓ Write 0-100 | ✓ Write 0-100 | - | - |
| confidence_level | TEXT | ✓ 'low'/'medium' | ✓ 'low'/'medium' | - | - |
| missing_fields | TEXT[] | ✓ Write array | ✓ Write array | - | - |
| validation_errors | JSONB | ✓ Write issues | ✓ Write issues | - | - |
| extracted_data | JSONB | ✓ Write partial | ✓ Write partial | - | - |
| status | TEXT | ✓ 'pending_manual_review' | ✓ 'pending_manual_review' | - | - |
| resolved_by | TEXT | - | - | - | - |
| resolution_notes | TEXT | - | - | - | - |
| created_at | TIMESTAMPTZ | Auto | Auto | - | - |
| resolved_at | TIMESTAMPTZ | - | - | - | - |

---

## Table 8: gatekeeper_logs

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | - | - | ✓ Create | - |
| check_timestamp | TIMESTAMPTZ | - | - | ✓ Write NOW() | - |
| rfqs_checked | INTEGER | - | - | ✓ Write count | - |
| rfqs_triggered | INTEGER | - | - | ✓ Write count | - |
| triggered_rfq_ids | TEXT[] | - | - | ✓ Write array | - |
| check_criteria | JSONB | - | - | ✓ Write rules | - |
| execution_details | JSONB | - | - | ✓ Write results | - |
| created_at | TIMESTAMPTZ | - | - | Auto | - |

---

## Table 9: purchase_orders

### Columns Used by Each Workflow:

| Column | Type | W1 Main | W2 Response | W3 Gatekeeper | W4 Decision |
|--------|------|---------|-------------|---------------|-------------|
| id | UUID | - | - | - | ✓ Create |
| po_number | TEXT | - | - | - | ✓ Generate |
| rfq_id | TEXT | - | - | - | ✓ Write |
| vendor_id | UUID | - | - | - | ✓ Write |
| po_value | DECIMAL | - | - | - | ✓ Write |
| currency | TEXT | - | - | - | ✓ Write |
| payment_terms | TEXT | - | - | - | ✓ Write |
| delivery_date | DATE | - | - | - | ✓ Write |
| created_by | TEXT | - | - | - | ✓ Write |
| approved_by | TEXT | - | - | - | ✓ Write |
| approval_notes | TEXT | - | - | - | ✓ Write |
| status | TEXT | - | - | - | ✓ 'approved' |
| sent_at | TIMESTAMPTZ | - | - | - | ✓ Write |
| created_at | TIMESTAMPTZ | - | - | - | Auto |
| updated_at | TIMESTAMPTZ | - | - | - | Auto |

---

## Summary Statistics

### Workflow 1 (Main Processor):
- **Writes to**: 5 tables (rfq_requests, vendors, rfq_events, workflow_executions, email_logs)
- **Creates**: New RFQs, vendor records, events
- **Key outputs**: rfq_id, vendor list, initial status

### Workflow 2 (Vendor Response):
- **Writes to**: 6 tables (vendor_offers, rfq_requests, vendors, rfq_events, workflow_executions, email_logs)
- **Creates**: Vendor offers, response events
- **Updates**: Response counts, vendor metrics

### Workflow 3 (Commercial Gatekeeper):
- **Writes to**: 4 tables (rfq_requests, rfq_events, workflow_executions, gatekeeper_logs)
- **Updates**: RFQ status to evaluation
- **Creates**: Gatekeeper logs

### Workflow 4 (Evaluation & Decision):
- **Writes to**: 5 tables (rfq_requests, vendors, vendor_offers, rfq_events, purchase_orders)
- **Creates**: Purchase orders
- **Updates**: Final decisions, vendor wins

---

## Critical Rules

1. **NEVER create columns not listed here**
2. **ALWAYS use exact column names (case-sensitive)**
3. **ALWAYS use the specified data types**
4. **ALWAYS check if a column is used by your workflow before writing**
5. **NEVER write to columns marked with "-" for your workflow**
