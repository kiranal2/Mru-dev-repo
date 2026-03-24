"use client"

import { useState, useRef, useEffect, useCallback } from "react"

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

type Region = "global" | "northamerica" | "latam" | "emea" | "apac"
type Comparison = "plan" | "priorweek" | "prioryear" | "forecast" | "runrate"
type MetricType = "Trips" | "GBs"
type TabType = "analysis" | "drilldown" | "exceptions" | "signals" | "history"

interface AiMsg {
  role: "user" | "ai"
  name: string
  text?: string
  html?: string
}

interface SegTag {
  cls: string
  label: string
}

interface Segment {
  rank: number
  name: string
  variance: string
  text: string
  tags: SegTag[]
}

interface ChartBar {
  week: string
  actual: number
  plan: number
  color: string
  forecast?: boolean
}

interface RegionMetric {
  variance: string
  delta: string
  color: string
  flagged: string
  flaggedDetail: string
  driver: string
  driverDetail: string
}

interface RegionSignal {
  icon: string
  title: string
  body: string
  positive: boolean
}

interface RegionData {
  label: string
  week: string
  trips: RegionMetric
  gbs: RegionMetric
  signal: RegionSignal
  segments: Segment[]
  chart: { title: string; bars: ChartBar[] }
  ai: {
    messages: AiMsg[]
    suggestions: string[]
  }
}

interface ComparisonData {
  label: string
  stats: { global: string; na: string; latam: string; emea: string; apac: string }
  pillColors: { global: string; na: string; latam: string; emea: string; apac: string }
  totalVariance: string
  totalColor: string
  signal: string
  aiQ: string
  aiA: string
  segmentOverrides: Record<string, Segment[]>
}

interface DrillSegment {
  id: string
  name: string
  region: string
  variance: string
  varColor: string
  spark: number[]
  util: string
  utilColor: string
  trips: string
  tripsVsPlan: string
}

interface ExceptionItem {
  id: string
  severity: string
  icon: string
  name: string
  detail: string
  tags: SegTag[]
  value: string
  week: string
  aiQ: string
  aiA: string
}

interface SignalItem {
  name: string
  type: string
  typeCls: string
  confidence: number
  body: string
  confColor: string
}

interface HistoryItem {
  week: string
  dates: string
  variance: string
  varColor: string
  tags: SegTag[]
  current?: boolean
}

// ═══════════════════════════════════════════════════════
//  DATA STORE
// ═══════════════════════════════════════════════════════

const DATA: {
  regions: Record<Region, RegionData>
  comparisons: Record<Comparison, ComparisonData>
  segmentNav: Record<string, { aiQ: string; aiA: string }>
  drillSegments: DrillSegment[]
  drillAI: Record<string, { q: string; a: string }>
  exceptions: ExceptionItem[]
  signals: SignalItem[]
  history: HistoryItem[]
  historyAI: Record<string, { q: string; a: string }>
} = {
  regions: {
    global: {
      label: "Global",
      week: "Week 10 · Mar 3–9 2026",
      trips: { variance: "−$4.2M", delta: "▼ vs Plan", color: "down", flagged: "7", flaggedDetail: "3 critical", driver: "Supply", driverDetail: "Courier util ↑" },
      gbs: { variance: "−$6.8M", delta: "▼ vs Plan", color: "down", flagged: "9", flaggedDetail: "4 critical", driver: "Demand", driverDetail: "Conversion ↓" },
      signal: { icon: "⚡", title: "Predictive Signal — Watch Next Week", body: "Mexico Grocery courier utilization 68% — above 63% red line for 3 consecutive weeks. Trip dampening active. ML model projects continued −3% to −5% trip loss if supply threshold not adjusted before Tuesday.", positive: false },
      segments: [
        { rank: 1, name: "Mexico Grocery", variance: "−$2.1M vs Plan", text: "Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Supply constraint driving basket size reduction — similar to W34 2024 storm event. Cencosud co-funding partially offset.", tags: [{ cls: "pill-red", label: "Supply constraint" }, { cls: "pill-amber", label: "Historical match W34" }, { cls: "pill-blue", label: "Predictive flag" }] },
        { rank: 2, name: "US Convenience", variance: "−$0.9M vs Plan", text: "CPP 9% trip loss. NYC radius reduction active. Exit rate above seasonal baseline by 1.8 std devs. Holiday effect partially explanatory — pattern consistent with prior 3 Super Bowl weeks.", tags: [{ cls: "pill-amber", label: "Exit rate elevated" }, { cls: "pill-blue", label: "Seasonal baseline" }] },
        { rank: 3, name: "EUP Grocery", variance: "+$1.0M vs Prior Week", text: "+2.3% trips. Courier utilization normalized. School holiday effect confirmed — +1.8M incremental trips vs model baseline. No supply constraints flagged this week.", tags: [{ cls: "pill-green", label: "Positive variance" }, { cls: "pill-green", label: "Holiday confirmed" }] },
      ],
      chart: {
        title: "Weekly Trip Variance — Mexico Grocery",
        bars: [
          { week: "W6", actual: 58, plan: 62, color: "#FEA400" },
          { week: "W7", actual: 55, plan: 62, color: "#FEA400" },
          { week: "W8", actual: 50, plan: 62, color: "#FEA400" },
          { week: "W9", actual: 44, plan: 62, color: "#E74C3C" },
          { week: "W10", actual: 40, plan: 62, color: "#E74C3C" },
          { week: "W11▸", actual: 37, plan: 62, color: "#E74C3C", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What are the most significant exceptions this week?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>3 exceptions ranked by significance:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Mexico Grocery supply constraint — 3rd consecutive week, escalating</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>US Convenience exit rate — 1.8 std devs above seasonal baseline</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#3498DB"></div>EUP positive — school holiday confirmed, no action needed</div></div>` },
          { role: "user", name: "Josh", text: "What should we watch before Tuesday?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Mexico supply threshold.</strong> Courier utilization has been above red line for 3 weeks. If not adjusted, ML model projects −3% to −5% additional trip loss in W11. Recommend reviewing supply ceiling with ops before CEO reporting.` },
        ],
        suggestions: ["Why did LATAM underperform?", "Compare W10 to W34 2024", "Which signals need action?"],
      },
    },
    northamerica: {
      label: "North America",
      week: "Week 10 · Mar 3–9 2026",
      trips: { variance: "−$1.1M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Demand", driverDetail: "Exit rate ↑" },
      gbs: { variance: "−$1.8M", delta: "▼ vs Plan", color: "down", flagged: "4", flaggedDetail: "2 critical", driver: "Pricing", driverDetail: "CPP softness" },
      signal: { icon: "⚠️", title: "Watch: US Convenience Exit Rate Elevated", body: "NYC radius reduction active. Exit rate 1.8 std devs above seasonal baseline. Super Bowl week pattern consistent with W10 2024 and W10 2023 — partial recovery expected W11.", positive: false },
      segments: [
        { rank: 1, name: "US Convenience", variance: "−$0.9M vs Plan", text: "CPP 9% trip loss. NYC radius reduction active. Exit rate above seasonal baseline by 1.8 std devs. Super Bowl holiday partially explanatory.", tags: [{ cls: "pill-amber", label: "Exit rate elevated" }, { cls: "pill-blue", label: "Seasonal baseline" }] },
        { rank: 2, name: "Canada Grocery", variance: "−$0.3M vs Plan", text: "Cold snap in Toronto reduced orders by 7%. Courier acceptance rate 91% — within normal range. Expected recovery as weather normalizes mid-week.", tags: [{ cls: "pill-amber", label: "Weather impact" }, { cls: "pill-blue", label: "Auto-recovery likely" }] },
        { rank: 3, name: "US Alcohol", variance: "+$0.1M vs Plan", text: "Super Bowl tailgate demand spike. +12% trips Sun–Mon. Margin intact. No supply issues.", tags: [{ cls: "pill-green", label: "Event uplift" }, { cls: "pill-green", label: "Margin healthy" }] },
      ],
      chart: {
        title: "Weekly Trip Variance — US Convenience",
        bars: [
          { week: "W6", actual: 61, plan: 64, color: "#FEA400" },
          { week: "W7", actual: 63, plan: 64, color: "#FEA400" },
          { week: "W8", actual: 60, plan: 64, color: "#FEA400" },
          { week: "W9", actual: 56, plan: 64, color: "#F39C12" },
          { week: "W10", actual: 52, plan: 64, color: "#E74C3C" },
          { week: "W11▸", actual: 58, plan: 64, color: "#F39C12", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What drove the North America miss this week?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Two main contributors:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>US Convenience — NYC radius reduction + Super Bowl exit rate spike (−$0.9M)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Canada Grocery — Toronto weather event reduced orders 7% (−$0.3M)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>US Alcohol partially offset with Super Bowl uplift (+$0.1M)</div></div>` },
          { role: "user", name: "Josh", text: "Will NA recover next week?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Partial recovery expected.</strong> US Convenience should normalize as Super Bowl effect fades — W11 model shows +6% rebound. Canada weather clears by Wednesday. Net W11 projection: −$0.4M vs Plan, vs −$1.1M this week.` },
        ],
        suggestions: ["Show US Convenience trend", "What is NYC radius reduction?", "Canada W11 forecast"],
      },
    },
    latam: {
      label: "LATAM",
      week: "Week 10 · Mar 3–9 2026",
      trips: { variance: "−$2.4M", delta: "▼ vs Plan", color: "down", flagged: "4", flaggedDetail: "3 critical", driver: "Supply", driverDetail: "MX courier util" },
      gbs: { variance: "−$3.9M", delta: "▼ vs Plan", color: "down", flagged: "5", flaggedDetail: "3 critical", driver: "Supply", driverDetail: "MX + BR squeeze" },
      signal: { icon: "🚨", title: "Critical: LATAM Supply Constraint — 3rd Week", body: "Mexico Grocery driving 87% of LATAM miss. Brazil Convenience showing early supply stress — util 61%, approaching 63% threshold. Combined risk: −$3.1M if uncorrected in W11.", positive: false },
      segments: [
        { rank: 1, name: "Mexico Grocery", variance: "−$2.1M vs Plan", text: "Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Cencosud co-funding offset −$0.4M. Supply ceiling review overdue.", tags: [{ cls: "pill-red", label: "Supply constraint" }, { cls: "pill-red", label: "3 weeks escalating" }, { cls: "pill-blue", label: "Predictive: W11 worse" }] },
        { rank: 2, name: "Brazil Convenience", variance: "−$0.6M vs Plan", text: "Courier util 61% — approaching red line. São Paulo carnival hangover effect. Trip volume recovering but supply thinning. Early warning flag active.", tags: [{ cls: "pill-amber", label: "Approaching threshold" }, { cls: "pill-amber", label: "Early warning" }] },
        { rank: 3, name: "Colombia Grocery", variance: "+$0.3M vs Plan", text: "Bogotá expansion Week 6 showing returns. Trip volume +18% vs W6 baseline. Courier supply healthy at 54%.", tags: [{ cls: "pill-green", label: "Expansion ROI" }, { cls: "pill-green", label: "Supply healthy" }] },
      ],
      chart: {
        title: "Weekly Trip Variance — Mexico Grocery",
        bars: [
          { week: "W6", actual: 58, plan: 62, color: "#FEA400" },
          { week: "W7", actual: 55, plan: 62, color: "#FEA400" },
          { week: "W8", actual: 50, plan: 62, color: "#F39C12" },
          { week: "W9", actual: 44, plan: 62, color: "#E74C3C" },
          { week: "W10", actual: 40, plan: 62, color: "#E74C3C" },
          { week: "W11▸", actual: 36, plan: 62, color: "#E74C3C", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "Why is LATAM the worst performing region this week?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Mexico Grocery is the primary driver</strong> at −$2.1M, representing 87% of the LATAM miss. The root cause is courier supply constraint — utilization has been above the 63% red line for 3 consecutive weeks with trip dampening active.<br><br>Brazil Convenience adds −$0.6M with early supply stress indicators building.` },
          { role: "user", name: "Josh", text: "What action should we take today?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Two recommended actions:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Mexico: Request ops to raise supply ceiling by Tuesday — current threshold 1,240 couriers, suggest 1,380 (+11%)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Brazil: Pre-authorize 15% courier incentive for W11 to prevent threshold breach</div></div>` },
        ],
        suggestions: ["Mexico supply ceiling options", "Brazil W11 risk quantification", "LATAM vs prior year"],
      },
    },
    emea: {
      label: "EMEA",
      week: "Week 10 · Mar 3–9 2026",
      trips: { variance: "+$0.3M", delta: "▲ vs Plan", color: "up", flagged: "2", flaggedDetail: "0 critical", driver: "Holiday", driverDetail: "School break EU" },
      gbs: { variance: "+$0.5M", delta: "▲ vs Plan", color: "up", flagged: "1", flaggedDetail: "0 critical", driver: "Holiday", driverDetail: "AOV lift +4%" },
      signal: { icon: "✅", title: "Positive: EMEA School Holiday Confirmed", body: "European school holiday adding +1.8M incremental trips vs model baseline. UK and France leading. Courier supply healthy at 51% utilization. No supply risks flagged for W11.", positive: true },
      segments: [
        { rank: 1, name: "EUP Grocery", variance: "+$0.4M vs Plan", text: "+2.3% trips. Courier utilization 51% — healthy. School holiday confirmed driving demand. France +18%, UK +14% vs baseline.", tags: [{ cls: "pill-green", label: "Positive variance" }, { cls: "pill-green", label: "Holiday confirmed" }] },
        { rank: 2, name: "UK Convenience", variance: "+$0.1M vs Plan", text: "Steady week. Order frequency up 3%. No exceptions. Margin expanding slightly due to AOV mix shift.", tags: [{ cls: "pill-green", label: "On track" }, { cls: "pill-green", label: "Margin expansion" }] },
        { rank: 3, name: "DACH Pharmacy", variance: "−$0.2M vs Plan", text: "Germany regulatory delay impacting Rx fulfilment. 3% of SKUs affected. Resolution expected W12. Non-material.", tags: [{ cls: "pill-amber", label: "Regulatory" }, { cls: "pill-blue", label: "W12 resolution" }] },
      ],
      chart: {
        title: "Weekly Trip Variance — EUP Grocery",
        bars: [
          { week: "W6", actual: 52, plan: 54, color: "#FEA400" },
          { week: "W7", actual: 53, plan: 54, color: "#FEA400" },
          { week: "W8", actual: 54, plan: 54, color: "#2ECC71" },
          { week: "W9", actual: 55, plan: 54, color: "#2ECC71" },
          { week: "W10", actual: 58, plan: 54, color: "#2ECC71" },
          { week: "W11▸", actual: 56, plan: 54, color: "#2ECC71", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What is driving the EMEA outperformance?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>European school holidays</strong> are the primary driver — confirmed across France, UK, and Benelux. EUP Grocery is up +2.3% trips vs plan with healthy courier supply at 51% utilization.<br><br>UK Convenience contributing a modest +$0.1M on improved order frequency. DACH Pharmacy has a minor regulatory headwind (−$0.2M) but non-material.` },
          { role: "user", name: "Josh", text: "Will EMEA continue outperforming in W11?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Likely modest pullback.</strong> School holidays end W10–W11 depending on market. W11 projection shows +$0.1M vs plan (down from +$0.3M). UK and France should normalize. No supply risks in the forecast window.` },
        ],
        suggestions: ["France vs UK breakdown", "EMEA supply health W11", "School holiday impact model"],
      },
    },
    apac: {
      label: "APAC",
      week: "Week 10 · Mar 3–9 2026",
      trips: { variance: "−$0.9M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Demand", driverDetail: "AU weather" },
      gbs: { variance: "−$1.2M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Demand", driverDetail: "Conversion drop" },
      signal: { icon: "🌧️", title: "Weather Event: AU Eastern Seaboard — Demand Suppressed", body: "Heavy rainfall across Sydney, Melbourne, Brisbane suppressing trip demand. Estimated −$0.7M impact this week. Historical pattern shows +15% rebound in following 2 weeks. Japan and Taiwan on plan.", positive: false },
      segments: [
        { rank: 1, name: "AU Grocery", variance: "−$0.7M vs Plan", text: "Eastern seaboard rainfall. Demand suppressed across Grocery and Convenience. Sydney −21%, Melbourne −18% vs weekly baseline. Auto-recovery expected W11–W12.", tags: [{ cls: "pill-amber", label: "Weather impact" }, { cls: "pill-blue", label: "Auto-recovery W11" }] },
        { rank: 2, name: "Japan Convenience", variance: "+$0.1M vs Plan", text: "Steady performance. Convenience segment outperforming on lunch ordering uptick. AOV stable.", tags: [{ cls: "pill-green", label: "On track" }] },
        { rank: 3, name: "Taiwan Grocery", variance: "−$0.3M vs Plan", text: "Lunar New Year hangover — demand normalization in progress. Expected back to baseline by W12.", tags: [{ cls: "pill-amber", label: "Seasonal" }, { cls: "pill-blue", label: "Normalizing" }] },
      ],
      chart: {
        title: "Weekly Trip Variance — AU Grocery",
        bars: [
          { week: "W6", actual: 60, plan: 62, color: "#FEA400" },
          { week: "W7", actual: 61, plan: 62, color: "#FEA400" },
          { week: "W8", actual: 62, plan: 62, color: "#2ECC71" },
          { week: "W9", actual: 59, plan: 62, color: "#F39C12" },
          { week: "W10", actual: 50, plan: 62, color: "#E74C3C" },
          { week: "W11▸", actual: 57, plan: 62, color: "#F39C12", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What happened in APAC this week?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>Weather-driven miss in Australia.</strong> Heavy rainfall across Sydney, Melbourne, and Brisbane suppressed demand by an estimated −$0.7M. This accounts for 78% of the APAC variance.<br><br>Japan and Taiwan are near-plan with minor seasonal headwinds.` },
          { role: "user", name: "Josh", text: "Is there anything we should escalate?" },
          { role: "ai", name: "Uberflux AI", html: `<strong>No escalation needed.</strong> The AU weather impact is temporary — historical patterns show +15% rebound over the 2 weeks following similar events. W11 projection already reflects partial recovery. This is classified as an <em>explainable, auto-recovering</em> variance.` },
        ],
        suggestions: ["AU W11 recovery forecast", "Japan trend W6–W10", "APAC vs Prior Year"],
      },
    },
  },

  comparisons: {
    plan: {
      label: "vs Plan",
      stats: { global: "−$4.2M", na: "−$1.1M", latam: "−$2.4M", emea: "+$0.3M", apac: "−$0.9M" },
      pillColors: { global: "pill-red", na: "pill-amber", latam: "pill-red", emea: "pill-green", apac: "pill-amber" },
      totalVariance: "−$4.2M",
      totalColor: "down",
      signal: "Mexico Grocery supply constraint is the largest miss vs Plan — courier utilization 68%, above 63% red line. Trip dampening costing −$2.1M. EMEA is the sole positive region at +$0.3M.",
      aiQ: "How are we tracking against Plan overall?",
      aiA: `<strong>−$4.2M vs Plan this week.</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>LATAM −$2.4M: Mexico Grocery supply constraint driving 57% of total miss</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>NA −$1.1M: US Convenience Super Bowl exit rate spike + Canada weather</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>APAC −$0.9M: AU eastern seaboard rainfall — auto-recovering</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA +$0.3M: School holiday demand surge, only region beating Plan</div></div>`,
      segmentOverrides: {
        global: [
          { rank: 1, name: "Mexico Grocery", variance: "−$2.1M vs Plan", text: "Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Cencosud co-funding partially offset. Plan miss accelerating for 3rd week.", tags: [{ cls: "pill-red", label: "Supply breach" }, { cls: "pill-red", label: "3 wks escalating" }] },
          { rank: 2, name: "US Convenience", variance: "−$0.9M vs Plan", text: "CPP 9% trip loss. NYC radius reduction active. Exit rate 1.8 std devs above plan seasonal baseline. Super Bowl holiday partially explanatory.", tags: [{ cls: "pill-amber", label: "Exit rate elevated" }, { cls: "pill-blue", label: "Seasonal baseline" }] },
          { rank: 3, name: "EUP Grocery", variance: "+$1.0M vs Plan", text: "+2.3% trips above plan. School holiday effect confirmed — +1.8M incremental trips vs plan model baseline. No supply constraints flagged.", tags: [{ cls: "pill-green", label: "Above plan" }, { cls: "pill-green", label: "Holiday confirmed" }] },
        ],
      },
    },
    priorweek: {
      label: "vs Prior Week",
      stats: { global: "+$0.8M", na: "+$0.3M", latam: "+$0.2M", emea: "+$0.5M", apac: "+$0.1M" },
      pillColors: { global: "pill-green", na: "pill-green", latam: "pill-green", emea: "pill-green", apac: "pill-green" },
      totalVariance: "+$0.8M",
      totalColor: "up",
      signal: "All regions improved week-on-week. EMEA holiday momentum is the largest positive driver (+$0.5M WoW). LATAM supply constraint is slowing its deterioration but still negative vs Plan.",
      aiQ: "How does W10 compare to W9?",
      aiA: `<strong>+$0.8M improvement week-on-week.</strong> Every region moved in the right direction vs W9.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA +$0.5M WoW: School holiday building through the week</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NA +$0.3M WoW: US Convenience stabilizing post-W9 radius reduction</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>LATAM +$0.2M WoW: Supply constraint rate of deterioration slowing — not improving yet</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>APAC +$0.1M WoW: AU weather impact plateauing</div></div>`,
      segmentOverrides: {
        global: [
          { rank: 1, name: "EUP Grocery", variance: "+$0.6M vs Prior Week", text: "School holiday demand accelerating through the week. France and UK both up double-digits week-on-week. Courier supply maintaining pace.", tags: [{ cls: "pill-green", label: "WoW acceleration" }, { cls: "pill-green", label: "Holiday momentum" }] },
          { rank: 2, name: "US Convenience", variance: "+$0.3M vs Prior Week", text: "Exit rate normalizing from W9 Super Bowl spike peak. NYC radius reduction impact stabilizing. WoW recovery tracking model expectations.", tags: [{ cls: "pill-green", label: "Recovering" }, { cls: "pill-blue", label: "On model track" }] },
          { rank: 3, name: "Mexico Grocery", variance: "+$0.1M vs Prior Week", text: "Supply constraint deterioration rate has slowed vs W9. Trip dampening still active but couriers slightly more available mid-week. Fragile improvement.", tags: [{ cls: "pill-amber", label: "Marginal recovery" }, { cls: "pill-red", label: "Still constrained" }] },
        ],
      },
    },
    prioryear: {
      label: "vs Prior Year",
      stats: { global: "+$12.1M", na: "+$3.8M", latam: "+$4.2M", emea: "+$2.9M", apac: "+$1.2M" },
      pillColors: { global: "pill-green", na: "pill-green", latam: "pill-green", emea: "pill-green", apac: "pill-green" },
      totalVariance: "+$12.1M",
      totalColor: "up",
      signal: "Strong year-on-year growth across all regions. LATAM showing the largest YoY absolute gain (+$4.2M) on market expansion. W10 2025 was a structurally weak comp — supply issues were more severe.",
      aiQ: "How does W10 compare to the same week last year?",
      aiA: `<strong>+$12.1M vs same week in 2025 — strong YoY.</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>LATAM +$4.2M YoY: Mexico Grocery was in a worse supply crisis in W10 2025 (util 74% vs 68% now). Low comp.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NA +$3.8M YoY: US Convenience W10 2025 had a more severe radius reduction event. Base effect.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA +$2.9M YoY: EUP Grocery launched in W22 2025 — not in base. Structural growth.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>APAC +$1.2M YoY: AU market maturation + Japan Convenience expansion from W3 2026.</div></div>`,
      segmentOverrides: {
        global: [
          { rank: 1, name: "EUP Grocery", variance: "+$3.1M vs Prior Year", text: "New market — not in base. EUP Grocery launched W22 2025. Full-year contribution tracking above launch model. Structural growth driver.", tags: [{ cls: "pill-green", label: "New market" }, { cls: "pill-green", label: "Above launch model" }] },
          { rank: 2, name: "Mexico Grocery", variance: "+$2.4M vs Prior Year", text: "W10 2025 had courier util at 74% — a worse supply crisis. Current 68% is elevated but improved vs weak comp. YoY flatters current performance.", tags: [{ cls: "pill-green", label: "YoY recovery" }, { cls: "pill-amber", label: "Weak comp effect" }] },
          { rank: 3, name: "US Convenience", variance: "+$2.2M vs Prior Year", text: "W10 2025 had a more severe Super Bowl exit rate event and broader radius reduction. Current week is bad vs Plan but better vs last year.", tags: [{ cls: "pill-green", label: "YoY better" }, { cls: "pill-amber", label: "Comp effect" }] },
        ],
      },
    },
    forecast: {
      label: "vs Forecast",
      stats: { global: "−$1.9M", na: "−$0.5M", latam: "−$1.1M", emea: "+$0.2M", apac: "−$0.4M" },
      pillColors: { global: "pill-amber", na: "pill-amber", latam: "pill-red", emea: "pill-green", apac: "pill-amber" },
      totalVariance: "−$1.9M",
      totalColor: "warn",
      signal: "We missed the internal W10 forecast by −$1.9M. The forecast had already embedded supply risk in LATAM, so the additional miss is from Australia weather (unforeseen) and US Convenience exit rate exceeding the model.",
      aiQ: "Where did we miss our own forecast?",
      aiA: `<strong>−$1.9M vs internal W10 forecast.</strong> The forecast had already priced in LATAM supply risk — the incremental misses came from:<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>APAC −$0.4M: AU weather event was not in the forecast model (unforeseen force majeure)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>NA −$0.5M: US Convenience exit rate exceeded forecast by 0.6 std devs — Super Bowl effect stronger than modeled</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>LATAM −$1.1M: Even with the embedded risk assumption, Mexico supply deterioration exceeded forecast</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA +$0.2M: School holiday demand slightly exceeded forecast — positive surprise</div></div>`,
      segmentOverrides: {
        global: [
          { rank: 1, name: "Mexico Grocery", variance: "−$0.8M vs Forecast", text: "Forecast had embedded −$1.3M supply risk assumption. Actual came in −$2.1M vs Plan — a −$0.8M incremental miss vs the risk-adjusted forecast. Supply worse than modeled.", tags: [{ cls: "pill-red", label: "Worse than risk model" }, { cls: "pill-amber", label: "Forecast miss" }] },
          { rank: 2, name: "AU Grocery", variance: "−$0.7M vs Forecast", text: "Weather event was not modeled — full −$0.7M is a forecast miss. Auto-recovery model now active and incorporated into W11 forecast revision.", tags: [{ cls: "pill-amber", label: "Unforecast event" }, { cls: "pill-blue", label: "W11 recovery modeled" }] },
          { rank: 3, name: "EUP Grocery", variance: "+$0.2M vs Forecast", text: "Holiday demand slightly exceeded forecast assumptions. France overperformed the model by 4 percentage points. Positive forecast miss — no action needed.", tags: [{ cls: "pill-green", label: "Positive surprise" }, { cls: "pill-green", label: "Forecast beat" }] },
        ],
      },
    },
    runrate: {
      label: "vs Run Rate",
      stats: { global: "−$2.8M", na: "−$0.7M", latam: "−$1.6M", emea: "+$0.1M", apac: "−$0.6M" },
      pillColors: { global: "pill-red", na: "pill-amber", latam: "pill-red", emea: "pill-green", apac: "pill-amber" },
      totalVariance: "−$2.8M",
      totalColor: "down",
      signal: "W10 is tracking −$2.8M below the 8-week run rate. LATAM is the structural drag — supply constraint has been depressing the run rate itself. EMEA run rate is the only region trending positively.",
      aiQ: "Are we above or below our run rate?",
      aiA: `<strong>−$2.8M below 8-week run rate.</strong> This is a meaningful signal — it means W10 is not just a Plan miss, it's below our own recent trajectory.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>LATAM −$1.6M below run rate: The run rate itself has been declining for 3 weeks as supply constraint compounds. This is a deteriorating trend, not a one-week event.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>APAC −$0.6M below run rate: Weather event creates a step-down vs recent weeks</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>NA −$0.7M below run rate: Super Bowl week exits elevated vs normal run rate</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA +$0.1M above run rate: Holiday uplift pushing slightly above recent trend</div></div>`,
      segmentOverrides: {
        global: [
          { rank: 1, name: "Mexico Grocery", variance: "−$1.4M vs Run Rate", text: "The 8-week run rate itself has been declining 3.2% per week as supply constraint compounds. This week is −$1.4M below that declining run rate — accelerating deterioration.", tags: [{ cls: "pill-red", label: "Accelerating decline" }, { cls: "pill-red", label: "Run rate falling" }] },
          { rank: 2, name: "AU Grocery", variance: "−$0.6M vs Run Rate", text: "Weather event is a step-change below recent steady run rate of ~$0.62M/week. Run rate should recover W11–W12 as weather normalizes.", tags: [{ cls: "pill-amber", label: "Temporary step-down" }, { cls: "pill-blue", label: "Run rate recovery likely" }] },
          { rank: 3, name: "EUP Grocery", variance: "+$0.3M vs Run Rate", text: "School holiday is pushing EUP Grocery above its recent run rate. This is temporary — run rate will normalize post-holiday but at a higher structural level than W6.", tags: [{ cls: "pill-green", label: "Above run rate" }, { cls: "pill-green", label: "Structural improvement" }] },
        ],
      },
    },
  },

  segmentNav: {
    grocery: {
      aiQ: "Give me the Grocery segment deep-dive across all regions",
      aiA: `<strong>Grocery — cross-region summary W10:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Mexico Grocery −$2.1M: Supply constraint, 3rd week above 63% util threshold</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EUP Grocery +$0.4M: School holiday driving +2.3% trips above plan</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>AU Grocery −$0.7M: Weather-suppressed demand, auto-recovery expected W11</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Colombia Grocery +$0.3M: Bogotá expansion tracking 2x launch model</div></div><br>Net Grocery: <strong class="uf-down">−$2.1M</strong> vs Plan. Mexico is the sole structural issue.`,
    },
    convenience: {
      aiQ: "Show me Convenience segment performance this week",
      aiA: `<strong>Convenience — cross-region summary W10:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>US Convenience −$0.9M: Super Bowl exit rate spike + NYC radius reduction</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Brazil Convenience −$0.6M: Supply early warning, util at 61% approaching threshold</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>UK Convenience +$0.1M: Steady week, order frequency +3%, margin expanding</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Japan Convenience +$0.1M: Lunch ordering uptick, AOV stable</div></div><br>Net Convenience: <strong class="uf-warn">−$1.3M</strong> vs Plan. Brazil is the emerging risk for W11.`,
    },
    alcohol: {
      aiQ: "How is the Alcohol segment performing?",
      aiA: `<strong>Alcohol — W10 summary:</strong><br><br>The Alcohol segment is the standout positive this week at <strong class="uf-up">+$0.4M vs Plan</strong> globally.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>US Alcohol +$0.3M: Super Bowl tailgate demand spike. +12% trips Sun–Mon vs baseline.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EUP Alcohol +$0.1M: School holiday entertainment demand. Margin healthy.</div></div><br>Alcohol is benefiting from the same events that are hurting other segments. No supply constraints. Courier utilization for Alcohol-only zones: 47%.`,
    },
    pharmacy: {
      aiQ: "What is happening with Pharmacy this week?",
      aiA: `<strong>Pharmacy — W10 summary: Flat vs Plan.</strong><br><br>Pharmacy is broadly on plan this week with one minor headwind:<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>DACH Pharmacy −$0.2M: Germany regulatory delay affecting Rx fulfilment. 3% of SKUs impacted. Resolution expected W12 — non-material.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>US Pharmacy +$0.1M: Flu season demand slightly above seasonal model.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#3498DB"></div>APAC Pharmacy flat: No exceptions flagged.</div></div><br>Overall Pharmacy is not a concern this week. DACH regulatory issue is being tracked.`,
    },
  },

  drillSegments: [
    { id: "grocery", name: "Mexico Grocery", region: "LATAM", variance: "−$2.1M", varColor: "down", spark: [55, 50, 45, 42, 40], util: "68%", utilColor: "#E74C3C", trips: "1.24M", tripsVsPlan: "−8.3%" },
    { id: "usconv", name: "US Convenience", region: "North America", variance: "−$0.9M", varColor: "down", spark: [62, 63, 60, 56, 52], util: "74%", utilColor: "#F39C12", trips: "2.1M", tripsVsPlan: "−4.2%" },
    { id: "eupgro", name: "EUP Grocery", region: "EMEA", variance: "+$0.4M", varColor: "up", spark: [52, 53, 54, 55, 58], util: "51%", utilColor: "#2ECC71", trips: "3.8M", tripsVsPlan: "+2.3%" },
    { id: "augro", name: "AU Grocery", region: "APAC", variance: "−$0.7M", varColor: "down", spark: [60, 61, 62, 59, 50], util: "43%", utilColor: "#3498DB", trips: "0.87M", tripsVsPlan: "−11.6%" },
    { id: "brcnv", name: "Brazil Convenience", region: "LATAM", variance: "−$0.6M", varColor: "down", spark: [58, 57, 56, 55, 54], util: "61%", utilColor: "#F39C12", trips: "1.6M", tripsVsPlan: "−5.1%" },
    { id: "ukconv", name: "UK Convenience", region: "EMEA", variance: "+$0.1M", varColor: "up", spark: [48, 49, 50, 50, 51], util: "49%", utilColor: "#2ECC71", trips: "1.1M", tripsVsPlan: "+0.9%" },
  ],

  drillAI: {
    grocery: { q: "Tell me more about Mexico Grocery", a: `<strong>Mexico Grocery deep-dive:</strong><br><br>Root cause is supply-side. Courier utilization at 68% — 5 points above the 63% red line that triggers trip dampening. This has been active since Week 8.<br><br>Impact breakdown: −8.3% trip volume vs plan, basket size compressed by 4.2% as customers self-select for faster (cheaper) items. Cencosud co-funding offset −$0.4M.<br><br><strong>W11 risk:</strong> If utilization remains above threshold, model projects additional −3% to −5% trip loss.` },
    usconv: { q: "Explain the US Convenience situation", a: `<strong>US Convenience — Super Bowl week effect.</strong><br><br>Exit rate spike of 1.8 std devs above seasonal baseline is the primary driver. NYC radius reduction active (customers further from stores getting no-courier zones).<br><br>Historical comparison: exact pattern matches W10 2024 and W10 2023 — both showed full recovery within 10 days. Model confidence: 87%.<br><br><strong>No structural issues</strong> — this is seasonal and explainable.` },
    eupgro: { q: "What is driving EUP Grocery outperformance?", a: `<strong>School holiday demand surge confirmed.</strong><br><br>France half-term + UK mid-term aligning in W10. +1.8M incremental trips vs model baseline. France +18%, UK +14%, Benelux +11%.<br><br>Courier supply healthy at 51% — well below risk threshold. Margin intact. No co-funding deployed.<br><br><strong>W11 outlook:</strong> Demand normalizes as holidays end. Projection +$0.1M vs plan.` },
    augro: { q: "What caused the AU Grocery miss?", a: `<strong>Weather-driven demand suppression.</strong><br><br>Eastern seaboard rainfall event (100yr+ intensity in Sydney) reduced trip demand across Grocery and Convenience. Sydney −21%, Melbourne −18% vs weekly baseline.<br><br>Courier supply is unaffected (util 43%). No structural issues. Historical weather events of similar magnitude show +15% rebound over the following 2 weeks.<br><br><strong>Recommendation:</strong> No action required. Auto-recovery expected W11–W12.` },
    brcnv: { q: "How serious is the Brazil Convenience risk?", a: `<strong>Early warning — monitoring required.</strong><br><br>Courier utilization at 61% is approaching the 63% red line. Carnival hangover suppressing courier supply as workers return to normal schedules. Trip volume is recovering but supply thinning.<br><br>If utilization breaches 63% in W11, trip dampening activates — estimated −$0.8M additional impact.<br><br><strong>Recommendation:</strong> Pre-authorize 15% courier incentive for W11 to prevent threshold breach.` },
    ukconv: { q: "What is UK Convenience doing well?", a: `<strong>UK Convenience is a bright spot.</strong><br><br>Order frequency up 3% week-on-week. AOV mix shifting toward higher-margin items. Lunch ordering window (12–2pm) showing +8% trip growth — new product category expansion in W8 appears to be driving this.<br><br>No supply risks. Courier utilization 49% — healthy headroom.<br><br><strong>Recommendation:</strong> Consider replicating lunch category expansion playbook in DACH.` },
  },

  exceptions: [
    { id: "mx-supply", severity: "critical", icon: "🔴", name: "Mexico Grocery — Supply Ceiling Breach", detail: "Courier utilization 68% vs 63% red line. 3rd consecutive week. Trip dampening active, revenue erosion accelerating.", tags: [{ cls: "pill-red", label: "Critical" }, { cls: "pill-red", label: "3 weeks" }], value: "−$2.1M", week: "W8–W10", aiQ: "Diagnose the Mexico supply breach", aiA: `<strong>Supply ceiling breach — critical.</strong><br><br>The 63% utilization threshold was designed to trigger trip dampening before quality degrades. We've been above it since Week 8.<br><br>Each week above threshold compounds: W8 −$0.6M, W9 −$1.4M, W10 −$2.1M (cumulative). The constraint is structural — courier onboarding in CDMX metro was paused in Jan due to regulatory hold.<br><br><strong>Required action:</strong> Ops to raise ceiling from 1,240 to 1,380 couriers (+11%). Regulatory hold resolution expected W12.` },
    { id: "us-exit", severity: "warning", icon: "🟡", name: "US Convenience — Exit Rate Spike", detail: "Exit rate 1.8 std devs above seasonal baseline. NYC radius reduction active. Super Bowl week effect partially explanatory.", tags: [{ cls: "pill-amber", label: "Warning" }, { cls: "pill-blue", label: "Seasonal" }], value: "−$0.9M", week: "W10", aiQ: "Explain US Convenience exit rate spike", aiA: `<strong>Super Bowl effect — explainable and temporary.</strong><br><br>Exit rate spikes in W10 are a documented pattern across 3 prior years. Customers who open the app during Super Bowl weekend are browsing, not buying — event-driven browsing inflates exit rate denominator.<br><br>NYC radius reduction (active since W9) compounds this by showing some customers a reduced catalogue.<br><br><strong>W11 outlook:</strong> Full normalization expected. No structural intervention needed.` },
    { id: "br-early", severity: "warning", icon: "🟡", name: "Brazil Convenience — Supply Early Warning", detail: "Courier utilization 61%, approaching 63% threshold. Carnival hangover reducing supply. Early flag — not yet in dampening.", tags: [{ cls: "pill-amber", label: "Watch" }, { cls: "pill-amber", label: "Approaching limit" }], value: "−$0.6M", week: "W10", aiQ: "How urgent is the Brazil early warning?", aiA: `<strong>Act this week to avoid W11 crisis.</strong><br><br>Brazil is 2 utilization points from the dampening threshold. Carnival hangover typically resolves within 10–14 days but the W11 demand forecast is +3% above W10, which increases utilization pressure.<br><br>Pre-authorizing courier incentives now costs ~$40K. Failing to act and hitting dampening in W11 risks −$0.8M revenue impact.<br><br><strong>ROI: 20x.</strong> Recommend immediate approval.` },
    { id: "au-weather", severity: "critical", icon: "🔴", name: "AU Grocery — Weather Demand Suppression", detail: "Eastern seaboard rainfall event suppressing demand. Sydney −21%, Melbourne −18% vs baseline. Auto-recovery model active.", tags: [{ cls: "pill-red", label: "Weather" }, { cls: "pill-blue", label: "Auto-recovering" }], value: "−$0.7M", week: "W10", aiQ: "Should we take action on AU weather impact?", aiA: `<strong>No action required.</strong><br><br>This is a classic weather-suppression event. Historical analysis of 14 comparable events shows average demand rebound of +15% over 2 weeks post-event. The AU Grocery courier base is unaffected (util 43%), so supply will absorb the rebound without intervention.<br><br>The auto-recovery model is already active and incorporated into W11–W12 projections.` },
    { id: "eup-holiday", severity: "positive", icon: "🟢", name: "EUP Grocery — School Holiday Outperformance", detail: "School holidays driving +1.8M incremental trips. France +18%, UK +14%. Courier supply healthy. No action needed.", tags: [{ cls: "pill-green", label: "Positive" }, { cls: "pill-green", label: "Holiday confirmed" }], value: "+$0.4M", week: "W10", aiQ: "Can we amplify the EUP school holiday effect?", aiA: `<strong>Limited amplification opportunity this week — but plan for W25.</strong><br><br>The W10 holiday uplift is organic demand, not driven by promotions. Adding spend now would likely over-invest since the effect is already materializing.<br><br>The stronger opportunity is planning ahead: W25 (late June) is the largest European school holiday period. Last year it drove +$2.8M above plan across EUP.<br><br><strong>Recommend:</strong> Flag for W25 planning cycle.` },
    { id: "col-expansion", severity: "positive", icon: "🟢", name: "Colombia Grocery — Expansion ROI Positive", detail: "Bogotá W6 expansion generating returns. Trip volume +18% vs W6 baseline. Courier supply healthy at 54%.", tags: [{ cls: "pill-green", label: "Expansion ROI" }, { cls: "pill-green", label: "Growing" }], value: "+$0.3M", week: "W6–W10", aiQ: "What does Colombia success mean for expansion playbook?", aiA: `<strong>Bogotá expansion is tracking ahead of model.</strong><br><br>W6 launch projected +$0.15M by W10 — actual is +$0.30M (2x). Trip growth of +18% vs baseline exceeds the +12% model assumption. Courier utilization healthy at 54%.<br><br>Key success factors: pre-loaded courier incentive in W1–W3, partnership with Éxito chain for catalogue breadth, and targeted push notifications to existing Uber Eats users.<br><br><strong>Expansion playbook:</strong> This pattern supports fast-follow expansion to Medellín (W14) and Cali (W18) ahead of original plan.` },
  ],

  signals: [
    { name: "Mexico Supply Ceiling Breach Risk W11", type: "Supply", typeCls: "pill-red", confidence: 94, body: "Courier utilization trend projects continued breach through W11. Trip dampening cumulative impact accelerating. Model based on 18 comparable historical events.", confColor: "#E74C3C" },
    { name: "Brazil Courier Utilization Approaching Threshold", type: "Supply", typeCls: "pill-amber", confidence: 78, body: "Brazil Convenience util at 61%, trajectory crosses 63% by W11 Day 3 under base-case demand forecast. Carnival hangover supply lag is primary driver.", confColor: "#F39C12" },
    { name: "EUP School Holiday Demand Surge Confirmed", type: "Demand", typeCls: "pill-green", confidence: 96, body: "French and UK school holidays confirmed driving +1.8M incremental trips vs baseline. Pattern matches W10 2025 and W10 2024 with high fidelity.", confColor: "#2ECC71" },
    { name: "AU Eastern Seaboard Rebound — W11 Expected", type: "Weather", typeCls: "pill-blue", confidence: 82, body: "Post-rainfall rebound modeled at +15% demand uplift over 2 weeks. Historical accuracy on 14 comparable AU weather events: 81%. Supply positioned to absorb.", confColor: "#3498DB" },
    { name: "US Convenience Full Recovery Expected W11", type: "Demand", typeCls: "pill-blue", confidence: 87, body: "Super Bowl exit rate spike resolves in all 3 historical comparisons within 7 days. NYC radius reduction review scheduled for W11. Model confidence high.", confColor: "#3498DB" },
    { name: "Colombia Expansion: Medellín Readiness Signal", type: "Expansion", typeCls: "pill-green", confidence: 71, body: "Bogotá trajectory at +18% vs plan suggests Medellín expansion (W14 target) feasibility is high. Courier pre-seeding recommended by W12 to hit W14 launch KPIs.", confColor: "#2ECC71" },
  ],

  history: [
    { week: "W10", dates: "Mar 3–9 2026", variance: "−$4.2M", varColor: "down", tags: [{ cls: "pill-red", label: "Supply" }, { cls: "pill-amber", label: "Weather" }], current: true },
    { week: "W9", dates: "Feb 24–Mar 2", variance: "−$3.1M", varColor: "down", tags: [{ cls: "pill-red", label: "Supply" }] },
    { week: "W8", dates: "Feb 17–23", variance: "−$1.8M", varColor: "down", tags: [{ cls: "pill-amber", label: "Supply early" }] },
    { week: "W7", dates: "Feb 10–16", variance: "+$0.6M", varColor: "up", tags: [{ cls: "pill-green", label: "On plan" }] },
    { week: "W6", dates: "Feb 3–9", variance: "+$1.2M", varColor: "up", tags: [{ cls: "pill-green", label: "Holiday uplift" }] },
    { week: "W5", dates: "Jan 27–Feb 2", variance: "−$0.4M", varColor: "warn", tags: [{ cls: "pill-amber", label: "Minor miss" }] },
    { week: "W4", dates: "Jan 20–26", variance: "+$2.1M", varColor: "up", tags: [{ cls: "pill-green", label: "Promo success" }] },
    { week: "W3", dates: "Jan 13–19", variance: "+$0.9M", varColor: "up", tags: [{ cls: "pill-green", label: "On plan" }] },
    { week: "W2", dates: "Jan 6–12", variance: "−$1.1M", varColor: "down", tags: [{ cls: "pill-amber", label: "Post-holiday" }] },
    { week: "W1", dates: "Dec 30–Jan 5", variance: "+$3.8M", varColor: "up", tags: [{ cls: "pill-green", label: "New Year surge" }] },
    { week: "W52", dates: "Dec 23–29 2025", variance: "+$5.2M", varColor: "up", tags: [{ cls: "pill-green", label: "Christmas peak" }] },
    { week: "W51", dates: "Dec 16–22 2025", variance: "+$1.9M", varColor: "up", tags: [{ cls: "pill-green", label: "Pre-holiday" }] },
  ],

  historyAI: {
    W9: { q: "How does W9 compare to current week?", a: `<strong>W9 showed the supply issue beginning to escalate.</strong><br><br>−$3.1M in W9 vs −$4.2M in W10 — a 35% week-on-week deterioration. Mexico Grocery was the single largest driver in both weeks. W9 was when trip dampening first activated.<br><br>The W9 Brazil early warning wasn't flagged — that's a W10 development that requires attention before W11.` },
    W8: { q: "What was different about W8?", a: `<strong>W8 was the inflection point.</strong><br><br>−$1.8M in W8 was the first week Mexico Grocery crossed the supply threshold. At that point it was flagged as 'watch' not 'critical'. The escalation to critical happened because supply ceiling wasn't adjusted in W8 or W9.<br><br>This underscores the compounding nature of supply constraint misses.` },
    W7: { q: "What drove the W7 outperformance?", a: `<strong>W7 was a clean week.</strong><br><br>+$0.6M was driven by EUP performing well ahead of the school holiday window and North America showing strong Super Bowl pre-order activity. No supply issues in any region.<br><br>In retrospect, W7 was the last week before Mexico Grocery supply began degrading.` },
    W4: { q: "What was the W4 promo success?", a: `<strong>W4 saw a coordinated promotional push in LATAM and EMEA.</strong><br><br>+$2.1M driven by a loyalty discount campaign in Mexico (Grocery) and France (Grocery). Lift was +22% vs plan in those markets during promo window, −4% post-promo (normal cannibalization). Net positive: +$2.1M.<br><br>Playbook is documented — candidate for repeat in W15 if supply normalizes.` },
  },
}

// ═══════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.uf-root {
  --navy: #112736;
  --navyMd: #1C3A4A;
  --navyLt: #2D5570;
  --gold: #FEA400;
  --green: #2ECC71;
  --red: #E74C3C;
  --amber: #F39C12;
  --blue: #3498DB;
  --text: #E8EFF4;
  --muted: #7A99AA;
  --border: #243D4D;
  --surface: #1A3345;
  --surfaceLt: #213C50;

  background: #0C1E2A;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.uf-root * { box-sizing: border-box; }

.uf-app {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--navy);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  margin: 8px;
  min-height: 0;
}

/* Top Bar */
.uf-topbar {
  background: #0C1E2A;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.uf-topbar-left { display: flex; align-items: center; gap: 14px; }
.uf-logo { font-size: 16px; font-weight: 700; }
.uf-logo span { color: var(--gold); }
.uf-week-badge {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  color: var(--muted);
}
.uf-topbar-right { display: flex; align-items: center; gap: 10px; }
.uf-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
.uf-status-text { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-avatar {
  width: 28px; height: 28px; border-radius: 50%; background: var(--navyLt);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: var(--gold);
}

/* Metric Toggle */
.uf-metric-toggle {
  display: flex; align-items: center; gap: 2px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 3px;
}
.uf-metric-btn {
  padding: 4px 11px; border-radius: 4px;
  font-size: 11px; font-weight: 600; cursor: pointer;
  font-family: 'DM Mono', monospace; letter-spacing: 0.5px;
  color: var(--muted); transition: all 0.15s;
  border: none; background: transparent;
}
.uf-metric-btn.active { background: var(--gold); color: #0C1E2A; }

/* Tabs */
.uf-tabs {
  display: flex; gap: 0;
  background: #0C1E2A;
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  flex-shrink: 0;
}
.uf-tab {
  padding: 10px 18px; font-size: 12px; font-weight: 500;
  color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s; user-select: none;
  background: none; border-top: none; border-left: none; border-right: none;
  font-family: 'Inter', sans-serif;
}
.uf-tab:hover { color: var(--text); }
.uf-tab.active { color: var(--text); border-bottom-color: var(--gold); }

/* Metric Strip */
.uf-metric-strip {
  background: rgba(254,164,0,0.05);
  border-bottom: 1px solid rgba(254,164,0,0.15);
  padding: 5px 20px;
  display: flex; align-items: center; gap: 7px;
  font-size: 10.5px; font-family: 'DM Mono', monospace;
  flex-shrink: 0;
}
.uf-metric-strip-label { color: var(--muted); }
.uf-metric-strip-value { color: var(--gold); font-weight: 600; letter-spacing: 0.5px; }
.uf-metric-strip-sep { color: var(--border); }
.uf-metric-strip-sub { color: var(--muted); font-size: 9.5px; }

/* Main Layout */
.uf-main {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Sidebar */
.uf-sidebar {
  background: #0F2533;
  border-right: 1px solid var(--border);
  padding: 16px 0;
  overflow-y: auto;
}
.uf-nav-section { margin-bottom: 20px; }
.uf-nav-label {
  font-size: 9px; font-weight: 600; letter-spacing: 2px;
  text-transform: uppercase; color: var(--muted);
  padding: 0 16px; margin-bottom: 6px;
  font-family: 'DM Mono', monospace;
}
.uf-nav-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 16px; font-size: 12px; cursor: pointer;
  color: var(--muted); transition: all 0.1s; user-select: none;
  border: none; background: none; width: 100%; text-align: left;
  font-family: 'Inter', sans-serif;
}
.uf-nav-item:hover { background: var(--surface); color: var(--text); }
.uf-nav-item.active { background: var(--surface); color: var(--text); border-left: 2px solid var(--gold); }
.uf-nav-pill {
  font-size: 9px; border-radius: 3px; padding: 2px 6px;
  font-family: 'DM Mono', monospace; font-weight: 500;
}
.pill-red { background: rgba(231,76,60,0.2); color: #E74C3C; }
.pill-amber { background: rgba(243,156,18,0.2); color: #F39C12; }
.pill-green { background: rgba(46,204,113,0.2); color: #2ECC71; }
.pill-blue { background: rgba(52,152,219,0.2); color: #3498DB; }

/* Centre */
.uf-centre {
  overflow-y: auto; padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
}

/* Signal Banner */
.uf-signal-banner {
  background: rgba(254,164,0,0.08);
  border: 1px solid rgba(254,164,0,0.25);
  border-radius: 8px; padding: 11px 14px;
  display: flex; align-items: flex-start; gap: 10px;
}
.uf-signal-banner.positive {
  background: rgba(46,204,113,0.08);
  border-color: rgba(46,204,113,0.25);
}
.uf-signal-banner.info {
  background: rgba(52,152,219,0.08);
  border-color: rgba(52,152,219,0.3);
}
.uf-signal-banner.critical {
  background: rgba(231,76,60,0.08);
  border-color: rgba(231,76,60,0.3);
}
.uf-signal-icon { font-size: 16px; margin-top: 1px; flex-shrink: 0; }
.uf-signal-text { font-size: 11.5px; line-height: 1.55; }
.uf-signal-text strong { color: var(--gold); display: block; margin-bottom: 2px; font-size: 12px; }
.uf-signal-banner.positive .uf-signal-text strong { color: var(--green); }
.uf-signal-banner.info .uf-signal-text strong { color: var(--blue); }
.uf-signal-banner.critical .uf-signal-text strong { color: var(--red); }

/* Stat Cards */
.uf-stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
.uf-stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px; cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}
.uf-stat-card:hover { border-color: var(--gold); transform: translateY(-1px); }
.uf-stat-label {
  font-size: 9.5px; color: var(--muted); font-family: 'DM Mono', monospace;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;
}
.uf-stat-value { font-size: 20px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
.uf-stat-delta { font-size: 10px; font-family: 'DM Mono', monospace; }
.uf-up { color: var(--green); }
.uf-down { color: var(--red); }
.uf-warn { color: var(--amber); }

/* Commentary */
.uf-commentary {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}
.uf-commentary-header {
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.uf-commentary-title { font-size: 12px; font-weight: 600; }
.uf-commentary-meta { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-commentary-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }

.uf-segment-row {
  display: flex; align-items: flex-start; gap: 10px;
  cursor: pointer; border-radius: 4px; padding: 8px;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border);
}
.uf-segment-row:last-child { border-bottom: none; }
.uf-segment-row:hover { background: rgba(254,164,0,0.04); }
.uf-segment-row.selected { background: rgba(254,164,0,0.07); border-left: 2px solid var(--gold); padding-left: 10px; }
.uf-seg-rank {
  width: 20px; height: 20px; border-radius: 4px;
  background: var(--navyLt); display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--gold); flex-shrink: 0; margin-top: 1px;
}
.uf-seg-content { flex: 1; }
.uf-seg-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
.uf-seg-text { font-size: 11px; color: var(--muted); line-height: 1.5; }
.uf-seg-tags { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
.uf-seg-tag {
  font-size: 9.5px; border-radius: 3px; padding: 2px 7px;
  font-family: 'DM Mono', monospace;
}

/* Chart */
.uf-chart-area {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 14px;
}
.uf-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.uf-chart-title { font-size: 12px; font-weight: 600; }
.uf-chart-legend { display: flex; gap: 12px; }
.uf-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--muted); }
.uf-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.uf-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
.uf-bar-group { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; cursor: pointer; position: relative; }
.uf-bar-pair { display: flex; align-items: flex-end; gap: 2px; }
.uf-bar { border-radius: 2px 2px 0 0; width: 10px; transition: height 0.4s ease; }
.uf-bar-label { font-size: 8.5px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-bar-tooltip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #0C1E2A; border: 1px solid var(--gold);
  border-radius: 5px; padding: 5px 9px; font-size: 10px; font-family: 'DM Mono', monospace;
  color: var(--text); pointer-events: none; z-index: 100; white-space: nowrap;
  opacity: 0; transition: opacity 0.15s;
}
.uf-bar-group:hover .uf-bar-tooltip { opacity: 1; }

/* Drill Down */
.uf-drill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.uf-drill-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px; cursor: pointer;
  transition: all 0.15s;
}
.uf-drill-card:hover { border-color: var(--gold); transform: translateY(-1px); }
.uf-drill-card.selected { border-color: var(--gold); }
.uf-drill-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.uf-drill-card-name { font-size: 12px; font-weight: 600; }
.uf-drill-card-region { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-drill-spark { display: flex; align-items: flex-end; gap: 3px; height: 36px; margin-bottom: 8px; }
.uf-spark-bar { width: 8px; border-radius: 1px 1px 0 0; transition: height 0.3s; }
.uf-drill-stats { display: flex; justify-content: space-between; }
.uf-drill-stat-item { text-align: center; }
.uf-drill-stat-val { font-size: 13px; font-weight: 700; }
.uf-drill-stat-lbl { font-size: 9px; color: var(--muted); font-family: 'DM Mono', monospace; margin-top: 1px; }

/* Exceptions */
.uf-exc-list { display: flex; flex-direction: column; gap: 8px; }
.uf-exc-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; gap: 12px;
}
.uf-exc-card:hover { border-color: rgba(254,164,0,0.4); transform: translateX(2px); }
.uf-exc-card.critical { border-left: 3px solid var(--red); }
.uf-exc-card.warning { border-left: 3px solid var(--amber); }
.uf-exc-card.positive { border-left: 3px solid var(--green); }
.uf-exc-card.selected { background: rgba(254,164,0,0.06); border-color: var(--gold); }
.uf-exc-icon { font-size: 18px; flex-shrink: 0; }
.uf-exc-body { flex: 1; }
.uf-exc-name { font-size: 12px; font-weight: 600; margin-bottom: 3px; }
.uf-exc-detail { font-size: 11px; color: var(--muted); line-height: 1.4; }
.uf-exc-meta { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
.uf-exc-right { text-align: right; flex-shrink: 0; }
.uf-exc-val { font-size: 16px; font-weight: 700; }
.uf-exc-week { font-size: 9px; color: var(--muted); font-family: 'DM Mono', monospace; }

/* Signals */
.uf-signals-list { display: flex; flex-direction: column; gap: 8px; }
.uf-signal-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px; cursor: pointer;
  transition: all 0.15s;
}
.uf-signal-card:hover { border-color: rgba(254,164,0,0.4); }
.uf-signal-card.selected { border-color: var(--gold); }
.uf-signal-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.uf-signal-card-name { font-size: 12px; font-weight: 600; }
.uf-signal-card-type { font-size: 9px; border-radius: 3px; padding: 2px 7px; font-family: 'DM Mono', monospace; }
.uf-signal-card-body { font-size: 11px; color: var(--muted); line-height: 1.5; }
.uf-signal-card-footer { display: flex; gap: 8px; margin-top: 6px; align-items: center; }
.uf-signal-conf { font-size: 9px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-signal-conf-bar { height: 3px; border-radius: 2px; background: var(--border); flex: 1; }
.uf-signal-conf-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }

/* History */
.uf-history-list { display: flex; flex-direction: column; gap: 6px; }
.uf-history-row {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 10px 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: all 0.15s;
}
.uf-history-row:hover { border-color: rgba(254,164,0,0.4); }
.uf-history-row.current { border-color: var(--gold); background: rgba(254,164,0,0.06); }
.uf-history-row.selected { border-color: var(--gold); }
.uf-history-week { font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; }
.uf-history-dates { font-size: 10px; color: var(--muted); margin-top: 2px; }
.uf-history-tags { display: flex; gap: 5px; }

/* AI Panel */
.uf-ai-panel {
  background: #0F2533;
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  min-height: 0;
}
.uf-ai-header {
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.uf-ai-icon { font-size: 14px; }
.uf-ai-title { font-size: 12px; font-weight: 600; }
.uf-ai-subtitle { font-size: 10px; color: var(--muted); }
.uf-ai-messages {
  flex: 1; overflow-y: auto; padding: 14px;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 0;
}
.uf-msg { display: flex; flex-direction: column; gap: 3px; }
.uf-msg-role {
  font-size: 9px; font-family: 'DM Mono', monospace; color: var(--muted);
  text-transform: uppercase; letter-spacing: 1px;
}
.uf-msg-bubble {
  border-radius: 8px; padding: 9px 12px;
  font-size: 11px; line-height: 1.55;
}
.uf-msg.user .uf-msg-bubble { background: var(--navyLt); color: var(--text); }
.uf-msg.ai .uf-msg-bubble { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
.uf-msg.ai .uf-msg-bubble strong { color: var(--gold); }
.uf-msg.typing .uf-msg-bubble { color: var(--muted); font-style: italic; }

.uf-sig-list { display: flex; flex-direction: column; gap: 5px; margin-top: 6px; }
.uf-sig-item { display: flex; align-items: center; gap: 7px; font-size: 10.5px; }
.uf-sig-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.uf-ai-input-area {
  padding: 12px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
  flex-shrink: 0;
}
.uf-ai-input {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 7px; padding: 8px 12px;
  font-size: 11px; color: var(--text); font-family: 'Inter', sans-serif;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: border-color 0.2s;
}
.uf-ai-input:hover { border-color: rgba(254,164,0,0.4); }
.uf-ai-input span { color: var(--muted); }
.uf-ai-send {
  font-size: 12px; cursor: pointer; background: var(--gold); color: #0C1E2A;
  border-radius: 4px; width: 22px; height: 22px; display: flex; align-items: center;
  justify-content: center; font-weight: 700; transition: opacity 0.15s;
  border: none;
}
.uf-ai-send:hover { opacity: 0.8; }

.uf-ai-suggestions { display: flex; flex-direction: column; gap: 5px; }
.uf-suggestion {
  background: rgba(254,164,0,0.05); border: 1px solid rgba(254,164,0,0.15);
  border-radius: 5px; padding: 5px 10px;
  font-size: 10px; color: var(--muted); cursor: pointer;
  font-family: 'DM Mono', monospace; transition: all 0.15s; user-select: none;
  text-align: left; width: 100%;
}
.uf-suggestion:hover { border-color: var(--gold); color: var(--gold); background: rgba(254,164,0,0.08); }

/* Bottom Bar */
.uf-bottombar {
  background: #0C1E2A; border-top: 1px solid var(--border);
  padding: 8px 20px; display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.uf-bottom-left { display: flex; gap: 16px; }
.uf-bottom-stat { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--muted); }
.uf-bottom-stat span { color: var(--text); font-weight: 600; }
.uf-bottom-right { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; }

/* Animation */
@keyframes ufFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.uf-fade-in { animation: ufFadeIn 0.25s ease forwards; }
`

// ═══════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════

export default function UberFluxPage() {
  // ── State ──
  const [region, setRegion] = useState<Region>("global")
  const [comparison, setComparison] = useState<Comparison>("plan")
  const [metric, setMetric] = useState<MetricType>("Trips")
  const [tab, setTab] = useState<TabType>("analysis")
  const [selectedSegment, setSelectedSegment] = useState(-1)
  const [selectedExc, setSelectedExc] = useState<string | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null)
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const aiMessagesRef = useRef<HTMLDivElement>(null)
  const typingRef = useRef<ReturnType<typeof setTimeout>>()

  // ── Derived data ──
  const regData = DATA.regions[region]
  const compData = DATA.comparisons[comparison]
  const metricData = metric === "Trips" ? regData.trips : regData.gbs

  const segments = (() => {
    const overrides = compData.segmentOverrides[region]
    if (overrides) return overrides
    return regData.segments.map((s) => ({
      ...s,
      variance: s.variance.replace(/vs \w+(\s+\w+)?/, compData.label),
    }))
  })()

  const totalVariance = metric === "Trips" ? (compData.totalVariance || metricData.variance) : metricData.variance
  const totalColor = compData.totalColor || metricData.color

  const regionPillMap: Record<Region, string> = {
    global: compData.stats.global,
    northamerica: compData.stats.na,
    latam: compData.stats.latam,
    emea: compData.stats.emea,
    apac: compData.stats.apac,
  }
  const regionPillColorMap: Record<Region, string> = {
    global: compData.pillColors.global,
    northamerica: compData.pillColors.na,
    latam: compData.pillColors.latam,
    emea: compData.pillColors.emea,
    apac: compData.pillColors.apac,
  }

  // ── AI helpers ──
  const scrollAI = useCallback(() => {
    setTimeout(() => {
      if (aiMessagesRef.current) {
        aiMessagesRef.current.scrollTop = aiMessagesRef.current.scrollHeight
      }
    }, 50)
  }, [])

  const addUserMsg = useCallback(
    (text: string) => {
      setAiMessages((prev) => [...prev, { role: "user", name: "Josh", text }])
      setIsTyping(true)
      scrollAI()
    },
    [scrollAI]
  )

  const addAIMsg = useCallback(
    (html: string, delay = 800) => {
      if (typingRef.current) clearTimeout(typingRef.current)
      typingRef.current = setTimeout(() => {
        setIsTyping(false)
        setAiMessages((prev) => [...prev, { role: "ai", name: "Uberflux AI", html }])
        scrollAI()
      }, delay)
    },
    [scrollAI]
  )

  // ── Seed AI on region change ──
  useEffect(() => {
    const r = DATA.regions[region]
    setAiMessages([...r.ai.messages])
    setSuggestions([...r.ai.suggestions])
    setIsTyping(false)
    if (typingRef.current) clearTimeout(typingRef.current)
  }, [region])

  // ── Scroll AI on message change ──
  useEffect(() => {
    scrollAI()
  }, [aiMessages, isTyping, scrollAI])

  // ── Tab hints ──
  const tabHints: Record<TabType, string> = {
    analysis: "Ask anything about this week",
    drilldown: "Click a segment card for deep-dive",
    exceptions: "Click an exception to diagnose",
    signals: "Click a signal for full analysis",
    history: "Click any week to compare",
  }

  // ── Handlers ──
  const handleRegionClick = (r: Region) => {
    if (r === region) return
    setRegion(r)
    setSelectedSegment(-1)
  }

  const handleComparisonClick = (c: Comparison) => {
    if (c === comparison) return
    setComparison(c)
    setSelectedSegment(-1)
    addUserMsg(`Switch to ${DATA.comparisons[c].label}`)
    addAIMsg(`<strong>${DATA.comparisons[c].label} loaded — ${regData.label}.</strong><br><br>${DATA.comparisons[c].aiA}`)
  }

  const handleMetricToggle = (m: MetricType) => {
    if (m === metric) return
    setMetric(m)
    addUserMsg(`Switch to ${m} view`)
    addAIMsg(
      `<strong>Now showing ${m === "GBs" ? "Gross Bookings (USD)" : "Trip volume"}.</strong><br><br>The variance patterns and rankings are identical — the underlying drivers don't change with the metric lens. ${m === "GBs" ? "GBs values are approximately 1.6× trip values based on current average order value." : "Trip volume is the operational metric — it directly reflects supply/demand balance."}`,
      700
    )
  }

  const handleSegmentClick = (idx: number, seg: Segment) => {
    setSelectedSegment(idx)
    addUserMsg(`Deep-dive: ${seg.name} (${compData.label})`)
    addAIMsg(
      `<strong>${seg.name} — ${compData.label} analysis:</strong><br><br>${seg.text}<br><br><strong>Variance:</strong> ${seg.variance} · <strong>Metric:</strong> ${metric}<br><strong>Tags:</strong> ${seg.tags.map((t) => t.label).join(", ")}`,
      750
    )
  }

  const handleSegmentNav = (segKey: string) => {
    const d = DATA.segmentNav[segKey]
    if (d) {
      addUserMsg(d.aiQ)
      addAIMsg(d.aiA, 850)
    }
  }

  const handleStatCardClick = (type: string) => {
    if (type === "variance") {
      addUserMsg(`What is driving the ${compData.label} variance of ${totalVariance}?`)
      addAIMsg(`<strong>Variance decomposition — ${regData.label} · ${compData.label}:</strong><br><br>${compData.signal || regData.signal.body}`, 750)
    } else if (type === "flagged") {
      addUserMsg(`Why are ${metricData.flagged} segments flagged this week?`)
      addAIMsg(`<strong>${metricData.flagged} segments flagged</strong> (${metricData.flaggedDetail}).<br><br>Flags trigger when variance exceeds 1.5 standard deviations from the rolling 8-week baseline, or when a supply/demand signal crosses a pre-defined threshold.`, 750)
    } else if (type === "driver") {
      addUserMsg(`Tell me more about the top driver: ${metricData.driver}`)
      addAIMsg(`<strong>Top driver: ${metricData.driver}</strong> — ${metricData.driverDetail}.<br><br>This factor accounts for approximately 50–65% of the total ${compData.label} variance in ${regData.label}. ${regData.signal.body}`, 750)
    }
  }

  const handleDrillClick = (seg: DrillSegment) => {
    setSelectedDrill(seg.id)
    const d = DATA.drillAI[seg.id]
    if (d) {
      addUserMsg(d.q)
      addAIMsg(d.a, 900)
    }
  }

  const handleExcClick = (exc: ExceptionItem) => {
    setSelectedExc(exc.id)
    addUserMsg(exc.aiQ)
    addAIMsg(exc.aiA, 900)
  }

  const handleSignalClick = (idx: number, sig: SignalItem) => {
    setSelectedSignal(idx)
    const n = Math.round(sig.confidence * 0.18 + 4)
    addUserMsg(`Explain this signal: ${sig.name}`)
    addAIMsg(
      `<strong>${sig.name}</strong><br><br><strong>Type:</strong> ${sig.type} · <strong>Confidence: <span style="color:${sig.confColor}">${sig.confidence}%</span></strong><br><br>${sig.body}<br><br>Model basis: ${n} comparable historical patterns in the 52-week training window. Signal generated at 08:38 AM from 9/9 reconciled data sources.`,
      800
    )
  }

  const handleHistoryClick = (h: HistoryItem) => {
    setSelectedHistory(h.week)
    const d = DATA.historyAI[h.week]
    const q = d ? d.q : `Summarize ${h.week} (${h.dates})`
    const a = d
      ? d.a
      : `<strong>${h.week} — ${h.dates}</strong><br><br>Total variance vs Plan: <strong class="uf-${h.varColor}">${h.variance}</strong><br><br>Primary drivers: ${h.tags.map((t) => t.label).join(", ")}.`
    addUserMsg(q)
    addAIMsg(a, 800)
  }

  const handleSuggestionClick = (s: string) => {
    addUserMsg(s)
    const lastAi = regData.ai.messages.filter((m) => m.role === "ai").pop()
    addAIMsg(
      `<strong>${s}</strong><br><br>Analyzing for <em>${regData.label}</em> — ${metric} · ${compData.label}.<br><br>${lastAi?.html || lastAi?.text || ""}`,
      850
    )
  }

  const handleSendClick = () => {
    const questions = [
      {
        q: `What is the single most important action for ${regData.label} this week?`,
        a: `<strong>Top action — ${regData.label}:</strong><br><br>${regData.ai.messages.filter((m) => m.role === "ai").pop()?.html || ""}`,
      },
      {
        q: "Which regions are most at risk next week?",
        a: `<strong>W11 risk ranking:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>LATAM — Mexico supply constraint accelerating.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>LATAM — Brazil Convenience at 61% util.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#3498DB"></div>APAC — AU weather recovery uncertain.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NA — Super Bowl recovery expected.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>EMEA — Holiday normalizing, no risks.</div></div>`,
      },
      {
        q: `Summarize the ${compData.label} view in one sentence`,
        a: `<strong>${compData.label} summary:</strong> ${compData.signal || regData.signal.body}`,
      },
    ]
    const pick = questions[Math.floor(Math.random() * questions.length)]
    addUserMsg(pick.q)
    addAIMsg(pick.a, 900)
  }

  // ── Chart render ──
  const renderChart = () => {
    const bars = regData.chart.bars
    const chartTitle = regData.chart.title + (metric === "GBs" ? " (GBs)" : " (Trips)")
    return (
      <div className="uf-chart-area">
        <div className="uf-chart-header">
          <div className="uf-chart-title">{chartTitle}</div>
          <div className="uf-chart-legend">
            <div className="uf-legend-item">
              <div className="uf-legend-dot" style={{ background: "#FEA400" }} />
              Actual
            </div>
            <div className="uf-legend-item">
              <div className="uf-legend-dot" style={{ background: "#4A7A9B" }} />
              Plan
            </div>
          </div>
        </div>
        <div className="uf-bars">
          {bars.map((b) => {
            const multiplier = metric === "GBs" ? 1.6 : 1
            const actual = Math.round(b.actual * multiplier)
            const plan = Math.round(b.plan * multiplier)
            const maxH = 74
            const aH = Math.max(3, Math.round((actual / (plan * 1.15)) * maxH))
            const pH = Math.round((plan / (plan * 1.15)) * maxH)
            const unit = metric === "GBs" ? "M GBs" : "K trips"
            return (
              <div key={b.week} className="uf-bar-group">
                <div className="uf-bar-tooltip">
                  {b.week}: {actual}
                  {unit} actual / {plan}
                  {unit} plan
                </div>
                <div className="uf-bar-pair">
                  <div
                    className="uf-bar"
                    style={{
                      height: `${aH}px`,
                      background: b.color,
                      opacity: b.forecast ? 0.5 : 0.85,
                      border: b.forecast ? `1px dashed ${b.color}` : undefined,
                      borderBottom: b.forecast ? "none" : undefined,
                    }}
                  />
                  <div className="uf-bar" style={{ height: `${pH}px`, background: "#4A7A9B", opacity: b.forecast ? 0.3 : 0.55 }} />
                </div>
                <div className="uf-bar-label" style={{ color: b.forecast ? b.color : undefined }}>
                  {b.week}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Regions list ──
  const regionItems: { key: Region; label: string }[] = [
    { key: "global", label: "Global" },
    { key: "northamerica", label: "North America" },
    { key: "latam", label: "LATAM" },
    { key: "emea", label: "EMEA" },
    { key: "apac", label: "APAC" },
  ]

  const comparisonItems: { key: Comparison; label: string }[] = [
    { key: "plan", label: "vs Plan" },
    { key: "priorweek", label: "vs Prior Week" },
    { key: "prioryear", label: "vs Prior Year" },
    { key: "forecast", label: "vs Forecast" },
    { key: "runrate", label: "vs Run Rate" },
  ]

  const segmentNavItems = [
    { key: "grocery", label: "Grocery", pillCls: "pill-red", pill: "−$2.1M" },
    { key: "convenience", label: "Convenience", pillCls: "pill-amber", pill: "−$0.9M" },
    { key: "alcohol", label: "Alcohol", pillCls: "pill-green", pill: "+$0.4M" },
    { key: "pharmacy", label: "Pharmacy", pillCls: "pill-blue", pill: "flat" },
  ]

  const tabs: { key: TabType; label: string }[] = [
    { key: "analysis", label: "Analysis" },
    { key: "drilldown", label: "Drill-Down" },
    { key: "exceptions", label: "Exceptions" },
    { key: "signals", label: "Signals" },
    { key: "history", label: "History" },
  ]

  // ═════════════════════════════════════════════════════
  //  JSX
  // ═════════════════════════════════════════════════════

  return (
    <div className="uf-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="uf-app">
        {/* ── Top Bar ── */}
        <div className="uf-topbar">
          <div className="uf-topbar-left">
            <div className="uf-logo">
              Uber<span>flux</span>
            </div>
            <div className="uf-week-badge">{regData.week} · Generated 08:38 AM</div>
          </div>
          <div className="uf-topbar-right">
            <div className="uf-metric-toggle">
              {(["Trips", "GBs"] as MetricType[]).map((m) => (
                <button key={m} className={`uf-metric-btn ${metric === m ? "active" : ""}`} onClick={() => handleMetricToggle(m)}>
                  {m}
                </button>
              ))}
            </div>
            <div className="uf-status-dot" />
            <div className="uf-status-text">All sources reconciled · 9/9</div>
            <div className="uf-avatar">JO</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="uf-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`uf-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Metric Strip ── */}
        <div className="uf-metric-strip">
          <span className="uf-metric-strip-label">Viewing</span>
          <span className="uf-metric-strip-value">{metric}</span>
          <span className="uf-metric-strip-sep">·</span>
          <span className="uf-metric-strip-sub">
            {metric === "GBs" ? "Showing Gross Bookings — all values in USD millions" : "Click GBs above to switch to Gross Bookings view"}
          </span>
        </div>

        {/* ── Main ── */}
        <div className="uf-main">
          {/* ── Left Sidebar ── */}
          <div className="uf-sidebar">
            <div className="uf-nav-section">
              <div className="uf-nav-label">Regions</div>
              {regionItems.map((r) => (
                <button key={r.key} className={`uf-nav-item ${region === r.key ? "active" : ""}`} onClick={() => handleRegionClick(r.key)}>
                  {r.label}
                  <span className={`uf-nav-pill ${regionPillColorMap[r.key]}`}>{regionPillMap[r.key]}</span>
                </button>
              ))}
            </div>
            <div className="uf-nav-section">
              <div className="uf-nav-label">Comparison</div>
              {comparisonItems.map((c) => (
                <button key={c.key} className={`uf-nav-item ${comparison === c.key ? "active" : ""}`} onClick={() => handleComparisonClick(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="uf-nav-section">
              <div className="uf-nav-label">Segments</div>
              {segmentNavItems.map((s) => (
                <button key={s.key} className="uf-nav-item" onClick={() => handleSegmentNav(s.key)}>
                  {s.label}
                  <span className={`uf-nav-pill ${s.pillCls}`}>{s.pill}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Centre Panel ── */}
          <div className="uf-centre">
            {/* ANALYSIS TAB */}
            {tab === "analysis" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Signal Banner */}
                <div className={`uf-signal-banner ${regData.signal.positive ? "positive" : ""}`}>
                  <div className="uf-signal-icon">{regData.signal.icon}</div>
                  <div className="uf-signal-text">
                    <strong>
                      {compData.label} · {metric} · {regData.label}
                    </strong>
                    {compData.signal || regData.signal.body}
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="uf-stat-row">
                  <div className="uf-stat-card" onClick={() => handleStatCardClick("variance")}>
                    <div className="uf-stat-label">Total Variance</div>
                    <div className={`uf-stat-value uf-${totalColor}`}>{totalVariance}</div>
                    <div className={`uf-stat-delta uf-${totalColor}`}>
                      {totalColor === "up" ? "▲" : "▼"} {compData.label}
                    </div>
                  </div>
                  <div className="uf-stat-card" onClick={() => handleStatCardClick("flagged")}>
                    <div className="uf-stat-label">Segments Flagged</div>
                    <div className="uf-stat-value uf-warn">{metricData.flagged}</div>
                    <div className="uf-stat-delta uf-warn">{metricData.flaggedDetail}</div>
                  </div>
                  <div className="uf-stat-card" onClick={() => handleStatCardClick("driver")}>
                    <div className="uf-stat-label">Top Driver</div>
                    <div className="uf-stat-value" style={{ fontSize: 13, paddingTop: 3 }}>
                      {metricData.driver}
                    </div>
                    <div className="uf-stat-delta uf-down">{metricData.driverDetail}</div>
                  </div>
                  <div className="uf-stat-card">
                    <div className="uf-stat-label">Commentary</div>
                    <div className="uf-stat-value uf-up" style={{ fontSize: 14, paddingTop: 3 }}>
                      Ready
                    </div>
                    <div className="uf-stat-delta" style={{ color: "var(--muted)" }}>
                      08:38 AM ✓
                    </div>
                  </div>
                </div>

                {/* Commentary */}
                <div className="uf-commentary">
                  <div className="uf-commentary-header">
                    <div className="uf-commentary-title">AI-Generated Commentary — Ranked by Revenue Impact</div>
                    <div className="uf-commentary-meta">
                      {metric} · {compData.label} · Validated · 12 segments · 5 comparison types
                    </div>
                  </div>
                  <div className="uf-commentary-body">
                    {segments.map((seg, i) => (
                      <div
                        key={i}
                        className={`uf-segment-row ${selectedSegment === i ? "selected" : ""}`}
                        onClick={() => handleSegmentClick(i, seg)}
                      >
                        <div className="uf-seg-rank">{seg.rank}</div>
                        <div className="uf-seg-content">
                          <div className="uf-seg-name">
                            {seg.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>— {seg.variance}</span>
                          </div>
                          <div className="uf-seg-text">{seg.text}</div>
                          <div className="uf-seg-tags">
                            {seg.tags.map((t, ti) => (
                              <span key={ti} className={`uf-seg-tag ${t.cls}`}>
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                {renderChart()}
              </div>
            )}

            {/* DRILL-DOWN TAB */}
            {tab === "drilldown" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="uf-signal-banner info">
                  <div className="uf-signal-icon">🔍</div>
                  <div className="uf-signal-text">
                    <strong>Drill-Down — Segment Performance · W10</strong>
                    Click any segment card to load detailed commentary and update the AI panel context.
                  </div>
                </div>
                <div className="uf-drill-grid">
                  {DATA.drillSegments.map((seg) => {
                    const minV = Math.min(...seg.spark)
                    const maxV = Math.max(...seg.spark)
                    const metricTrips = metric === "GBs" ? (parseFloat(seg.trips) * 1.6).toFixed(2) + "M GBs" : seg.trips + " trips"
                    return (
                      <div
                        key={seg.id}
                        className={`uf-drill-card ${selectedDrill === seg.id ? "selected" : ""}`}
                        onClick={() => handleDrillClick(seg)}
                      >
                        <div className="uf-drill-card-header">
                          <div>
                            <div className="uf-drill-card-name">{seg.name}</div>
                            <div className="uf-drill-card-region">{seg.region}</div>
                          </div>
                          <div className={`uf-stat-delta uf-${seg.varColor}`} style={{ fontSize: 12, fontWeight: 700 }}>
                            {seg.variance}
                          </div>
                        </div>
                        <div className="uf-drill-spark">
                          {seg.spark.map((v, i) => {
                            const h = Math.max(4, Math.round(((v - minV) / Math.max(maxV - minV, 1)) * 30))
                            const isLast = i === seg.spark.length - 1
                            const col = seg.varColor === "up" ? "#2ECC71" : isLast ? "#E74C3C" : "#4A7A9B"
                            return <div key={i} className="uf-spark-bar" style={{ height: h, background: col, opacity: isLast ? 1 : 0.6 }} />
                          })}
                        </div>
                        <div className="uf-drill-stats">
                          <div className="uf-drill-stat-item">
                            <div className="uf-drill-stat-val" style={{ color: seg.utilColor }}>
                              {seg.util}
                            </div>
                            <div className="uf-drill-stat-lbl">Courier Util</div>
                          </div>
                          <div className="uf-drill-stat-item">
                            <div className="uf-drill-stat-val">{metricTrips}</div>
                            <div className="uf-drill-stat-lbl">{metric} W10</div>
                          </div>
                          <div className="uf-drill-stat-item">
                            <div className={`uf-drill-stat-val uf-${seg.varColor}`}>{seg.tripsVsPlan}</div>
                            <div className="uf-drill-stat-lbl">vs Plan</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* EXCEPTIONS TAB */}
            {tab === "exceptions" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="uf-signal-banner critical">
                  <div className="uf-signal-icon">🚨</div>
                  <div className="uf-signal-text">
                    <strong>3 Critical · 2 Warning · 2 Positive — W10 Exceptions</strong>
                    Click any exception to see full AI diagnosis and recommended action in the query panel.
                  </div>
                </div>
                <div className="uf-exc-list">
                  {DATA.exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className={`uf-exc-card ${exc.severity} ${selectedExc === exc.id ? "selected" : ""}`}
                      onClick={() => handleExcClick(exc)}
                    >
                      <div className="uf-exc-icon">{exc.icon}</div>
                      <div className="uf-exc-body">
                        <div className="uf-exc-name">{exc.name}</div>
                        <div className="uf-exc-detail">{exc.detail}</div>
                        <div className="uf-exc-meta">
                          {exc.tags.map((t, i) => (
                            <span key={i} className={`uf-seg-tag ${t.cls}`}>
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="uf-exc-right">
                        <div className={`uf-exc-val ${exc.severity === "positive" ? "uf-up" : exc.severity === "critical" ? "uf-down" : "uf-warn"}`}>
                          {exc.value}
                        </div>
                        <div className="uf-exc-week">{exc.week}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SIGNALS TAB */}
            {tab === "signals" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="uf-signal-banner">
                  <div className="uf-signal-icon">📡</div>
                  <div className="uf-signal-text">
                    <strong>ML Signal Radar — 6 Active Signals · W10</strong>
                    Predictive flags generated from 14-day rolling models. Confidence scores reflect historical accuracy on similar patterns.
                  </div>
                </div>
                <div className="uf-signals-list">
                  {DATA.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className={`uf-signal-card ${selectedSignal === idx ? "selected" : ""}`}
                      onClick={() => handleSignalClick(idx, sig)}
                    >
                      <div className="uf-signal-card-header">
                        <div className="uf-signal-card-name">{sig.name}</div>
                        <span className={`uf-signal-card-type ${sig.typeCls}`}>{sig.type}</span>
                      </div>
                      <div className="uf-signal-card-body">{sig.body}</div>
                      <div className="uf-signal-card-footer">
                        <span className="uf-signal-conf">Confidence: {sig.confidence}%</span>
                        <div className="uf-signal-conf-bar">
                          <div className="uf-signal-conf-fill" style={{ width: `${sig.confidence}%`, background: sig.confColor }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === "history" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="uf-signal-banner info">
                  <div className="uf-signal-icon">📅</div>
                  <div className="uf-signal-text">
                    <strong>12-Week Rolling History · Global</strong>
                    Click any week to load that period&apos;s data across the full workbench.
                  </div>
                </div>
                <div className="uf-history-list">
                  {DATA.history.map((h) => (
                    <div
                      key={h.week}
                      className={`uf-history-row ${h.current ? "current" : ""} ${selectedHistory === h.week ? "selected" : ""}`}
                      onClick={() => handleHistoryClick(h)}
                    >
                      <div>
                        <div className="uf-history-week">
                          {h.week}
                          {h.current && (
                            <span style={{ color: "var(--gold)", fontSize: 9, marginLeft: 6 }}>← CURRENT</span>
                          )}
                        </div>
                        <div className="uf-history-dates">{h.dates}</div>
                      </div>
                      <div className="uf-history-tags">
                        {h.tags.map((t, i) => (
                          <span key={i} className={`uf-seg-tag ${t.cls}`}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                      <div className={`uf-${h.varColor}`} style={{ fontSize: 15, fontWeight: 700 }}>
                        {h.variance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right AI Panel ── */}
          <div className="uf-ai-panel">
            <div className="uf-ai-header">
              <div className="uf-ai-icon">✦</div>
              <div>
                <div className="uf-ai-title">AI Query</div>
                <div className="uf-ai-subtitle">{tabHints[tab]}</div>
              </div>
            </div>

            <div className="uf-ai-messages" ref={aiMessagesRef}>
              {aiMessages.map((msg, i) => (
                <div key={i} className={`uf-msg ${msg.role} uf-fade-in`}>
                  <div className="uf-msg-role">{msg.name}</div>
                  {msg.html ? (
                    <div className="uf-msg-bubble" dangerouslySetInnerHTML={{ __html: msg.html }} />
                  ) : (
                    <div className="uf-msg-bubble">{msg.text}</div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="uf-msg ai typing uf-fade-in">
                  <div className="uf-msg-role">Uberflux AI</div>
                  <div className="uf-msg-bubble">
                    <span style={{ opacity: 0.5 }}>●</span> <span style={{ opacity: 0.3 }}>●</span>{" "}
                    <span style={{ opacity: 0.15 }}>●</span>
                  </div>
                </div>
              )}
            </div>

            <div className="uf-ai-input-area">
              <div className="uf-ai-input" onClick={handleSendClick}>
                <span>Ask about any segment or signal...</span>
                <button className="uf-ai-send">↑</button>
              </div>
              <div className="uf-ai-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="uf-suggestion" onClick={() => handleSuggestionClick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="uf-bottombar">
          <div className="uf-bottom-left">
            <div className="uf-bottom-stat">
              Sources <span>9/9</span>
            </div>
            <div className="uf-bottom-stat">
              Segments <span>12</span>
            </div>
            <div className="uf-bottom-stat">
              Comparison <span>{compData.label}</span>
            </div>
            <div className="uf-bottom-stat">
              Generated <span>08:38 AM</span>
            </div>
          </div>
          <div className="uf-bottom-right">Uberflux · Week 10 · {regData.label}</div>
        </div>
      </div>
    </div>
  )
}
