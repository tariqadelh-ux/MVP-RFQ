# MCP (Model Context Protocol) Instructions

## Overview
Step-by-step guide for using n8n MCP and Supabase MCP to build the production RFQ system. These tools enable accurate implementation without manual documentation lookups.

## 1. n8n MCP Usage

### Initial Setup Verification
```bash
# Check MCP is working
mcp_n8n-mcp_get_database_statistics
```

### Finding the Right Nodes

#### For Email Processing
```bash
# Search for email nodes
mcp_n8n-mcp_search_nodes --query="email" --includeExamples=true

# Get Gmail node details
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.gmail"

# Get IMAP node for monitoring
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.emailReadImap"
```

#### For AI Integration
```bash
# List all AI-capable nodes
mcp_n8n-mcp_list_ai_tools

# Get OpenAI node configuration
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.openAi"

# Check AI Transform node for JSON
mcp_n8n-mcp_get_node_essentials --nodeType="nodes-base.aiTransform" --includeExamples=true
```

#### For Supabase Integration
```bash
# Get Supabase node documentation
mcp_n8n-mcp_get_node_documentation --nodeType="nodes-base.supabase"

# Search for database operations
mcp_n8n-mcp_search_node_properties --nodeType="nodes-base.supabase" --query="insert"
```

### Validating Node Configurations

#### Email Trigger Validation
```bash
mcp_n8n-mcp_validate_node_operation \
  --nodeType="nodes-base.emailReadImap" \
  --config='{
    "operation": "emailReadImap",
    "mailbox": "INBOX",
    "checkInterval": 5,
    "customQuery": "is:unread subject:RFQ"
  }'
```

#### OpenAI Node Validation  
```bash
mcp_n8n-mcp_validate_node_operation \
  --nodeType="nodes-base.openAi" \
  --config='{
    "resource": "textCompletion",
    "model": "gpt-4",
    "temperature": 0.1,
    "responseFormat": "json_object"
  }'
```

### Workflow Examples

#### Get Email Processing Examples
```bash
# Find workflows using email + AI
mcp_n8n-mcp_list_node_templates \
  --nodeTypes='["n8n-nodes-base.emailReadImap", "n8n-nodes-base.openAi"]' \
  --limit=5
```

#### Study Webhook Patterns
```bash
# Get webhook node details
mcp_n8n-mcp_get_node_documentation --nodeType="nodes-base.webhook"

# Find webhook + Supabase patterns
mcp_n8n-mcp_search_templates --query="webhook database"
```

### Common n8n Patterns for Production

#### 1. Error Handling Pattern
```javascript
// Use Error Trigger node
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.errorTrigger"

// Combine with notification
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.slack"
```

#### 2. Retry Logic Pattern
```javascript
// Get Wait node for retries
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.wait"

// Use with IF node
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.if"
```

#### 3. Batch Processing Pattern
```javascript
// Split in Batches node
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.splitInBatches"
```

## 2. Supabase MCP Usage

### Initial Setup
```bash
# List your Supabase projects
mcp_supabase_list_projects

# Get project details
mcp_supabase_get_project --id="your-project-id"
```

### Creating Database Schema

#### Step 1: Create Tables
```bash
# Create rfq_requests table
mcp_supabase_apply_migration \
  --project_id="your-project-id" \
  --name="create_rfq_requests_table" \
  --query="CREATE TABLE rfq_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id TEXT UNIQUE NOT NULL,
    project_id TEXT NOT NULL,
    status TEXT DEFAULT 'initiated',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )"
```

#### Step 2: Enable RLS
```bash
# Enable Row Level Security
mcp_supabase_apply_migration \
  --project_id="your-project-id" \
  --name="enable_rls_rfq_requests" \
  --query="ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY"
```

#### Step 3: Create Policies
```bash
# Create read policy
mcp_supabase_apply_migration \
  --project_id="your-project-id" \
  --name="create_read_policy_rfq_requests" \
  --query="CREATE POLICY 'Read access for authenticated' 
    ON rfq_requests FOR SELECT 
    TO authenticated USING (true)"
```

### Monitoring & Debugging

#### Check Table Structure
```bash
# List all tables
mcp_supabase_list_tables --project_id="your-project-id"

# Execute query to check data
mcp_supabase_execute_sql \
  --project_id="your-project-id" \
  --query="SELECT * FROM rfq_requests ORDER BY created_at DESC LIMIT 10"
```

#### View Logs
```bash
# Check API logs for errors
mcp_supabase_get_logs \
  --project_id="your-project-id" \
  --service="api"

# Check auth logs
mcp_supabase_get_logs \
  --project_id="your-project-id" \
  --service="auth"
```

#### Security Advisories
```bash
# Check for security issues
mcp_supabase_get_advisors \
  --project_id="your-project-id" \
  --type="security"

# Check performance
mcp_supabase_get_advisors \
  --project_id="your-project-id" \
  --type="performance"
```

### Getting Connection Details

#### For n8n Configuration
```bash
# Get API URL
mcp_supabase_get_project_url --project_id="your-project-id"

# Get anon key for n8n
mcp_supabase_get_anon_key --project_id="your-project-id"
```

#### Generate TypeScript Types
```bash
# For dashboard development
mcp_supabase_generate_typescript_types --project_id="your-project-id"
```

## 3. Implementation Workflow

### Phase 1: Database Setup
1. Create Supabase project
2. Use MCP to create all tables from SUPABASE_SCHEMA.md
3. Set up authentication
4. Get connection credentials

### Phase 2: n8n Workflow Creation

#### Email Processor
```bash
# 1. Research email node options
mcp_n8n-mcp_search_nodes --query="email trigger"

# 2. Get OpenAI configuration
mcp_n8n-mcp_get_node_documentation --nodeType="nodes-base.openAi"

# 3. Get Supabase insert examples
mcp_n8n-mcp_search_node_properties \
  --nodeType="nodes-base.supabase" \
  --query="insert"

# 4. Validate complete workflow
mcp_n8n-mcp_validate_workflow --workflow='{...}'
```

#### Commercial Evaluation
```bash
# 1. Find comparison logic examples
mcp_n8n-mcp_search_templates --query="compare data scoring"

# 2. Get Code node for formulas
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.code"

# 3. PDF generation
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.pdf"
```

### Phase 3: Testing

#### Test Supabase Connection
```bash
# Insert test RFQ
mcp_supabase_execute_sql \
  --project_id="your-project-id" \
  --query="INSERT INTO rfq_requests (rfq_id, project_id) 
           VALUES ('RFQ-TEST-001', 'TEST-PROJECT')"

# Verify insert
mcp_supabase_execute_sql \
  --project_id="your-project-id" \
  --query="SELECT * FROM rfq_requests WHERE rfq_id = 'RFQ-TEST-001'"
```

#### Test n8n Workflow
```bash
# Validate individual nodes
mcp_n8n-mcp_validate_node_minimal \
  --nodeType="nodes-base.supabase" \
  --config={}

# Check required fields
mcp_n8n-mcp_get_property_dependencies \
  --nodeType="nodes-base.supabase"
```

## 4. Common Issues & Solutions

### Issue: Supabase Connection Failed
```bash
# Check API status
mcp_supabase_get_project --id="your-project-id"

# Verify credentials in n8n
mcp_n8n-mcp_search_node_properties \
  --nodeType="nodes-base.supabase" \
  --query="auth"
```

### Issue: AI Extraction Not Working
```bash
# Check OpenAI node config
mcp_n8n-mcp_validate_node_operation \
  --nodeType="nodes-base.openAi" \
  --config='{"model": "gpt-4"}'

# Find JSON parsing examples
mcp_n8n-mcp_search_nodes --query="parse json"
```

### Issue: Email Not Triggering
```bash
# Check IMAP requirements
mcp_n8n-mcp_get_node_documentation --nodeType="nodes-base.emailReadImap"

# Alternative: Gmail API
mcp_n8n-mcp_get_node_info --nodeType="nodes-base.gmail"
```

## 5. Production Checklist

### Before Going Live
1. **Database**
   - [ ] All tables created with proper types
   - [ ] RLS policies active and tested
   - [ ] Indexes created for performance
   - [ ] Backup strategy configured

2. **n8n Workflows**
   - [ ] Error handling on all nodes
   - [ ] Retry logic for external services
   - [ ] Logging for debugging
   - [ ] Performance tested

3. **Monitoring**
   - [ ] Supabase alerts configured
   - [ ] n8n error notifications
   - [ ] Dashboard health checks
   - [ ] API rate limits monitored

### Useful MCP Commands Reference
```bash
# n8n MCP
mcp_n8n-mcp_list_nodes --category="trigger"
mcp_n8n-mcp_get_database_statistics
mcp_n8n-mcp_tools_documentation --topic="overview"

# Supabase MCP  
mcp_supabase_search_docs --graphql_query="{...}"
mcp_supabase_list_migrations --project_id="..."
mcp_supabase_diagnostic --verbose=true
```

## 6. Best Practices

### For n8n Development
1. Always validate node configs before deployment
2. Use examples from MCP to understand patterns
3. Check for deprecated nodes/features
4. Test error scenarios explicitly

### For Supabase Development
1. Apply migrations incrementally
2. Always check advisories after changes
3. Monitor logs during testing
4. Use TypeScript types for safety

### For Integration
1. Test with small data sets first
2. Monitor API usage and costs
3. Implement circuit breakers
4. Log all AI responses for debugging
