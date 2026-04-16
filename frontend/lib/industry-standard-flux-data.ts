/**
 * Industry-specific flux data for the Standard Flux (Flux Intelligence) page.
 *
 * Provides realistic FluxPageData for each industry, using the isLineItems
 * and bsLineItems from industry-data.ts as the basis. Values are in millions
 * (the industry-data values are in thousands, so divided by 1000).
 */

import type { Industry } from "@/lib/persona-context";
import type {
  FluxRow,
  FluxStatus,
  FluxPageData,
  BsRollRow,
  DriverRow,
  CfRow,
  AiExplanationRow,
  Expectedness,
  CommentaryStatus,
} from "@/lib/data/types/flux-analysis";

/* ──────────────────────────────── HELPERS ──────────────────────────────── */

function makeRow(
  id: string,
  acct: string,
  name: string,
  actual: number,
  base: number,
  driver: string,
  owner: string,
  status: FluxStatus,
  commentary: string,
  opts?: {
    evidence?: boolean;
    commentaryStatus?: CommentaryStatus;
    approvedBy?: string | null;
    approvedAt?: string | null;
    expectedness?: Expectedness;
    confidence?: "high" | "medium" | "low";
  }
): FluxRow {
  const delta = actual - base;
  const pct = base !== 0 ? Math.abs(delta / base) : 0;
  return {
    id,
    acct,
    name,
    actual,
    base,
    driver,
    owner,
    status,
    evidence: opts?.evidence ?? (status === "Closed"),
    currentPeriod: "Q3 2025",
    priorPeriod: "Q2 2025",
    periodType: "QoQ",
    thresholdPct: 0.05,
    significant: pct >= 0.03 || Math.abs(delta) >= 0.5,
    aiExplanation: null,
    expectedness: opts?.expectedness ?? "Expected",
    commentary,
    commentaryStatus: opts?.commentaryStatus ?? (status === "Closed" ? "approved" : status === "In Review" ? "submitted" : "draft"),
    approvedBy: opts?.approvedBy ?? (status === "Closed" ? owner : null),
    approvedAt: opts?.approvedAt ?? (status === "Closed" ? "2025-07-28T14:30:00Z" : null),
  };
}

function buildAiExplanations(rows: FluxRow[]): AiExplanationRow[] {
  return [...rows]
    .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
    .slice(0, 6)
    .map((row) => {
      const delta = Math.round((row.actual - row.base) * 10) / 10;
      const pct = row.base ? delta / row.base : 0;
      return {
        acct: `${row.acct} ${row.name}`,
        delta,
        driver: row.driver,
        conf: Math.abs(delta) >= 1 || Math.abs(pct) >= 0.08 ? ("High" as const) : ("Med" as const),
        owner: row.owner,
        evidence: row.evidence,
        status: row.status,
      };
    });
}

/* ══════════════════════════════════════════════════════════════════════════
   TECHNOLOGY
   ══════════════════════════════════════════════════════════════════════ */

const TECH_IS: FluxRow[] = [
  makeRow(
    "tech-is-4000", "4000", "SaaS Subscription Revenue",
    48.2, 45.8, "Volume", "Sarah Chen", "Open",
    "SaaS subscription revenue grew $2.4M (+5.2%) QoQ driven by 14 net-new enterprise logos and expansion ARR from existing mid-market accounts. Net revenue retention remained strong at 108%, though down from 115% prior quarter due to 3 Enterprise churns. Upsell pipeline for Q4 shows $3.1M in committed expansion deals.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "tech-is-4100", "4100", "Professional Services Revenue",
    8.4, 9.2, "Volume", "Michael Torres", "In Review",
    "Professional services revenue declined $0.8M (-8.7%) as implementation timelines extended for 4 enterprise deployments. Average project duration increased from 8 to 11 weeks due to custom integration requirements. Utilization rate dropped to 72% from 81%. Two senior consultants transitioned to product roles, reducing delivery capacity.",
    { expectedness: "Anomalous" }
  ),
  makeRow(
    "tech-is-4200", "4200", "Platform & Marketplace Revenue",
    3.2, 2.8, "Mix", "Emily Rodriguez", "Closed",
    "Platform revenue increased $0.4M (+14.3%) driven by marketplace transaction volume growth in the developer ecosystem. API call volume up 22% QoQ. Third-party integrations grew from 45 to 58 active partners. Revenue share model generating higher margins than direct licensing.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "tech-is-5000", "5000", "Cloud Infrastructure Costs",
    12.8, 11.2, "Volume", "David Park", "In Review",
    "Cloud infrastructure costs increased $1.6M (+14.3%) driven by compute scaling for 14 new enterprise customer environments and data migration workloads. AWS spend up 18% — triggered reserved instance review. Kubernetes cluster optimization project expected to yield 12% savings in Q4. Cost per customer trending upward at $2.1K/month vs $1.8K target.",
    { expectedness: "Anomalous" }
  ),
  makeRow(
    "tech-is-5100", "5100", "Customer Success & Support",
    6.4, 5.8, "Volume", "Sarah Chen", "Open",
    "Customer success costs grew $0.6M (+10.3%) from 4 new CSM hires to support enterprise tier expansion. Ticket volume up 15% on new feature releases. Average resolution time improved from 4.2 to 3.1 hours. CSAT score stable at 4.6/5.0. Headcount grew ahead of revenue per the approved capacity plan.",
    { evidence: false, expectedness: "Expected" }
  ),
  makeRow(
    "tech-is-6000", "6000", "R&D \u2014 Engineering",
    14.2, 13.6, "Volume", "David Park", "Closed",
    "R&D spending increased $0.6M (+4.4%) from 12 net-new engineering hires focused on platform scalability and AI/ML capabilities. Contractor spend flat. Patent filing costs of $0.1M for 3 new applications. Engineering velocity (story points) up 18% per sprint. Capitalization rate stable at 22% of total R&D.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "tech-is-6100", "6100", "Sales & Marketing",
    11.8, 10.4, "Volume", "Emily Rodriguez", "Open",
    "Sales & Marketing spend increased $1.4M (+13.5%) driven by pipeline investment for H2 ramp. $0.6M incremental spend on annual user conference (SaaSConnect 2025). Digital CAC increased 8% but LTV:CAC ratio stable at 3.2x. Field sales team expanded by 3 AEs in EMEA. Brand awareness campaign launched in DACH region.",
    { evidence: false, expectedness: "One-time" }
  ),
  makeRow(
    "tech-is-6200", "6200", "General & Administrative",
    4.8, 4.6, "One-Time", "Michael Torres", "Closed",
    "G&A increased $0.2M (+4.3%) primarily from $0.15M in legal fees related to SOC 2 Type II audit and international data privacy compliance (GDPR Article 30). Insurance premiums renewed at 3% increase. Facilities costs flat with remote-first policy. One-time consulting fee for ERP migration scoping.",
    { evidence: true, expectedness: "One-time" }
  ),
];

const TECH_BS: FluxRow[] = [
  makeRow(
    "tech-bs-1000", "1000", "Cash & Equivalents",
    142.0, 138.0, "Operating Cash Flow", "David Park", "Closed",
    "Cash increased $4.0M driven by strong operating cash flow from subscription collections. Free cash flow margin at 16%. No significant capital deployments this quarter. Cash conversion cycle improved 3 days.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "tech-bs-1100", "1100", "Accounts Receivable",
    28.4, 24.2, "Collections/DSO", "Sarah Chen", "Open",
    "AR increased $4.2M (+17.4%) as DSO expanded from 38 to 44 days. Two large enterprise invoices ($1.2M combined) past due 30+ days. Annual billing cycle for 6 enterprise accounts contributed $2.8M in new receivables. Collections team investigating Acme Corp disputed invoice ($400K).",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "tech-bs-1800", "1800", "Capitalized Software Costs",
    18.6, 16.4, "Capitalization", "Michael Torres", "In Review",
    "Capitalized software increased $2.2M from internal development of next-gen platform architecture. Capitalization rate of 22% applied to qualifying R&D spend. Amortization of $1.4M recognized in period. Useful life assessment unchanged at 3 years.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "tech-bs-2200", "2200", "Deferred Revenue",
    52.0, 48.0, "Billings > Rev Recognition", "Emily Rodriguez", "Open",
    "Deferred revenue grew $4.0M (+8.3%) from strong annual prepayment collections. 68% of new enterprise deals opted for annual billing. Current portion of deferred revenue at $38M, representing visibility into next 4 quarters. Multi-year deal billings contributed $1.8M.",
    { evidence: false, expectedness: "Seasonal" }
  ),
  makeRow(
    "tech-bs-2300", "2300", "Accrued Compensation",
    8.2, 7.8, "Headcount Growth", "David Park", "Closed",
    "Accrued compensation increased $0.4M from headcount growth (net +16 employees). Bonus accrual trued up based on Q3 performance metrics. Stock compensation expense of $2.1M on new RSU grants vesting. Payroll timing normal.",
    { evidence: true, expectedness: "Expected" }
  ),
];

const TECH_CF: CfRow[] = [
  { label: "Net Income", val: 5.8 },
  { label: "Depreciation & Amortization", val: 2.4 },
  { label: "Stock-Based Compensation", val: 2.1 },
  { label: "AR (Increase)", val: -4.2 },
  { label: "Deferred Revenue (Increase)", val: 4.0 },
  { label: "Accrued Comp (Increase)", val: 0.4 },
  { label: "Other Working Capital", val: -0.5 },
];

const TECH_DRIVERS: DriverRow[] = [
  { driver: "Volume", impact: 3.2, confidence: "High" },
  { driver: "Price", impact: 1.4, confidence: "High" },
  { driver: "Mix", impact: 0.8, confidence: "Med" },
  { driver: "One-Time", impact: -0.4, confidence: "Med" },
  { driver: "FX", impact: -0.3, confidence: "Med" },
  { driver: "Churn", impact: -0.8, confidence: "High" },
];

const TECH_BS_ROLL: BsRollRow[] = [
  { acct: "1100 Accounts Receivable", open: 24.2, activity: 4.2, close: 28.4, notes: "DSO expanded 38 -> 44 days; 2 enterprise invoices past due" },
  { acct: "1800 Capitalized Software", open: 16.4, activity: 2.2, close: 18.6, notes: "Net of $1.4M amortization; platform dev capitalized" },
  { acct: "2200 Deferred Revenue", open: 48.0, activity: 4.0, close: 52.0, notes: "Strong annual prepay collections; enterprise billings" },
  { acct: "2300 Accrued Compensation", open: 7.8, activity: 0.4, close: 8.2, notes: "Headcount growth +16; bonus accrual true-up" },
];

const TECH_DATA: FluxPageData = {
  is: TECH_IS,
  bs: TECH_BS,
  cf: TECH_CF,
  drivers: TECH_DRIVERS,
  bsRoll: TECH_BS_ROLL,
  aiExplanations: buildAiExplanations([...TECH_IS, ...TECH_BS]),
};

/* ══════════════════════════════════════════════════════════════════════════
   HEALTHCARE
   ══════════════════════════════════════════════════════════════════════ */

const HC_IS: FluxRow[] = [
  makeRow(
    "hc-is-4000", "4000", "Inpatient Revenue",
    82.4, 86.8, "Volume", "Dr. Rachel Kim", "Open",
    "Inpatient revenue declined $4.4M (-5.1%) driven by unfavorable payer mix shift. Medicaid patient volume increased 18% while commercial admits declined 4%. Net Revenue Per Patient Day (NRPPD) fell from $3,020 to $2,840. Case Mix Index (CMI) stable at 1.82 but reimbursement per case dropped $420. Bed utilization at 94% creating capacity constraints for higher-acuity commercial cases.",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "hc-is-4100", "4100", "Outpatient Revenue",
    34.2, 31.8, "Volume", "James Mitchell", "In Review",
    "Outpatient revenue grew $2.4M (+7.5%) driven by ambulatory surgery center (ASC) volume growth. Orthopedic and ophthalmology procedures shifted from inpatient to ASC settings, improving margin per case. Patient throughput increased 12% with new scheduling optimization. Telehealth visits contributed $0.8M in incremental revenue.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "hc-is-4200", "4200", "Emergency Department Revenue",
    18.6, 17.2, "Volume", "Dr. Rachel Kim", "Closed",
    "ED revenue increased $1.4M (+8.1%) from flu season surge — visits up 12% QoQ. Admission conversion rate improved to 28% from 24%. Average acuity higher (ESI Level 2-3 mix up 8pp), supporting revenue per visit despite longer wait times. Three competitor ED closures redirected overflow volume.",
    { evidence: true, expectedness: "Seasonal" }
  ),
  makeRow(
    "hc-is-4300", "4300", "Physician Services Revenue",
    12.4, 12.8, "Mix", "James Mitchell", "Open",
    "Physician services revenue declined $0.4M (-3.1%) from locum tenens coverage gaps in cardiology and neurology. Two attending physicians on extended leave. wRVU productivity per FTE declined 6%. Compensation guarantee payments to 3 new recruits partially offset by lower per-unit cost.",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "hc-is-5000", "5000", "Salaries & Benefits",
    68.2, 64.8, "Volume", "Patricia Nguyen", "In Review",
    "Salaries & benefits increased $3.4M (+5.2%) from nursing overtime, agency staffing costs, and benefit rate increases. Overtime hours up 22% driven by census surge and staffing shortages. Agency nurse premium of $85/hr vs $42/hr employed rate. Benefits costs up 3.8% from health plan renewals. FTE count grew by 28 net positions.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "hc-is-5100", "5100", "Supplies & Pharmaceuticals",
    28.4, 26.2, "Price", "Dr. Rachel Kim", "Open",
    "Supplies & pharma costs increased $2.2M (+8.4%) driven by specialty drug inflation and new oncology protocol adoption. Pharmacy spend up 12% on biologic agents. Implant costs up 6% from orthopedic joint replacement volume. GPO contract renegotiation in progress for Q4 savings. Supply chain disruptions added $0.3M in expedited shipping.",
    { evidence: false, expectedness: "Expected" }
  ),
  makeRow(
    "hc-is-6000", "6000", "Facility & Equipment",
    14.2, 13.8, "One-Time", "Patricia Nguyen", "Closed",
    "Facility costs increased $0.4M (+2.9%) from HVAC system upgrades in the East Wing and biomedical equipment maintenance contracts. One-time $0.2M capital repair for MRI suite. Depreciation on new cath lab equipment commenced this quarter. Energy costs flat with sustainability program savings offsetting rate increases.",
    { evidence: true, expectedness: "One-time" }
  ),
  makeRow(
    "hc-is-6100", "6100", "Insurance & Compliance",
    8.6, 8.2, "Volume", "James Mitchell", "Closed",
    "Insurance & compliance costs increased $0.4M (+4.9%) from malpractice premium renewal and new CMS reporting requirements (QPP/MIPS). Compliance staffing grew by 2 FTEs for ICD-11 transition preparation. Cybersecurity insurance premium up 8% driven by industry-wide rate hardening.",
    { evidence: true, expectedness: "Expected" }
  ),
];

const HC_BS: FluxRow[] = [
  makeRow(
    "hc-bs-1000", "1000", "Cash & Investments",
    98.0, 102.0, "Operating Cash Flow", "Patricia Nguyen", "In Review",
    "Cash declined $4.0M from operating margin compression and capital expenditure on new cath lab ($2.8M). Days cash on hand decreased from 142 to 136 days. Investment portfolio yield stable at 4.2%. Debt service payments of $1.2M per quarter on schedule.",
    { expectedness: "Anomalous" }
  ),
  makeRow(
    "hc-bs-1100", "1100", "Patient Receivables",
    42.8, 38.4, "Collections/Payer Cycle", "James Mitchell", "Open",
    "Patient receivables increased $4.4M (+11.5%) driven by Medicaid claim processing delays and increased denial rates. Days in AR grew from 52 to 58 days. Medicaid pending claims up 24%. Commercial payer denials at 8.2% vs 6.1% benchmark. Appeals backlog of $1.8M requires additional coding resources.",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "hc-bs-1800", "1800", "Property & Equipment",
    186.0, 182.0, "Capital Expenditure", "Patricia Nguyen", "Closed",
    "PP&E increased $4.0M net of $3.2M depreciation. New cardiac catheterization lab ($2.8M) placed in service. Biomedical equipment replacements of $1.6M. IT infrastructure upgrades for EHR system of $0.8M. Useful life assessments unchanged.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "hc-bs-2200", "2200", "Deferred Grant Revenue",
    8.4, 6.8, "Grant Timing", "Dr. Rachel Kim", "Open",
    "Deferred grant revenue increased $1.6M (+23.5%) from new NIH research grant awards recognized ratably. $0.8M awarded for clinical genomics trial. $0.5M state health department grant for community outreach. Revenue recognition over 24-36 month grant periods.",
    { evidence: false, expectedness: "Seasonal" }
  ),
  makeRow(
    "hc-bs-2300", "2300", "Accrued Salaries & Benefits",
    12.4, 11.8, "Payroll Timing", "Patricia Nguyen", "Closed",
    "Accrued salaries increased $0.6M from headcount growth (+28 FTEs), overtime accruals, and physician incentive compensation true-up. PTO accrual increased $0.2M from restricted vacation usage during census surge. Normal payroll timing at quarter end.",
    { evidence: true, expectedness: "Expected" }
  ),
];

const HC_CF: CfRow[] = [
  { label: "Net Income", val: -2.8 },
  { label: "Depreciation & Amortization", val: 3.2 },
  { label: "Patient Receivables (Increase)", val: -4.4 },
  { label: "Deferred Grant Revenue (Increase)", val: 1.6 },
  { label: "Accrued Salaries (Increase)", val: 0.6 },
  { label: "Capital Expenditures", val: -7.2 },
  { label: "Other Working Capital", val: -0.4 },
];

const HC_DRIVERS: DriverRow[] = [
  { driver: "Volume", impact: -1.8, confidence: "High" },
  { driver: "Price", impact: -2.6, confidence: "High" },
  { driver: "Mix", impact: -1.2, confidence: "Med" },
  { driver: "One-Time", impact: -0.4, confidence: "Med" },
  { driver: "Seasonal", impact: 1.4, confidence: "High" },
  { driver: "Payer Mix", impact: -2.8, confidence: "High" },
];

const HC_BS_ROLL: BsRollRow[] = [
  { acct: "1000 Cash & Investments", open: 102.0, activity: -4.0, close: 98.0, notes: "Operating margin compression; cath lab CapEx $2.8M" },
  { acct: "1100 Patient Receivables", open: 38.4, activity: 4.4, close: 42.8, notes: "Medicaid delays; AR days 52 -> 58; denial rate up" },
  { acct: "1800 Property & Equipment", open: 182.0, activity: 4.0, close: 186.0, notes: "New cath lab + equipment; net of $3.2M depreciation" },
  { acct: "2200 Deferred Grant Revenue", open: 6.8, activity: 1.6, close: 8.4, notes: "NIH and state grants awarded; ratable recognition" },
  { acct: "2300 Accrued Salaries", open: 11.8, activity: 0.6, close: 12.4, notes: "Headcount +28; overtime accrual; PTO build" },
];

const HC_DATA: FluxPageData = {
  is: HC_IS,
  bs: HC_BS,
  cf: HC_CF,
  drivers: HC_DRIVERS,
  bsRoll: HC_BS_ROLL,
  aiExplanations: buildAiExplanations([...HC_IS, ...HC_BS]),
};

/* ══════════════════════════════════════════════════════════════════════════
   RETAIL (industry id: "manufacturing")
   ══════════════════════════════════════════════════════════════════════ */

const RETAIL_IS: FluxRow[] = [
  makeRow(
    "retail-is-4000", "4000", "Net Sales \u2014 Stores",
    186.4, 198.2, "Volume", "Sarah Chen", "Open",
    "Store revenue declined $11.8M (-6.0%) driven by 8% traffic decline and negative comp store sales (-3.2%). Northeast blizzard closed 180 stores for 2 days, costing an estimated $1.8M in lost selling days. Average Unit Retail (AUR) down 3% from aggressive markdowns on seasonal apparel. Full-price selling rate at 62% vs 68% target. Inventory weeks-on-hand up to 14 from 11 target — clearance activity accelerating.",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "retail-is-4100", "4100", "Net Sales \u2014 Digital",
    72.8, 64.4, "Volume", "Emily Rodriguez", "In Review",
    "Digital revenue grew $8.4M (+13.0%) driven by improved conversion rate (+40bps to 3.8%), higher mobile traffic share (68% of sessions), and BOPIS adoption up 34%. Digital AUR stable at $52 vs $44 in-store. New product launches drove 18% of digital revenue. Customer acquisition cost declined 12% from organic search optimization. App downloads up 28% QoQ.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "retail-is-4200", "4200", "Wholesale Revenue",
    18.6, 19.2, "Mix", "Michael Torres", "Closed",
    "Wholesale revenue declined $0.6M (-3.1%) from department store partner inventory rationalization. Two major retailers reduced forward orders by 8%. Direct-to-consumer shift continuing — wholesale now 6.7% of total revenue vs 7.3% prior quarter. Specialty channel showing resilience with +4% growth.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "retail-is-5000", "5000", "Cost of Goods Sold",
    148.2, 142.8, "Price", "David Park", "In Review",
    "COGS increased $5.4M (+3.8%) despite lower unit volume, driven by markdown-induced AUR compression and higher input costs. Cotton prices up 6%. Freight costs up 4% on ocean container rate increases. Promotional markdown activity increased by $3.2M to clear seasonal inventory. Product cost per unit up 2.8% from supplier price adjustments.",
    { expectedness: "Expected" }
  ),
  makeRow(
    "retail-is-5100", "5100", "Fulfillment & Logistics",
    22.4, 18.6, "Volume", "Sarah Chen", "Open",
    "Fulfillment costs surged $3.8M (+20.4%) driven by digital volume growth and expedited shipping for BOPIS orders. Last-mile delivery cost per order up 8% from carrier surcharges. Same-day delivery program launched in 12 metro areas adding $0.6M incremental cost. Returns processing volume up 15%, adding $0.4M. Automation investment expected to yield savings in Q1 2026.",
    { evidence: false, expectedness: "Anomalous" }
  ),
  makeRow(
    "retail-is-6000", "6000", "Store Operations",
    42.8, 41.2, "Volume", "Michael Torres", "Closed",
    "Store operations increased $1.6M (+3.9%) from higher security costs (+$0.4M), maintenance expenses (+$0.3M), and seasonal temporary staffing. 8 store renovations in progress — temporary labor and disruption costs of $0.5M. Lease renewals on 12 locations at blended 2.4% increase. Payroll hours optimized with new traffic-based scheduling — labor productivity up 3%.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "retail-is-6100", "6100", "Marketing & Brand",
    18.4, 16.8, "Volume", "Emily Rodriguez", "Open",
    "Marketing spend increased $1.6M (+9.5%) driven by digital customer acquisition investment and brand campaign refresh. Performance marketing spend up $0.8M with ROAS of 4.2x. Influencer program launched contributing $0.3M. Holiday campaign pre-production costs of $0.5M. Brand awareness scores improved 6pp in target demographic (18-34).",
    { evidence: false, expectedness: "One-time" }
  ),
  makeRow(
    "retail-is-6200", "6200", "Corporate & Admin",
    12.6, 12.2, "One-Time", "David Park", "Closed",
    "Corporate & admin increased $0.4M (+3.3%) from ERP system upgrade consulting fees ($0.2M) and annual audit costs. Legal fees for lease restructuring on 3 underperforming stores. Insurance premiums flat. Corporate headcount unchanged. One-time real estate advisory fee for store portfolio optimization study.",
    { evidence: true, expectedness: "One-time" }
  ),
];

const RETAIL_BS: FluxRow[] = [
  makeRow(
    "retail-bs-1000", "1000", "Cash & Equivalents",
    68.0, 82.0, "Operating Cash Flow", "David Park", "Open",
    "Cash declined $14.0M (-17.1%) from inventory build, store renovation CapEx ($4.2M), and seasonal working capital needs. Free cash flow negative this quarter at -$8.2M. Line of credit undrawn — $50M facility available. Cash conversion cycle extended 6 days to 48 days.",
    { evidence: false, expectedness: "Seasonal" }
  ),
  makeRow(
    "retail-bs-1100", "1100", "Accounts Receivable",
    14.2, 12.8, "Wholesale Terms", "Michael Torres", "Closed",
    "AR increased $1.4M (+10.9%) from wholesale partner payment timing. Two department store partners on extended 60-day terms (up from 45). Digital marketplace receivables of $0.8M from third-party platform settlements pending. DSO stable at 18 days for wholesale channel.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "retail-bs-1200", "1200", "Inventory",
    142.0, 128.0, "Seasonal Build", "Sarah Chen", "In Review",
    "Inventory increased $14.0M (+10.9%) from seasonal pre-build for holiday and markdown slowdown on fall apparel. Weeks-on-hand at 14 vs 11 target. Inventory turns slowing to 3.2x from 3.8x. Aged inventory (>90 days) at 22% of total, up from 16%. Clearance event planned for early Q4 to normalize levels. Footwear inventory healthy at 9 weeks-on-hand.",
    { expectedness: "Seasonal" }
  ),
  makeRow(
    "retail-bs-1800", "1800", "Store Leases (ROU)",
    286.0, 292.0, "Lease Amortization", "David Park", "Closed",
    "Right-of-use assets declined $6.0M (-2.1%) from lease amortization on 420 store locations. 3 store closures reduced ROU by $2.4M. 12 lease renewals at blended 2.4% increase partially offset. No new store openings this quarter. Weighted average remaining lease term at 6.8 years.",
    { evidence: true, expectedness: "Expected" }
  ),
  makeRow(
    "retail-bs-2200", "2200", "Deferred Revenue \u2014 Gift Cards",
    18.4, 22.6, "Redemption Activity", "Emily Rodriguez", "Open",
    "Deferred gift card revenue decreased $4.2M (-18.6%) from elevated holiday gift card redemptions and breakage recognition. Q3 is the peak redemption quarter post-holiday season. Gift card sales in Q3 at $2.8M, down from $6.4M holiday quarter. Breakage revenue of $0.8M recognized on cards >24 months old. Loyalty program deferred points stable at $1.2M.",
    { evidence: false, expectedness: "Seasonal" }
  ),
  makeRow(
    "retail-bs-2300", "2300", "Accrued Rent & Occupancy",
    24.8, 24.2, "Lease Terms", "Michael Torres", "Closed",
    "Accrued rent increased $0.6M (+2.5%) from straight-line lease adjustment on 12 renewed locations and CAM charge reconciliation. Property tax accruals adjusted for 8 jurisdictions. Percentage rent accrual of $0.4M based on revenue achievement triggers. Landlord incentive amortization on schedule.",
    { evidence: true, expectedness: "Expected" }
  ),
];

const RETAIL_CF: CfRow[] = [
  { label: "Net Income", val: -4.6 },
  { label: "Depreciation & Lease Amortization", val: 8.4 },
  { label: "AR (Increase)", val: -1.4 },
  { label: "Inventory (Increase)", val: -14.0 },
  { label: "Gift Card Deferred Rev (Decrease)", val: -4.2 },
  { label: "Accrued Rent (Increase)", val: 0.6 },
  { label: "Capital Expenditures (Store Renovations)", val: -4.2 },
  { label: "Other Working Capital", val: 1.2 },
];

const RETAIL_DRIVERS: DriverRow[] = [
  { driver: "Volume", impact: -6.8, confidence: "High" },
  { driver: "Price", impact: -3.2, confidence: "High" },
  { driver: "Mix", impact: 1.4, confidence: "Med" },
  { driver: "One-Time", impact: -0.6, confidence: "Med" },
  { driver: "Seasonal", impact: -2.4, confidence: "High" },
  { driver: "Digital Growth", impact: 8.4, confidence: "High" },
];

const RETAIL_BS_ROLL: BsRollRow[] = [
  { acct: "1000 Cash & Equivalents", open: 82.0, activity: -14.0, close: 68.0, notes: "Inventory build + CapEx; FCF negative at -$8.2M" },
  { acct: "1200 Inventory", open: 128.0, activity: 14.0, close: 142.0, notes: "Seasonal build; WOH 14 vs 11 target; clearance planned" },
  { acct: "1800 Store Leases (ROU)", open: 292.0, activity: -6.0, close: 286.0, notes: "Amortization + 3 closures; 12 renewals" },
  { acct: "2200 Deferred Rev — Gift Cards", open: 22.6, activity: -4.2, close: 18.4, notes: "Post-holiday redemption peak; breakage $0.8M" },
  { acct: "2300 Accrued Rent", open: 24.2, activity: 0.6, close: 24.8, notes: "Straight-line adjustments; CAM reconciliation" },
];

const RETAIL_DATA: FluxPageData = {
  is: RETAIL_IS,
  bs: RETAIL_BS,
  cf: RETAIL_CF,
  drivers: RETAIL_DRIVERS,
  bsRoll: RETAIL_BS_ROLL,
  aiExplanations: buildAiExplanations([...RETAIL_IS, ...RETAIL_BS]),
};

/* ══════════════════════════════════════════════════════════════════════════
   LOOKUP
   ══════════════════════════════════════════════════════════════════════ */

const INDUSTRY_FLUX_MAP: Record<Industry, FluxPageData> = {
  technology: TECH_DATA,
  healthcare: HC_DATA,
  manufacturing: RETAIL_DATA,
};

/**
 * Returns industry-specific FluxPageData for the Standard Flux page.
 * Values are in millions (converted from the thousands-based isLineItems/bsLineItems).
 */
export function getStandardFluxIndustryData(industry: Industry): FluxPageData {
  return INDUSTRY_FLUX_MAP[industry];
}
