/**
 * Mock data for the MVP tablet app. Narrower than the web version for this
 * first pass — only the personas, pins, one workbench's content, and a
 * focused set of chat responses. Expand as more screens are built out.
 */
import type {
  Role, Persona, Kpi, CommentaryItem, ChartBar,
  ChatResponseDef, LivePin, ActionCard,
  DrillSegment, ExceptionItem, SignalItem, HistoryItem,
  WaterfallStep, ProductMixItem, CostDriver, SensitivityScenario,
  FluxRow, NotebookEntry,
  RegionKey, ComparisonKey, RegionData, ComparisonData,
} from './types';

// -------- PERSONAS --------
export const PERSONAS: Record<Role, Persona> = {
  CFO: {
    key: 'CFO', name: 'Mai Lane', init: 'ML', role: 'Chief Financial Officer',
    email: 'mai.lane@contoso.com',
    order: ['email', 'pin', 'share', 'slack', 'im', 'remind', 'approve', 'whatif', 'open', 'investigate'],
    department: 'Finance · Executive',
    reportsTo: 'Alex Morrison, CEO',
    teamSize: 48,
    location: 'San Francisco · HQ',
    timezone: 'Pacific · UTC−8',
    focusAreas: ['Revenue', 'Margin', 'Board Prep', 'Investor Relations'],
    quickStat: { label: 'Board meeting in', value: '9 days', tone: 'warn' },
    todayAgenda: [
      'Review Q1 variance package',
      '1:1 with VP Sales on churn plan',
      'Board deck finalization — 4 pm',
    ],
  },
  CONTROLLER: {
    key: 'CONTROLLER', name: 'Raj Patel', init: 'RP', role: 'Corporate Controller',
    email: 'raj.patel@contoso.com',
    order: ['email', 'pin', 'slack', 'share', 'im', 'remind', 'open', 'whatif', 'investigate', 'approve'],
    department: 'Accounting · Close & Consolidation',
    reportsTo: 'Mai Lane, CFO',
    teamSize: 12,
    location: 'Austin · HQ2',
    timezone: 'Central · UTC−6',
    focusAreas: ['Close Management', 'Reconciliations', 'Tax', 'Audit'],
    quickStat: { label: 'Close status', value: 'Day 4 / 5', tone: 'warn' },
    todayAgenda: [
      'Unblock AR aging reconciliation',
      'Chase tax team on depreciation schedule',
      'Stand-up with close team — 4 pm',
    ],
  },
  STAFF: {
    key: 'STAFF', name: 'Maya Gonzales', init: 'MG', role: 'Staff Accountant',
    email: 'maya.gonzales@contoso.com',
    order: ['im', 'slack', 'remind', 'email', 'investigate', 'open', 'pin', 'share', 'whatif', 'approve'],
    department: 'Accounting · AR Team',
    reportsTo: 'Raj Patel, Controller',
    teamSize: 4,
    location: 'Chicago · Remote',
    timezone: 'Central · UTC−6',
    focusAreas: ['AR Reconciliations', 'Evidence Upload', 'Investigations'],
    quickStat: { label: 'Tasks due today', value: '3', tone: 'neg' },
    todayAgenda: [
      'Investigate $142K AR variance',
      'Post Voltair remittance JE',
      'Submit evidence for Bank reconciliation',
    ],
  },
};

// -------- LIVE PINS (Workspace) --------
export const LIVE_PINS: LivePin[] = [
  { label: 'Global NRR',         value: '108%',       delta: '▼ 7pp',      tone: 'neg',  sparkline: [117, 116, 115, 108] },
  { label: 'New ARR MTD',        value: '$4.2M',      delta: '▲ 12%',      tone: 'pos',  sparkline: [2.8, 3.1, 3.7, 4.2] },
  { label: 'CA Retail Margin',   value: '−2.8pp',     delta: 'critical',   tone: 'neg',  sparkline: [0, -0.8, -1.6, -2.8] },
  { label: 'Close Day',          value: 'Day 4 / 5',  delta: '2 blockers', tone: 'warn', sparkline: [1, 2, 3, 4] },
];

// -------- WATCHLIST --------
export const WATCHLIST = [
  { entity: 'Acme Corp',   kind: 'Customer', metric: 'ARR at risk',         value: '$800K',  tone: 'neg'  as const },
  { entity: 'Voltair',     kind: 'Customer', metric: 'Renewal probability', value: '28%',    tone: 'neg'  as const },
  { entity: 'CA Retail',   kind: 'Region',   metric: 'Margin Δ',             value: '-2.8pp', tone: 'neg'  as const },
  { entity: 'FX USD/EUR',  kind: 'Macro',    metric: '7-day move',           value: '+1.4%',  tone: 'warn' as const },
  { entity: 'Cloud ratio', kind: 'KPI',      metric: 'of revenue',           value: '22%',    tone: 'warn' as const },
];

// -------- INSIGHTS --------
export const INSIGHTS = [
  { ico: 'neg'  as const, title: 'Global Revenue: −$3.2M', when: 'just now', text: 'vs Plan · primary driver Labor' },
  { ico: 'warn' as const, title: '5 exceptions flagged',   when: '2m ago',   text: '3 critical · 2 warning · 2 positive' },
  { ico: 'info' as const, title: '5 ML signals active',    when: '5m ago',   text: 'California Retail labor costs surging post minimum-wage hike — LA and SF markets trending 12% above budget.' },
];

// -------- PERFORMANCE — Analysis tab content --------
export const PERF_KPIS: Kpi[] = [
  { lbl: 'Net Revenue Retention', val: '108%',  delta: '▼ 7pp vs prior Q',   tone: 'neg' },
  { lbl: 'New ARR',               val: '$4.2M', delta: '▲ 12% vs plan',       tone: 'pos' },
  { lbl: 'Gross Margin',          val: '78.4%', delta: '▼ 1.2pp vs prior Q', tone: 'neg' },
  { lbl: 'Cash Conv Cycle',       val: '38 d',  delta: '▼ 3d vs plan',        tone: 'pos' },
];

export const PERF_COMMENTARY: CommentaryItem[] = [
  {
    rank: 1, name: 'Enterprise', delta: '-$2.1M vs Plan',
    text: '3 logo churns in Q1 — Acme Corp ($800K), GlobalTech ($750K), DataStar ($550K). NRR declined from 115% to 108%. Renewal pipeline shows 2 additional at-risk accounts.',
    tags: [{ t: 'red', l: 'Churn spike' }, { t: 'red', l: 'NRR decline' }, { t: 'blue', l: 'Predictive flag' }],
  },
  {
    rank: 2, name: 'Mid-Market', delta: '+$0.5M vs Plan',
    text: 'Strong new logo acquisition — 12 new accounts vs 8 planned. Average deal size $42K, up 15% from prior quarter.',
    tags: [{ t: 'green', l: 'New logos' }, { t: 'green', l: 'Deal size ↑' }],
  },
  {
    rank: 3, name: 'SMB', delta: '-$0.4M vs Plan',
    text: 'Self-serve signups flat. Free-to-paid conversion dropped to 3.2% from 4.1%.',
    tags: [{ t: 'amber', l: 'Conversion drop' }, { t: 'blue', l: 'Pricing test' }],
  },
];

export const PERF_CHART: ChartBar[] = [
  { w: 'W6',   a: 58, p: 62, tone: 'blue' },
  { w: 'W7',   a: 56, p: 62, tone: 'blue' },
  { w: 'W8',   a: 52, p: 62, tone: 'blue' },
  { w: 'W9',   a: 46, p: 62, tone: 'warn' },
  { w: 'W10',  a: 42, p: 62, tone: 'neg' },
  { w: 'W11▸', a: 39, p: 62, tone: 'neg', forecast: true },
];

// -------- PERFORMANCE — Drill tab (segment breakdown) --------
export const PERF_DRILL_SEGMENTS: DrillSegment[] = [
  { id: 'caretail',  name: 'California Retail',     region: 'West',      variance: '−$1.2M', varTone: 'neg',  spark: [58, 54, 50, 46, 42], util: '92%', utilTone: 'neg',  trips: '$4.8M', tripsVsPlan: '−12.1%', aiQ: 'Tell me more about California Retail' },
  { id: 'txenergy',  name: 'Texas Energy',          region: 'Southwest', variance: '−$0.8M', varTone: 'neg',  spark: [64, 62, 58, 52, 48], util: '78%', utilTone: 'warn', trips: '$3.2M', tripsVsPlan: '−8.6%',  aiQ: 'Explain the Texas Energy situation' },
  { id: 'nyfinance', name: 'New York Financial Svcs', region: 'Northeast', variance: '+$0.7M', varTone: 'pos',  spark: [52, 54, 56, 58, 60], util: '71%', utilTone: 'pos',  trips: '$8.1M', tripsVsPlan: '+4.8%',  aiQ: 'What is driving NY Financial Services outperformance?' },
  { id: 'fltourism', name: 'Florida Tourism',       region: 'Southeast', variance: '−$0.4M', varTone: 'neg',  spark: [62, 61, 62, 59, 54], util: '68%', utilTone: 'blue', trips: '$2.9M', tripsVsPlan: '−7.2%',  aiQ: 'What caused the Florida Tourism miss?' },
  { id: 'ilmfg',     name: 'Illinois Manufacturing', region: 'Midwest',  variance: '−$0.5M', varTone: 'neg',  spark: [61, 60, 57, 53, 50], util: '94%', utilTone: 'neg',  trips: '$5.4M', tripsVsPlan: '−6.8%',  aiQ: 'How serious is the Illinois Manufacturing bottleneck?' },
  { id: 'watech',    name: 'Washington Tech',       region: 'West',      variance: '−$0.6M', varTone: 'neg',  spark: [58, 57, 55, 52, 49], util: '65%', utilTone: 'warn', trips: '$6.2M', tripsVsPlan: '−5.4%',  aiQ: 'What is happening with Washington Tech?' },
];

// -------- PERFORMANCE — FluxPlus regions --------
// Six US regions. The "national" key rolls the others up; the rest map 1:1
// to a single DrillSegment (so drill-down filters down to that segment).
//
// Each region carries its own 4-KPI strip, 3 commentary items, 6-week
// chart (last bar forecast), AI narrative, and suggested chat prompts.
// The week label is shared across all regions — W10 · Mar 3–9 2026.

export const FLUX_REGIONS: Record<RegionKey, RegionData> = {
  national: {
    key: 'national', label: 'National', week: 'W10 · Mar 3–9',
    revenue: '$30.5M', orders: '−$3.2M vs plan',
    signal:
      'California Retail labor surge + Texas natural-gas swing are driving −$3.2M. Northeast advisory pipeline partially offsetting.',
    aiIntro:
      'Rolled across all six US regions this week: revenue $30.5M, variance −$3.2M vs plan. The top two drags are California Retail labor (−$1.2M) and Texas Energy commodity exposure (−$0.8M). New York Financial Services is the offsetter (+$0.7M). Model confidence on the weekly run: 88%.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$30.5M', delta: '▼ $3.2M vs plan',  tone: 'neg'  },
      { lbl: 'Orders',         val: '4.82k',  delta: '▼ 6.4% vs plan',   tone: 'neg'  },
      { lbl: 'Gross Margin',   val: '78.4%',  delta: '▼ 1.2pp vs prior', tone: 'neg'  },
      { lbl: 'NRR',            val: '108%',   delta: '▼ 7pp vs prior Q', tone: 'neg'  },
    ],
    commentary: [
      { rank: 1, name: 'California Retail', delta: '−$1.2M vs Plan',
        text: 'Min-wage hike pushed overtime 18% above plan in LA/SF. Margin down 340bps, 3rd week of escalation.',
        tags: [{ t: 'red', l: 'Labor' }, { t: 'red', l: '3 weeks' }, { t: 'blue', l: 'ML flag' }] },
      { rank: 2, name: 'Texas Energy', delta: '−$0.8M vs Plan',
        text: 'Henry Hub spot −18% WoW. Hedge covers 60% — unhedged 40% fully exposed. Forward curve suggests W12 stabilization.',
        tags: [{ t: 'amber', l: 'Commodity' }, { t: 'amber', l: 'Unhedged' }] },
      { rank: 3, name: 'New York Financial Svcs', delta: '+$0.7M vs Plan',
        text: 'Equity desk +22% vs plan on elevated VIX. Advisory pipeline converting 3 weeks ahead of schedule.',
        tags: [{ t: 'green', l: 'Positive' }, { t: 'green', l: 'Q1 momentum' }] },
    ],
    chart: [
      { w: 'W6',   a: 34, p: 33, tone: 'pos' },
      { w: 'W7',   a: 33, p: 33, tone: 'blue' },
      { w: 'W8',   a: 32, p: 33, tone: 'warn' },
      { w: 'W9',   a: 31, p: 33, tone: 'warn' },
      { w: 'W10',  a: 30.5, p: 33.7, tone: 'neg' },
      { w: 'W11▸', a: 31, p: 34, tone: 'neg', forecast: true },
    ],
    segments: ['caretail', 'txenergy', 'nyfinance', 'fltourism', 'ilmfg', 'watech'],
    suggestions: [
      'What are the top three drivers this week?',
      "Which region is off plan the most?",
      'Summarize signals by confidence',
      "How bad is California Retail really?",
      "Show me what Forecast looks like for W11",
    ],
  },
  northeast: {
    key: 'northeast', label: 'Northeast', week: 'W10 · Mar 3–9',
    revenue: '$8.1M', orders: '+$0.7M vs plan',
    signal:
      'Only region beating plan this week. Equity desk and advisory pipeline driving the beat — structurally durable.',
    aiIntro:
      'Northeast is carrying the team this week. New York Financial Services revenue $8.1M, +$0.7M vs plan. Equity trading desk +22% on elevated VIX; advisory pipeline pulling forward by three weeks. Infrastructure upgrade giving a structural +15bps capture improvement that should persist through Q2.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$8.1M',  delta: '▲ $0.7M vs plan',  tone: 'pos' },
      { lbl: 'Orders',         val: '1.12k',  delta: '▲ 4.8% vs plan',   tone: 'pos' },
      { lbl: 'Capture Rate',   val: '62bps',  delta: '▲ 15bps QoQ',      tone: 'pos' },
      { lbl: 'Pipeline Conv.', val: '71%',    delta: '▲ 3w pull-fwd',    tone: 'pos' },
    ],
    commentary: [
      { rank: 1, name: 'Equity Trading Desk', delta: '+$0.4M vs Plan',
        text: 'VIX elevated above 22 for third consecutive week. Trading desk +22% vs plan. Infrastructure upgrade providing structural lift even if vol normalizes.',
        tags: [{ t: 'green', l: 'Trading beat' }, { t: 'blue', l: 'Structural' }] },
      { rank: 2, name: 'Advisory Pipeline', delta: '+$0.2M vs Plan',
        text: 'Pipeline converting 3 weeks ahead of schedule. $2.4M in W11–W13 committed closings. Win rate improving on larger deal sizes.',
        tags: [{ t: 'green', l: 'Pipeline pull-fwd' }] },
      { rank: 3, name: 'Wealth Management', delta: '+$0.1M vs Plan',
        text: 'AUM fees tracking in-line. Net new money $340M, 2x prior quarter pace. Advisor attrition at 3-year low.',
        tags: [{ t: 'green', l: 'AUM growth' }] },
    ],
    chart: [
      { w: 'W6',   a: 7.6, p: 7.5, tone: 'pos' },
      { w: 'W7',   a: 7.8, p: 7.6, tone: 'pos' },
      { w: 'W8',   a: 7.9, p: 7.7, tone: 'pos' },
      { w: 'W9',   a: 8.0, p: 7.4, tone: 'pos' },
      { w: 'W10',  a: 8.1, p: 7.4, tone: 'pos' },
      { w: 'W11▸', a: 8.3, p: 7.6, tone: 'pos', forecast: true },
    ],
    segments: ['nyfinance'],
    suggestions: [
      'Can we sustain the NY trading outperformance?',
      "What's in the advisory pipeline for W11–W13?",
      'Break down wealth management AUM by cohort',
      "How does this compare to Q1 2024?",
      'What structural vs cyclical in the NE beat?',
    ],
  },
  southeast: {
    key: 'southeast', label: 'Southeast', week: 'W10 · Mar 3–9',
    revenue: '$2.9M', orders: '−$0.4M vs plan',
    signal:
      'Florida Tourism miss is a calendar shift — spring break moved to W11. Advance bookings +18%. Self-recovering.',
    aiIntro:
      'Southeast miss is timing, not demand. Spring break peak moved from W10 to W11 this year — hotel occupancy 71% vs 84% planned for W10, but W11 advance bookings are already tracking +18% above W10. Four of five historical spring-break calendar shifts showed full recovery in the following week.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$2.9M', delta: '▼ $0.4M vs plan',  tone: 'neg'  },
      { lbl: 'Occupancy',      val: '71%',   delta: '▼ 13pp vs plan',   tone: 'neg'  },
      { lbl: 'W11 Bookings',   val: '+18%',  delta: '▲ vs W10',         tone: 'pos'  },
      { lbl: 'ADR',            val: '$218',  delta: '▲ 4% vs plan',     tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Florida Tourism', delta: '−$0.4M vs Plan',
        text: 'Spring break peak moved from W10 to W11. Hotel occupancy 71% vs 84% plan. W11 bookings tracking +18% above W10.',
        tags: [{ t: 'amber', l: 'Calendar shift' }, { t: 'blue', l: 'Auto-recovering' }] },
      { rank: 2, name: 'Hotel ADR', delta: '+$0.08M vs Plan',
        text: 'Average daily rate $218 vs $210 planned. Pricing discipline holding despite soft occupancy — room for upside as W11 demand materializes.',
        tags: [{ t: 'green', l: 'ADR strength' }] },
      { rank: 3, name: 'Cruise Partnerships', delta: 'Flat',
        text: 'Miami and Fort Lauderdale embarkations in-line. Pre-cruise hotel nights flat, no spring-break shift impact.',
        tags: [{ t: 'blue', l: 'On plan' }] },
    ],
    chart: [
      { w: 'W6',   a: 3.1, p: 3.1, tone: 'blue' },
      { w: 'W7',   a: 3.2, p: 3.1, tone: 'pos' },
      { w: 'W8',   a: 3.1, p: 3.1, tone: 'blue' },
      { w: 'W9',   a: 3.0, p: 3.2, tone: 'warn' },
      { w: 'W10',  a: 2.9, p: 3.3, tone: 'neg' },
      { w: 'W11▸', a: 3.6, p: 3.1, tone: 'pos', forecast: true },
    ],
    segments: ['fltourism'],
    suggestions: [
      'What caused the Florida Tourism miss?',
      'Should we take action on Florida tourism timing?',
      'Compare W11 bookings to last year spring break',
      "What's the ADR holding up despite soft occupancy?",
      'Is the Florida miss auto-recovering?',
    ],
  },
  midwest: {
    key: 'midwest', label: 'Midwest', week: 'W10 · Mar 3–9',
    revenue: '$5.4M', orders: '−$0.5M vs plan',
    signal:
      'Illinois Manufacturing capacity-constrained — Chicago hub at 94%. Rail car allocation from UP confirmed for W11.',
    aiIntro:
      'Midwest is supply-constrained, not demand-weak. Chicago hub at 94% capacity against our 90% stress threshold. Union Pacific confirmed a +15% rail car allocation starting W11. If delivery holds on historical UP accuracy (79%), the hub returns to 85% capacity by W12 and this variance unwinds.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$5.4M', delta: '▼ $0.5M vs plan',  tone: 'neg'  },
      { lbl: 'Hub Utilization',val: '94%',   delta: '▲ 4pp over threshold', tone: 'neg' },
      { lbl: 'Fulfill Days',   val: '8.2d',  delta: '▼ vs 5.5 target',  tone: 'neg'  },
      { lbl: 'Rail Allocation',val: '+15%',  delta: '▲ W11 confirmed',  tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Illinois Manufacturing', delta: '−$0.5M vs Plan',
        text: 'Chicago hub at 94% capacity, above 90% stress threshold. Union Pacific rail car shortage. Fulfillment cycle 8.2 days vs 5.5 target.',
        tags: [{ t: 'amber', l: 'Watch' }, { t: 'amber', l: 'Rail shortage' }] },
      { rank: 2, name: 'Detroit Automotive', delta: 'Flat',
        text: 'OEM schedules stable. Tier-1 supplier orders tracking plan. No material variance this week.',
        tags: [{ t: 'blue', l: 'On plan' }] },
      { rank: 3, name: 'Ohio Distribution', delta: '+$0.05M vs Plan',
        text: 'Columbus hub running smooth at 81% utilization. Could absorb 6–8% of Chicago overflow if routing is reshaped.',
        tags: [{ t: 'green', l: 'Capacity headroom' }] },
    ],
    chart: [
      { w: 'W6',   a: 5.8, p: 5.8, tone: 'blue' },
      { w: 'W7',   a: 5.8, p: 5.8, tone: 'blue' },
      { w: 'W8',   a: 5.7, p: 5.8, tone: 'warn' },
      { w: 'W9',   a: 5.6, p: 5.9, tone: 'warn' },
      { w: 'W10',  a: 5.4, p: 5.9, tone: 'neg' },
      { w: 'W11▸', a: 5.7, p: 5.9, tone: 'warn', forecast: true },
    ],
    segments: ['ilmfg'],
    suggestions: [
      'How serious is the Illinois Manufacturing bottleneck?',
      'Can we re-route through Ohio Distribution?',
      "What's Union Pacific's track record on committed allocations?",
      'Model the W12 recovery scenario',
      'Should we flag this on the board call?',
    ],
  },
  west: {
    key: 'west', label: 'West', week: 'W10 · Mar 3–9',
    revenue: '$11.0M', orders: '−$1.8M vs plan',
    signal:
      'California Retail labor surge is this week\'s critical issue. Accelerating automation from W14 to W11 saves $0.4M/wk.',
    aiIntro:
      'West region is the biggest drag — California Retail labor (−$1.2M) plus Washington Tech AI training spend (−$0.6M). The lever is automation acceleration: self-checkout rolled to 38 of 120 target stores; pulling the rollout from W14 to W11 saves an estimated $0.4M/week and recovers ~2.3pp margin by W13. Confidence on that play: 92%.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$11.0M', delta: '▼ $1.8M vs plan',  tone: 'neg'  },
      { lbl: 'OT Hours',       val: '+18%',   delta: '▲ vs plan',        tone: 'neg'  },
      { lbl: 'Store Margin',   val: '−340bps',delta: '▼ 3 wks running',  tone: 'neg'  },
      { lbl: 'Automation',     val: '38/120', delta: '▲ W14 → W11 saves $0.4M/wk', tone: 'warn' },
    ],
    commentary: [
      { rank: 1, name: 'California Retail', delta: '−$1.2M vs Plan',
        text: 'Min-wage hike driving OT 18% above plan in LA/SF. Store-level margin compressed 340bps. 3rd consecutive week of escalation.',
        tags: [{ t: 'red', l: 'Critical' }, { t: 'red', l: 'Labor' }, { t: 'blue', l: 'ML flag' }] },
      { rank: 2, name: 'Washington Tech', delta: '−$0.6M vs Plan',
        text: 'AI workload training costs +28% MoM, compute utilization only 65%. FinOps reservation strategy in progress — $180K/mo recoverable.',
        tags: [{ t: 'amber', l: 'Cloud' }, { t: 'green', l: 'Savings plan' }] },
      { rank: 3, name: 'Oregon Clean Energy', delta: '+$0.2M vs Plan',
        text: 'IRA subsidy tranche released W9. Solar installation revenue accelerating — Q2 pipeline $1.8M may pull forward 4–6 weeks.',
        tags: [{ t: 'green', l: 'Subsidy release' }, { t: 'green', l: 'Growing' }] },
    ],
    chart: [
      { w: 'W6',   a: 12.5, p: 12.6, tone: 'blue' },
      { w: 'W7',   a: 12.3, p: 12.6, tone: 'warn' },
      { w: 'W8',   a: 11.9, p: 12.7, tone: 'neg' },
      { w: 'W9',   a: 11.4, p: 12.7, tone: 'neg' },
      { w: 'W10',  a: 11.0, p: 12.8, tone: 'neg' },
      { w: 'W11▸', a: 11.4, p: 12.8, tone: 'warn', forecast: true },
    ],
    segments: ['caretail', 'watech'],
    suggestions: [
      "What's happening with California Retail labor costs?",
      'Model +120 FTE impact on CA margin',
      "What's driving Washington Tech cloud costs?",
      'Can Oregon subsidy pull-forward offset CA drag?',
      'Compare to NY Q1 2024 wage event',
    ],
  },
  southwest: {
    key: 'southwest', label: 'Southwest', week: 'W10 · Mar 3–9',
    revenue: '$3.2M', orders: '−$0.8M vs plan',
    signal:
      'Texas natural-gas spot price down 18% WoW. Unhedged 40% fully exposed. W12 forward curve suggests stabilization at $2.80/MMBtu.',
    aiIntro:
      'Southwest variance is commodity-driven. Henry Hub spot down 18% WoW to $2.62/MMBtu. Our hedge covers 60% of exposure; the unhedged 40% is taking the full hit. Forward curve projects stabilization at $2.80 by W12. Historical accuracy on similar storage-build scenarios: 74%. Recommend increasing hedge ratio before W11 close.',
    kpis: [
      { lbl: 'Revenue (Wk)',   val: '$3.2M', delta: '▼ $0.8M vs plan',  tone: 'neg'  },
      { lbl: 'Henry Hub Spot', val: '$2.62', delta: '▼ 18% WoW',        tone: 'neg'  },
      { lbl: 'Hedge Cover',    val: '60%',   delta: '▲ raise to 75%',   tone: 'warn' },
      { lbl: 'W12 Forward',    val: '$2.80', delta: '▲ stabilization',  tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Texas Energy', delta: '−$0.8M vs Plan',
        text: 'Henry Hub spot price down 18% WoW. Hedge covers 60% — unhedged 40% fully exposed. Forward curve suggests W12 stabilization.',
        tags: [{ t: 'amber', l: 'Commodity' }, { t: 'amber', l: 'Unhedged' }] },
      { rank: 2, name: 'Arizona Solar', delta: '+$0.05M vs Plan',
        text: 'Utility-scale installations on track. Phoenix + Tucson commercial projects ahead of schedule by 6 days.',
        tags: [{ t: 'green', l: 'Execution' }] },
      { rank: 3, name: 'New Mexico Logistics', delta: 'Flat',
        text: 'Albuquerque distribution in-line. No material variance this week.',
        tags: [{ t: 'blue', l: 'On plan' }] },
    ],
    chart: [
      { w: 'W6',   a: 4.0, p: 4.0, tone: 'blue' },
      { w: 'W7',   a: 3.9, p: 4.0, tone: 'warn' },
      { w: 'W8',   a: 3.7, p: 4.0, tone: 'warn' },
      { w: 'W9',   a: 3.5, p: 4.0, tone: 'neg' },
      { w: 'W10',  a: 3.2, p: 4.0, tone: 'neg' },
      { w: 'W11▸', a: 3.5, p: 4.0, tone: 'warn', forecast: true },
    ],
    segments: ['txenergy'],
    suggestions: [
      'Explain the Texas natural gas price impact',
      'Should we raise the hedge ratio to 75%?',
      'Model the W12 stabilization scenario',
      "What's the Arizona Solar pipeline look like?",
      'Historical accuracy on Henry Hub forward curves?',
    ],
  },
};

// -------- PERFORMANCE — FluxPlus comparisons --------
// Five comparison modes. The default is 'plan' (vs Plan). Each mode rewrites
// the headline variance figure and the narrative. segmentOverrides allow
// Drill-Down to swap the variance per segment when the comparison changes.

export const FLUX_COMPARISONS: Record<ComparisonKey, ComparisonData> = {
  plan: {
    key: 'plan', label: 'vs Plan', short: 'Plan',
    description: 'Actuals vs budget (locked at FY start, revised Feb 1)',
    totalVariance: '−$3.2M', totalVarianceTone: 'neg',
    signal:
      'Plan variance driven by West and Southwest. Northeast is the only region beating plan this week.',
    pillTone: 'neg',
  },
  prior: {
    key: 'prior', label: 'vs Prior Week', short: 'Prior Wk',
    description: 'Week-over-week change · W10 (Mar 3–9) vs W9 (Feb 24–Mar 2)',
    totalVariance: '−$1.2M', totalVarianceTone: 'neg',
    signal:
      'Most regions improved sequentially, but California Retail worsened for the 3rd straight week. WoW trend tightening except CA.',
    pillTone: 'warn',
    segmentOverrides: {
      caretail:  { variance: '−$0.4M', varTone: 'neg' },
      txenergy:  { variance: '−$0.3M', varTone: 'neg' },
      nyfinance: { variance: '+$0.1M', varTone: 'pos' },
      fltourism: { variance: '−$0.1M', varTone: 'neg' },
      ilmfg:     { variance: '−$0.2M', varTone: 'neg' },
      watech:    { variance: '−$0.3M', varTone: 'neg' },
    },
  },
  yoy: {
    key: 'yoy', label: 'vs Prior Year', short: 'YoY',
    description: 'Year-over-year change · W10 FY26 vs W10 FY25',
    totalVariance: '+$4.8M', totalVarianceTone: 'pos',
    signal:
      'Strong YoY growth despite plan miss. 6 of 6 regions positive YoY; FY25 comparison benefits from lapping a soft quarter.',
    pillTone: 'pos',
    segmentOverrides: {
      caretail:  { variance: '+$0.2M', varTone: 'pos' },
      txenergy:  { variance: '+$0.4M', varTone: 'pos' },
      nyfinance: { variance: '+$1.6M', varTone: 'pos' },
      fltourism: { variance: '+$0.3M', varTone: 'pos' },
      ilmfg:     { variance: '+$0.9M', varTone: 'pos' },
      watech:    { variance: '+$1.4M', varTone: 'pos' },
    },
  },
  forecast: {
    key: 'forecast', label: 'vs Forecast', short: 'Forecast',
    description: 'Actuals vs rolling forecast · Forecast locked end of W9',
    totalVariance: '−$0.4M', totalVarianceTone: 'warn',
    signal:
      'Forecast closer to reality than plan. CA Retail and TX Energy forecasts absorbed part of the plan gap, but CA still missed forecast.',
    pillTone: 'warn',
    segmentOverrides: {
      caretail:  { variance: '−$0.3M', varTone: 'neg' },
      txenergy:  { variance: '−$0.1M', varTone: 'warn' },
      nyfinance: { variance: '+$0.3M', varTone: 'pos' },
      fltourism: { variance: '+$0.0M', varTone: 'warn' },
      ilmfg:     { variance: '−$0.2M', varTone: 'neg' },
      watech:    { variance: '−$0.1M', varTone: 'warn' },
    },
  },
  runrate: {
    key: 'runrate', label: 'vs Run Rate', short: 'Run Rate',
    description: 'Actuals vs rolling 13-week run rate (weeks W44 FY25 – W9 FY26)',
    totalVariance: '−$2.1M', totalVarianceTone: 'neg',
    signal:
      'Run rate drifts below plan because recent quarters softened. Gap to run rate tells you whether this week is truly an outlier.',
    pillTone: 'neg',
    segmentOverrides: {
      caretail:  { variance: '−$0.9M', varTone: 'neg' },
      txenergy:  { variance: '−$0.5M', varTone: 'neg' },
      nyfinance: { variance: '+$0.5M', varTone: 'pos' },
      fltourism: { variance: '−$0.2M', varTone: 'neg' },
      ilmfg:     { variance: '−$0.4M', varTone: 'neg' },
      watech:    { variance: '−$0.4M', varTone: 'neg' },
    },
  },
};

// -------- PERFORMANCE — Exceptions tab --------
export const PERF_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'ca-labor', severity: 'critical',
    name: 'California Retail — Labor Cost Surge',
    detail: 'Minimum wage hike driving overtime 18% above plan in LA/SF. Store-level margin compressed 340bps. 3rd consecutive week of escalation.',
    tags: [{ t: 'red', l: 'Critical' }, { t: 'red', l: '3 weeks' }],
    value: '−$1.2M', week: 'W8–W10',
    aiQ: 'Diagnose the California labor cost surge',
  },
  {
    id: 'tx-natgas', severity: 'warning',
    name: 'Texas Energy — Natural Gas Price Drop',
    detail: 'Henry Hub spot price down 18% WoW. Hedging covers 60% — unhedged 40% fully exposed. Forward curve suggests W12 stabilization.',
    tags: [{ t: 'amber', l: 'Warning' }, { t: 'amber', l: 'Commodity' }],
    value: '−$0.8M', week: 'W10',
    aiQ: 'Explain the Texas natural gas price impact',
  },
  {
    id: 'il-supply', severity: 'warning',
    name: 'Illinois Manufacturing — Supply Chain',
    detail: 'Chicago hub at 94% capacity, above 90% stress threshold. Rail car shortage from Union Pacific. Fulfillment cycle 8.2 days vs 5.5 target.',
    tags: [{ t: 'amber', l: 'Watch' }, { t: 'amber', l: 'Rail shortage' }],
    value: '−$0.5M', week: 'W9–W10',
    aiQ: 'How urgent is the Illinois supply chain issue?',
  },
  {
    id: 'fl-calendar', severity: 'warning',
    name: 'Florida Tourism — Spring Break Shift',
    detail: 'Spring break peak moved from W10 to W11 this year. Hotel occupancy 71% vs 84% plan. W11 bookings tracking +18% above W10.',
    tags: [{ t: 'amber', l: 'Calendar shift' }, { t: 'blue', l: 'Auto-recovering' }],
    value: '−$0.4M', week: 'W10',
    aiQ: 'Should we take action on Florida tourism timing?',
  },
  {
    id: 'ny-trading', severity: 'positive',
    name: 'New York Financial Svcs — Q1 Trading',
    detail: 'Equity desk +22% vs plan on elevated VIX. Advisory pipeline converting 3 weeks ahead of schedule. Infrastructure upgrades paying off.',
    tags: [{ t: 'green', l: 'Positive' }, { t: 'green', l: 'Q1 momentum' }],
    value: '+$0.7M', week: 'W10',
    aiQ: 'Can we sustain the NY trading outperformance?',
  },
  {
    id: 'or-subsidy', severity: 'positive',
    name: 'Oregon Clean Energy — Federal Subsidy',
    detail: 'IRA subsidy tranche released W9, recognized W10. Solar installation revenue accelerating. Q2 pipeline strong on incentive pull-forward.',
    tags: [{ t: 'green', l: 'Subsidy release' }, { t: 'green', l: 'Growing' }],
    value: '+$0.2M', week: 'W9–W10',
    aiQ: 'What does Oregon success mean for clean energy strategy?',
  },
];

// -------- PERFORMANCE — Signals tab --------
export const PERF_SIGNALS: SignalItem[] = [
  { name: 'California Retail Margin Erosion Risk W11', type: 'Labor',       typeTone: 'red',   confidence: 92, body: 'Overtime trajectory projects continued margin compression through W11. Self-checkout automation is the key lever — accelerating from W14 to W11 could save $0.4M/week. Model based on 12 comparable wage-event scenarios.' },
  { name: 'Texas Natural Gas Price Stabilization W12', type: 'Commodity',   typeTone: 'amber', confidence: 76, body: 'Henry Hub forward curve projects stabilization at $2.80/MMBtu by W12. Current spot at $2.62 — 7% below forward. Historical accuracy on similar storage-build scenarios: 74%. Hedge increase recommended.' },
  { name: 'NY Financial Svcs Q1 Close Strong',         type: 'Revenue',     typeTone: 'green', confidence: 94, body: 'Advisory pipeline has $2.4M in W11–W13 committed closings. Trading infrastructure upgrade providing structural 15bps capture improvement. VIX may moderate but structural gains persist.' },
  { name: 'Florida Tourism Spring Break Rebound W11',  type: 'Seasonal',    typeTone: 'blue',  confidence: 89, body: 'W11 advance bookings +18% above W10. Calendar shift is well-understood — 4 of 5 historical spring break timing shifts showed full revenue recovery in the following week. Confidence high.' },
  { name: 'Illinois Hub Rail Car Resolution W11',      type: 'Supply Chain', typeTone: 'blue', confidence: 81, body: 'Union Pacific confirmed +15% rail car allocation starting W11. If delivery holds, Chicago hub returns to 85% capacity by W12. Historical UP delivery accuracy on committed allocations: 79%.' },
  { name: 'Oregon Clean Energy Q2 Pipeline',           type: 'Growth',      typeTone: 'green', confidence: 73, body: 'IRA subsidy tranche ahead of schedule suggests Q2 pipeline of $1.8M could pull forward by 4–6 weeks. Customer demand 30% above pre-IRA baseline. Team expansion recommended to capture.' },
];

// -------- PERFORMANCE — History tab (rolling 12-week) --------
export const PERF_HISTORY: HistoryItem[] = [
  { week: 'W10', dates: 'Mar 3–9 2026',    variance: '−$3.8M', varTone: 'neg',  tags: [{ t: 'red',   l: 'Labor' }, { t: 'amber', l: 'Commodity' }], current: true },
  { week: 'W9',  dates: 'Feb 24–Mar 2',    variance: '−$2.6M', varTone: 'neg',  tags: [{ t: 'red',   l: 'Labor' }], aiQ: 'How does W9 compare to current week?' },
  { week: 'W8',  dates: 'Feb 17–23',       variance: '−$1.4M', varTone: 'neg',  tags: [{ t: 'amber', l: 'Wage hike start' }], aiQ: 'What was different about W8?' },
  { week: 'W7',  dates: 'Feb 10–16',       variance: '+$0.8M', varTone: 'pos',  tags: [{ t: 'green', l: 'On plan' }], aiQ: 'What drove the W7 outperformance?' },
  { week: 'W6',  dates: 'Feb 3–9',         variance: '+$1.5M', varTone: 'pos',  tags: [{ t: 'green', l: 'Super Bowl uplift' }] },
  { week: 'W5',  dates: 'Jan 27–Feb 2',    variance: '−$0.3M', varTone: 'warn', tags: [{ t: 'amber', l: 'Minor miss' }] },
  { week: 'W4',  dates: 'Jan 20–26',       variance: '+$1.8M', varTone: 'pos',  tags: [{ t: 'green', l: 'Deal closures' }], aiQ: 'What was the W4 deal closure success?' },
  { week: 'W3',  dates: 'Jan 13–19',       variance: '+$0.7M', varTone: 'pos',  tags: [{ t: 'green', l: 'On plan' }] },
  { week: 'W2',  dates: 'Jan 6–12',        variance: '−$0.9M', varTone: 'neg',  tags: [{ t: 'amber', l: 'Post-holiday' }] },
  { week: 'W1',  dates: 'Dec 30–Jan 5',    variance: '+$3.2M', varTone: 'pos',  tags: [{ t: 'green', l: 'New Year surge' }] },
  { week: 'W52', dates: 'Dec 23–29 2025',  variance: '+$4.8M', varTone: 'pos',  tags: [{ t: 'green', l: 'Christmas peak' }] },
  { week: 'W51', dates: 'Dec 16–22 2025',  variance: '+$1.6M', varTone: 'pos',  tags: [{ t: 'green', l: 'Pre-holiday' }] },
];

// -------- MARGIN — KPIs --------
export const MARGIN_KPIS: Kpi[] = [
  { lbl: 'Gross Margin',    val: '78.4%', delta: '▼ 1.2pp vs prior Q', tone: 'neg' },
  { lbl: 'Contribution',    val: '$32.1M', delta: '▼ $2.4M vs plan',   tone: 'neg' },
  { lbl: 'Op Margin',       val: '22.8%', delta: '▼ 0.6pp vs plan',    tone: 'neg' },
  { lbl: 'EBITDA Margin',   val: '31.2%', delta: '▲ 0.4pp QoQ',        tone: 'pos' },
];

// -------- MARGIN — Waterfall bridge (prior GM% to current GM%) --------
export const MARGIN_WATERFALL: WaterfallStep[] = [
  { label: 'Prior GM%',       value: 79.6, kind: 'start' },
  { label: 'Volume Mix',      value: +0.4, kind: 'pos' },
  { label: 'Pricing',         value: +0.6, kind: 'pos' },
  { label: 'Labor OT',        value: -1.4, kind: 'neg' },
  { label: 'Commodities',     value: -0.6, kind: 'neg' },
  { label: 'Cloud Egress',    value: -0.3, kind: 'neg' },
  { label: 'Automation',      value: +0.1, kind: 'pos' },
  { label: 'Current GM%',     value: 78.4, kind: 'end' },
];

// -------- MARGIN — Product Mix --------
export const MARGIN_PRODUCT_MIX: ProductMixItem[] = [
  { name: 'SaaS Platform',       revShare: '42%', revShareNum: 42, margin: '82.4%', marginTone: 'pos',  marginDelta: '+0.8pp vs plan', deltaTone: 'pos',  aiQ: 'What is driving SaaS Platform margin strength?' },
  { name: 'Managed Services',    revShare: '24%', revShareNum: 24, margin: '64.1%', marginTone: 'warn', marginDelta: '−1.1pp vs plan', deltaTone: 'neg',  aiQ: 'Why is Managed Services margin weak?' },
  { name: 'Professional Svcs',   revShare: '18%', revShareNum: 18, margin: '48.7%', marginTone: 'neg',  marginDelta: '−2.3pp vs plan', deltaTone: 'neg',  aiQ: 'Diagnose Professional Services margin drop' },
  { name: 'Hardware & Devices',  revShare: '10%', revShareNum: 10, margin: '29.2%', marginTone: 'neg',  marginDelta: '−3.4pp vs plan', deltaTone: 'neg',  aiQ: 'What happened to Hardware margin?' },
  { name: 'Marketplace Fees',    revShare: '6%',  revShareNum: 6,  margin: '91.5%', marginTone: 'pos',  marginDelta: '+0.2pp vs plan', deltaTone: 'pos',  aiQ: 'Can Marketplace fees scale further?' },
];

// -------- MARGIN — Cost Drivers --------
export const MARGIN_COST_DRIVERS: CostDriver[] = [
  { name: 'California Retail Labor Surge', category: 'Labor', categoryTone: 'red',  impact: '−140 bps', impactTone: 'neg',
    body: 'Minimum wage hike pushing OT 18% above plan. 3rd week of margin compression.',
    trend: [80, 79, 78, 76, 74, 72] },
  { name: 'Natural Gas Spot Price Drop',   category: 'Commodity', categoryTone: 'amber', impact: '−60 bps',  impactTone: 'neg',
    body: 'Henry Hub −18% WoW. Hedge covers 60% — unhedged 40% exposed.',
    trend: [82, 81, 80, 79, 79, 78] },
  { name: 'AWS Egress Fees',               category: 'Cloud',  categoryTone: 'blue', impact: '−30 bps',  impactTone: 'neg',
    body: 'AI workload training traffic driving egress up 28% MoM. FinOps reservation in progress.',
    trend: [82, 82, 81, 81, 80, 78] },
  { name: 'Automation Rollout',            category: 'Productivity', categoryTone: 'green', impact: '+10 bps', impactTone: 'pos',
    body: 'Self-checkout deployed in 38 of 120 target stores. Accelerating saves $0.4M/wk.',
    trend: [78, 78, 78, 78, 78, 78] },
  { name: 'Volume Mix Shift',              category: 'Mix',    categoryTone: 'green', impact: '+40 bps', impactTone: 'pos',
    body: 'Enterprise SaaS revenue +$0.9M; HW revenue −$0.4M. Mix favorable.',
    trend: [77, 78, 78, 79, 79, 78] },
];

// -------- MARGIN — Sensitivity scenarios --------
export const MARGIN_SENSITIVITY: SensitivityScenario[] = [
  { name: 'Wage Hike +5%',       driver: 'Labor',     marginImpact: '−0.9pp', marginTone: 'neg', arrImpact: '−$2.1M', arrTone: 'neg', probability: 68 },
  { name: 'Natural Gas +10%',    driver: 'Commodity', marginImpact: '−0.3pp', marginTone: 'neg', arrImpact: '−$0.7M', arrTone: 'neg', probability: 54 },
  { name: 'Automation at 100%',  driver: 'Productivity', marginImpact: '+1.4pp', marginTone: 'pos', arrImpact: '+$3.3M', arrTone: 'pos', probability: 42 },
  { name: 'FX EUR −5%',          driver: 'Macro',     marginImpact: '−0.4pp', marginTone: 'neg', arrImpact: '−$0.9M', arrTone: 'neg', probability: 35 },
  { name: 'AWS Reservation Tier', driver: 'Cloud',    marginImpact: '+0.2pp', marginTone: 'pos', arrImpact: '+$0.5M', arrTone: 'pos', probability: 72 },
];

// -------- FLUX — KPIs --------
export const FLUX_KPIS: Kpi[] = [
  { lbl: 'Revenue',        val: '$142.4M', delta: '▼ $3.2M vs plan', tone: 'neg' },
  { lbl: 'Operating Inc.', val: '$32.4M',  delta: '▼ $1.8M vs plan', tone: 'neg' },
  { lbl: 'Free Cash Flow', val: '$21.1M',  delta: '▲ $2.4M vs plan', tone: 'pos' },
  { lbl: 'Working Capital', val: '$58.2M', delta: '▲ $6.1M QoQ',     tone: 'warn' },
];

// -------- FLUX — Income Statement rows --------
export const FLUX_IS_ROWS: FluxRow[] = [
  { id: 'rev-saas',   account: 'SaaS Revenue',        curr: '$59.8M', prior: '$54.2M', variance: '+$5.6M', variancePct: '+10.3%', varTone: 'pos',  material: true,  driver: 'Enterprise renewals closing ahead of schedule',   aiQ: 'What is driving the SaaS revenue beat?' },
  { id: 'rev-hw',     account: 'Hardware Revenue',    curr: '$14.2M', prior: '$18.1M', variance: '−$3.9M', variancePct: '−21.5%', varTone: 'neg',  material: true,  driver: 'Retail volume compression in CA markets',          aiQ: 'Why is Hardware revenue down?' },
  { id: 'rev-svc',    account: 'Professional Svcs',   curr: '$25.6M', prior: '$24.8M', variance: '+$0.8M', variancePct: '+3.2%',  varTone: 'pos',  material: false, driver: 'In-line with prior quarter',                       aiQ: 'How is Professional Services tracking?' },
  { id: 'cogs-hw',    account: 'Hardware COGS',       curr: '$10.1M', prior: '$12.9M', variance: '−$2.8M', variancePct: '−21.7%', varTone: 'pos',  material: true,  driver: 'Volume-linked COGS decline matches revenue drop',  aiQ: 'Validate the Hardware COGS drop' },
  { id: 'cogs-svc',   account: 'Services COGS',       curr: '$13.2M', prior: '$11.4M', variance: '+$1.8M', variancePct: '+15.8%', varTone: 'neg',  material: true,  driver: 'Labor OT in CA Retail and overtime contracts',     aiQ: 'Break down the Services COGS increase' },
  { id: 'opex-sm',    account: 'Sales & Marketing',   curr: '$22.8M', prior: '$21.5M', variance: '+$1.3M', variancePct: '+6.0%',  varTone: 'warn', material: true,  driver: 'Q1 campaign ramp + 3 new AE hires',                aiQ: 'Should we pace S&M spend differently?' },
  { id: 'opex-rd',    account: 'R&D',                 curr: '$16.4M', prior: '$16.0M', variance: '+$0.4M', variancePct: '+2.5%',  varTone: 'pos',  material: false, driver: 'Flat headcount; cloud costs modest uptick',        aiQ: 'R&D cloud cost drift?' },
  { id: 'opex-ga',    account: 'G&A',                 curr: '$8.6M',  prior: '$9.2M',  variance: '−$0.6M', variancePct: '−6.5%',  varTone: 'pos',  material: false, driver: 'Audit fee timing + vendor consolidation savings',  aiQ: 'What drove the G&A decline?' },
];

// -------- FLUX — Balance Sheet rows --------
export const FLUX_BS_ROWS: FluxRow[] = [
  { id: 'bs-cash',    account: 'Cash & Equivalents',  curr: '$182.4M', prior: '$164.8M', variance: '+$17.6M', variancePct: '+10.7%', varTone: 'pos', material: true,  driver: 'Operating inflows + reduced capex timing',         aiQ: 'Is cash build healthy?' },
  { id: 'bs-ar',      account: 'Accounts Receivable', curr: '$72.1M',  prior: '$62.8M',  variance: '+$9.3M',  variancePct: '+14.8%', varTone: 'warn', material: true, driver: 'DSO drift from 42 to 47 days — 2 large invoices',  aiQ: 'Drill into AR aging' },
  { id: 'bs-inv',     account: 'Inventory',           curr: '$41.2M',  prior: '$38.4M',  variance: '+$2.8M',  variancePct: '+7.3%',  varTone: 'warn', material: true, driver: 'Hardware build-ahead for Q2 launch',               aiQ: 'Is inventory build intentional?' },
  { id: 'bs-ap',      account: 'Accounts Payable',    curr: '$48.6M',  prior: '$52.1M',  variance: '−$3.5M',  variancePct: '−6.7%',  varTone: 'warn', material: true, driver: 'Faster payments to strategic vendors',             aiQ: 'Review AP payment pacing' },
  { id: 'bs-def',     account: 'Deferred Revenue',    curr: '$94.2M',  prior: '$88.6M',  variance: '+$5.6M',  variancePct: '+6.3%',  varTone: 'pos',  material: true, driver: 'Upfront multi-year SaaS bookings',                 aiQ: 'What is the DR runway?' },
  { id: 'bs-ltd',     account: 'Long-Term Debt',      curr: '$120.0M', prior: '$120.0M', variance: '$0',      variancePct: '0.0%',   varTone: 'pos',  material: false, driver: 'No change',                                        aiQ: 'Debt covenant status?' },
];

// -------- FLUX — Cash Flow Bridge rows --------
export const FLUX_CF_ROWS: FluxRow[] = [
  { id: 'cf-ni',      account: 'Net Income',               curr: '$24.8M',  prior: '$23.1M',  variance: '+$1.7M',  variancePct: '+7.4%',  varTone: 'pos',  material: true,  driver: 'Core earnings growth',                             aiQ: 'Walk through the NI drivers' },
  { id: 'cf-da',      account: '+ D&A',                    curr: '$6.4M',   prior: '$6.1M',   variance: '+$0.3M',  variancePct: '+4.9%',  varTone: 'pos',  material: false, driver: 'Capex seasoning on prior additions',               aiQ: 'D&A run-rate going forward?' },
  { id: 'cf-wc',      account: '± Working Capital',        curr: '−$6.1M',  prior: '−$2.8M',  variance: '−$3.3M',  variancePct: '−117.9%', varTone: 'neg',  material: true,  driver: 'AR build and AP acceleration',                     aiQ: 'How do we unwind the WC build?' },
  { id: 'cf-sbc',     account: '+ Stock-Based Comp',       curr: '$4.2M',   prior: '$3.8M',   variance: '+$0.4M',  variancePct: '+10.5%', varTone: 'warn', material: false, driver: 'New hire grants vesting',                          aiQ: 'SBC dilution outlook?' },
  { id: 'cf-cfo',     account: '= Cash from Operations',   curr: '$29.3M',  prior: '$30.2M',  variance: '−$0.9M',  variancePct: '−3.0%',  varTone: 'warn', material: true,  driver: 'WC drag offsets earnings growth',                  aiQ: 'Is CFO trend concerning?' },
  { id: 'cf-capex',   account: '− Capex',                  curr: '−$8.2M',  prior: '−$11.5M', variance: '+$3.3M',  variancePct: '+28.7%', varTone: 'pos',  material: true,  driver: 'Capex timing — Q2 weighted spend',                 aiQ: 'Confirm capex timing vs plan' },
  { id: 'cf-fcf',     account: '= Free Cash Flow',         curr: '$21.1M',  prior: '$18.7M',  variance: '+$2.4M',  variancePct: '+12.8%', varTone: 'pos',  material: true,  driver: 'Capex favorable offsets WC drag',                  aiQ: 'Reconfirm FCF guide' },
];

// -------- NOTEBOOK — Pinned + Saved replies --------
export const NOTEBOOK_ENTRIES: NotebookEntry[] = [
  {
    id: 'nb-1', kind: 'pinned',
    title: 'California Retail Labor Diagnosis',
    summary: 'Minimum-wage hike drove OT 18% above plan in LA/SF. 3 weeks of escalation. Accelerating automation from W14 to W11 could save $0.4M/week.',
    source: 'Performance · California Retail', date: 'Mar 9 2026',
    tags: [{ t: 'red', l: 'Labor' }, { t: 'blue', l: 'ML flag' }],
  },
  {
    id: 'nb-2', kind: 'pinned',
    title: 'Enterprise Churn Root Cause',
    summary: '3 logo churns (Acme $800K, GlobalTech $750K, DataStar $550K) cited pricing and product fit. NRR dropped 115% → 108%. 2 more accounts at risk before end of Q2.',
    source: 'Performance · Commentary', date: 'Mar 8 2026',
    tags: [{ t: 'red', l: 'Churn spike' }, { t: 'red', l: 'NRR decline' }],
  },
  {
    id: 'nb-3', kind: 'saved',
    title: 'Cloud Cost — FinOps Reservation Strategy',
    summary: 'Cloud spend ratio at 22% of revenue. AI workload storage +$280K, egress +$140K, compute under-utilization at 47%. Reservation strategy recovers $180K/mo.',
    source: 'Performance · Cloud', date: 'Mar 7 2026',
    tags: [{ t: 'amber', l: 'Cloud' }, { t: 'green', l: 'Savings plan' }],
  },
  {
    id: 'nb-4', kind: 'saved',
    title: 'AR Aging Walkthrough',
    summary: 'DSO drifted from 42 to 47 days. Two large invoices (Voltair $420K, Acme $380K) are 60+ days past due. Collections playbook engaged.',
    source: 'Flux · Balance Sheet', date: 'Mar 5 2026',
    tags: [{ t: 'amber', l: 'Working capital' }],
  },
  {
    id: 'nb-5', kind: 'saved',
    title: 'Q1 Board Deck — Variance Package',
    summary: 'Top three variance drivers: Enterprise churn (−$2.1M), CA labor (−$1.2M), Texas energy (−$0.8M). NY Financial Services partially offsetting (+$0.7M).',
    source: 'Performance · Analysis', date: 'Mar 2 2026',
    tags: [{ t: 'blue', l: 'Board prep' }, { t: 'amber', l: 'Q1' }],
  },
  {
    id: 'nb-6', kind: 'saved',
    title: 'Hardware COGS — Matched Decline',
    summary: 'Hardware COGS declined $2.8M (−21.7%) tracking closely with Hardware revenue decline of $3.9M (−21.5%). Ratio stable at ~71%.',
    source: 'Flux · Income Statement', date: 'Feb 28 2026',
    tags: [{ t: 'green', l: 'Consistent' }],
  },
];

// -------- CHAT RESPONSES --------
// Default suggestion list (used before a region is selected or as a fallback).
// Region-specific suggestions live on FLUX_REGIONS[region].suggestions.
export const SUGGESTIONS = [
  'What are the top three drivers this week?',
  "What's happening with California Retail labor costs?",
  'Explain the Texas natural gas price impact',
  'Can we sustain the NY trading outperformance?',
  'Which accounts are at risk for next quarter?',
];

export const CHAT_RESPONSES: ChatResponseDef[] = [
  {
    match: /enterprise|churn/i,
    text: '**3 logo churns are the driver.** Acme Corp ($800K ARR), GlobalTech ($750K), DataStar ($550K) — all cited pricing and product fit. Our renewal-risk model flags 2 more accounts ($1.1M combined) as high-risk before end of Q2. NRR dropped from 115% to 108%.',
    actions: [
      { kind: 'email',  label: 'Email VP Sales',     who: 'Sue Park · VP Sales',      body: 'Flagging 3 enterprise churns ($2.1M ARR) — need renewal strategy for 2 more at-risk accounts before end of Q2.' },
      { kind: 'slack',  label: 'Slack CS Lead',     who: 'Priya · CS Director',      body: 'Can we surface our churn findings at tomorrow\'s QBR? 5 accounts affected.' },
      { kind: 'whatif', label: 'Run Retention What-If', who: 'Forecast · +10% retention', body: 'Model: retention +10% → NRR back to 114%, ARR delta +$1.8M.' },
      { kind: 'pin',    label: 'Pin to Board Deck', who: 'Workspace · Q1 Board Prep', body: '3 churns + 2 at-risk accounts, NRR trend.' },
    ],
    followUps: ['Which accounts are at risk next?', 'Show NRR trend by cohort', 'What expansion is offsetting?'],
  },
  {
    match: /california|labor|west|staffing/i,
    text: '**California Retail is the epicenter.** LA and SF minimum-wage adjustments pushed overtime hours 18% above plan. Margin compression has accelerated for 3 consecutive weeks. ML model projects -2% to -4% additional margin erosion in W11 if staffing model is not adjusted before Thursday.',
    actions: [
      { kind: 'slack',  label: 'Slack West Region Ops', who: 'Carlos · West Ops Lead',   body: 'CA Retail labor surge — need to review shift scheduling before Thursday.' },
      { kind: 'email',  label: 'Email Staffing Model',  who: 'Kai · Workforce Planning',  body: 'Pull current CA Retail staffing model and overtime distribution for LA + SF.' },
      { kind: 'whatif', label: 'What-If: Add 120 FTEs', who: 'Forecast · +120 FTE',       body: 'Model: +120 FTE reduces OT 62%, margin recovery +2.3pp by W13.' },
      { kind: 'remind', label: 'Remind: Thursday Prep', who: 'Calendar · Thu 8am',        body: 'Review West Coast margin before earnings prep meeting.' },
    ],
    followUps: ['Compare to NY Q1 2024 wage event', 'Show Americas margin weekly trend', "What's the OT distribution by store?"],
  },
  {
    match: /top (three|3)|top drivers|drivers this week|top drag|which region|off plan the most/i,
    text: '**Three drivers explain −$3.2M this week.** (1) California Retail labor OT up 18% — $1.2M hit. (2) Texas Energy natural-gas spot down 18% WoW, unhedged 40% exposed — $0.8M. (3) Washington Tech AI workload cloud spend — $0.6M. Northeast is the only region beating plan (+$0.7M from equity trading + advisory pipeline).',
    actions: [
      { kind: 'pin',    label: 'Pin to Board Deck',  who: 'Workspace · Q1 Board Prep', body: 'Top 3 weekly drivers — CA Labor, TX Energy, WA Tech.' },
      { kind: 'share',  label: 'Share with Exec Team', who: 'Leadership chat',         body: 'W10 variance summary — 3 drivers accounting for 83% of miss.' },
      { kind: 'open',   label: 'Open Drill-Down',    who: 'Performance · segments',    body: 'See segment-level detail for the three drivers.' },
      { kind: 'whatif', label: 'What-If: Fix CA labor', who: 'Forecast · +120 FTE',     body: 'Model: +120 FTE reduces OT 62%, margin recovery +2.3pp by W13.' },
    ],
    followUps: ['How bad is California Retail really?', 'Should we raise the Texas hedge?', 'Can NE offset enough to save the week?'],
  },
  {
    match: /texas|natural gas|henry hub|hedge|commodity/i,
    text: '**Texas Energy is a commodity hit, not demand weakness.** Henry Hub spot −18% WoW to $2.62/MMBtu. Our hedge covers 60%; the unhedged 40% is fully exposed — $0.8M variance. Forward curve projects stabilization at $2.80 by W12 (74% historical accuracy on similar storage-build patterns). Raising hedge to 75% before W11 close locks in most of the recovery.',
    actions: [
      { kind: 'email',  label: 'Email Treasury',       who: 'Derek · Treasury',         body: 'Texas gas hedge — recommend raising from 60% to 75% before W11 close.' },
      { kind: 'whatif', label: 'What-If: Hedge at 75%', who: 'Forecast · 75% cover',   body: 'Model: 75% hedge at $2.80 forward locks in $0.5M of $0.8M variance.' },
      { kind: 'open',   label: 'Open Commodity Workbench', who: 'Workbench · Commodity', body: 'Review hedge book + forward curve detail.' },
      { kind: 'pin',    label: 'Pin Forward Curve',    who: 'Workspace · Commodity',     body: 'Henry Hub forward curve + hedge coverage snapshot.' },
    ],
    followUps: ['Historical accuracy on Henry Hub forwards?', "What's Arizona Solar pipeline look like?", 'Model the W12 stabilization'],
  },
  {
    match: /(new york|\bny\b|northeast|trading|advisory|equity desk)/i,
    text: '**NY Financial Services is the offsetter this week — +$0.7M vs plan.** Equity desk +22% on elevated VIX. Advisory pipeline converting 3 weeks ahead of schedule with $2.4M in W11–W13 committed closings. Infrastructure upgrade provides a structural +15bps capture improvement even if VIX normalizes. Wealth management AUM fees +2x prior pace on net new money.',
    actions: [
      { kind: 'email',  label: 'Email NE Region Head', who: 'Maria · NE Region',       body: 'Great Q1 — want to document what\'s working for playbook replication.' },
      { kind: 'share',  label: 'Share Wins with CEO',  who: 'Alex · CEO',              body: 'NE region +$0.7M this week. Trading + advisory + AUM all contributing.' },
      { kind: 'whatif', label: 'What-If: Replicate NE Ops', who: 'Forecast · ops roll-out', body: 'Model: rolling NE\'s trading infra + advisory playbook to West adds +$0.3M/quarter.' },
      { kind: 'pin',    label: 'Pin NE Trend',         who: 'Workspace · Region watch', body: 'NE weekly variance trend, structural vs cyclical breakdown.' },
    ],
    followUps: ['What structural vs cyclical in NE?', "What's in the advisory pipeline?", 'Compare to Q1 2024 NY event'],
  },
  {
    match: /florida|tourism|spring break|calendar|occupancy/i,
    text: '**Florida Tourism miss is a calendar shift, not demand weakness.** Spring break peak moved W10→W11 this year. Hotel occupancy 71% vs 84% planned for W10 — but W11 advance bookings are already tracking +18% above W10. ADR holding at $218 vs $210 planned (pricing discipline intact). Four of five historical spring-break calendar shifts showed full recovery the following week.',
    actions: [
      { kind: 'slack',  label: 'Slack SE Region Ops',  who: 'Ana · SE Region',        body: 'Florida spring break shift confirmed — W11 bookings +18%. No action needed, monitor recovery.' },
      { kind: 'pin',    label: 'Pin Auto-Recovery',    who: 'Workspace · Seasonal',   body: 'FL tourism auto-recovery tracker for W11.' },
      { kind: 'open',   label: 'Open Seasonal Workbench', who: 'Workbench · Seasonal', body: 'Review spring-break comparable events.' },
      { kind: 'remind', label: 'Remind: Check W11',    who: 'Calendar · Mar 17',      body: 'Verify Florida W11 bookings materialized as forecast.' },
    ],
    followUps: ['Compare to last year spring break', "Why is ADR holding?", 'Should we flag this on the call?'],
  },
  {
    match: /illinois|chicago|manufacturing|rail|union pacific|supply chain|hub capacity/i,
    text: '**Illinois Manufacturing is supply-constrained, not demand-weak.** Chicago hub at 94% capacity — above our 90% stress threshold. Fulfillment cycle stretched to 8.2 days vs 5.5 target. Union Pacific confirmed a +15% rail car allocation starting W11. If delivery holds on UP\'s 79% historical accuracy, hub returns to 85% capacity by W12 and the variance unwinds. Ohio Distribution has headroom to absorb 6–8% of overflow.',
    actions: [
      { kind: 'slack',  label: 'Slack MW Region Ops',  who: 'Tom · Midwest Ops',      body: 'Chicago hub at 94% — can we shift 6–8% to Columbus this week?' },
      { kind: 'email',  label: 'Email UP Liaison',     who: 'Derek · Rail Partnerships', body: 'Confirm W11 +15% allocation commitment — we need delivery on time.' },
      { kind: 'whatif', label: 'What-If: Re-route via Ohio', who: 'Forecast · overflow', body: 'Model: shift 7% volume to Columbus recovers $0.15M this week, eases Chicago to 88%.' },
      { kind: 'remind', label: 'Remind: UP Delivery',  who: 'Calendar · Mar 16',      body: 'Confirm Union Pacific W11 rail car delivery held.' },
    ],
    followUps: ["Can we re-route through Ohio?", 'Model W12 recovery scenario', 'Flag on board call?'],
  },
  {
    match: /washington tech|\bwatech\b|\bai training\b|compute underutil/i,
    text: '**Washington Tech is dragging $0.6M on AI training spend.** Training workloads +28% MoM; compute utilization only 65% vs 70% target. FinOps has a reservation strategy identified — $180K/mo recoverable. Separately, model-training efficiency work could cut training cost 15-20% with ~3 weeks of engineering. Recommend engaging FinOps + ML Ops jointly this week.',
    actions: [
      { kind: 'email',  label: 'Email CTO',             who: 'Jin · CTO',             body: 'WA Tech AI spend +28% MoM, utilization 65%. FinOps reservation recovers $180K/mo. Aligned?' },
      { kind: 'open',   label: 'Open FinOps Workbench', who: 'Workbench · FinOps',    body: 'Review reservation recommendations.' },
      { kind: 'whatif', label: 'What-If: Reservation + Training Eff.', who: 'Forecast · combined', body: 'Model: FinOps + ML-Ops efficiency combined recovers $0.35M/mo by W18.' },
      { kind: 'remind', label: 'Remind: ML Ops sync',   who: 'Calendar · Thu 10am',   body: 'Training efficiency standup with ML Ops.' },
    ],
    followUps: ['Which AI workload is driving growth?', 'What are the reservation tiers?', 'Compare egress to last quarter'],
  },
  {
    match: /oregon|clean energy|ira|subsidy|solar/i,
    text: '**Oregon Clean Energy is a bright spot in the West — +$0.2M.** IRA subsidy tranche released W9, recognized W10. Solar installation revenue accelerating. Q2 pipeline of $1.8M may pull forward 4–6 weeks on incentive-driven demand (+30% above pre-IRA baseline). Team capacity is the constraint — a small expansion captures the pull-forward.',
    actions: [
      { kind: 'email',  label: 'Email Clean Energy Lead', who: 'Priya · Clean Energy', body: 'Oregon IRA demand strong. Want to scope a team-expansion proposal for Q2 pull-forward.' },
      { kind: 'share',  label: 'Share with Strategy',    who: 'Strategy team',        body: 'IRA pull-forward — $1.8M pipeline may slide 4–6 weeks earlier.' },
      { kind: 'whatif', label: 'What-If: +3 installers', who: 'Forecast · team +3',    body: 'Model: 3 additional installers capture 70% of pull-forward, +$1.3M Q2 revenue.' },
      { kind: 'pin',    label: 'Pin OR Subsidy',         who: 'Workspace · Growth',    body: 'Oregon IRA subsidy acceleration tracker.' },
    ],
    followUps: ['What does Oregon mean for clean energy strategy?', 'Can we scale the team?', "What's the Q2 pipeline detail?"],
  },
  {
    match: /\bforecast\b|W11|week 11|next week|what does (the )?forecast/i,
    text: '**Forecast for W11 tightens the gap.** National −$2.1M vs plan (vs −$3.2M this week). Key assumptions: CA Retail labor holds flat (no acceleration), Texas gas stabilizes toward $2.80, Florida spring break materializes, Illinois rail car allocation ships on time. NE continues the trading beat. Three of the four risks are model-flagged at >75% confidence.',
    actions: [
      { kind: 'pin',    label: 'Pin W11 Forecast',     who: 'Workspace · Forecast',   body: 'W11 regional forecast with confidence scores.' },
      { kind: 'whatif', label: 'What-If: Stress tests', who: 'Forecast · stress',     body: 'Model: if all three risks miss, W11 could be −$4.2M. Base case −$2.1M.' },
      { kind: 'share',  label: 'Share with CFO',       who: 'Sarah · CFO',            body: 'W11 forecast — base case improvement, but three material risks outlined.' },
    ],
    followUps: ["What's the base case for W11?", 'Which risks have lowest confidence?', "How does this roll into Q2 guide?"],
  },
  {
    match: /plan vs prior|prior year|yoy|year over year|run rate|comparison/i,
    text: '**Comparison mode matters.** vs Plan: −$3.2M (budget miss). vs Prior Week: −$1.2M (trend tightening except CA). vs Prior Year: +$4.8M (YoY growth across 6 of 6 regions, lapping soft quarter). vs Forecast: −$0.4M (rolling forecast absorbed most of plan gap). vs Run Rate: −$2.1M (recent softness compressed run rate). The YoY story is the one to share externally; the plan story is the one to act on internally.',
    actions: [
      { kind: 'pin',    label: 'Pin Comparison View', who: 'Workspace · Variance',   body: 'Five-comparison matrix for W10.' },
      { kind: 'share',  label: 'Share YoY with Board', who: 'Board prep',             body: '+$4.8M YoY headline for board communication.' },
      { kind: 'open',   label: 'Open Drill-Down',     who: 'Performance · segments',  body: 'See how each segment moves across comparisons.' },
    ],
    followUps: ["Why is Run Rate so different from Plan?", 'What does Forecast say for W11?', 'Show YoY by region'],
  },
  {
    match: /cloud|infrastructure|cost/i,
    text: '**Cloud spend ratio ticked up to 22% of revenue**, driven by AI workload storage (+$280K), egress fees (+$140K), and compute underutilization (47% vs 70% target). FinOps team has a reservation strategy that could recover $180K/mo.',
    actions: [
      { kind: 'email',  label: 'Email CTO',             who: 'Jin · CTO',          body: 'Cloud ratio at 22% — proposing FinOps reservation strategy.' },
      { kind: 'open',   label: 'Open FinOps Workbench', who: 'Workbench · FinOps', body: 'Review reservation recommendations.' },
      { kind: 'share',  label: 'Share with Exec Team',  who: 'Leadership chat',    body: 'Cloud cost summary and FinOps plan.' },
    ],
    followUps: ['Which AI workload is driving growth?', 'What are the reservation tiers?', 'Compare egress to last quarter'],
  },
];

// ==================================================================
// Uberflux delivery-themed responses — match the active industry preset.
// ==================================================================
CHAT_RESPONSES.push(
  {
    match: /latam|mexico grocery|mexico supply|courier util|supply constraint/i,
    text: '**LATAM is −$2.4M this week — Mexico Grocery drives 87% of the miss.** Courier utilization sitting at 68% for 3 consecutive weeks (above the 63% red line) is the root cause; it triggered trip dampening since W8 and drove basket-size reduction. Brazil Convenience is approaching its own supply threshold (−$0.6M). Colombia expansion is the only bright spot at +$0.3M — tracking 2× the launch model. **Recommended:** route the Mexico courier ceiling lift for CFO approval today.',
    actions: [
      { kind: 'approve', label: 'Route Mexico ceiling lift',   who: 'Mai · CFO sign-off', body: 'Lift 1,240 → 1,380 couriers (+11%). Unblocks W11 recovery.' },
      { kind: 'approve', label: 'Pre-auth Brazil incentive',   who: 'Mai · Pre-auth',      body: '15% courier incentive for W11 · $40K · protects ~$0.8M revenue.' },
      { kind: 'open',    label: 'Open LATAM drill-down',       who: 'Performance · LATAM',  body: 'Segment-level variance detail.' },
      { kind: 'pin',     label: 'Pin Mexico supply tracker',   who: 'Workspace · LATAM',    body: 'Courier-util + variance rolling view.' },
    ],
    followUps: ['What is the W11 exposure if Mexico approval slips?', 'Show Brazil incentive ROI detail', 'Compare to W34 2024 supply event'],
  },
  {
    match: /tuesday|before tuesday|this week.*watch|what.*watch/i,
    text: '**Three items demand attention before Tuesday:** (1) Mexico supply ceiling approval — without it, W11 projects −$2.3M additional on Mexico alone. (2) Brazil Convenience threshold — without pre-auth incentive, projects −$1.1M for W11. (3) US Convenience Super Bowl exit rate has room to normalize per historical pattern but the NYC radius policy needs a decision by Monday EOD. Tuesday is the supply-approval deadline that unlocks the W11 recovery path.',
    actions: [
      { kind: 'approve', label: 'Approve Mexico ceiling (today)', who: 'Mai · CFO sign-off', body: 'Unblocks W11 recovery. Deadline: Tuesday.' },
      { kind: 'remind',  label: 'Remind: NYC radius decision',    who: 'Monday EOD',          body: 'US Convenience policy review — decision by Monday EOD.' },
      { kind: 'whatif',  label: 'W11 scenario model',              who: 'Forecast · W11',      body: 'Run stacked scenario on all 3 items.' },
      { kind: 'pin',     label: 'Pin Tuesday deadlines',           who: 'Workspace',           body: 'Rolling deadline tracker.' },
    ],
    followUps: ['What is the W11 base case if nothing changes?', 'Show the NYC radius tradeoffs', 'Who owns each Tuesday deadline?'],
  },
  {
    match: /risk|most at risk|next week|w11|week 11/i,
    text: '**Mexico Grocery is the single highest risk into W11 — projected −$2.3M if no intervention.** Brazil Convenience is the second-biggest, approaching its supply threshold at −$1.1M projected without pre-auth. US Convenience is auto-recovering (exit-rate normalization begins post Super Bowl). AU Grocery rebounds +15% in 2 weeks per the historical rainfall pattern. **EMEA is the only region model-scored positive again** — school-holiday lift continues into W11.',
    actions: [
      { kind: 'pin',     label: 'Pin W11 risk ranking',            who: 'Workspace',                body: 'Region-level W11 risk view.' },
      { kind: 'share',   label: 'Share with exec leadership',       who: 'Mai, Josh, Priya',        body: 'W11 risk ranking + recommended actions.' },
      { kind: 'whatif',  label: 'Run base/best/stress scenarios',  who: 'Forecast · W11 bands',     body: 'Model: base −$2.1M · best −$0.8M · stress −$6.0M.' },
      { kind: 'open',    label: 'Open Signals tab',                who: 'Performance · Signals',     body: 'ML model forecasts per region.' },
    ],
    followUps: ['Show model confidence for each risk', 'Compare W11 projections to W10 outcomes', 'Which of these has Tuesday dependency?'],
  },
  // ----- CFO persona -----
  {
    persona: 'CFO',
    match: /my approval|needs (?:my |cfo )?approval|approval queue|needs sign.?off|awaiting sign.?off/i,
    text: '**Mai — 3 items awaiting your approval:**\n\n1. **Mexico supply ceiling lift** · $2.1M variance / $1M materiality · routed by Raj Patel · aging 4 hrs\n2. **Q1 period close — Mexico Grocery segment lock** · requires CFO sign-off post supply resolution · aging 1 day\n3. **Brazil pre-authorization — 15% courier incentive, $40K** · Raj recommends approval; ROI 20× · aging 2 hrs\n\n**Total exposure if all unapproved through W11:** ~$6M downside risk across LATAM.',
    actions: [
      { kind: 'approve', label: 'Approve Mexico supply ceiling',    who: 'Mai · CFO sign-off',  body: 'Lift 1,240 → 1,380 couriers (+11%). Unblocks W11 recovery.' },
      { kind: 'approve', label: 'Approve & Lock Q1 Mexico segment', who: 'Mai · Period lock',    body: 'Lock Mexico Grocery segment post supply fix.' },
      { kind: 'approve', label: 'Approve Brazil $40K incentive',    who: 'Mai · Pre-auth',       body: '15% courier incentive for W11 · protects ~$0.8M revenue.' },
      { kind: 'email',   label: 'Reply to Raj with decision',        who: 'Raj · Controller',     body: 'Acknowledged — approving Mexico lift first.' },
      { kind: 'share',   label: 'Share decisions with board',        who: 'Board distribution',   body: 'CFO-approved actions for W10 variance package.' },
    ],
    followUps: ['What is the risk if I defer Mexico 24 hrs?', 'Show the full approval audit trail', 'Draft the board update summarizing my decisions'],
  },
  {
    persona: 'CFO',
    match: /board|board summary|board prep|board deck|board.?ready/i,
    text: '**Draft W10 board update — CFO voice:**\n\nGlobal variance came in at −$4.2M vs Plan, driven primarily by LATAM supply constraints in Mexico Grocery (−$2.1M, 3rd consecutive week). US Convenience Super Bowl timing (−$0.9M) and AU weather (−$0.7M) are explainable and auto-recovering. EMEA is the only positive region at +$0.3M on confirmed school-holiday uplift.\n\n**Q1 cumulative:** −$12.4M vs Plan (primarily February/March · supply-constrained). W11 projects −$2.8M if Mexico interventions land, closer to −$6M if not.\n\n**Actions taken this week:** Approved Mexico courier ceiling lift, pre-authorized Brazil incentive, scheduled NYC radius-reduction policy review for W11.',
    actions: [
      { kind: 'pin',     label: 'Pin to Q1 Board Prep folder',      who: 'Workspace · Board',      body: 'W10 variance + actions summary.' },
      { kind: 'email',   label: 'Send to board circulation list',   who: 'Board of Directors',     body: 'W10 summary + Q1 cumulative context.' },
      { kind: 'share',   label: 'Share board snapshot link',        who: 'meeru.ai/s/w10-board',   body: 'Shareable read-only snapshot.' },
      { kind: 'whatif',  label: 'Model Q2 recovery scenario',       who: 'Forecast · Q2',          body: 'What if all LATAM interventions land?' },
    ],
    followUps: ['Add Q1 cumulative variance breakdown', 'Include the Mexico supply case study', 'Shorten to 1 paragraph for board email'],
  },
  // ----- CONTROLLER persona -----
  {
    persona: 'CONTROLLER',
    match: /review queue|my review|pending.*review|awaiting.*review|staff submission|recon|reconciliation/i,
    text: '**Raj — your review queue (4 items):**\n\n1. **Mexico Grocery variance — $2.1M** · prepared by Maya Gonzales · evidence attached (courier-util chart, Cencosud email) · submitted 2 hrs ago\n2. **AR aging reconciliation — Mexico market** · prepared by Maya · submitted yesterday\n3. **Voltair remittance JE draft** · prepared by Maya · 3rd-party confirmation pending\n4. **Bank reconciliation evidence — Chicago operating** · prepared by Maya · ready for final sign-off\n\n**Highest priority:** Mexico Grocery — exceeds $1M materiality, needs your review then CFO routing.',
    actions: [
      { kind: 'approve', label: 'Post Mexico provisional JE',       who: 'GL · Mexico',           body: 'Post to draft. Routes to CFO for approval on > $1M.' },
      { kind: 'email',   label: 'Route Mexico to CFO',               who: 'Mai · CFO',             body: '$2.1M variance exceeds threshold — request CFO sign-off.' },
      { kind: 'approve', label: 'Approve AR reconciliation',         who: 'Mexico market',         body: 'Sign off recon after Maya\'s evidence review.' },
      { kind: 'slack',   label: 'Reply to Maya',                     who: 'Maya · Staff Acct',     body: 'Reviewing Mexico variance now — CFO routing after post.' },
    ],
    followUps: ['Show the full audit trail on Mexico', 'What evidence is Maya missing on Voltair?', 'Who else is in my review queue this week?'],
  },
  // ----- STAFF persona -----
  {
    persona: 'STAFF',
    match: /my task|my queue|my work|todo|what.*today|what.*should.*do|investigate/i,
    text: '**Maya — your queue for today (3 due):**\n\n1. **Investigate Mexico Grocery $2.1M variance** · due today 4 pm · evidence attached, note draft in progress\n2. **Post Voltair remittance JE draft** · due today 5 pm · awaiting 3rd-party confirmation\n3. **Submit evidence for Bank reconciliation** · due today EOD · 2 files remaining to upload\n\n**Blocker:** AR $142K variance — waiting on Maya-side evidence completion. This is critical-path for Day 5 close.',
    actions: [
      { kind: 'investigate', label: 'Open Mexico investigation',       who: 'Mexico Grocery · W10', body: 'Continue your draft — add supply-constraint context.' },
      { kind: 'email',       label: 'Submit Mexico for review',        who: 'Raj · Controller',     body: 'Mexico Grocery evidence package ready.' },
      { kind: 'investigate', label: 'Complete AR $142K evidence',      who: 'AR aging · Mexico',    body: 'Upload remaining evidence to unblock Day 5 close.' },
      { kind: 'remind',      label: 'Remind: 4 pm Mexico deadline',    who: 'Calendar · today',     body: 'Mexico investigation due 4 pm.' },
      { kind: 'slack',       label: 'Slack Raj if blocked',            who: 'Raj · Controller',     body: 'Ping on Voltair 3rd-party confirmation status.' },
    ],
    followUps: ['What evidence do I still need for Mexico?', 'How do I format the AR aging variance note?', 'Show me the Voltair JE template'],
  },
);

export const FALLBACK_RESPONSE: ChatResponseDef = {
  match: /.*/,
  text: 'Got it. Based on the current workbench context, here are a few tracks I can pull up. Pick one from the action cards below, or ask me something more specific.',
  actions: [
    { kind: 'open',  label: 'Open Drill-Down', who: 'This workbench · drill', body: 'Dig into the top driver of this variance.' },
    { kind: 'pin',   label: 'Pin this view',   who: 'Workspace',              body: 'Save the current filters and chart state.' },
    { kind: 'share', label: 'Share snapshot',  who: 'Team',                   body: 'Export to an image or link.' },
  ],
};
