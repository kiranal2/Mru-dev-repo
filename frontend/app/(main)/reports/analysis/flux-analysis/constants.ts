import type {
  FluxRow,
  FluxStatus,
  CfRow,
  FluxPageData,
  PromptSuggestion,
  MaterialityMode,
  Expectedness,
  CommentaryStatus,
} from "@/lib/data/types/flux-analysis";

export const MATERIALITY_OPTIONS: Array<{ value: MaterialityMode; label: string }> = [
  { value: "default", label: ">$100k or >5%" },
  { value: "tight", label: ">$250k or >3%" },
  { value: "loose", label: ">$50k or >8%" },
];

export const CONSOLIDATION_OPTIONS = ["Consolidated", "Parent", "Subsidiary"];
export const CURRENCY_OPTIONS = ["USD", "EUR", "INR"];

export const AI_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { prompt: "Show revenue bridge from Q2 to Q3" },
  { prompt: "Show impact of losing top 3 accounts" },
  { prompt: "Show roll-forward for key BS accounts" },
  { prompt: "Show close timeline and deadlines" },
  { prompt: "What are the top 5 movers this period?" },
  { prompt: "Which accounts need attention first?" },
  { prompt: "Show expense variance breakdown" },
  { prompt: "Explain COGS increase drivers" },
  { prompt: "Compare IS vs BS variance patterns" },
  { prompt: "What is the net income impact?" },
  { prompt: "Show accounts missing evidence" },
  { prompt: "Which accounts are still open?" },
  { prompt: "Show owner workload distribution" },
  { prompt: "What are the highest risk items?" },
  { prompt: "Explain why gross margin declined" },
  { prompt: "What if FX rates were flat?" },
  { prompt: "Show aging of open review items" },
  { prompt: "Which accounts exceeded threshold?" },
  { prompt: "Summarize period close readiness" },
  { prompt: "Explain AR increase and cash impact" },
  { prompt: "Classify drivers for all accounts" },
  { prompt: "Show operating expense trend analysis" },
  { prompt: "What are the one-time items this period?" },
  { prompt: "Show variance by owner summary" },
];

export const EVIDENCE_TYPE_OPTIONS = [
  { value: "journal-entry", label: "Journal Entry" },
  { value: "invoice", label: "Invoice" },
  { value: "contract", label: "Contract" },
  { value: "bank-advice", label: "Bank Advice" },
  { value: "supporting-doc", label: "Supporting Document" },
];

export const QUICK_LINK_EVIDENCE_OPTIONS = ["GL Extract", "Trial Balance", "Subledger Report", "Bank Rec"];

export const EXPECTEDNESS_OPTIONS: Array<{ value: Expectedness; label: string }> = [
  { value: "Expected", label: "Expected" },
  { value: "Seasonal", label: "Seasonal" },
  { value: "Anomalous", label: "Anomalous" },
  { value: "One-time", label: "One-time" },
];

/** Default expectedness per account — pattern-based inference */
export const ACCOUNT_EXPECTEDNESS: Record<string, Expectedness> = {
  "4000": "Expected",    // Revenue — recurring growth
  "4100": "Expected",    // Product Revenue
  "4200": "Expected",    // Services Revenue
  "4300": "Expected",    // Subscription Revenue
  "5000": "Expected",    // COGS — tracks with revenue
  "5100": "Anomalous",   // Direct Materials — commodity spike
  "5150": "Expected",    // Direct Labor
  "5180": "One-time",    // Manufacturing OH — allocation change
  "5200": "Expected",    // Gross Margin
  "6100": "Expected",    // R&D
  "6200": "One-time",    // Sales & Marketing — campaign
  "6300": "One-time",    // G&A — timing
  "6400": "Expected",    // Depreciation
  "6500": "Expected",    // Amortization
  "6600": "Seasonal",    // Stock Compensation — grant cycle
  "6700": "Expected",    // Interest Expense
  "6800": "Anomalous",   // Other Income — FX gains
  "7000": "Expected",    // Tax Provision
  "7100": "Expected",    // Operating Income
  "7200": "Expected",    // EBITDA
  "4400": "Expected",    // License Revenue
  "4500": "Anomalous",   // Maintenance Revenue — churn
  "5250": "Expected",    // Freight & Logistics
  "5300": "Seasonal",    // Warranty Reserve — claims cycle
  "6150": "One-time",    // Engineering Contractors — project
  "6250": "Expected",    // Customer Success
  "6350": "Expected",    // Facilities
  "6450": "One-time",    // Professional Fees — audit/legal
  // BS accounts
  "1100": "Expected",    // Cash
  "1200": "Anomalous",   // AR — collections slowdown
  "1400": "Expected",    // Inventory
  "2000": "Expected",    // AP
  "2400": "Seasonal",    // Deferred Revenue — billings cycle
};

/** Commentary templates per account for AI-generated drafts */
export const COMMENTARY_TEMPLATES: Record<string, string> = {
  "4000": "Revenue increased $4.7M (+9.8%) from $48.2M at Q2 2025 to $52.9M at Q3 2025.\n\nThe movement is driven by price realization (+$2.1M, 45%), volume growth from existing accounts (+$1.8M, 38%), and favorable mix shift to higher-margin SKUs (+$1.4M, 30%). Partially offset by FX headwind (-$0.6M) and customer churn (-$0.9M).\n\nPrice increases were implemented in July per the approved pricing schedule. Volume growth is consistent with enterprise pipeline conversion reported by Sales Ops. Mix shift reflects higher adoption of premium SKUs in the mid-market segment.\n\nExpected. Revenue growth is consistent with Q3 guidance range ($51–54M) and prior Q3 seasonal patterns (Q3 2024: +8.2%, Q3 2023: +7.6%). No anomaly.",
  "4100": "Product Revenue increased $4.2M (+10.9%) from $38.6M to $42.8M.\n\nEnterprise segment contributed +$2.8M from new logo wins, mid-market upsells added +$1.1M, and price catalog increases contributed +$0.8M. Offset by -$0.5M from delayed renewals.\n\nNew enterprise logos consistent with Sales pipeline close report for Q3. Renewal delays traced to 3 accounts in contract negotiation — expected to close in Q4.\n\nExpected. Consistent with annual enterprise booking cycle.",
  "5000": "COGS rose $2.2M (+7.2%) from $30.4M to $32.6M.\n\nRaw material price inflation contributed +$1.1M due to commodity market conditions. Volume-related consumption added +$0.8M tracking with revenue growth. Freight surcharges contributed +$0.3M.\n\nCommodity price increase confirmed by Procurement. Volume consumption reconciles to production schedule. Freight surcharge per carrier contract amendment effective July 1.\n\nExpected. COGS growth rate (7.2%) below revenue growth rate (9.8%), indicating positive operating leverage.",
  "5200": "Gross Margin expanded $2.5M (+14.0%) from $17.8M to $20.3M.\n\nRevenue growth (+$4.7M) exceeded COGS growth (+$2.2M). Margin rate improved from 36.9% to 38.4%. Mix shift to higher-margin products contributed +$0.8M. Operating efficiency gains added +$0.3M.\n\nMargin expansion is consistent with pricing strategy and product mix optimization. No one-time items.\n\nExpected. Gross margin rate within guidance band (37–39%).",
  "1200": "Accounts Receivable increased $0.8M (+4.3%) from $18.4M to $19.2M.\n\nThe movement is driven by collections timing — DSO increased from 43 to 45 days. Two large invoices ($175K Acme Corp, $75K GlobalTech) remain unapplied as of period end.\n\nAR aging analysis shows $250K in unapplied cash requiring investigation. Acme Corp payment received but not matched; GlobalTech has a revenue posting discrepancy.\n\nAnomalous. DSO increase and unapplied cash require immediate attention. Linked to Close Task CT-2025-047 and Cash Application queue.",
  "6200": "Sales & Marketing spend increased $0.4M (+8.3%) from $4.8M to $5.2M.\n\nQ3 product launch campaign accounted for $0.3M. Incremental headcount (2 marketing hires) added $0.1M.\n\nCampaign spend approved in Q2 marketing plan. Hires per approved headcount budget.\n\nOne-time. Campaign spend is non-recurring. Headcount addition is a permanent run-rate increase of ~$0.05M/month.",
};

export const AI_THINKING_STEPS = [
  "Understanding your question",
  "Scanning filtered Flux accounts",
  "Calculating account deltas and drivers",
  "Drafting response",
];

export const FALLBACK_CF_DATA: CfRow[] = [
  { label: "Net Income", val: 6.8 },
  { label: "Depreciation & Non-cash", val: 1.1 },
  { label: "AR (Increase)", val: -0.8 },
  { label: "Inventory (Decrease)", val: 0.6 },
  { label: "AP (Increase)", val: 0.8 },
  { label: "Other WC", val: 0.9 },
];

/* ──────────────────────────────── FALLBACK DATA HELPERS ──────────────────────────────── */

function makeIsRow(
  id: string,
  acct: string,
  name: string,
  base: number,
  actual: number,
  driver: string,
  owner: string,
  evidence: boolean,
  status: FluxStatus
): FluxRow {
  return {
    id,
    acct,
    name,
    base,
    actual,
    driver,
    owner,
    evidence,
    status,
    currentPeriod: "Q3 2025",
    priorPeriod: "Q2 2025",
    periodType: "QoQ",
    thresholdPct: 0.05,
    significant: true,
    aiExplanation: null,
    expectedness: ACCOUNT_EXPECTEDNESS[acct] || "Expected",
    commentary: COMMENTARY_TEMPLATES[acct] || null,
    commentaryStatus: COMMENTARY_TEMPLATES[acct] ? "draft" : "none",
    approvedBy: null,
    approvedAt: null,
  };
}

/* ──────────────────────────────── FALLBACK DATA ──────────────────────────────── */

export const FALLBACK_DATA: FluxPageData = {
  is: [
    makeIsRow("is-4000", "4000", "Revenue", 48.2, 52.9, "Price/Volume/Mix", "Sales Ops", false, "Open"),
    makeIsRow("is-4100", "4100", "Product Revenue", 38.6, 42.8, "Volume/Price", "Sales Ops", true, "In Review"),
    makeIsRow("is-4200", "4200", "Services Revenue", 7.1, 7.4, "Utilization", "PS Lead", false, "Closed"),
    makeIsRow("is-4300", "4300", "Subscription Revenue", 2.5, 2.7, "Renewals", "RevOps", false, "Open"),
    makeIsRow("is-5000", "5000", "COGS", 30.4, 32.6, "Input costs/Volume", "Supply Chain", true, "In Review"),
    makeIsRow("is-5100", "5100", "Direct Materials", 18.2, 19.6, "Commodity Prices", "Procurement", false, "Open"),
    makeIsRow("is-5150", "5150", "Direct Labor", 7.8, 8.1, "Headcount/Overtime", "Ops Finance", true, "Closed"),
    makeIsRow("is-5180", "5180", "Manufacturing OH", 4.4, 4.9, "Allocation Rate", "Cost Accounting", false, "In Review"),
    makeIsRow("is-5200", "5200", "Gross Margin", 17.8, 20.3, "Price > COGS", "FP&A", true, "Closed"),
    makeIsRow("is-6100", "6100", "R&D", 6.2, 6.8, "Headcount Rate", "FP&A", false, "Open"),
    makeIsRow("is-6200", "6200", "Sales & Marketing", 4.8, 5.2, "Programs/Campaigns", "Marketing", true, "In Review"),
    makeIsRow("is-6300", "6300", "G&A", 3.1, 3.0, "One-time/Timing", "Controller", true, "Closed"),
    makeIsRow("is-6400", "6400", "Depreciation", 1.8, 1.9, "Asset Base", "Controller", true, "Closed"),
    makeIsRow("is-6500", "6500", "Amortization", 0.9, 1.0, "Intangibles", "Controller", false, "Open"),
    makeIsRow("is-6600", "6600", "Stock Compensation", 2.1, 2.3, "Headcount/Grants", "HR Finance", false, "Open"),
    makeIsRow("is-6700", "6700", "Interest Expense", 0.4, 0.3, "Debt Paydown", "Treasury", true, "Closed"),
    makeIsRow("is-6800", "6800", "Other Income", 0.2, 0.5, "FX / Gains", "Treasury", false, "Open"),
    makeIsRow("is-7000", "7000", "Tax Provision", 1.6, 1.8, "Effective Rate", "Tax", true, "In Review"),
    makeIsRow("is-7100", "7100", "Operating Income", 5.9, 7.1, "Revenue - OpEx", "FP&A", false, "Open"),
    makeIsRow("is-7200", "7200", "EBITDA", 8.6, 10.0, "Op Leverage", "FP&A", true, "Closed"),
    makeIsRow("is-4400", "4400", "License Revenue", 1.8, 2.0, "New Logos", "Sales Ops", false, "Open"),
    makeIsRow("is-4500", "4500", "Maintenance Revenue", 3.2, 3.1, "Churn", "RevOps", true, "In Review"),
    makeIsRow("is-5250", "5250", "Freight & Logistics", 2.1, 2.4, "Volume/Rates", "Supply Chain", false, "Open"),
    makeIsRow("is-5300", "5300", "Warranty Reserve", 0.8, 0.9, "Claims Rate", "Ops Finance", false, "Open"),
    makeIsRow("is-6150", "6150", "Engineering Contractors", 1.4, 1.6, "Project Spend", "Engineering", false, "In Review"),
    makeIsRow("is-6250", "6250", "Customer Success", 1.2, 1.3, "Headcount", "CS Lead", true, "Closed"),
    makeIsRow("is-6350", "6350", "Facilities", 0.6, 0.6, "Lease terms", "Controller", true, "Closed"),
    makeIsRow("is-6450", "6450", "Professional Fees", 0.5, 0.7, "Audit/Legal", "Controller", false, "Open"),
  ],
  bs: [
    {
      id: "bs-1100",
      acct: "1100",
      name: "Cash & Equivalents",
      base: 14.0,
      actual: 15.1,
      driver: "Operating Cash Flow",
      owner: "Treasury",
      evidence: true,
      status: "Closed",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
      expectedness: "Expected",
      commentary: null,
      commentaryStatus: "none",
      approvedBy: null,
      approvedAt: null,
    },
    {
      id: "bs-1200",
      acct: "1200",
      name: "Accounts Receivable",
      base: 18.4,
      actual: 19.2,
      driver: "Collections/DSO",
      owner: "AR Lead",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
      expectedness: "Anomalous",
      commentary: COMMENTARY_TEMPLATES["1200"] || null,
      commentaryStatus: "draft",
      approvedBy: null,
      approvedAt: null,
    },
    {
      id: "bs-1400",
      acct: "1400",
      name: "Inventory",
      base: 9.8,
      actual: 9.2,
      driver: "Usage/Reserves",
      owner: "Ops Finance",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
      expectedness: "Expected",
      commentary: null,
      commentaryStatus: "none",
      approvedBy: null,
      approvedAt: null,
    },
    {
      id: "bs-2000",
      acct: "2000",
      name: "Accounts Payable",
      base: 12.1,
      actual: 12.9,
      driver: "Payment Terms",
      owner: "AP Lead",
      evidence: true,
      status: "In Review",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
      expectedness: "Expected",
      commentary: null,
      commentaryStatus: "none",
      approvedBy: null,
      approvedAt: null,
    },
    {
      id: "bs-2400",
      acct: "2400",
      name: "Deferred Revenue",
      base: 11.3,
      actual: 12.1,
      driver: "Billings > Rev",
      owner: "RevOps",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
      expectedness: "Seasonal",
      commentary: null,
      commentaryStatus: "none",
      approvedBy: null,
      approvedAt: null,
    },
  ],
  bsRoll: [
    { acct: "1200 AR", open: 18.4, activity: 0.8, close: 19.2, notes: "Collections slower; DSO 43 -> 45" },
    { acct: "1400 Inventory", open: 9.8, activity: -0.6, close: 9.2, notes: "Scrap improved; DOH down 4d" },
    { acct: "2000 AP", open: 12.1, activity: 0.8, close: 12.9, notes: "Terms extended by 5d" },
    { acct: "2400 Deferred Rev", open: 11.3, activity: 0.8, close: 12.1, notes: "Strong billings; recognition lag" },
  ],
  drivers: [
    { driver: "Price", impact: 2.1, confidence: "High" },
    { driver: "Volume", impact: 1.8, confidence: "High" },
    { driver: "Mix", impact: 1.4, confidence: "Med" },
    { driver: "FX", impact: -0.6, confidence: "Med" },
    { driver: "New Logos", impact: 0.9, confidence: "Med" },
    { driver: "Churn", impact: -0.9, confidence: "High" },
    { driver: "Timing (AP)", impact: 0.8, confidence: "High" },
    { driver: "Inventory Usage", impact: -0.6, confidence: "Med" },
  ],
  cf: FALLBACK_CF_DATA,
  aiExplanations: [
    { acct: "4000 Revenue", delta: 4.7, driver: "Price ↑ / Volume ↑", conf: "High", owner: "Sales Ops", evidence: true, status: "Open" },
    { acct: "1200 AR", delta: 0.8, driver: "Collections timing", conf: "Med", owner: "AR Lead", evidence: false, status: "Open" },
    { acct: "2400 Deferred Rev", delta: 0.8, driver: "Billings > Rev", conf: "High", owner: "RevOps", evidence: false, status: "Open" },
    { acct: "1400 Inventory", delta: -0.6, driver: "Usage/Obsolescence", conf: "Med", owner: "Ops Finance", evidence: true, status: "Open" },
  ],
};

/* ──────────────────────────────── AI DETAIL DATA ──────────────────────────────── */

export const AI_ANALYSIS_MAP: Record<string, { summary: string; headline: string; bullets: string[] }> = {
  "4000": {
    summary: "Revenue grew +$4.7M (+9.8%) QoQ, driven by a combination of pricing power, volume expansion, and favorable mix shift.",
    headline: "Revenue: +$4.7M (+9.8%)",
    bullets: [
      "Price realization contributed +$2.1M (45% of uplift)",
      "Volume growth added +$1.8M from existing accounts",
      "Mix shift to higher-margin SKUs added +$1.4M",
      "Partially offset by FX headwind of -$0.6M and churn of -$0.9M",
    ],
  },
  "4100": {
    summary: "Product Revenue increased +$4.2M (+10.9%) driven by strong enterprise deal flow and pricing optimization.",
    headline: "Product Revenue: +$4.2M (+10.9%)",
    bullets: [
      "Enterprise segment contributed +$2.8M from new logos",
      "Mid-market upsells added +$1.1M",
      "Price increases across catalog contributed +$0.8M",
      "Offset by -$0.5M from delayed renewals",
    ],
  },
  "5000": {
    summary: "COGS rose +$2.2M (+7.2%) primarily from input cost inflation and volume-driven material consumption.",
    headline: "COGS: +$2.2M (+7.2%)",
    bullets: [
      "Raw material prices up +$1.1M due to commodity inflation",
      "Volume-related consumption added +$0.8M",
      "Freight surcharges contributed +$0.3M",
      "No material one-time items this period",
    ],
  },
  "5200": {
    summary: "Gross Margin expanded +$2.5M (+14.0%) reflecting positive operating leverage from revenue growth exceeding cost increases.",
    headline: "Gross Margin: +$2.5M (+14.0%)",
    bullets: [
      "Revenue growth (+$4.7M) exceeded COGS growth (+$2.2M)",
      "Margin rate improved from 36.9% to 38.4%",
      "Mix shift to higher-margin products contributed +$0.8M",
      "Operating efficiency gains added +$0.3M",
    ],
  },
};

/* ──────────────────────────────── ACTIVITY LOG ──────────────────────────────── */

export const ACTIVITY_LOG: Array<{ type: string; title: string; detail: string; actor: string; date: string }> = [
  { type: "assign", title: "Owner assigned", detail: "Sales Ops assigned as owner for account 4000.", actor: "Controller", date: "Feb 20, 10:30 AM" },
  { type: "create", title: "Record created", detail: "Revenue opened for the Q3 close variance review.", actor: "Close automation", date: "Feb 18, 10:30 PM" },
];

/* ──────────────────────────────── OWNER & DRIVER RULES ──────────────────────────────── */

export const OWNER_RULES: Array<{ pattern: RegExp; owner: string }> = [
  { pattern: /revenue|sales|subscription|rev/i, owner: "Sales Ops" },
  { pattern: /receivable|ar/i, owner: "AR Lead" },
  { pattern: /payable|ap/i, owner: "AP Lead" },
  { pattern: /inventory/i, owner: "Ops Finance" },
  { pattern: /cash|treasury|investment/i, owner: "Treasury" },
  { pattern: /marketing|g&a|administrative/i, owner: "Controller" },
  { pattern: /cogs|cost|material|supply/i, owner: "Supply Chain" },
];

export const DRIVER_RULES: Array<{ pattern: RegExp; driver: string }> = [
  { pattern: /revenue|sales|subscription/i, driver: "Price/Volume/Mix" },
  { pattern: /receivable|ar/i, driver: "Collections timing" },
  { pattern: /inventory/i, driver: "Usage/Obsolescence" },
  { pattern: /payable|ap/i, driver: "Terms and timing" },
  { pattern: /deferred/i, driver: "Billings > Rev" },
  { pattern: /cash|investment/i, driver: "Cash deployment" },
  { pattern: /r&d|research|development/i, driver: "Headcount rate" },
  { pattern: /marketing|g&a/i, driver: "Programs / one-time" },
];
