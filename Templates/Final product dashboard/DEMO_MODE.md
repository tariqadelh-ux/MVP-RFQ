# Bin Quraya RFQ Dashboard - Complete Demo Mode Walkthrough

## Overview
This document provides a detailed walkthrough of exactly what happens during the demo mode across all dashboard tabs and components. The demo simulates a complete RFQ (Request for Quotation) lifecycle in approximately 3.5 minutes.

## Demo Specifications
- **Duration**: 210 seconds (3.5 minutes)
- **Project**: Project Eagle (ID: 001)
- **RFQ ID**: 450-012547
- **Commodity**: High-Pressure Heat Exchanger
- **Material Requirement**: SS 316L (mandatory per Aramco SAES-A-301)
- **Vendors**: 
  - Vendor A Industries (Wins - $48,500)
  - Vendor B Solutions (2nd - $41,000)
  - Vendor C Global (3rd - $36,500)

## Tab-by-Tab Breakdown

### 1. Executive Overview Tab

#### Initial State (Demo Start)
- **KPI Cards**: All start at zero
  - Active RFQs: 0
  - Average Cycle Time: 0 days
  - Monthly Savings: SAR 0
  - Compliance Rate: 0%
  - Vendor Response: 0 vendors
  - Critical Alerts: 0
- **Process Status**: "Initiation" stage at 0%
- **AI Analysis**: Status "Idle", Message "Awaiting RFQ initiation..."
- **Vendor Decision Cards**: Empty (no cards shown)
- **Live Activity Feed**: Empty
- **Kanban Board**: All columns empty

#### Event Progression

**1. RFQ_SENT (5 seconds)**
- **KPIs Update**:
  - Active RFQs: 0 → 1
  - Other KPIs remain at baseline
- **Process Status**: Moves to "Distribution" (17%)
- **AI Analysis**: 
  - Status: "Processing"
  - Message: "RFQ 450-012547 distributed to 3 qualified vendors from AVL"
- **Kanban**: New card appears in "Sent" column
- **Toast Notification**: "RFQ distributed to 3 vendors"

**2. First VENDOR_RESPONDED - Vendor A (35 seconds)**
- **KPIs Update**:
  - Vendor Response: 0 → 1
  - Cycle Time: Starts calculating from demo start
- **Process Status**: Moves to "Technical Review" (35%)
- **AI Analysis**: 
  - Status: "Analyzing"
  - Message: "Vendor A response received - SS_316L compliant material confirmed"
- **Kanban**: Card moves to "In Review"

**3. Second VENDOR_RESPONDED - Vendor B Non-Compliant (45 seconds)**
- **KPIs Update**:
  - Vendor Response: 1 → 2
  - Critical Alerts: 0 → 1
  - Compliance Rate: 100% → 50%
- **AI Analysis**: 
  - Status: "Non-Compliance Detected"
  - Message: "⚠️ Vendor B submitted SS_304 - Does not meet SS_316L requirement"

**4. TBC_ISSUED to Vendor B (60 seconds)**
- **Process Status**: Stays at "Technical Review" but shows warning icon
- **AI Analysis**: 
  - Status: "Clarification Sent"
  - Message: "Technical Bid Clarification issued to Vendor B for material grade"
- **Vendor Performance**: Shows Vendor B with compliance issue

**5. VENDOR_APPROVED - Vendor A (75 seconds)**
- **Kanban**: Vendor A card moves to "Approved"
- **AI Analysis**: Updates to show 1 vendor approved

**6. Third VENDOR_RESPONDED - Vendor B Revised (85 seconds)**
- **KPIs Update**:
  - Vendor Response: 2 → 3
  - Critical Alerts: 1 → 0 (issue resolved)
- **AI Analysis**: 
  - Status: "Compliance Resolved"
  - Message: "✓ Vendor B revised offer with SS_316L material"

**7. Fourth VENDOR_RESPONDED - Vendor C (95 seconds)**
- **KPIs Update**:
  - Vendor Response: 3 → 3 (no change, all vendors responded)
  - Compliance Rate: 50% → 67%

**8. VENDOR_APPROVED - Vendor B & C (105-115 seconds)**
- **Kanban**: Both cards move to "Approved"
- **Process Status**: Preparing for commercial evaluation

**9. EVALUATION_STARTED (120 seconds)**
- **Process Status**: Moves to "Commercial Evaluation" (60%)
- **AI Analysis**: 
  - Status: "Evaluating"
  - Message: "Quorum reached - 3 technically approved vendors. Initiating commercial evaluation..."
- **Kanban**: All cards move to "Evaluating"

**10. DECISION_READY (150 seconds)**
- **Process Status**: Moves to "Decision" (85%)
- **KPIs Update**:
  - Monthly Savings: 0 → SAR 180K (projected based on automation)
  - Compliance Rate: 67% → 100% (all vendors now compliant)
  - Cycle Time: Shows ~2.5 minutes
- **Vendor Decision Cards**: Three cards appear showing:
  - Vendor A: SAR 48,500, Score 85/100, 45 days delivery ⭐ Recommended
  - Vendor B: SAR 41,000, Score 68/100, 42 days delivery
  - Vendor C: SAR 36,500, Score 72/100, 35 days delivery
- **AI Analysis**: 
  - Status: "Decision Ready"
  - Message: "Recommendation: Award to Vendor A Industries despite 33% higher price due to superior quality score (85/100) and proven track record"

**11. DECISION_EXECUTED (180 seconds - after user clicks Approve)**
- **Process Status**: Moves to "Award" (100%) ✓
- **KPIs Update**:
  - Active RFQs: 1 → 0 (completed)
- **Kanban**: Winning card moves to "Decided"
- **AI Analysis**: 
  - Status: "Completed"
  - Message: "✓ PO-2025-012547 issued to Vendor A Industries for SAR 48,500"
- **Toast**: "Purchase Order approved successfully"

### 2. Live RFQ Tracker Tab

#### Initial State
- Empty tracker with no active RFQs

#### During Demo
- **After RFQ_SENT**: Shows Project Eagle RFQ with:
  - Status: "Sent"
  - Vendors: 0/3 responded
  - Progress bar at 10%
- **As vendors respond**: Updates response count (1/3, 2/3, 3/3)
- **During technical review**: Shows TBC issued to Vendor B
- **After evaluation starts**: Status changes to "Evaluating"
- **After decision ready**: Status shows "Pending Decision"
- **After approval**: Moves to completed section

### 3. Vendor Rankings Tab

#### Initial State
- Shows historical vendor performance data
- 10-15 vendors listed with various metrics

#### During Demo Updates
- **Vendor Response Count**: Updates as each vendor responds
- **Win/Loss Ratio**: Updates after decision
- **Compliance Score**: Vendor B shows temporary dip during non-compliance
- **Average Response Time**: Calculates based on actual response times
- **Performance Trend**: Shows real-time trend indicators

### 4. Audit Trail Tab

#### Initial State
- May show some historical entries
- Filters set to "All Types", "All Workflows"

#### Event Log (Chronological)
Each event creates an audit entry with:
- **Timestamp**: Exact time
- **Workflow**: Source system (RFQ Processor, Email Handler, etc.)
- **Event Type**: Info/Success/Warning/Error
- **Details**: Specific action taken
- **Actor**: System or user who triggered it

**Sample Audit Entries**:
```
10:00:05 | RFQ Processor | Info | RFQ 450-012547 initiated for Project Eagle
10:00:10 | Email Handler | Success | RFQ sent to 3 vendors via email
10:00:40 | Email Handler | Success | Vendor A response received and parsed
10:00:50 | Technical Review | Warning | Vendor B material non-compliance detected
10:01:00 | RFQ Processor | Info | TBC issued to Vendor B Solutions
10:02:00 | Commercial Eval | Success | Evaluation model triggered - 3 vendors
10:02:30 | Decision Engine | Success | Decision package generated
10:03:00 | Management | Success | PO approved by Muhammad Ar-Rashid
```

## Component-Specific Behaviors

### Demo Controller (Floating Panel)
- **Play/Pause Button**: Controls demo progression
- **Speed Control**: 0.5x, 1x, 1.5x, 2x
- **Progress Bar**: Shows timeline with event markers
- **Current Event Display**: "Vendor A submitting compliant offer..."
- **Time Display**: "0:35 / 3:30"
- **Skip Controls**: Jump to next/previous event

### Toast Notifications (Bottom-left)
Appear for 3 seconds for major events:
- "Event: RFQ_SENT" 
- "Vendor response received"
- "Technical issue detected"
- "Commercial evaluation complete"
- "Purchase Order approved"

### Process Status Bar Details
- **Initiation** (0-17%): Document icon, gray
- **Distribution** (17-35%): Users icon, blue, animated when active
- **Technical Review** (35-60%): Shield icon, shows warning during TBC
- **Commercial Evaluation** (60-85%): Dollar icon, calculating animation
- **Decision** (85-100%): CheckCircle icon, awaiting approval
- **Award** (100%): Trophy icon, green when complete

### Kanban Board Columns
- **Sent**: RFQs distributed, awaiting responses
- **In Review**: Responses received, under technical review  
- **Approved**: Technically compliant vendors
- **Evaluating**: Commercial evaluation in progress
- **Decided**: Award decision made

### Project Vendor Performance Section
Updates to show:
- All three vendors after they respond
- Bid count for this project
- Win/loss for this specific RFQ
- Compliance status (Vendor B shows "1 issue resolved")
- Average response time for this RFQ

### AI Analysis Panel States
1. **Idle**: Gray, waiting for activity
2. **Processing**: Blue, analyzing data
3. **Warning**: Orange, issue detected
4. **Evaluating**: Blue with spinner
5. **Complete**: Green with recommendations
6. **Success**: Green with checkmark

## Key Metrics Explained

### Cycle Time Calculation
- Starts when demo begins (simulating RFQ initiation)
- Updates every 30 seconds
- Final time: ~2.5 minutes (vs 20+ days manual)

### Savings Calculation  
- Based on labor hours saved (40+ hours @ $150/hour)
- Shown as monthly projection
- Updates after decision ready

### Compliance Rate
- Starts at 0%
- Drops when non-compliant responses received
- Recovers as issues are resolved
- Ends at 100% when all vendors compliant

## Demo Reset Behavior
When reset (R key or button):
- All KPIs return to zero
- Process status returns to "Initiation"
- Kanban board clears
- Vendor decisions disappear
- AI analysis returns to "Idle"
- Audit trail retains entries (marked as demo)

## Live Mode vs Demo Mode
**Toggle Switch Location**: Top navigation bar

**When Switching to Demo Mode**:
- Dashboard resets to clean state
- Polling stops for real webhooks
- Demo controller appears
- Historical data hidden

**When Switching to Live Mode**:
- Demo controller disappears
- Real webhook polling resumes
- Current live data displayed
- Demo events ignored

This complete walkthrough ensures anyone can understand exactly what happens during the demo, making it perfect for presentations, training, or documentation purposes.

