/**
 * Industry-specific data for the Form Factor (Margin Intelligence) page.
 *
 * Each industry provides weekly margin/revenue/cost data per segment,
 * bridge waterfalls, actual-vs-forecast breakdowns, driver decompositions,
 * AI chat responses, and contextual suggestions.
 */

import type { Industry } from "@/lib/persona-context";

// ─── Shared types (mirrors form-factor page.tsx interfaces) ────────

export interface WeekData {
  w: string;
  rev: number;
  cost: number;
  margin: number;
  fcst: number;
}

export interface BridgeItem {
  l: string;
  v: number;
  t: "base" | "pos" | "neg";
}

export interface AvfRow {
  dim: string;
  ra: number;
  rf: number;
  ma: number;
  mf: number;
  c: "High" | "Medium" | "Low";
}

export interface DrvRow {
  g: string;
  price: number;
  mix: number;
  vol: number;
  cost: number;
  conf: "ph" | "pm" | "pl";
  proxy: string | false;
}

export interface FormFactorIndustryData {
  segments: string[];
  weeklyData: Record<string, WeekData[]>;
  trendYRange: Record<string, { min: number; max: number }>;
  trendNarr: Record<string, { head: string; body: string }>;
  bridgeBase: BridgeItem[];
  avf: Record<string, AvfRow[]>;
  avfHeaders: Record<string, string>;
  avfNarr: Record<string, { head: string; body: string }>;
  drvData: Record<
    string,
    {
      bridge: BridgeItem[];
      seg: { price: number[]; mix: number[]; volume: number[]; cost: number[] };
      narr: string;
    }
  >;
  drvHeads: Record<string, string>;
  drvRows: Record<string, DrvRow[]>;
  aiResponses: Record<string, string>;
  suggestions: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════════
//  TECHNOLOGY
// ═══════════════════════════════════════════════════════════════════

const TECH_SEGMENTS = ["All Segments", "North America", "APAC", "EMEA", "LatAm"];

const TECH_WEEKLY: Record<string, WeekData[]> = {
  "All Segments": [
    { w: "W1", rev: 48.2, cost: 33.1, margin: 31.3, fcst: 32.0 },
    { w: "W2", rev: 50.1, cost: 34.2, margin: 31.7, fcst: 32.2 },
    { w: "W3", rev: 49.3, cost: 33.6, margin: 31.8, fcst: 32.4 },
    { w: "W4", rev: 52.8, cost: 35.9, margin: 32.0, fcst: 32.5 },
    { w: "W5", rev: 54.1, cost: 36.5, margin: 32.5, fcst: 32.6 },
    { w: "W6", rev: 53.6, cost: 36.0, margin: 32.8, fcst: 32.7 },
    { w: "W7", rev: 54.9, cost: 37.0, margin: 32.6, fcst: 32.8 },
    { w: "W8", rev: 57.2, cost: 39.3, margin: 31.3, fcst: 33.4 },
  ],
  "North America": [
    { w: "W1", rev: 18.4, cost: 11.7, margin: 36.4, fcst: 36.8 },
    { w: "W2", rev: 19.2, cost: 12.1, margin: 37.0, fcst: 37.0 },
    { w: "W3", rev: 18.9, cost: 11.9, margin: 37.0, fcst: 37.2 },
    { w: "W4", rev: 20.1, cost: 12.6, margin: 37.3, fcst: 37.3 },
    { w: "W5", rev: 20.8, cost: 13.0, margin: 37.5, fcst: 37.4 },
    { w: "W6", rev: 20.4, cost: 12.7, margin: 37.7, fcst: 37.5 },
    { w: "W7", rev: 21.1, cost: 13.2, margin: 37.4, fcst: 37.6 },
    { w: "W8", rev: 22.1, cost: 14.1, margin: 36.2, fcst: 37.8 },
  ],
  APAC: [
    { w: "W1", rev: 14.6, cost: 10.9, margin: 25.3, fcst: 27.0 },
    { w: "W2", rev: 15.3, cost: 11.3, margin: 26.1, fcst: 27.2 },
    { w: "W3", rev: 14.9, cost: 11.1, margin: 25.5, fcst: 27.5 },
    { w: "W4", rev: 16.2, cost: 11.9, margin: 26.5, fcst: 27.8 },
    { w: "W5", rev: 17.1, cost: 12.4, margin: 27.5, fcst: 28.0 },
    { w: "W6", rev: 16.4, cost: 12.2, margin: 25.6, fcst: 28.1 },
    { w: "W7", rev: 16.8, cost: 12.7, margin: 24.4, fcst: 28.3 },
    { w: "W8", rev: 18.4, cost: 13.6, margin: 26.1, fcst: 28.5 },
  ],
  EMEA: [
    { w: "W1", rev: 10.4, cost: 6.9, margin: 33.7, fcst: 33.2 },
    { w: "W2", rev: 10.8, cost: 7.1, margin: 34.3, fcst: 33.4 },
    { w: "W3", rev: 10.6, cost: 7.0, margin: 34.0, fcst: 33.5 },
    { w: "W4", rev: 11.4, cost: 7.4, margin: 35.1, fcst: 33.7 },
    { w: "W5", rev: 11.1, cost: 7.2, margin: 35.1, fcst: 33.8 },
    { w: "W6", rev: 11.3, cost: 7.3, margin: 35.4, fcst: 33.9 },
    { w: "W7", rev: 11.7, cost: 7.6, margin: 35.0, fcst: 34.0 },
    { w: "W8", rev: 11.3, cost: 7.5, margin: 33.8, fcst: 34.2 },
  ],
  LatAm: [
    { w: "W1", rev: 4.8, cost: 3.4, margin: 29.2, fcst: 30.5 },
    { w: "W2", rev: 4.8, cost: 3.4, margin: 29.2, fcst: 30.5 },
    { w: "W3", rev: 4.9, cost: 3.5, margin: 28.6, fcst: 30.6 },
    { w: "W4", rev: 5.1, cost: 3.7, margin: 27.5, fcst: 30.7 },
    { w: "W5", rev: 5.1, cost: 3.6, margin: 29.4, fcst: 30.8 },
    { w: "W6", rev: 5.5, cost: 3.8, margin: 30.9, fcst: 30.9 },
    { w: "W7", rev: 5.3, cost: 3.7, margin: 30.2, fcst: 31.0 },
    { w: "W8", rev: 5.4, cost: 3.8, margin: 29.4, fcst: 31.2 },
  ],
};

const TECH_YRANGE: Record<string, { min: number; max: number }> = {
  "All Segments": { min: 30, max: 34 },
  "North America": { min: 34, max: 40 },
  APAC: { min: 23, max: 30 },
  EMEA: { min: 31, max: 37 },
  LatAm: { min: 26, max: 33 },
};

const TECH_TREND_NARR: Record<string, { head: string; body: string }> = {
  "All Segments": {
    head: "Revenue grew +4.2% WoW in W8, but blended standard margin compressed 130bps \u2014 APAC mix shift and Group B cost pressure are the culprits.",
    body: 'Q2 QTD margin stands at <strong>31.4%</strong>, tracking <strong>90bps below plan</strong>. Revenue growth has been consistent W1\u2013W8 (+18.7% cumulative) but cost is growing faster, compressing the margin line. W6 was the quarter margin peak at <strong>32.8%</strong>. W8 dip is partly a mix story \u2014 APAC volume grew disproportionately this week.',
  },
  "North America": {
    head: "NA delivered its strongest revenue week at $22.1M in W8, but margin pulled back 120bps from W7\u2019s peak of 37.4% \u2014 a one-time freight accrual adjustment inflated cost.",
    body: 'NA is the highest-margin segment at <strong>36\u201338% range</strong> and has grown revenue steadily through Q2. <strong>W5\u2013W6 were the margin high watermark</strong>. The W8 dip to <strong>36.2%</strong> is primarily cost-driven (freight accrual, not structural). Excluding the accrual, underlying margin would be ~<strong>37.1%</strong> \u2014 above forecast. NA is tracking ahead of Q2 plan on revenue.',
  },
  APAC: {
    head: "APAC margin recovered slightly in W8 (+170bps WoW) after the W7 trough at 24.4%, but remains 240bps below forecast. Volume growth is real; cost data is partially proxy-estimated.",
    body: 'APAC is the <strong>lowest-margin segment</strong> in the portfolio at 25\u201327% range, and the most volatile week-to-week. <strong>W5 was the quarter high at 27.5%</strong> before a two-week deterioration. Standard cost for <strong>6 SKUs</strong> is still proxy-estimated via v2.3 \u2014 actual cost may be worse than reported. APAC revenue growth (+26% W1\u2192W8) is outpacing all other segments, which is compressing blended margin.',
  },
  EMEA: {
    head: "EMEA posted a steady improvement arc through W6 (quarter high: 35.4%), then softened in W7\u2013W8. A single large Professional Services deal in W8 accounts for most of the dip.",
    body: '<strong>EMEA is the most consistent performer</strong> \u2014 margin held in the 33\u201335% band all quarter with no sharp swings. The W8 softening to <strong>33.8%</strong> is almost entirely explained by one PS deal at <strong>~28% margin</strong> that closed late in the week. Excluding that deal, EMEA underlying margin was <strong>35.1%</strong> \u2014 above forecast. EMEA is on track to beat Q2 plan if the PS deal is treated as non-recurring.',
  },
  LatAm: {
    head: "LatAm margin is volatile week-to-week due to small revenue base ($4.8\u20135.5M range) and high proxy dependency. W6 was the quarter high at 30.9%; W8 tracking near Q2 average.",
    body: 'LatAm is the <strong>smallest segment</strong> and has the <strong>highest proxy dependency</strong> (~60% of cost base is Proxy v2.3 estimated). This means WoW swings in margin % can be misleading \u2014 small absolute shifts in proxy assumptions move the % significantly. <strong>W4 was the quarter low at 27.5%</strong> before recovering. Treat LatAm margin data as directional only until EDW feed is confirmed.',
  },
};

const TECH_BRIDGE: BridgeItem[] = [
  { l: "Prior W7", v: 17.93, t: "base" },
  { l: "Volume", v: 2.3, t: "pos" },
  { l: "Mix", v: -1.8, t: "neg" },
  { l: "Price", v: 0.1, t: "pos" },
  { l: "Cost", v: -0.6, t: "neg" },
  { l: "W8 Act.", v: 17.93, t: "base" },
];

const TECH_AVF: Record<string, AvfRow[]> = {
  product: [
    { dim: "Group A \u2014 Enterprise SW", ra: 18.4, rf: 17.8, ma: 38.2, mf: 38.0, c: "High" },
    { dim: "Group B \u2014 Infrastructure", ra: 22.1, rf: 23.5, ma: 27.4, mf: 30.1, c: "Medium" },
    { dim: "Group C \u2014 Professional Svcs", ra: 11.3, rf: 11.0, ma: 33.8, mf: 33.5, c: "High" },
    { dim: "Group D \u2014 Managed Svcs", ra: 5.4, rf: 5.7, ma: 22.1, mf: 24.0, c: "Low" },
  ],
  customer: [
    { dim: "Enterprise Tier 1", ra: 28.3, rf: 26.8, ma: 37.8, mf: 37.2, c: "High" },
    { dim: "Enterprise Tier 2", ra: 15.6, rf: 16.4, ma: 32.1, mf: 33.0, c: "High" },
    { dim: "Mid-Market", ra: 9.4, rf: 10.2, ma: 26.3, mf: 28.4, c: "Medium" },
    { dim: "SMB / Channel", ra: 3.9, rf: 4.8, ma: 19.6, mf: 22.1, c: "Low" },
  ],
  segment: [
    { dim: "North America", ra: 22.1, rf: 22.5, ma: 36.2, mf: 37.8, c: "High" },
    { dim: "APAC", ra: 18.4, rf: 19.3, ma: 26.1, mf: 28.5, c: "Medium" },
    { dim: "EMEA", ra: 11.3, rf: 11.1, ma: 33.8, mf: 34.2, c: "High" },
    { dim: "LatAm", ra: 5.4, rf: 5.8, ma: 29.4, mf: 31.2, c: "Low" },
  ],
};

const TECH_AVF_HEADERS: Record<string, string> = {
  product: "Product Group",
  customer: "Customer Group",
  segment: "Market Segment",
};

const TECH_AVF_NARR: Record<string, { head: string; body: string }> = {
  product: {
    head: "Group B \u2014 Infrastructure is the primary miss: \u2013$1.4M revenue and \u2013270bps margin vs plan. Group A beat on both lines; Group D data is unconfirmed.",
    body: '<strong>Group A \u2014 Enterprise SW</strong> delivered $18.4M actual vs $17.8M forecast (+$0.6M) with margin at 38.2% \u2014 tracking ahead of plan. <strong>Group B \u2014 Infrastructure</strong> missed revenue by $1.4M and margin is 270bps below forecast; proxy cost data for 4 SKUs limits confidence in the margin figure. <strong>Group C \u2014 Professional Services</strong> is broadly on-plan. <strong>Group D \u2014 Managed Services</strong> shows zero variance because W8 actuals have not yet been confirmed \u2014 Low confidence, proxy forward-fill applied.',
  },
  customer: {
    head: "Enterprise Tier 1 beat forecast by +$1.5M revenue and held margin near plan. Mid-Market and SMB are both below on revenue and margin \u2014 the largest gap is SMB at \u2013250bps vs plan.",
    body: '<strong>Enterprise Tier 1</strong> ($28.3M actual vs $26.8M forecast) is the standout performer this week \u2014 volume came in ahead and margin held at 37.8% (+60bps vs plan). <strong>Enterprise Tier 2</strong> missed revenue by $0.8M with margin 90bps below forecast. <strong>Mid-Market</strong> is \u2013$0.8M on revenue and \u2013210bps on margin, consistent with a shift toward lower-ASP deals. <strong>SMB / Channel</strong> shows the steepest margin miss at \u2013250bps \u2014 channel mix shifted toward lower-margin reseller accounts in W8.',
  },
  segment: {
    head: "APAC shows the widest forecast gap: \u2013240bps margin and \u2013$0.9M revenue miss. EMEA is the only segment beating forecast on margin (+70bps). NA missed margin despite beating on revenue.",
    body: '<strong>North America</strong> grew revenue to $22.1M (vs $22.5M forecast, \u2013$0.4M) but margin came in at 36.2% vs 37.8% forecast \u2014 the 160bps gap is primarily the W8 freight accrual. <strong>APAC</strong> missed both revenue (\u2013$0.9M) and margin (\u2013240bps) \u2014 the largest absolute forecast gap in the portfolio. <strong>EMEA</strong> beat margin forecast by 70bps at 33.8% vs 34.2% plan, though a PS deal explains most of the revenue shortfall. <strong>LatAm</strong> carries Low confidence throughout \u2014 proxy estimates dominate the cost base.',
  },
};

const TECH_DRV_DATA: Record<string, { bridge: BridgeItem[]; seg: { price: number[]; mix: number[]; volume: number[]; cost: number[] }; narr: string }> = {
  "All Segments": {
    bridge: [
      { l: "Prior W7", v: 17.93, t: "base" },
      { l: "Volume", v: 2.3, t: "pos" },
      { l: "Mix", v: -1.8, t: "neg" },
      { l: "Price", v: 0.1, t: "pos" },
      { l: "Cost", v: -0.6, t: "neg" },
      { l: "W8 Act.", v: 17.93, t: "base" },
    ],
    seg: { price: [0.2, -0.1, -0.1, 0.0], mix: [-0.4, -0.9, -0.5, 0.0], volume: [1.1, 0.7, 0.5, 0.0], cost: [-0.1, -0.4, -0.1, 0.0] },
    narr: "W8 margin compressed \u2013$1.8M vs. W7 \u2014 mix shift is the dominant headwind. Volume growth solid but skewed to lower-margin APAC and Infrastructure.",
  },
  "North America": {
    bridge: [
      { l: "Prior W7", v: 7.88, t: "base" },
      { l: "Volume", v: 1.1, t: "pos" },
      { l: "Price", v: 0.2, t: "pos" },
      { l: "Mix", v: -0.4, t: "neg" },
      { l: "Cost", v: -0.68, t: "neg" },
      { l: "W8 Act.", v: 8.0, t: "base" },
    ],
    seg: { price: [0.2, 0.0, 0.0, 0.0], mix: [-0.4, 0.0, 0.0, 0.0], volume: [1.1, 0.0, 0.0, 0.0], cost: [-0.68, 0.0, 0.0, 0.0] },
    narr: "NA margin dipped 120bps in W8 despite strong volume. A one-time freight accrual hit cost by $0.7M; underlying margin trajectory remains healthy.",
  },
  APAC: {
    bridge: [
      { l: "Prior W7", v: 4.11, t: "base" },
      { l: "Volume", v: 0.7, t: "pos" },
      { l: "Mix", v: -0.9, t: "neg" },
      { l: "Cost", v: -0.4, t: "neg" },
      { l: "Price", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 4.8, t: "base" },
    ],
    seg: { price: [0.0, -0.1, 0.0, 0.0], mix: [0.0, -0.9, 0.0, 0.0], volume: [0.0, 0.7, 0.0, 0.0], cost: [0.0, -0.4, 0.0, 0.0] },
    narr: "APAC is the primary margin drag \u2014 mix shifted heavily toward low-margin Infrastructure SKUs. Proxy cost model covers 38% of APAC volume; real cost may be worse than reported.",
  },
  EMEA: {
    bridge: [
      { l: "Prior W7", v: 4.1, t: "base" },
      { l: "Volume", v: 0.5, t: "pos" },
      { l: "Mix", v: -0.5, t: "neg" },
      { l: "Price", v: -0.1, t: "neg" },
      { l: "Cost", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 3.82, t: "base" },
    ],
    seg: { price: [0.0, 0.0, -0.1, 0.0], mix: [0.0, 0.0, -0.5, 0.0], volume: [0.0, 0.0, 0.5, 0.0], cost: [0.0, 0.0, -0.1, 0.0] },
    narr: "EMEA W8 softened due to a single large Professional Services deal at 28% margin. Excluding this deal, EMEA underlying margin held at 35.1%.",
  },
  LatAm: {
    bridge: [
      { l: "Prior W7", v: 1.6, t: "base" },
      { l: "Volume", v: 0.1, t: "pos" },
      { l: "Mix", v: 0.0, t: "pos" },
      { l: "Price", v: 0.0, t: "pos" },
      { l: "Cost", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 1.59, t: "base" },
    ],
    seg: { price: [0.0, 0.0, 0.0, 0.0], mix: [0.0, 0.0, 0.0, 0.0], volume: [0.0, 0.0, 0.0, 0.1], cost: [0.0, 0.0, 0.0, -0.1] },
    narr: "LatAm margin broadly flat. Low volume means small dollar impacts. Cost data is largely proxy-estimated \u2014 treat with low confidence until EDW feed confirmed.",
  },
};

const TECH_DRV_HEADS: Record<string, string> = {
  "All Segments": "W8 blended margin compressed \u2013$1.8M vs. W7 \u2014 mix shift across APAC and Infrastructure is the dominant headwind.",
  "North America": "NA margin pulled back 120bps in W8 despite strong volume growth. A one-time freight accrual drove the cost line.",
  APAC: "APAC shows the sharpest mix headwind \u2014 Infrastructure SKU growth diluted margin by \u2013$0.9M. Proxy cost data for 6 SKUs limits confidence.",
  EMEA: "EMEA W8 softened on a single large low-margin Professional Services deal. Excluding that deal, underlying margin held at 35.1%.",
  LatAm: "LatAm drivers broadly flat dollar-for-dollar. Low volume means small absolute impacts; proxy dependency limits actionability.",
};

const TECH_DRV_ROWS: Record<string, DrvRow[]> = {
  "All Segments": [
    { g: "Group A \u2014 Enterprise SW", price: 0.2, mix: -0.4, vol: 1.1, cost: -0.1, conf: "ph", proxy: false },
    { g: "Group B \u2014 Infrastructure", price: 0.0, mix: -0.9, vol: 0.7, cost: -0.4, conf: "pm", proxy: "Cost via Proxy v2.3 \u2014 standard cost unavailable for 4 SKUs" },
    { g: "Group C \u2014 Professional Svcs", price: -0.1, mix: -0.5, vol: 0.5, cost: -0.1, conf: "ph", proxy: false },
    { g: "Group D \u2014 Managed Svcs", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No W8 actuals \u2014 proxy forward-fill applied" },
  ],
  "North America": [
    { g: "Enterprise SW \u2014 NA", price: 0.2, mix: -0.2, vol: 0.8, cost: -0.5, conf: "ph", proxy: false },
    { g: "Infrastructure \u2014 NA", price: 0.0, mix: -0.2, vol: 0.3, cost: -0.2, conf: "ph", proxy: false },
    { g: "Prof. Services \u2014 NA", price: 0.0, mix: 0.0, vol: 0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Managed Services \u2014 NA", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pm", proxy: "Partial actuals" },
  ],
  APAC: [
    { g: "Enterprise SW \u2014 APAC", price: -0.1, mix: -0.3, vol: 0.3, cost: -0.1, conf: "pm", proxy: false },
    { g: "Infrastructure \u2014 APAC", price: 0.0, mix: -0.5, vol: 0.4, cost: -0.3, conf: "pm", proxy: "Proxy v2.3 \u2014 6 SKUs" },
    { g: "Prof. Services \u2014 APAC", price: 0.0, mix: -0.1, vol: 0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Managed Services \u2014 APAC", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No confirmed actuals" },
  ],
  EMEA: [
    { g: "Enterprise SW \u2014 EMEA", price: 0.0, mix: 0.1, vol: 0.3, cost: 0.0, conf: "ph", proxy: false },
    { g: "Infrastructure \u2014 EMEA", price: -0.1, mix: -0.1, vol: 0.1, cost: -0.1, conf: "ph", proxy: false },
    { g: "Prof. Services \u2014 EMEA", price: 0.0, mix: -0.5, vol: 0.2, cost: 0.0, conf: "ph", proxy: "Large PS deal at 28% margin" },
    { g: "Managed Services \u2014 EMEA", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pm", proxy: false },
  ],
  LatAm: [
    { g: "Enterprise SW \u2014 LatAm", price: 0.0, mix: 0.0, vol: 0.1, cost: 0.0, conf: "pm", proxy: false },
    { g: "Infrastructure \u2014 LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: -0.1, conf: "pl", proxy: "Proxy cost \u2014 limited coverage" },
    { g: "Prof. Services \u2014 LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No actuals \u2014 fwd-fill" },
    { g: "Managed Services \u2014 LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No actuals" },
  ],
};

const TECH_AI: Record<string, string> = {
  "margin compress": 'W8 blended standard margin compressed <strong>130bps</strong> to <strong>31.3%</strong> from W7\u2019s 32.6%. The primary driver is an unfavorable <strong>mix shift of \u2013$1.8M</strong> \u2014 APAC volume grew disproportionately this week, pulling the blended margin down. Volume was strong at +$2.3M, but it skewed toward lower-margin Infrastructure SKUs. A secondary <strong>cost headwind of \u2013$0.6M</strong> persists, largely proxy-estimated for Product Group B. Price realization held flat at +$0.1M.',
  apac: 'APAC is the <strong>lowest-margin segment</strong> in the portfolio at <strong>26.1%</strong> in W8 (vs 28.5% forecast \u2014 a <strong>240bps miss</strong>). It recovered slightly from the W7 trough of 24.4%, but remains volatile. Revenue grew strongly (+26% W1\u2192W8) to <strong>$18.4M</strong>, but cost data for <strong>6 SKUs is proxy-estimated</strong> via v2.3 \u2014 actual cost may be worse than reported.',
  "north america": 'North America delivered its <strong>strongest revenue week at $22.1M</strong> in W8, but margin pulled back <strong>120bps</strong> from W7\u2019s peak of 37.4% to <strong>36.2%</strong>. The dip is primarily cost-driven \u2014 a one-time <strong>freight accrual adjustment</strong> inflated cost by ~$0.7M. Excluding the accrual, underlying margin would be ~<strong>37.1%</strong>, above forecast.',
  emea: 'EMEA posted a steady improvement arc through W6 (quarter high: <strong>35.4%</strong>), then softened in W7\u2013W8. The W8 margin of <strong>33.8%</strong> is almost entirely explained by one large Professional Services deal at <strong>~28% margin</strong> that closed late in the week.',
  forecast: 'Q2 QTD standard margin stands at <strong>31.4%</strong>, tracking <strong>90bps below Q2 plan</strong>. The forward forecast projects: <strong>Q2 remaining: 32.1%</strong> (High confidence), <strong>Q3: 33.6%</strong> (Medium), <strong>Q4: 34.8%</strong> (Low). The Q2 exit rate needs to recover ~90bps to hit plan.',
  "cost driver": 'The four margin drivers in W8 vs W7: <strong>Volume +$2.3M</strong> (positive), <strong>Mix \u2013$1.8M</strong> (negative \u2014 shift toward lower-margin APAC and Infrastructure SKUs), <strong>Price +$0.1M</strong> (flat), <strong>Cost \u2013$0.6M</strong> (negative \u2014 proxy-estimated for Group B). The <strong>mix shift is the dominant headwind</strong>.',
  risk: 'Key risks to monitor for W9:<br><br>1. <strong>APAC proxy data</strong> \u2014 6 SKUs still on Proxy v2.3. Actual costs may be worse.<br>2. <strong>Group B cost uncertainty</strong> \u2014 4 SKUs lack standard cost data.<br>3. <strong>Mix normalization</strong> \u2014 If APAC volume stays elevated, blended margin will stay compressed.<br>4. <strong>LatAm proxy dependency</strong> \u2014 ~60% of cost base is estimated.',
  proxy: 'Proxy v2.3 is the cost estimation model used when standard cost data is unavailable. Coverage:<br><br>\u2022 <strong>APAC</strong>: 6 SKUs on proxy (38% of volume) \u2014 84% accuracy<br>\u2022 <strong>LatAm</strong>: ~60% of cost base proxy-estimated \u2014 76% accuracy<br>\u2022 <strong>Group B Infrastructure</strong>: 4 SKUs lack standard cost<br>\u2022 <strong>Group D Managed Svcs</strong>: No W8 actuals, forward-fill applied',
  "group b infrastructure": 'Group B \u2014 Infrastructure is the <strong>primary forecast miss</strong> in W8: <strong>\u2013$1.4M revenue</strong> and <strong>\u2013270bps margin</strong> vs plan. Margin came in at 27.4% vs 30.1% forecast. 4 SKUs lack standard cost data and use Proxy v2.3 estimates.',
  "peak best high": 'The quarter margin peak was <strong>W6 at 32.8%</strong> for All Segments. By segment: NA peaked at <strong>37.7% in W6</strong>, APAC at <strong>27.5% in W5</strong>, EMEA at <strong>35.4% in W6</strong>, and LatAm at <strong>30.9% in W6</strong>.',
  "recover scenario gap": 'To recover the <strong>90bps gap</strong> to Q2 plan, three scenarios:<br><br>1. <strong>Base case</strong> (60%): Mix normalizes. Exit Q2 at ~32.1%. Gap narrows to ~50bps.<br>2. <strong>Bull case</strong> (25%): APAC proxy costs confirmed lower. Could exit at ~33.0%.<br>3. <strong>Bear case</strong> (15%): Proxy underestimates persist. Exit at ~31.0%, gap widens to ~150bps.',
};

const TECH_SUGGESTIONS: Record<string, string[]> = {
  exec: ["Why did margin compress in W8?", "Which segment is most at risk?", "What should we watch for W9?"],
  trend: ["Show APAC trend analysis", "When was margin peak this quarter?", "Is the compression accelerating?"],
  actfcst: ["Which product group missed forecast most?", "Why is Group B underperforming?", "Is Group D data reliable?"],
  drivers: ["What is the biggest margin headwind?", "Explain the mix shift impact", "Is the cost pressure structural?"],
  compare: ["How did margin change W7 to W8?", "Which week was best this quarter?"],
  forward: ["What is the Q2 exit rate forecast?", "Can we recover the margin gap?", "What scenarios should we plan for?"],
};

const TECHNOLOGY_DATA: FormFactorIndustryData = {
  segments: TECH_SEGMENTS,
  weeklyData: TECH_WEEKLY,
  trendYRange: TECH_YRANGE,
  trendNarr: TECH_TREND_NARR,
  bridgeBase: TECH_BRIDGE,
  avf: TECH_AVF,
  avfHeaders: TECH_AVF_HEADERS,
  avfNarr: TECH_AVF_NARR,
  drvData: TECH_DRV_DATA,
  drvHeads: TECH_DRV_HEADS,
  drvRows: TECH_DRV_ROWS,
  aiResponses: TECH_AI,
  suggestions: TECH_SUGGESTIONS,
};

// ═══════════════════════════════════════════════════════════════════
//  HEALTHCARE
// ═══════════════════════════════════════════════════════════════════

const HC_SEGMENTS = ["All Departments", "Inpatient", "Outpatient", "Emergency", "Ambulatory"];

// Helper: margin = (rev - cost) / rev * 100, rounded to 1 decimal
const HC_WEEKLY: Record<string, WeekData[]> = {
  "All Departments": [
    { w: "W1", rev: 84.2, cost: 70.1, margin: 16.7, fcst: 17.0 },
    { w: "W2", rev: 85.6, cost: 71.0, margin: 17.1, fcst: 17.1 },
    { w: "W3", rev: 83.8, cost: 69.8, margin: 16.7, fcst: 17.2 },
    { w: "W4", rev: 86.4, cost: 71.8, margin: 16.9, fcst: 17.3 },
    { w: "W5", rev: 87.1, cost: 72.0, margin: 17.3, fcst: 17.4 },
    { w: "W6", rev: 86.3, cost: 71.2, margin: 17.5, fcst: 17.4 },
    { w: "W7", rev: 85.8, cost: 71.4, margin: 16.8, fcst: 17.5 },
    { w: "W8", rev: 82.4, cost: 70.6, margin: 14.3, fcst: 17.1 },
  ],
  Inpatient: [
    { w: "W1", rev: 38.6, cost: 32.8, margin: 15.0, fcst: 15.4 },
    { w: "W2", rev: 39.2, cost: 33.1, margin: 15.6, fcst: 15.5 },
    { w: "W3", rev: 38.0, cost: 32.4, margin: 14.7, fcst: 15.6 },
    { w: "W4", rev: 39.8, cost: 33.5, margin: 15.8, fcst: 15.7 },
    { w: "W5", rev: 40.2, cost: 33.7, margin: 16.2, fcst: 15.8 },
    { w: "W6", rev: 39.4, cost: 33.2, margin: 15.7, fcst: 15.8 },
    { w: "W7", rev: 38.8, cost: 33.0, margin: 14.9, fcst: 15.9 },
    { w: "W8", rev: 36.4, cost: 32.2, margin: 11.5, fcst: 15.4 },
  ],
  Outpatient: [
    { w: "W1", rev: 22.4, cost: 18.2, margin: 18.8, fcst: 19.2 },
    { w: "W2", rev: 23.0, cost: 18.6, margin: 19.1, fcst: 19.3 },
    { w: "W3", rev: 22.8, cost: 18.4, margin: 19.3, fcst: 19.4 },
    { w: "W4", rev: 23.4, cost: 18.8, margin: 19.7, fcst: 19.5 },
    { w: "W5", rev: 23.8, cost: 19.0, margin: 20.2, fcst: 19.6 },
    { w: "W6", rev: 24.1, cost: 19.1, margin: 20.7, fcst: 19.7 },
    { w: "W7", rev: 24.4, cost: 19.4, margin: 20.5, fcst: 19.8 },
    { w: "W8", rev: 24.8, cost: 19.6, margin: 21.0, fcst: 19.9 },
  ],
  Emergency: [
    { w: "W1", rev: 14.8, cost: 12.2, margin: 17.6, fcst: 17.0 },
    { w: "W2", rev: 15.0, cost: 12.3, margin: 18.0, fcst: 17.1 },
    { w: "W3", rev: 14.6, cost: 12.1, margin: 17.1, fcst: 17.2 },
    { w: "W4", rev: 15.2, cost: 12.5, margin: 17.8, fcst: 17.2 },
    { w: "W5", rev: 14.9, cost: 12.3, margin: 17.4, fcst: 17.3 },
    { w: "W6", rev: 14.6, cost: 12.0, margin: 17.8, fcst: 17.3 },
    { w: "W7", rev: 14.4, cost: 12.0, margin: 16.7, fcst: 17.4 },
    { w: "W8", rev: 13.8, cost: 11.8, margin: 14.5, fcst: 17.0 },
  ],
  Ambulatory: [
    { w: "W1", rev: 8.4, cost: 6.9, margin: 17.9, fcst: 18.5 },
    { w: "W2", rev: 8.4, cost: 6.9, margin: 17.9, fcst: 18.6 },
    { w: "W3", rev: 8.4, cost: 6.9, margin: 17.9, fcst: 18.7 },
    { w: "W4", rev: 8.0, cost: 6.6, margin: 17.5, fcst: 18.8 },
    { w: "W5", rev: 8.2, cost: 6.7, margin: 18.3, fcst: 18.9 },
    { w: "W6", rev: 8.2, cost: 6.6, margin: 19.5, fcst: 19.0 },
    { w: "W7", rev: 8.2, cost: 6.7, margin: 18.3, fcst: 19.0 },
    { w: "W8", rev: 7.4, cost: 6.3, margin: 14.9, fcst: 18.5 },
  ],
};

const HC_YRANGE: Record<string, { min: number; max: number }> = {
  "All Departments": { min: 13, max: 19 },
  Inpatient: { min: 10, max: 18 },
  Outpatient: { min: 17, max: 22 },
  Emergency: { min: 13, max: 20 },
  Ambulatory: { min: 13, max: 21 },
};

const HC_TREND_NARR: Record<string, { head: string; body: string }> = {
  "All Departments": {
    head: "Operating margin compressed 280bps WoW in W8 to 14.3% \u2014 payer mix shift toward Medicaid, surgical volume decline, and pharmaceutical cost inflation converged.",
    body: 'Q2 QTD operating margin stands at <strong>16.2%</strong>, tracking <strong>110bps below plan</strong>. W6 was the quarter peak at <strong>17.5%</strong>. The W8 deterioration is multi-factorial: Medicaid volume up 18% displacing commercial patients, elective surgical deferrals reducing high-margin cases, and specialty drug costs surging. <strong>Outpatient is the bright spot</strong> with margin improving to 21.0%.',
  },
  Inpatient: {
    head: "Inpatient margin collapsed 340bps in W8 to 11.5% \u2014 the lowest level in 12 weeks. Payer mix is the primary driver as Medicaid admissions surged.",
    body: '<strong>Inpatient is the largest department</strong> at $36\u201340M weekly revenue and carries the heaviest fixed-cost base. The W8 drop to <strong>11.5%</strong> reflects a <strong>Medicaid patient day increase of 18%</strong>, displacing commercial payers who reimburse $420 more per case day. Bed utilization at <strong>94%</strong> means there is no capacity to add commercial volume \u2014 the payer mix shift is structurally locked in at current occupancy. CMI held at 1.82.',
  },
  Outpatient: {
    head: "Outpatient is the strongest-performing department \u2014 margin improved steadily from 18.8% in W1 to 21.0% in W8, beating forecast every week since W3.",
    body: 'The ASC (Ambulatory Surgery Center) shift strategy is working: <strong>orthopedic and ophthalmology procedures</strong> moved from inpatient to outpatient settings are delivering <strong>22% operating margins</strong> vs 14% inpatient. Patient throughput increased 11% W1\u2192W8. Supply cost per case is 18% lower in outpatient settings. <strong>This is the margin recovery lever</strong> for the health system.',
  },
  Emergency: {
    head: "ED margin declined 220bps in W8 to 14.5% after holding in the 17\u201318% range through W1\u2013W6. Post-flu season volume drop hit fixed-cost absorption.",
    body: 'The ED operates with a <strong>high fixed-cost base</strong> (staffing, readiness). Through W1\u2013W6, flu season drove higher volumes that supported margin. As volumes normalized, <strong>fixed costs spread over fewer visits</strong> compressed margin. W8 visits were 7% below W6 peak. Additionally, <strong>2 unfunded transfers</strong> from competitor ED closures added cost without corresponding revenue. The W8 number may be a trough \u2014 seasonal normalization suggests recovery to ~16.5% by W10.',
  },
  Ambulatory: {
    head: "Ambulatory margin dropped 340bps in W8 to 14.9% after peaking at 19.5% in W6. A one-time equipment maintenance charge and scheduling gaps drove the dip.",
    body: 'Ambulatory clinics are the <strong>smallest revenue contributor</strong> at $7\u20138M weekly, making margin % sensitive to small cost swings. The W8 drop to <strong>14.9%</strong> reflects a <strong>$0.3M equipment maintenance accrual</strong> and two clinic scheduling gaps from staff PTO. Excluding one-time items, underlying margin would be ~<strong>17.8%</strong>. Ambulatory has the best <strong>trajectory potential</strong> as the system shifts more procedures to lower-cost-of-care settings.',
  },
};

const HC_BRIDGE: BridgeItem[] = [
  { l: "Prior W7", v: 14.42, t: "base" },
  { l: "Payer Mix", v: -2.1, t: "neg" },
  { l: "Volume", v: -0.9, t: "neg" },
  { l: "Supply Cost", v: -0.6, t: "neg" },
  { l: "Efficiency", v: 0.8, t: "pos" },
  { l: "W8 Act.", v: 11.78, t: "base" },
];

const HC_AVF: Record<string, AvfRow[]> = {
  service: [
    { dim: "Inpatient \u2014 Medical", ra: 22.8, rf: 24.6, ma: 12.4, mf: 15.8, c: "High" },
    { dim: "Inpatient \u2014 Surgical", ra: 13.6, rf: 15.2, ma: 10.2, mf: 14.6, c: "High" },
    { dim: "Outpatient \u2014 Procedural", ra: 18.4, rf: 17.8, ma: 22.1, mf: 20.8, c: "High" },
    { dim: "Emergency / Urgent Care", ra: 13.8, rf: 14.2, ma: 14.5, mf: 17.0, c: "Medium" },
  ],
  payer: [
    { dim: "Commercial / PPO", ra: 28.2, rf: 30.8, ma: 22.4, mf: 22.1, c: "High" },
    { dim: "Medicare", ra: 24.6, rf: 24.2, ma: 12.8, mf: 13.2, c: "High" },
    { dim: "Medicaid", ra: 21.4, rf: 18.1, ma: 4.2, mf: 5.8, c: "Medium" },
    { dim: "Self-Pay / Uninsured", ra: 8.2, rf: 8.4, ma: -2.8, mf: -1.4, c: "Low" },
  ],
  department: [
    { dim: "Medical / Hospitalist", ra: 26.4, rf: 27.8, ma: 13.6, mf: 15.4, c: "High" },
    { dim: "Surgical / Perioperative", ra: 22.1, rf: 24.0, ma: 10.8, mf: 14.2, c: "High" },
    { dim: "Emergency Medicine", ra: 13.8, rf: 14.2, ma: 14.5, mf: 17.0, c: "Medium" },
    { dim: "Ambulatory / Clinic", ra: 7.4, rf: 7.8, ma: 14.9, mf: 18.5, c: "Low" },
  ],
};

const HC_AVF_HEADERS: Record<string, string> = {
  service: "Service Line",
  payer: "Payer Class",
  department: "Department",
};

const HC_AVF_NARR: Record<string, { head: string; body: string }> = {
  service: {
    head: "Inpatient Surgical is the primary miss: \u2013$1.6M revenue and \u2013440bps margin vs plan. Outpatient Procedural beat on both lines.",
    body: '<strong>Inpatient Medical</strong> missed revenue by $1.8M as Medicaid volume displaced commercial patients, compressing margin 340bps below plan. <strong>Inpatient Surgical</strong> is the largest margin gap at 440bps \u2014 elective deferrals reduced high-margin OR cases by 8%. <strong>Outpatient Procedural</strong> beat forecast by $0.6M and 130bps margin \u2014 the ASC shift strategy is delivering. <strong>Emergency</strong> missed margin by 250bps on post-flu volume decline.',
  },
  payer: {
    head: "Medicaid volume exceeded forecast by 18%, displacing Commercial patients and compressing blended margin. Self-Pay losses widened.",
    body: '<strong>Commercial / PPO</strong> revenue missed by $2.6M as patients were displaced by Medicaid admissions at capacity-constrained facilities. Margin held near plan at 22.4%. <strong>Medicare</strong> performed close to forecast. <strong>Medicaid</strong> volume surged $3.3M above forecast but at only 4.2% margin \u2014 each Medicaid case day reimburses $420 less than Commercial. <strong>Self-Pay</strong> losses widened to \u20132.8% margin, driven by 3 uncompensated transfers.',
  },
  department: {
    head: "Surgical/Perioperative shows the widest gap: \u2013340bps margin and \u2013$1.9M revenue miss. Ambulatory margin drop driven by one-time maintenance accrual.",
    body: '<strong>Medical/Hospitalist</strong> missed revenue by $1.4M with margin 180bps below plan \u2014 the payer mix shift hits this department hardest. <strong>Surgical/Perioperative</strong> has the widest absolute gap at \u2013340bps due to elective surgery deferrals and OR utilization at 71%. <strong>Emergency Medicine</strong> margin compressed 250bps on lower volumes. <strong>Ambulatory/Clinic</strong> carries Low confidence \u2014 equipment accrual distorts the W8 figure.',
  },
};

const HC_DRV_DATA: Record<string, { bridge: BridgeItem[]; seg: { price: number[]; mix: number[]; volume: number[]; cost: number[] }; narr: string }> = {
  "All Departments": {
    bridge: [
      { l: "Prior W7", v: 14.42, t: "base" },
      { l: "Payer Mix", v: -2.1, t: "neg" },
      { l: "Volume", v: -0.9, t: "neg" },
      { l: "Supply Cost", v: -0.6, t: "neg" },
      { l: "Efficiency", v: 0.8, t: "pos" },
      { l: "W8 Act.", v: 11.78, t: "base" },
    ],
    seg: { price: [-1.2, -0.4, -0.3, -0.2], mix: [-0.6, -0.3, -0.1, 0.0], volume: [-0.5, -0.2, -0.1, -0.1], cost: [0.3, 0.2, 0.2, 0.1] },
    narr: "W8 operating margin compressed \u2013$2.6M vs. W7 \u2014 payer mix shift is the dominant headwind. Medicaid volume surge displaced commercial patients across Inpatient departments.",
  },
  Inpatient: {
    bridge: [
      { l: "Prior W7", v: 5.78, t: "base" },
      { l: "Payer Mix", v: -1.6, t: "neg" },
      { l: "Volume", v: -0.5, t: "neg" },
      { l: "Drug Cost", v: -0.4, t: "neg" },
      { l: "LOS Efficiency", v: 0.3, t: "pos" },
      { l: "W8 Act.", v: 4.19, t: "base" },
    ],
    seg: { price: [-1.6, 0.0, 0.0, 0.0], mix: [-0.5, 0.0, 0.0, 0.0], volume: [-0.4, 0.0, 0.0, 0.0], cost: [0.3, 0.0, 0.0, 0.0] },
    narr: "Inpatient margin collapsed 340bps \u2014 Medicaid payer mix shift is the primary driver. Bed utilization at 94% limits the ability to add commercial volume to offset.",
  },
  Outpatient: {
    bridge: [
      { l: "Prior W7", v: 5.00, t: "base" },
      { l: "ASC Volume", v: 0.4, t: "pos" },
      { l: "Procedure Mix", v: 0.2, t: "pos" },
      { l: "Supply Cost", v: -0.1, t: "neg" },
      { l: "Staffing", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 5.21, t: "base" },
    ],
    seg: { price: [0.0, 0.0, 0.2, 0.0], mix: [0.0, 0.0, 0.2, 0.0], volume: [0.0, 0.0, 0.4, 0.0], cost: [0.0, 0.0, -0.1, 0.0] },
    narr: "Outpatient continues to improve \u2014 ASC shift strategy delivering higher margin per procedure. Orthopedic and ophthalmology volumes drove the gain.",
  },
  Emergency: {
    bridge: [
      { l: "Prior W7", v: 2.40, t: "base" },
      { l: "Volume", v: -0.4, t: "neg" },
      { l: "Acuity Mix", v: -0.2, t: "neg" },
      { l: "Staffing", v: -0.1, t: "neg" },
      { l: "Throughput", v: 0.1, t: "pos" },
      { l: "W8 Act.", v: 2.00, t: "base" },
    ],
    seg: { price: [0.0, 0.0, 0.0, -0.2], mix: [0.0, 0.0, 0.0, -0.2], volume: [0.0, 0.0, 0.0, -0.4], cost: [0.0, 0.0, 0.0, 0.1] },
    narr: "ED margin down 220bps as post-flu season volume normalized. High fixed-cost base means lower volumes compress margin quickly. Two unfunded transfers added cost pressure.",
  },
  Ambulatory: {
    bridge: [
      { l: "Prior W7", v: 1.50, t: "base" },
      { l: "Equipment", v: -0.3, t: "neg" },
      { l: "Scheduling", v: -0.2, t: "neg" },
      { l: "Patient Mix", v: 0.1, t: "pos" },
      { l: "Throughput", v: 0.1, t: "pos" },
      { l: "W8 Act.", v: 1.10, t: "base" },
    ],
    seg: { price: [0.0, 0.0, 0.0, 0.1], mix: [0.0, 0.0, 0.0, 0.1], volume: [0.0, 0.0, 0.0, -0.2], cost: [0.0, 0.0, 0.0, -0.3] },
    narr: "Ambulatory margin dropped on a one-time equipment maintenance accrual ($0.3M) and scheduling gaps. Underlying margin excluding one-time items would be ~17.8%.",
  },
};

const HC_DRV_HEADS: Record<string, string> = {
  "All Departments": "W8 operating margin compressed \u2013$2.6M vs. W7 \u2014 payer mix shift toward Medicaid is the dominant headwind across all departments.",
  Inpatient: "Inpatient margin collapsed 340bps \u2014 Medicaid payer mix and surgical deferrals are the primary drivers. Bed utilization at 94% limits recovery.",
  Outpatient: "Outpatient is the only department improving \u2014 ASC shift strategy driving margin to 21.0%, 110bps above forecast.",
  Emergency: "ED margin down 220bps on post-flu season volume decline. High fixed costs magnify the impact of lower volumes.",
  Ambulatory: "Ambulatory margin drop is largely one-time (equipment accrual). Underlying trajectory remains positive.",
};

const HC_DRV_ROWS: Record<string, DrvRow[]> = {
  "All Departments": [
    { g: "Inpatient \u2014 Medical", price: -1.2, mix: -0.6, vol: -0.5, cost: 0.3, conf: "ph", proxy: false },
    { g: "Inpatient \u2014 Surgical", price: -0.4, mix: -0.3, vol: -0.2, cost: 0.2, conf: "ph", proxy: false },
    { g: "Outpatient \u2014 Procedural", price: -0.3, mix: 0.2, vol: 0.4, cost: -0.1, conf: "ph", proxy: false },
    { g: "Emergency Department", price: -0.2, mix: -0.2, vol: -0.4, cost: 0.1, conf: "pm", proxy: "2 unfunded transfers \u2014 cost allocated by estimate" },
  ],
  Inpatient: [
    { g: "Medical \u2014 Commercial", price: -0.3, mix: -0.8, vol: -0.2, cost: 0.1, conf: "ph", proxy: false },
    { g: "Medical \u2014 Medicaid", price: -0.6, mix: 0.2, vol: 0.4, cost: -0.1, conf: "ph", proxy: false },
    { g: "Surgical \u2014 Elective", price: -0.2, mix: -0.3, vol: -0.5, cost: 0.1, conf: "ph", proxy: false },
    { g: "Surgical \u2014 Emergency", price: 0.0, mix: 0.0, vol: 0.1, cost: 0.0, conf: "pm", proxy: "Case mix complexity coding pending" },
  ],
  Outpatient: [
    { g: "Orthopedic ASC", price: 0.1, mix: 0.2, vol: 0.3, cost: 0.0, conf: "ph", proxy: false },
    { g: "Ophthalmology ASC", price: 0.0, mix: 0.1, vol: 0.2, cost: 0.0, conf: "ph", proxy: false },
    { g: "GI / Endoscopy", price: -0.1, mix: 0.0, vol: 0.1, cost: -0.1, conf: "ph", proxy: false },
    { g: "Imaging / Diagnostics", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pm", proxy: "Equipment depreciation reallocation pending" },
  ],
  Emergency: [
    { g: "Trauma / Critical", price: 0.0, mix: -0.1, vol: -0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Acute / Moderate", price: -0.1, mix: -0.1, vol: -0.2, cost: 0.0, conf: "ph", proxy: false },
    { g: "Low Acuity / Fast Track", price: -0.1, mix: 0.0, vol: -0.1, cost: 0.0, conf: "pm", proxy: false },
    { g: "Transfer / Observation", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.1, conf: "pl", proxy: "2 unfunded transfers \u2014 cost estimated" },
  ],
  Ambulatory: [
    { g: "Primary Care Clinics", price: 0.0, mix: 0.0, vol: -0.1, cost: -0.1, conf: "pm", proxy: false },
    { g: "Specialty Clinics", price: 0.1, mix: 0.1, vol: 0.0, cost: 0.0, conf: "ph", proxy: false },
    { g: "Urgent Care", price: 0.0, mix: 0.0, vol: -0.1, cost: 0.0, conf: "pm", proxy: false },
    { g: "Rehab / PT", price: 0.0, mix: 0.0, vol: 0.0, cost: -0.2, conf: "pl", proxy: "Equipment maintenance accrual \u2014 $0.3M one-time" },
  ],
};

const HC_AI: Record<string, string> = {
  "margin compress": 'W8 operating margin compressed <strong>280bps</strong> to <strong>14.3%</strong> from W7\u2019s 16.8%. The primary driver is <strong>payer mix shift (\u2013$2.1M)</strong> as Medicaid volume surged 18%, displacing higher-reimbursement commercial patients. <strong>Surgical volume decline (\u2013$0.9M)</strong> from elective deferrals and <strong>pharmaceutical cost inflation (\u2013$0.6M)</strong> compounded the pressure. Outpatient efficiency gains (+$0.8M) partially offset.',
  payer: 'The <strong>Medicaid patient day increase of 18%</strong> is the single largest margin headwind. Each Medicaid case day reimburses <strong>$420 less</strong> than Commercial. With bed utilization at <strong>94%</strong>, there is no spare capacity to add Commercial volume \u2014 Medicaid patients are structurally displacing higher-margin admits. Commercial revenue missed plan by <strong>$2.6M</strong>. Self-Pay losses widened to \u20132.8% margin.',
  inpatient: 'Inpatient margin collapsed to <strong>11.5%</strong> in W8 \u2014 the lowest in 12 weeks. <strong>340bps below W7</strong> and <strong>390bps below forecast</strong>. The Medical sub-department was hit hardest by payer mix shift. Surgical volumes declined 8% on elective deferrals \u2014 OR utilization at <strong>71%</strong> vs 82% target. CMI held stable at 1.82, so acuity is not the issue \u2014 it is purely a <strong>payer composition and volume problem</strong>.',
  outpatient: 'Outpatient is the <strong>bright spot</strong> \u2014 margin improved to <strong>21.0%</strong> in W8, the highest level this quarter and <strong>110bps above forecast</strong>. The ASC shift strategy is working: orthopedic and ophthalmology procedures deliver <strong>22% operating margins</strong> in outpatient vs 14% in inpatient settings. Patient throughput up 11%. This is the <strong>primary margin recovery lever</strong>.',
  emergency: 'ED margin declined to <strong>14.5%</strong> in W8, down 220bps from W7. The flu season volume surge that supported margin through W1\u2013W6 has normalized. The ED has a <strong>high fixed-cost base</strong> (staffing, readiness) that compresses margin quickly when volume drops. Additionally, <strong>2 unfunded transfers</strong> from competitor ED closures added cost without revenue.',
  forecast: 'Q2 QTD operating margin is <strong>16.2%</strong>, tracking <strong>110bps below plan</strong>. Forward projections: <strong>Q2 remaining: 15.8%</strong> (High confidence), <strong>Q3: 16.4%</strong> (Medium), <strong>Q4: 17.2%</strong> (Low). Recovery depends on Medicaid volume stabilization and continued ASC shift execution. The payer mix headwind may persist through Q3.',
  "cost drug": 'Pharmaceutical costs increased <strong>8.4% QoQ</strong> driven by specialty drug inflation \u2014 primarily oncology and immunology protocols. <strong>Supply cost per surgical case</strong> is up 3.2%. Nursing overtime and agency staffing costs elevated due to bed utilization at 94%. Total salary & benefits expense grew 5.2% vs revenue growth of only 1.8%.',
  "risk watch": 'Key risks for W9\u2013W10:<br><br>1. <strong>Medicaid volume persistence</strong> \u2014 if the 18% surge is structural (not seasonal), margin recovery timeline extends.<br>2. <strong>Surgical deferrals</strong> \u2014 cancellation rate at 15%, highest in 8 quarters. Patient satisfaction declining on wait times.<br>3. <strong>Drug cost inflation</strong> \u2014 specialty drug costs showing no signs of abating.<br>4. <strong>Staffing pressure</strong> \u2014 nursing overtime at elevated levels due to high occupancy.',
  surgical: 'Elective surgical volumes are down <strong>8%</strong> with a <strong>15% cancellation rate</strong> \u2014 the highest in 8 quarters. OR utilization at <strong>71%</strong> vs 82% target. High-acuity emergency cases are stable, but the elective decline removes the highest-margin procedures. <strong>Patient satisfaction scores</strong> on wait times are declining, which may further suppress demand.',
  asc: 'The ASC (Ambulatory Surgery Center) shift is the most effective margin lever. Outpatient procedures deliver <strong>22% operating margins</strong> vs 14% inpatient. Orthopedic and ophthalmology volumes shifted to ASC are running <strong>14% above plan</strong>. Patient satisfaction up 8%. Supply cost per case is <strong>18% lower</strong> in outpatient settings. Recommend accelerating the shift for eligible procedures.',
};

const HC_SUGGESTIONS: Record<string, string[]> = {
  exec: ["Why did operating margin compress in W8?", "What is driving the payer mix shift?", "Which department should we focus on?"],
  trend: ["Show Inpatient margin trend", "When was operating margin peak?", "Is the Medicaid shift accelerating?"],
  actfcst: ["Which service line missed forecast most?", "How is the ASC shift performing?", "What is the payer mix vs plan?"],
  drivers: ["What is the biggest margin headwind?", "Explain the Medicaid impact", "Is the drug cost pressure structural?"],
  compare: ["How did margin change W7 to W8?", "Compare Inpatient vs Outpatient trajectory"],
  forward: ["What is the Q2 exit rate forecast?", "Can we recover the margin gap?", "What levers do we have?"],
};

const HEALTHCARE_DATA: FormFactorIndustryData = {
  segments: HC_SEGMENTS,
  weeklyData: HC_WEEKLY,
  trendYRange: HC_YRANGE,
  trendNarr: HC_TREND_NARR,
  bridgeBase: HC_BRIDGE,
  avf: HC_AVF,
  avfHeaders: HC_AVF_HEADERS,
  avfNarr: HC_AVF_NARR,
  drvData: HC_DRV_DATA,
  drvHeads: HC_DRV_HEADS,
  drvRows: HC_DRV_ROWS,
  aiResponses: HC_AI,
  suggestions: HC_SUGGESTIONS,
};

// ═══════════════════════════════════════════════════════════════════
//  RETAIL (Industry type = "manufacturing")
// ═══════════════════════════════════════════════════════════════════

const RT_SEGMENTS = ["All Channels", "Stores", "Digital", "Wholesale", "Outlets"];

const RT_WEEKLY: Record<string, WeekData[]> = {
  "All Channels": [
    { w: "W1", rev: 192.4, cost: 155.2, margin: 19.3, fcst: 21.0 },
    { w: "W2", rev: 194.8, cost: 156.4, margin: 19.7, fcst: 21.1 },
    { w: "W3", rev: 190.6, cost: 154.0, margin: 19.2, fcst: 21.2 },
    { w: "W4", rev: 196.2, cost: 157.8, margin: 19.6, fcst: 21.3 },
    { w: "W5", rev: 198.1, cost: 158.2, margin: 20.1, fcst: 21.4 },
    { w: "W6", rev: 195.4, cost: 155.8, margin: 20.3, fcst: 21.4 },
    { w: "W7", rev: 193.8, cost: 155.4, margin: 19.8, fcst: 21.5 },
    { w: "W8", rev: 186.2, cost: 152.6, margin: 18.0, fcst: 21.0 },
  ],
  Stores: [
    { w: "W1", rev: 118.4, cost: 96.2, margin: 18.8, fcst: 20.4 },
    { w: "W2", rev: 119.8, cost: 96.8, margin: 19.2, fcst: 20.5 },
    { w: "W3", rev: 116.2, cost: 94.6, margin: 18.6, fcst: 20.6 },
    { w: "W4", rev: 120.4, cost: 97.2, margin: 19.3, fcst: 20.7 },
    { w: "W5", rev: 121.6, cost: 97.6, margin: 19.7, fcst: 20.8 },
    { w: "W6", rev: 118.8, cost: 95.8, margin: 19.4, fcst: 20.8 },
    { w: "W7", rev: 116.2, cost: 94.4, margin: 18.8, fcst: 20.9 },
    { w: "W8", rev: 108.6, cost: 90.8, margin: 16.4, fcst: 20.4 },
  ],
  Digital: [
    { w: "W1", rev: 42.8, cost: 33.4, margin: 22.0, fcst: 22.8 },
    { w: "W2", rev: 43.6, cost: 33.8, margin: 22.5, fcst: 22.9 },
    { w: "W3", rev: 43.2, cost: 33.4, margin: 22.7, fcst: 23.0 },
    { w: "W4", rev: 44.8, cost: 34.4, margin: 23.2, fcst: 23.1 },
    { w: "W5", rev: 45.6, cost: 34.8, margin: 23.7, fcst: 23.2 },
    { w: "W6", rev: 46.2, cost: 35.2, margin: 23.8, fcst: 23.3 },
    { w: "W7", rev: 47.4, cost: 36.0, margin: 24.1, fcst: 23.4 },
    { w: "W8", rev: 48.2, cost: 36.6, margin: 24.1, fcst: 23.5 },
  ],
  Wholesale: [
    { w: "W1", rev: 18.6, cost: 15.2, margin: 18.3, fcst: 19.2 },
    { w: "W2", rev: 18.8, cost: 15.4, margin: 18.1, fcst: 19.2 },
    { w: "W3", rev: 18.4, cost: 15.2, margin: 17.4, fcst: 19.3 },
    { w: "W4", rev: 18.6, cost: 15.2, margin: 18.3, fcst: 19.3 },
    { w: "W5", rev: 18.4, cost: 15.0, margin: 18.5, fcst: 19.4 },
    { w: "W6", rev: 18.2, cost: 14.8, margin: 18.7, fcst: 19.4 },
    { w: "W7", rev: 18.0, cost: 14.8, margin: 17.8, fcst: 19.5 },
    { w: "W8", rev: 17.6, cost: 14.6, margin: 17.0, fcst: 19.2 },
  ],
  Outlets: [
    { w: "W1", rev: 12.6, cost: 10.4, margin: 17.5, fcst: 18.8 },
    { w: "W2", rev: 12.6, cost: 10.4, margin: 17.5, fcst: 18.8 },
    { w: "W3", rev: 12.8, cost: 10.6, margin: 17.2, fcst: 18.9 },
    { w: "W4", rev: 12.4, cost: 10.2, margin: 17.7, fcst: 19.0 },
    { w: "W5", rev: 12.5, cost: 10.2, margin: 18.4, fcst: 19.0 },
    { w: "W6", rev: 12.2, cost: 10.0, margin: 18.0, fcst: 19.1 },
    { w: "W7", rev: 12.2, cost: 10.2, margin: 16.4, fcst: 19.1 },
    { w: "W8", rev: 11.8, cost: 10.0, margin: 15.3, fcst: 18.8 },
  ],
};

const RT_YRANGE: Record<string, { min: number; max: number }> = {
  "All Channels": { min: 16, max: 23 },
  Stores: { min: 14, max: 22 },
  Digital: { min: 20, max: 26 },
  Wholesale: { min: 15, max: 21 },
  Outlets: { min: 13, max: 21 },
};

const RT_TREND_NARR: Record<string, { head: string; body: string }> = {
  "All Channels": {
    head: "Gross margin compressed 180bps WoW in W8 to 18.0% \u2014 aggressive Apparel markdowns, AUR decline, and store traffic drop converged.",
    body: 'Q2 QTD gross margin stands at <strong>19.5%</strong>, tracking <strong>170bps below plan</strong>. W6 was the quarter peak at <strong>20.3%</strong>. Revenue dropped $7.6M WoW (\u20133.9%) \u2014 the sharpest weekly decline this quarter. Stores channel accounts for 80% of the miss. <strong>Digital is the bright spot</strong> \u2014 the only channel with improving margins, now at 24.1%. Inventory weeks-on-hand at 14 vs 11 target signals more clearance ahead.',
  },
  Stores: {
    head: "Store margin collapsed 240bps in W8 to 16.4% \u2014 traffic down 8%, AUR declining 3%, and comp store sales negative for the first time in 6 quarters.",
    body: '<strong>Stores is the largest channel</strong> at $108\u2013121M weekly revenue and drives the blended margin story. W8 traffic declined <strong>8% WoW</strong> \u2014 the 3rd consecutive weekly drop. <strong>Apparel markdowns</strong> accelerated: clearance rate up to 38% from 28%, pulling AUR down 3%. Full-price selling rate at <strong>62%</strong> vs 68% target. Northeast weather impact (180 store closures) exacerbated the decline. <strong>Footwear</strong> remains the bright spot in stores with 54% gross margin.',
  },
  Digital: {
    head: "Digital is the only channel improving \u2014 margin climbed from 22.0% in W1 to 24.1% in W8, beating forecast every week since W4.",
    body: 'Digital revenue grew <strong>12.6% W1\u2192W8</strong> to $48.2M, now representing <strong>26%</strong> of total sales (up from 22% at Q2 start). Conversion rate improved <strong>40bps</strong>. Fulfillment cost per order declined 8% QoQ as DC throughput optimization took effect. <strong>BOPIS (Buy Online Pick Up In Store)</strong> orders up 34% \u2014 these carry higher margin than ship-to-home. The digital channel is the <strong>primary margin recovery lever</strong>.',
  },
  Wholesale: {
    head: "Wholesale margin softened to 17.0% in W8, down 80bps from W7. Department store sell-through slowing as retail partners increase promotional activity.",
    body: 'Wholesale is a <strong>steady but lower-margin channel</strong> at $17\u201319M weekly. W8 saw the steepest decline this quarter as key retail partners (Nordstrom, Macy\u2019s) pulled forward promotional events, putting pressure on wholesale pricing. <strong>Off-price channel</strong> mix increased to 22% from 18% \u2014 this carries 14% margin vs 20% full-price wholesale. Brand perception risk if off-price exposure continues to grow.',
  },
  Outlets: {
    head: "Outlet margin dropped 110bps to 15.3% in W8. Traffic decline hitting outlet malls harder than flagship stores as consumer trips consolidated to fewer shopping occasions.",
    body: 'Outlets are the <strong>smallest and lowest-margin channel</strong> at $11\u201313M weekly. The W8 drop reflects a broader <strong>consumer pullback on discretionary spending</strong> at outlet locations. Outlet-specific product (made-for-outlet) is performing better than markdowns-to-outlet at <strong>18% vs 12% margin</strong>. <strong>W5 was the quarter peak at 18.4%</strong> before the deterioration. Outlet closures may be warranted for 3\u20134 underperforming locations.',
  },
};

const RT_BRIDGE: BridgeItem[] = [
  { l: "Prior W7", v: 38.40, t: "base" },
  { l: "Traffic", v: -4.2, t: "neg" },
  { l: "AUR / Mkdn", v: -2.8, t: "neg" },
  { l: "Digital", v: 1.6, t: "pos" },
  { l: "Shrink", v: -0.6, t: "neg" },
  { l: "W8 Act.", v: 33.54, t: "base" },
];

const RT_AVF: Record<string, AvfRow[]> = {
  category: [
    { dim: "Footwear", ra: 52.4, rf: 50.8, ma: 24.6, mf: 24.2, c: "High" },
    { dim: "Apparel", ra: 78.2, rf: 86.4, ma: 14.2, mf: 19.8, c: "High" },
    { dim: "Accessories", ra: 32.8, rf: 35.2, ma: 18.4, mf: 20.6, c: "Medium" },
    { dim: "Digital-Only SKUs", ra: 22.8, rf: 21.4, ma: 26.2, mf: 25.0, c: "High" },
  ],
  channel: [
    { dim: "Stores \u2014 Full Price", ra: 82.4, rf: 92.6, ma: 19.2, mf: 22.4, c: "High" },
    { dim: "Digital \u2014 DTC", ra: 48.2, rf: 46.8, ma: 24.1, mf: 23.5, c: "High" },
    { dim: "Wholesale \u2014 Dept Stores", ra: 17.6, rf: 18.4, ma: 17.0, mf: 19.2, c: "Medium" },
    { dim: "Outlets / Off-Price", ra: 11.8, rf: 12.6, ma: 15.3, mf: 18.8, c: "Low" },
  ],
  region: [
    { dim: "Northeast", ra: 48.6, rf: 54.2, ma: 15.8, mf: 20.6, c: "High" },
    { dim: "Southeast", ra: 42.4, rf: 43.8, ma: 19.4, mf: 21.2, c: "High" },
    { dim: "West", ra: 56.8, rf: 55.4, ma: 20.2, mf: 21.0, c: "High" },
    { dim: "Midwest", ra: 38.4, rf: 40.2, ma: 16.8, mf: 20.4, c: "Medium" },
  ],
};

const RT_AVF_HEADERS: Record<string, string> = {
  category: "Product Category",
  channel: "Sales Channel",
  region: "Region",
};

const RT_AVF_NARR: Record<string, { head: string; body: string }> = {
  category: {
    head: "Apparel is the primary miss: \u2013$8.2M revenue and \u2013560bps margin vs plan. Footwear beat on both lines; Digital-Only SKUs outperformed.",
    body: '<strong>Footwear</strong> beat forecast by $1.6M with margin at 24.6% (+40bps vs plan) \u2014 new launches drove 22% of incremental sales at 60%+ margin. <strong>Apparel</strong> is the largest drag: \u2013$8.2M revenue with margin collapsing to 14.2% vs 19.8% plan (\u2013560bps). Clearance rate up to 38%. <strong>Accessories</strong> missed by $2.4M on consumer discretionary pullback. <strong>Digital-Only SKUs</strong> continue to outperform with 26.2% margin \u2014 exclusive product strategy working.',
  },
  channel: {
    head: "Stores \u2013 Full Price missed by $10.2M revenue and 320bps margin. Digital DTC beat on both lines and is the growth engine.",
    body: '<strong>Stores</strong> missed revenue by $10.2M \u2014 traffic decline (-8%), AUR compression (-3%), and weather closures converged. Margin at 19.2% vs 22.4% plan. <strong>Digital DTC</strong> beat forecast by $1.4M with margin at 24.1% vs 23.5% plan \u2014 fulfillment cost per order declining. <strong>Wholesale</strong> missed by $0.8M as department store sell-through slowed. <strong>Outlets</strong> carry Low confidence \u2014 clearance markdown depth increasing.',
  },
  region: {
    head: "Northeast shows the widest gap: \u2013480bps margin and \u2013$5.6M revenue miss (weather impact). West is the only region near plan.",
    body: '<strong>Northeast</strong> was hit hardest \u2014 blizzard closed 180 stores for 48 hours, estimated $1.8M in lost sales. Post-storm traffic still 12% below normal. <strong>Southeast</strong> missed modestly on general traffic softness but outlet performance held up. <strong>West</strong> is near plan \u2014 footwear launches in California and Pacific Northwest drove outperformance. <strong>Midwest</strong> missed by $1.8M as extreme cold reduced mall traffic.',
  },
};

const RT_DRV_DATA: Record<string, { bridge: BridgeItem[]; seg: { price: number[]; mix: number[]; volume: number[]; cost: number[] }; narr: string }> = {
  "All Channels": {
    bridge: [
      { l: "Prior W7", v: 38.40, t: "base" },
      { l: "Traffic", v: -4.2, t: "neg" },
      { l: "AUR / Mkdn", v: -2.8, t: "neg" },
      { l: "Digital", v: 1.6, t: "pos" },
      { l: "Shrink", v: -0.6, t: "neg" },
      { l: "W8 Act.", v: 33.54, t: "base" },
    ],
    seg: { price: [-1.4, -0.8, -0.4, -0.2], mix: [-1.6, -0.6, -0.4, -0.2], volume: [-2.4, 0.8, -0.2, -0.4], cost: [0.2, -0.2, -0.1, -0.2] },
    narr: "W8 gross margin compressed \u2013$4.9M vs. W7 \u2014 store traffic decline and Apparel markdowns are the dominant headwinds. Digital growth is the sole positive contributor.",
  },
  Stores: {
    bridge: [
      { l: "Prior W7", v: 21.83, t: "base" },
      { l: "Traffic", v: -3.6, t: "neg" },
      { l: "AUR", v: -1.8, t: "neg" },
      { l: "Markdown", v: -1.4, t: "neg" },
      { l: "Footwear", v: 0.6, t: "pos" },
      { l: "W8 Act.", v: 17.81, t: "base" },
    ],
    seg: { price: [-1.8, 0.0, 0.0, 0.0], mix: [-1.4, 0.0, 0.0, 0.0], volume: [-3.6, 0.0, 0.0, 0.0], cost: [0.6, 0.0, 0.0, 0.0] },
    narr: "Stores margin collapsed 240bps \u2014 traffic drop and aggressive markdowns are the primary culprits. Footwear launches partially offset with strong full-price selling.",
  },
  Digital: {
    bridge: [
      { l: "Prior W7", v: 11.42, t: "base" },
      { l: "Conv Rate", v: 0.4, t: "pos" },
      { l: "AOV", v: 0.3, t: "pos" },
      { l: "Fulfillment", v: 0.2, t: "pos" },
      { l: "Mktg Cost", v: -0.3, t: "neg" },
      { l: "W8 Act.", v: 11.62, t: "base" },
    ],
    seg: { price: [0.0, 0.3, 0.0, 0.0], mix: [0.0, 0.4, 0.0, 0.0], volume: [0.0, 0.4, 0.0, 0.0], cost: [0.0, -0.1, 0.0, 0.0] },
    narr: "Digital channel continues to improve \u2014 conversion rate up 40bps, fulfillment costs declining. BOPIS orders driving incremental margin with lower delivery costs.",
  },
  Wholesale: {
    bridge: [
      { l: "Prior W7", v: 3.20, t: "base" },
      { l: "Sell-Through", v: -0.3, t: "neg" },
      { l: "Off-Price Mix", v: -0.2, t: "neg" },
      { l: "Price Protect", v: -0.1, t: "neg" },
      { l: "Volume", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 2.99, t: "base" },
    ],
    seg: { price: [0.0, 0.0, -0.1, 0.0], mix: [0.0, 0.0, -0.2, 0.0], volume: [0.0, 0.0, -0.3, 0.0], cost: [0.0, 0.0, -0.1, 0.0] },
    narr: "Wholesale margin softened as department store partners increased promotional activity. Off-price channel mix grew to 22% \u2014 brand dilution risk.",
  },
  Outlets: {
    bridge: [
      { l: "Prior W7", v: 2.00, t: "base" },
      { l: "Traffic", v: -0.3, t: "neg" },
      { l: "Markdown", v: -0.2, t: "neg" },
      { l: "Product Mix", v: 0.1, t: "pos" },
      { l: "Occupancy", v: -0.1, t: "neg" },
      { l: "W8 Act.", v: 1.81, t: "base" },
    ],
    seg: { price: [0.0, 0.0, 0.0, -0.2], mix: [0.0, 0.0, 0.0, 0.1], volume: [0.0, 0.0, 0.0, -0.3], cost: [0.0, 0.0, 0.0, -0.1] },
    narr: "Outlet margin decline driven by consumer pullback on discretionary spending. Made-for-outlet product outperforming markdowns-to-outlet. 3\u20134 locations warrant closure review.",
  },
};

const RT_DRV_HEADS: Record<string, string> = {
  "All Channels": "W8 gross margin compressed \u2013$4.9M vs. W7 \u2014 store traffic decline and Apparel markdowns are the dominant headwinds.",
  Stores: "Store margin collapsed 240bps \u2014 traffic down 8%, AUR declining 3%, Apparel clearance rate up to 38%. Footwear launches are the lone bright spot.",
  Digital: "Digital is the only improving channel \u2014 conversion rate up 40bps, fulfillment cost declining, BOPIS margin accretive.",
  Wholesale: "Wholesale weakened as department store partners pulled forward promotions. Off-price mix creeping up to 22% \u2014 brand risk.",
  Outlets: "Outlet traffic declining faster than stores \u2014 consumer trip consolidation. Made-for-outlet product performing but overall mix unfavorable.",
};

const RT_DRV_ROWS: Record<string, DrvRow[]> = {
  "All Channels": [
    { g: "Apparel \u2014 Stores", price: -1.4, mix: -1.6, vol: -2.4, cost: 0.2, conf: "ph", proxy: false },
    { g: "Footwear \u2014 All Channels", price: -0.8, mix: -0.6, vol: 0.8, cost: -0.2, conf: "ph", proxy: false },
    { g: "Accessories \u2014 Stores/Digital", price: -0.4, mix: -0.4, vol: -0.2, cost: -0.1, conf: "pm", proxy: false },
    { g: "Digital-Only SKUs", price: -0.2, mix: -0.2, vol: -0.4, cost: -0.2, conf: "ph", proxy: false },
  ],
  Stores: [
    { g: "Apparel \u2014 Full Price", price: -0.8, mix: -0.6, vol: -1.8, cost: 0.1, conf: "ph", proxy: false },
    { g: "Apparel \u2014 Clearance", price: -0.6, mix: -0.8, vol: -0.4, cost: 0.0, conf: "ph", proxy: false },
    { g: "Footwear \u2014 New Launch", price: 0.2, mix: 0.4, vol: 0.6, cost: 0.0, conf: "ph", proxy: false },
    { g: "Footwear \u2014 Core", price: -0.2, mix: -0.1, vol: -0.2, cost: 0.1, conf: "pm", proxy: "Weather-impacted NE stores \u2014 sales estimated for 180 closed store-days" },
  ],
  Digital: [
    { g: "DTC \u2014 Full Price", price: 0.2, mix: 0.3, vol: 0.3, cost: 0.0, conf: "ph", proxy: false },
    { g: "DTC \u2014 Promo / Sale", price: -0.1, mix: 0.0, vol: 0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "BOPIS / Reserve", price: 0.1, mix: 0.2, vol: 0.2, cost: -0.1, conf: "ph", proxy: false },
    { g: "Marketplace / 3P", price: 0.0, mix: -0.1, vol: 0.0, cost: 0.0, conf: "pm", proxy: "3P commission rates under renegotiation" },
  ],
  Wholesale: [
    { g: "Department Store \u2014 Full Price", price: -0.1, mix: -0.1, vol: -0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Department Store \u2014 Promo", price: -0.1, mix: -0.1, vol: -0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Off-Price / TJ Maxx", price: 0.0, mix: -0.1, vol: 0.0, cost: -0.1, conf: "pm", proxy: "Price protection terms vary by partner" },
    { g: "Specialty Retail", price: 0.0, mix: 0.0, vol: -0.1, cost: 0.0, conf: "pm", proxy: false },
  ],
  Outlets: [
    { g: "Made-for-Outlet", price: 0.0, mix: 0.1, vol: -0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Markdowns-to-Outlet", price: -0.2, mix: 0.0, vol: -0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Seasonal / Clearance", price: -0.1, mix: 0.0, vol: -0.1, cost: -0.1, conf: "pm", proxy: false },
    { g: "Factory Store Exclusive", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "Limited W8 data \u2014 3 locations reporting delay" },
  ],
};

const RT_AI: Record<string, string> = {
  "margin compress": 'W8 gross margin compressed <strong>180bps</strong> to <strong>18.0%</strong> from W7\u2019s 19.8%. The primary drivers are <strong>store traffic decline (\u2013$4.2M)</strong> and <strong>AUR / markdown pressure (\u2013$2.8M)</strong>. Apparel clearance rate surged to 38% from 28%, pulling full-price selling rate to 62%. <strong>Digital growth (+$1.6M)</strong> was the only positive driver. Inventory weeks-on-hand at 14 vs 11 target signals more clearance ahead.',
  traffic: 'Store traffic declined <strong>8% WoW</strong> in W8 \u2014 the 3rd consecutive weekly decline. <strong>Northeast</strong> was hit hardest (180 store closures from blizzard, post-storm recovery still 12% below normal). <strong>Midwest</strong> also weak from extreme cold. Comp store sales went negative for <strong>the first time in 6 quarters</strong>. Digital traffic up 14% but insufficient to offset the $4.2M store traffic headwind.',
  apparel: 'Apparel is the <strong>primary margin drag</strong> \u2014 missed plan by <strong>$8.2M revenue</strong> and <strong>560bps margin</strong>. Clearance rate up to <strong>38%</strong> from 28% target. AUR down 3%. Inventory weeks-on-hand at <strong>14 vs 11 target</strong>. Seasonal product is not moving, and the markdown cascade will continue through W9\u2013W10. This is the single largest drag on blended margin.',
  footwear: 'Footwear is the <strong>bright spot</strong> \u2014 beat plan by <strong>$1.6M revenue</strong> with margin at <strong>24.6%</strong> (+40bps vs plan). Three new SKU launches drove 22% of incremental sales at <strong>60%+ margin</strong>. Running and athletic categories outperforming. Full-price selling rate at <strong>68%</strong> vs 62% company average. AUR stable. Footwear is carrying the portfolio.',
  digital: 'Digital channel margin improved to <strong>24.1%</strong> \u2014 beating forecast every week since W4. Revenue grew <strong>12.6% W1\u2192W8</strong>. Conversion rate up <strong>40bps</strong>. Fulfillment cost per order declined 8% QoQ. <strong>BOPIS orders up 34%</strong> with higher margin than ship-to-home. Digital now represents <strong>26%</strong> of total sales, up from 22% at Q2 start.',
  forecast: 'Q2 QTD gross margin is <strong>19.5%</strong>, tracking <strong>170bps below plan</strong>. Forward projections: <strong>Q2 remaining: 19.0%</strong> (High confidence), <strong>Q3: 20.8%</strong> (Medium \u2014 depends on back-to-school), <strong>Q4: 21.4%</strong> (Low \u2014 holiday promotional environment uncertain). Recovery requires clearance completion, traffic stabilization, and continued digital acceleration.',
  "risk watch": 'Key risks for W9\u2013W10:<br><br>1. <strong>Apparel inventory overhang</strong> \u2014 14 weeks on hand vs 11 target. More markdowns coming.<br>2. <strong>Traffic deceleration</strong> \u2014 3rd consecutive weekly decline, no catalyst for reversal.<br>3. <strong>Weather impact tail</strong> \u2014 Northeast recovery slower than expected.<br>4. <strong>Wholesale channel risk</strong> \u2014 off-price mix at 22% and rising, brand dilution concern.',
  weather: 'The Northeast blizzard closed <strong>180 stores for 48 hours</strong>, estimated <strong>$1.8M in lost sales</strong>. Post-storm foot traffic is <strong>still 12% below normal</strong> after 5 days. BOPIS pickup volume surged 34% as a substitute. The weather impact is concentrated in NYC Metro (\u2013$1.4M) and Boston/New England (\u2013$0.8M). West region was unaffected and actually outperformed.',
  markdown: 'Markdown pressure is accelerating: clearance rate at <strong>38% vs 28% target</strong>. AUR declined <strong>3%</strong>. Full-price selling rate at <strong>62%</strong> vs 68% target. Inventory weeks-on-hand at <strong>14 vs 11</strong>. Apparel seasonal product is the primary issue \u2014 winter product not clearing as spring arrives. Expect another <strong>$2\u20133M</strong> in markdown pressure through W10.',
  "peak best high": 'The quarter gross margin peak was <strong>W6 at 20.3%</strong> for All Channels. By channel: Stores peaked at <strong>19.7% in W5</strong>, Digital at <strong>24.1% in W7\u2013W8</strong> (still climbing), Wholesale at <strong>18.7% in W6</strong>, and Outlets at <strong>18.4% in W5</strong>.',
  "recover scenario": 'To recover the <strong>170bps gap</strong> to Q2 plan, three scenarios:<br><br>1. <strong>Base case</strong> (55%): Clearance completes by W10, traffic stabilizes. Exit Q2 at ~19.2%. Gap narrows to ~100bps.<br>2. <strong>Bull case</strong> (20%): Back-to-school early buying + 2 footwear launches drive traffic recovery. Exit at ~20.0%.<br>3. <strong>Bear case</strong> (25%): Traffic decline deepens, deeper markdowns required. Exit at ~17.8%, gap widens to ~250bps.<br><br>Key lever: <strong>Accelerate digital shift</strong> \u2014 each 1pp of mix shift to digital adds ~6bps to blended margin.',
};

const RT_SUGGESTIONS: Record<string, string[]> = {
  exec: ["Why did gross margin compress in W8?", "What is driving the traffic decline?", "Which category should we focus on?"],
  trend: ["Show Stores margin trend", "How is Digital channel performing?", "Is the markdown pressure accelerating?"],
  actfcst: ["Which category missed forecast most?", "How is Footwear outperforming?", "What is the channel mix vs plan?"],
  drivers: ["What is the biggest margin headwind?", "Explain the traffic impact", "Is the AUR pressure structural?"],
  compare: ["How did margin change W7 to W8?", "Compare Stores vs Digital trajectory"],
  forward: ["What is the Q2 exit rate forecast?", "Can we recover the margin gap?", "What scenarios should we plan for?"],
};

const RETAIL_DATA: FormFactorIndustryData = {
  segments: RT_SEGMENTS,
  weeklyData: RT_WEEKLY,
  trendYRange: RT_YRANGE,
  trendNarr: RT_TREND_NARR,
  bridgeBase: RT_BRIDGE,
  avf: RT_AVF,
  avfHeaders: RT_AVF_HEADERS,
  avfNarr: RT_AVF_NARR,
  drvData: RT_DRV_DATA,
  drvHeads: RT_DRV_HEADS,
  drvRows: RT_DRV_ROWS,
  aiResponses: RT_AI,
  suggestions: RT_SUGGESTIONS,
};

// ═══════════════════════════════════════════════════════════════════
//  LOOKUP
// ═══════════════════════════════════════════════════════════════════

const FORM_FACTOR_MAP: Record<Industry, FormFactorIndustryData> = {
  technology: TECHNOLOGY_DATA,
  healthcare: HEALTHCARE_DATA,
  manufacturing: RETAIL_DATA,
};

/** Get the full Form Factor (Margin Intelligence) data for a given industry */
export function getFormFactorData(industry: Industry): FormFactorIndustryData {
  return FORM_FACTOR_MAP[industry];
}
