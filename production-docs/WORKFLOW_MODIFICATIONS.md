# Workflow Modifications - From Demo to Production

## Overview
Detailed modifications required for each n8n workflow to make them production-ready. Each section shows what to remove and what to add.

**CRITICAL**: All hard-coded data must be replaced with AI-driven extraction and Supabase storage.

## 1. Email Processor Workflow Modifications

### Current State (Demo)
- Manual trigger with test button
- Hard-coded vendor detection in Code node
- Fixed vendor data (names, emails, materials)
- Mock event generation

### Remove These Nodes
```javascript
// 1. Manual Trigger node
// 2. Code node "Extract Vendor Info" containing:
if (emailFrom.includes('vendor.a.demo@gmail.com')) {
  vendorName = 'Vendor A Industries';
  vendorId = '9V-1102';
}
// 3. Set node with hard-coded vendor data
```

### Add These Nodes

#### 1.1 Email Trigger (IMAP)
```json
{
  "name": "Email Trigger - RFQ Responses",
  "type": "n8n-nodes-base.emailReadImap",
  "position": [250, 300],
  "parameters": {
    "mailbox": "INBOX",
    "checkInterval": 5,
    "customQuery": "is:unread subject:RFQ",
    "postProcessAction": "markAsRead",
    "options": {
      "returnAttachments": true,
      "attachmentsPrefix": "rfq_"
    }
  }
}
```

#### 1.2 OpenAI - Extract Vendor Info
```json
{
  "name": "AI Extract Vendor Info",
  "type": "n8n-nodes-base.openAi",
  "position": [450, 300],
  "parameters": {
    "resource": "text",
    "operation": "complete",
    "model": "gpt-4",
    "temperature": 0.1,
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "Extract vendor information from RFQ response emails. Return only valid JSON."
        },
        {
          "role": "user",
          "content": "Email from: {{$json.from}}\nSubject: {{$json.subject}}\nBody: {{$json.text}}\n\nExtract: vendor_name, vendor_email, rfq_reference, contact_person, has_quotation (boolean)"
        }
      ]
    },
    "responseFormat": { "type": "json_object" }
  }
}
```

#### 1.3 Supabase - Store Email Log
```json
{
  "name": "Log Email Receipt",
  "type": "n8n-nodes-base.supabase",
  "position": [650, 300],
  "parameters": {
    "operation": "insert",
    "table": "email_logs",
    "data": {
      "message_id": "={{$json.messageId}}",
      "from_email": "={{$json.from}}",
      "subject": "={{$json.subject}}",
      "rfq_id": "={{$json.ai_extracted.rfq_reference}}",
      "direction": "inbound",
      "processed_at": "={{new Date().toISOString()}}"
    }
  }
}
```

#### 1.4 Process Attachments Loop
```json
{
  "name": "Loop Through Attachments",
  "type": "n8n-nodes-base.splitInBatches",
  "position": [850, 300],
  "parameters": {
    "batchSize": 1,
    "options": {}
  }
}
```

#### 1.5 OpenAI - Analyze Document
```json
{
  "name": "AI Extract Quote Data",
  "type": "n8n-nodes-base.openAi",
  "position": [1050, 300],
  "parameters": {
    "resource": "text",
    "operation": "complete",
    "model": "gpt-4",
    "temperature": 0.1,
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "Extract commercial and technical data from vendor quotations for heat exchangers. Required material: SS 316L."
        },
        {
          "role": "user",
          "content": "Document content:\n{{$json.attachment_content}}\n\nExtract ALL: material_grade, unit_price, total_price, currency, delivery_days, payment_terms, warranty_months, technical_compliance (compliant/non-compliant)"
        }
      ]
    }
  }
}
```

#### 1.6 Supabase - Create/Update Vendor Offer
```json
{
  "name": "Store Vendor Offer",
  "type": "n8n-nodes-base.supabase",
  "position": [1250, 300],
  "parameters": {
    "operation": "upsert",
    "table": "vendor_offers",
    "primaryKey": ["rfq_id", "vendor_email"],
    "data": {
      "rfq_id": "={{$json.rfq_reference}}",
      "vendor_name": "={{$json.vendor_name}}",
      "vendor_email": "={{$json.vendor_email}}",
      "material_offered": "={{$json.material_grade}}",
      "unit_price": "={{$json.unit_price}}",
      "delivery_days": "={{$json.delivery_days}}",
      "payment_terms": "={{$json.payment_terms}}",
      "warranty_months": "={{$json.warranty_months}}",
      "compliance_status": "={{$json.technical_compliance}}",
      "ai_confidence": "={{$json.confidence_score}}"
    }
  }
}
```

#### 1.7 Supabase - Log Event
```json
{
  "name": "Log Vendor Response Event",
  "type": "n8n-nodes-base.supabase",
  "position": [1450, 300],
  "parameters": {
    "operation": "insert",
    "table": "rfq_events",
    "data": {
      "event_type": "VENDOR_RESPONDED",
      "rfq_id": "={{$json.rfq_reference}}",
      "vendor_name": "={{$json.vendor_name}}",
      "title": "Vendor Response Received",
      "description": "{{$json.vendor_name}} submitted quotation",
      "details": {
        "material": "={{$json.material_grade}}",
        "price": "={{$json.unit_price}}",
        "delivery": "={{$json.delivery_days}} days"
      }
    }
  }
}
```

## 2. Commercial Evaluation Workflow Modifications

### Current State (Demo)
- Google Sheets for vendor data
- Hard-coded scoring in Code node
- Fixed vendor offers
- Manual trigger

### Remove These Nodes
```javascript
// 1. Google Sheets node "Get Approved Vendors"
// 2. Code node with hard-coded offers:
const vendorOffers = [
  { name: 'Vendor A', price: 48500, delivery: 70 },
  { name: 'Vendor B', price: 41000, delivery: 55 }
];
```

### Add These Nodes

#### 2.1 Webhook Trigger (From Gatekeeper)
```json
{
  "name": "Evaluation Trigger",
  "type": "n8n-nodes-base.webhook",
  "position": [250, 300],
  "parameters": {
    "path": "commercial-evaluation",
    "httpMethod": "POST",
    "responseMode": "onReceived"
  }
}
```

#### 2.2 Supabase - Get All Offers
```json
{
  "name": "Fetch Vendor Offers",
  "type": "n8n-nodes-base.supabase",
  "position": [450, 300],
  "parameters": {
    "operation": "select",
    "table": "vendor_offers",
    "filters": {
      "column": "rfq_id",
      "operator": "eq",
      "value": "={{$json.rfq_id}}"
    },
    "options": {
      "includeColumns": "*"
    }
  }
}
```

#### 2.3 Code - Apply Scoring Formula
```json
{
  "name": "Calculate Scores",
  "type": "n8n-nodes-base.code",
  "position": [650, 300],
  "parameters": {
    "code": `
// Get all offers
const offers = $input.all()[0].json;

// Find best values for scoring
const prices = offers.map(o => parseFloat(o.unit_price));
const deliveries = offers.map(o => parseInt(o.delivery_days));
const warranties = offers.map(o => parseInt(o.warranty_months));

const lowestPrice = Math.min(...prices);
const shortestDelivery = Math.min(...deliveries);
const longestWarranty = Math.max(...warranties);

// Score each vendor
const scoredOffers = offers.map(offer => {
  const priceScore = (lowestPrice / parseFloat(offer.unit_price)) * 100;
  const deliveryScore = (shortestDelivery / parseInt(offer.delivery_days)) * 100;
  
  // Payment terms scoring
  const paymentScore = offer.payment_terms === '30/70' ? 85 :
                      offer.payment_terms === '20/80' ? 75 :
                      offer.payment_terms === '10/90' ? 65 : 50;
  
  const warrantyScore = (parseInt(offer.warranty_months) / longestWarranty) * 100;
  const complianceScore = offer.compliance_status === 'compliant' ? 100 : 0;
  
  // Weighted total
  const totalScore = (priceScore * 0.35) +
                    (deliveryScore * 0.30) +
                    (paymentScore * 0.20) +
                    (warrantyScore * 0.10) +
                    (complianceScore * 0.05);
  
  return {
    ...offer,
    price_score: priceScore.toFixed(2),
    delivery_score: deliveryScore.toFixed(2),
    payment_score: paymentScore,
    warranty_score: warrantyScore.toFixed(2),
    compliance_score: complianceScore,
    total_score: totalScore.toFixed(2)
  };
});

// Sort by score
scoredOffers.sort((a, b) => b.total_score - a.total_score);

// Add rank
return scoredOffers.map((offer, index) => ({
  ...offer,
  rank: index + 1
}));
`
  }
}
```

#### 2.4 Supabase - Update Scores
```json
{
  "name": "Update Vendor Scores",
  "type": "n8n-nodes-base.supabase",
  "position": [850, 300],
  "parameters": {
    "operation": "update",
    "table": "vendor_offers",
    "id": "={{$json.id}}",
    "data": {
      "price_score": "={{$json.price_score}}",
      "delivery_score": "={{$json.delivery_score}}",
      "payment_score": "={{$json.payment_score}}",
      "warranty_score": "={{$json.warranty_score}}",
      "compliance_score": "={{$json.compliance_score}}",
      "total_score": "={{$json.total_score}}",
      "rank": "={{$json.rank}}"
    }
  }
}
```

#### 2.5 OpenAI - Generate Summary
```json
{
  "name": "AI Generate Executive Summary",
  "type": "n8n-nodes-base.openAi",
  "position": [1050, 300],
  "parameters": {
    "model": "gpt-4",
    "temperature": 0.3,
    "messages": {
      "values": [
        {
          "role": "system",
          "content": "Create concise executive summary for procurement decisions. Focus on value, risks, and clear recommendations."
        },
        {
          "role": "user",
          "content": "RFQ: {{$json.rfq_id}}\nMaterial: Heat Exchanger SS 316L\n\nVendor Analysis:\n{{JSON.stringify($json.scored_offers, null, 2)}}\n\nGenerate executive summary with recommendation, financial impact, and key findings."
        }
      ]
    }
  }
}
```

## 3. Webhook Handler Modifications

### Current State (Demo)
- Returns hard-coded mock data
- Fixed event structure
- No database connection

### Remove
```javascript
// Entire Code node returning:
const mockEvents = [
  { type: 'RFQ_INITIATED', vendor: 'N/A' },
  { type: 'VENDOR_RESPONDED', vendor: 'Vendor A' }
];
```

### Add

#### 3.1 Webhook Trigger
```json
{
  "name": "Dashboard Webhook",
  "type": "n8n-nodes-base.webhook",
  "position": [250, 300],
  "parameters": {
    "path": "dashboard-status",
    "httpMethod": "GET",
    "responseMode": "onReceived",
    "options": {
      "cors": true
    }
  }
}
```

#### 3.2 Supabase - Query Events
```json
{
  "name": "Get Recent Events",
  "type": "n8n-nodes-base.supabase",
  "position": [450, 300],
  "parameters": {
    "operation": "select",
    "table": "rfq_events",
    "options": {
      "orderBy": "event_timestamp",
      "orderDirection": "DESC",
      "limit": 100
    }
  }
}
```

#### 3.3 Code - Format Response
```json
{
  "name": "Format for Dashboard",
  "type": "n8n-nodes-base.code",
  "position": [650, 300],
  "parameters": {
    "code": `
const events = $input.all()[0].json;

// Transform to dashboard format
const formattedEvents = events.map(event => ({
  type: event.event_type,
  timestamp: event.event_timestamp,
  title: event.title,
  subtitle: event.description,
  details: event.details || {},
  vendor: event.vendor_name || 'N/A',
  rfqId: event.rfq_id
}));

return { events: formattedEvents };
`
  }
}
```

## 4. Main Processor Modifications

### Add Logging Throughout

#### 4.1 After RFQ Creation
```json
{
  "name": "Log RFQ Initiation",
  "type": "n8n-nodes-base.supabase",
  "position": [450, 500],
  "parameters": {
    "operation": "insert",
    "table": "rfq_requests",
    "data": {
      "rfq_id": "={{$json.rfq_id}}",
      "project_id": "={{$json.project_id}}",
      "commodity_code": "={{$json.commodity_code}}",
      "material_description": "={{$json.material}}",
      "quantity": "={{$json.quantity}}",
      "status": "initiated"
    }
  }
}
```

#### 4.2 After Sending RFQs
```json
{
  "name": "Update RFQ Status",
  "type": "n8n-nodes-base.supabase",
  "position": [850, 500],
  "parameters": {
    "operation": "update",
    "table": "rfq_requests",
    "filters": {
      "column": "rfq_id",
      "value": "={{$json.rfq_id}}"
    },
    "data": {
      "status": "rfq_sent",
      "rfq_sent_at": "={{new Date().toISOString()}}",
      "invited_vendor_count": "={{$json.vendor_count}}"
    }
  }
}
```

## 5. Commercial Gatekeeper Modifications

### Replace Schedule Trigger
```json
{
  "name": "Check Every Hour",
  "type": "n8n-nodes-base.schedule",
  "position": [250, 300],
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 1
        }
      ]
    }
  }
}
```

### Add Deadline Check
```json
{
  "name": "Check RFQ Deadlines",
  "type": "n8n-nodes-base.supabase",
  "position": [450, 300],
  "parameters": {
    "operation": "select",
    "table": "rfq_requests",
    "filters": {
      "conditions": [
        {
          "column": "status",
          "value": "awaiting_responses"
        },
        {
          "column": "response_deadline",
          "operator": "lt",
          "value": "={{new Date().toISOString()}}"
        }
      ]
    }
  }
}
```

## Error Handling Pattern

### Add to All Workflows
```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.errorTrigger",
  "position": [100, 700],
  "parameters": {}
}

{
  "name": "Log Error",
  "type": "n8n-nodes-base.supabase",
  "position": [300, 700],
  "parameters": {
    "operation": "insert",
    "table": "workflow_executions",
    "data": {
      "workflow_name": "={{$workflow.name}}",
      "status": "error",
      "error_message": "={{$json.error.message}}",
      "error_node": "={{$json.error.node.name}}"
    }
  }
}

{
  "name": "Notify Team",
  "type": "n8n-nodes-base.emailSend",
  "position": [500, 700],
  "parameters": {
    "to": "it-support@binquraya.com",
    "subject": "Workflow Error: {{$workflow.name}}",
    "text": "Error in workflow: {{$json.error.message}}"
  }
}
```

## Production Readiness Checklist

For each workflow, ensure:
- [ ] No hard-coded vendor data
- [ ] All events logged to Supabase
- [ ] Error handling implemented
- [ ] AI extracts all data dynamically
- [ ] Proper retry logic for failures
- [ ] Performance optimized (batch where possible)
- [ ] Security: No credentials in code
- [ ] Monitoring: Execution logs saved

## Testing Each Modification

1. **Email Processor Test**
   - Send test email from vendor.a.demo@gmail.com
   - Verify AI extracts vendor name correctly
   - Check data saved to Supabase

2. **Commercial Evaluation Test**
   - Trigger with test RFQ ID
   - Verify scoring calculations
   - Check summary generation

3. **Integration Test**
   - Full flow from email to decision
   - Verify all events in dashboard
   - Check no data loss
