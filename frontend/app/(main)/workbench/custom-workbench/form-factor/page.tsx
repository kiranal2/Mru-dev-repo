"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { CommandCenterPanel } from "@/components/ai"

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

type PageId = "exec" | "trend" | "actfcst" | "drivers" | "compare" | "forward"
type TrendSeg = "All Segments" | "North America" | "APAC" | "EMEA" | "LatAm"
type AvfKey = "product" | "customer" | "segment"

interface WeekData {
  w: string
  rev: number
  cost: number
  margin: number
  fcst: number
}

interface BridgeItem {
  l: string
  v: number
  t: "base" | "pos" | "neg"
}

interface AvfRow {
  dim: string
  ra: number
  rf: number
  ma: number
  mf: number
  c: "High" | "Medium" | "Low"
}

interface DrvRow {
  g: string
  price: number
  mix: number
  vol: number
  cost: number
  conf: "ph" | "pm" | "pl"
  proxy: string | false
}

// ═══════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════

const WD_ALL: WeekData[] = [
  { w: "W1", rev: 48.2, cost: 33.1, margin: 31.3, fcst: 32.0 },
  { w: "W2", rev: 50.1, cost: 34.2, margin: 31.7, fcst: 32.2 },
  { w: "W3", rev: 49.3, cost: 33.6, margin: 31.8, fcst: 32.4 },
  { w: "W4", rev: 52.8, cost: 35.9, margin: 32.0, fcst: 32.5 },
  { w: "W5", rev: 54.1, cost: 36.5, margin: 32.5, fcst: 32.6 },
  { w: "W6", rev: 53.6, cost: 36.0, margin: 32.8, fcst: 32.7 },
  { w: "W7", rev: 54.9, cost: 37.0, margin: 32.6, fcst: 32.8 },
  { w: "W8", rev: 57.2, cost: 39.3, margin: 31.3, fcst: 33.4 },
]

const WD_NA: WeekData[] = [
  { w: "W1", rev: 18.4, cost: 11.7, margin: 36.4, fcst: 36.8 },
  { w: "W2", rev: 19.2, cost: 12.1, margin: 37.0, fcst: 37.0 },
  { w: "W3", rev: 18.9, cost: 11.9, margin: 37.0, fcst: 37.2 },
  { w: "W4", rev: 20.1, cost: 12.6, margin: 37.3, fcst: 37.3 },
  { w: "W5", rev: 20.8, cost: 13.0, margin: 37.5, fcst: 37.4 },
  { w: "W6", rev: 20.4, cost: 12.7, margin: 37.7, fcst: 37.5 },
  { w: "W7", rev: 21.1, cost: 13.2, margin: 37.4, fcst: 37.6 },
  { w: "W8", rev: 22.1, cost: 14.1, margin: 36.2, fcst: 37.8 },
]

const WD_APAC: WeekData[] = [
  { w: "W1", rev: 14.6, cost: 10.9, margin: 25.3, fcst: 27.0 },
  { w: "W2", rev: 15.3, cost: 11.3, margin: 26.1, fcst: 27.2 },
  { w: "W3", rev: 14.9, cost: 11.1, margin: 25.5, fcst: 27.5 },
  { w: "W4", rev: 16.2, cost: 11.9, margin: 26.5, fcst: 27.8 },
  { w: "W5", rev: 17.1, cost: 12.4, margin: 27.5, fcst: 28.0 },
  { w: "W6", rev: 16.4, cost: 12.2, margin: 25.6, fcst: 28.1 },
  { w: "W7", rev: 16.8, cost: 12.7, margin: 24.4, fcst: 28.3 },
  { w: "W8", rev: 18.4, cost: 13.6, margin: 26.1, fcst: 28.5 },
]

const WD_EMEA: WeekData[] = [
  { w: "W1", rev: 10.4, cost: 6.9, margin: 33.7, fcst: 33.2 },
  { w: "W2", rev: 10.8, cost: 7.1, margin: 34.3, fcst: 33.4 },
  { w: "W3", rev: 10.6, cost: 7.0, margin: 34.0, fcst: 33.5 },
  { w: "W4", rev: 11.4, cost: 7.4, margin: 35.1, fcst: 33.7 },
  { w: "W5", rev: 11.1, cost: 7.2, margin: 35.1, fcst: 33.8 },
  { w: "W6", rev: 11.3, cost: 7.3, margin: 35.4, fcst: 33.9 },
  { w: "W7", rev: 11.7, cost: 7.6, margin: 35.0, fcst: 34.0 },
  { w: "W8", rev: 11.3, cost: 7.5, margin: 33.8, fcst: 34.2 },
]

const WD_LATAM: WeekData[] = [
  { w: "W1", rev: 4.8, cost: 3.4, margin: 29.2, fcst: 30.5 },
  { w: "W2", rev: 4.8, cost: 3.4, margin: 29.2, fcst: 30.5 },
  { w: "W3", rev: 4.9, cost: 3.5, margin: 28.6, fcst: 30.6 },
  { w: "W4", rev: 5.1, cost: 3.7, margin: 27.5, fcst: 30.7 },
  { w: "W5", rev: 5.1, cost: 3.6, margin: 29.4, fcst: 30.8 },
  { w: "W6", rev: 5.5, cost: 3.8, margin: 30.9, fcst: 30.9 },
  { w: "W7", rev: 5.3, cost: 3.7, margin: 30.2, fcst: 31.0 },
  { w: "W8", rev: 5.4, cost: 3.8, margin: 29.4, fcst: 31.2 },
]

const TREND_DATA: Record<TrendSeg, WeekData[]> = {
  "All Segments": WD_ALL,
  "North America": WD_NA,
  APAC: WD_APAC,
  EMEA: WD_EMEA,
  LatAm: WD_LATAM,
}

const TREND_YRANGE: Record<TrendSeg, { min: number; max: number }> = {
  "All Segments": { min: 30, max: 34 },
  "North America": { min: 34, max: 40 },
  APAC: { min: 23, max: 30 },
  EMEA: { min: 31, max: 37 },
  LatAm: { min: 26, max: 33 },
}

const TREND_NARR: Record<TrendSeg, { head: string; body: string }> = {
  "All Segments": {
    head: "Revenue grew +4.2% WoW in W8, but blended standard margin compressed 130bps — APAC mix shift and Group B cost pressure are the culprits.",
    body: "Q2 QTD margin stands at <strong>31.4%</strong>, tracking <strong>90bps below plan</strong>. Revenue growth has been consistent W1–W8 (+18.7% cumulative) but cost is growing faster, compressing the margin line. W6 was the quarter margin peak at <strong>32.8%</strong>. W8 dip is partly a mix story — APAC volume grew disproportionately this week.",
  },
  "North America": {
    head: "NA delivered its strongest revenue week at $22.1M in W8, but margin pulled back 120bps from W7's peak of 37.4% — a one-time freight accrual adjustment inflated cost.",
    body: "NA is the highest-margin segment at <strong>36–38% range</strong> and has grown revenue steadily through Q2. <strong>W5–W6 were the margin high watermark</strong>. The W8 dip to <strong>36.2%</strong> is primarily cost-driven (freight accrual, not structural). Excluding the accrual, underlying margin would be ~<strong>37.1%</strong> — above forecast. NA is tracking ahead of Q2 plan on revenue.",
  },
  APAC: {
    head: "APAC margin recovered slightly in W8 (+170bps WoW) after the W7 trough at 24.4%, but remains 240bps below forecast. Volume growth is real; cost data is partially proxy-estimated.",
    body: "APAC is the <strong>lowest-margin segment</strong> in the portfolio at 25–27% range, and the most volatile week-to-week. <strong>W5 was the quarter high at 27.5%</strong> before a two-week deterioration. Standard cost for <strong>6 SKUs</strong> is still proxy-estimated via v2.3 — actual cost may be worse than reported. APAC revenue growth (+26% W1→W8) is outpacing all other segments, which is compressing blended margin.",
  },
  EMEA: {
    head: "EMEA posted a steady improvement arc through W6 (quarter high: 35.4%), then softened in W7–W8. A single large Professional Services deal in W8 accounts for most of the dip.",
    body: "<strong>EMEA is the most consistent performer</strong> — margin held in the 33–35% band all quarter with no sharp swings. The W8 softening to <strong>33.8%</strong> is almost entirely explained by one PS deal at <strong>~28% margin</strong> that closed late in the week. Excluding that deal, EMEA underlying margin was <strong>35.1%</strong> — above forecast. EMEA is on track to beat Q2 plan if the PS deal is treated as non-recurring.",
  },
  LatAm: {
    head: "LatAm margin is volatile week-to-week due to small revenue base ($4.8–5.5M range) and high proxy dependency. W6 was the quarter high at 30.9%; W8 tracking near Q2 average.",
    body: "LatAm is the <strong>smallest segment</strong> and has the <strong>highest proxy dependency</strong> (~60% of cost base is Proxy v2.3 estimated). This means WoW swings in margin % can be misleading — small absolute shifts in proxy assumptions move the % significantly. <strong>W4 was the quarter low at 27.5%</strong> before recovering. Treat LatAm margin data as directional only until EDW feed is confirmed.",
  },
}

const AVF: Record<AvfKey, AvfRow[]> = {
  product: [
    { dim: "Group A — Enterprise SW", ra: 18.4, rf: 17.8, ma: 38.2, mf: 38.0, c: "High" },
    { dim: "Group B — Infrastructure", ra: 22.1, rf: 23.5, ma: 27.4, mf: 30.1, c: "Medium" },
    { dim: "Group C — Professional Svcs", ra: 11.3, rf: 11.0, ma: 33.8, mf: 33.5, c: "High" },
    { dim: "Group D — Managed Svcs", ra: 5.4, rf: 5.7, ma: 22.1, mf: 24.0, c: "Low" },
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
}

const AVFH: Record<AvfKey, string> = { product: "Product Group", customer: "Customer Group", segment: "Market Segment" }

const AVF_NARR: Record<AvfKey, { head: string; body: string }> = {
  product: {
    head: "Group B — Infrastructure is the primary miss: –$1.4M revenue and –270bps margin vs plan. Group A beat on both lines; Group D data is unconfirmed.",
    body: "<strong>Group A — Enterprise SW</strong> delivered $18.4M actual vs $17.8M forecast (+$0.6M) with margin at 38.2% — tracking ahead of plan. <strong>Group B — Infrastructure</strong> missed revenue by $1.4M and margin is 270bps below forecast; proxy cost data for 4 SKUs limits confidence in the margin figure. <strong>Group C — Professional Services</strong> is broadly on-plan. <strong>Group D — Managed Services</strong> shows zero variance because W8 actuals have not yet been confirmed — Low confidence, proxy forward-fill applied.",
  },
  customer: {
    head: "Enterprise Tier 1 beat forecast by +$1.5M revenue and held margin near plan. Mid-Market and SMB are both below on revenue and margin — the largest gap is SMB at –250bps vs plan.",
    body: "<strong>Enterprise Tier 1</strong> ($28.3M actual vs $26.8M forecast) is the standout performer this week — volume came in ahead and margin held at 37.8% (+60bps vs plan). <strong>Enterprise Tier 2</strong> missed revenue by $0.8M with margin 90bps below forecast. <strong>Mid-Market</strong> is –$0.8M on revenue and –210bps on margin, consistent with a shift toward lower-ASP deals. <strong>SMB / Channel</strong> shows the steepest margin miss at –250bps — channel mix shifted toward lower-margin reseller accounts in W8.",
  },
  segment: {
    head: "APAC shows the widest forecast gap: –240bps margin and –$0.9M revenue miss. EMEA is the only segment beating forecast on margin (+70bps). NA missed margin despite beating on revenue.",
    body: "<strong>North America</strong> grew revenue to $22.1M (vs $22.5M forecast, –$0.4M) but margin came in at 36.2% vs 37.8% forecast — the 160bps gap is primarily the W8 freight accrual. <strong>APAC</strong> missed both revenue (–$0.9M) and margin (–240bps) — the largest absolute forecast gap in the portfolio. <strong>EMEA</strong> beat margin forecast by 70bps at 33.8% vs 34.2% plan, though a PS deal explains most of the revenue shortfall. <strong>LatAm</strong> carries Low confidence throughout — proxy estimates dominate the cost base.",
  },
}

const DRV_DATA: Record<
  TrendSeg,
  {
    bridge: BridgeItem[]
    seg: { price: number[]; mix: number[]; volume: number[]; cost: number[] }
    narr: string
  }
> = {
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
    narr: "W8 margin compressed –$1.8M vs. W7 — mix shift is the dominant headwind. Volume growth solid but skewed to lower-margin APAC and Infrastructure.",
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
    narr: "APAC is the primary margin drag — mix shifted heavily toward low-margin Infrastructure SKUs. Proxy cost model covers 38% of APAC volume; real cost may be worse than reported.",
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
    narr: "LatAm margin broadly flat. Low volume means small dollar impacts. Cost data is largely proxy-estimated — treat with low confidence until EDW feed confirmed.",
  },
}

const DRV_HEADS: Record<TrendSeg, string> = {
  "All Segments": "W8 blended margin compressed –$1.8M vs. W7 — mix shift across APAC and Infrastructure is the dominant headwind.",
  "North America": "NA margin pulled back 120bps in W8 despite strong volume growth. A one-time freight accrual drove the cost line.",
  APAC: "APAC shows the sharpest mix headwind — Infrastructure SKU growth diluted margin by –$0.9M. Proxy cost data for 6 SKUs limits confidence.",
  EMEA: "EMEA W8 softened on a single large low-margin Professional Services deal. Excluding that deal, underlying margin held at 35.1%.",
  LatAm: "LatAm drivers broadly flat dollar-for-dollar. Low volume means small absolute impacts; proxy dependency limits actionability.",
}

const DRV_ROWS: Record<TrendSeg, DrvRow[]> = {
  "All Segments": [
    { g: "Group A — Enterprise SW", price: 0.2, mix: -0.4, vol: 1.1, cost: -0.1, conf: "ph", proxy: false },
    { g: "Group B — Infrastructure", price: 0.0, mix: -0.9, vol: 0.7, cost: -0.4, conf: "pm", proxy: "Cost via Proxy v2.3 — standard cost unavailable for 4 SKUs" },
    { g: "Group C — Professional Svcs", price: -0.1, mix: -0.5, vol: 0.5, cost: -0.1, conf: "ph", proxy: false },
    { g: "Group D — Managed Svcs", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No W8 actuals — proxy forward-fill applied" },
  ],
  "North America": [
    { g: "Enterprise SW — NA", price: 0.2, mix: -0.2, vol: 0.8, cost: -0.5, conf: "ph", proxy: false },
    { g: "Infrastructure — NA", price: 0.0, mix: -0.2, vol: 0.3, cost: -0.2, conf: "ph", proxy: false },
    { g: "Prof. Services — NA", price: 0.0, mix: 0.0, vol: 0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Managed Services — NA", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pm", proxy: "Partial actuals" },
  ],
  APAC: [
    { g: "Enterprise SW — APAC", price: -0.1, mix: -0.3, vol: 0.3, cost: -0.1, conf: "pm", proxy: false },
    { g: "Infrastructure — APAC", price: 0.0, mix: -0.5, vol: 0.4, cost: -0.3, conf: "pm", proxy: "Proxy v2.3 — 6 SKUs" },
    { g: "Prof. Services — APAC", price: 0.0, mix: -0.1, vol: 0.1, cost: 0.0, conf: "ph", proxy: false },
    { g: "Managed Services — APAC", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No confirmed actuals" },
  ],
  EMEA: [
    { g: "Enterprise SW — EMEA", price: 0.0, mix: 0.1, vol: 0.3, cost: 0.0, conf: "ph", proxy: false },
    { g: "Infrastructure — EMEA", price: -0.1, mix: -0.1, vol: 0.1, cost: -0.1, conf: "ph", proxy: false },
    { g: "Prof. Services — EMEA", price: 0.0, mix: -0.5, vol: 0.2, cost: 0.0, conf: "ph", proxy: "Large PS deal at 28% margin" },
    { g: "Managed Services — EMEA", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pm", proxy: false },
  ],
  LatAm: [
    { g: "Enterprise SW — LatAm", price: 0.0, mix: 0.0, vol: 0.1, cost: 0.0, conf: "pm", proxy: false },
    { g: "Infrastructure — LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: -0.1, conf: "pl", proxy: "Proxy cost — limited coverage" },
    { g: "Prof. Services — LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No actuals — fwd-fill" },
    { g: "Managed Services — LatAm", price: 0.0, mix: 0.0, vol: 0.0, cost: 0.0, conf: "pl", proxy: "No actuals" },
  ],
}

const PERIODS = ["Q2 2025 — Week 8", "Q2 2025 — Week 7", "Q2 2025 — Week 6"]

const PAGE_TITLES: Record<PageId, string> = {
  exec: "Executive Landing View",
  trend: "Trending Report",
  actfcst: "Actual vs. Forecast",
  drivers: "Driver Analytics",
  compare: "Period Comparison",
  forward: "Margin Forecast",
}

// ═══════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.ff-root {
  --teal: var(--theme-accent, #1E40AF);
  --teal-dark: var(--theme-accent-hover, #1e3a8a);
  --teal-light: var(--theme-accent-subtle, rgba(30,64,175,0.06));
  --teal-mid: rgba(59,130,246,0.20);
  --navy: var(--theme-surface, #ffffff);
  --navy-dark: var(--theme-bg, #f8fafc);
  --navy-light: var(--theme-surface-alt, rgba(0,0,0,0.02));
  --navy-mid: rgba(0,0,0,0.04);
  --bg: var(--theme-bg, #f8fafc);
  --bg-white: var(--theme-surface, #ffffff);
  --bg-subtle: var(--theme-surface-alt, #f1f5f9);
  --border: var(--theme-border, #e2e8f0);
  --border-strong: var(--theme-border-strong, #cbd5e1);
  --text-primary: var(--theme-text, #0f172a);
  --text-secondary: var(--theme-text-secondary, #475569);
  --text-muted: var(--theme-text-muted, #94a3b8);
  --green: var(--theme-success, #16a34a);
  --green-bg: rgba(22,163,74,0.08);
  --green-br: rgba(22,163,74,0.25);
  --red: var(--theme-danger, #dc2626);
  --red-bg: rgba(220,38,38,0.08);
  --red-br: rgba(220,38,38,0.25);
  --amber: var(--theme-warning, #d97706);
  --amber-bg: rgba(217,119,6,0.08);
  --amber-br: rgba(217,119,6,0.25);
  --sans: 'Inter', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --wordmark: 'Poppins', sans-serif;
  --sh-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --sh-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);

  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  height: 100%;
  min-height: 0;
  display: flex;
}
.ff-root * { box-sizing: border-box; margin: 0; padding: 0; }

/* SIDEBAR */
.ff-sidebar {
  width: 232px; flex-shrink: 0; background: var(--navy-dark);
  display: flex; flex-direction: column; border-right: 1px solid var(--border);
  overflow-y: auto;
}
.ff-sb-logo { padding: 22px 20px 18px; border-bottom: 1px solid var(--border); }
.ff-sb-wordmark { font-family: var(--wordmark); font-size: 20px; font-weight: 700; color: var(--teal); letter-spacing: -0.3px; }
.ff-sb-sub { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); margin-top: 2px; }
.ff-sb-group { padding: 10px 0; border-bottom: 1px solid var(--border); }
.ff-sb-glabel { padding: 4px 18px 7px; font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text-muted); }
.ff-sb-item {
  display: flex; align-items: center; gap: 9px; padding: 9px 18px;
  cursor: pointer; color: var(--text-secondary); font-size: 13px; font-weight: 400;
  border: none; background: none; width: 100%; text-align: left;
  border-left: 3px solid transparent; transition: all 0.15s; user-select: none;
  font-family: var(--sans);
}
.ff-sb-item:hover { color: var(--text-primary); background: rgba(0,0,0,0.03); }
.ff-sb-item.active { color: var(--teal); background: rgba(30,64,175,0.08); border-left-color: var(--teal); font-weight: 500; }
.ff-sb-icon { width: 17px; text-align: center; font-size: 14px; flex-shrink: 0; }
.ff-sb-foot { margin-top: auto; padding: 14px 18px; border-top: 1px solid var(--border); }
.ff-fresh-row { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--text-muted); }
.ff-dot-live { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; flex-shrink: 0; animation: ffBlink 2.2s ease-in-out infinite; }
@keyframes ffBlink { 0%,100%{opacity:1} 50%{opacity:0.22} }
.ff-fresh-src { font-size: 10px; color: var(--text-muted); margin-top: 3px; }

/* MAIN */
.ff-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

/* TOPBAR */
.ff-topbar {
  padding: 13px 28px; background: var(--bg-white); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.ff-tb-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.ff-tb-title em { font-style: normal; color: var(--teal); }
.ff-tb-right { display: flex; align-items: center; gap: 9px; }
.ff-btn {
  display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
  border: 1px solid var(--border); background: var(--bg-white); color: var(--text-secondary);
  font-family: var(--sans);
}
.ff-btn:hover { border-color: var(--teal); color: var(--teal); }
.ff-btn.primary { background: var(--teal); border-color: var(--teal); color: var(--navy); }
.ff-btn.primary:hover { background: var(--teal-dark); }
.ff-pval { color: var(--teal); font-weight: 600; }

/* PAGE */
.ff-page { flex: 1; overflow-y: auto; padding: 22px 28px 52px; }
@keyframes ffFadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
.ff-page { animation: ffFadeUp 0.22s ease; }

/* CARD */
.ff-card { background: var(--bg-white); border: 1px solid var(--border); border-radius: 12px; padding: 18px 22px; box-shadow: var(--sh-sm); }
.ff-card-title { font-size: 10.5px; font-weight: 600; letter-spacing: 1.1px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 13px; }

/* STAT GRID */
.ff-sg { display: grid; grid-template-columns: repeat(4,1fr); gap: 13px; margin-bottom: 18px; }
.ff-sc {
  background: var(--bg-white); border: 1px solid var(--border); border-radius: 12px;
  padding: 17px 20px; box-shadow: var(--sh-sm); position: relative; overflow: hidden;
}
.ff-sc::after { content:''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
.ff-sc.t::after { background: var(--teal); }
.ff-sc.n::after { background: #60a5fa; }
.ff-sc.r::after { background: var(--red); }
.ff-sc.a::after { background: var(--amber); }
.ff-sc-label { font-size: 10.5px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 7px; }
.ff-sc-val { font-size: 28px; font-weight: 700; line-height: 1.15; margin-bottom: 6px; }
.ff-sc-val.teal { color: var(--teal); }
.ff-sc-val.navy { color: var(--text-primary); }
.ff-sc-val.red { color: var(--red); }
.ff-sc-val.amber { color: var(--amber); }
.ff-sc-delta { font-size: 12px; display: flex; align-items: center; gap: 3px; }

/* STATUS COLORS */
.ff-up { color: var(--green); }
.ff-dn { color: var(--red); }
.ff-nt { color: var(--text-muted); }

/* GRIDS */
.ff-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 16px; }
.ff-g6040 { display: grid; grid-template-columns: 3fr 2fr; gap: 15px; margin-bottom: 16px; }
.ff-mb { margin-bottom: 16px; }

/* NARRATIVE */
.ff-narr {
  background: linear-gradient(135deg,rgba(30,64,175,0.07) 0%,rgba(10,22,40,0) 100%);
  border: 1px solid var(--teal-mid); border-radius: 12px; padding: 16px 20px; margin-bottom: 18px;
}
.ff-narr-chip {
  display: inline-flex; align-items: center; gap: 5px; background: var(--teal); color: #fff;
  font-size: 9.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  padding: 3px 10px; border-radius: 20px; margin-bottom: 9px;
}
.ff-narr-head { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 7px; line-height: 1.5; }
.ff-narr-body { font-size: 13px; color: var(--text-secondary); line-height: 1.75; }
.ff-narr-body strong { color: var(--text-primary); font-weight: 600; }
.ff-narr-toggle {
  display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;
}
.ff-narr-toggle-btn {
  display: flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--teal-mid);
  border-radius: 5px; padding: 3px 9px; font-size: 10px; font-family: var(--mono);
  color: var(--teal); cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.ff-narr-toggle-btn:hover { background: var(--teal-light); }
.ff-narr-content { overflow: hidden; transition: max-height 0.3s ease, opacity 0.2s ease; }
.ff-narr-content.collapsed { max-height: 0; opacity: 0; margin-top: 0; }
.ff-narr-content.expanded { max-height: 500px; opacity: 1; margin-top: 9px; }

/* WATERFALL */
.ff-wf { display: flex; flex-direction: column; gap: 7px; }
.ff-wf-row { display: flex; align-items: center; gap: 9px; }
.ff-wf-lbl { width: 68px; font-size: 11.5px; color: var(--text-secondary); flex-shrink: 0; }
.ff-wf-track { flex: 1; height: 25px; background: var(--bg-subtle); border-radius: 5px; overflow: hidden; border: 1px solid var(--border); }
.ff-wf-bar {
  height: 100%; border-radius: 4px; display: flex; align-items: center; padding: 0 9px;
  font-size: 11px; font-weight: 600; font-family: var(--mono); transition: width 0.7s cubic-bezier(0.16,1,0.3,1);
}
.ff-wf-bar.pos { background: var(--green-bg); color: var(--green); border-right: 2px solid #86efac; }
.ff-wf-bar.neg { background: var(--red-bg); color: var(--red); border-right: 2px solid #fca5a5; }
.ff-wf-bar.base { background: rgba(30,64,175,0.12); color: var(--teal); border-right: 2px solid var(--teal-mid); }

/* TABLE */
.ff-dt { width: 100%; border-collapse: collapse; }
.ff-dt th {
  text-align: left; padding: 9px 12px; font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.7px; text-transform: uppercase; color: var(--text-muted);
  border-bottom: 1px solid var(--border); background: var(--bg-subtle); white-space: nowrap;
}
.ff-dt td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
.ff-dt tr:last-child td { border-bottom: none; }
.ff-dt tr:hover td { background: var(--bg-subtle); }
.ff-dt td.num { font-family: var(--mono); font-size: 12.5px; }
.ff-dt td.bold { font-weight: 600; color: var(--text-primary); }
.ff-dt td.up { color: var(--green); font-family: var(--mono); font-size: 12.5px; }
.ff-dt td.dn { color: var(--red); font-family: var(--mono); font-size: 12.5px; }

/* PILL */
.ff-pill {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
  border-radius: 20px; font-size: 10.5px; font-weight: 600;
}
.ff-pill::before { content: '●'; font-size: 7px; }
.ff-pill.ph { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-br); }
.ff-pill.pm { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-br); }
.ff-pill.pl { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-br); }
.ff-src-tag {
  display: inline-block; font-size: 10px; font-family: var(--mono); font-weight: 500;
  color: var(--text-muted); background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 4px; padding: 1px 6px;
}
.ff-proxy-note { font-size: 11px; color: var(--text-muted); border-bottom: 1px dashed var(--border-strong); cursor: help; }

/* INFO BANNER */
.ff-ibanner {
  display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.03);
  border: 1px solid var(--border); border-radius: 8px; padding: 9px 15px;
  font-size: 12px; color: var(--text-muted); margin-bottom: 16px;
}
.ff-ibanner-ico { color: var(--teal); font-size: 14px; flex-shrink: 0; }

/* TABS */
.ff-tabs {
  display: flex; gap: 2px; background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 9px; padding: 3px; width: fit-content; margin-bottom: 16px;
}
.ff-tab {
  padding: 6px 17px; border-radius: 7px; font-size: 13px; cursor: pointer;
  color: var(--text-muted); font-weight: 400; transition: all 0.15s;
  border: none; background: none; font-family: var(--sans);
}
.ff-tab.active { background: var(--bg-white); color: var(--teal); font-weight: 600; box-shadow: var(--sh-sm); }
.ff-tab:hover:not(.active) { color: var(--text-secondary); }

/* SECTION HEADER */
.ff-sh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ff-sh-t { font-size: 17px; font-weight: 600; color: var(--text-primary); }
.ff-sh-s { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
.ff-sh-a { font-size: 12px; color: var(--teal); cursor: pointer; font-weight: 500; }
.ff-sh-a:hover { text-decoration: underline; }

/* FILTER BAR */
.ff-fbar { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
.ff-fchip {
  padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border); color: var(--text-muted);
  background: var(--bg-white); transition: all 0.15s; font-family: var(--sans);
}
.ff-fchip.active { background: var(--teal-light); border-color: var(--teal-mid); color: var(--teal); }
.ff-fchip:hover:not(.active) { border-color: var(--border-strong); color: var(--text-secondary); }

/* WEEK CHIPS */
.ff-wg { display: flex; gap: 6px; flex-wrap: wrap; }
.ff-wchip {
  padding: 5px 13px; border-radius: 7px; font-size: 12.5px; font-family: var(--mono);
  border: 1px solid var(--border); cursor: pointer; transition: all 0.15s;
  color: var(--text-secondary); background: var(--bg-white);
}
.ff-wchip:hover { border-color: var(--teal); color: var(--teal); }
.ff-wchip.sel { background: var(--teal-light); border-color: var(--teal-mid); color: var(--teal); font-weight: 600; }
.ff-wchip.cmp { background: var(--amber-bg); border-color: var(--amber-br); color: var(--amber); font-weight: 600; }

/* FORECAST ROW */
.ff-frow { display: flex; gap: 13px; margin-bottom: 16px; }
.ff-fc {
  flex: 1; background: var(--bg-white); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 18px; box-shadow: var(--sh-sm);
}
.ff-fc.hl { border-color: var(--teal-mid); background: var(--teal-light); }
.ff-fc-p { font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 7px; }
.ff-fc-v { font-size: 26px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.ff-fc.hl .ff-fc-v { color: var(--teal); }
.ff-fc-r { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }

/* ACCURACY RINGS */
.ff-acc-grid { display: flex; gap: 26px; flex-wrap: wrap; }
.ff-acc-item { display: flex; align-items: center; gap: 13px; }
.ff-ring-wrap { position: relative; width: 62px; height: 62px; flex-shrink: 0; }
.ff-ring-val {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 12.5px; font-weight: 600;
}
.ff-acc-lbl { font-size: 13px; color: var(--text-primary); font-weight: 500; }
.ff-acc-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

/* COMPARE SUMMARY ROWS */
.ff-cmp-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 13px; background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 8px; margin-bottom: 7px;
}
.ff-cmp-lbl { font-size: 12.5px; color: var(--text-secondary); }
.ff-cmp-val { font-family: var(--mono); font-size: 13px; font-weight: 600; }

/* SVG BAR CHART - used for trend/avf charts rendered as inline SVG */
.ff-svg-chart { width: 100%; }

/* SCROLLBAR */
.ff-root ::-webkit-scrollbar { width: 4px; }
.ff-root ::-webkit-scrollbar-track { background: transparent; }
.ff-root ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* AI CHAT PANEL — base styles (positioning handled by toggle section above) */
.ff-ai-panel {
  background: var(--navy-dark);
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column; min-height: 0;
}
.ff-ai-header {
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.ff-ai-icon { font-size: 16px; }
.ff-ai-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ff-ai-subtitle { font-size: 10px; color: var(--text-muted); }
.ff-ai-messages {
  flex: 1; overflow-y: auto; padding: 14px;
  display: flex; flex-direction: column; gap: 10px; min-height: 0;
}
.ff-ai-msg { display: flex; flex-direction: column; gap: 3px; }
.ff-ai-msg-role {
  font-size: 9px; font-family: var(--mono); color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
}
.ff-ai-msg-bubble {
  border-radius: 8px; padding: 9px 12px;
  font-size: 11px; line-height: 1.55;
}
.ff-ai-msg.user .ff-ai-msg-bubble { background: rgba(30,64,175,0.12); color: var(--text-primary); }
.ff-ai-msg.ai .ff-ai-msg-bubble { background: var(--bg-white); border: 1px solid var(--border); color: var(--text-secondary); }
.ff-ai-msg.ai .ff-ai-msg-bubble strong { color: var(--teal); }
.ff-ai-msg.typing .ff-ai-msg-bubble { color: var(--text-muted); font-style: italic; }
.ff-ai-input-area {
  padding: 12px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
}
.ff-ai-suggestions { display: flex; flex-direction: column; gap: 5px; }
.ff-ai-sug {
  background: rgba(30,64,175,0.05); border: 1px solid rgba(30,64,175,0.15);
  border-radius: 5px; padding: 5px 10px;
  font-size: 10px; color: var(--text-muted); cursor: pointer;
  font-family: var(--mono); transition: all 0.15s; user-select: none;
  text-align: left; width: 100%;
}
.ff-ai-sug:hover { border-color: var(--teal); color: var(--teal); background: rgba(30,64,175,0.08); }
.ff-ai-input-row {
  display: flex; gap: 6px; align-items: center;
}
.ff-ai-input {
  flex: 1; background: var(--bg-white); border: 1px solid var(--border);
  border-radius: 7px; padding: 8px 12px;
  font-size: 11px; color: var(--text-primary); font-family: var(--sans);
  outline: none; transition: border-color 0.2s;
}
.ff-ai-input:focus { border-color: var(--teal); }
.ff-ai-input::placeholder { color: var(--text-muted); }
.ff-ai-send {
  width: 30px; height: 30px; border-radius: 6px;
  background: var(--teal); color: var(--navy); border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; transition: opacity 0.15s; flex-shrink: 0;
}
.ff-ai-send:hover { opacity: 0.85; }
.ff-ai-send:disabled { opacity: 0.4; cursor: not-allowed; }

/* ═══════════════════════════════════════════════
   AI PANEL — ALWAYS HIDDEN, TOGGLE TO SHOW
   ═══════════════════════════════════════════════ */
.ff-sidebar-toggle { display: none; }
.ff-ai-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 7px;
  background: var(--bg-white); border: 1px solid var(--border);
  color: var(--teal); cursor: pointer; transition: all 0.15s;
  font-size: 14px; flex-shrink: 0;
}
.ff-ai-toggle:hover { border-color: var(--teal); background: var(--teal-light); }
.ff-ai-close {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 5px; margin-left: auto;
  background: transparent; border: 1px solid var(--border);
  color: var(--text-muted); cursor: pointer; font-size: 12px;
}
.ff-ai-close:hover { border-color: var(--teal); color: var(--teal); }
.ff-sidebar-overlay { display: none; }
.ff-ai-overlay {
  position: fixed; inset: 0; z-index: 199;
  background: rgba(0,0,0,0.3); display: none;
}
.ff-ai-overlay.open { display: block; }

/* AI panel: slide-over on ALL screen sizes */
.ff-ai-panel {
  position: fixed; right: 0; top: 0; bottom: 0; z-index: 200;
  width: 340px; transform: translateX(100%);
  transition: transform 0.25s ease; box-shadow: -8px 0 30px rgba(0,0,0,0.08);
}
.ff-ai-panel.open { transform: translateX(0); }

/* ═══════════════════════════════════════════════
   TABLET (768px – 1279px)
   ═══════════════════════════════════════════════ */
@media (max-width: 1279px) {
  .ff-root { flex-direction: column; display: flex; }

  /* Sidebar: slide-over drawer */
  .ff-sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 200;
    width: 260px; transform: translateX(-100%);
    transition: transform 0.25s ease; box-shadow: 8px 0 30px rgba(0,0,0,0.08);
  }
  .ff-sidebar.open { transform: translateX(0); }
  .ff-sidebar-overlay {
    position: fixed; inset: 0; z-index: 199;
    background: rgba(0,0,0,0.3); display: none;
  }
  .ff-sidebar-overlay.open { display: block; }

  /* Show sidebar toggle */
  .ff-sidebar-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: var(--bg-white); border: 1px solid var(--border);
    color: var(--text-muted); cursor: pointer; transition: all 0.15s;
    font-size: 13px; flex-shrink: 0;
  }
  .ff-sidebar-toggle:hover { border-color: var(--teal); color: var(--teal); }

  /* AI panel narrower on tablet */
  .ff-ai-panel { width: 300px; }

  /* Topbar: compact */
  .ff-topbar { padding: 6px 14px; }
  .ff-tb-title { font-size: 14px; }
  .ff-btn { padding: 5px 10px; font-size: 12px; }

  /* Page content: tight padding, minimal gaps */
  .ff-page { padding: 10px 14px 20px; }

  /* Info banner: compact */
  .ff-ibanner { padding: 6px 12px; font-size: 11px; margin-bottom: 8px; }

  /* Narrative: compact */
  .ff-narr { padding: 10px 14px; margin-bottom: 10px; }
  .ff-narr-chip { font-size: 8px; padding: 2px 8px; margin-bottom: 5px; }
  .ff-narr-head { font-size: 12.5px; margin-bottom: 4px; line-height: 1.4; }
  .ff-narr-body { font-size: 11.5px; line-height: 1.5; }

  /* Stat grid: KEEP 4-col — tablet has enough width */
  .ff-sg { grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
  .ff-sc { padding: 10px 12px; border-radius: 8px; }
  .ff-sc-val { font-size: 20px; margin-bottom: 2px; }
  .ff-sc-label { font-size: 8.5px; letter-spacing: 0.5px; margin-bottom: 4px; }
  .ff-sc-delta { font-size: 10px; }

  /* 2-col grids: stay 2-col, tighter */
  .ff-g2 { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .ff-g6040 { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }

  /* Cards: compact */
  .ff-card { padding: 12px 14px; overflow-x: auto; border-radius: 8px; }
  .ff-card-title { font-size: 9px; margin-bottom: 8px; }

  /* Forecast row: keep 4-col on tablet */
  .ff-frow { gap: 8px; margin-bottom: 10px; }
  .ff-fc { padding: 10px 12px; }
  .ff-fc-v { font-size: 20px; }
  .ff-fc-p { font-size: 9px; margin-bottom: 4px; }

  /* Tables: horizontal scroll, compact */
  .ff-dt { min-width: 600px; }
  .ff-dt th { padding: 6px 10px; font-size: 9px; }
  .ff-dt td { padding: 7px 10px; font-size: 12px; }

  /* Section headers: compact */
  .ff-sh { margin-bottom: 8px; }
  .ff-sh-t { font-size: 14px; }

  /* Filter chips: smaller */
  .ff-fbar { margin-bottom: 8px; }
  .ff-fchip { padding: 4px 10px; font-size: 11px; }

  /* Tabs: compact */
  .ff-tabs { margin-bottom: 10px; }
  .ff-tab { padding: 5px 12px; font-size: 12px; }

  /* Waterfall: compact */
  .ff-wf-row { gap: 7px; }
  .ff-wf-lbl { font-size: 10px; width: 60px; }
  .ff-wf-track { height: 22px; }
  .ff-wf-bar { font-size: 10px; }

  /* Accuracy rings: compact */
  .ff-acc-grid { gap: 14px; }
  .ff-ring-wrap { width: 52px; height: 52px; }
  .ff-ring-val { font-size: 11px; }
  .ff-acc-lbl { font-size: 12px; }

  /* Bottom bar: slim */
  .ff-mb { margin-bottom: 10px; }
}

/* ═══════════════════════════════════════════════
   PHONE (< 768px)
   ═══════════════════════════════════════════════ */
@media (max-width: 767px) {
  /* Topbar: minimal */
  .ff-topbar { padding: 8px 12px; flex-wrap: wrap; gap: 8px; }
  .ff-tb-title { font-size: 13px; }
  .ff-tb-right { gap: 6px; }
  .ff-btn { padding: 5px 10px; font-size: 11px; }

  /* Page: tight */
  .ff-page { padding: 12px; }

  /* Stat grid: 2x1 */
  .ff-sg { grid-template-columns: 1fr 1fr; gap: 8px; }
  .ff-sc { padding: 12px 14px; }
  .ff-sc-val { font-size: 20px; }
  .ff-sc-label { font-size: 9px; }

  /* Grids: single column */
  .ff-g2 { grid-template-columns: 1fr; }
  .ff-g6040 { grid-template-columns: 1fr; }

  /* Forecast row: single column */
  .ff-frow { flex-direction: column; }
  .ff-fc { flex: none; min-width: 0; }
  .ff-fc-v { font-size: 22px; }

  /* Narrative: compact */
  .ff-narr { padding: 12px 14px; }
  .ff-narr-head { font-size: 14px; }
  .ff-narr-body { font-size: 12px; }

  /* Cards: tighter */
  .ff-card { padding: 14px 16px; }
  .ff-card-title { font-size: 9.5px; }

  /* Tables: smaller min-width */
  .ff-dt { min-width: 500px; }
  .ff-dt td { padding: 8px 10px; font-size: 12px; }
  .ff-dt th { padding: 7px 10px; font-size: 9.5px; }

  /* Filter chips: smaller */
  .ff-fchip { padding: 4px 10px; font-size: 11px; }
  .ff-tabs { overflow-x: auto; }
  .ff-tab { padding: 5px 12px; font-size: 12px; white-space: nowrap; }

  /* Info banner: compact */
  .ff-ibanner { padding: 8px 12px; font-size: 11px; }

  /* Section header */
  .ff-sh { flex-wrap: wrap; gap: 4px; }
  .ff-sh-t { font-size: 15px; }

  /* Sidebar: full-width on phone */
  .ff-sidebar { width: 100%; }
  /* AI panel: full-width on phone */
  .ff-ai-panel { width: 100%; }

  /* Accuracy rings: compact */
  .ff-acc-grid { gap: 12px; }
  .ff-ring-wrap { width: 50px; height: 50px; }
  .ff-ring-val { font-size: 11px; }

  /* Week chips */
  .ff-wg { gap: 4px; }
  .ff-wchip { padding: 4px 10px; font-size: 11px; }

  /* Waterfall: tighter */
  .ff-wf-lbl { width: 55px; font-size: 10px; }
  .ff-wf-bar { font-size: 10px; padding: 0 6px; }
}
`

// ═══════════════════════════════════════════════════════
//  SVG CHART HELPERS
// ═══════════════════════════════════════════════════════

function SvgBarChart({
  data,
  height = 192,
  yMin,
  yMax,
  sets,
  yFmt,
}: {
  data: { label: string }[]
  height?: number
  yMin: number
  yMax: number
  sets: { label: string; values: number[]; color: string; borderColor: string }[]
  yFmt?: (v: number) => string
}) {
  const pad = { t: 28, r: 20, b: 28, l: 50 }
  const w = 600
  const h = height
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b
  const n = data.length
  const bw = Math.min(cw / n / (sets.length + 1), 22)
  const groupW = bw * sets.length + 4
  const range = yMax - yMin || 1
  const yScale = (v: number) => pad.t + ch - ((v - yMin) / range) * ch

  const gridLines = 5
  const gridStep = range / gridLines

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ff-svg-chart" style={{ height }}>
      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const val = yMin + gridStep * i
        const y = yScale(val)
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="rgba(0,0,0,0.03)" />
            <text x={pad.l - 8} y={y + 4} fill="#4A6585" fontSize="10" textAnchor="end" fontFamily="'JetBrains Mono',monospace">
              {yFmt ? yFmt(val) : val.toFixed(0)}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {data.map((d, di) => {
        const cx = pad.l + (cw / n) * (di + 0.5)
        return (
          <g key={di}>
            {sets.map((s, si) => {
              const bx = cx - groupW / 2 + si * (bw + 2)
              const val = s.values[di]
              const bh = Math.max(1, ((val - yMin) / range) * ch)
              const by = yScale(val)
              return <rect key={si} x={bx} y={by} width={bw} height={bh} fill={s.color} stroke={s.borderColor} strokeWidth={1.5} rx={3} />
            })}
            <text x={cx} y={h - 8} fill="#4A6585" fontSize="11" textAnchor="middle" fontFamily="'Inter',sans-serif">
              {d.label}
            </text>
          </g>
        )
      })}
      {/* Legend */}
      {sets.map((s, i) => (
        <g key={i} transform={`translate(${pad.l + i * 110}, 10)`}>
          <rect width={10} height={10} fill={s.color} rx={2} />
          <text x={14} y={9} fill="#8FA8C8" fontSize="10.5" fontFamily="'Inter',sans-serif">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function SvgLineChart({
  data,
  height = 192,
  yMin,
  yMax,
  lines,
  yFmt,
}: {
  data: { label: string }[]
  height?: number
  yMin: number
  yMax: number
  lines: { label: string; values: (number | null)[]; color: string; dash?: boolean; fill?: boolean }[]
  yFmt?: (v: number) => string
}) {
  const pad = { t: 28, r: 20, b: 28, l: 50 }
  const w = 600
  const h = height
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b
  const n = data.length
  const range = yMax - yMin || 1
  const xScale = (i: number) => pad.l + (cw / (n - 1)) * i
  const yScale = (v: number) => pad.t + ch - ((v - yMin) / range) * ch

  const gridLines = 5
  const gridStep = range / gridLines

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ff-svg-chart" style={{ height }}>
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const val = yMin + gridStep * i
        const y = yScale(val)
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="rgba(0,0,0,0.03)" />
            <text x={pad.l - 8} y={y + 4} fill="#4A6585" fontSize="10" textAnchor="end" fontFamily="'JetBrains Mono',monospace">
              {yFmt ? yFmt(val) : val.toFixed(0)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={h - 8} fill="#4A6585" fontSize="11" textAnchor="middle" fontFamily="'Inter',sans-serif">
          {d.label}
        </text>
      ))}
      {lines.map((line, li) => {
        const pts = line.values
          .map((v, i) => (v != null ? { x: xScale(i), y: yScale(v), v } : null))
          .filter(Boolean) as { x: number; y: number; v: number }[]
        if (pts.length < 2) return null
        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
        const fillPath = line.fill
          ? `${pathD} L${pts[pts.length - 1].x},${pad.t + ch} L${pts[0].x},${pad.t + ch} Z`
          : undefined
        return (
          <g key={li}>
            {fillPath && <path d={fillPath} fill={line.color.replace(")", ",0.08)").replace("rgb", "rgba")} />}
            <path d={pathD} fill="none" stroke={line.color} strokeWidth={2.5} strokeDasharray={line.dash ? "5 4" : undefined} />
            {!line.dash &&
              pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={line.color} stroke="#0A1628" strokeWidth={2} />
              ))}
          </g>
        )
      })}
      {lines.map((line, i) => (
        <g key={i} transform={`translate(${pad.l + i * 110}, 10)`}>
          <line x1={0} x2={12} y1={5} y2={5} stroke={line.color} strokeWidth={2} strokeDasharray={line.dash ? "3 2" : undefined} />
          <text x={16} y={9} fill="#8FA8C8" fontSize="10.5" fontFamily="'Inter',sans-serif">
            {line.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function SvgHBarChart({
  labels,
  sets,
  height = 240,
}: {
  labels: string[]
  sets: { label: string; values: number[]; color: string; borderColor: string }[]
  height?: number
}) {
  const pad = { t: 28, r: 30, b: 10, l: 85 }
  const w = 600
  const h = height
  const ch = h - pad.t - pad.b
  const n = labels.length
  const allVals = sets.flatMap((s) => s.values)
  const absMax = Math.max(...allVals.map(Math.abs), 0.1)
  const barH = Math.min(ch / n / (sets.length + 0.5), 14)
  const groupH = barH * sets.length + 4
  const midX = pad.l + (w - pad.l - pad.r) / 2
  const xScale = (v: number) => (v / absMax) * ((w - pad.l - pad.r) / 2)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ff-svg-chart" style={{ height }}>
      <line x1={midX} x2={midX} y1={pad.t} y2={h - pad.b} stroke="rgba(255,255,255,0.1)" />
      {labels.map((lbl, li) => {
        const cy = pad.t + (ch / n) * (li + 0.5)
        return (
          <g key={li}>
            <text x={pad.l - 8} y={cy + 4} fill="#8FA8C8" fontSize="11" textAnchor="end" fontFamily="'Inter',sans-serif">
              {lbl}
            </text>
            {sets.map((s, si) => {
              const val = s.values[li]
              const bw = Math.abs(xScale(val))
              const by = cy - groupH / 2 + si * (barH + 1)
              const bx = val >= 0 ? midX : midX - bw
              return bw > 0.5 ? (
                <rect key={si} x={bx} y={by} width={bw} height={barH} fill={s.color} stroke={s.borderColor} strokeWidth={1} rx={2} />
              ) : null
            })}
          </g>
        )
      })}
      {/* Legend */}
      {sets.map((s, i) => (
        <g key={i} transform={`translate(${pad.l + i * 80}, 10)`}>
          <rect width={10} height={10} fill={s.color} rx={2} />
          <text x={14} y={9} fill="#8FA8C8" fontSize="10" fontFamily="'Inter',sans-serif">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════

export default function FormFactorPage() {
  const [page, setPage] = useState<PageId>("exec")
  const [periodIdx, setPeriodIdx] = useState(0)
  const [trendSeg, setTrendSeg] = useState<TrendSeg>("All Segments")
  const [avfKey, setAvfKey] = useState<AvfKey>("product")
  const [drvSeg, setDrvSeg] = useState<TrendSeg>("All Segments")
  const [selB, setSelB] = useState(6)
  const [selC, setSelC] = useState(7)

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<{role: "user"|"ai"; text: string}[]>([
    { role: "ai", text: "<strong>Meeru AI</strong> — ready to assist.<br><br>I have context on W8 margin data across all segments and drivers. Ask me about variances, forecasts, or drill into specific segments." },
  ])
  const [aiInput, setAiInput] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [insightCollapsed, setInsightCollapsed] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)
  const aiTypingRef = useRef<ReturnType<typeof setTimeout>>()

  const WEEKS = WD_ALL.map((d) => d.w)
  const SEGMENTS: TrendSeg[] = ["All Segments", "North America", "APAC", "EMEA", "LatAm"]

  const sidebarItems: { group: string; items: { id: PageId; icon: string; label: string }[] }[] = [
    {
      group: "Overview",
      items: [
        { id: "exec", icon: "◈", label: "Executive View" },
        { id: "trend", icon: "⟋", label: "Trending Report" },
      ],
    },
    {
      group: "Analysis",
      items: [
        { id: "actfcst", icon: "⊞", label: "Actual vs Forecast" },
        { id: "drivers", icon: "⬡", label: "Driver Analytics" },
        { id: "compare", icon: "⇄", label: "Period Comparison" },
      ],
    },
    {
      group: "Forward View",
      items: [{ id: "forward", icon: "◎", label: "Margin Forecast" }],
    },
  ]

  const pillClass = (c: string) => {
    if (c === "High") return "ph"
    if (c === "Medium") return "pm"
    return "pl"
  }

  const fmtDelta = (v: number) => {
    if (v === 0) return { cls: "num", text: "0.0" }
    return { cls: v > 0 ? "up" : "dn", text: `${v > 0 ? "+" : ""}${v.toFixed(1)}` }
  }

  // ── AI Chat logic ──
  const generateAiResponse = useCallback((query: string): string => {
    const q = query.toLowerCase()

    if (q.includes("margin") && (q.includes("compress") || q.includes("w8") || q.includes("drop") || q.includes("dip"))) {
      return "W8 blended standard margin compressed <strong>130bps</strong> to <strong>31.3%</strong> from W7's 32.6%. The primary driver is an unfavorable <strong>mix shift of –$1.8M</strong> — APAC volume grew disproportionately this week, pulling the blended margin down. Volume was strong at +$2.3M, but it skewed toward lower-margin Infrastructure SKUs. A secondary <strong>cost headwind of –$0.6M</strong> persists, largely proxy-estimated for Product Group B. Price realization held flat at +$0.1M."
    }

    if (q.includes("apac")) {
      return "APAC is the <strong>lowest-margin segment</strong> in the portfolio at <strong>26.1%</strong> in W8 (vs 28.5% forecast — a <strong>240bps miss</strong>). It recovered slightly from the W7 trough of 24.4%, but remains volatile. Revenue grew strongly (+26% W1→W8) to <strong>$18.4M</strong>, but cost data for <strong>6 SKUs is proxy-estimated</strong> via v2.3 — actual cost may be worse than reported. APAC's outsized volume growth is the primary reason blended margin compressed in W8."
    }

    if (q.includes("na") || q.includes("north america")) {
      return "North America delivered its <strong>strongest revenue week at $22.1M</strong> in W8, but margin pulled back <strong>120bps</strong> from W7's peak of 37.4% to <strong>36.2%</strong>. The dip is primarily cost-driven — a one-time <strong>freight accrual adjustment</strong> inflated cost by ~$0.7M. Excluding the accrual, underlying margin would be ~<strong>37.1%</strong>, which is above forecast of 37.8%. NA has the <strong>highest confidence</strong> data quality across all segments."
    }

    if (q.includes("emea")) {
      return "EMEA posted a steady improvement arc through W6 (quarter high: <strong>35.4%</strong>), then softened in W7–W8. The W8 margin of <strong>33.8%</strong> is almost entirely explained by one large Professional Services deal at <strong>~28% margin</strong> that closed late in the week. Excluding that deal, EMEA underlying margin was <strong>35.1%</strong> — above the 34.2% forecast. EMEA is the <strong>most consistent performer</strong> with margin held in the 33–35% band all quarter."
    }

    if (q.includes("forecast") || q.includes("plan") || q.includes("track")) {
      return "Q2 QTD standard margin stands at <strong>31.4%</strong>, tracking <strong>90bps below Q2 plan</strong>. Revenue growth has been consistent W1–W8 (+18.7% cumulative) but cost is growing faster. The forward forecast projects: <strong>Q2 remaining: 32.1%</strong> (High confidence, range 30.8–33.4%), <strong>Q3: 33.6%</strong> (Medium, range 31.2–36.0%), <strong>Q4: 34.8%</strong> (Low, range 30.1–39.5%). The Q2 exit rate needs to recover ~90bps to hit plan, which requires APAC cost confirmation and mix normalization."
    }

    if (q.includes("cost") || q.includes("driver")) {
      return "The four margin drivers in W8 vs W7: <strong>Volume +$2.3M</strong> (positive — total shipments grew), <strong>Mix –$1.8M</strong> (negative — shift toward lower-margin APAC and Infrastructure SKUs), <strong>Price +$0.1M</strong> (flat), <strong>Cost –$0.6M</strong> (negative — proxy-estimated for Group B). The <strong>mix shift is the dominant headwind</strong>. Group B Infrastructure missed revenue by $1.4M and margin by 270bps vs plan, with 4 SKUs on proxy cost."
    }

    if (q.includes("risk") || q.includes("concern") || q.includes("watch")) {
      return "Key risks to monitor for W9:<br><br>1. <strong>APAC proxy data</strong> — 6 SKUs still on Proxy v2.3. Actual costs may be worse than the 26.1% margin reported. Wait for EDW confirmation.<br>2. <strong>Group B cost uncertainty</strong> — 4 SKUs lack standard cost data. The –270bps miss could widen.<br>3. <strong>Mix normalization</strong> — If APAC volume stays elevated, blended margin will stay compressed. Need NA/EMEA to grow proportionally.<br>4. <strong>LatAm proxy dependency</strong> — ~60% of cost base is estimated. Treat margin data as directional only."
    }

    if (q.includes("proxy")) {
      return "Proxy v2.3 is the cost estimation model used when standard cost data is unavailable. Current coverage:<br><br>• <strong>APAC</strong>: 6 SKUs on proxy (38% of APAC volume) — 84% historical accuracy<br>• <strong>LatAm</strong>: ~60% of cost base is proxy-estimated — 76% accuracy<br>• <strong>Group B Infrastructure</strong>: 4 SKUs lack standard cost — Medium confidence<br>• <strong>Group D Managed Svcs</strong>: No W8 actuals, forward-fill applied — Low confidence<br><br>Proxy limitations: Cannot capture one-time cost events (e.g., freight accruals). Tends to understate cost in volatile periods."
    }

    if (q.includes("group b") || q.includes("infrastructure")) {
      return "Group B — Infrastructure is the <strong>primary forecast miss</strong> in W8: <strong>–$1.4M revenue</strong> and <strong>–270bps margin</strong> vs plan. Margin came in at 27.4% vs 30.1% forecast. 4 SKUs lack standard cost data and use Proxy v2.3 estimates, limiting confidence. The mix shift toward Infrastructure SKUs in APAC is compounding the issue — this is the <strong>single largest drag</strong> on blended margin this week."
    }

    if (q.includes("best") || q.includes("peak") || q.includes("high")) {
      return "The quarter margin peak was <strong>W6 at 32.8%</strong> for All Segments. By segment: NA peaked at <strong>37.7% in W6</strong>, APAC at <strong>27.5% in W5</strong>, EMEA at <strong>35.4% in W6</strong>, and LatAm at <strong>30.9% in W6</strong>. W6 was broadly the best week across segments before the W7–W8 deterioration driven by mix shift and cost pressures."
    }

    if (q.includes("recover") || q.includes("gap") || q.includes("scenario")) {
      return "To recover the <strong>90bps gap</strong> to Q2 plan, three scenarios:<br><br>1. <strong>Base case</strong> (60% probability): Mix normalizes as NA/EMEA grow. Exit Q2 at ~32.1%. Gap narrows to ~50bps.<br>2. <strong>Bull case</strong> (25%): APAC proxy costs confirmed lower than estimated + Group B actuals beat. Could exit at ~33.0%, closing the gap.<br>3. <strong>Bear case</strong> (15%): APAC proxy underestimates persist + LatAm data stays unreliable. Exit at ~31.0%, widening the gap to ~150bps.<br><br>Key lever: <strong>Confirm APAC standard costs</strong> — this alone could shift the base case by ±60bps."
    }

    // Default contextual summary
    return `Here is the current W8 snapshot for <strong>${PAGE_TITLES[page]}</strong>:<br><br>• Blended margin: <strong>31.3%</strong> (–130bps WoW, –90bps vs plan)<br>• Revenue: <strong>$57.2M</strong> (+4.2% WoW)<br>• Standard cost: <strong>$39.3M</strong> (+6.1% WoW — unfavorable)<br>• Forecast gap: <strong>–$1.2M</strong><br><br>The dominant story is mix shift — APAC and Infrastructure volume grew faster than higher-margin segments. Ask me about any specific segment, driver, or the forward outlook.`
  }, [page])

  const handleAiSend = useCallback(() => {
    const text = aiInput.trim()
    if (!text || isAiTyping) return

    setAiMessages((prev) => [...prev, { role: "user", text }])
    setAiInput("")
    setIsAiTyping(true)

    if (aiTypingRef.current) clearTimeout(aiTypingRef.current)
    aiTypingRef.current = setTimeout(() => {
      const response = generateAiResponse(text)
      setAiMessages((prev) => [...prev, { role: "ai", text: response }])
      setIsAiTyping(false)
    }, 800)
  }, [aiInput, isAiTyping, generateAiResponse])

  const handleAiKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAiSend()
    }
  }, [handleAiSend])

  const handleSuggestionClick = useCallback((s: string) => {
    if (isAiTyping) return
    setAiMessages((prev) => [...prev, { role: "user", text: s }])
    setIsAiTyping(true)

    if (aiTypingRef.current) clearTimeout(aiTypingRef.current)
    aiTypingRef.current = setTimeout(() => {
      const response = generateAiResponse(s)
      setAiMessages((prev) => [...prev, { role: "ai", text: response }])
      setIsAiTyping(false)
    }, 800)
  }, [isAiTyping, generateAiResponse])

  const suggestions = useMemo(() => {
    const map: Record<PageId, string[]> = {
      exec: ["Why did margin compress in W8?", "Which segment is most at risk?", "What should we watch for W9?"],
      trend: ["Show APAC trend analysis", "When was margin peak this quarter?", "Is the compression accelerating?"],
      actfcst: ["Which product group missed forecast most?", "Why is Group B underperforming?", "Is Group D data reliable?"],
      drivers: ["What is the biggest margin headwind?", "Explain the mix shift impact", "Is the cost pressure structural?"],
      compare: ["How did margin change W7 to W8?", "Which week was best this quarter?"],
      forward: ["What is the Q2 exit rate forecast?", "Can we recover the margin gap?", "What scenarios should we plan for?"],
    }
    return map[page]
  }, [page])

  // Scroll AI messages to bottom on new messages
  useEffect(() => {
    if (aiRef.current) {
      aiRef.current.scrollTop = aiRef.current.scrollHeight
    }
  }, [aiMessages, isAiTyping])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTypingRef.current) clearTimeout(aiTypingRef.current)
    }
  }, [])

  // ── Waterfall component ──
  const Waterfall = ({ items }: { items: BridgeItem[] }) => {
    const maxV = Math.max(...items.map((x) => Math.abs(x.v)))
    return (
      <div className="ff-wf">
        {items.map((x, i) => {
          const p = x.t === "base" ? 62 : Math.min((Math.abs(x.v) / maxV) * 62, 62)
          const lbl = x.t === "base" ? `$${x.v}M` : x.v > 0 ? `+$${x.v}M` : `–$${Math.abs(x.v)}M`
          return (
            <div key={i} className="ff-wf-row">
              <div className="ff-wf-lbl">{x.l}</div>
              <div className="ff-wf-track">
                <div className={`ff-wf-bar ${x.t}`} style={{ width: `${p}%` }}>
                  {lbl}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ═════════════════════════════════════════════════════
  //  RENDER PAGE CONTENT
  // ═════════════════════════════════════════════════════

  const renderExec = () => {
    const d = WD_ALL
    return (
      <>
        <div className="ff-ibanner">
          <span className="ff-ibanner-ico">ℹ</span>
          Outputs optimized for directional insight. Proxy-derived figures carry confidence labels. Not for audit or statutory reporting.
        </div>
        <div className="ff-narr">
          <div className="ff-narr-toggle" onClick={() => setInsightCollapsed(!insightCollapsed)}>
            <div className="ff-narr-chip">✦ AI Insight</div>
            <button className="ff-narr-toggle-btn" type="button">
              {insightCollapsed ? "Show ▾" : "Hide ▴"}
            </button>
          </div>
          <div className={`ff-narr-content ${insightCollapsed ? "collapsed" : "expanded"}`}>
          <div className="ff-narr-head">
            Revenue grew +4.2% week-over-week, but standard margin compressed 130bps — driven by an unfavorable mix shift toward lower-margin APAC accounts.
          </div>
          <div className="ff-narr-body">
            <strong>Volume (+$2.3M)</strong> was the largest positive driver as total shipments grew. <strong>Mix (–$1.8M)</strong> offset this as
            high-margin North America products underperformed their forecast share. <strong>Price realization</strong> held flat. A{" "}
            <strong>Cost headwind of –$0.6M</strong> persists, largely proxy-estimated for Product Group B. Q2 QTD standard margin stands at{" "}
            <strong>31.4%</strong>, tracking 90bps below Q2 plan.
          </div>
          </div>
        </div>

        <div className="ff-sg">
          <div className="ff-sc t">
            <div className="ff-sc-label">Std. Margin % · WTD</div>
            <div className="ff-sc-val teal">31.4%</div>
            <div className="ff-sc-delta ff-dn">▼ 1.3pp vs prior week</div>
            <div style={{ marginTop: 8 }}><span className="ff-pill ph">High Confidence</span></div>
          </div>
          <div className="ff-sc n">
            <div className="ff-sc-label">Revenue · WTD Actuals</div>
            <div className="ff-sc-val navy">$57.2M</div>
            <div className="ff-sc-delta ff-up">▲ +4.2% vs W7</div>
            <div style={{ marginTop: 8 }}><span className="ff-src-tag">ACTUALS</span></div>
          </div>
          <div className="ff-sc r">
            <div className="ff-sc-label">Std. Cost · WTD</div>
            <div className="ff-sc-val red">$39.3M</div>
            <div className="ff-sc-delta ff-dn">▲ +6.1% vs W7 (unfav)</div>
            <div style={{ marginTop: 8 }}><span className="ff-pill pm">Mixed Confidence</span></div>
          </div>
          <div className="ff-sc a">
            <div className="ff-sc-label">Forecast vs Actual Gap</div>
            <div className="ff-sc-val amber">–$1.2M</div>
            <div className="ff-sc-delta ff-dn">Below forecast by 2.1%</div>
            <div style={{ marginTop: 8 }}><span className="ff-src-tag">FORECAST</span></div>
          </div>
        </div>

        <div className="ff-g6040">
          <div className="ff-card">
            <div className="ff-card-title">Standard Margin % — Q2 Weekly Trend</div>
            <SvgLineChart
              data={d.map((x) => ({ label: x.w }))}
              yMin={30}
              yMax={34}
              lines={[
                { label: "Actual %", values: d.map((x) => x.margin), color: "#1E40AF", fill: true },
                { label: "Forecast %", values: d.map((x) => x.fcst), color: "rgba(30,64,175,0.35)", dash: true },
              ]}
              yFmt={(v) => v + "%"}
            />
          </div>
          <div className="ff-card">
            <div className="ff-card-title">Top 3 Drivers · W7 → W8</div>
            <Waterfall
              items={[
                { l: "Volume", v: 2.3, t: "pos" },
                { l: "Mix", v: -1.8, t: "neg" },
                { l: "Cost", v: -0.6, t: "neg" },
              ]}
            />
          </div>
        </div>

        <div className="ff-sh">
          <div>
            <div className="ff-sh-t">Segment Snapshot</div>
            <div className="ff-sh-s">Revenue &amp; margin by market segment — W8</div>
          </div>
          <div className="ff-sh-a" onClick={() => setPage("actfcst")}>Full breakdown →</div>
        </div>
        <div className="ff-card overflow-x-auto">
          <table className="ff-dt" style={{ minWidth: 700 }}>
            <thead>
              <tr><th>Segment</th><th>Revenue WTD</th><th>Std. Margin %</th><th>vs Prior Week</th><th>vs Forecast</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              <tr><td className="bold">North America</td><td className="num">$22.1M</td><td className="up">36.2%</td><td className="dn">▼ –0.8pp</td><td className="dn">–$0.4M</td><td><span className="ff-pill ph">High</span></td></tr>
              <tr><td className="bold">APAC</td><td className="num">$18.4M</td><td className="dn">26.1%</td><td className="dn">▼ –3.2pp</td><td className="dn">–$0.9M</td><td><span className="ff-pill pm">Medium</span></td></tr>
              <tr><td className="bold">EMEA</td><td className="num">$11.3M</td><td className="up">33.8%</td><td className="up">▲ +1.1pp</td><td className="up">+$0.2M</td><td><span className="ff-pill ph">High</span></td></tr>
              <tr><td className="bold">LatAm</td><td className="num">$5.4M</td><td className="ff-nt">29.4%</td><td className="dn">▼ –0.3pp</td><td className="dn">–$0.1M</td><td><span className="ff-pill pl">Low</span> <span className="ff-proxy-note" title="Proxy v2.3 applied">ⓘ proxy</span></td></tr>
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderTrend = () => {
    const d = TREND_DATA[trendSeg]
    const yr = TREND_YRANGE[trendSeg]
    const narr = TREND_NARR[trendSeg]

    return (
      <>
        <div className="ff-sh">
          <div><div className="ff-sh-t">Trending Report</div><div className="ff-sh-s">Q2 2025 — {trendSeg} — revenue, cost &amp; standard margin</div></div>
          <div className="ff-sh-a">⬇ Export CSV</div>
        </div>
        <div className="ff-fbar">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Dimension:</span>
          {SEGMENTS.map((s) => (
            <button key={s} className={`ff-fchip ${trendSeg === s ? "active" : ""}`} onClick={() => setTrendSeg(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="ff-narr">
          <div className="ff-narr-toggle" onClick={() => setInsightCollapsed(!insightCollapsed)}>
            <div className="ff-narr-chip">✦ AI Insight</div>
            <button className="ff-narr-toggle-btn" type="button">
              {insightCollapsed ? "Show ▾" : "Hide ▴"}
            </button>
          </div>
          <div className={`ff-narr-content ${insightCollapsed ? "collapsed" : "expanded"}`}>
          <div className="ff-narr-head">{narr.head}</div>
          <div className="ff-narr-body" dangerouslySetInnerHTML={{ __html: narr.body }} />
          </div>
        </div>
        <div className="ff-card ff-mb">
          <div className="ff-card-title">Revenue vs Standard Cost — {trendSeg} — Q2 Weekly ($M)</div>
          <SvgBarChart
            data={d.map((x) => ({ label: x.w }))}
            height={215}
            yMin={Math.min(...d.map((x) => Math.min(x.cost, x.rev))) * 0.9}
            yMax={Math.max(...d.map((x) => x.rev)) * 1.05}
            sets={[
              { label: "Revenue ($M)", values: d.map((x) => x.rev), color: "rgba(30,64,175,0.18)", borderColor: "#1E40AF" },
              { label: "Std Cost ($M)", values: d.map((x) => x.cost), color: "rgba(220,38,38,0.13)", borderColor: "rgba(220,38,38,0.55)" },
            ]}
            yFmt={(v) => "$" + v.toFixed(0) + "M"}
          />
        </div>
        <div className="ff-card ff-mb">
          <div className="ff-card-title">Standard Margin % — {trendSeg} — Weekly Trend with Forecast Overlay</div>
          <SvgLineChart
            data={d.map((x) => ({ label: x.w }))}
            height={195}
            yMin={yr.min}
            yMax={yr.max}
            lines={[
              { label: "Actual %", values: d.map((x) => x.margin), color: "#1E40AF", fill: true },
              { label: "Forecast %", values: d.map((x) => x.fcst), color: "#60a5fa", dash: true },
            ]}
            yFmt={(v) => v + "%"}
          />
        </div>
        <div className="ff-card overflow-x-auto">
          <table className="ff-dt" style={{ minWidth: 800 }}>
            <thead><tr><th>Week</th><th>Revenue ($M)</th><th>Std Cost ($M)</th><th>Std Margin ($M)</th><th>Margin %</th><th>WoW Δ pp</th><th>Fcst Margin %</th><th>Gap pp</th></tr></thead>
            <tbody>
              {d.map((x, i) => {
                const sm = (x.rev - x.cost).toFixed(1)
                const wow = i > 0 ? (x.margin - d[i - 1].margin).toFixed(1) : null
                const gap = (x.margin - x.fcst).toFixed(1)
                return (
                  <tr key={x.w}>
                    <td className="bold">{x.w}</td>
                    <td className="num">${x.rev}M</td>
                    <td className="num">${x.cost}M</td>
                    <td className="num">${sm}M</td>
                    <td className="num">{x.margin}%</td>
                    <td className={wow === null ? "ff-nt" : parseFloat(wow) >= 0 ? "up" : "dn"}>
                      {wow === null ? "—" : `${parseFloat(wow) >= 0 ? "+" : ""}${wow}pp`}
                    </td>
                    <td className="num">{x.fcst}%</td>
                    <td className={parseFloat(gap) >= 0 ? "up" : "dn"}>{parseFloat(gap) >= 0 ? "+" : ""}{gap}pp</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderAvf = () => {
    const data = AVF[avfKey]
    const narr = AVF_NARR[avfKey]
    const labs = data.map((d) =>
      d.dim
        .split("—")[0]
        .split("·")[0]
        .trim()
        .split(" ")
        .slice(0, 3)
        .join(" ")
    )
    const revMin = Math.min(...data.map((d) => Math.min(d.ra, d.rf))) * 0.85
    const revMax = Math.max(...data.map((d) => Math.max(d.ra, d.rf))) * 1.1
    const mrgMin = Math.min(...data.map((d) => Math.min(d.ma, d.mf))) - 4
    const mrgMax = Math.max(...data.map((d) => Math.max(d.ma, d.mf))) + 4

    return (
      <>
        <div className="ff-sh">
          <div><div className="ff-sh-t">Actual vs. Forecast</div><div className="ff-sh-s">Revenue, cost &amp; margin comparison — By {AVFH[avfKey]} — W8</div></div>
        </div>
        <div className="ff-tabs">
          {(["product", "customer", "segment"] as AvfKey[]).map((k) => (
            <button key={k} className={`ff-tab ${avfKey === k ? "active" : ""}`} onClick={() => setAvfKey(k)}>
              By {AVFH[k]}
            </button>
          ))}
        </div>
        <div className="ff-narr">
          <div className="ff-narr-toggle" onClick={() => setInsightCollapsed(!insightCollapsed)}>
            <div className="ff-narr-chip">✦ AI Insight</div>
            <button className="ff-narr-toggle-btn" type="button">
              {insightCollapsed ? "Show ▾" : "Hide ▴"}
            </button>
          </div>
          <div className={`ff-narr-content ${insightCollapsed ? "collapsed" : "expanded"}`}>
          <div className="ff-narr-head">{narr.head}</div>
          <div className="ff-narr-body" dangerouslySetInnerHTML={{ __html: narr.body }} />
          </div>
        </div>
        <div className="ff-g2">
          <div className="ff-card">
            <div className="ff-card-title">Revenue — Actual vs Forecast ($M)</div>
            <SvgBarChart
              data={labs.map((l) => ({ label: l }))}
              height={205}
              yMin={revMin}
              yMax={revMax}
              sets={[
                { label: "Actual", values: data.map((d) => d.ra), color: "rgba(30,64,175,0.18)", borderColor: "#1E40AF" },
                { label: "Forecast", values: data.map((d) => d.rf), color: "rgba(79,195,247,0.15)", borderColor: "#60a5fa" },
              ]}
              yFmt={(v) => "$" + v.toFixed(0) + "M"}
            />
          </div>
          <div className="ff-card">
            <div className="ff-card-title">Margin % — Actual vs Forecast</div>
            <SvgBarChart
              data={labs.map((l) => ({ label: l }))}
              height={205}
              yMin={mrgMin}
              yMax={mrgMax}
              sets={[
                { label: "Actual %", values: data.map((d) => d.ma), color: "rgba(30,64,175,0.18)", borderColor: "#1E40AF" },
                { label: "Forecast %", values: data.map((d) => d.mf), color: "rgba(79,195,247,0.15)", borderColor: "#60a5fa" },
              ]}
              yFmt={(v) => v.toFixed(0) + "%"}
            />
          </div>
        </div>
        <div className="ff-card overflow-x-auto">
          <table className="ff-dt" style={{ minWidth: 800 }}>
            <thead><tr><th>{AVFH[avfKey]}</th><th>Rev Actual</th><th>Rev Fcst</th><th>Rev Gap</th><th>Margin Act.</th><th>Margin Fcst</th><th>Margin Gap</th><th>Confidence</th></tr></thead>
            <tbody>
              {data.map((d) => {
                const rg = (d.ra - d.rf).toFixed(1)
                const mg = (d.ma - d.mf).toFixed(1)
                return (
                  <tr key={d.dim}>
                    <td className="bold">{d.dim}</td>
                    <td className="num">${d.ra}M</td>
                    <td className="num">${d.rf}M</td>
                    <td className={parseFloat(rg) >= 0 ? "up" : "dn"}>{parseFloat(rg) >= 0 ? "+" : ""}${rg}M</td>
                    <td className="num">{d.ma}%</td>
                    <td className="num">{d.mf}%</td>
                    <td className={parseFloat(mg) >= 0 ? "up" : "dn"}>{parseFloat(mg) >= 0 ? "+" : ""}{mg}pp</td>
                    <td><span className={`ff-pill ${pillClass(d.c)}`}>{d.c}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderDrivers = () => {
    const ds = DRV_DATA[drvSeg]
    const rows = DRV_ROWS[drvSeg]
    const confLabel: Record<string, string> = { ph: "High", pm: "Medium", pl: "Low" }

    return (
      <>
        <div className="ff-sh">
          <div><div className="ff-sh-t">Driver Analytics</div><div className="ff-sh-s">Margin variance decomposition: Price · Mix · Volume · Cost</div></div>
        </div>
        <div className="ff-fbar">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Segment:</span>
          {SEGMENTS.map((s) => (
            <button key={s} className={`ff-fchip ${drvSeg === s ? "active" : ""}`} onClick={() => setDrvSeg(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="ff-narr">
          <div className="ff-narr-toggle" onClick={() => setInsightCollapsed(!insightCollapsed)}>
            <div className="ff-narr-chip">✦ AI Insight</div>
            <button className="ff-narr-toggle-btn" type="button">
              {insightCollapsed ? "Show ▾" : "Hide ▴"}
            </button>
          </div>
          <div className={`ff-narr-content ${insightCollapsed ? "collapsed" : "expanded"}`}>
          <div className="ff-narr-head">{DRV_HEADS[drvSeg]}</div>
          <div className="ff-narr-body" dangerouslySetInnerHTML={{ __html: ds.narr }} />
          </div>
        </div>
        <div className="ff-g2">
          <div className="ff-card">
            <div className="ff-card-title">Margin Bridge — W7 → W8 ($M)</div>
            <Waterfall items={ds.bridge} />
          </div>
          <div className="ff-card">
            <div className="ff-card-title">Driver Contribution by Segment</div>
            <SvgHBarChart
              labels={["N. America", "APAC", "EMEA", "LatAm"]}
              height={240}
              sets={[
                { label: "Price", values: ds.seg.price, color: "rgba(30,64,175,0.30)", borderColor: "#1E40AF" },
                { label: "Mix", values: ds.seg.mix, color: "rgba(220,38,38,0.20)", borderColor: "#dc2626" },
                { label: "Volume", values: ds.seg.volume, color: "rgba(79,195,247,0.20)", borderColor: "#60a5fa" },
                { label: "Cost", values: ds.seg.cost, color: "rgba(217,119,6,0.20)", borderColor: "#d97706" },
              ]}
            />
          </div>
        </div>
        <div className="ff-card overflow-x-auto">
          <div className="ff-card-title">{drvSeg === "All Segments" ? "Driver Detail — Product Group Breakdown" : `Driver Detail — ${drvSeg} by Product Line`}</div>
          <table className="ff-dt" style={{ minWidth: 800 }}>
            <thead><tr><th>Product Group</th><th>Price Δ ($M)</th><th>Mix Δ ($M)</th><th>Volume Δ ($M)</th><th>Cost Δ ($M)</th><th>Net Margin Δ ($M)</th><th>Confidence</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const net = (r.price + r.mix + r.vol + r.cost).toFixed(1)
                const d = fmtDelta
                return (
                  <tr key={r.g}>
                    <td className="bold">{r.g}</td>
                    <td className={d(r.price).cls}>{d(r.price).text}</td>
                    <td className={d(r.mix).cls}>{d(r.mix).text}</td>
                    <td className={d(r.vol).cls}>{d(r.vol).text}</td>
                    <td className={d(r.cost).cls}>{d(r.cost).text}</td>
                    <td className={parseFloat(net) >= 0 ? "up" : "dn"}>{parseFloat(net) >= 0 ? "+" : ""}{net}</td>
                    <td>
                      <span className={`ff-pill ${r.conf}`}>{confLabel[r.conf]}</span>
                      {r.proxy && <span className="ff-proxy-note" title={String(r.proxy)} style={{ marginLeft: 6 }}>ⓘ proxy</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderCompare = () => {
    const B = WD_ALL[selB]
    const C = WD_ALL[selC]
    const rv = (C.rev - B.rev).toFixed(1)
    const mc = (C.margin - B.margin).toFixed(1)
    const cc = (C.cost - B.cost).toFixed(1)
    const rvUp = parseFloat(rv) >= 0
    const mcUp = parseFloat(mc) >= 0
    const ccUp = parseFloat(cc) <= 0

    let insight: string
    if (rvUp && !mcUp) insight = `${C.w} grew revenue $${Math.abs(parseFloat(rv))}M but margin compressed ${Math.abs(parseFloat(mc))}pp — cost grew faster, consistent with mix shift toward lower-margin segments.`
    else if (rvUp && mcUp) insight = `${C.w} is a strong week — both revenue (+$${rv}M) and margin (+${mc}pp) improved. Volume growth skewed toward higher-margin product groups.`
    else if (!rvUp && !mcUp) insight = `${C.w} was a softer week — revenue declined $${Math.abs(parseFloat(rv))}M and margin compressed ${Math.abs(parseFloat(mc))}pp. Mix and cost both moved unfavorably.`
    else insight = `${C.w} revenue declined $${Math.abs(parseFloat(rv))}M but margin expanded ${mc}pp — lower volume concentrated in higher-margin products. Quality over quantity week.`

    const cmpRows = [
      { lbl: "Revenue ($M)", bv: B.rev, cv: C.rev, dir: 1 },
      { lbl: "Std Cost ($M)", bv: B.cost, cv: C.cost, dir: -1 },
      { lbl: "Std Margin ($M)", bv: +(B.rev - B.cost).toFixed(1), cv: +(C.rev - C.cost).toFixed(1), dir: 1 },
      { lbl: "Margin %", bv: B.margin, cv: C.margin, dir: 1 },
      { lbl: "Fcst Margin %", bv: B.fcst, cv: C.fcst, dir: 1 },
      { lbl: "Fcst vs Actual Gap pp", bv: +(B.margin - B.fcst).toFixed(1), cv: +(C.margin - C.fcst).toFixed(1), dir: 1 },
    ]

    const barData = [
      { label: "Revenue", bv: B.rev, cv: C.rev },
      { label: "Std Cost", bv: B.cost, cv: C.cost },
      { label: "Std Margin", bv: +(B.rev - B.cost).toFixed(1), cv: +(C.rev - C.cost).toFixed(1) },
    ]
    const barMin = Math.min(...barData.flatMap((d) => [d.bv, d.cv])) * 0.8
    const barMax = Math.max(...barData.flatMap((d) => [d.bv, d.cv])) * 1.1

    return (
      <>
        <div className="ff-sh">
          <div><div className="ff-sh-t">Period Comparison</div><div className="ff-sh-s">Select any two weeks in Q2 2025 — results generate instantly</div></div>
        </div>
        <div className="ff-card ff-mb" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div className="ff-card-title" style={{ color: "var(--teal)", marginBottom: 9 }}>Base Week</div>
              <div className="ff-wg">
                {WEEKS.map((w, i) => (
                  <button key={w} className={`ff-wchip ${selB === i ? "sel" : ""}`} onClick={() => setSelB(i)}>{w}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="ff-card-title" style={{ color: "var(--amber)", marginBottom: 9 }}>Compare Week</div>
              <div className="ff-wg">
                {WEEKS.map((w, i) => (
                  <button key={w} className={`ff-wchip ${selC === i ? "cmp" : ""}`} onClick={() => setSelC(i)}>{w}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ff-g2">
          <div className="ff-card">
            <div className="ff-card-title">Side-by-Side — Revenue &amp; Margin</div>
            <SvgBarChart
              data={barData.map((d) => ({ label: d.label }))}
              height={205}
              yMin={barMin}
              yMax={barMax}
              sets={[
                { label: B.w, values: barData.map((d) => d.bv), color: "rgba(30,64,175,0.18)", borderColor: "#1E40AF" },
                { label: C.w, values: barData.map((d) => d.cv), color: "rgba(79,195,247,0.15)", borderColor: "#60a5fa" },
              ]}
            />
          </div>
          <div className="ff-card">
            <div className="ff-card-title">Comparison Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 3 }}>
              <div className="ff-cmp-row">
                <span className="ff-cmp-lbl">Revenue Change</span>
                <span className="ff-cmp-val" style={{ color: rvUp ? "var(--green)" : "var(--red)" }}>{rvUp ? "+" : ""}${rv}M ({((parseFloat(rv) / B.rev) * 100).toFixed(1)}%)</span>
              </div>
              <div className="ff-cmp-row">
                <span className="ff-cmp-lbl">Margin % Change</span>
                <span className="ff-cmp-val" style={{ color: mcUp ? "var(--green)" : "var(--red)" }}>{mcUp ? "+" : ""}{mc}pp</span>
              </div>
              <div className="ff-cmp-row">
                <span className="ff-cmp-lbl">Cost Change</span>
                <span className="ff-cmp-val" style={{ color: ccUp ? "var(--green)" : "var(--red)" }}>{parseFloat(cc) >= 0 ? "+" : ""}${cc}M</span>
              </div>
              <div style={{ padding: "11px 13px", background: "rgba(30,64,175,0.07)", border: "1px solid rgba(30,64,175,0.2)", borderRadius: 8, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65, marginTop: 3 }}>
                {insight}
              </div>
            </div>
          </div>
        </div>

        <div className="ff-card overflow-x-auto">
          <table className="ff-dt" style={{ minWidth: 600 }}>
            <thead><tr><th>Metric</th><th>{B.w} (Base)</th><th>{C.w} (Compare)</th><th>Change</th><th>Change %</th></tr></thead>
            <tbody>
              {cmpRows.map((r) => {
                const ch = (r.cv - r.bv).toFixed(2)
                const pct = r.bv !== 0 ? (((r.cv - r.bv) / Math.abs(r.bv)) * 100).toFixed(1) : "—"
                const good = parseFloat(ch) * r.dir >= 0
                return (
                  <tr key={r.lbl}>
                    <td className="bold">{r.lbl}</td>
                    <td className="num">{r.bv}</td>
                    <td className="num">{r.cv}</td>
                    <td className={good ? "up" : "dn"}>{parseFloat(ch) >= 0 ? "+" : ""}{ch}</td>
                    <td className={good ? "up" : "dn"}>{pct === "—" ? "—" : `${parseFloat(pct) >= 0 ? "+" : ""}${pct}%`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderForward = () => {
    const actData = WD_ALL.map((d) => d.margin)
    const labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "Q3", "Q4"]
    const act: (number | null)[] = [...actData, null, null, null, null, null]
    const fct: (number | null)[] = [null, null, null, null, null, null, null, 31.3, 31.8, 32.2, 32.5, 33.6, 34.8]

    const ringData = [
      { pct: 91, color: "#1E40AF", label: "North America", sub: "Group A · Standard cost available" },
      { pct: 84, color: "#d97706", label: "APAC", sub: "Group B · Proxy v2.3 applied" },
      { pct: 88, color: "#1E40AF", label: "EMEA", sub: "Group C · Mixed sources" },
      { pct: 76, color: "#dc2626", label: "LatAm", sub: "Group D · Proxy fwd-fill · low coverage" },
    ]

    return (
      <>
        <div className="ff-sh">
          <div><div className="ff-sh-t">Margin Forecast</div><div className="ff-sh-s">Standard margin projection — Q2 remaining + Q3 + Q4 — with confidence bands</div></div>
        </div>
        <div className="ff-ibanner">
          <span className="ff-ibanner-ico">◎</span>
          Forward estimates use current forecast files + Proxy v2.3 (82–91% historical accuracy). Confidence bands reflect data completeness. Not for audit or statutory use.
        </div>
        <div className="ff-frow">
          <div className="ff-fc hl">
            <div className="ff-fc-p">Q2 2025 — Remaining Weeks</div>
            <div className="ff-fc-v">32.1%</div>
            <div className="ff-fc-r">Range: 30.8% – 33.4%</div>
            <div style={{ marginTop: 9 }}><span className="ff-pill ph">High Confidence</span></div>
          </div>
          <div className="ff-fc">
            <div className="ff-fc-p">Q3 2025 — Full Quarter</div>
            <div className="ff-fc-v">33.6%</div>
            <div className="ff-fc-r">Range: 31.2% – 36.0%</div>
            <div style={{ marginTop: 9 }}><span className="ff-pill pm">Medium Confidence</span></div>
          </div>
          <div className="ff-fc">
            <div className="ff-fc-p">Q4 2025 — Full Quarter</div>
            <div className="ff-fc-v">34.8%</div>
            <div className="ff-fc-r">Range: 30.1% – 39.5%</div>
            <div style={{ marginTop: 9 }}><span className="ff-pill pl">Low Confidence</span></div>
          </div>
          <div className="ff-fc">
            <div className="ff-fc-p">FY 2025 — Full Year Est.</div>
            <div className="ff-fc-v">33.0%</div>
            <div className="ff-fc-r">Based on current trajectory</div>
            <div style={{ marginTop: 9 }}><span className="ff-pill pm">Medium Confidence</span></div>
          </div>
        </div>
        <div className="ff-card ff-mb">
          <div className="ff-card-title">Actuals + 3-Quarter Forecast with Confidence Bands</div>
          <SvgLineChart
            data={labels.map((l) => ({ label: l }))}
            height={230}
            yMin={28}
            yMax={42}
            lines={[
              { label: "Actual %", values: act, color: "#1E40AF", fill: true },
              { label: "Forecast %", values: fct, color: "#60a5fa", dash: true },
            ]}
            yFmt={(v) => v + "%"}
          />
        </div>
        <div className="ff-card">
          <div className="ff-card-title" style={{ marginBottom: 14 }}>Proxy Model Accuracy by Cohort</div>
          <div className="ff-acc-grid">
            {ringData.map((r) => (
              <div key={r.label} className="ff-acc-item">
                <div className="ff-ring-wrap">
                  <svg viewBox="0 0 36 36" style={{ width: 62, height: 62, transform: "rotate(-90deg)" }}>
                    <circle cx={18} cy={18} r={15.9} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={3} />
                    <circle cx={18} cy={18} r={15.9} fill="none" stroke={r.color} strokeWidth={3} strokeDasharray={`${r.pct} ${100 - r.pct}`} strokeLinecap="round" />
                  </svg>
                  <div className="ff-ring-val" style={{ color: r.color }}>{r.pct}%</div>
                </div>
                <div>
                  <div className="ff-acc-lbl">{r.label}</div>
                  <div className="ff-acc-sub">{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ═════════════════════════════════════════════════════
  //  JSX
  // ═════════════════════════════════════════════════════

  return (
    <div className="ff-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* SIDEBAR OVERLAY */}
      <div className={`ff-sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <nav className={`ff-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ff-sb-logo">
          <div className="ff-sb-sub">Margin Intelligence</div>
        </div>

        {sidebarItems.map((group) => (
          <div key={group.group} className="ff-sb-group">
            <div className="ff-sb-glabel">{group.group}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`ff-sb-item ${page === item.id ? "active" : ""}`}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              >
                <span className="ff-sb-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}

        <div className="ff-sb-foot">
          <div className="ff-fresh-row">
            <span className="ff-dot-live" />
            Refreshed today, 07:14 AM
          </div>
          <div className="ff-fresh-src">Actuals · Forecast · Proxy v2.3</div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="ff-main">
        {/* TOPBAR */}
        <div className="ff-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="ff-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Navigation">☰</button>
            <div className="ff-tb-title">
              {PAGE_TITLES[page].split(" ").slice(0, -1).join(" ")}{" "}
              <em>{PAGE_TITLES[page].split(" ").pop()}</em>
            </div>
          </div>
          <div className="ff-tb-right">
            <button className="ff-btn" onClick={() => setPeriodIdx((i) => (i + 1) % PERIODS.length)}>
              ⊙ &nbsp;<span className="ff-pval">{PERIODS[periodIdx]}</span>&nbsp; ▾
            </button>
            <button className="ff-btn primary" onClick={() => setPage("compare")}>
              ⇄ Period Comparison
            </button>
            <button className="ff-ai-toggle" onClick={() => setAiPanelOpen(!aiPanelOpen)} title="AI Assistant">✦</button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="ff-page" key={page}>
          {page === "exec" && renderExec()}
          {page === "trend" && renderTrend()}
          {page === "actfcst" && renderAvf()}
          {page === "drivers" && renderDrivers()}
          {page === "compare" && renderCompare()}
          {page === "forward" && renderForward()}
        </div>
      </main>

      {/* AI OVERLAY */}
      <div className={`ff-ai-overlay ${aiPanelOpen ? "open" : ""}`} onClick={() => setAiPanelOpen(false)} />

      {/* AI CHAT PANEL (Command Center) */}
      <aside className={`ff-ai-panel ${aiPanelOpen ? "open" : ""}`}>
        <CommandCenterPanel
          workbenchContext="form-factor"
          isOpen={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          theme="dark"
        />
      </aside>
    </div>
  )
}
