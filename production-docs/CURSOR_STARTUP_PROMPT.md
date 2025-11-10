# Cursor Startup Prompt for New Project

Copy and paste this entire prompt into Cursor when starting your new project:

---

## Project Context

I'm building a production-ready RFQ (Request for Quotation) automation system for Bin Quraya that transforms a manual 20+ day procurement process into an automated <1 hour workflow.

**Current State**: I have demo workflows with hard-coded data that need to be made production-ready using AI and database integration.

**Goal**: Create a 24/7 automated system that:
- Monitors emails continuously for vendor responses
- Uses OpenAI to extract data from ANY vendor format (no hard-coding)
- Stores everything in Supabase for real-time dashboard updates
- Handles the complete flow from RFQ initiation to Purchase Order
- Maintains a complete audit trail

## Technical Stack
- **Workflows**: n8n (I'll use n8n MCP for accurate implementation)
- **AI**: OpenAI GPT-4 for document/email extraction
- **Database**: Supabase (I'll use Supabase MCP for setup)
- **Dashboard**: Next.js (simplified MVP version)
- **Documents**: Google Drive (existing structure)

## Available Resources

I have these documentation files in `/docs/`:
1. `PROJECT_CONTEXT.md` - System overview
2. `RFQ_PROCESS_FLOW_DETAILED.md` - Complete 6-stage process
3. `SUPABASE_SCHEMA.md` - Database design
4. `AI_CONFIGURATIONS.md` - OpenAI prompts
5. `GOOGLE_DRIVE_STRUCTURE.md` - Document locations
6. `VENDOR_DATA_REFERENCE.md` - Test vendor data
7. `MCP_INSTRUCTIONS.md` - How to use MCPs
8. `IMPLEMENTATION_PLAN.md` - Step-by-step guide
9. `ENV_EXAMPLE.md` - Environment variables
10. `WORKFLOW_MODIFICATIONS.md` - Specific changes needed

I have these n8n workflows in `/workflows/`:
- `email-processor.json` - Handles vendor emails (needs AI integration)
- `commercial-evaluation.json` - Scores vendors (needs Supabase)
- `commercial-gatekeeper.json` - Controls timing
- `main-processor.json` - Orchestrates everything
- `webhook-handler.json` - Dashboard integration

## First Tasks

Please help me:

1. **Set up Supabase** using the MCP and schema from `SUPABASE_SCHEMA.md`
2. **Start with EMAIL_PROCESSOR workflow** - this has the most hard-coded logic that needs AI replacement
3. **Use the MCP tools** to ensure accurate n8n node configurations
4. **Follow the IMPLEMENTATION_PLAN.md** for the correct sequence

## Key Requirements

- **NO HARD-CODED DATA**: Everything must be AI-extracted
- **PRODUCTION READY**: 24/7 operation, error handling, logging
- **USE THE MCPs**: Don't guess node configurations, use:
  - `mcp_n8n-mcp_get_node_info` for node details
  - `mcp_supabase_apply_migration` for database setup
- **TEST WITH REAL DATA**: Use vendor emails from `VENDOR_DATA_REFERENCE.md`

## Current Focus

I want to transform the `email-processor.json` workflow from demo (with hard-coded vendor detection) to production (with AI extraction and Supabase storage).

The workflow currently has:
```javascript
// Hard-coded vendor detection
if (email.includes('vendor.a.demo')) {
  vendorName = 'Vendor A Industries';
}
```

This needs to become:
```javascript
// AI extraction
OpenAI node extracts vendor dynamically from any email format
```

Please guide me through this transformation step by step, using the MCP tools to ensure accuracy.

---

## Additional Context

- I have test vendor emails configured (vendor.a.demo@gmail.com, etc.)
- The Google Drive has sample quotation documents
- The dashboard will poll Supabase for real-time updates
- Final system must handle 1000s of RFQs without manual intervention

Let's start with setting up the Supabase database and then modifying the email processor workflow.
