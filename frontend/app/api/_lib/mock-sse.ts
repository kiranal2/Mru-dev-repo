/**
 * Mock SSE responses for demo mode (when API_BASE_URL is not configured).
 * Returns realistic streaming events and financial demo data.
 * Supports cross-module navigation via rich_cards for close/recon/flux/cash/collections prompts.
 */

// Shared query ID store so the result endpoint can serve matching data
let lastMockQueryId: string | null = null;
let lastMockPrompt: string | null = null;

export function getLastMockQuery() {
  return { queryId: lastMockQueryId, prompt: lastMockPrompt };
}

/** Build a deterministic query ID from the prompt */
function makeQueryId() {
  const id = `mock-${Date.now()}`;
  lastMockQueryId = id;
  return id;
}

// ─── Prompt classification ─────────────────────────────────────────

type PromptCategory =
  | "close"
  | "exceptions"
  | "reconciliation"
  | "intercompany"
  | "flux"
  | "cash-app"
  | "collections"
  | "aging"
  | "invoices"
  | "payments"
  | "customers"
  | "business-unit"
  | "generic";

function classifyPrompt(prompt: string): PromptCategory {
  const lower = (prompt || "").toLowerCase();

  // Cross-module / close scenarios — checked first
  if (lower.includes("intercompany") || lower.includes("mirror entry") || lower.includes("consolidat") || lower.includes("eliminat") || lower.includes("story 2")) return "intercompany";
  if (lower.includes("close") && (lower.includes("health") || lower.includes("status") || lower.includes("progress") || lower.includes("overview"))) return "close";
  if (lower.includes("close") && (lower.includes("block") || lower.includes("task"))) return "close";
  if (lower.includes("exception") || lower.includes("blocking")) return "exceptions";
  if (lower.includes("recon") || lower.includes("unmatched") || lower.includes("gl") && lower.includes("subledger")) return "reconciliation";
  if (lower.includes("flux") || lower.includes("variance") || lower.includes("one-click") || lower.includes("one click")) return "flux";
  if (lower.includes("cash app") || lower.includes("cash application") || lower.includes("unapplied") || lower.includes("auto-match") || lower.includes("remittance")) return "cash-app";
  if (lower.includes("collection") || lower.includes("dunning") || lower.includes("dso") || lower.includes("past due") || lower.includes("past-due")) return "collections";

  // Original AR scenarios
  if (lower.includes("aging") || lower.includes("overdue") || lower.includes("60 day")) return "aging";
  if (lower.includes("invoice") || lower.includes("open")) return "invoices";
  if (lower.includes("payment") || lower.includes("paid")) return "payments";
  if (lower.includes("customer") || lower.includes("top") || lower.includes("outstanding") || lower.includes("balance")) return "customers";
  if (lower.includes("business unit") || lower.includes("break down") || lower.includes("analysis")) return "business-unit";

  return "generic";
}

// ─── SSE stream builder ────────────────────────────────────────────

function sseEvent(data: Record<string, any>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Generate contextual streaming events based on prompt type */
function buildStreamingEvents(category: PromptCategory, queryId: string, sessionId: string, threadId: string, prompt: string) {
  const base = { wait: 0, data: { event_type: "connected", message: "Connected to Meeru AI", query_id: queryId, session_id: sessionId, thread_id: threadId } };
  const complete = { wait: 400, data: buildQueryCompleteEvent(queryId, threadId, prompt) };

  const STREAMS: Record<string, Array<{ wait: number; data: Record<string, any> }>> = {
    close: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing period-end close status..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Close Management Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Checking close task progress and dependencies..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Cross-referencing reconciliation exceptions..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Analyzing financial statement variances..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Close health assessment complete" } },
      complete,
    ],
    exceptions: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Identifying blocking exceptions..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Exception Analysis Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Scanning reconciliation exceptions..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Checking cash application unmatched items..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Evaluating close task blockers..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Exception analysis complete" } },
      complete,
    ],
    reconciliation: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing reconciliation status..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Reconciliation Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Querying GL-to-subledger matching results..." } },
      { wait: 800, data: { event_type: "tool_start", message: "Identifying unmatched transactions..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Reconciliation analysis complete" } },
      complete,
    ],
    flux: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing financial variances..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Flux Analysis Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Comparing period-over-period balances..." } },
      { wait: 800, data: { event_type: "tool_start", message: "Identifying material variances and drivers..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Variance analysis complete" } },
      complete,
    ],
    "cash-app": [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing cash application status..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Cash Application Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Querying payment matching engine..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Calculating auto-match rates..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Cash application analysis complete" } },
      complete,
    ],
    intercompany: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing intercompany balances..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Intercompany Reconciliation Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Comparing Meeru US and Meeru Europe ledgers..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Checking elimination schedule and mirror entries..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Validating consolidation readiness..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Intercompany analysis complete" } },
      complete,
    ],
    collections: [
      base,
      { wait: 400, data: { event_type: "thinking", message: "Analyzing collections performance..." } },
      { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Collections Agent" } },
      { wait: 400, data: { event_type: "tool_start", message: "Querying AR aging buckets..." } },
      { wait: 600, data: { event_type: "tool_start", message: "Checking dunning sequences and promise-to-pay..." } },
      { wait: 400, data: { event_type: "agent_finish", message: "Collections analysis complete" } },
      complete,
    ],
  };

  return STREAMS[category] || [
    base,
    { wait: 400, data: { event_type: "thinking", message: "Analyzing your request..." } },
    { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Financial Data Agent" } },
    { wait: 400, data: { event_type: "tool_start", message: "Querying ERP database..." } },
    { wait: 800, data: { event_type: "tool_start", message: "Processing financial records..." } },
    { wait: 800, data: { event_type: "agent_finish", message: "Data retrieved successfully" } },
    complete,
  ];
}

export function createMockSSEStream(prompt: string): ReadableStream<Uint8Array> {
  lastMockPrompt = prompt;
  const queryId = makeQueryId();
  const sessionId = `demo-session-${Date.now()}`;
  const threadId = `demo-thread-${Date.now()}`;
  const encoder = new TextEncoder();
  const category = classifyPrompt(prompt);
  const events = buildStreamingEvents(category, queryId, sessionId, threadId, prompt);

  return new ReadableStream({
    async start(controller) {
      for (const evt of events) {
        if (evt.wait > 0) {
          await new Promise((r) => setTimeout(r, evt.wait));
        }
        controller.enqueue(encoder.encode(sseEvent(evt.data)));
      }
      controller.close();
    },
  });
}

function buildQueryCompleteEvent(queryId: string, threadId: string, prompt: string) {
  const analysis = generateAnalysis(prompt);
  const followUpPrompts = generateFollowUpPrompts(prompt);
  return {
    event_type: "query_complete",
    message: "Query complete",
    query_id: queryId,
    thread_id: threadId,
    data_analysis: analysis,
    follow_up_prompts: followUpPrompts,
  };
}

// ─── Rich card builders ────────────────────────────────────────────

function buildCloseHealthCards() {
  return [
    {
      id: "close-health-1",
      type: "close-health",
      title: "Period-End Close Health",
      status: "at-risk",
      kpis: [
        { label: "Status", value: "At Risk", color: "red" },
        { label: "Day", value: "8 of 14", color: "amber" },
        { label: "Completion", value: "60%", color: "blue" },
        { label: "Critical Blockers", value: "4", color: "red" },
      ],
      progress: { completed: 3, total: 7, label: "Resolution Steps" },
      items: [
        {
          id: "ch-1",
          label: "Story 1: AR Reconciliation — 2 unmatched items ($250K)",
          description: "Unapplied cash from Acme Corp ($175K) — payment received but not matched to INV-2024-4872. Revenue posting error for GlobalTech ($75K) — JE-ARV-412 hit wrong account.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "ch-2",
          label: "Story 2: Intercompany mismatch — Meeru US/Europe ($150K)",
          description: "Shared services charge posted in US but mirror entry missing in Europe. Consolidation elimination cannot net to zero. Blocking CLT-013.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "ch-3",
          label: "Revenue variance above threshold — needs flux review",
          description: "Revenue decreased vs prior period due to delayed posting. AR balance appears overstated until adjustment is posted.",
          severity: "High",
          route: "/workbench/record-to-report/standard-flux",
          type: "variance",
        },
        {
          id: "ch-4",
          label: "4 close tasks blocked by upstream dependencies",
          description: "Account Reconciliations (CLT-007), Intercompany Recon (CLT-005), Consolidation Entries (CLT-013), and Financial Statements (CLT-011) are blocked.",
          severity: "Medium",
          route: "/workbench/record-to-report/close",
          type: "close-task",
        },
      ],
      links: [
        { label: "Open Close Workbench", route: "/workbench/record-to-report/close", severity: "High" },
        { label: "View Reconciliations", route: "/workbench/record-to-report/reconciliations", severity: "High" },
        { label: "View Standard Flux", route: "/workbench/record-to-report/standard-flux", severity: "Medium" },
        { label: "View Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "Medium" },
      ],
    },
  ];
}

function buildExceptionCards() {
  return [
    {
      id: "exc-1",
      type: "exceptions",
      title: "Critical Exceptions Blocking Close",
      status: "at-risk",
      kpis: [
        { label: "Total Exceptions", value: "3", color: "red" },
        { label: "Total Exposure", value: "$400K", color: "red" },
        { label: "Stories Affected", value: "2", color: "amber" },
        { label: "Close Tasks Blocked", value: "4", color: "red" },
      ],
      items: [
        {
          id: "exc-item-1",
          label: "Story 1: Unapplied cash — Acme Corp ($175K)",
          description: "Payment received for INV-2024-4872 but not matched in Cash Application. Sitting in unapplied cash. Cash app must resolve before AR recon can complete.",
          severity: "High",
          route: "/workbench/order-to-cash/cash-application/payments",
          type: "cash-app",
        },
        {
          id: "exc-item-2",
          label: "Story 1: Revenue posting error — GlobalTech ($75K)",
          description: "JE-ARV-412 posted revenue to wrong account/period. Needs adjusting journal entry. Causes AR-GL mismatch in RECON-003.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "exc-item-3",
          label: "Story 2: Missing mirror entry — Meeru Europe ($150K)",
          description: "US booked intercompany receivable (IC-SVC-2024-089) but Europe never posted the payable/expense. Mirror entry automation failed Dec 12.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
      ],
      links: [
        { label: "Go to Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "High" },
        { label: "Go to Reconciliations", route: "/workbench/record-to-report/reconciliations", severity: "High" },
        { label: "Go to Close Workbench", route: "/workbench/record-to-report/close", severity: "High" },
        { label: "View Standard Flux", route: "/workbench/record-to-report/standard-flux", severity: "Medium" },
      ],
    },
  ];
}

function buildReconciliationCards() {
  return [
    {
      id: "recon-1",
      type: "kpi-summary",
      title: "Reconciliation Status — December Close",
      status: "at-risk",
      kpis: [
        { label: "Total Recons", value: "10", color: "blue" },
        { label: "Completed", value: "5", color: "emerald" },
        { label: "Exceptions", value: "2", color: "red" },
        { label: "Unmatched Amount", value: "$400K", color: "red" },
      ],
      items: [
        {
          id: "recon-item-1",
          label: "Story 1: AR Control (RECON-003) — 2 unmatched items ($250K)",
          description: "Acme Corp unapplied cash ($175K) — payment received, not matched to INV-2024-4872. GlobalTech revenue posting error ($75K) — JE-ARV-412 hit wrong account.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "recon-item-2",
          label: "Story 2: Intercompany Meeru Europe (RECON-004) — 1 unmatched ($150K)",
          description: "US shared services charge IC-SVC-2024-089 posted but mirror entry missing in Europe GL. Payable and SG&A expense not booked.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "recon-item-3",
          label: "Bank Recon, AP Recon — All matched",
          description: "Chase, BofA, Wells Fargo bank recons completed (100% match). AP reconciliation fully matched.",
          severity: "Low",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
      ],
      links: [
        { label: "Open Reconciliations", route: "/workbench/record-to-report/reconciliations", severity: "High" },
        { label: "View Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "High" },
        { label: "View Close Workbench", route: "/workbench/record-to-report/close", severity: "High" },
        { label: "View Standard Flux", route: "/workbench/record-to-report/standard-flux", severity: "Medium" },
      ],
    },
  ];
}

function buildFluxCards() {
  return [
    {
      id: "flux-1",
      type: "kpi-summary",
      title: "Variance Analysis — Key Findings",
      status: "amber",
      kpis: [
        { label: "Material Variances", value: "7", color: "amber" },
        { label: "Favorable", value: "$3.2M", color: "emerald" },
        { label: "Unfavorable", value: "$1.8M", color: "red" },
        { label: "Unexplained", value: "3", color: "red" },
      ],
      items: [
        {
          id: "flux-item-1",
          label: "Revenue — $1.2M favorable, unexplained",
          description: "Revenue increased 11.2% vs prior period. No documented business explanation. Needs flux analysis review.",
          severity: "High",
          route: "/reports/analysis/flux-analysis",
          type: "variance",
        },
        {
          id: "flux-item-2",
          label: "COGS — $680K unfavorable, volume-driven",
          description: "Cost of goods sold increased due to higher volume. Price component flat. Mix shift toward lower-margin products.",
          severity: "Medium",
          route: "/reports/analysis/one-click-variance",
          type: "variance",
        },
        {
          id: "flux-item-3",
          label: "SG&A — $320K unfavorable, one-time items",
          description: "Includes $200K legal settlement and $120K recruiting costs. Both classified as one-time items.",
          severity: "Low",
          route: "/reports/analysis/one-click-variance",
          type: "variance",
        },
      ],
      links: [
        { label: "Open Flux Analysis", route: "/reports/analysis/flux-analysis", severity: "High" },
        { label: "Open One-Click Variance", route: "/reports/analysis/one-click-variance", severity: "Medium" },
        { label: "View Standard Flux", route: "/workbench/record-to-report/standard-flux", severity: "Medium" },
        { label: "View Balance Sheet", route: "/reports/analysis/balance-sheet", severity: "Low" },
      ],
    },
  ];
}

function buildCashAppCards() {
  return [
    {
      id: "cashapp-1",
      type: "kpi-summary",
      title: "Cash Application Status",
      status: "on-track",
      kpis: [
        { label: "Today's Receipts", value: "24", color: "blue" },
        { label: "Auto-Matched", value: "87%", color: "emerald" },
        { label: "Exceptions", value: "3", color: "amber" },
        { label: "Unapplied Cash", value: "$467K", color: "red" },
      ],
      items: [
        {
          id: "ca-item-1",
          label: "3 payments pending manual review",
          description: "Confidence scores 65–78%. Costco ($312K), Kroger ($89K), Walgreens ($67K). Suggested matches available.",
          severity: "Medium",
          route: "/workbench/order-to-cash/cash-application/payments",
          type: "cash-app",
        },
        {
          id: "ca-item-2",
          label: "1 remittance extraction needed",
          description: "Amazon wire transfer ($156K) — remittance PDF attached but not yet extracted. AI extraction ready.",
          severity: "Low",
          route: "/workbench/order-to-cash/cash-application/payments",
          type: "cash-app",
        },
      ],
      links: [
        { label: "Open Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "Medium" },
        { label: "View Collections", route: "/workbench/order-to-cash/collections", severity: "Low" },
      ],
    },
  ];
}

function buildCollectionsCards() {
  return [
    {
      id: "collections-1",
      type: "kpi-summary",
      title: "Collections Performance",
      status: "amber",
      kpis: [
        { label: "Total AR", value: "$5.5M", color: "blue" },
        { label: "Past Due", value: "$1.8M", color: "red" },
        { label: "DSO", value: "47 days", color: "amber" },
        { label: "Collection Rate", value: "82%", color: "emerald" },
      ],
      items: [
        {
          id: "coll-item-1",
          label: "4 accounts in 90+ day bucket ($621K)",
          description: "Home Depot ($423K) and Best Buy ($198K) are critical. Dunning sequence step 4 of 5 for both.",
          severity: "High",
          route: "/workbench/order-to-cash/collections",
          type: "collections",
        },
        {
          id: "coll-item-2",
          label: "2 promises-to-pay due today ($156K)",
          description: "Amazon ($89K) and Target ($67K) have promises expiring today. Follow-up calls needed.",
          severity: "Medium",
          route: "/workbench/order-to-cash/collections",
          type: "collections",
        },
        {
          id: "coll-item-3",
          label: "DSO trending up — 47 days (target: <45)",
          description: "DSO increased 2 days vs prior month. Driven by LATAM region aging.",
          severity: "Medium",
          route: "/workbench/order-to-cash/collections",
          type: "collections",
        },
      ],
      links: [
        { label: "Open Collections Workbench", route: "/workbench/order-to-cash/collections", severity: "High" },
        { label: "View Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "Low" },
      ],
    },
  ];
}

function buildIntercompanyCards() {
  return [
    {
      id: "ic-1",
      type: "close-health",
      title: "Intercompany Imbalance — Meeru US / Europe",
      status: "at-risk",
      kpis: [
        { label: "Mismatch", value: "$150K", color: "red" },
        { label: "Entities", value: "US → Europe", color: "amber" },
        { label: "Consolidation", value: "Blocked", color: "red" },
        { label: "Close Impact", value: "High", color: "red" },
      ],
      progress: { completed: 1, total: 5, label: "Resolution Steps" },
      items: [
        {
          id: "ic-item-1",
          label: "Mirror entry missing — Meeru Europe GL ($150K)",
          description: "US booked intercompany receivable IC-SVC-2024-089 ($150K) for shared services. Europe never posted the corresponding payable and SG&A expense. Automation failed silently on Dec 12.",
          severity: "High",
          route: "/workbench/record-to-report/reconciliations",
          type: "reconciliation",
        },
        {
          id: "ic-item-2",
          label: "Consolidation elimination entries cannot run",
          description: "CLT-013 (Consolidation Entries) is blocked — intercompany balances don't net to zero. Depends on CLT-005 resolution.",
          severity: "High",
          route: "/workbench/record-to-report/close",
          type: "close-task",
        },
        {
          id: "ic-item-3",
          label: "Entity P&L and Balance Sheet impacted",
          description: "Europe P&L understates SG&A by $150K. Europe BS missing intercompany payable. US BS has receivable with no offsetting payable.",
          severity: "Medium",
          route: "/workbench/record-to-report/standard-flux",
          type: "variance",
        },
      ],
      links: [
        { label: "View Intercompany Recon (RECON-004)", route: "/workbench/record-to-report/reconciliations", severity: "High" },
        { label: "View Close Task (CLT-005)", route: "/workbench/record-to-report/close", severity: "High" },
        { label: "View Standard Flux", route: "/workbench/record-to-report/standard-flux", severity: "Medium" },
        { label: "View Balance Sheet", route: "/reports/sec/balance-sheet", severity: "Medium" },
      ],
    },
  ];
}

// ─── Mock query result (called by /api/query/[queryId]/result) ─────

export function createMockQueryResult(prompt: string) {
  const category = classifyPrompt(prompt);
  const lowerPrompt = (prompt || "").toLowerCase();

  // ── Cross-module rich card scenarios (no table, just cards) ──
  if (category === "close" || category === "exceptions" || category === "reconciliation" || category === "intercompany" || category === "flux" || category === "cash-app" || category === "collections") {
    const analysis = generateAnalysis(prompt);
    const followUpPrompts = generateFollowUpPrompts(prompt);
    const richCards = {
      close: buildCloseHealthCards,
      exceptions: buildExceptionCards,
      reconciliation: buildReconciliationCards,
      intercompany: buildIntercompanyCards,
      flux: buildFluxCards,
      "cash-app": buildCashAppCards,
      collections: buildCollectionsCards,
    }[category]();

    // Some scenarios also include a small table
    const tableData = buildCrossModuleTable(category);

    return {
      success: true,
      data_analysis: analysis,
      follow_up_prompts: followUpPrompts,
      rich_cards: richCards,
      recommendations: generateRecommendations(category),
      next_steps: generateNextSteps(category),
      results: tableData ? [tableData] : [],
    };
  }

  // ── Original AR table scenarios ──
  let columns: string[];
  let rows: any[][];

  if (lowerPrompt.includes("aging") || lowerPrompt.includes("overdue") || lowerPrompt.includes("60 day")) {
    columns = ["Customer", "Invoice #", "Invoice Date", "Due Date", "Amount (USD)", "Days Outstanding", "Aging Bucket", "Status"];
    rows = [
      ["Walmart Inc.", "INV-2024-1042", "2024-10-15", "2024-11-14", "$245,000.00", "94", "90+ Days", "Overdue"],
      ["Target Corp.", "INV-2024-1108", "2024-11-01", "2024-12-01", "$187,500.00", "78", "60-90 Days", "Overdue"],
      ["Costco Wholesale", "INV-2024-1055", "2024-10-22", "2024-11-21", "$312,800.00", "87", "60-90 Days", "Overdue"],
      ["Amazon LLC", "INV-2024-1120", "2024-11-10", "2024-12-10", "$156,200.00", "68", "60-90 Days", "Overdue"],
      ["Home Depot", "INV-2024-0985", "2024-09-28", "2024-10-28", "$423,100.00", "111", "90+ Days", "Critical"],
      ["Kroger Co.", "INV-2024-1095", "2024-10-30", "2024-11-29", "$89,750.00", "79", "60-90 Days", "Overdue"],
      ["Walgreens", "INV-2024-1130", "2024-11-15", "2024-12-15", "$67,300.00", "63", "60-90 Days", "Overdue"],
      ["Best Buy", "INV-2024-0950", "2024-09-15", "2024-10-15", "$198,400.00", "124", "90+ Days", "Critical"],
    ];
  } else if (lowerPrompt.includes("invoice") || lowerPrompt.includes("open")) {
    columns = ["Invoice #", "Customer", "Issue Date", "Due Date", "Amount (USD)", "Balance (USD)", "Status", "PO Number"];
    rows = [
      ["INV-2025-0012", "Microsoft Corp.", "2025-01-05", "2025-02-04", "$340,000.00", "$340,000.00", "Open", "PO-88401"],
      ["INV-2025-0018", "Apple Inc.", "2025-01-10", "2025-02-09", "$215,600.00", "$215,600.00", "Open", "PO-77250"],
      ["INV-2025-0024", "Google LLC", "2025-01-15", "2025-02-14", "$178,900.00", "$178,900.00", "Open", "PO-66180"],
      ["INV-2025-0031", "Meta Platforms", "2025-01-20", "2025-02-19", "$425,000.00", "$425,000.00", "Open", "PO-55320"],
      ["INV-2024-1198", "Walmart Inc.", "2024-12-18", "2025-01-17", "$290,500.00", "$145,250.00", "Partial", "PO-44890"],
      ["INV-2025-0005", "Amazon LLC", "2025-01-02", "2025-02-01", "$512,300.00", "$512,300.00", "Open", "PO-33760"],
      ["INV-2025-0039", "Salesforce", "2025-01-25", "2025-02-24", "$134,700.00", "$134,700.00", "Open", "PO-22510"],
    ];
  } else if (lowerPrompt.includes("payment") || lowerPrompt.includes("paid")) {
    columns = ["Payment ID", "Customer", "Payment Date", "Amount (USD)", "Method", "Invoice #", "Status", "Reference"];
    rows = [
      ["PAY-2025-0201", "Microsoft Corp.", "2025-02-01", "$185,000.00", "Wire Transfer", "INV-2024-1150", "Cleared", "WT-90281"],
      ["PAY-2025-0203", "Apple Inc.", "2025-02-03", "$92,400.00", "ACH", "INV-2024-1165", "Cleared", "ACH-45012"],
      ["PAY-2025-0205", "Target Corp.", "2025-02-05", "$67,800.00", "Check", "INV-2024-1088", "Cleared", "CHK-12045"],
      ["PAY-2025-0207", "Costco Wholesale", "2025-02-07", "$234,500.00", "Wire Transfer", "INV-2024-1092", "Cleared", "WT-90345"],
      ["PAY-2025-0210", "Amazon LLC", "2025-02-10", "$156,200.00", "ACH", "INV-2024-1120", "Pending", "ACH-45098"],
      ["PAY-2025-0212", "Google LLC", "2025-02-12", "$310,000.00", "Wire Transfer", "INV-2024-1178", "Cleared", "WT-90402"],
      ["PAY-2025-0214", "Kroger Co.", "2025-02-14", "$89,750.00", "ACH", "INV-2024-1095", "Cleared", "ACH-45130"],
    ];
  } else if (lowerPrompt.includes("customer") || lowerPrompt.includes("top") || lowerPrompt.includes("outstanding") || lowerPrompt.includes("balance")) {
    columns = ["Customer", "Total Outstanding (USD)", "Current", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Credit Limit (USD)"];
    rows = [
      ["Amazon LLC", "$1,245,800.00", "$512,300.00", "$325,000.00", "$252,300.00", "$156,200.00", "$0.00", "$2,000,000.00"],
      ["Walmart Inc.", "$892,500.00", "$145,250.00", "$189,750.00", "$112,500.00", "$0.00", "$445,000.00", "$1,500,000.00"],
      ["Microsoft Corp.", "$740,000.00", "$340,000.00", "$215,000.00", "$185,000.00", "$0.00", "$0.00", "$1,000,000.00"],
      ["Meta Platforms", "$625,000.00", "$425,000.00", "$200,000.00", "$0.00", "$0.00", "$0.00", "$800,000.00"],
      ["Apple Inc.", "$534,200.00", "$215,600.00", "$178,600.00", "$140,000.00", "$0.00", "$0.00", "$1,000,000.00"],
      ["Home Depot", "$523,100.00", "$0.00", "$100,000.00", "$0.00", "$0.00", "$423,100.00", "$750,000.00"],
      ["Costco Wholesale", "$498,300.00", "$0.00", "$185,500.00", "$0.00", "$312,800.00", "$0.00", "$600,000.00"],
      ["Google LLC", "$489,900.00", "$178,900.00", "$311,000.00", "$0.00", "$0.00", "$0.00", "$750,000.00"],
    ];
  } else if (lowerPrompt.includes("business unit") || lowerPrompt.includes("break down") || lowerPrompt.includes("analysis")) {
    columns = ["Business Unit", "Total AR (USD)", "Current (USD)", "Overdue (USD)", "% Overdue", "Avg Days Outstanding", "# Invoices"];
    rows = [
      ["North America", "$3,450,000.00", "$2,100,000.00", "$1,350,000.00", "39.1%", "42", "156"],
      ["EMEA", "$2,180,000.00", "$1,420,000.00", "$760,000.00", "34.9%", "38", "98"],
      ["APAC", "$1,560,000.00", "$890,000.00", "$670,000.00", "42.9%", "51", "72"],
      ["LATAM", "$780,000.00", "$420,000.00", "$360,000.00", "46.2%", "55", "41"],
      ["Global Services", "$1,230,000.00", "$920,000.00", "$310,000.00", "25.2%", "28", "63"],
    ];
  } else {
    columns = ["Category", "Current Period (USD)", "Prior Period (USD)", "Variance (USD)", "Variance %", "Status"];
    rows = [
      ["Total Revenue", "$12,450,000.00", "$11,200,000.00", "$1,250,000.00", "11.2%", "Above Target"],
      ["Accounts Receivable", "$5,548,800.00", "$4,980,000.00", "$568,800.00", "11.4%", "Monitor"],
      ["Accounts Payable", "$3,120,000.00", "$2,890,000.00", "$230,000.00", "8.0%", "On Track"],
      ["Operating Expenses", "$4,560,000.00", "$4,200,000.00", "$360,000.00", "8.6%", "Within Budget"],
      ["Net Cash Flow", "$2,890,000.00", "$2,450,000.00", "$440,000.00", "18.0%", "Healthy"],
      ["DSO (Days)", "45", "42", "3", "7.1%", "Needs Attention"],
    ];
  }

  const analysis = generateAnalysis(prompt);
  const followUpPrompts = generateFollowUpPrompts(prompt);

  return {
    success: true,
    data_analysis: analysis,
    follow_up_prompts: followUpPrompts,
    recommendations: [
      "Follow up on critical overdue accounts immediately",
      "Review credit limits for top outstanding customers",
      "Consider early payment discounts for aging buckets over 60 days",
    ],
    next_steps: [
      "Generate detailed aging report by customer",
      "Set up automated payment reminders",
      "Schedule credit review meeting",
    ],
    results: [
      {
        domain: "financial",
        query_type: "ar_analysis",
        result: {
          status: "success",
          meta: {
            columns: columns,
            total_row_count: rows.length,
            preview_row_count: rows.length,
            execution_ms: 342,
            generated_at: new Date().toISOString(),
          },
          preview_data_rows: rows,
        },
      },
    ],
  };
}

// ─── Cross-module supporting tables ────────────────────────────────

function buildCrossModuleTable(category: PromptCategory) {
  if (category === "intercompany") {
    return {
      domain: "close",
      query_type: "intercompany_detail",
      result: {
        status: "success",
        meta: {
          columns: ["Entity", "Account", "Debit (USD)", "Credit (USD)", "Status", "Reference", "Expected Mirror"],
          total_row_count: 3,
          preview_row_count: 3,
          execution_ms: 180,
          generated_at: new Date().toISOString(),
        },
        preview_data_rows: [
          ["Meeru US", "IC Receivable — 1810", "$150,000", "$0", "Posted", "IC-SVC-2024-089", "Europe IC Payable"],
          ["Meeru Europe", "IC Payable — 2810", "$0", "$0", "MISSING", "—", "Should be $150,000 CR"],
          ["Meeru Europe", "SG&A Shared Svc — 6500", "$0", "$0", "MISSING", "—", "Should be $150,000 DR"],
        ],
      },
    };
  }
  if (category === "exceptions") {
    return {
      domain: "close",
      query_type: "exception_detail",
      result: {
        status: "success",
        meta: {
          columns: ["Exception ID", "Type", "Account", "Amount (USD)", "Status", "Owner", "Age (Days)"],
          total_row_count: 3,
          preview_row_count: 3,
          execution_ms: 215,
          generated_at: new Date().toISOString(),
        },
        preview_data_rows: [
          ["EXC-001", "Unapplied Cash", "AR Control — 1200", "$175,000", "Open", "Sarah Chen", "5"],
          ["EXC-002", "Revenue Posting Error", "AR Control — 1200", "$75,000", "In Review", "Mike Johnson", "3"],
          ["EXC-003", "IC Mirror Missing", "IC Receivable — 1810", "$150,000", "Open", "Sarah Chen", "4"],
        ],
      },
    };
  }
  if (category === "reconciliation") {
    return {
      domain: "close",
      query_type: "recon_summary",
      result: {
        status: "success",
        meta: {
          columns: ["Reconciliation", "GL Balance (USD)", "Subledger (USD)", "Difference (USD)", "Status", "Match Rate", "Owner"],
          total_row_count: 4,
          preview_row_count: 4,
          execution_ms: 180,
          generated_at: new Date().toISOString(),
        },
        preview_data_rows: [
          ["AR Control (RECON-003)", "$5,548,800", "$5,298,800", "$250,000", "Exceptions", "98.7%", "Mike Johnson"],
          ["IC Meeru Europe (RECON-004)", "$150,000", "$0", "$150,000", "In Progress", "95.2%", "Sarah Chen"],
          ["Bank — Chase (RECON-001)", "$2,890,000", "$2,890,000", "$0", "Completed", "100%", "Sarah Chen"],
          ["AP Control (RECON-006)", "$3,120,000", "$3,120,000", "$0", "Matched", "100%", "David Park"],
        ],
      },
    };
  }
  if (category === "flux") {
    return {
      domain: "reports",
      query_type: "variance_summary",
      result: {
        status: "success",
        meta: {
          columns: ["Account", "Current (USD)", "Prior (USD)", "Variance (USD)", "Var %", "Status", "Driver"],
          total_row_count: 5,
          preview_row_count: 5,
          execution_ms: 290,
          generated_at: new Date().toISOString(),
        },
        preview_data_rows: [
          ["Total Revenue", "$12,450,000", "$11,200,000", "$1,250,000", "11.2%", "Unexplained", "Volume + Unknown"],
          ["COGS", "$7,890,000", "$7,210,000", "-$680,000", "-9.4%", "Explained", "Volume + Mix"],
          ["SG&A", "$2,340,000", "$2,020,000", "-$320,000", "-15.8%", "Explained", "One-time"],
          ["R&D", "$1,560,000", "$1,480,000", "-$80,000", "-5.4%", "Reviewed", "Headcount"],
          ["Net Income", "$660,000", "$490,000", "$170,000", "34.7%", "Pending", "Multiple"],
        ],
      },
    };
  }
  return null;
}

// ─── Recommendations & next steps per category ─────────────────────

function generateRecommendations(category: PromptCategory): string[] {
  const map: Record<string, string[]> = {
    close: [
      "Resolve AR reconciliation exceptions ($250K) before Day 10 cutoff",
      "Post missing intercompany mirror entry in Meeru Europe ($150K)",
      "Unblock the 4 dependent close tasks by resolving both stories",
    ],
    exceptions: [
      "Story 1: Match Acme Corp $175K payment to INV-2024-4872 in Cash Application",
      "Story 1: Post adjusting JE to correct GlobalTech $75K revenue posting error",
      "Story 2: Post mirror entry in Meeru Europe — DR SG&A $150K, CR IC Payable $150K",
    ],
    reconciliation: [
      "Resolve AR exceptions first — Cash Application match for Acme Corp $175K",
      "Post adjusting JE for GlobalTech $75K revenue posting to correct account",
      "Post intercompany mirror entry in Meeru Europe GL for $150K",
    ],
    intercompany: [
      "Post mirror entry in Meeru Europe: DR SG&A Shared Services $150K, CR IC Payable $150K",
      "Investigate why mirror entry automation failed on Dec 12",
      "Re-run consolidation elimination after mirror entry is posted",
    ],
    flux: [
      "Document the $1.2M revenue variance with business explanation",
      "Verify COGS volume driver against sales data",
      "Confirm one-time SG&A items are properly classified",
    ],
    "cash-app": [
      "Review 3 pending manual matches in Cash Application",
      "Extract Amazon remittance to clear $156K unapplied",
      "Target unapplied cash below $300K by end of day",
    ],
    collections: [
      "Escalate Home Depot and Best Buy to collections manager",
      "Follow up on Amazon and Target promise-to-pay before EOD",
      "Review LATAM region aging to address DSO trend",
    ],
  };
  return map[category] || [];
}

function generateNextSteps(category: PromptCategory): string[] {
  const map: Record<string, string[]> = {
    close: [
      "Navigate to Close Workbench to see blocked tasks (CLT-005, CLT-007)",
      "Open Reconciliations to review RECON-003 and RECON-004 exceptions",
      "View Standard Flux for revenue and SG&A variance impact",
    ],
    exceptions: [
      "Open Cash Application to match Acme Corp payment",
      "View RECON-003 for AR exception details",
      "View RECON-004 for intercompany exception",
    ],
    reconciliation: [
      "Drill into RECON-003 for AR exception items ($250K)",
      "Drill into RECON-004 for intercompany mismatch ($150K)",
      "View close task dependencies to understand blocker chain",
    ],
    intercompany: [
      "View RECON-004 for intercompany exception details",
      "Open Close Workbench to see CLT-005 and CLT-013 blockers",
      "Check Standard Flux for SG&A and IC balance variance",
    ],
    flux: [
      "Open Flux Analysis for driver-level breakdown",
      "Run One-Click Variance for automated explanations",
      "Review Standard Flux for period comparison",
    ],
    "cash-app": [
      "Open Cash Application payments queue",
      "View exception details for pending matches",
      "Check remittance extraction status",
    ],
    collections: [
      "Open Collections Workbench for action queue",
      "Review dunning sequences for critical accounts",
      "Check promise-to-pay pipeline",
    ],
  };
  return map[category] || [];
}

// ─── Analysis text generator ────────────────────────────────────────

function generateAnalysis(prompt: string): string {
  const category = classifyPrompt(prompt);
  const lower = (prompt || "").toLowerCase();

  const ANALYSES: Record<string, string> = {
    close: "The December period-end close is currently **At Risk** — Day 8 of 14 with 60% of tasks complete. There are two active stories driving 4 critical blockers:\n\n**Story 1 — AR & Revenue Timing Break**: AR reconciliation (RECON-003) has 2 unmatched items totaling $250K: unapplied cash from Acme Corp ($175K) and a revenue posting error for GlobalTech ($75K). This blocks CLT-007 (Account Reconciliations) and CLT-008 (Flux Analysis Review).\n\n**Story 2 — Intercompany Mirror Entry Missing**: $150K shared services charge posted by Meeru US but mirror entry missing in Meeru Europe GL (RECON-004). This blocks CLT-005 (Intercompany Reconciliation) and CLT-013 (Consolidation Entries).\n\nThe critical path runs through both stories — they must be resolved before financial statements can be prepared (CLT-011) and controller sign-off (CLT-012).",
    exceptions: "Found 3 critical exceptions blocking the close process with a total exposure of $400K across two stories:\n\n**Story 1 (AR & Revenue Timing Break)**:\n• Acme Corp $175K — payment received for INV-2024-4872 but not matched in Cash Application. Sitting in unapplied cash.\n• GlobalTech $75K — revenue journal entry JE-ARV-412 posted to wrong account/period. Needs adjusting journal.\n\n**Story 2 (Intercompany Mirror Entry Missing)**:\n• Meeru Europe $150K — US booked intercompany receivable IC-SVC-2024-089 but Europe never posted the payable/expense. Mirror automation failed Dec 12.\n\nAll three exceptions must be resolved to unblock 4 close tasks and allow financial statement preparation.",
    reconciliation: "Reconciliation status for December close: 10 total reconciliations — 5 completed, 2 with exceptions, 2 in progress, 1 not started.\n\n**RECON-003 (AR Control)** — 150 records, 148 matched, 2 exceptions totaling $250K. Assigned to Mike Johnson. Story 1 items: Acme Corp unapplied cash ($175K) and GlobalTech revenue error ($75K).\n\n**RECON-004 (Intercompany Meeru Europe)** — 21 records, 20 matched, 1 exception totaling $150K. Assigned to Sarah Chen. Story 2 item: missing mirror entry for shared services charge.\n\nBank reconciliations (Chase, BofA, Wells Fargo) and AP reconciliation are fully matched. Revenue Recognition recon has 10 exceptions ($185K) under review.",
    intercompany: "**Intercompany Imbalance Alert** — $150K mismatch between Meeru US and Meeru Europe.\n\nMeeru US posted a shared services charge (IC-SVC-2024-089) on Dec 12, debiting Intercompany Receivable account 1810 for $150,000. However, the corresponding mirror entry in Meeru Europe was never posted — the intercompany payable (account 2810) and SG&A expense (account 6500) remain at zero.\n\n**Root cause**: Mirror entry automation job failed silently on Dec 12. No error notification was generated.\n\n**Impact**: (1) RECON-004 shows 1 unmatched item ($150K), (2) consolidation elimination entries (CLT-013) cannot net to zero, (3) Europe entity P&L understates SG&A by $150K, (4) consolidated financial statements are blocked.\n\n**Resolution**: Post journal entry in Meeru Europe GL — Debit SG&A Shared Services $150K, Credit Intercompany Payable $150K. Then re-run RECON-004 and consolidation eliminations.",
    flux: "Variance analysis identified 7 material variances for the period. Both E2E stories create distinct impacts:\n\n**Story 1 impact**: Revenue appears lower than expected due to the $75K posting error (GlobalTech JE hit wrong account). AR balance appears overstated by $175K due to unapplied cash. DSO appears higher than actual.\n\n**Story 2 impact**: Europe entity SG&A understated by $150K (missing shared services expense). Intercompany elimination doesn't net — shows $150K variance in consolidation. Consolidated SG&A is $150K below actual.\n\nThese variances cannot be fully explained until both stories are resolved. After adjustment, revenue, AR, SG&A, and intercompany lines will align to expected balances.",
    "cash-app": "Cash application is performing well today with an 87% auto-match rate across 24 receipts. **Story 1 connection**: The Acme Corp payment of $175,000 is sitting in unapplied cash — it was received against INV-2024-4872 but the matching engine could not auto-match due to a partial payment reference. Manual match confidence: 85%. Once matched, RECON-003 exception 1 clears and CLT-007 can proceed.\n\nAdditional pending items: Kroger ($89K, 72% confidence) and Walgreens ($67K, 65% confidence). Total unapplied cash is $331K.",
    collections: "Collections performance shows $1.8M past due out of $5.5M total AR. DSO has increased to 47 days, slightly above the 45-day target, driven by LATAM region aging. Home Depot ($423K, 111 days) and Best Buy ($198K, 124 days) are critical — both are at dunning step 4 of 5. Two promises-to-pay totaling $156K are due today from Amazon and Target. The collection rate is 82%, below the 85% target.",
  };

  if (ANALYSES[category]) return ANALYSES[category];

  // Original AR analyses
  if (lower.includes("aging") || lower.includes("overdue") || lower.includes("60 day")) {
    return "Found 8 invoices outstanding beyond 60 days totaling $1,680,050. Home Depot and Best Buy are in the critical 90+ days bucket with a combined exposure of $621,500. Walmart and Costco are the largest exposures in the 60-90 day range. Immediate collection efforts are recommended for the 90+ day accounts to minimize write-off risk.";
  }
  if (lower.includes("invoice") || lower.includes("open")) {
    return "There are 7 open invoices totaling $2,097,000 across key enterprise accounts. The largest outstanding invoice is $512,300 from Amazon LLC (due Feb 1). Meta Platforms has the second-largest open balance at $425,000. One invoice from Walmart is partially paid with $145,250 remaining. All invoices are within standard payment terms.";
  }
  if (lower.includes("payment") || lower.includes("paid")) {
    return "7 payments received in February 2025 totaling $1,135,650. Wire transfers account for the largest volume ($729,500), followed by ACH payments ($338,350) and one check ($67,800). One ACH payment from Amazon ($156,200) is still pending clearance. Overall collection rate is trending positively compared to January.";
  }
  if (lower.includes("customer") || lower.includes("top") || lower.includes("balance")) {
    return "Top 8 customers account for $5,548,800 in outstanding balances. Amazon LLC leads with $1,245,800 (62% of credit limit utilized). Home Depot has the highest concentration of aged debt — $423,100 in the 90+ day bucket, representing 81% of their total outstanding. Microsoft and Meta have healthy aging profiles with no overdue balances.";
  }
  if (lower.includes("business unit") || lower.includes("break down")) {
    return "Total AR across all business units is $9,200,000. LATAM has the highest overdue percentage at 46.2% with an average 55 days outstanding. North America carries the largest absolute overdue amount at $1,350,000 but has better aging ratios. Global Services has the healthiest profile at 25.2% overdue with only 28 days average.";
  }

  return "Analysis completed successfully. The financial summary shows a healthy overall position with revenue growth of 11.2% compared to the prior period. Accounts receivable has grown proportionally and DSO has increased slightly to 45 days, suggesting a need to review collection processes. Net cash flow remains strong at $2,890,000.";
}

// ─── Follow-up prompt generator ─────────────────────────────────────

function generateFollowUpPrompts(prompt: string): string[] {
  const category = classifyPrompt(prompt);

  const PROMPTS: Record<string, string[]> = {
    close: [
      "What exceptions are blocking the close?",
      "Show reconciliation issues",
      "Show intercompany imbalance details",
      "Show flux analysis impact from both stories",
    ],
    exceptions: [
      "Show reconciliation details",
      "Show intercompany imbalance details",
      "Show cash application status",
      "Show flux analysis impact from both stories",
    ],
    reconciliation: [
      "Show intercompany imbalance details",
      "Show cash application status",
      "What variances need attention?",
      "Show close health status",
    ],
    intercompany: [
      "Show close health status",
      "Show reconciliation issues",
      "Show flux analysis impact from both stories",
      "What exceptions are blocking the close?",
    ],
    flux: [
      "Show close health status",
      "What exceptions are blocking the close?",
      "Show intercompany imbalance details",
      "Show reconciliation issues",
    ],
    "cash-app": [
      "Show reconciliation issues",
      "What exceptions are blocking the close?",
      "Show intercompany imbalance details",
      "Show close health status",
    ],
    collections: [
      "Show cash application status",
      "What exceptions are blocking the close?",
      "Show close health status",
      "Show AR aging summary for all customers",
    ],
  };

  if (PROMPTS[category]) return PROMPTS[category];

  const lower = (prompt || "").toLowerCase();

  if (lower.includes("aging") || lower.includes("overdue") || lower.includes("60 day")) {
    return [
      "Show me the collection history for the 90+ day accounts",
      "What is the total write-off risk for overdue invoices?",
      "Break down aging by business unit",
      "Show collections overview",
    ];
  }
  if (lower.includes("invoice") || lower.includes("open")) {
    return [
      "Which invoices are past their due date?",
      "Show payment terms breakdown for open invoices",
      "What is the average days-to-pay for these customers?",
    ];
  }
  if (lower.includes("payment") || lower.includes("paid")) {
    return [
      "Compare payment trends month-over-month",
      "Which customers have pending payments?",
      "Show payment method distribution over last quarter",
    ];
  }
  if (lower.includes("customer") || lower.includes("top") || lower.includes("balance")) {
    return [
      "Show credit utilization for each customer",
      "Which customers exceed 80% of their credit limit?",
      "Generate a risk score for the top customers",
      "Show payment history for Amazon LLC",
    ];
  }
  if (lower.includes("business unit") || lower.includes("break down")) {
    return [
      "Drill into LATAM overdue accounts",
      "Compare DSO across business units",
      "Show quarterly trend for each business unit",
    ];
  }

  return [
    "Show close health status",
    "What exceptions are blocking the close?",
    "Show intercompany imbalance details",
    "Show reconciliation issues",
  ];
}
