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
} from './types';

// -------- PERSONAS --------
export const PERSONAS: Record<Role, Persona> = {
  CFO: {
    key: 'CFO', name: 'Sarah Chen', init: 'SC', role: 'Chief Financial Officer',
    email: 'sarah.chen@contoso.com',
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
    reportsTo: 'Sarah Chen, CFO',
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
  PREPARER: {
    key: 'PREPARER', name: 'Maya Gonzales', init: 'MG', role: 'Staff Accountant',
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
export const SUGGESTIONS = [
  'Why did Enterprise churn spike this quarter?',
  "What's happening with California Retail labor costs?",
  'When will margins recover?',
  "What's driving cloud cost increase?",
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

export const FALLBACK_RESPONSE: ChatResponseDef = {
  match: /.*/,
  text: 'Got it. Based on the current workbench context, here are a few tracks I can pull up. Pick one from the action cards below, or ask me something more specific.',
  actions: [
    { kind: 'open',  label: 'Open Drill-Down', who: 'This workbench · drill', body: 'Dig into the top driver of this variance.' },
    { kind: 'pin',   label: 'Pin this view',   who: 'Workspace',              body: 'Save the current filters and chart state.' },
    { kind: 'share', label: 'Share snapshot',  who: 'Team',                   body: 'Export to an image or link.' },
  ],
};
