/**
 * Industry-specific data for the Gartner demo.
 * Each industry provides terminology, KPI labels, segment names, driver names,
 * AI suggestions, and metric values that replace the defaults in workbenches.
 */

import type { Industry } from "@/lib/persona-context";

// ─── Common types ────────────────────────────────────────────────

export interface IndustryConfig {
  id: Industry;
  label: string;
  revenueTerm: string;
  revenueShort: string;
  currency: string;
  segments: string[];
  regions: RegionConfig[];
  kpis: KpiSet;
  drivers: DriverConfig[];
  isLineItems: LineItem[];
  bsLineItems: LineItem[];
  aiSuggestions: string[];
  narratives: NarrativeSet;
}

export interface RegionConfig {
  id: string;
  label: string;
  segments: SegmentConfig[];
  variance: string;
  varianceColor: "up" | "down";
  driver: string;
  driverDetail: string;
  signalTitle: string;
  signalBody: string;
  signalPositive: boolean;
  chartTitle: string;
  chartBars: { week: string; actual: number; plan: number; forecast?: boolean }[];
}

export interface SegmentConfig {
  rank: number;
  name: string;
  variance: string;
  text: string;
  tags: { cls: string; label: string }[];
}

export interface KpiSet {
  metric1: { label: string; value: string; delta: string; deltaDir: "up" | "down" };
  metric2: { label: string; value: string; delta: string; deltaDir: "up" | "down" };
  metric3: { label: string; value: string; delta: string; deltaDir: "up" | "down" };
  metric4: { label: string; value: string; delta: string; deltaDir: "up" | "down" };
}

export interface DriverConfig {
  name: string;
  impact: string;
  impactDir: "up" | "down";
  confidence: "high" | "medium" | "low";
}

export interface LineItem {
  accountNumber: string;
  accountName: string;
  currentValue: number;
  priorValue: number;
  category: string;
}

export interface NarrativeSet {
  /** Executive one-liner for UberFlux topbar */
  headline: string;
  /** AI narrative for Form Factor */
  formFactorInsight: string;
  /** Standard Flux commentary templates per account category */
  fluxCommentary: Record<string, string>;
}

// ─── TECHNOLOGY ──────────────────────────────────────────────────

const TECHNOLOGY: IndustryConfig = {
  id: "technology",
  label: "Technology",
  revenueTerm: "ARR / SaaS Revenue",
  revenueShort: "ARR",
  currency: "USD",
  segments: ["Enterprise", "Mid-Market", "SMB", "Channel"],
  regions: [
    {
      id: "national",
      label: "Global",
      variance: "−$3.2M",
      varianceColor: "down",
      driver: "Churn",
      driverDetail: "Enterprise churn spike ↑",
      signalTitle: "Predictive Signal — Enterprise Churn Risk",
      signalBody: "Enterprise logo churn accelerating — 3 accounts ($2.1M ARR) flagged by ML model as high-risk for non-renewal. NRR dropped to 108% from 115% QoQ. Expansion pipeline strong in Mid-Market but insufficient to offset Enterprise losses.",
      signalPositive: false,
      chartTitle: "Weekly ARR Variance — Enterprise Segment",
      chartBars: [
        { week: "W6", actual: 58, plan: 62 },
        { week: "W7", actual: 57, plan: 62 },
        { week: "W8", actual: 53, plan: 62 },
        { week: "W9", actual: 48, plan: 62 },
        { week: "W10", actual: 44, plan: 62 },
        { week: "W11▸", actual: 41, plan: 62, forecast: true },
      ],
      segments: [
        { rank: 1, name: "Enterprise", variance: "−$2.1M vs Plan", text: "3 logo churns in Q1 — Acme Corp ($800K), GlobalTech ($750K), DataStar ($550K). NRR declined from 115% to 108%. Renewal pipeline shows 2 additional at-risk accounts. Expansion ARR from existing accounts partially offsets at +$600K.", tags: [{ cls: "pill-red", label: "Churn spike" }, { cls: "pill-amber", label: "NRR decline" }, { cls: "pill-blue", label: "Predictive flag" }] },
        { rank: 2, name: "Mid-Market", variance: "+$0.5M vs Plan", text: "Strong new logo acquisition — 12 new accounts vs 8 planned. Average deal size $42K, up 15% from prior quarter. Land-and-expand motion working well in financial services vertical.", tags: [{ cls: "pill-green", label: "New logos" }, { cls: "pill-green", label: "Deal size ↑" }] },
        { rank: 3, name: "SMB", variance: "−$0.4M vs Plan", text: "Self-serve signups flat. Free-to-paid conversion dropped to 3.2% from 4.1%. Pricing experiment in APAC showing early positive signals but not yet material.", tags: [{ cls: "pill-amber", label: "Conversion drop" }, { cls: "pill-blue", label: "Pricing test" }] },
      ],
    },
    {
      id: "americas",
      label: "Americas",
      variance: "−$1.8M",
      varianceColor: "down",
      driver: "Enterprise",
      driverDetail: "Logo churn ↑",
      signalTitle: "Americas: Enterprise Renewals at Risk",
      signalBody: "Two Enterprise accounts ($1.2M combined ARR) entering renewal window with declining usage metrics. CSM engagement scores below threshold.",
      signalPositive: false,
      chartTitle: "Weekly ARR — Americas Enterprise",
      chartBars: [
        { week: "W6", actual: 32, plan: 35 },
        { week: "W7", actual: 31, plan: 35 },
        { week: "W8", actual: 29, plan: 35 },
        { week: "W9", actual: 27, plan: 35 },
        { week: "W10", actual: 25, plan: 35 },
        { week: "W11▸", actual: 24, plan: 35, forecast: true },
      ],
      segments: [
        { rank: 1, name: "US Enterprise", variance: "−$1.2M vs Plan", text: "Acme Corp and DataStar churned. Product adoption metrics had been declining for 6 weeks pre-churn. CSM flagged but intervention came too late.", tags: [{ cls: "pill-red", label: "Logo churn" }, { cls: "pill-amber", label: "Late intervention" }] },
        { rank: 2, name: "US Mid-Market", variance: "+$0.3M vs Plan", text: "Strong quarter — 8 new logos closed, average ACV $38K. Financial services vertical driving 60% of new pipeline.", tags: [{ cls: "pill-green", label: "New logos" }] },
        { rank: 3, name: "Canada", variance: "−$0.2M vs Plan", text: "One Enterprise downgrade (CAD$180K). Healthcare vertical slow to adopt new modules.", tags: [{ cls: "pill-amber", label: "Downgrade" }] },
      ],
    },
    {
      id: "emea",
      label: "EMEA",
      variance: "+$0.2M",
      varianceColor: "up",
      driver: "Expansion",
      driverDetail: "DACH upsells ↑",
      signalTitle: "EMEA: Positive — DACH Expansion Ahead of Plan",
      signalBody: "DACH region expansion ARR tracking 120% of plan. UK new logos steady. Southern Europe pipeline building for H2.",
      signalPositive: true,
      chartTitle: "Weekly ARR — EMEA",
      chartBars: [
        { week: "W6", actual: 14, plan: 13 },
        { week: "W7", actual: 14, plan: 13 },
        { week: "W8", actual: 15, plan: 13 },
        { week: "W9", actual: 15, plan: 14 },
        { week: "W10", actual: 15, plan: 14 },
        { week: "W11▸", actual: 16, plan: 14, forecast: true },
      ],
      segments: [
        { rank: 1, name: "DACH", variance: "+$0.3M vs Plan", text: "3 enterprise upsells closed — average expansion 40% of initial ACV. Product-led growth initiative driving adoption metrics up 25% QoQ.", tags: [{ cls: "pill-green", label: "Expansion" }, { cls: "pill-green", label: "PLG working" }] },
        { rank: 2, name: "UK & Ireland", variance: "−$0.1M vs Plan", text: "Flat. Two new logos offset by one mid-market churn. Pipeline building for Q2.", tags: [{ cls: "pill-amber", label: "Flat" }] },
      ],
    },
  ],
  kpis: {
    metric1: { label: "Net Revenue Retention", value: "108%", delta: "▼ 7pp vs prior Q", deltaDir: "down" },
    metric2: { label: "New ARR", value: "$4.2M", delta: "▲ 12% vs plan", deltaDir: "up" },
    metric3: { label: "Gross Margin", value: "78.4%", delta: "▼ 1.2pp vs prior Q", deltaDir: "down" },
    metric4: { label: "Cloud Spend Ratio", value: "22%", delta: "▲ 3pp vs prior Q", deltaDir: "up" },
  },
  drivers: [
    { name: "Enterprise Churn", impact: "−$2.1M", impactDir: "down", confidence: "high" },
    { name: "Mid-Market New Logos", impact: "+$1.2M", impactDir: "up", confidence: "high" },
    { name: "Expansion ARR", impact: "+$0.8M", impactDir: "up", confidence: "medium" },
    { name: "Cloud Infrastructure", impact: "−$0.6M", impactDir: "down", confidence: "medium" },
    { name: "Professional Services", impact: "−$0.3M", impactDir: "down", confidence: "low" },
  ],
  isLineItems: [
    { accountNumber: "4000", accountName: "SaaS Subscription Revenue", currentValue: 48200, priorValue: 45800, category: "Revenue" },
    { accountNumber: "4100", accountName: "Professional Services Revenue", currentValue: 8400, priorValue: 9200, category: "Revenue" },
    { accountNumber: "4200", accountName: "Platform & Marketplace Revenue", currentValue: 3200, priorValue: 2800, category: "Revenue" },
    { accountNumber: "5000", accountName: "Cloud Infrastructure Costs", currentValue: 12800, priorValue: 11200, category: "COGS" },
    { accountNumber: "5100", accountName: "Customer Success & Support", currentValue: 6400, priorValue: 5800, category: "COGS" },
    { accountNumber: "6000", accountName: "R&D — Engineering", currentValue: 14200, priorValue: 13600, category: "OpEx" },
    { accountNumber: "6100", accountName: "Sales & Marketing", currentValue: 11800, priorValue: 10400, category: "OpEx" },
    { accountNumber: "6200", accountName: "General & Administrative", currentValue: 4800, priorValue: 4600, category: "OpEx" },
  ],
  bsLineItems: [
    { accountNumber: "1000", accountName: "Cash & Equivalents", currentValue: 142000, priorValue: 138000, category: "Assets" },
    { accountNumber: "1100", accountName: "Accounts Receivable", currentValue: 28400, priorValue: 24200, category: "Assets" },
    { accountNumber: "1800", accountName: "Capitalized Software Costs", currentValue: 18600, priorValue: 16400, category: "Assets" },
    { accountNumber: "2200", accountName: "Deferred Revenue", currentValue: 52000, priorValue: 48000, category: "Liabilities" },
    { accountNumber: "2300", accountName: "Accrued Compensation", currentValue: 8200, priorValue: 7800, category: "Liabilities" },
  ],
  aiSuggestions: [
    "Why did Enterprise churn spike this quarter?",
    "Compare NRR trend to prior 4 quarters",
    "What's driving cloud cost increase?",
    "Which accounts are at risk for next quarter?",
    "Show expansion ARR by segment",
  ],
  narratives: {
    headline: "Enterprise churn driving ARR miss — NRR down to 108%. Mid-Market acquisition strong but insufficient to offset.",
    formFactorInsight: "SaaS gross margin compressed 120bps WoW, driven by cloud infrastructure cost increases (+14% QoQ) and lower professional services utilization. Enterprise segment mix shift toward lower-margin platform deals. Mid-Market expansion partially offsets via higher-margin subscription upsells. Q2 QTD gross margin at 78.4%, tracking 180bps below plan.",
    fluxCommentary: {
      Revenue: "SaaS subscription revenue grew 5.2% YoY but missed plan by $1.8M due to 3 Enterprise logo churns. Professional services revenue declined 8.7% as implementation timelines extended.",
      COGS: "Cloud infrastructure costs increased 14.3% QoQ — driven by compute scaling for new enterprise customers and migration costs. Customer success headcount grew ahead of revenue.",
      OpEx: "R&D spending increased 4.4% as headcount grew by 12 engineers. Sales & Marketing up 13.5% — pipeline investment for H2 ramp. G&A flat.",
    },
  },
};

// ─── HEALTHCARE ──────────────────────────────────────────────────

const HEALTHCARE: IndustryConfig = {
  id: "healthcare",
  label: "Healthcare",
  revenueTerm: "Net Patient Revenue",
  revenueShort: "NPR",
  currency: "USD",
  segments: ["Inpatient", "Outpatient", "Emergency", "Ambulatory"],
  regions: [
    {
      id: "national",
      label: "System-Wide",
      variance: "−$4.6M",
      varianceColor: "down",
      driver: "Payer Mix",
      driverDetail: "Medicaid shift ↑",
      signalTitle: "Predictive Signal — Payer Mix Deterioration",
      signalBody: "Medicaid patient volume up 18% — displacing commercial payer mix. Net revenue per patient day (NRPPD) declining across medical and surgical departments. Case Mix Index (CMI) stable but reimbursement rates compressing.",
      signalPositive: false,
      chartTitle: "Weekly Net Patient Revenue — Inpatient",
      chartBars: [
        { week: "W6", actual: 42, plan: 48 },
        { week: "W7", actual: 41, plan: 48 },
        { week: "W8", actual: 39, plan: 48 },
        { week: "W9", actual: 37, plan: 48 },
        { week: "W10", actual: 35, plan: 48 },
        { week: "W11▸", actual: 33, plan: 48, forecast: true },
      ],
      segments: [
        { rank: 1, name: "Inpatient — Medical", variance: "−$2.4M vs Plan", text: "Medicaid volume up 18%, displacing commercial patients. Average reimbursement per case dropped $420. CMI stable at 1.82 but payer mix shift driving NRPPD down 6.2%. Bed utilization at 94% — capacity constraint limiting commercial admits.", tags: [{ cls: "pill-red", label: "Payer mix shift" }, { cls: "pill-amber", label: "NRPPD decline" }, { cls: "pill-blue", label: "Capacity constraint" }] },
        { rank: 2, name: "Inpatient — Surgical", variance: "−$1.4M vs Plan", text: "Elective surgery volumes down 8% — patient deferrals and scheduling backlog. OR utilization at 71% vs 82% target. High-acuity cases stable but overall case volume below plan.", tags: [{ cls: "pill-red", label: "Volume decline" }, { cls: "pill-amber", label: "OR utilization low" }] },
        { rank: 3, name: "Emergency Department", variance: "+$0.6M vs Plan", text: "ED visits up 12% driven by flu season surge. Admission conversion rate improved to 28%. Average acuity higher, supporting revenue per visit despite longer wait times.", tags: [{ cls: "pill-green", label: "Volume surge" }, { cls: "pill-green", label: "Higher acuity" }] },
      ],
    },
    {
      id: "northeast",
      label: "Northeast Region",
      variance: "−$2.1M",
      varianceColor: "down",
      driver: "Surgical",
      driverDetail: "Elective deferrals ↑",
      signalTitle: "Northeast: Surgical Volume Weakness",
      signalBody: "Elective surgery deferrals accelerating. OR scheduling showing 15% cancellation rate — highest in 8 quarters. Patient satisfaction scores declining on wait times.",
      signalPositive: false,
      chartTitle: "Weekly Revenue — Northeast Inpatient",
      chartBars: [
        { week: "W6", actual: 18, plan: 22 },
        { week: "W7", actual: 17, plan: 22 },
        { week: "W8", actual: 16, plan: 22 },
        { week: "W9", actual: 15, plan: 22 },
        { week: "W10", actual: 14, plan: 22 },
        { week: "W11▸", actual: 14, plan: 22, forecast: true },
      ],
      segments: [
        { rank: 1, name: "NYC Metro Hospitals", variance: "−$1.2M vs Plan", text: "Medicaid conversion highest in system. Three competitor hospitals closed ED — receiving overflow but at lower reimbursement rates.", tags: [{ cls: "pill-red", label: "Payer mix" }, { cls: "pill-amber", label: "Competitor overflow" }] },
        { rank: 2, name: "Boston Academic Center", variance: "−$0.5M vs Plan", text: "Research grant revenue timing — Q1 grants arriving Q2. Clinical trial enrollment on track.", tags: [{ cls: "pill-amber", label: "Timing" }] },
      ],
    },
    {
      id: "southeast",
      label: "Southeast Region",
      variance: "+$0.3M",
      varianceColor: "up",
      driver: "Outpatient",
      driverDetail: "ASC volume ↑",
      signalTitle: "Southeast: Ambulatory Growth Positive",
      signalBody: "Ambulatory surgery center volumes exceeding plan by 14%. Shift from inpatient to outpatient procedures supporting margin improvement.",
      signalPositive: true,
      chartTitle: "Weekly Revenue — Southeast",
      chartBars: [
        { week: "W6", actual: 12, plan: 11 },
        { week: "W7", actual: 12, plan: 11 },
        { week: "W8", actual: 13, plan: 12 },
        { week: "W9", actual: 13, plan: 12 },
        { week: "W10", actual: 14, plan: 12 },
        { week: "W11▸", actual: 14, plan: 12, forecast: true },
      ],
      segments: [
        { rank: 1, name: "Atlanta ASC Network", variance: "+$0.4M vs Plan", text: "Orthopedic and ophthalmology procedures shifted to ASC — higher margin per case. Patient satisfaction scores up 8%.", tags: [{ cls: "pill-green", label: "ASC shift" }, { cls: "pill-green", label: "Margin ↑" }] },
        { rank: 2, name: "Florida Senior Care", variance: "−$0.1M vs Plan", text: "Medicare Advantage contract renegotiation in progress. Volume stable but reimbursement rates under pressure.", tags: [{ cls: "pill-amber", label: "Rate pressure" }] },
      ],
    },
  ],
  kpis: {
    metric1: { label: "Net Revenue Per Patient Day", value: "$2,840", delta: "▼ 6.2% vs prior Q", deltaDir: "down" },
    metric2: { label: "Case Mix Index", value: "1.82", delta: "Flat vs prior Q", deltaDir: "up" },
    metric3: { label: "Bed Utilization", value: "94%", delta: "▲ 3pp vs prior Q", deltaDir: "up" },
    metric4: { label: "OR Utilization", value: "71%", delta: "▼ 11pp vs target", deltaDir: "down" },
  },
  drivers: [
    { name: "Payer Mix Shift", impact: "−$2.8M", impactDir: "down", confidence: "high" },
    { name: "Surgical Volume Decline", impact: "−$1.4M", impactDir: "down", confidence: "high" },
    { name: "ED Volume Surge", impact: "+$0.6M", impactDir: "up", confidence: "medium" },
    { name: "ASC Shift", impact: "+$0.4M", impactDir: "up", confidence: "high" },
    { name: "Drug Cost Inflation", impact: "−$0.8M", impactDir: "down", confidence: "medium" },
  ],
  isLineItems: [
    { accountNumber: "4000", accountName: "Inpatient Revenue", currentValue: 82400, priorValue: 86800, category: "Revenue" },
    { accountNumber: "4100", accountName: "Outpatient Revenue", currentValue: 34200, priorValue: 31800, category: "Revenue" },
    { accountNumber: "4200", accountName: "Emergency Department Revenue", currentValue: 18600, priorValue: 17200, category: "Revenue" },
    { accountNumber: "4300", accountName: "Physician Services Revenue", currentValue: 12400, priorValue: 12800, category: "Revenue" },
    { accountNumber: "5000", accountName: "Salaries & Benefits", currentValue: 68200, priorValue: 64800, category: "COGS" },
    { accountNumber: "5100", accountName: "Supplies & Pharmaceuticals", currentValue: 28400, priorValue: 26200, category: "COGS" },
    { accountNumber: "6000", accountName: "Facility & Equipment", currentValue: 14200, priorValue: 13800, category: "OpEx" },
    { accountNumber: "6100", accountName: "Insurance & Compliance", currentValue: 8600, priorValue: 8200, category: "OpEx" },
  ],
  bsLineItems: [
    { accountNumber: "1000", accountName: "Cash & Investments", currentValue: 98000, priorValue: 102000, category: "Assets" },
    { accountNumber: "1100", accountName: "Patient Receivables", currentValue: 42800, priorValue: 38400, category: "Assets" },
    { accountNumber: "1800", accountName: "Property & Equipment", currentValue: 186000, priorValue: 182000, category: "Assets" },
    { accountNumber: "2200", accountName: "Deferred Grant Revenue", currentValue: 8400, priorValue: 6800, category: "Liabilities" },
    { accountNumber: "2300", accountName: "Accrued Salaries & Benefits", currentValue: 12400, priorValue: 11800, category: "Liabilities" },
  ],
  aiSuggestions: [
    "Why is NRPPD declining?",
    "What's driving the payer mix shift?",
    "Compare surgical volumes to prior 4 quarters",
    "Which departments are most affected by Medicaid?",
    "Show ED admission conversion trend",
  ],
  narratives: {
    headline: "Payer mix shift driving revenue miss — Medicaid volume up 18%, NRPPD down 6.2%. ED surge and ASC growth partially offset.",
    formFactorInsight: "Operating margin compressed 280bps WoW as payer mix shifted toward Medicaid (+18% volume). Inpatient NRPPD declined $420 per case day. Surgical volumes down 8% on elective deferrals — OR utilization at 71%. Pharmaceutical costs up 8.4% on specialty drug inflation. ASC shift providing margin relief in ambulatory segment at 22% operating margin vs 14% inpatient.",
    fluxCommentary: {
      Revenue: "Net patient revenue declined 3.8% QoQ driven by unfavorable payer mix shift. Medicaid patient days increased 18% while commercial declined 4%. Outpatient revenue grew 7.5% on ASC volume growth.",
      COGS: "Salaries & benefits increased 5.2% — nursing overtime and agency staffing costs elevated. Pharmaceuticals up 8.4% on specialty drug inflation and new oncology protocols.",
      OpEx: "Facility costs increased 2.9% — HVAC and equipment maintenance. Insurance premiums stable. Compliance costs up on new CMS reporting requirements.",
    },
  },
};

// ─── RETAIL ──────────────────────────────────────────────────────

const RETAIL: IndustryConfig = {
  id: "manufacturing",  // maps to "manufacturing" in Industry type (used as "Retail" display)
  label: "Retail",
  revenueTerm: "Net Sales",
  revenueShort: "Sales",
  currency: "USD",
  segments: ["Footwear", "Apparel", "Accessories", "Digital"],
  regions: [
    {
      id: "national",
      label: "Total Company",
      variance: "−$5.8M",
      varianceColor: "down",
      driver: "Traffic",
      driverDetail: "Store traffic ↓ 8%",
      signalTitle: "Predictive Signal — Traffic Decline Accelerating",
      signalBody: "Store traffic down 8% WoW, 3rd consecutive weekly decline. Comp store sales negative for first time in 6 quarters. Digital conversion rate improved 40bps but insufficient to offset physical store weakness. Footwear category showing resilience — Apparel driving 70% of the miss.",
      signalPositive: false,
      chartTitle: "Weekly Net Sales Variance — Apparel",
      chartBars: [
        { week: "W6", actual: 86, plan: 92 },
        { week: "W7", actual: 84, plan: 92 },
        { week: "W8", actual: 80, plan: 92 },
        { week: "W9", actual: 76, plan: 92 },
        { week: "W10", actual: 72, plan: 92 },
        { week: "W11▸", actual: 68, plan: 92, forecast: true },
      ],
      segments: [
        { rank: 1, name: "Apparel", variance: "−$4.1M vs Plan", text: "Comp store sales −6.2%. Traffic decline accelerated by weather (Northeast blizzard closed 180 stores for 2 days). Average Unit Retail (AUR) down 3% on aggressive markdowns. Inventory weeks-on-hand up to 14 from 11 target — clearance required.", tags: [{ cls: "pill-red", label: "Comp decline" }, { cls: "pill-red", label: "Markdown pressure" }, { cls: "pill-amber", label: "Inventory buildup" }] },
        { rank: 2, name: "Accessories", variance: "−$1.2M vs Plan", text: "Handbag category underperforming — consumer pullback on discretionary. Watch segment flat. Jewelry showing growth in $50-100 price band.", tags: [{ cls: "pill-red", label: "Discretionary weakness" }, { cls: "pill-amber", label: "Category mix" }] },
        { rank: 3, name: "Footwear", variance: "+$0.8M vs Plan", text: "Running and athletic categories outperforming plan. New product launches (3 SKUs) drove 22% of incremental sales. AUR stable — full-price selling rate at 68% vs 62% company average.", tags: [{ cls: "pill-green", label: "Category strength" }, { cls: "pill-green", label: "Full price selling" }] },
      ],
    },
    {
      id: "northeast",
      label: "Northeast",
      variance: "−$2.8M",
      varianceColor: "down",
      driver: "Weather",
      driverDetail: "Store closures ↑",
      signalTitle: "Northeast: Weather Impact Severe",
      signalBody: "Blizzard closed 180 stores for 48 hours. Lost selling days estimated at $1.8M. Post-storm traffic recovery slower than model predicted — footfall still 12% below normal after 5 days.",
      signalPositive: false,
      chartTitle: "Weekly Sales — Northeast Stores",
      chartBars: [
        { week: "W6", actual: 28, plan: 32 },
        { week: "W7", actual: 27, plan: 32 },
        { week: "W8", actual: 22, plan: 32 },
        { week: "W9", actual: 24, plan: 32 },
        { week: "W10", actual: 25, plan: 32 },
        { week: "W11▸", actual: 26, plan: 32, forecast: true },
      ],
      segments: [
        { rank: 1, name: "NYC Metro Stores", variance: "−$1.4M vs Plan", text: "180 store-days lost to blizzard. Post-storm traffic 12% below normal. Apparel clearance accelerated to move seasonal inventory. Digital pickup (BOPIS) up 34% as substitute.", tags: [{ cls: "pill-red", label: "Weather impact" }, { cls: "pill-amber", label: "Clearance" }] },
        { rank: 2, name: "Boston / New England", variance: "−$0.8M vs Plan", text: "Similar weather impact. Store recovery faster than NYC. Premium outlets performing better than malls.", tags: [{ cls: "pill-red", label: "Weather" }, { cls: "pill-green", label: "Outlet resilience" }] },
      ],
    },
    {
      id: "west",
      label: "West",
      variance: "+$0.4M",
      varianceColor: "up",
      driver: "Footwear",
      driverDetail: "Launch success ↑",
      signalTitle: "West: New Product Launch Driving Outperformance",
      signalBody: "Three new footwear SKUs launched in California and Pacific Northwest — sell-through rate at 82% vs 65% benchmark. Digital engagement driving in-store traffic via reserve-in-store feature.",
      signalPositive: true,
      chartTitle: "Weekly Sales — West Region",
      chartBars: [
        { week: "W6", actual: 22, plan: 21 },
        { week: "W7", actual: 23, plan: 21 },
        { week: "W8", actual: 24, plan: 22 },
        { week: "W9", actual: 24, plan: 22 },
        { week: "W10", actual: 25, plan: 22 },
        { week: "W11▸", actual: 25, plan: 22, forecast: true },
      ],
      segments: [
        { rank: 1, name: "California", variance: "+$0.3M vs Plan", text: "Footwear launch outperformance. Athletic category AUR up 8%. Digital-to-store conversion strong in LA and SF markets.", tags: [{ cls: "pill-green", label: "Launch success" }, { cls: "pill-green", label: "AUR ↑" }] },
        { rank: 2, name: "Pacific Northwest", variance: "+$0.1M vs Plan", text: "Outdoor category performing well. Basket size up 6% vs plan.", tags: [{ cls: "pill-green", label: "Basket size ↑" }] },
      ],
    },
  ],
  kpis: {
    metric1: { label: "Comp Store Sales", value: "−3.2%", delta: "▼ vs +1.4% prior Q", deltaDir: "down" },
    metric2: { label: "Average Unit Retail", value: "$47.80", delta: "▼ 3% vs plan", deltaDir: "down" },
    metric3: { label: "Basket Size", value: "$68.40", delta: "▲ 2% vs prior Q", deltaDir: "up" },
    metric4: { label: "Digital Mix", value: "28%", delta: "▲ 4pp vs prior Q", deltaDir: "up" },
  },
  drivers: [
    { name: "Store Traffic Decline", impact: "−$3.2M", impactDir: "down", confidence: "high" },
    { name: "Markdown Pressure", impact: "−$1.8M", impactDir: "down", confidence: "high" },
    { name: "Weather — Store Closures", impact: "−$1.8M", impactDir: "down", confidence: "high" },
    { name: "Footwear Launch", impact: "+$0.8M", impactDir: "up", confidence: "high" },
    { name: "Digital Growth", impact: "+$0.6M", impactDir: "up", confidence: "medium" },
  ],
  isLineItems: [
    { accountNumber: "4000", accountName: "Net Sales — Stores", currentValue: 186400, priorValue: 198200, category: "Revenue" },
    { accountNumber: "4100", accountName: "Net Sales — Digital", currentValue: 72800, priorValue: 64400, category: "Revenue" },
    { accountNumber: "4200", accountName: "Wholesale Revenue", currentValue: 18600, priorValue: 19200, category: "Revenue" },
    { accountNumber: "5000", accountName: "Cost of Goods Sold", currentValue: 148200, priorValue: 142800, category: "COGS" },
    { accountNumber: "5100", accountName: "Fulfillment & Logistics", currentValue: 22400, priorValue: 18600, category: "COGS" },
    { accountNumber: "6000", accountName: "Store Operations", currentValue: 42800, priorValue: 41200, category: "OpEx" },
    { accountNumber: "6100", accountName: "Marketing & Brand", currentValue: 18400, priorValue: 16800, category: "OpEx" },
    { accountNumber: "6200", accountName: "Corporate & Admin", currentValue: 12600, priorValue: 12200, category: "OpEx" },
  ],
  bsLineItems: [
    { accountNumber: "1000", accountName: "Cash & Equivalents", currentValue: 68000, priorValue: 82000, category: "Assets" },
    { accountNumber: "1100", accountName: "Accounts Receivable", currentValue: 14200, priorValue: 12800, category: "Assets" },
    { accountNumber: "1200", accountName: "Inventory", currentValue: 142000, priorValue: 128000, category: "Assets" },
    { accountNumber: "1800", accountName: "Store Leases (ROU)", currentValue: 286000, priorValue: 292000, category: "Assets" },
    { accountNumber: "2200", accountName: "Deferred Revenue — Gift Cards", currentValue: 18400, priorValue: 22600, category: "Liabilities" },
    { accountNumber: "2300", accountName: "Accrued Rent & Occupancy", currentValue: 24800, priorValue: 24200, category: "Liabilities" },
  ],
  aiSuggestions: [
    "Why are comp store sales negative?",
    "What's the weather impact on Northeast?",
    "Compare AUR trend by category",
    "Which stores should we close early for clearance?",
    "Show digital vs store sales mix trend",
  ],
  narratives: {
    headline: "Comp store sales negative — traffic down 8%, Apparel driving 70% of miss. Footwear launches and digital growth partially offset.",
    formFactorInsight: "Gross margin compressed 180bps WoW driven by aggressive markdowns in Apparel (clearance rate up to 38% from 28%). AUR declined 3% — full-price selling rate at 62%, down from 68% target. Footwear maintaining margin at 54% gross — new launches at 60%+ margin. Digital channel margin improving via lower fulfillment costs per order (-8% QoQ). Inventory turns slowing to 3.2x from 3.8x — weeks-on-hand at 14 vs 11 target.",
    fluxCommentary: {
      Revenue: "Net sales declined 6.3% QoQ — store revenue down 11.6% on traffic decline and weather disruptions. Digital grew 13.0% but insufficient to offset. Wholesale flat.",
      COGS: "COGS increased as a % of revenue due to markdown-driven AUR compression. Fulfillment costs up 20.4% on digital volume growth and expedited shipping for BOPIS orders.",
      OpEx: "Store ops costs increased 3.9% — higher security and maintenance costs. Marketing up 9.5% on digital acquisition spend. Corporate flat.",
    },
  },
};

// ─── Lookup ──────────────────────────────────────────────────────

const INDUSTRY_MAP: Record<Industry, IndustryConfig> = {
  technology: TECHNOLOGY,
  healthcare: HEALTHCARE,
  manufacturing: RETAIL,
};

/** Get the full industry data config for a given industry */
export function getIndustryConfig(industry: Industry): IndustryConfig {
  return INDUSTRY_MAP[industry];
}

/** Get all available industry configs */
export function getAllIndustryConfigs(): IndustryConfig[] {
  return [TECHNOLOGY, HEALTHCARE, RETAIL];
}
