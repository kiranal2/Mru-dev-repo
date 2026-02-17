/**
 * Mock SSE responses for demo mode (when API_BASE_URL is not configured).
 * Returns realistic streaming events and financial demo data.
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

// ─── SSE stream builder ────────────────────────────────────────────

function sseEvent(data: Record<string, any>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function createMockSSEStream(prompt: string): ReadableStream<Uint8Array> {
  lastMockPrompt = prompt;
  const queryId = makeQueryId();
  const sessionId = `demo-session-${Date.now()}`;
  const threadId = `demo-thread-${Date.now()}`;
  const encoder = new TextEncoder();

  // Each delay is the wait BEFORE sending that event (sequential, not absolute)
  const events = [
    { wait: 0, data: { event_type: "connected", message: "Connected to Meeru AI", query_id: queryId, session_id: sessionId, thread_id: threadId } },
    { wait: 400, data: { event_type: "thinking", message: "Analyzing your request..." } },
    { wait: 400, data: { event_type: "agent_delegation", message: "Routing to Financial Data Agent" } },
    { wait: 400, data: { event_type: "tool_start", message: "Querying ERP database..." } },
    { wait: 800, data: { event_type: "tool_start", message: "Processing financial records..." } },
    { wait: 800, data: { event_type: "agent_finish", message: "Data retrieved successfully" } },
    { wait: 400, data: buildQueryCompleteEvent(queryId, threadId, prompt) },
  ];

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

// ─── Mock query result (called by /api/query/[queryId]/result) ─────

export function createMockQueryResult(prompt: string) {
  const lowerPrompt = (prompt || "").toLowerCase();

  // Pick the right demo dataset based on the prompt
  let columns: string[];
  let rows: any[][];
  let title: string;

  if (lowerPrompt.includes("aging") || lowerPrompt.includes("overdue") || lowerPrompt.includes("60 day")) {
    title = "AR Aging Summary";
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
    title = "Open Invoices";
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
    title = "Recent Payments";
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
    title = "Customer Outstanding Balances";
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
    title = "AR Balance by Business Unit";
    columns = ["Business Unit", "Total AR (USD)", "Current (USD)", "Overdue (USD)", "% Overdue", "Avg Days Outstanding", "# Invoices"];
    rows = [
      ["North America", "$3,450,000.00", "$2,100,000.00", "$1,350,000.00", "39.1%", "42", "156"],
      ["EMEA", "$2,180,000.00", "$1,420,000.00", "$760,000.00", "34.9%", "38", "98"],
      ["APAC", "$1,560,000.00", "$890,000.00", "$670,000.00", "42.9%", "51", "72"],
      ["LATAM", "$780,000.00", "$420,000.00", "$360,000.00", "46.2%", "55", "41"],
      ["Global Services", "$1,230,000.00", "$920,000.00", "$310,000.00", "25.2%", "28", "63"],
    ];
  } else {
    // Generic fallback
    title = "Financial Summary";
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

// ─── Analysis text generator ────────────────────────────────────────

function generateAnalysis(prompt: string): string {
  const lower = (prompt || "").toLowerCase();

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
  const lower = (prompt || "").toLowerCase();

  if (lower.includes("aging") || lower.includes("overdue") || lower.includes("60 day")) {
    return [
      "Show me the collection history for the 90+ day accounts",
      "What is the total write-off risk for overdue invoices?",
      "Break down aging by business unit",
      "Email a reminder to customers with overdue balances",
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
    "Show me AR aging summary for all customers",
    "List open invoices over $100,000",
    "What are the top customers by outstanding balance?",
  ];
}
