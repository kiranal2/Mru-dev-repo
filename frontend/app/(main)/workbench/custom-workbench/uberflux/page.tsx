"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  WorkbenchAiPanel,
  type AiFeedItem,
} from "@/components/shared/workbench-ai-panel"
import {
  WorkbenchActionStrip,
  type WorkbenchAction,
} from "@/components/shared/workbench-action-strip"
import {
  deriveChatActions,
  resolveChatActions,
  type AiResponsePayload,
} from "@/lib/derive-chat-actions"
import { useIndustry } from "@/hooks/use-industry"

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

type Region = "national" | "northeast" | "southeast" | "midwest" | "west" | "southwest"
type Comparison = "plan" | "priorweek" | "prioryear" | "forecast" | "runrate"
type MetricType = "Revenue" | "Orders"
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
  revenue: RegionMetric
  orders: RegionMetric
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
  stats: { national: string; ne: string; se: string; mw: string; w: string; sw: string }
  pillColors: { national: string; ne: string; se: string; mw: string; w: string; sw: string }
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
    national: {
      label: "National",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "−$3.8M", delta: "▼ vs Plan", color: "down", flagged: "8", flaggedDetail: "3 critical", driver: "Labor", driverDetail: "CA wage surge ↑" },
      orders: { variance: "−$5.1M", delta: "▼ vs Plan", color: "down", flagged: "10", flaggedDetail: "4 critical", driver: "Demand", driverDetail: "Consumer softness" },
      signal: { icon: "⚡", title: "Predictive Signal — Watch Next Week", body: "California Retail labor costs surging post minimum-wage hike — LA and SF markets 12% above budget. Margin compression accelerating for 3rd consecutive week. ML model projects continued −2% to −4% margin erosion if staffing model not adjusted before Thursday.", positive: false },
      segments: [
        { rank: 1, name: "California Retail", variance: "−$1.6M vs Plan", text: "Labor cost surge in LA/SF markets following minimum wage increase. Overtime hours 18% above plan. Margin compression accelerating — similar pattern to 2024 Q1 NY wage adjustment. Partial offset from productivity automation rollout.", tags: [{ cls: "pill-red", label: "Labor cost surge" }, { cls: "pill-amber", label: "Historical match NY Q1 2024" }, { cls: "pill-blue", label: "Predictive flag" }] },
        { rank: 2, name: "Texas Energy", variance: "−$0.8M vs Plan", text: "Natural gas spot price drop 18% WoW. Revenue per unit compressed across Permian Basin operations. Hedging program covered 60% of exposure — unhedged portion driving miss.", tags: [{ cls: "pill-amber", label: "Commodity exposure" }, { cls: "pill-blue", label: "Hedge partial cover" }] },
        { rank: 3, name: "New York Financial Svcs", variance: "+$0.7M vs Plan", text: "Strong Q1 trading revenue. Equity desk +22% vs plan on volatility. Fixed income steady. Advisory pipeline converting ahead of schedule.", tags: [{ cls: "pill-green", label: "Positive variance" }, { cls: "pill-green", label: "Trading outperformance" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — California Retail",
        bars: [
          { week: "W6", actual: 58, plan: 62, color: "#1E40AF" },
          { week: "W7", actual: 56, plan: 62, color: "#1E40AF" },
          { week: "W8", actual: 52, plan: 62, color: "#1E40AF" },
          { week: "W9", actual: 46, plan: 62, color: "var(--red)" },
          { week: "W10", actual: 42, plan: 62, color: "var(--red)" },
          { week: "W11▸", actual: 39, plan: 62, color: "var(--red)", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What are the most significant exceptions this week?" },
          { role: "ai", name: "Meeru AI", html: `<strong>3 exceptions ranked by significance:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>California Retail labor cost surge — 3rd consecutive week, accelerating margin compression</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Texas Energy natural gas price drop — 18% spot decline, unhedged exposure</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NY Financial Svcs positive — Q1 trading outperformance, no action needed</div></div>` },
          { role: "user", name: "Josh", text: "What should we watch before Thursday?" },
          { role: "ai", name: "Meeru AI", html: `<strong>California staffing model.</strong> Labor costs have exceeded budget for 3 weeks running. If the current overtime trajectory holds, ML model projects −2% to −4% additional margin erosion in W11. Recommend reviewing shift scheduling and automation deployment with West region ops before earnings prep.` },
        ],
        suggestions: ["Why did the West underperform?", "Compare W10 to Q1 2024 NY wage event", "Which signals need action?"],
      },
    },
    northeast: {
      label: "Northeast",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "+$0.4M", delta: "▲ vs Plan", color: "up", flagged: "2", flaggedDetail: "0 critical", driver: "Trading", driverDetail: "Q1 vol uplift" },
      orders: { variance: "+$0.6M", delta: "▲ vs Plan", color: "up", flagged: "1", flaggedDetail: "0 critical", driver: "Demand", driverDetail: "Advisory pipeline" },
      signal: { icon: "✅", title: "Positive: Northeast Financial Services Outperforming", body: "NY trading desks beating plan on elevated market volatility. Q1 advisory pipeline converting 3 weeks ahead of schedule. MA Healthcare insurance delays are a watch item but non-critical.", positive: true },
      segments: [
        { rank: 1, name: "New York Financial Svcs", variance: "+$0.7M vs Plan", text: "Strong Q1 trading revenue driven by equity desk volatility capture. Fixed income on plan. Advisory pipeline converting ahead of schedule — 3 deals closed early in W9–W10.", tags: [{ cls: "pill-green", label: "Trading outperformance" }, { cls: "pill-green", label: "Pipeline acceleration" }] },
        { rank: 2, name: "Massachusetts Healthcare", variance: "−$0.2M vs Plan", text: "Insurance reimbursement processing delays from 2 major carriers. Claims backlog building — 14-day average turnaround vs 9-day target. Carrier escalation in progress.", tags: [{ cls: "pill-amber", label: "Reimbursement delays" }, { cls: "pill-blue", label: "Carrier escalation" }] },
        { rank: 3, name: "Connecticut Insurance", variance: "−$0.1M vs Plan", text: "Winter storm claims backlog from February events still processing. Adjuster capacity at 92% utilization. Expected clearance by W12.", tags: [{ cls: "pill-amber", label: "Claims backlog" }, { cls: "pill-blue", label: "W12 clearance" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — NY Financial Svcs",
        bars: [
          { week: "W6", actual: 54, plan: 52, color: "var(--green)" },
          { week: "W7", actual: 55, plan: 52, color: "var(--green)" },
          { week: "W8", actual: 56, plan: 52, color: "var(--green)" },
          { week: "W9", actual: 58, plan: 52, color: "var(--green)" },
          { week: "W10", actual: 60, plan: 52, color: "var(--green)" },
          { week: "W11▸", actual: 57, plan: 52, color: "var(--green)", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What is driving the Northeast outperformance?" },
          { role: "ai", name: "Meeru AI", html: `<strong>New York Financial Services is the engine</strong> at +$0.7M vs Plan. Equity trading desks captured elevated volatility in W9–W10 — VIX averaged 22 vs modeled 18. Advisory pipeline also contributing with 3 deals closing ahead of Q1 schedule.<br><br>MA Healthcare (−$0.2M) and CT Insurance (−$0.1M) are minor headwinds that partially offset the trading gains.` },
          { role: "user", name: "Josh", text: "Will Northeast continue outperforming in W11?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Likely modest pullback.</strong> Volatility is expected to normalize post-FOMC — W11 projection shows +$0.2M vs plan (down from +$0.4M). MA Healthcare carrier escalation should begin clearing the reimbursement backlog. CT Insurance claims processing on track for W12 clearance.` },
        ],
        suggestions: ["NY trading desk breakdown", "MA carrier escalation status", "Northeast vs Prior Year"],
      },
    },
    southeast: {
      label: "Southeast",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "−$0.6M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Demand", driverDetail: "Tourism shift" },
      orders: { variance: "−$0.8M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Logistics", driverDetail: "Port congestion" },
      signal: { icon: "⚠️", title: "Watch: Florida Tourism Calendar Shift Impact", body: "Spring break timing shifted to W11 this year (W10 in 2025). Florida tourism revenue timing mismatch of −$0.4M. Expected full recovery in W11. Savannah port congestion adding logistics headwind.", positive: false },
      segments: [
        { rank: 1, name: "Florida Tourism", variance: "−$0.4M vs Plan", text: "Spring break calendar shift — peak week moved from W10 to W11 this year. Hotel occupancy 71% vs 84% plan. Bookings for W11 are strong, suggesting timing shift not demand loss.", tags: [{ cls: "pill-amber", label: "Calendar shift" }, { cls: "pill-blue", label: "W11 recovery expected" }] },
        { rank: 2, name: "Georgia Logistics", variance: "−$0.3M vs Plan", text: "Port of Savannah congestion — vessel queue at 8 ships vs normal 3. Container dwell time 6.2 days vs 3.8 target. Revenue recognition delayed on shipments stuck at port.", tags: [{ cls: "pill-amber", label: "Port congestion" }, { cls: "pill-amber", label: "Revenue timing" }] },
        { rank: 3, name: "North Carolina Tech", variance: "+$0.1M vs Plan", text: "Research Triangle hiring momentum continuing. Enterprise software deals closing ahead of schedule. Talent pipeline healthy.", tags: [{ cls: "pill-green", label: "Hiring momentum" }, { cls: "pill-green", label: "Pipeline strong" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — Florida Tourism",
        bars: [
          { week: "W6", actual: 60, plan: 62, color: "#1E40AF" },
          { week: "W7", actual: 61, plan: 62, color: "#1E40AF" },
          { week: "W8", actual: 62, plan: 62, color: "var(--green)" },
          { week: "W9", actual: 59, plan: 62, color: "#d97706" },
          { week: "W10", actual: 54, plan: 62, color: "var(--red)" },
          { week: "W11▸", actual: 65, plan: 62, color: "var(--green)", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What drove the Southeast miss this week?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Two timing-related issues:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Florida Tourism — spring break calendar shift from W10 to W11 (−$0.4M timing)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Georgia Logistics — Savannah port congestion delaying revenue recognition (−$0.3M)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NC Tech partially offset with early deal closures (+$0.1M)</div></div>` },
          { role: "user", name: "Josh", text: "Will Southeast recover next week?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Strong recovery expected.</strong> Florida tourism W11 bookings are tracking 18% above W10 — spring break peak will drive a reversal. Georgia port congestion is improving (queue down to 6 ships from 8). W11 projection: +$0.3M vs Plan.` },
        ],
        suggestions: ["Florida W11 booking data", "Savannah port queue trend", "NC Tech pipeline detail"],
      },
    },
    midwest: {
      label: "Midwest",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "−$0.9M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Supply Chain", driverDetail: "Chicago hub" },
      orders: { variance: "−$1.3M", delta: "▼ vs Plan", color: "down", flagged: "4", flaggedDetail: "2 critical", driver: "Production", driverDetail: "EV transition" },
      signal: { icon: "🔧", title: "Watch: Illinois Manufacturing Supply Chain Bottleneck", body: "Chicago distribution hub operating at 94% capacity — above 90% stress threshold for 2nd week. Rail car shortage compounding. Michigan EV transition production pause adding to regional miss.", positive: false },
      segments: [
        { rank: 1, name: "Illinois Manufacturing", variance: "−$0.5M vs Plan", text: "Chicago distribution hub bottleneck — rail car shortage limiting outbound shipments. Hub capacity at 94%, above 90% stress threshold. Order fulfillment cycle time 8.2 days vs 5.5 target.", tags: [{ cls: "pill-red", label: "Supply chain bottleneck" }, { cls: "pill-amber", label: "Rail shortage" }] },
        { rank: 2, name: "Michigan Auto", variance: "−$0.3M vs Plan", text: "EV transition production pause at 2 plants. ICE-to-EV line retooling on schedule but output gap in W9–W11. Supplier qualification for battery components 85% complete.", tags: [{ cls: "pill-amber", label: "EV transition" }, { cls: "pill-blue", label: "Retooling on schedule" }] },
        { rank: 3, name: "Ohio Agriculture", variance: "−$0.1M vs Plan", text: "Early frost in W8 delayed planting across 12% of contracted acreage. Crop insurance claims filed. Revenue impact minor — bulk of agricultural revenue is Q3/Q4 weighted.", tags: [{ cls: "pill-amber", label: "Frost delay" }, { cls: "pill-blue", label: "Insurance filed" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — Illinois Manufacturing",
        bars: [
          { week: "W6", actual: 61, plan: 62, color: "#1E40AF" },
          { week: "W7", actual: 60, plan: 62, color: "#1E40AF" },
          { week: "W8", actual: 57, plan: 62, color: "#d97706" },
          { week: "W9", actual: 53, plan: 62, color: "var(--red)" },
          { week: "W10", actual: 50, plan: 62, color: "var(--red)" },
          { week: "W11▸", actual: 54, plan: 62, color: "#d97706", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What is driving the Midwest miss?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Two structural issues:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Illinois Manufacturing — Chicago hub bottleneck at 94% capacity, rail car shortage limiting outbound (−$0.5M)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Michigan Auto — EV transition production pause during retooling (−$0.3M)</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Ohio Agriculture — early frost crop delay, minor impact (−$0.1M)</div></div>` },
          { role: "user", name: "Josh", text: "When does the Midwest normalize?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Phased recovery W11–W13.</strong> Chicago hub rail car allocation increases W11 (Union Pacific confirmed +15% capacity). Michigan EV retooling completes W12 — first EV units off line W13. Ohio frost impact is immaterial near-term. Net W11 projection: −$0.5M vs Plan, improving from −$0.9M.` },
        ],
        suggestions: ["Chicago hub capacity detail", "Michigan EV retooling timeline", "Ohio crop insurance status"],
      },
    },
    west: {
      label: "West",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "−$1.6M", delta: "▼ vs Plan", color: "down", flagged: "4", flaggedDetail: "2 critical", driver: "Labor", driverDetail: "CA min wage ↑" },
      orders: { variance: "−$2.1M", delta: "▼ vs Plan", color: "down", flagged: "5", flaggedDetail: "3 critical", driver: "Demand", driverDetail: "Enterprise deferrals" },
      signal: { icon: "🚨", title: "Critical: West Region Labor + Demand Squeeze", body: "California Retail driving 75% of West miss with labor cost surge post minimum-wage hike. Washington Tech adding −$0.6M on enterprise contract deferrals. Combined W11 risk: −$2.0M if CA staffing model not adjusted.", positive: false },
      segments: [
        { rank: 1, name: "California Retail", variance: "−$1.2M vs Plan", text: "Minimum wage hike effective W8 driving overtime costs 18% above plan. LA and SF markets hardest hit — store-level margin compression accelerating. Automation rollout in progress but not fully deployed.", tags: [{ cls: "pill-red", label: "Labor cost surge" }, { cls: "pill-red", label: "3 weeks escalating" }, { cls: "pill-blue", label: "Automation in progress" }] },
        { rank: 2, name: "Washington Tech", variance: "−$0.6M vs Plan", text: "Enterprise contract deferrals — 4 deals worth $2.1M pushed from W10 to W12–W13. Macro uncertainty cited by 3 of 4 customers. Pipeline not lost, timing shift.", tags: [{ cls: "pill-amber", label: "Contract deferrals" }, { cls: "pill-blue", label: "Pipeline intact" }] },
        { rank: 3, name: "Oregon Clean Energy", variance: "+$0.2M vs Plan", text: "Federal subsidy tranche released in W9, recognized in W10. Solar installation revenue accelerating. Pipeline for Q2 strong on IRA incentive pull-forward.", tags: [{ cls: "pill-green", label: "Subsidy release" }, { cls: "pill-green", label: "Pipeline strong" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — California Retail",
        bars: [
          { week: "W6", actual: 60, plan: 64, color: "#1E40AF" },
          { week: "W7", actual: 58, plan: 64, color: "#1E40AF" },
          { week: "W8", actual: 54, plan: 64, color: "#d97706" },
          { week: "W9", actual: 48, plan: 64, color: "var(--red)" },
          { week: "W10", actual: 44, plan: 64, color: "var(--red)" },
          { week: "W11▸", actual: 42, plan: 64, color: "var(--red)", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "Why is the West the worst performing region?" },
          { role: "ai", name: "Meeru AI", html: `<strong>California Retail is the primary driver</strong> at −$1.2M, representing 75% of the West miss. Root cause is the minimum wage increase effective W8 — labor costs in LA and SF are 12% above budget with overtime at 18% above plan.<br><br>Washington Tech adds −$0.6M from enterprise deal deferrals. Oregon Clean Energy is the sole bright spot at +$0.2M on federal subsidy release.` },
          { role: "user", name: "Josh", text: "What action should we take on California?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Two recommended actions:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>California: Accelerate self-checkout automation rollout from W14 to W11 — estimated $0.4M labor savings per week once deployed</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Washington: Schedule executive touchpoints with the 4 deferred deal sponsors to confirm W12–W13 close timing</div></div>` },
        ],
        suggestions: ["California automation timeline", "Washington deal deferral details", "West vs prior year"],
      },
    },
    southwest: {
      label: "Southwest",
      week: "Week 10 · Mar 3–9 2026",
      revenue: { variance: "−$1.1M", delta: "▼ vs Plan", color: "down", flagged: "3", flaggedDetail: "1 critical", driver: "Commodity", driverDetail: "Nat gas ↓ 18%" },
      orders: { variance: "−$1.5M", delta: "▼ vs Plan", color: "down", flagged: "4", flaggedDetail: "2 critical", driver: "Market", driverDetail: "Rate cooling" },
      signal: { icon: "📉", title: "Watch: Texas Energy Natural Gas Price Decline", body: "Henry Hub natural gas spot price down 18% WoW. Permian Basin revenue per unit compressed. Hedging covers 60% — unhedged exposure driving −$0.8M miss. Arizona real estate cooling adds −$0.2M.", positive: false },
      segments: [
        { rank: 1, name: "Texas Energy", variance: "−$0.8M vs Plan", text: "Natural gas spot price drop 18% WoW at Henry Hub. Permian Basin operations revenue per unit compressed. Hedging program covered 60% of volume — unhedged 40% fully exposed. Pricing expected to stabilize W12.", tags: [{ cls: "pill-red", label: "Commodity exposure" }, { cls: "pill-amber", label: "Partial hedge" }, { cls: "pill-blue", label: "W12 stabilization" }] },
        { rank: 2, name: "Arizona Real Estate", variance: "−$0.2M vs Plan", text: "Mortgage rate cooling effect — 30yr fixed at 6.9% dampening transaction velocity. Phoenix metro listings up 14% but closings down 8%. Seasonal spring market should provide W12–W14 uplift.", tags: [{ cls: "pill-amber", label: "Rate cooling" }, { cls: "pill-blue", label: "Spring market ahead" }] },
        { rank: 3, name: "Colorado Tourism", variance: "−$0.1M vs Plan", text: "Below-average snowpack reducing ski resort revenue. Season bookings down 6% vs plan. Summer pivot planning in progress — mountain biking season pre-bookings up 11%.", tags: [{ cls: "pill-amber", label: "Low snowpack" }, { cls: "pill-blue", label: "Summer pivot" }] },
      ],
      chart: {
        title: "Weekly Revenue Variance — Texas Energy",
        bars: [
          { week: "W6", actual: 62, plan: 64, color: "#1E40AF" },
          { week: "W7", actual: 61, plan: 64, color: "#1E40AF" },
          { week: "W8", actual: 58, plan: 64, color: "#d97706" },
          { week: "W9", actual: 52, plan: 64, color: "var(--red)" },
          { week: "W10", actual: 48, plan: 64, color: "var(--red)" },
          { week: "W11▸", actual: 50, plan: 64, color: "var(--red)", forecast: true },
        ],
      },
      ai: {
        messages: [
          { role: "user", name: "Josh", text: "What is driving the Southwest miss?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Texas Energy is the dominant driver</strong> at −$0.8M, representing 73% of the Southwest miss. Natural gas spot price dropped 18% WoW — the hedging program covers 60% of volume but the unhedged 40% is fully exposed to the decline.<br><br>Arizona Real Estate adds −$0.2M from mortgage rate cooling, and Colorado Tourism contributes −$0.1M on below-average snowpack.` },
          { role: "user", name: "Josh", text: "Should we increase hedge coverage?" },
          { role: "ai", name: "Meeru AI", html: `<strong>Hedge review recommended.</strong> Current 60% coverage was set when natural gas was at $3.20/MMBtu — now at $2.62. Forward curve suggests stabilization around $2.80 by W12.<br><br>Options: (1) Increase hedge to 80% at current forwards — locks in ~$2.75 floor, costs ~$120K premium. (2) Wait for W12 stabilization signal before acting. Risk: another 10% drop in W11 would add −$0.3M exposure.<br><br><strong>Recommend Option 1</strong> given earnings sensitivity.` },
        ],
        suggestions: ["Texas hedge position detail", "Arizona spring market forecast", "Colorado summer pivot plan"],
      },
    },
  },

  comparisons: {
    plan: {
      label: "vs Plan",
      stats: { national: "−$3.8M", ne: "+$0.4M", se: "−$0.6M", mw: "−$0.9M", w: "−$1.6M", sw: "−$1.1M" },
      pillColors: { national: "pill-red", ne: "pill-green", se: "pill-amber", mw: "pill-amber", w: "pill-red", sw: "pill-red" },
      totalVariance: "−$3.8M",
      totalColor: "down",
      signal: "California Retail labor cost surge is the largest miss vs Plan — minimum wage hike driving overtime 18% above budget. Texas Energy natural gas price drop adds −$0.8M. Northeast is the sole positive region at +$0.4M on strong Q1 trading.",
      aiQ: "How are we tracking against Plan overall?",
      aiA: `<strong>−$3.8M vs Plan this week.</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>West −$1.6M: California Retail labor cost surge driving 42% of total miss</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Southwest −$1.1M: Texas Energy natural gas spot price decline</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Midwest −$0.9M: Illinois Manufacturing supply chain bottleneck + Michigan EV transition</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Southeast −$0.6M: Florida tourism calendar shift + Georgia port congestion</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Northeast +$0.4M: NY Financial Services Q1 trading outperformance, only region beating Plan</div></div>`,
      segmentOverrides: {
        national: [
          { rank: 1, name: "California Retail", variance: "−$1.6M vs Plan", text: "Labor costs surging post minimum-wage hike. Overtime 18% above plan in LA/SF. Margin compression accelerating for 3rd week. Automation rollout in progress but not yet at scale.", tags: [{ cls: "pill-red", label: "Labor surge" }, { cls: "pill-red", label: "3 wks escalating" }] },
          { rank: 2, name: "Texas Energy", variance: "−$0.8M vs Plan", text: "Natural gas spot price down 18% WoW. Hedging covers 60% — unhedged exposure driving the miss. Forward curve suggests stabilization W12.", tags: [{ cls: "pill-red", label: "Commodity exposure" }, { cls: "pill-amber", label: "Partial hedge" }] },
          { rank: 3, name: "New York Financial Svcs", variance: "+$0.7M vs Plan", text: "Q1 trading revenue beating plan on elevated volatility. Advisory pipeline converting 3 weeks ahead of schedule. Sole national bright spot.", tags: [{ cls: "pill-green", label: "Above plan" }, { cls: "pill-green", label: "Trading outperformance" }] },
        ],
      },
    },
    priorweek: {
      label: "vs Prior Week",
      stats: { national: "+$0.6M", ne: "+$0.2M", se: "+$0.3M", mw: "+$0.1M", w: "−$0.2M", sw: "+$0.2M" },
      pillColors: { national: "pill-green", ne: "pill-green", se: "pill-green", mw: "pill-green", w: "pill-amber", sw: "pill-green" },
      totalVariance: "+$0.6M",
      totalColor: "up",
      signal: "Most regions improved week-on-week. Southeast spring break bookings building. West is the only region still deteriorating WoW as California labor costs compound.",
      aiQ: "How does W10 compare to W9?",
      aiA: `<strong>+$0.6M improvement week-on-week.</strong> Most regions moved in the right direction vs W9.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Southeast +$0.3M WoW: Florida tourism bookings building for W11 spring break peak</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Northeast +$0.2M WoW: NY trading desk momentum continuing</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Southwest +$0.2M WoW: Texas energy prices stabilizing at lower level</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>West −$0.2M WoW: California labor costs still compounding — only region worsening</div></div>`,
      segmentOverrides: {
        national: [
          { rank: 1, name: "Florida Tourism", variance: "+$0.4M vs Prior Week", text: "Spring break advance bookings accelerating. W11 hotel occupancy forecast 91% vs 71% in W10. Timing shift resolving as expected.", tags: [{ cls: "pill-green", label: "WoW acceleration" }, { cls: "pill-green", label: "Bookings building" }] },
          { rank: 2, name: "New York Financial Svcs", variance: "+$0.2M vs Prior Week", text: "Trading desk momentum continuing post-FOMC. Advisory deal #4 of Q1 closed in W10. Pipeline conversion ahead of model.", tags: [{ cls: "pill-green", label: "Momentum" }, { cls: "pill-blue", label: "Pipeline strong" }] },
          { rank: 3, name: "California Retail", variance: "−$0.3M vs Prior Week", text: "Labor cost deterioration continues WoW. Overtime hours increased another 4% vs W9. Automation not yet deployed at scale. Only segment worsening WoW.", tags: [{ cls: "pill-red", label: "Still deteriorating" }, { cls: "pill-red", label: "WoW decline" }] },
        ],
      },
    },
    prioryear: {
      label: "vs Prior Year",
      stats: { national: "+$8.4M", ne: "+$2.1M", se: "+$1.8M", mw: "+$1.6M", w: "+$1.9M", sw: "+$1.0M" },
      pillColors: { national: "pill-green", ne: "pill-green", se: "pill-green", mw: "pill-green", w: "pill-green", sw: "pill-green" },
      totalVariance: "+$8.4M",
      totalColor: "up",
      signal: "Strong year-on-year growth across all regions. Northeast showing the largest YoY gain (+$2.1M) on financial services expansion. W10 2025 was a structurally weak comp — California labor issues were even more severe pre-automation.",
      aiQ: "How does W10 compare to the same week last year?",
      aiA: `<strong>+$8.4M vs same week in 2025 — strong YoY.</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Northeast +$2.1M YoY: Financial services expansion + 3 new advisory verticals launched Q4 2025</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>West +$1.9M YoY: California had worse labor disruption in W10 2025 (pre-automation). Low comp.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Southeast +$1.8M YoY: Florida tourism expanded capacity +22% since W10 2025.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Midwest +$1.6M YoY: Illinois hub expansion completed Q3 2025 — structural throughput increase.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Southwest +$1.0M YoY: Texas energy had lower base in W10 2025 due to pipeline maintenance outage.</div></div>`,
      segmentOverrides: {
        national: [
          { rank: 1, name: "New York Financial Svcs", variance: "+$2.3M vs Prior Year", text: "3 new advisory verticals launched Q4 2025 contributing incremental revenue. Trading infrastructure upgrades completed in W1 2026 — lower latency driving better capture rates.", tags: [{ cls: "pill-green", label: "Structural growth" }, { cls: "pill-green", label: "New verticals" }] },
          { rank: 2, name: "California Retail", variance: "+$1.4M vs Prior Year", text: "W10 2025 had a more severe labor disruption — pre-automation, all shifts fully manual. Current week is bad vs Plan but better vs last year's crisis comp.", tags: [{ cls: "pill-green", label: "YoY recovery" }, { cls: "pill-amber", label: "Weak comp effect" }] },
          { rank: 3, name: "Florida Tourism", variance: "+$1.2M vs Prior Year", text: "Capacity expansion of +22% since W10 2025 driving structural revenue growth. New resort properties in Orlando and Miami contributing incremental bookings.", tags: [{ cls: "pill-green", label: "Capacity expansion" }, { cls: "pill-green", label: "Structural growth" }] },
        ],
      },
    },
    forecast: {
      label: "vs Forecast",
      stats: { national: "−$1.6M", ne: "+$0.1M", se: "−$0.3M", mw: "−$0.4M", w: "−$0.7M", sw: "−$0.3M" },
      pillColors: { national: "pill-amber", ne: "pill-green", se: "pill-amber", mw: "pill-amber", w: "pill-red", sw: "pill-amber" },
      totalVariance: "−$1.6M",
      totalColor: "warn",
      signal: "We missed the internal W10 forecast by −$1.6M. The forecast had already embedded labor risk in California, so the additional miss is from Texas energy price drop (exceeded model) and Georgia port congestion (unforeseen).",
      aiQ: "Where did we miss our own forecast?",
      aiA: `<strong>−$1.6M vs internal W10 forecast.</strong> The forecast had already priced in California labor risk — the incremental misses came from:<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>West −$0.7M: California labor cost acceleration exceeded even the risk-adjusted forecast</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Midwest −$0.4M: Illinois rail car shortage was not in the forecast model</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Southwest −$0.3M: Texas natural gas price drop exceeded modeled scenario by 8 points</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Southeast −$0.3M: Georgia port congestion not modeled — unforeseen logistics event</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Northeast +$0.1M: NY trading slightly exceeded forecast — positive surprise</div></div>`,
      segmentOverrides: {
        national: [
          { rank: 1, name: "California Retail", variance: "−$0.5M vs Forecast", text: "Forecast had embedded −$1.1M labor risk assumption. Actual came in −$1.6M vs Plan — a −$0.5M incremental miss vs risk-adjusted forecast. Overtime acceleration worse than modeled.", tags: [{ cls: "pill-red", label: "Worse than risk model" }, { cls: "pill-amber", label: "Forecast miss" }] },
          { rank: 2, name: "Texas Energy", variance: "−$0.3M vs Forecast", text: "Forecast modeled a 10% natural gas price decline — actual was 18%. The 8-point gap on unhedged volume accounts for the full forecast miss. Forward curve now incorporated.", tags: [{ cls: "pill-amber", label: "Price exceeded model" }, { cls: "pill-blue", label: "Forecast updated" }] },
          { rank: 3, name: "New York Financial Svcs", variance: "+$0.1M vs Forecast", text: "Trading revenue slightly exceeded forecast assumptions. VIX averaged 22 vs modeled 20. Positive forecast miss — no action needed.", tags: [{ cls: "pill-green", label: "Positive surprise" }, { cls: "pill-green", label: "Forecast beat" }] },
        ],
      },
    },
    runrate: {
      label: "vs Run Rate",
      stats: { national: "−$2.4M", ne: "+$0.2M", se: "−$0.4M", mw: "−$0.6M", w: "−$1.1M", sw: "−$0.5M" },
      pillColors: { national: "pill-red", ne: "pill-green", se: "pill-amber", mw: "pill-amber", w: "pill-red", sw: "pill-amber" },
      totalVariance: "−$2.4M",
      totalColor: "down",
      signal: "W10 is tracking −$2.4M below the 8-week run rate. West is the structural drag — California labor costs have been depressing the run rate itself. Northeast run rate is the only region trending positively.",
      aiQ: "Are we above or below our run rate?",
      aiA: `<strong>−$2.4M below 8-week run rate.</strong> This is a meaningful signal — it means W10 is not just a Plan miss, it's below our own recent trajectory.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>West −$1.1M below run rate: The run rate itself has been declining for 3 weeks as California labor costs compound. Deteriorating trend, not a one-week event.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Midwest −$0.6M below run rate: Chicago hub bottleneck creating step-down vs recent weeks</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Southwest −$0.5M below run rate: Texas energy price decline pulling below recent trajectory</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Southeast −$0.4M below run rate: Florida tourism timing shift creates temporary dip</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Northeast +$0.2M above run rate: Trading momentum pushing slightly above recent trend</div></div>`,
      segmentOverrides: {
        national: [
          { rank: 1, name: "California Retail", variance: "−$0.9M vs Run Rate", text: "The 8-week run rate itself has been declining 2.8% per week as labor costs compound since the wage hike. This week is −$0.9M below that declining run rate — accelerating deterioration.", tags: [{ cls: "pill-red", label: "Accelerating decline" }, { cls: "pill-red", label: "Run rate falling" }] },
          { rank: 2, name: "Texas Energy", variance: "−$0.5M vs Run Rate", text: "Natural gas price drop is a step-change below recent steady run rate. Run rate should recover W12 as forwards suggest price stabilization around $2.80.", tags: [{ cls: "pill-amber", label: "Temporary step-down" }, { cls: "pill-blue", label: "Run rate recovery likely" }] },
          { rank: 3, name: "New York Financial Svcs", variance: "+$0.3M vs Run Rate", text: "Q1 trading volatility is pushing NY Financial Services above its recent run rate. This is partially seasonal — run rate will normalize post-Q1 but at a structurally higher level than W6.", tags: [{ cls: "pill-green", label: "Above run rate" }, { cls: "pill-green", label: "Structural improvement" }] },
        ],
      },
    },
  },

  segmentNav: {
    retail: {
      aiQ: "Give me the Retail segment deep-dive across all regions",
      aiA: `<strong>Retail — cross-region summary W10:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>California Retail −$1.2M (West): Labor cost surge, 3rd week post minimum-wage hike</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>National aggregate −$1.6M: California is the dominant drag, consumer softness in secondary markets</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Northeast Retail −$0.1M: Minor softness in CT/MA — not material</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Southeast Retail +$0.1M: NC e-commerce fulfillment contributing modestly</div></div><br>Net Retail: <strong class="uf-down">−$1.6M</strong> vs Plan. California is the sole structural issue.`,
    },
    energy: {
      aiQ: "Show me Energy segment performance this week",
      aiA: `<strong>Energy — cross-region summary W10:</strong><div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#E74C3C"></div>Texas Energy −$0.8M (Southwest): Natural gas spot price drop 18%, hedging covers only 60%</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>Oregon Clean Energy +$0.2M (West): Federal subsidy tranche release boosting solar revenue</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Colorado Tourism −$0.1M: Indirect energy exposure via snowpack/resort operations</div></div><br>Net Energy: <strong class="uf-warn">−$0.8M</strong> vs Plan. Texas unhedged exposure is the risk to watch for W11.`,
    },
    financial: {
      aiQ: "How is the Financial Services segment performing?",
      aiA: `<strong>Financial Services — W10 summary:</strong><br><br>Financial Services is the standout positive this week at <strong class="uf-up">+$0.7M vs Plan</strong> nationally.<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#2ECC71"></div>NY Financial Svcs +$0.7M (Northeast): Q1 trading revenue on elevated VIX. Advisory pipeline converting ahead of schedule.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>CT Insurance −$0.1M (Northeast): Winter storm claims backlog — non-material, W12 clearance expected.</div></div><br>Financial Services is benefiting from market volatility. No structural risks. Advisory pipeline adds $2.4M in W11–W13 expected closings.`,
    },
    healthcare: {
      aiQ: "What is happening with Healthcare this week?",
      aiA: `<strong>Healthcare — W10 summary: −$0.3M vs Plan.</strong><br><br>Healthcare has a moderate headwind this week driven by reimbursement delays:<div class="uf-sig-list"><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>MA Healthcare −$0.2M (Northeast): Insurance reimbursement delays from 2 major carriers. 14-day average turnaround vs 9-day target. Carrier escalation in progress.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#F39C12"></div>Midwest Healthcare −$0.1M: Minor claims processing delays in regional hospital networks.</div><div class="uf-sig-item"><div class="uf-sig-dot" style="background:#3498DB"></div>Southeast Healthcare flat: No exceptions flagged.</div></div><br>Overall Healthcare is a watch item. MA carrier escalation is the key lever — resolution expected W12.`,
    },
  },

  drillSegments: [
    { id: "caretail", name: "California Retail", region: "West", variance: "−$1.2M", varColor: "down", spark: [58, 54, 50, 46, 42], util: "92%", utilColor: "var(--red)", trips: "$4.8M", tripsVsPlan: "−12.1%" },
    { id: "txenergy", name: "Texas Energy", region: "Southwest", variance: "−$0.8M", varColor: "down", spark: [64, 62, 58, 52, 48], util: "78%", utilColor: "#d97706", trips: "$3.2M", tripsVsPlan: "−8.6%" },
    { id: "nyfinance", name: "New York Financial Svcs", region: "Northeast", variance: "+$0.7M", varColor: "up", spark: [52, 54, 56, 58, 60], util: "71%", utilColor: "var(--green)", trips: "$8.1M", tripsVsPlan: "+4.8%" },
    { id: "fltourism", name: "Florida Tourism", region: "Southeast", variance: "−$0.4M", varColor: "down", spark: [62, 61, 62, 59, 54], util: "68%", utilColor: "#2563eb", trips: "$2.9M", tripsVsPlan: "−7.2%" },
    { id: "ilmfg", name: "Illinois Manufacturing", region: "Midwest", variance: "−$0.5M", varColor: "down", spark: [61, 60, 57, 53, 50], util: "94%", utilColor: "var(--red)", trips: "$5.4M", tripsVsPlan: "−6.8%" },
    { id: "watech", name: "Washington Tech", region: "West", variance: "−$0.6M", varColor: "down", spark: [58, 57, 55, 52, 49], util: "65%", utilColor: "#d97706", trips: "$6.2M", tripsVsPlan: "−5.4%" },
  ],

  drillAI: {
    caretail: { q: "Tell me more about California Retail", a: `<strong>California Retail deep-dive:</strong><br><br>Root cause is labor-cost driven. Minimum wage hike effective W8 pushed LA/SF store labor costs 12% above budget. Overtime hours running 18% above plan as stores maintain coverage with fewer shifts.<br><br>Impact breakdown: −12.1% revenue vs plan. Store-level margin compressed by 340bps. Self-checkout automation rollout covers 22% of stores — target 60% by W14.<br><br><strong>W11 risk:</strong> If staffing model not adjusted, ML model projects additional −2% to −4% margin erosion.` },
    txenergy: { q: "Explain the Texas Energy situation", a: `<strong>Texas Energy — commodity price shock.</strong><br><br>Henry Hub natural gas spot price dropped 18% WoW driven by mild weather forecasts and inventory builds. Permian Basin revenue per unit compressed across all producing assets.<br><br>Hedging program covers 60% of volume at $3.10/MMBtu floor — the unhedged 40% is fully exposed at current $2.62 spot. Forward curve suggests stabilization at $2.80 by W12.<br><br><strong>Action needed:</strong> Review hedge coverage increase to 80% — costs ~$120K premium but protects against further decline.` },
    nyfinance: { q: "What is driving NY Financial Services outperformance?", a: `<strong>Q1 trading revenue outperformance confirmed.</strong><br><br>Equity desk capturing elevated VIX (avg 22 vs modeled 18). Fixed income steady at plan. Advisory pipeline converting 3 weeks ahead of schedule — 3 deals closed in W9–W10 vs W12 target.<br><br>Infrastructure upgrades completed W1 2026 lowering trading latency — contributing to better price capture.<br><br><strong>W11 outlook:</strong> Volatility expected to moderate post-FOMC. Projection +$0.4M vs plan (down from +$0.7M).` },
    fltourism: { q: "What caused the Florida Tourism miss?", a: `<strong>Calendar-driven timing shift.</strong><br><br>Spring break peak moved from W10 to W11 this year — school district calendar realignment across 4 major feeder states. Hotel occupancy 71% vs 84% plan in W10.<br><br>W11 advance bookings are tracking 18% above W10 — this is timing, not demand destruction. Orlando and Miami properties both showing strong W11 forward indicators.<br><br><strong>Recommendation:</strong> No action required. Full reversal expected W11.` },
    ilmfg: { q: "How serious is the Illinois Manufacturing bottleneck?", a: `<strong>Supply chain constraint — action required.</strong><br><br>Chicago distribution hub at 94% capacity — above the 90% stress threshold for 2nd consecutive week. Root cause is rail car shortage from Union Pacific reallocation to grain shipments.<br><br>Order fulfillment cycle time stretched to 8.2 days vs 5.5 target. Backlog of 340 orders valued at $2.1M in deferred revenue recognition.<br><br><strong>Resolution:</strong> Union Pacific confirmed +15% rail car allocation starting W11. Hub capacity should return to 85% by W12.` },
    watech: { q: "What is happening with Washington Tech?", a: `<strong>Enterprise contract deferrals — pipeline intact.</strong><br><br>4 enterprise deals worth $2.1M combined pushed from W10 to W12–W13. Three of four customers cited macro uncertainty (Fed rate path); one cited internal budget cycle timing.<br><br>No deal cancellations. All 4 opportunities remain in active pipeline with committed close dates. Sales team has scheduled executive touchpoints for W11.<br><br><strong>Recommendation:</strong> Confirm W12–W13 close timing with deal sponsors. No structural intervention needed.` },
  },

  exceptions: [
    { id: "ca-labor", severity: "critical", icon: "🔴", name: "California Retail — Labor Cost Surge", detail: "Minimum wage hike driving overtime 18% above plan in LA/SF. Store-level margin compressed 340bps. 3rd consecutive week of escalation.", tags: [{ cls: "pill-red", label: "Critical" }, { cls: "pill-red", label: "3 weeks" }], value: "−$1.2M", week: "W8–W10", aiQ: "Diagnose the California labor cost surge", aiA: `<strong>Labor cost breach — critical.</strong><br><br>The minimum wage increase effective W8 pushed LA/SF store labor costs 12% above budget. Overtime hours have been running 18% above plan as stores maintain coverage levels with the same headcount.<br><br>Each week compounds: W8 −$0.3M, W9 −$0.7M, W10 −$1.2M (cumulative). Self-checkout automation covers 22% of stores — rollout to 60% targeted by W14 but requires $1.8M capex acceleration.<br><br><strong>Required action:</strong> Accelerate automation rollout from W14 to W11. Estimated $0.4M/week labor savings once deployed at scale.` },
    { id: "tx-natgas", severity: "warning", icon: "🟡", name: "Texas Energy — Natural Gas Price Drop", detail: "Henry Hub spot price down 18% WoW. Hedging covers 60% — unhedged 40% fully exposed. Forward curve suggests W12 stabilization.", tags: [{ cls: "pill-amber", label: "Warning" }, { cls: "pill-amber", label: "Commodity" }], value: "−$0.8M", week: "W10", aiQ: "Explain the Texas natural gas price impact", aiA: `<strong>Commodity price shock — hedge gap exposed.</strong><br><br>Natural gas spot dropped from $3.20 to $2.62/MMBtu (−18% WoW) on mild weather forecasts and above-average storage builds. The hedging program covers 60% of volume at $3.10 floor — the unhedged 40% is fully exposed.<br><br>Forward curve suggests stabilization around $2.80 by W12. The miss is concentrated in Permian Basin operations.<br><br><strong>Option:</strong> Increase hedge to 80% at current forwards. Cost: ~$120K premium. Protection: caps W11 downside at −$0.3M vs current −$0.8M trajectory.` },
    { id: "il-supply", severity: "warning", icon: "🟡", name: "Illinois Manufacturing — Supply Chain Bottleneck", detail: "Chicago hub at 94% capacity, above 90% stress threshold. Rail car shortage from Union Pacific. Order fulfillment cycle time 8.2 days vs 5.5 target.", tags: [{ cls: "pill-amber", label: "Watch" }, { cls: "pill-amber", label: "Rail shortage" }], value: "−$0.5M", week: "W9–W10", aiQ: "How urgent is the Illinois supply chain issue?", aiA: `<strong>Resolution in sight — monitor closely.</strong><br><br>Chicago hub has been above 90% capacity stress threshold for 2 weeks. Union Pacific rail car reallocation to grain shipments is the root cause — 340 orders ($2.1M) sitting in deferred revenue recognition.<br><br>Union Pacific confirmed +15% rail car allocation starting W11. Hub capacity should return to 85% by W12.<br><br><strong>Risk:</strong> If rail allocation slips, W11 could see −$0.7M miss. Recommend daily monitoring of rail car delivery schedule.` },
    { id: "fl-calendar", severity: "warning", icon: "🟡", name: "Florida Tourism — Spring Break Calendar Shift", detail: "Spring break peak moved from W10 to W11 this year. Hotel occupancy 71% vs 84% plan. W11 bookings tracking +18% above W10.", tags: [{ cls: "pill-amber", label: "Calendar shift" }, { cls: "pill-blue", label: "Auto-recovering" }], value: "−$0.4M", week: "W10", aiQ: "Should we take action on Florida tourism timing?", aiA: `<strong>No action required — timing shift, not demand loss.</strong><br><br>School district calendar realignment across 4 major feeder states (NY, NJ, PA, OH) shifted spring break peak from W10 to W11. W11 advance bookings are strong: Orlando +22%, Miami +16% vs W10.<br><br>This is a well-understood seasonal timing variance. The revenue is not lost — it shifts forward one week.<br><br>The auto-recovery model is incorporated into W11 projections showing +$0.5M vs plan.` },
    { id: "ny-trading", severity: "positive", icon: "🟢", name: "New York Financial Svcs — Q1 Trading Outperformance", detail: "Equity desk +22% vs plan on elevated VIX. Advisory pipeline converting 3 weeks ahead of schedule. Infrastructure upgrades paying off.", tags: [{ cls: "pill-green", label: "Positive" }, { cls: "pill-green", label: "Q1 momentum" }], value: "+$0.7M", week: "W10", aiQ: "Can we sustain the NY trading outperformance?", aiA: `<strong>Partially sustainable — structural + cyclical mix.</strong><br><br>Two drivers: (1) Elevated VIX (cyclical) — averaging 22 vs modeled 18. Post-FOMC, VIX is expected to moderate to ~19–20. This component fades W11. (2) Trading infrastructure upgrades (structural) — lower latency from W1 2026 system upgrade is permanently improving price capture rates by ~15bps.<br><br>Advisory pipeline has $2.4M in W11–W13 expected closings — 3 deals already in final negotiation.<br><br><strong>W11 projection:</strong> +$0.4M vs plan. Moderate pullback from +$0.7M but still above plan.` },
    { id: "or-subsidy", severity: "positive", icon: "🟢", name: "Oregon Clean Energy — Federal Subsidy Release", detail: "IRA subsidy tranche released W9, recognized W10. Solar installation revenue accelerating. Q2 pipeline strong on incentive pull-forward.", tags: [{ cls: "pill-green", label: "Subsidy release" }, { cls: "pill-green", label: "Growing" }], value: "+$0.2M", week: "W9–W10", aiQ: "What does Oregon success mean for clean energy strategy?", aiA: `<strong>Federal subsidy pipeline is tracking ahead of model.</strong><br><br>The W9 IRA tranche release of $4.2M (our share: $0.2M recognized W10) was 6 weeks ahead of treasury projections. This accelerates revenue recognition across 14 active solar installation projects.<br><br>Q2 pipeline is strong: $1.8M in expected subsidy-linked revenue. The IRA incentive pull-forward is driving customer demand 30% above pre-IRA baseline.<br><br><strong>Strategy implication:</strong> Consider expanding Oregon clean energy team by 4 FTEs to capture incremental pipeline. ROI model shows 8-month payback.` },
  ],

  signals: [
    { name: "California Retail Margin Erosion Risk W11", type: "Labor", typeCls: "pill-red", confidence: 92, body: "Overtime trajectory projects continued margin compression through W11. Self-checkout automation deployment is the key lever — accelerating from W14 to W11 could save $0.4M/week. Model based on 12 comparable wage-event scenarios.", confColor: "var(--red)" },
    { name: "Texas Natural Gas Price Stabilization W12", type: "Commodity", typeCls: "pill-amber", confidence: 76, body: "Henry Hub forward curve projects stabilization at $2.80/MMBtu by W12. Current spot at $2.62 — 7% below forward. Historical accuracy on similar storage-build scenarios: 74%. Hedge increase recommended.", confColor: "#d97706" },
    { name: "NY Financial Svcs Q1 Close Strong", type: "Revenue", typeCls: "pill-green", confidence: 94, body: "Advisory pipeline has $2.4M in W11–W13 committed closings. Trading infrastructure upgrade providing structural 15bps capture improvement. VIX may moderate but structural gains persist.", confColor: "var(--green)" },
    { name: "Florida Tourism Spring Break Rebound W11", type: "Seasonal", typeCls: "pill-blue", confidence: 89, body: "W11 advance bookings +18% above W10. Calendar shift is well-understood — 4 of 5 historical spring break timing shifts showed full revenue recovery in the following week. Confidence high.", confColor: "#2563eb" },
    { name: "Illinois Hub Rail Car Resolution W11", type: "Supply Chain", typeCls: "pill-blue", confidence: 81, body: "Union Pacific confirmed +15% rail car allocation starting W11. If delivery holds, Chicago hub returns to 85% capacity by W12. Historical UP delivery accuracy on committed allocations: 79%.", confColor: "#2563eb" },
    { name: "Oregon Clean Energy: Q2 Pipeline Acceleration", type: "Growth", typeCls: "pill-green", confidence: 73, body: "IRA subsidy tranche ahead of schedule suggests Q2 pipeline of $1.8M could pull forward by 4–6 weeks. Customer demand 30% above pre-IRA baseline. Team expansion recommended to capture.", confColor: "var(--green)" },
  ],

  history: [
    { week: "W10", dates: "Mar 3–9 2026", variance: "−$3.8M", varColor: "down", tags: [{ cls: "pill-red", label: "Labor" }, { cls: "pill-amber", label: "Commodity" }], current: true },
    { week: "W9", dates: "Feb 24–Mar 2", variance: "−$2.6M", varColor: "down", tags: [{ cls: "pill-red", label: "Labor" }] },
    { week: "W8", dates: "Feb 17–23", variance: "−$1.4M", varColor: "down", tags: [{ cls: "pill-amber", label: "Wage hike start" }] },
    { week: "W7", dates: "Feb 10–16", variance: "+$0.8M", varColor: "up", tags: [{ cls: "pill-green", label: "On plan" }] },
    { week: "W6", dates: "Feb 3–9", variance: "+$1.5M", varColor: "up", tags: [{ cls: "pill-green", label: "Super Bowl uplift" }] },
    { week: "W5", dates: "Jan 27–Feb 2", variance: "−$0.3M", varColor: "warn", tags: [{ cls: "pill-amber", label: "Minor miss" }] },
    { week: "W4", dates: "Jan 20–26", variance: "+$1.8M", varColor: "up", tags: [{ cls: "pill-green", label: "Deal closures" }] },
    { week: "W3", dates: "Jan 13–19", variance: "+$0.7M", varColor: "up", tags: [{ cls: "pill-green", label: "On plan" }] },
    { week: "W2", dates: "Jan 6–12", variance: "−$0.9M", varColor: "down", tags: [{ cls: "pill-amber", label: "Post-holiday" }] },
    { week: "W1", dates: "Dec 30–Jan 5", variance: "+$3.2M", varColor: "up", tags: [{ cls: "pill-green", label: "New Year surge" }] },
    { week: "W52", dates: "Dec 23–29 2025", variance: "+$4.8M", varColor: "up", tags: [{ cls: "pill-green", label: "Christmas peak" }] },
    { week: "W51", dates: "Dec 16–22 2025", variance: "+$1.6M", varColor: "up", tags: [{ cls: "pill-green", label: "Pre-holiday" }] },
  ],

  historyAI: {
    W9: { q: "How does W9 compare to current week?", a: `<strong>W9 showed the California labor issue beginning to escalate.</strong><br><br>−$2.6M in W9 vs −$3.8M in W10 — a 46% week-on-week deterioration. California Retail was the single largest driver in both weeks. W9 was when overtime first exceeded budget thresholds.<br><br>The Texas energy price drop in W10 was not flagged in W9 — that's a new development adding −$0.8M incremental miss.` },
    W8: { q: "What was different about W8?", a: `<strong>W8 was the inflection point.</strong><br><br>−$1.4M in W8 was the first week after the California minimum wage hike took effect. At that point labor cost overruns were flagged as 'watch' not 'critical'. The escalation to critical happened because staffing models weren't adjusted in W8 or W9.<br><br>This underscores the compounding nature of labor cost misses — each week of inaction adds ~$0.6M to the cumulative gap.` },
    W7: { q: "What drove the W7 outperformance?", a: `<strong>W7 was a clean week.</strong><br><br>+$0.8M was driven by NY Financial Services beginning its Q1 trading momentum and Texas Energy holding at plan before the price decline. All regions were within ±$0.2M of plan.<br><br>In retrospect, W7 was the last week before the California wage hike impact began materializing in store-level P&Ls.` },
    W4: { q: "What was the W4 deal closure success?", a: `<strong>W4 saw strong enterprise deal closures across Northeast and West.</strong><br><br>+$1.8M driven by 2 large advisory deals in NY Financial Services (+$1.1M) and a Washington Tech enterprise contract (+$0.7M). Both had been in pipeline since Q4 2025 and converted ahead of schedule.<br><br>Playbook is documented — the combination of Q1 budget release timing and executive sponsor engagement is the key pattern.` },
  },
}

// ═══════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.uf-root {
  --navy: var(--theme-surface, #ffffff);
  --navyMd: var(--theme-bg, #f8fafc);
  --navyLt: var(--theme-surface-alt, #e2e8f0);
  --gold: var(--theme-accent, #1E40AF);
  --green: var(--theme-success, #16a34a);
  --red: var(--theme-danger, #dc2626);
  --amber: var(--theme-warning, #d97706);
  --blue: var(--theme-info, #2563eb);
  --text: var(--theme-text, #0f172a);
  --muted: var(--theme-text-muted, #64748b);
  --border: var(--theme-border, #e2e8f0);
  --surface: var(--theme-surface, #f8fafc);
  --surfaceLt: var(--theme-surface-alt, #f1f5f9);

  background: var(--theme-bg, #f8fafc);
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
  overflow: hidden;
  min-height: 0;
}
.uf-content-row {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.uf-left-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* Top Bar */
.uf-topbar {
  background: var(--surface);
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.uf-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.2; }
.uf-subtitle { font-size: 10px; color: var(--muted); }
.uf-week-badge {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  color: var(--muted);
}
.uf-topbar-right { display: flex; align-items: center; gap: 8px; }
.uf-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.uf-status-text { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; }
.uf-avatar {
  width: 28px; height: 28px; border-radius: 50%; background: var(--navyLt);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: var(--gold);
}

/* Metric Toggle */
.uf-metric-toggle {
  display: flex; align-items: center; gap: 2px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 2px;
}
.uf-metric-btn {
  padding: 3px 10px; border-radius: 4px;
  font-size: 10px; font-weight: 500; cursor: pointer;
  font-family: 'Inter', sans-serif;
  color: var(--muted); transition: all 0.15s;
  border: none; background: transparent;
}
.uf-metric-btn.active { background: var(--gold); color: #ffffff; }

/* Tabs */
.uf-tabs {
  display: flex; gap: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  flex-shrink: 0;
}
.uf-tab {
  padding: 8px 14px; font-size: 11px; font-weight: 500;
  color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s; user-select: none;
  background: none; border-top: none; border-left: none; border-right: none;
  font-family: 'Inter', sans-serif;
}
.uf-tab:hover { color: var(--text); }
.uf-tab.active { color: var(--text); border-bottom-color: var(--gold); }

/* Metric Strip */
.uf-metric-strip {
  background: rgba(30,64,175,0.05);
  border-bottom: 1px solid rgba(30,64,175,0.15);
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
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* (AI panel is now inline via .uf-ai-right) */

/* Sidebar */
.uf-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 0;
  overflow-y: auto;
  width: 200px;
  flex-shrink: 0;
}
.uf-sb-group { padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.uf-sb-group:last-child { border-bottom: none; }
.uf-sb-glabel {
  padding: 3px 16px 5px; font-size: 9px; font-weight: 600;
  letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted);
  font-family: 'Inter', sans-serif;
}
.uf-sb-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 16px; font-size: 12px; cursor: pointer;
  color: var(--muted); transition: all 0.15s; user-select: none;
  border: none; background: none; width: 100%; text-align: left;
  border-left: 2px solid transparent;
  font-family: 'Inter', sans-serif;
}
.uf-sb-item:hover { color: var(--text); background: rgba(0,0,0,0.03); }
.uf-sb-item.active { color: var(--gold); background: rgba(30,64,175,0.08); border-left-color: var(--gold); font-weight: 500; }
.uf-sb-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
.uf-sb-header { padding: 12px 14px; border-bottom: 1px solid var(--border); }
.uf-sb-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.3; }
.uf-sb-subtitle { font-size: 10px; color: var(--muted); margin-top: 2px; }
.uf-sb-controls { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.uf-nav-pill {
  font-size: 9px; border-radius: 4px; padding: 2px 6px;
  font-family: 'Inter', sans-serif; font-weight: 500;
}
.pill-red { background: rgba(220,38,38,0.2); color: #E74C3C; }
.pill-amber { background: rgba(217,119,6,0.2); color: #F39C12; }
.pill-green { background: rgba(22,163,74,0.2); color: #2ECC71; }
.pill-blue { background: rgba(37,99,235,0.2); color: #3498DB; }

/* Centre wrapper — holds content + AI side by side */
.uf-centre-wrap {
  flex: 1; min-width: 0;
  display: flex;
  overflow: hidden;
}
.uf-centre {
  flex: 1; min-width: 0;
  overflow-y: auto; padding: 14px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.uf-ai-right {
  width: 380px; flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: var(--surface);
  display: flex; flex-direction: column;
  min-height: 0;
}

/* Signal Banner */
.uf-signal-banner {
  background: rgba(30,64,175,0.08);
  border: 1px solid rgba(30,64,175,0.25);
  border-radius: 8px; padding: 11px 14px;
  display: flex; align-items: flex-start; gap: 10px;
}
.uf-signal-banner.positive {
  background: rgba(22,163,74,0.08);
  border-color: rgba(22,163,74,0.25);
}
.uf-signal-banner.info {
  background: rgba(37,99,235,0.08);
  border-color: rgba(37,99,235,0.3);
}
.uf-signal-banner.critical {
  background: rgba(220,38,38,0.08);
  border-color: rgba(220,38,38,0.3);
}
.uf-signal-icon { font-size: 16px; margin-top: 1px; flex-shrink: 0; }
.uf-signal-dismiss {
  margin-left: auto; flex-shrink: 0; background: none; border: 1px solid var(--border);
  border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 500;
  color: var(--muted); cursor: pointer; transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.uf-signal-dismiss:hover { border-color: var(--gold); color: var(--gold); }
.uf-signal-show {
  display: inline-flex; align-items: center; gap: 5px;
  background: none; border: 1px solid var(--border); border-radius: 6px;
  padding: 4px 10px; font-size: 10px; color: var(--muted); cursor: pointer;
  transition: all 0.15s; font-family: 'Inter', sans-serif;
}
.uf-signal-show:hover { border-color: var(--gold); color: var(--gold); }
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
.uf-segment-row:hover { background: rgba(30,64,175,0.04); }
.uf-segment-row.selected { background: rgba(30,64,175,0.07); border-left: 2px solid var(--gold); padding-left: 10px; }
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
  background: var(--navy); border: 1px solid var(--gold);
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
.uf-exc-card:hover { border-color: rgba(30,64,175,0.4); transform: translateX(2px); }
.uf-exc-card.critical { border-left: 3px solid var(--red); }
.uf-exc-card.warning { border-left: 3px solid var(--amber); }
.uf-exc-card.positive { border-left: 3px solid var(--green); }
.uf-exc-card.selected { background: rgba(30,64,175,0.06); border-color: var(--gold); }
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
.uf-signal-card:hover { border-color: rgba(30,64,175,0.4); }
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
.uf-history-row:hover { border-color: rgba(30,64,175,0.4); }
.uf-history-row.current { border-color: var(--gold); background: rgba(30,64,175,0.06); }
.uf-history-row.selected { border-color: var(--gold); }
.uf-history-week { font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; }
.uf-history-dates { font-size: 10px; color: var(--muted); margin-top: 2px; }
.uf-history-tags { display: flex; gap: 5px; }

/* AI Panel — slide-over on all screen sizes */
.uf-ai-panel {
  position: fixed; right: 0; top: 0; bottom: 0; z-index: 200;
  width: 360px; transform: translateX(100%);
  transition: transform 0.25s ease;
  background: var(--theme-surface, #ffffff);
  border-left: 1px solid var(--theme-border, #e2e8f0);
  display: flex; flex-direction: column;
  min-height: 0;
  box-shadow: -4px 0 20px rgba(0,0,0,0.08);
}
.uf-ai-panel.open { transform: translateX(0); }
.uf-ai-overlay {
  position: fixed; inset: 0; z-index: 199;
  background: rgba(0,0,0,0.3); display: none;
}
.uf-ai-overlay.open { display: block; }
/* AI Header */
.uf-ai-header {
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0; background: linear-gradient(135deg, rgba(30,64,175,0.04) 0%, transparent 100%);
}
.uf-ai-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #1E40AF, #3B82F6);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #fff; flex-shrink: 0;
}
.uf-ai-title { font-size: 13px; font-weight: 600; color: var(--text); }
.uf-ai-subtitle { font-size: 10px; color: var(--muted); }

/* Messages area */
.uf-ai-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 16px;
  min-height: 0; background: var(--surface);
}

/* Message containers */
.uf-msg { display: flex; gap: 8px; animation: ufMsgIn 0.3s ease; }
@keyframes ufMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes ufDot { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.1); } }

.uf-msg-avatar {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
}
.uf-msg.user .uf-msg-avatar { background: var(--surfaceLt); color: var(--muted); }
.uf-msg.ai .uf-msg-avatar { background: linear-gradient(135deg, #1E40AF, #3B82F6); color: #fff; }

.uf-msg-content { flex: 1; min-width: 0; }
.uf-msg-role { display: none; }

.uf-msg-bubble {
  border-radius: 12px; padding: 10px 14px;
  font-size: 12px; line-height: 1.6;
}
.uf-msg.user .uf-msg-bubble {
  background: var(--gold); color: #fff;
  border-radius: 12px 12px 4px 12px;
  font-weight: 500;
}
.uf-msg.ai .uf-msg-bubble {
  background: #fff; border: 1px solid var(--border); color: var(--text);
  border-radius: 12px 12px 12px 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.uf-msg.ai .uf-msg-bubble strong { color: var(--gold); font-weight: 600; }
.uf-msg.typing .uf-msg-bubble { color: var(--muted); font-style: italic; }

.uf-sig-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.uf-sig-item {
  display: flex; align-items: center; gap: 8px; font-size: 11px;
  padding: 6px 10px; background: var(--surface); border-radius: 6px;
  border: 1px solid var(--border);
}
.uf-sig-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* Input area */
.uf-ai-input-area {
  padding: 12px 14px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
  flex-shrink: 0; background: #fff;
}
.uf-ai-input {
  background: var(--surface); border: 2px solid var(--border);
  border-radius: 12px; padding: 0;
  font-size: 12px; color: var(--text); font-family: 'Inter', sans-serif;
  display: flex; align-items: center;
  transition: border-color 0.2s;
  overflow: hidden;
}
.uf-ai-input:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(30,64,175,0.08); }
.uf-ai-send {
  cursor: pointer; background: var(--gold); color: #fff;
  border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center;
  justify-content: center; font-weight: 700; transition: all 0.15s;
  border: none; margin: 3px; font-size: 13px; flex-shrink: 0;
}
.uf-ai-send:hover { background: #1e3a8a; }
.uf-ai-send:disabled { opacity: 0.3; cursor: not-allowed; }

/* Suggestions */
.uf-ai-suggestions { display: flex; flex-wrap: wrap; gap: 5px; }
.uf-suggestion {
  background: rgba(30,64,175,0.04); border: 1px solid rgba(30,64,175,0.12);
  border-radius: 20px; padding: 5px 12px;
  font-size: 10.5px; color: var(--gold); cursor: pointer;
  font-weight: 500; transition: all 0.15s; user-select: none;
  text-align: left; font-family: 'Inter', sans-serif;
}
.uf-suggestion:hover { border-color: var(--gold); background: rgba(30,64,175,0.08); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(30,64,175,0.1); }

/* Bottom Bar */
.uf-bottombar {
  background: var(--navy); border-top: 1px solid var(--border);
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

/* ═══════════════════════════════════════════════
   MOBILE/TABLET TOGGLE CONTROLS
   ═══════════════════════════════════════════════ */
.uf-mobile-controls { display: none; }
.uf-sidebar-toggle { display: none; }
.uf-ai-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--gold); cursor: pointer; transition: all 0.15s;
  font-size: 14px; flex-shrink: 0;
}
.uf-ai-toggle:hover { border-color: var(--gold); background: rgba(30,64,175,0.05); }
.uf-ai-close {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 4px; margin-left: auto;
  background: transparent; border: 1px solid var(--border);
  color: var(--muted); cursor: pointer; font-size: 12px;
}
.uf-ai-close:hover { border-color: var(--gold); color: var(--gold); }
.uf-sidebar-overlay { display: none; }

/* ═══════════════════════════════════════════════
   TABLET (768px – 1279px)
   ═══════════════════════════════════════════════ */
@media (max-width: 1279px) {
  .uf-app { margin: 2px; border-radius: 8px; }

  /* Single-column grid: sidebar as drawer */
  .uf-main { grid-template-columns: 1fr; }

  /* Sidebar: slide-over drawer */
  .uf-sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 200;
    width: 240px; transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .uf-sidebar.open { transform: translateX(0); }
  .uf-sidebar-overlay {
    position: fixed; inset: 0; z-index: 199;
    background: rgba(0,0,0,0.5); display: none;
  }
  .uf-sidebar-overlay.open { display: block; }

  /* AI panel: narrower on tablet */
  .uf-ai-panel { width: 300px; }

  /* Show sidebar toggle */
  .uf-sidebar-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); cursor: pointer; transition: all 0.15s;
    font-size: 13px; flex-shrink: 0;
  }
  .uf-sidebar-toggle:hover { border-color: var(--gold); color: var(--gold); }

  /* Topbar: compact — single tight row */
  .uf-topbar { padding: 6px 12px; }
  .uf-logo { font-size: 14px; }
  .uf-week-badge { display: none; }
  .uf-status-text { display: none; }

  /* Tabs: slimmer */
  .uf-tabs { overflow-x: auto; padding: 0 12px; }
  .uf-tab { white-space: nowrap; padding: 6px 12px; font-size: 11px; }

  /* Metric strip: hide on tablet — saves ~24px */
  .uf-metric-strip { display: none; }

  /* Centre: tight padding, minimal gaps */
  .uf-centre { padding: 10px 14px; gap: 8px; }

  /* Signal banner: compact single-line feel */
  .uf-signal-banner { padding: 8px 12px; gap: 8px; border-radius: 6px; }
  .uf-signal-icon { font-size: 14px; }
  .uf-signal-text { font-size: 11px; line-height: 1.4; }
  .uf-signal-text strong { font-size: 11px; display: inline; margin-bottom: 0; }

  /* Stat cards: KEEP 4-col row — tablet has enough width */
  .uf-stat-row { grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .uf-stat-card { padding: 8px 10px; }
  .uf-stat-value { font-size: 16px; margin-bottom: 1px; }
  .uf-stat-label { font-size: 8px; letter-spacing: 0.7px; margin-bottom: 3px; }
  .uf-stat-delta { font-size: 9px; }

  /* Commentary: compact */
  .uf-commentary-header { padding: 7px 12px; flex-wrap: wrap; gap: 4px; }
  .uf-commentary-title { font-size: 11px; }
  .uf-commentary-meta { font-size: 9px; }
  .uf-commentary-body { padding: 8px 10px; gap: 6px; }
  .uf-segment-row { padding: 6px; gap: 8px; }
  .uf-seg-rank { width: 18px; height: 18px; font-size: 9px; }
  .uf-seg-name { font-size: 11px; }
  .uf-seg-text { font-size: 10px; line-height: 1.4; }
  .uf-seg-tags { margin-top: 3px; gap: 3px; }
  .uf-seg-tag { font-size: 8.5px; padding: 1px 5px; }

  /* Chart area: smaller */
  .uf-chart-area { padding: 10px; }
  .uf-bars { height: 60px; }

  /* Drill grid: stays 2-col, compact */
  .uf-drill-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .uf-drill-card { padding: 10px 12px; }
  .uf-drill-spark { height: 28px; }
  .uf-drill-card-name { font-size: 11px; }

  /* Exception cards: compact */
  .uf-exc-card { padding: 8px 10px; gap: 8px; }
  .uf-exc-name { font-size: 11px; }
  .uf-exc-detail { font-size: 10px; }
  .uf-exc-val { font-size: 14px; }

  /* Signal cards: compact */
  .uf-signal-card { padding: 10px 12px; }
  .uf-signal-card-name { font-size: 11px; }
  .uf-signal-card-body { font-size: 10px; }

  /* History: compact */
  .uf-history-row { padding: 7px 12px; }

  /* Bottom bar: slim */
  .uf-bottombar { padding: 4px 12px; }
  .uf-bottom-stat { font-size: 9px; }
  .uf-bottom-right { font-size: 9px; }
  .uf-bottom-left { gap: 10px; }
}

/* ═══════════════════════════════════════════════
   PHONE (< 768px)
   ═══════════════════════════════════════════════ */
@media (max-width: 767px) {
  .uf-app { margin: 2px; border-radius: 8px; }

  /* Topbar: minimal */
  .uf-topbar { padding: 8px 10px; }
  .uf-logo { font-size: 14px; }
  .uf-metric-toggle { display: none; }
  .uf-avatar { width: 24px; height: 24px; font-size: 9px; }

  /* Tabs: compact, scrollable */
  .uf-tabs { padding: 0 8px; gap: 0; }
  .uf-tab { padding: 7px 10px; font-size: 10px; }

  /* Metric strip: hide on phone */
  .uf-metric-strip { display: none; }

  /* Stat cards: 2x1 grid (stacked 2 columns) */
  .uf-stat-row { grid-template-columns: 1fr 1fr; gap: 6px; }
  .uf-stat-card { padding: 8px 10px; }
  .uf-stat-value { font-size: 15px; }
  .uf-stat-label { font-size: 8px; letter-spacing: 0.5px; }

  /* Centre: tight padding */
  .uf-centre { padding: 8px; gap: 8px; }

  /* Signal banners: compact */
  .uf-signal-banner { padding: 8px 10px; gap: 8px; }
  .uf-signal-icon { font-size: 14px; }
  .uf-signal-text { font-size: 10.5px; }
  .uf-signal-text strong { font-size: 11px; }

  /* Commentary: tighter */
  .uf-commentary-header { padding: 8px 10px; }
  .uf-commentary-meta { display: none; }
  .uf-commentary-body { padding: 8px; gap: 8px; }
  .uf-segment-row { padding: 6px; gap: 8px; }
  .uf-seg-text { font-size: 10px; }
  .uf-seg-name { font-size: 11px; }

  /* Drill grid: single column */
  .uf-drill-grid { grid-template-columns: 1fr; }

  /* Exception cards: stack */
  .uf-exc-card { flex-wrap: wrap; gap: 8px; padding: 10px; }
  .uf-exc-right { text-align: left; }

  /* History: compact */
  .uf-history-row { padding: 8px 10px; flex-wrap: wrap; gap: 6px; }
  .uf-history-tags { flex-wrap: wrap; }

  /* Bottom bar: hide */
  .uf-bottombar { display: none; }

  /* Chart: smaller */
  .uf-bars { height: 60px; }
  .uf-bar { width: 8px; }
  .uf-chart-area { padding: 10px; }

  /* Sidebar: narrower on phone */
  .uf-sidebar { width: 200px; }
  .uf-ai-panel { width: 100%; }
}
`

// ═══════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════

export default function FluxPlusPage() {
  // ── State ──
  const [region, setRegion] = useState<Region>("national")
  const [comparison, setComparison] = useState<Comparison>("plan")
  const [metric, setMetric] = useState<MetricType>("Revenue")
  const [tab, setTab] = useState<TabType>("analysis")
  const [selectedSegment, setSelectedSegment] = useState(-1)
  const [selectedExc, setSelectedExc] = useState<string | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null)
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [chatActions, setChatActions] = useState<WorkbenchAction[]>([])
  const [signalDismissed, setSignalDismissed] = useState(false)

  const aiMessagesRef = useRef<HTMLDivElement>(null)
  const typingRef = useRef<ReturnType<typeof setTimeout>>()
  const centreScrollRef = useRef<HTMLDivElement>(null)

  const toggleAiPanel = useCallback(() => {
    setAiPanelOpen((prev) => !prev)
  }, [])

  // Listen for AI toggle from WorkbenchSwitcher
  useEffect(() => {
    const handler = () => toggleAiPanel()
    window.addEventListener("meeru-toggle-ai", handler)
    return () => window.removeEventListener("meeru-toggle-ai", handler)
  }, [toggleAiPanel])

  // ── Industry data overlay ──
  const { config: industryConfig, isDemoMode } = useIndustry()
  const indRegion = useMemo(() => {
    // Map the current region index to industry region data
    const regionIdx = ["national", "northeast", "southeast", "midwest", "west", "southwest"].indexOf(region)
    return industryConfig.regions[Math.min(regionIdx, industryConfig.regions.length - 1)] || industryConfig.regions[0]
  }, [industryConfig, region])

  // ── Derived data ──
  const regData = DATA.regions[region]
  const compData = DATA.comparisons[comparison]
  const metricData = metric === "Revenue" ? regData.revenue : regData.orders

  const segments = (() => {
    if (isDemoMode) return indRegion.segments
    const overrides = compData.segmentOverrides[region]
    if (overrides) return overrides
    return regData.segments.map((s) => ({
      ...s,
      variance: s.variance.replace(/vs \w+(\s+\w+)?/, compData.label),
    }))
  })()

  const totalVariance = isDemoMode
    ? indRegion.variance
    : metric === "Revenue" ? (compData.totalVariance || metricData.variance) : metricData.variance
  const totalColor = isDemoMode
    ? indRegion.varianceColor === "up" ? "up" : "down"
    : compData.totalColor || metricData.color

  // ── Industry-derived sidebar data ──
  const effectiveRegionItems = useMemo(() => {
    if (!isDemoMode) return null
    const keys: Region[] = ["national", "northeast", "southeast", "midwest", "west", "southwest"]
    return industryConfig.regions.map((r, i) => ({
      key: keys[i] || keys[0],
      label: r.label,
    }))
  }, [isDemoMode, industryConfig])

  const effectiveSegmentNav = useMemo(() => {
    if (!isDemoMode) return null
    return industryConfig.drivers.map((d) => ({
      key: d.name.toLowerCase().replace(/\s+/g, "-"),
      label: d.name,
      pillCls: d.impactDir === "up" ? "pill-green" : d.confidence === "high" ? "pill-red" : "pill-amber",
      pill: d.impact,
    }))
  }, [isDemoMode, industryConfig])

  const effectiveDrillSegments = useMemo(() => {
    if (!isDemoMode) return DATA.drillSegments
    return industryConfig.regions.flatMap((r) =>
      r.segments.map((s, si) => ({
        id: s.name.toLowerCase().replace(/\s+/g, "-"),
        name: s.name,
        region: r.label,
        variance: s.variance.split(" ")[0],
        varColor: (s.variance.startsWith("+") || s.variance.startsWith("−$0.") === false && s.variance.startsWith("+")) ? "up" as const : "down" as const,
        spark: s.variance.startsWith("+") ? [48, 50, 52, 55, 58] : [62, 60, 57, 53, 50],
        util: "—",
        utilColor: "var(--muted)",
        trips: s.variance.split(" ")[0].replace("−", "-"),
        tripsVsPlan: s.variance.split(" ")[0],
      }))
    ).slice(0, 6)
  }, [isDemoMode, industryConfig])

  const effectiveExceptions = useMemo(() => {
    if (!isDemoMode) return DATA.exceptions
    return industryConfig.drivers.map((d, i) => ({
      id: `ind-exc-${i}`,
      severity: d.impactDir === "up" ? "positive" : d.confidence === "high" ? "critical" : "warning",
      icon: d.impactDir === "up" ? "🟢" : d.confidence === "high" ? "🔴" : "🟡",
      name: `${d.name} — ${industryConfig.label}`,
      detail: `Impact: ${d.impact}. Confidence: ${d.confidence}. ${industryConfig.narratives.headline}`,
      tags: [
        { cls: d.impactDir === "up" ? "pill-green" : d.confidence === "high" ? "pill-red" : "pill-amber", label: d.confidence.charAt(0).toUpperCase() + d.confidence.slice(1) },
        { cls: d.impactDir === "up" ? "pill-green" : "pill-amber", label: d.impactDir === "up" ? "Positive" : "Watch" },
      ],
      value: d.impact,
      week: "Current",
      aiQ: `Explain the ${d.name} impact`,
      aiA: `<strong>${d.name}</strong> has an impact of <strong>${d.impact}</strong>. ${industryConfig.narratives.headline}`,
    }))
  }, [isDemoMode, industryConfig])

  const effectiveSignals = useMemo(() => {
    if (!isDemoMode) return DATA.signals
    return industryConfig.drivers.map((d) => ({
      name: `${d.name} — ${industryConfig.label}`,
      type: d.impactDir === "up" ? "Growth" : d.confidence === "high" ? "Risk" : "Watch",
      typeCls: d.impactDir === "up" ? "pill-green" : d.confidence === "high" ? "pill-red" : "pill-amber",
      confidence: d.confidence === "high" ? 92 : d.confidence === "medium" ? 76 : 65,
      body: `${d.name} shows ${d.impact} impact with ${d.confidence} confidence. ${industryConfig.narratives.headline}`,
      confColor: d.impactDir === "up" ? "var(--green)" : d.confidence === "high" ? "var(--red)" : "#d97706",
    }))
  }, [isDemoMode, industryConfig])

  const regionPillMap: Record<Region, string> = isDemoMode
    ? (() => {
        const map: Record<Region, string> = { national: "", northeast: "", southeast: "", midwest: "", west: "", southwest: "" }
        const keys: Region[] = ["national", "northeast", "southeast", "midwest", "west", "southwest"]
        industryConfig.regions.forEach((r, i) => { if (i < keys.length) map[keys[i]] = r.variance })
        return map
      })()
    : {
        national: compData.stats.national,
        northeast: compData.stats.ne,
        southeast: compData.stats.se,
        midwest: compData.stats.mw,
        west: compData.stats.w,
        southwest: compData.stats.sw,
      }
  const regionPillColorMap: Record<Region, string> = isDemoMode
    ? (() => {
        const map: Record<Region, string> = { national: "", northeast: "", southeast: "", midwest: "", west: "", southwest: "" }
        const keys: Region[] = ["national", "northeast", "southeast", "midwest", "west", "southwest"]
        industryConfig.regions.forEach((r, i) => { if (i < keys.length) map[keys[i]] = r.varianceColor === "up" ? "pill-green" : "pill-red" })
        return map
      })()
    : {
        national: compData.pillColors.national,
        northeast: compData.pillColors.ne,
        southeast: compData.pillColors.se,
        midwest: compData.pillColors.mw,
        west: compData.pillColors.w,
        southwest: compData.pillColors.sw,
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
        setAiMessages((prev) => [...prev, { role: "ai", name: "Meeru AI", html }])
        scrollAI()
      }, delay)
    },
    [scrollAI]
  )

  // ── Seed AI on region change ──
  useEffect(() => {
    if (isDemoMode) {
      setAiMessages([
        { role: "ai", name: "Meeru AI", html: `<strong>${indRegion.signalTitle}</strong><br><br>${indRegion.signalBody}` },
      ])
      setSuggestions([...industryConfig.aiSuggestions])
    } else {
      const r = DATA.regions[region]
      setAiMessages([...r.ai.messages])
      setSuggestions([...r.ai.suggestions])
    }
    setIsTyping(false)
    if (typingRef.current) clearTimeout(typingRef.current)
  }, [region, isDemoMode, indRegion, industryConfig])

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
    setSidebarOpen(false)
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
      `<strong>Now showing ${m === "Orders" ? "Order volume" : "Revenue (USD)"}.</strong><br><br>The variance patterns and rankings are identical — the underlying drivers don't change with the metric lens. ${m === "Orders" ? "Order counts reflect operational volume and fulfillment capacity." : "Revenue is the financial metric — it directly reflects pricing, volume, and mix impact."}`,
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

  const generateAIResponse = useCallback((query: string): AiResponsePayload => {
    const q = query.toLowerCase()
    const regionLbl = regData.label
    const summary = `${regData.label} · ${metric} · ${compData.label} — variance ${totalVariance}, driver ${metricData.driver}`

    const emailCfo = (body: string) => ({
      kind: "email" as const,
      label: "Email CFO summary",
      recipient: "CFO",
      body,
      contextual: true,
    })
    const slackOps = (body?: string) => ({
      kind: "slack" as const,
      label: `Slack ${regionLbl} ops lead`,
      recipient: `${regionLbl} Ops`,
      body,
      contextual: true,
    })
    const remindMe = (label: string) => ({
      kind: "reminder" as const,
      label,
      contextual: true,
    })
    const pinInsight = (label = "Pin this insight") => ({
      kind: "pin" as const,
      label,
      contextual: true,
    })
    const imTeammate = (body?: string) => ({
      kind: "im" as const,
      label: "IM teammate for context",
      body,
      contextual: true,
    })

    if (q.includes("risk") || q.includes("concern") || q.includes("watch")) {
      return {
        text: `<strong>Risk assessment for ${regData.label}:</strong><br><br>${regData.signal.body}<br><br><strong>Key flags:</strong> ${metricData.flagged} segments flagged (${metricData.flaggedDetail}). Top driver: <strong>${metricData.driver}</strong> — ${metricData.driverDetail}.`,
        actions: [remindMe("Remind me before next run"), emailCfo(summary), slackOps(summary), pinInsight(`Pin ${regionLbl} risk`)],
      }
    }
    if (q.includes("action") || q.includes("recommend") || q.includes("should") || q.includes("do")) {
      return {
        text: `<strong>Recommended actions — ${regData.label}:</strong><br><br>${regData.ai.messages.filter((m) => m.role === "ai").pop()?.html || regData.signal.body}`,
        actions: [slackOps(summary), emailCfo(summary), imTeammate(summary), pinInsight()],
      }
    }
    if (q.includes("variance") || q.includes("gap") || q.includes("miss")) {
      return {
        text: `<strong>Variance breakdown — ${regData.label} · ${compData.label}:</strong><br><br>Total variance: <strong>${totalVariance}</strong>. ${compData.signal || regData.signal.body}`,
        actions: [emailCfo(summary), slackOps(summary), pinInsight(`Pin ${compData.label} variance`)],
      }
    }
    if (q.includes("driver") || q.includes("cause") || q.includes("why")) {
      return {
        text: `<strong>Top driver: ${metricData.driver}</strong> — ${metricData.driverDetail}.<br><br>This factor accounts for approximately 50–65% of the total ${compData.label} variance in ${regData.label}. ${regData.signal.body}`,
        actions: [slackOps(`Top driver: ${metricData.driver}`), emailCfo(summary), imTeammate(summary), pinInsight()],
      }
    }
    if (q.includes("forecast") || q.includes("next week") || q.includes("predict") || q.includes("w11")) {
      return {
        text: `<strong>Forward outlook — ${regData.label}:</strong><br><br>${regData.signal.body}<br><br><strong>Confidence:</strong> Based on ${metricData.flagged} flagged segments and current ${metric} trajectory.`,
        actions: [remindMe("Remind me next week"), emailCfo(summary), pinInsight("Pin forecast")],
      }
    }
    if (q.includes("compare") || q.includes("vs") || q.includes("prior")) {
      return {
        text: `<strong>${compData.label} analysis — ${regData.label}:</strong><br><br>${compData.aiA}`,
        actions: [emailCfo(summary), pinInsight(`Pin ${compData.label} comparison`), { kind: "share", label: "Share copy", contextual: true }],
      }
    }
    if (q.includes("exception") || q.includes("flagged") || q.includes("anomal")) {
      return {
        text: `<strong>Exceptions — ${regData.label}:</strong><br><br>${metricData.flagged} segments flagged (${metricData.flaggedDetail}). ${regData.signal.body}`,
        actions: [remindMe("Chase exception owners"), slackOps(summary), emailCfo(summary), pinInsight()],
      }
    }
    if (q.includes("segment") || q.includes("breakdown")) {
      return {
        text: `<strong>Segment breakdown — ${regData.label}:</strong><br><br>${segments.map((s) => `<strong>${s.name}</strong>: ${s.variance} — ${s.text.substring(0, 120)}...`).join("<br><br>")}`,
        actions: [slackOps(summary), imTeammate(summary), pinInsight("Pin segments")],
      }
    }
    if (q.includes("summary") || q.includes("overview") || q.includes("status")) {
      return {
        text: `<strong>${regData.label} · ${compData.label} · ${metric}:</strong><br><br>Total variance: <strong>${totalVariance}</strong>. Segments flagged: <strong>${metricData.flagged}</strong> (${metricData.flaggedDetail}). Top driver: <strong>${metricData.driver}</strong>.<br><br>${compData.signal || regData.signal.body}`,
        actions: [emailCfo(summary), pinInsight("Pin overview"), { kind: "share", label: "Share copy", contextual: true }],
      }
    }
    // Default contextual response — no explicit actions, falls back to keyword derivation
    return {
      text: `<strong>Analysis for "${query}":</strong><br><br>Analyzing for <em>${regData.label}</em> — ${metric} · ${compData.label}.<br><br>Total variance: <strong>${totalVariance}</strong>. ${metricData.flagged} segments flagged (${metricData.flaggedDetail}). Primary driver: <strong>${metricData.driver}</strong> — ${metricData.driverDetail}.<br><br>${regData.signal.body}`,
    }
  }, [regData, compData, metricData, metric, totalVariance, segments])

  const handleChatSubmit = useCallback(() => {
    const text = chatInput.trim()
    if (!text || isTyping) return
    setChatInput("")
    addUserMsg(text)
    addAIMsg(generateAIResponse(text).text, 900)
  }, [chatInput, isTyping, addUserMsg, addAIMsg, generateAIResponse])

  const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }, [handleChatSubmit])

  // ── Chart render ──
  const renderChart = () => {
    const bars = isDemoMode
      ? indRegion.chartBars.map((b: { week: string; actual: number; plan: number; forecast?: boolean }) => ({
          week: b.week,
          actual: b.actual,
          plan: b.plan,
          color: b.actual >= b.plan ? "var(--green)" : b.actual >= b.plan * 0.85 ? "#d97706" : "var(--red)",
          forecast: b.forecast,
        }))
      : regData.chart.bars
    const chartTitle = (isDemoMode ? indRegion.chartTitle : regData.chart.title) + (metric === "Orders" ? " (Orders)" : " (Revenue)")
    return (
      <div className="uf-chart-area" data-tour-id="uf-chart">
        <div className="uf-chart-header">
          <div className="uf-chart-title">{chartTitle}</div>
          <div className="uf-chart-legend">
            <div className="uf-legend-item">
              <div className="uf-legend-dot" style={{ background: "#1E40AF" }} />
              Actual
            </div>
            <div className="uf-legend-item">
              <div className="uf-legend-dot" style={{ background: "var(--muted)" }} />
              Plan
            </div>
          </div>
        </div>
        <div className="uf-bars">
          {bars.map((b) => {
            const multiplier = metric === "Orders" ? 1.6 : 1
            const actual = Math.round(b.actual * multiplier)
            const plan = Math.round(b.plan * multiplier)
            const maxH = 74
            const aH = Math.max(3, Math.round((actual / (plan * 1.15)) * maxH))
            const pH = Math.round((plan / (plan * 1.15)) * maxH)
            const unit = metric === "Orders" ? "K orders" : "M rev"
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
                  <div className="uf-bar" style={{ height: `${pH}px`, background: "var(--muted)", opacity: b.forecast ? 0.3 : 0.55 }} />
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
    { key: "national", label: "National" },
    { key: "northeast", label: "Northeast" },
    { key: "southeast", label: "Southeast" },
    { key: "midwest", label: "Midwest" },
    { key: "west", label: "West" },
    { key: "southwest", label: "Southwest" },
  ]

  const comparisonItems: { key: Comparison; label: string }[] = [
    { key: "plan", label: "vs Plan" },
    { key: "priorweek", label: "vs Prior Week" },
    { key: "prioryear", label: "vs Prior Year" },
    { key: "forecast", label: "vs Forecast" },
    { key: "runrate", label: "vs Run Rate" },
  ]

  const segmentNavItems = [
    { key: "retail", label: "Retail", pillCls: "pill-red", pill: "−$1.6M" },
    { key: "energy", label: "Energy", pillCls: "pill-amber", pill: "−$0.8M" },
    { key: "financial", label: "Financial Svcs", pillCls: "pill-green", pill: "+$0.7M" },
    { key: "healthcare", label: "Healthcare", pillCls: "pill-blue", pill: "−$0.3M" },
  ]

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "analysis", icon: "◈", label: "Analysis" },
    { key: "drilldown", icon: "⊞", label: "Drill-Down" },
    { key: "exceptions", icon: "⚡", label: "Exceptions" },
    { key: "signals", icon: "◎", label: "Signals" },
    { key: "history", icon: "⟋", label: "History" },
  ]

  // ── Contextual action cards (drive the bottom adaptive-UI strip) ──
  const regionLabel = isDemoMode ? indRegion.label : regData.label
  const contextualActions: WorkbenchAction[] = [...chatActions]
  if (chatActions.length === 0) {
    // Fallback defaults before any chat interaction
    const isUnderperforming = totalColor === "down"
    if (isUnderperforming) {
      contextualActions.push({
        kind: "slack",
        label: `Slack ${regionLabel} ops lead`,
        recipient: `${regionLabel} Ops`,
        contextual: true,
      })
      contextualActions.push({
        kind: "email",
        label: "Email CFO summary",
        recipient: "CFO",
        body: `${regionLabel} is underperforming (${totalVariance}) vs ${compData.label}. Key driver: ${metricData.driver}.`,
        contextual: true,
      })
    }
    if (tab === "exceptions" && effectiveExceptions.length > 0) {
      contextualActions.push({
        kind: "reminder",
        label: `Chase ${effectiveExceptions.length} exception${effectiveExceptions.length > 1 ? "s" : ""}`,
        contextual: true,
      })
    }
    if (tab === "signals" && effectiveSignals.length > 0) {
      contextualActions.push({
        kind: "pin",
        label: `Pin top signal to workspace`,
        contextual: true,
      })
    }
  }

  const contextTitle = `${regionLabel} · ${metric} · ${compData.label}`

  // ── AI panel insights feed (shown before any user chat) ──
  const feedItems: AiFeedItem[] = [
    {
      id: "f1",
      tone: totalColor === "down" ? "down" : "up",
      headline: `${regionLabel} ${metric}: ${totalVariance}`,
      detail: `vs ${compData.label} · primary driver ${metricData.driver}`,
      timestamp: "just now",
    },
    {
      id: "f2",
      tone: "warn",
      headline: `${effectiveExceptions.length} exceptions flagged`,
      detail: "3 critical · 2 warning · 2 positive",
      timestamp: "2m ago",
    },
    {
      id: "f3",
      tone: "info",
      headline: `${effectiveSignals.length} ML signals active`,
      detail: regData.signal.body.slice(0, 80) + (regData.signal.body.length > 80 ? "…" : ""),
      timestamp: "5m ago",
    },
  ]

  // ═════════════════════════════════════════════════════
  //  JSX
  // ═════════════════════════════════════════════════════

  return (
    <div className="uf-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="uf-app">
        {/* ── Content row: left column (tabs + main) + AI panel spanning full height ── */}
        <div className="uf-content-row">
        <div className="uf-left-col">
        {/* ── Top Nav: view categories ── */}
        <div className="uf-tabs" role="tablist" aria-label="Workbench view">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`uf-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="uf-sb-icon" style={{ marginRight: 6 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Main ── */}
        <div className="uf-main">
          {/* Sidebar overlay for mobile/tablet */}
          <div className={`uf-sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

          {/* ── Left Sidebar ── */}
          <div className={`uf-sidebar ${sidebarOpen ? "open" : ""}`}>
            {/* Regions group */}
            <div className="uf-sb-group">
              <div className="uf-sb-glabel">Regions</div>
              {(effectiveRegionItems || regionItems).map((r) => (
                <button key={r.key} className={`uf-sb-item ${region === r.key ? "active" : ""}`} onClick={() => handleRegionClick(r.key)}>
                  {r.label}
                  <span className={`uf-nav-pill ${regionPillColorMap[r.key] || ""}`}>{regionPillMap[r.key] || ""}</span>
                </button>
              ))}
            </div>
            {/* Comparison group */}
            <div className="uf-sb-group">
              <div className="uf-sb-glabel">Comparison</div>
              {comparisonItems.map((c) => (
                <button key={c.key} className={`uf-sb-item ${comparison === c.key ? "active" : ""}`} onClick={() => handleComparisonClick(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
            {/* Segments group */}
            <div className="uf-sb-group">
              <div className="uf-sb-glabel">{isDemoMode ? "Drivers" : "Segments"}</div>
              {(effectiveSegmentNav || segmentNavItems).map((s) => (
                <button key={s.key} className="uf-sb-item" onClick={() => {
                  if (isDemoMode) {
                    addUserMsg(`Tell me about ${s.label}`)
                    addAIMsg(`<strong>${s.label}</strong> — Impact: <strong>${s.pill}</strong>.<br><br>${industryConfig.narratives.headline}`, 750)
                  } else {
                    handleSegmentNav(s.key)
                  }
                }}>
                  {s.label}
                  <span className={`uf-nav-pill ${s.pillCls}`}>{s.pill}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Centre Panel ── */}
          <div className="uf-centre-wrap">
          <div className="uf-centre" ref={centreScrollRef}>
            {/* ANALYSIS TAB */}
            {tab === "analysis" && (
              <div className="uf-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Signal Banner — dismissable */}
                {signalDismissed ? (
                  <button className="uf-signal-show" onClick={() => setSignalDismissed(false)}>
                    {regData.signal.icon} Show insight — {compData.label} · {metric} · {regData.label} ▾
                  </button>
                ) : (
                  <div className={`uf-signal-banner ${(isDemoMode ? indRegion.signalPositive : regData.signal.positive) ? "positive" : ""}`}>
                    <div className="uf-signal-icon">{regData.signal.icon}</div>
                    <div className="uf-signal-text">
                      <strong>
                        {compData.label} · {isDemoMode ? industryConfig.revenueShort : metric} · {isDemoMode ? indRegion.label : regData.label}
                      </strong>
                      {isDemoMode ? indRegion.signalBody : (compData.signal || regData.signal.body)}
                    </div>
                    <button className="uf-signal-dismiss" onClick={() => setSignalDismissed(true)}>Hide</button>
                  </div>
                )}

                {/* Stat Cards */}
                <div className="uf-stat-row" data-tour-id="uf-stats">
                  {isDemoMode ? (
                    <>
                      <div className="uf-stat-card" onClick={() => handleStatCardClick("variance")}>
                        <div className="uf-stat-label">{industryConfig.kpis.metric1.label}</div>
                        <div className={`uf-stat-value uf-${industryConfig.kpis.metric1.deltaDir === "up" ? "up" : "down"}`}>{industryConfig.kpis.metric1.value}</div>
                        <div className={`uf-stat-delta uf-${industryConfig.kpis.metric1.deltaDir === "up" ? "up" : "down"}`}>{industryConfig.kpis.metric1.delta}</div>
                      </div>
                      <div className="uf-stat-card" onClick={() => handleStatCardClick("flagged")}>
                        <div className="uf-stat-label">{industryConfig.kpis.metric2.label}</div>
                        <div className={`uf-stat-value uf-${industryConfig.kpis.metric2.deltaDir === "up" ? "up" : "warn"}`}>{industryConfig.kpis.metric2.value}</div>
                        <div className={`uf-stat-delta uf-${industryConfig.kpis.metric2.deltaDir === "up" ? "up" : "warn"}`}>{industryConfig.kpis.metric2.delta}</div>
                      </div>
                      <div className="uf-stat-card" onClick={() => handleStatCardClick("driver")}>
                        <div className="uf-stat-label">{industryConfig.kpis.metric3.label}</div>
                        <div className={`uf-stat-value uf-${industryConfig.kpis.metric3.deltaDir === "up" ? "up" : "down"}`} style={{ fontSize: 14, paddingTop: 3 }}>{industryConfig.kpis.metric3.value}</div>
                        <div className={`uf-stat-delta uf-${industryConfig.kpis.metric3.deltaDir === "up" ? "up" : "down"}`}>{industryConfig.kpis.metric3.delta}</div>
                      </div>
                      <div className="uf-stat-card">
                        <div className="uf-stat-label">{industryConfig.kpis.metric4.label}</div>
                        <div className={`uf-stat-value uf-${industryConfig.kpis.metric4.deltaDir === "up" ? "up" : "down"}`} style={{ fontSize: 14, paddingTop: 3 }}>{industryConfig.kpis.metric4.value}</div>
                        <div className={`uf-stat-delta uf-${industryConfig.kpis.metric4.deltaDir === "up" ? "up" : "down"}`}>{industryConfig.kpis.metric4.delta}</div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                {/* Commentary */}
                <div className="uf-commentary" data-tour-id="uf-content">
                  <div className="uf-commentary-header">
                    <div className="uf-commentary-title">AI-Generated Commentary — Ranked by {isDemoMode ? industryConfig.revenueShort : "Revenue"} Impact</div>
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
                  {effectiveDrillSegments.map((seg) => {
                    const minV = Math.min(...seg.spark)
                    const maxV = Math.max(...seg.spark)
                    const metricTrips = metric === "Orders" ? (parseFloat(seg.trips) * 1.6).toFixed(2) + "K orders" : "$" + seg.trips + "M"
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
                            const col = seg.varColor === "up" ? "var(--green)" : isLast ? "var(--red)" : "var(--muted)"
                            return <div key={i} className="uf-spark-bar" style={{ height: h, background: col, opacity: isLast ? 1 : 0.6 }} />
                          })}
                        </div>
                        <div className="uf-drill-stats">
                          <div className="uf-drill-stat-item">
                            <div className="uf-drill-stat-val" style={{ color: seg.utilColor }}>
                              {seg.util}
                            </div>
                            <div className="uf-drill-stat-lbl">{isDemoMode ? "Status" : "Courier Util"}</div>
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
                  {effectiveExceptions.map((exc) => (
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
                  {effectiveSignals.map((sig, idx) => (
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

          </div>{/* close uf-centre-wrap */}

        </div>
        </div>{/* close uf-left-col */}

        {/* ── AI Panel — spans full content-row height (from top of tabs to bottom) ── */}
        {aiPanelOpen && (
          <aside className="w-[380px] flex-shrink-0 border-l bg-white flex flex-col min-h-0" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="flex-1 min-h-0 flex flex-col">
              <WorkbenchAiPanel
                title="AI Analysis"
                suggestions={isDemoMode ? industryConfig.aiSuggestions : [
                  "What are the most significant exceptions this week?",
                  "Which region has the highest variance?",
                  "Explain the top driver impact",
                  "What should we watch before Thursday?",
                  "Compare W10 to prior week",
                ]}
                generateResponse={generateAIResponse}
                feedItems={feedItems}
                onAiResponse={(payload) =>
                  setChatActions(
                    payload.text
                      ? resolveChatActions(payload, {
                          pageTitle: "Uberflux",
                          region: regionLabel,
                        })
                      : [],
                  )
                }
                actionStrip={
                  <WorkbenchActionStrip
                    contextualActions={contextualActions}
                    contextTitle={contextTitle}
                  />
                }
              />
            </div>
          </aside>
        )}
        </div>{/* close uf-content-row */}

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
          <div className="uf-bottom-right">Variance Workbench · Week 10 · {isDemoMode ? indRegion.label : regData.label}</div>
        </div>
      </div>
    </div>
  )
}
