import type {
  Persona, Role, WorkbenchMeta, WorkbenchKey, LeftItem, Kpi,
  CommentaryItem, ChartBar, ChatResponseDef, ActionCard, Mission,
} from './types';

// ==========================================================
// PERSONAS
// ==========================================================
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
    phone: '+1 (415) 555-0142',
    focusAreas: ['Revenue', 'Margin', 'Board Prep', 'Investor Relations'],
    quickStat: { label: 'Board meeting in', value: '9 days', tone: 'warn' },
    todayAgenda: [
      'Review Q1 variance package',
      '1:1 with VP Sales on churn plan',
      'Board deck finalization — 4 pm',
    ],
    permissions: ['View all workbenches', 'Approve JE > $1M', 'Lock period', 'Publish reports'],
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
    phone: '+1 (512) 555-0107',
    focusAreas: ['Close Management', 'Reconciliations', 'Tax', 'Audit'],
    quickStat: { label: 'Close status', value: 'Day 4 / 5', tone: 'warn' },
    todayAgenda: [
      'Unblock AR aging reconciliation',
      'Chase tax team on depreciation schedule',
      'Stand-up with close team — 4 pm',
    ],
    permissions: ['Post JE', 'Approve recons', 'Sign-off close phases', 'Review worklist'],
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
    phone: '+1 (312) 555-0188',
    focusAreas: ['AR Reconciliations', 'Evidence Upload', 'Investigations'],
    quickStat: { label: 'Tasks due today', value: '3', tone: 'neg' },
    todayAgenda: [
      'Investigate $142K AR variance',
      'Post Voltair remittance JE',
      'Submit evidence for Bank reconciliation',
    ],
    permissions: ['Prepare JE (review required)', 'Upload evidence', 'Comment on recs'],
  },
};

// ==========================================================
// WORKBENCH META
// ==========================================================
export const WORKBENCHES: Record<WorkbenchKey, WorkbenchMeta> = {
  performance: {
    key: 'performance', label: 'Performance Intelligence', short: 'Performance',
    path: '/variance/performance', icon: 'bars',
    topTabs: ['analysis', 'drilldown', 'exceptions', 'signals', 'history'],
  },
  margin: {
    key: 'margin', label: 'Margin Intelligence', short: 'Margin',
    path: '/variance/margin', icon: 'trend',
    topTabs: ['waterfall', 'productmix', 'costs', 'sensitivity'],
  },
  flux: {
    key: 'flux', label: 'Flux Intelligence', short: 'Flux',
    path: '/variance/flux', icon: 'sheet',
    topTabs: ['is', 'bs', 'cf'],
  },
};

export const TOP_TAB_LABELS: Record<string, string> = {
  analysis: 'Analysis', drilldown: 'Drill-Down', exceptions: 'Exceptions', signals: 'Signals', history: 'History',
  waterfall: 'Margin Waterfall', productmix: 'Product Mix', costs: 'Cost Decomposition', sensitivity: 'Sensitivity',
  is: 'Income Statement', bs: 'Balance Sheet', cf: 'Cash Flow Bridge',
};

// ==========================================================
// LEFT RAIL CONTENT
// ==========================================================
export const PERF_REGIONS: LeftItem[] = [
  { k: 'global',    n: 'Global',    d: '-$3.2M', tone: 'neg' },
  { k: 'americas',  n: 'Americas',  d: '-$1.8M', tone: 'neg' },
  { k: 'emea',      n: 'EMEA',      d: '+$0.2M', tone: 'pos' },
  { k: 'apac',      n: 'APAC',      d: '-$0.5M', tone: 'neg' },
  { k: 'latam',     n: 'LATAM',     d: '-$0.3M', tone: 'warn' },
];
export const PERF_COMPARES: LeftItem[] = [
  { k: 'plan',     n: 'vs Plan' },
  { k: 'priorwk',  n: 'vs Prior Week' },
  { k: 'prioryr',  n: 'vs Prior Year' },
  { k: 'forecast', n: 'vs Forecast' },
  { k: 'runrate',  n: 'vs Run Rate' },
];
export const PERF_DRIVERS: LeftItem[] = [
  { k: 'enterprise',  n: 'Enterprise Churn',     d: '-$2.1M', tone: 'neg' },
  { k: 'midmarket',   n: 'Mid-Market New Logos', d: '+$1.2M', tone: 'pos' },
  { k: 'expansion',   n: 'Expansion ARR',         d: '+$0.8M', tone: 'pos' },
  { k: 'cloud',       n: 'Cloud Infrastructure',  d: '-$0.6M', tone: 'warn' },
  { k: 'services',    n: 'Professional Services', d: '-$0.3M', tone: 'warn' },
];

export const MARGIN_PRODUCTS: LeftItem[] = [
  { k: 'all',      n: 'All Products' },
  { k: 'iphone',   n: 'iPhone',    d: '78.4%', tone: 'neg' },
  { k: 'mac',      n: 'Mac',       d: '42.1%', tone: 'warn' },
  { k: 'services', n: 'Services',  d: '72.9%', tone: 'pos' },
  { k: 'wearables', n: 'Wearables', d: '35.8%', tone: 'neg' },
];
export const MARGIN_CHANNELS: LeftItem[] = [
  { k: 'all',        n: 'All Channels' },
  { k: 'retail',     n: 'Retail' },
  { k: 'online',     n: 'Online' },
  { k: 'enterprise', n: 'Enterprise' },
  { k: 'partner',    n: 'Partner' },
];
export const MARGIN_PERIODS: LeftItem[] = [
  { k: 'mtd', n: 'Month-to-Date' },
  { k: 'qtd', n: 'Quarter-to-Date' },
  { k: 'ytd', n: 'Year-to-Date' },
  { k: 'ltm', n: 'Last 12 Months' },
];

export const FLUX_COMPARES: LeftItem[] = [
  { k: 'qoq',      n: 'Quarter over Quarter' },
  { k: 'yoy',      n: 'Year over Year' },
  { k: 'plan',     n: 'vs Plan' },
  { k: 'forecast', n: 'vs Forecast' },
];
export const FLUX_MATERIALITY: LeftItem[] = [
  { k: '500k', n: '> $500K' },
  { k: '1m',   n: '> $1M' },
  { k: '5m',   n: '> $5M' },
  { k: '10m',  n: '> $10M' },
];
export const FLUX_OWNERS: LeftItem[] = [
  { k: 'all',       n: 'All Owners' },
  { k: 'revenue',   n: 'Revenue Team' },
  { k: 'opex',      n: 'OpEx Team' },
  { k: 'treasury',  n: 'Treasury' },
  { k: 'tax',       n: 'Tax' },
];

// ==========================================================
// WORKBENCH CONTENT (KPIs, commentary, charts)
// ==========================================================
export const PERF_KPIS: Kpi[] = [
  { lbl: 'Net Revenue Retention', val: '108%',  delta: '▼ 7pp vs prior Q',   tone: 'neg' },
  { lbl: 'New ARR',               val: '$4.2M', delta: '▲ 12% vs plan',       tone: 'pos' },
  { lbl: 'Gross Margin',          val: '78.4%', delta: '▼ 1.2pp vs prior Q', tone: 'neg' },
];
export const MARGIN_KPIS: Kpi[] = [
  { lbl: 'Blended Gross Margin',  val: '62.3%', delta: '▼ 0.8pp QoQ', tone: 'neg' },
  { lbl: 'Operating Margin',      val: '28.1%', delta: '▲ 0.3pp QoQ', tone: 'pos' },
  { lbl: 'Contribution Margin',   val: '55.7%', delta: '▼ 1.1pp QoQ', tone: 'neg' },
];
export const FLUX_KPIS: Kpi[] = [
  { lbl: 'Revenue Δ vs PQ',       val: '+$38M', delta: '+4.1%',  tone: 'pos' },
  { lbl: 'OpEx Δ vs PQ',          val: '+$54M', delta: '+7.9%',  tone: 'neg' },
  { lbl: 'FCF Δ vs PQ',           val: '-$21M', delta: '-12.4%', tone: 'neg' },
];

export const PERF_COMMENTARY: CommentaryItem[] = [
  {
    rank: 1, name: 'Enterprise', delta: '-$2.1M vs Plan',
    text: '3 logo churns in Q1 — Acme Corp ($800K), GlobalTech ($750K), DataStar ($550K). NRR declined from 115% to 108%. Renewal pipeline shows 2 additional at-risk accounts. Expansion ARR from existing accounts partially offsets at +$600K.',
    tags: [{ t: 'red', l: 'Churn spike' }, { t: 'red', l: 'NRR decline' }, { t: 'blue', l: 'Predictive flag' }],
  },
  {
    rank: 2, name: 'Mid-Market', delta: '+$0.5M vs Plan',
    text: 'Strong new logo acquisition — 12 new accounts vs 8 planned. Average deal size $42K, up 15% from prior quarter. Land-and-expand motion working well in financial services vertical.',
    tags: [{ t: 'green', l: 'New logos' }, { t: 'green', l: 'Deal size ↑' }],
  },
  {
    rank: 3, name: 'SMB', delta: '-$0.4M vs Plan',
    text: 'Self-serve signups flat. Free-to-paid conversion dropped to 3.2% from 4.1%. Pricing experiment in APAC showing early positive signals but not yet material.',
    tags: [{ t: 'amber', l: 'Conversion drop' }, { t: 'blue', l: 'Pricing test' }],
  },
];
export const MARGIN_COMMENTARY: CommentaryItem[] = [
  {
    rank: 1, name: 'Wearables', delta: '-2.8pp vs Plan',
    text: 'Component cost surge on camera sensors and display panels. Yield issues on new flagship model compressed margin. Supplier renegotiation in progress — expected 120 bps recovery in Q2.',
    tags: [{ t: 'red', l: 'Component cost' }, { t: 'amber', l: 'Yield issue' }, { t: 'blue', l: 'Q2 recovery' }],
  },
  {
    rank: 2, name: 'Services', delta: '+1.1pp vs Plan',
    text: 'Subscription mix shifting favorably — higher-tier plans growing 22% YoY. App Store commissions steady. Cloud service COGS leveraging at scale.',
    tags: [{ t: 'green', l: 'Mix shift' }, { t: 'green', l: 'Scale leverage' }],
  },
  {
    rank: 3, name: 'Mac', delta: '-1.4pp vs Plan',
    text: 'Memory and SSD pricing elevated. Refresh cycle creating inventory pressure. Transition to new silicon on track but yields below target for first 90 days.',
    tags: [{ t: 'amber', l: 'Memory pricing' }, { t: 'amber', l: 'Silicon ramp' }],
  },
];
export const FLUX_COMMENTARY: CommentaryItem[] = [
  {
    rank: 1, name: 'Cost of Revenue', delta: '+$28M QoQ',
    text: 'Primary driver of OpEx growth. Volume-related COGS up 18% on unit growth, but unit cost deterioration of 3.2% added $12M. Component inflation most acute on memory and display categories.',
    tags: [{ t: 'red', l: 'Volume driver' }, { t: 'red', l: 'Price driver' }, { t: 'blue', l: 'Unit cost 3.2%↑' }],
  },
  {
    rank: 2, name: 'Product Revenue', delta: '+$24M QoQ',
    text: 'iPhone launch cycle drove +$31M; Mac flat; Wearables -$7M. Services continues steady growth at +$14M. Net positive but mix unfavorable for margin.',
    tags: [{ t: 'green', l: 'iPhone launch' }, { t: 'amber', l: 'Mix unfavorable' }],
  },
  {
    rank: 3, name: 'R&D', delta: '+$17M QoQ',
    text: 'Step-up in AI silicon R&D and new product NPI. Headcount +180 in Q. Capitalization ratio steady at 14%.',
    tags: [{ t: 'blue', l: 'AI silicon' }, { t: 'blue', l: 'HC +180' }],
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
export const MARGIN_CHART: ChartBar[] = [
  { w: 'Jan',  a: 62.8, p: 63.2, tone: 'warn' },
  { w: 'Feb',  a: 62.5, p: 63.2, tone: 'warn' },
  { w: 'Mar',  a: 62.3, p: 63.2, tone: 'neg' },
  { w: 'Apr▸', a: 62.6, p: 63.2, tone: 'warn', forecast: true },
];
export const FLUX_CHART: ChartBar[] = [
  { w: 'Rev',  a: 38,  p: 0, tone: 'pos' },
  { w: 'COGS', a: -28, p: 0, tone: 'neg' },
  { w: 'GM',   a: 10,  p: 0, tone: 'pos' },
  { w: 'OpEx', a: -17, p: 0, tone: 'neg' },
  { w: 'OI',   a: -7,  p: 0, tone: 'neg' },
  { w: 'FCF',  a: -21, p: 0, tone: 'neg' },
];

// ==========================================================
// CHAT SUGGESTIONS + INSIGHTS + RESPONSES
// ==========================================================
export const INSIGHTS = [
  { ico: 'neg' as const,  title: 'Global Revenue: −$3.2M',  when: 'just now', text: 'vs Plan · primary driver Labor' },
  { ico: 'warn' as const, title: '5 exceptions flagged',    when: '2m ago',   text: '3 critical · 2 warning · 2 positive' },
  { ico: 'info' as const, title: '5 ML signals active',     when: '5m ago',   text: 'California Retail labor costs surging post minimum-wage hike — LA and SF markets trending 12% above budget.' },
];
export const SUGGESTIONS = [
  'Why did Enterprise churn spike this quarter?',
  "What's happening with California Retail labor costs?",
  'When will margins recover?',
  'When should we intervene on at-risk accounts?',
  'Compare NRR trend to prior 4 quarters',
  "What's driving cloud cost increase?",
  'Which accounts are at risk for next quarter?',
  'Show expansion ARR by segment',
];

export const CHAT_RESPONSES: ChatResponseDef[] = [
  {
    match: /enterprise|churn/i,
    text: '<strong>3 logo churns are the driver.</strong> Acme Corp ($800K ARR), GlobalTech ($750K), DataStar ($550K) — all cited pricing and product fit. Our renewal-risk model flags 2 more accounts ($1.1M combined) as high-risk before end of Q2. NRR dropped from 115% to 108%.<br/><br/>Expansion ARR in the installed base partially offset (+$600K), but the trend needs intervention before June renewals.',
    actions: [
      { kind: 'email',  label: 'Email VP Sales',        who: 'Sue Park · VP Sales',     body: 'Flagging 3 enterprise churns ($2.1M ARR) — need renewal strategy for 2 more at-risk accounts before end of Q2.' },
      { kind: 'slack',  label: 'Slack CS Lead',         who: 'Priya · CS Director',     body: 'Can we surface our churn findings at tomorrow\'s QBR? 5 accounts affected.' },
      { kind: 'whatif', label: 'Run Retention What-If', who: 'Forecast · +10% retention', body: 'Model: retention +10% → NRR back to 114%, ARR delta +$1.8M.' },
      { kind: 'pin',    label: 'Pin to Board Deck',     who: 'Workspace · Q1 Board Prep', body: '3 churns + 2 at-risk accounts, NRR trend.' },
    ],
    followUps: [
      'Which accounts are at risk next?',
      'Show NRR trend by cohort',
      'What expansion is offsetting?',
    ],
  },
  {
    match: /california|labor|west|staffing/i,
    text: '<strong>California Retail is the epicenter.</strong> LA and SF minimum-wage adjustments pushed overtime hours 18% above plan. Margin compression has accelerated for 3 consecutive weeks. ML model projects −2% to −4% additional margin erosion in W11 if staffing model is not adjusted before Thursday.<br/><br/>Comparable pattern to NY wage adjustment in Q1 2024 — automation rollout partially offset there, same playbook available here.',
    actions: [
      { kind: 'slack',  label: 'Slack West Region Ops', who: 'Carlos · West Ops Lead',   body: 'CA Retail labor surge — need to review shift scheduling before Thursday. ML model projecting −2-4% more margin erosion.' },
      { kind: 'email',  label: 'Email Staffing Model',  who: 'Kai · Workforce Planning',  body: 'Pull current CA Retail staffing model and overtime distribution for LA + SF. Need before end of day.' },
      { kind: 'whatif', label: 'What-If: Add 120 FTEs', who: 'Forecast · +120 FTE',       body: 'Model: +120 FTE reduces OT 62%, margin recovery +2.3pp by W13.' },
      { kind: 'remind', label: 'Remind: Thursday Prep', who: 'Calendar · Thu 8am',        body: 'Review West Coast margin before earnings prep meeting.' },
    ],
    followUps: [
      'Compare to NY Q1 2024 wage event',
      'Show Americas margin weekly trend',
      "What's the OT distribution by store?",
    ],
  },
  {
    match: /cloud|infrastructure|cost/i,
    text: '<strong>Cloud spend ratio ticked up to 22% of revenue</strong>, driven by 3 primary items: (1) storage growth from new AI workloads (+$280K), (2) egress fees from customer data exports (+$140K), (3) compute utilization at 47% — 20pp below target.<br/><br/>FinOps team has a reservation strategy that could recover $180K/mo with 60-day commitment.',
    actions: [
      { kind: 'email',  label: 'Email CTO',             who: 'Jin · CTO',                body: 'Cloud ratio at 22% — proposing FinOps reservation strategy. Need decision before month-end.' },
      { kind: 'open',   label: 'Open FinOps Workbench', who: 'Workbench · FinOps',        body: 'Review reservation recommendations and commitment model.' },
      { kind: 'share',  label: 'Share with Exec Team',  who: 'Leadership chat',           body: 'Cloud cost summary and FinOps plan.' },
    ],
    followUps: [
      'Which AI workload is driving storage growth?',
      'What are the reservation discount tiers?',
      'Compare egress costs to last quarter',
    ],
  },
  {
    match: /nrr|retention|trend/i,
    text: '<strong>NRR trend over prior 4 quarters: 117 → 116 → 115 → 108.</strong> Q1 is the breakpoint — churn contribution moved from ~1pp drag to ~5pp drag. Expansion stayed flat at ~6pp. Gross retention was steady at ~96% until this quarter, now 94%.<br/><br/>Category that changed: 3-year enterprise cohort from 2022 coming up for first renewal — weakest cohort we\'ve seen.',
    actions: [
      { kind: 'email',  label: 'Email VP Customer',     who: 'Priya · VP CS',             body: '2022 enterprise cohort renewal strategy — need deep-dive by Friday.' },
      { kind: 'pin',    label: 'Pin NRR Trend',         who: 'Workspace · Board Prep',    body: '4-quarter NRR trend with cohort breakdown.' },
      { kind: 'whatif', label: 'What-If: Renewal Push', who: 'Forecast · Renewal +15%',   body: 'Model: renewal program +15% → NRR 112% by Q2.' },
    ],
    followUps: [
      'Deep dive on 2022 enterprise cohort',
      'Show gross retention by segment',
      'Compare with industry benchmarks',
    ],
  },
  {
    match: /risk|at[- ]?risk|account/i,
    text: '<strong>7 accounts flagged as at-risk</strong> for Q2 renewal, total ARR exposure $3.4M. Top 3 by size: Voltair ($680K, silent since W5), Meridian ($520K, competitive RFP), Parkline ($480K, sponsor churn). Retention model gives each &lt;30% probability.',
    actions: [
      { kind: 'email',  label: 'Email Account Managers', who: '3 AM leads',                body: 'Top 3 at-risk accounts — need intervention plan before mid-Q2.' },
      { kind: 'share',  label: 'Share with Sales Ops',   who: 'Sales Ops channel',         body: 'Full at-risk list ($3.4M exposure) with retention scores.' },
      { kind: 'remind', label: 'Remind: Mid-Q2 Check',   who: 'Calendar · May 15',         body: 'Retention check-in on 7 flagged accounts.' },
    ],
    followUps: [
      'Why is Voltair silent?',
      'Show the full retention-score list',
      'What saved the last at-risk save?',
    ],
  },
  {
    match: /expansion|arr|segment/i,
    text: '<strong>Expansion ARR by segment, QoQ:</strong> Enterprise +$0.6M (from seat growth in 4 accounts), Mid-Market +$0.4M (cross-sell of platform add-on), SMB +$0.1M (upgrade to Pro tier). Total $1.1M — 40% below target of $1.8M.<br/><br/>Gap concentrated in Mid-Market; the platform add-on launched late and has only 22% attach vs 35% target.',
    actions: [
      { kind: 'slack',  label: 'Slack Product Lead',    who: 'Nina · VP Product',         body: 'Platform add-on attach at 22% — below 35% target. Need to revisit packaging or enablement?' },
      { kind: 'open',   label: 'Open Segment Drill',    who: 'Workbench · drill',         body: 'Drill into Mid-Market expansion by customer tier.' },
      { kind: 'pin',    label: 'Pin Gap Analysis',      who: 'Workspace · Board Prep',    body: 'Expansion ARR $0.7M gap vs target.' },
    ],
    followUps: [
      'Why is add-on attach so low?',
      'Which enterprise seats are expanding?',
      'Show SMB upgrade funnel',
    ],
  },
  {
    match: /close|task|blocker/i,
    text: '<strong>Day 4 of close — 2 open blockers.</strong> (1) AR aging reconciliation waiting on remittance detail from Voltair. (2) Fixed asset rollforward — missing Q1 depreciation schedule from the tax team. 14 tasks complete, 6 in progress, 2 blocked, 3 not started.',
    actions: [
      { kind: 'slack',  label: 'Slack AR Lead',         who: 'Amy · AR Manager',          body: 'Need Voltair remittance detail to close AR reconciliation today.' },
      { kind: 'email',  label: 'Email Tax Team',        who: 'Tax team',                  body: 'Q1 depreciation schedule is blocking fixed asset rollforward. Need today.' },
      { kind: 'open',   label: 'Open Close Workbench',  who: 'Workbench · Close',         body: 'Review full task list and critical path.' },
      { kind: 'remind', label: 'Remind: Stand-up @ 4pm', who: 'Calendar · Today 4pm',     body: 'Close stand-up with blockers.' },
    ],
    followUps: [
      'Show the critical path',
      'Who owns the tax schedule?',
      'Which tasks can be reassigned?',
    ],
  },
  {
    match: /reconcil/i,
    text: '<strong>27 of 32 reconciliations complete</strong> · 5 outstanding: AR Aging, Bank GL, Intercompany, FX Remeasurement, Accrued Payroll. 3 of 5 have variances above materiality ($50K); AR Aging has the largest at $142K.',
    actions: [
      { kind: 'open',   label: 'Open AR Reconciliation', who: 'Reconciliations',         body: '$142K variance — drill into open invoices.' },
      { kind: 'slack',  label: 'Slack Preparer',        who: 'Maya · Staff Accountant',   body: 'AR Aging recon has $142K variance — can you investigate?' },
      { kind: 'email',  label: 'Email Audit Contact',   who: 'External audit',            body: 'Recon summary for Q1 close.' },
    ],
    followUps: [
      'Which invoices make up the AR variance?',
      'Show aging buckets',
      'Compare to last quarter recons',
    ],
  },
];
export const FALLBACK_RESPONSE: ChatResponseDef = {
  match: /.*/,
  text: 'Got it. Based on the current workbench context, here are a few tracks I can pull up. Pick one from the action strip, or ask me something more specific.',
  actions: [
    { kind: 'open',  label: 'Open Drill-Down',  who: 'This workbench · drill',  body: 'Dig into the top driver of this variance.' },
    { kind: 'pin',   label: 'Pin this view',    who: 'Workspace',               body: 'Save the current filters and chart state.' },
    { kind: 'share', label: 'Share snapshot',   who: 'Team',                    body: 'Export to an image or link.' },
  ],
};

// ==========================================================
// UNIVERSAL ACTIONS (always visible in strip)
// ==========================================================
export const UNIVERSAL_ACTIONS: ActionCard[] = [
  { kind: 'pin',    label: 'Pin this view',  who: 'Workspace · Live Pins', body: 'Save current filters.' },
  { kind: 'remind', label: 'Remind me',      who: 'Calendar',              body: 'Set a reminder to revisit.' },
  { kind: 'share',  label: 'Share snapshot', who: 'Team',                  body: 'Share the current view.' },
];

// ==========================================================
// MISSIONS
// ==========================================================
export const MISSIONS: Mission[] = [
  {
    id: 'cfo-west-coast',
    label: 'Tuesday Morning — West Coast Crisis',
    persona: 'CFO',
    startWorkbench: 'performance',
    startPath: '/variance/performance',
    beats: [
      { body: "Good morning. It's Tuesday. The California Retail labor-cost signal just moved to critical — ML projects −$3.2M margin compression by Thursday if we don't act. Start by clicking <strong>Americas</strong> in the left rail to focus the view.", glow: '[data-left-key="americas"]' },
      { body: "Nice. Notice the commentary re-ranked. The AI panel on the right has insights queued. Click the <strong>California / Labor</strong> suggestion in the chat — or type it.", glow: '[data-suggestion-key="california"]' },
      { body: "The AI just explained what's happening. More importantly — <strong>look at the bottom strip</strong>. Four action cards just appeared, ranked for your role. Click <strong>Send</strong> on <em>Slack West Region Ops</em>.", glow: '[data-card-kind="slack"]' },
      { body: "Sent. No Slack window, no copy-paste. Carlos got the message. Now queue the follow-up: click <strong>What-If: Add 120 FTEs</strong>.", glow: '[data-card-kind="whatif"]' },
      { body: "Forecast ran inline — adding 120 FTEs recovers 2.3pp margin by W13. One last thing: <strong>Pin to Board Deck</strong> so this shows up in Friday prep.", glow: '[data-card-kind="pin"]' },
      { body: "Done. Three minutes, three actions, zero app-switching. That's the loop.", final: true },
    ],
  },
  {
    id: 'controller-close',
    label: 'Close-Day Blocker',
    persona: 'CONTROLLER',
    startWorkbench: 'performance',
    startPath: '/close',
    beats: [
      { body: "It's Day 4 of close and there are 2 blockers. Jump into the chat and ask about the close status — try the prompt below.", glow: '[data-suggestion-key="close"]' },
      { body: "Good. The AI identified the AR reconciliation as the critical-path blocker. Click <strong>Slack AR Lead</strong> to escalate.", glow: '[data-card-kind="slack"]' },
      { body: "Escalated. Let's also email the tax team about the depreciation schedule — click <strong>Email Tax Team</strong>.", glow: '[data-card-kind="email"]' },
      { body: "Two blockers unblocked in under a minute. Close moves forward.", final: true },
    ],
  },
  {
    id: 'preparer-recon',
    label: 'The 3% Discrepancy',
    persona: 'PREPARER',
    startWorkbench: 'performance',
    startPath: '/reconciliations',
    beats: [
      { body: "Trial balance shows a 3% variance between GL and subledger. Ask the AI about reconciliations to start — use the suggestion.", glow: '[data-suggestion-key="recon"]' },
      { body: "The AI found the variance. Click <strong>Open AR Reconciliation</strong> to drill in.", glow: '[data-card-kind="open"]' },
      { body: "Drilled in. For the handoff: <strong>Slack Preparer</strong> … wait, that's you. IM your reviewer instead — click <strong>Slack Preparer</strong> to continue.", glow: '[data-card-kind="slack"]' },
      { body: "Logged. Evidence attached. Reviewer notified. That's the close loop in preparer-mode.", final: true },
    ],
  },
];

// ==========================================================
// WORKSPACE DATA (home landing)
// ==========================================================
export const LIVE_PINS = [
  { label: 'Global NRR', value: '108%', delta: '▼ 7pp', tone: 'neg' as const, sparkline: [117, 116, 115, 108] },
  { label: 'New ARR MTD', value: '$4.2M', delta: '▲ 12%', tone: 'pos' as const, sparkline: [2.8, 3.1, 3.7, 4.2] },
  { label: 'CA Retail Margin', value: '−2.8pp', delta: 'critical', tone: 'neg' as const, sparkline: [0, -0.8, -1.6, -2.8] },
  { label: 'Close Day', value: 'Day 4 / 5', delta: '2 blockers', tone: 'warn' as const, sparkline: [1, 2, 3, 4] },
];
export const WATCHLIST = [
  { entity: 'Acme Corp',     kind: 'Customer', metric: 'ARR at risk',      value: '$800K', tone: 'neg' as const },
  { entity: 'Voltair',       kind: 'Customer', metric: 'Renewal probability', value: '28%',  tone: 'neg' as const },
  { entity: 'CA Retail',     kind: 'Region',   metric: 'Margin Δ',          value: '-2.8pp', tone: 'neg' as const },
  { entity: 'FX USD/EUR',    kind: 'Macro',    metric: '7-day move',        value: '+1.4%',  tone: 'warn' as const },
  { entity: 'Cloud ratio',   kind: 'KPI',      metric: 'of revenue',        value: '22%',    tone: 'warn' as const },
];
export const ACTIVITY = [
  { who: 'Meeru AI', when: 'just now', what: 'Flagged 3 enterprise churns — $2.1M ARR' },
  { who: 'Sarah Chen', when: '8 min ago', what: 'Pinned CA Retail margin to Board Deck' },
  { who: 'Raj Patel', when: '23 min ago', what: 'Marked 2 close tasks complete' },
  { who: 'Meeru AI', when: '1 h ago', what: 'Generated NRR trend report · 4 quarters' },
  { who: 'Maya Gonzales', when: '2 h ago', what: 'Posted JE — $142K AR correction' },
];

// ==========================================================
// CLOSE WORKBENCH DATA
// ==========================================================
export interface CloseTask {
  id: string;
  name: string;
  owner: string;
  status: 'done' | 'in_progress' | 'blocked' | 'not_started';
  due: string;
  blocker?: string;
  group: string;
}
export const CLOSE_TASKS: CloseTask[] = [
  { id: 'c1', name: 'Bank reconciliation — operating', owner: 'Maya G.', status: 'done', due: 'Day 2', group: 'Recon' },
  { id: 'c2', name: 'AR aging reconciliation', owner: 'Maya G.', status: 'blocked', due: 'Day 4', blocker: 'Missing Voltair remittance', group: 'Recon' },
  { id: 'c3', name: 'Intercompany elimination', owner: 'Raj P.', status: 'in_progress', due: 'Day 4', group: 'Consolidation' },
  { id: 'c4', name: 'FX remeasurement (EUR, GBP, JPY)', owner: 'Raj P.', status: 'in_progress', due: 'Day 4', group: 'Consolidation' },
  { id: 'c5', name: 'Accrued payroll (including bonuses)', owner: 'Maya G.', status: 'done', due: 'Day 3', group: 'Accruals' },
  { id: 'c6', name: 'Deferred revenue roll-forward', owner: 'Nina T.', status: 'done', due: 'Day 3', group: 'Revenue' },
  { id: 'c7', name: 'Fixed asset rollforward', owner: 'Raj P.', status: 'blocked', due: 'Day 4', blocker: 'Q1 depreciation schedule missing from tax', group: 'Assets' },
  { id: 'c8', name: 'Goodwill impairment test', owner: 'Tax team', status: 'not_started', due: 'Day 5', group: 'Assets' },
  { id: 'c9', name: 'Stock comp accrual', owner: 'Nina T.', status: 'in_progress', due: 'Day 4', group: 'Accruals' },
  { id: 'c10', name: 'Tax provision (preliminary)', owner: 'Tax team', status: 'not_started', due: 'Day 5', group: 'Tax' },
  { id: 'c11', name: 'Cash flow statement build', owner: 'Raj P.', status: 'in_progress', due: 'Day 5', group: 'Reporting' },
  { id: 'c12', name: 'Variance commentary for CFO', owner: 'Raj P.', status: 'not_started', due: 'Day 5', group: 'Reporting' },
];

// ==========================================================
// PERFORMANCE — Drill-Down rows (customer-level)
// ==========================================================
export interface DrillRow {
  id: string;
  customer: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB';
  region: string;
  arr: number;
  deltaArr: number;
  nrr: number;
  status: 'Healthy' | 'Expansion' | 'At Risk' | 'Churned';
  lastActivity: string;
}
export const PERF_DRILLDOWN: DrillRow[] = [
  { id: 'd1',  customer: 'Acme Corp',       segment: 'Enterprise', region: 'Americas', arr: 800_000,  deltaArr: -800_000, nrr: 0,   status: 'Churned',   lastActivity: '12 days ago' },
  { id: 'd2',  customer: 'GlobalTech',      segment: 'Enterprise', region: 'EMEA',     arr: 750_000,  deltaArr: -750_000, nrr: 0,   status: 'Churned',   lastActivity: '9 days ago' },
  { id: 'd3',  customer: 'DataStar',        segment: 'Enterprise', region: 'Americas', arr: 550_000,  deltaArr: -550_000, nrr: 0,   status: 'Churned',   lastActivity: '4 days ago' },
  { id: 'd4',  customer: 'Voltair',         segment: 'Enterprise', region: 'Americas', arr: 680_000,  deltaArr: 0,        nrr: 95,  status: 'At Risk',   lastActivity: 'Silent 18d' },
  { id: 'd5',  customer: 'Meridian',        segment: 'Enterprise', region: 'EMEA',     arr: 520_000,  deltaArr: 0,        nrr: 92,  status: 'At Risk',   lastActivity: 'RFP open' },
  { id: 'd6',  customer: 'Parkline',        segment: 'Enterprise', region: 'Americas', arr: 480_000,  deltaArr: -50_000,  nrr: 90,  status: 'At Risk',   lastActivity: '2 days ago' },
  { id: 'd7',  customer: 'Northbridge',     segment: 'Enterprise', region: 'APAC',     arr: 920_000,  deltaArr: 180_000,  nrr: 124, status: 'Expansion', lastActivity: '1 day ago' },
  { id: 'd8',  customer: 'Solstice Labs',   segment: 'Enterprise', region: 'Americas', arr: 640_000,  deltaArr: 95_000,   nrr: 118, status: 'Expansion', lastActivity: '3 days ago' },
  { id: 'd9',  customer: 'Reaktor',         segment: 'Mid-Market', region: 'EMEA',     arr: 260_000,  deltaArr: 42_000,   nrr: 119, status: 'Expansion', lastActivity: '2 days ago' },
  { id: 'd10', customer: 'Finley Finance',  segment: 'Mid-Market', region: 'Americas', arr: 180_000,  deltaArr: 35_000,   nrr: 122, status: 'Expansion', lastActivity: '5 days ago' },
  { id: 'd11', customer: 'Wavelength',      segment: 'Mid-Market', region: 'Americas', arr: 145_000,  deltaArr: 12_000,   nrr: 109, status: 'Healthy',   lastActivity: '6 days ago' },
  { id: 'd12', customer: 'Cinder',          segment: 'Mid-Market', region: 'APAC',     arr: 210_000,  deltaArr: 28_000,   nrr: 115, status: 'Expansion', lastActivity: '1 day ago' },
  { id: 'd13', customer: 'BrightRidge',     segment: 'Mid-Market', region: 'Americas', arr: 92_000,   deltaArr: -8_000,   nrr: 94,  status: 'At Risk',   lastActivity: '14 days ago' },
  { id: 'd14', customer: 'Pinecone Group',  segment: 'Mid-Market', region: 'EMEA',     arr: 120_000,  deltaArr: 0,        nrr: 100, status: 'Healthy',   lastActivity: '4 days ago' },
  { id: 'd15', customer: 'Lumen SMB',       segment: 'SMB',        region: 'Americas', arr: 14_400,   deltaArr: -800,     nrr: 95,  status: 'Healthy',   lastActivity: '7 days ago' },
  { id: 'd16', customer: 'Kite Studio',     segment: 'SMB',        region: 'APAC',     arr: 9_600,    deltaArr: 1_200,    nrr: 113, status: 'Healthy',   lastActivity: '2 days ago' },
];

// ==========================================================
// PERFORMANCE — Exceptions
// ==========================================================
export interface ExceptionItem {
  id: string;
  severity: 'critical' | 'warning' | 'positive';
  title: string;
  entity: string;
  impact: string;
  age: string;
  driver: string;
  owner: string;
}
export const PERF_EXCEPTIONS: ExceptionItem[] = [
  { id: 'e1', severity: 'critical', title: 'Enterprise churn cluster',           entity: 'Enterprise segment', impact: '-$2.1M ARR',    age: '3 days',    driver: 'Product-fit + pricing',       owner: 'Sue Park · VP Sales' },
  { id: 'e2', severity: 'critical', title: 'California Retail labor surge',      entity: 'LA + SF markets',    impact: '-$3.2M margin', age: '3 weeks',   driver: 'Minimum-wage adjustment',     owner: 'Carlos · West Ops' },
  { id: 'e3', severity: 'critical', title: 'Cloud egress anomaly',               entity: 'AI workload',        impact: '-$140K/mo',     age: '2 days',    driver: 'Customer data exports spike', owner: 'Jin · CTO' },
  { id: 'e4', severity: 'warning',  title: 'NRR declining 3 Q in a row',         entity: 'Global',             impact: '-7pp',          age: '1 quarter', driver: '2022 cohort renewals',        owner: 'Priya · CS' },
  { id: 'e5', severity: 'warning',  title: 'Mid-Market add-on attach below tgt', entity: 'Mid-Market',         impact: '-$0.7M ARR',    age: '4 weeks',   driver: 'Enablement gap',              owner: 'Nina · Product' },
  { id: 'e6', severity: 'positive', title: 'Northbridge expansion',              entity: 'APAC Enterprise',    impact: '+$180K ARR',    age: '1 day',     driver: 'Seat growth + new module',    owner: 'AM · APAC' },
  { id: 'e7', severity: 'positive', title: 'APAC pricing experiment',            entity: 'SMB',                impact: '+3.1pp conv',   age: '1 week',    driver: 'Tier repackaging',            owner: 'Nina · Product' },
];

// ==========================================================
// PERFORMANCE — ML Signals
// ==========================================================
export interface SignalItem {
  id: string;
  title: string;
  confidence: number;
  horizon: string;
  direction: 'up' | 'down' | 'flat';
  body: string;
  suggestedAction: string;
  model: string;
}
export const PERF_SIGNALS: SignalItem[] = [
  { id: 's1', title: 'CA Retail margin compression to accelerate', confidence: 94, horizon: 'W11 (3 days)', direction: 'down', body: 'Overtime hours 18% above plan for 3 straight weeks. Model projects -2% to -4% additional margin erosion in W11 without staffing intervention.', suggestedAction: 'Adjust shift scheduling by Thu', model: 'labor-margin-v3' },
  { id: 's2', title: 'Voltair likely to churn',                    confidence: 87, horizon: 'Q2 renewal',    direction: 'down', body: 'Silent since W5. Retention model at 28%. 3 of 4 predictive indicators flipped negative (usage, sentiment, tickets).',             suggestedAction: 'Executive outreach this week',   model: 'retention-v5' },
  { id: 's3', title: 'Enterprise expansion window opens W12',      confidence: 78, horizon: 'W12-W14',       direction: 'up',   body: '4 accounts have seat utilization >95% with budget approval cycle starting Q2. Pattern matches 2024 Q2 expansion wave.',          suggestedAction: 'Brief AMs before Friday',         model: 'expansion-v2' },
  { id: 's4', title: 'APAC price test to beat target by 15%',      confidence: 72, horizon: 'End of Q2',     direction: 'up',   body: 'Free-to-paid conversion in APAC repackaging trial at 4.8% (target 4.2%). If trend holds, segment beats plan by $0.3M.',          suggestedAction: 'Extend test to LATAM',            model: 'pricing-v1' },
  { id: 's5', title: 'Cloud storage breaks $1M/mo in W14',         confidence: 69, horizon: 'W14',           direction: 'up',   body: 'AI workload storage growing 18% WoW. At current trajectory, first time crossing $1M/month threshold.',                           suggestedAction: 'FinOps reservation strategy',     model: 'cost-forecast-v2' },
];

// ==========================================================
// PERFORMANCE — History (per-quarter)
// ==========================================================
export interface HistoryRow {
  period: string;
  revenue: number;
  plan: number;
  variance: number;
  nrr: number;
  churn: number;
  spark: number[];
  annotations?: string;
}
export const PERF_HISTORY: HistoryRow[] = [
  { period: 'Q1 FY26', revenue: 38.4, plan: 41.6, variance: -3.2, nrr: 108, churn: 3, spark: [117, 116, 115, 108], annotations: '3 Enterprise churns · CA labor surge' },
  { period: 'Q4 FY25', revenue: 39.1, plan: 38.7, variance: 0.4,  nrr: 115, churn: 1, spark: [114, 115, 115, 115] },
  { period: 'Q3 FY25', revenue: 36.8, plan: 35.9, variance: 0.9,  nrr: 116, churn: 1, spark: [115, 116, 116, 116] },
  { period: 'Q2 FY25', revenue: 34.5, plan: 34.0, variance: 0.5,  nrr: 117, churn: 0, spark: [116, 116, 117, 117] },
  { period: 'Q1 FY25', revenue: 32.1, plan: 32.4, variance: -0.3, nrr: 116, churn: 1, spark: [115, 115, 116, 116] },
  { period: 'Q4 FY24', revenue: 30.8, plan: 29.9, variance: 0.9,  nrr: 115, churn: 0, spark: [113, 114, 114, 115] },
  { period: 'Q3 FY24', revenue: 28.4, plan: 28.6, variance: -0.2, nrr: 114, churn: 0, spark: [112, 113, 113, 114] },
  { period: 'Q2 FY24', revenue: 27.1, plan: 26.5, variance: 0.6,  nrr: 113, churn: 1, spark: [111, 112, 112, 113] },
];

// ==========================================================
// MARGIN — Waterfall (Gross Margin bridge)
// ==========================================================
export interface WaterfallStep {
  label: string;
  value: number;
  kind: 'start' | 'end' | 'positive' | 'negative';
}
export const MARGIN_WATERFALL: WaterfallStep[] = [
  { label: 'GM Q4 FY25',          value: 63.2, kind: 'start' },
  { label: 'Price',                value: 0.4,  kind: 'positive' },
  { label: 'Volume',               value: 0.2,  kind: 'positive' },
  { label: 'Mix shift',            value: -0.6, kind: 'negative' },
  { label: 'Component inflation',  value: -0.9, kind: 'negative' },
  { label: 'Scale leverage',       value: 0.3,  kind: 'positive' },
  { label: 'FX',                   value: -0.1, kind: 'negative' },
  { label: 'One-time (NPI)',       value: -0.2, kind: 'negative' },
  { label: 'GM Q1 FY26',           value: 62.3, kind: 'end' },
];

// ==========================================================
// MARGIN — Product Mix
// ==========================================================
export interface ProductMixRow {
  product: string;
  revenue: number;
  share: number;
  gm: number;
  gmDelta: number;
  contribution: number;
}
export const MARGIN_PRODUCT_MIX: ProductMixRow[] = [
  { product: 'iPhone',    revenue: 48.6, share: 52.3, gm: 42.1, gmDelta: -0.3, contribution: 22.0 },
  { product: 'Services',  revenue: 21.4, share: 23.0, gm: 72.9, gmDelta: 1.1,  contribution: 16.8 },
  { product: 'Mac',       revenue: 11.2, share: 12.1, gm: 42.1, gmDelta: -1.4, contribution: 5.1  },
  { product: 'Wearables', revenue: 8.4,  share: 9.0,  gm: 35.8, gmDelta: -2.8, contribution: 3.2  },
  { product: 'iPad',      revenue: 3.3,  share: 3.6,  gm: 40.5, gmDelta: -0.2, contribution: 1.5  },
];

// ==========================================================
// MARGIN — Cost Decomposition
// ==========================================================
export interface CostRow {
  category: string;
  amount: number;
  shareOfCogs: number;
  qoqDelta: number;
  tone: 'neg' | 'pos' | 'warn' | 'flat';
  commentary: string;
}
export const MARGIN_COSTS: CostRow[] = [
  { category: 'Components (memory, displays)', amount: 1240, shareOfCogs: 34.8, qoqDelta: 62,  tone: 'neg',  commentary: 'Spot pricing spike on NAND + OLED panels' },
  { category: 'Direct labor',                  amount: 620,  shareOfCogs: 17.4, qoqDelta: 14,  tone: 'warn', commentary: 'CA minimum-wage adjustment + OT' },
  { category: 'Freight & logistics',           amount: 290,  shareOfCogs: 8.1,  qoqDelta: -8,  tone: 'pos',  commentary: 'Port congestion easing; ocean rates normalized' },
  { category: 'Warranty & returns',            amount: 180,  shareOfCogs: 5.1,  qoqDelta: 5,   tone: 'warn', commentary: 'Wearables first-90-day returns elevated' },
  { category: 'Packaging',                     amount: 105,  shareOfCogs: 2.9,  qoqDelta: 2,   tone: 'flat', commentary: 'In line with volume' },
  { category: 'Software royalties',            amount: 240,  shareOfCogs: 6.7,  qoqDelta: 11,  tone: 'warn', commentary: 'Mix shift toward premium apps' },
  { category: 'Cloud infrastructure',          amount: 380,  shareOfCogs: 10.7, qoqDelta: 34,  tone: 'neg',  commentary: 'AI workload storage & compute growth' },
  { category: 'Overhead & facilities',         amount: 510,  shareOfCogs: 14.3, qoqDelta: 4,   tone: 'flat', commentary: 'Steady' },
];

// ==========================================================
// MARGIN — Sensitivity scenarios
// ==========================================================
export interface SensitivityScenario {
  id: string;
  name: string;
  lever: string;
  change: string;
  gmImpact: string;
  omImpact: string;
  epsImpact: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  body: string;
}
export const MARGIN_SENSITIVITY: SensitivityScenario[] = [
  { id: 'sc1', name: 'Component renegotiation',  lever: 'Memory supplier contract', change: '-8% unit price', gmImpact: '+0.6pp', omImpact: '+0.5pp', epsImpact: '+$0.14', confidence: 82, risk: 'medium', body: 'Memory supplier willing to extend 18-month commitment for volume guarantee. 3-way bake-off feasible.' },
  { id: 'sc2', name: 'CA staffing +120 FTEs',    lever: 'West Region headcount',   change: '+120 FTE',         gmImpact: '+0.3pp', omImpact: '+0.2pp', epsImpact: '+$0.05', confidence: 74, risk: 'low',    body: 'Reduces OT 62%. Recovers 2.3pp margin in CA Retail by W13. Breakeven in Q2.' },
  { id: 'sc3', name: 'Wearables price +3%',      lever: 'Flagship pricing',        change: '+3% ASP',          gmImpact: '+0.9pp', omImpact: '+0.7pp', epsImpact: '+$0.21', confidence: 48, risk: 'high',   body: 'Elasticity uncertain in current demand environment. Could accelerate mix shift away from premium.' },
  { id: 'sc4', name: 'Cloud reservation',        lever: 'FinOps commitment',       change: '60-day reserve',   gmImpact: '+0.2pp', omImpact: '+0.2pp', epsImpact: '+$0.04', confidence: 91, risk: 'low',    body: 'AWS/GCP commitment discount on stable workloads. $180K/mo savings. Zero operational risk.' },
  { id: 'sc5', name: 'Services tier restructure',lever: 'Subscription packaging',  change: 'New Pro+ tier',    gmImpact: '+0.4pp', omImpact: '+0.4pp', epsImpact: '+$0.09', confidence: 65, risk: 'medium', body: 'Early signal from APAC trial positive. Broader rollout carries execution risk and possible cannibalization.' },
];

// ==========================================================
// FLUX — Income Statement (line-by-line flux)
// ==========================================================
export interface FluxRow {
  id: string;
  line: string;
  current: number;
  prior: number;
  variance: number;
  variancePct: number;
  material: boolean;
  status: 'unreviewed' | 'reviewed' | 'auto-closed';
  owner: string;
  driver?: string;
  section: string;
}
export const FLUX_IS: FluxRow[] = [
  { id: 'is1',  line: 'Product Revenue',          current: 720, prior: 696, variance: 24,  variancePct: 3.4,   material: true,  status: 'reviewed',    owner: 'Revenue', driver: 'iPhone launch cycle',      section: 'Revenue' },
  { id: 'is2',  line: 'Services Revenue',         current: 214, prior: 200, variance: 14,  variancePct: 7.0,   material: true,  status: 'reviewed',    owner: 'Revenue', driver: 'Subscription mix shift up', section: 'Revenue' },
  { id: 'is3',  line: 'Total Revenue',            current: 934, prior: 896, variance: 38,  variancePct: 4.2,   material: true,  status: 'auto-closed', owner: 'Revenue',                                     section: 'Revenue' },
  { id: 'is4',  line: 'Cost of Product Revenue',  current: 420, prior: 396, variance: 24,  variancePct: 6.1,   material: true,  status: 'unreviewed',  owner: 'OpEx',    driver: 'Component inflation',      section: 'COGS' },
  { id: 'is5',  line: 'Cost of Services Revenue', current: 60,  prior: 56,  variance: 4,   variancePct: 7.1,   material: false, status: 'auto-closed', owner: 'OpEx',                                        section: 'COGS' },
  { id: 'is6',  line: 'Total Cost of Revenue',    current: 480, prior: 452, variance: 28,  variancePct: 6.2,   material: true,  status: 'unreviewed',  owner: 'OpEx',                                        section: 'COGS' },
  { id: 'is7',  line: 'Gross Profit',             current: 454, prior: 444, variance: 10,  variancePct: 2.3,   material: true,  status: 'auto-closed', owner: 'Revenue',                                     section: 'Gross Profit' },
  { id: 'is8',  line: 'Research & Development',   current: 205, prior: 188, variance: 17,  variancePct: 9.0,   material: true,  status: 'unreviewed',  owner: 'OpEx',    driver: 'AI silicon R&D + HC +180', section: 'OpEx' },
  { id: 'is9',  line: 'Sales, General & Admin',   current: 128, prior: 120, variance: 8,   variancePct: 6.7,   material: true,  status: 'reviewed',    owner: 'OpEx',    driver: 'Incremental demand gen',   section: 'OpEx' },
  { id: 'is10', line: 'Total OpEx',               current: 333, prior: 308, variance: 25,  variancePct: 8.1,   material: true,  status: 'unreviewed',  owner: 'OpEx',                                        section: 'OpEx' },
  { id: 'is11', line: 'Operating Income',         current: 121, prior: 136, variance: -15, variancePct: -11.0, material: true,  status: 'unreviewed',  owner: 'Consol',                                      section: 'Operating Income' },
  { id: 'is12', line: 'Other Income / (Expense)', current: 4,   prior: 2,   variance: 2,   variancePct: 100.0, material: false, status: 'auto-closed', owner: 'Treasury',                                    section: 'Non-Op' },
  { id: 'is13', line: 'Pretax Income',            current: 125, prior: 138, variance: -13, variancePct: -9.4,  material: true,  status: 'unreviewed',  owner: 'Consol',                                      section: 'Pretax' },
  { id: 'is14', line: 'Tax Provision',            current: 22,  prior: 25,  variance: -3,  variancePct: -12.0, material: false, status: 'reviewed',    owner: 'Tax',                                         section: 'Tax' },
  { id: 'is15', line: 'Net Income',               current: 103, prior: 113, variance: -10, variancePct: -8.8,  material: true,  status: 'unreviewed',  owner: 'Consol',                                      section: 'Net Income' },
];

// ==========================================================
// FLUX — Balance Sheet
// ==========================================================
export const FLUX_BS: FluxRow[] = [
  { id: 'bs1',  line: 'Cash & equivalents',           current: 48_200,  prior: 51_400,  variance: -3_200, variancePct: -6.2, material: true,  status: 'reviewed',    owner: 'Treasury', driver: 'Capex + share buybacks', section: 'Current Assets' },
  { id: 'bs2',  line: 'Short-term investments',       current: 32_100,  prior: 30_800,  variance: 1_300,  variancePct: 4.2,  material: true,  status: 'reviewed',    owner: 'Treasury',                                   section: 'Current Assets' },
  { id: 'bs3',  line: 'Accounts Receivable',          current: 24_100,  prior: 22_000,  variance: 2_100,  variancePct: 9.5,  material: true,  status: 'unreviewed',  owner: 'AR',       driver: 'DSO up 4 days',          section: 'Current Assets' },
  { id: 'bs4',  line: 'Inventory',                    current: 8_400,   prior: 7_600,   variance: 800,    variancePct: 10.5, material: true,  status: 'unreviewed',  owner: 'Supply',   driver: 'NPI build-ahead',        section: 'Current Assets' },
  { id: 'bs5',  line: 'Prepaid & other current',      current: 14_200,  prior: 13_800,  variance: 400,    variancePct: 2.9,  material: false, status: 'auto-closed', owner: 'Consol',                                     section: 'Current Assets' },
  { id: 'bs6',  line: 'Property, Plant & Equipment',  current: 44_800,  prior: 43_100,  variance: 1_700,  variancePct: 3.9,  material: true,  status: 'reviewed',    owner: 'Consol',   driver: 'DC buildout',            section: 'Non-Current' },
  { id: 'bs7',  line: 'Goodwill & intangibles',       current: 12_600,  prior: 12_600,  variance: 0,      variancePct: 0,    material: false, status: 'auto-closed', owner: 'Consol',                                     section: 'Non-Current' },
  { id: 'bs8',  line: 'Long-term investments',        current: 108_400, prior: 106_200, variance: 2_200,  variancePct: 2.1,  material: true,  status: 'reviewed',    owner: 'Treasury',                                   section: 'Non-Current' },
  { id: 'bs9',  line: 'Accounts Payable',             current: 56_200,  prior: 54_100,  variance: 2_100,  variancePct: 3.9,  material: true,  status: 'unreviewed',  owner: 'AP',       driver: 'Component orders',       section: 'Current Liabilities' },
  { id: 'bs10', line: 'Deferred Revenue',             current: 24_100,  prior: 23_400,  variance: 700,    variancePct: 3.0,  material: false, status: 'auto-closed', owner: 'Revenue',                                    section: 'Current Liabilities' },
  { id: 'bs11', line: 'Accrued Liabilities',          current: 51_800,  prior: 50_000,  variance: 1_800,  variancePct: 3.6,  material: true,  status: 'reviewed',    owner: 'Consol',                                     section: 'Current Liabilities' },
  { id: 'bs12', line: 'Long-term Debt',               current: 98_200,  prior: 99_500,  variance: -1_300, variancePct: -1.3, material: false, status: 'auto-closed', owner: 'Treasury', driver: 'Scheduled amortization', section: 'Non-Current Liabilities' },
  { id: 'bs13', line: "Total Stockholders' Equity",   current: 62_500,  prior: 60_500,  variance: 2_000,  variancePct: 3.3,  material: true,  status: 'reviewed',    owner: 'Consol',                                     section: 'Equity' },
];

// ==========================================================
// FLUX — Cash Flow
// ==========================================================
export const FLUX_CF: FluxRow[] = [
  { id: 'cf1',  line: 'Net Income',                   current: 103,  prior: 113, variance: -10, variancePct: -8.8,  material: true,  status: 'auto-closed', owner: 'Consol',                                       section: 'Operating' },
  { id: 'cf2',  line: 'D&A',                          current: 74,   prior: 71,  variance: 3,   variancePct: 4.2,   material: false, status: 'auto-closed', owner: 'Consol',                                       section: 'Operating' },
  { id: 'cf3',  line: 'Stock-based Compensation',     current: 32,   prior: 30,  variance: 2,   variancePct: 6.7,   material: false, status: 'auto-closed', owner: 'Consol',                                       section: 'Operating' },
  { id: 'cf4',  line: 'Δ Working Capital',            current: -48,  prior: -22, variance: -26, variancePct: 118.2, material: true,  status: 'unreviewed',  owner: 'Treasury', driver: 'AR + Inventory build',     section: 'Operating' },
  { id: 'cf5',  line: 'Other operating',              current: 12,   prior: 14,  variance: -2,  variancePct: -14.3, material: false, status: 'auto-closed', owner: 'Consol',                                       section: 'Operating' },
  { id: 'cf6',  line: 'Cash from Operations',         current: 173,  prior: 206, variance: -33, variancePct: -16.0, material: true,  status: 'unreviewed',  owner: 'Treasury',                                     section: 'Operating' },
  { id: 'cf7',  line: 'Capital Expenditure',          current: -62,  prior: -48, variance: -14, variancePct: 29.2,  material: true,  status: 'reviewed',    owner: 'Treasury', driver: 'DC buildout accelerating', section: 'Investing' },
  { id: 'cf8',  line: 'Acquisitions',                 current: 0,    prior: -20, variance: 20,  variancePct: -100,  material: false, status: 'auto-closed', owner: 'Treasury',                                     section: 'Investing' },
  { id: 'cf9',  line: 'Net purchases of investments', current: -22,  prior: -18, variance: -4,  variancePct: 22.2,  material: false, status: 'auto-closed', owner: 'Treasury',                                     section: 'Investing' },
  { id: 'cf10', line: 'Cash from Investing',          current: -84,  prior: -86, variance: 2,   variancePct: -2.3,  material: false, status: 'auto-closed', owner: 'Treasury',                                     section: 'Investing' },
  { id: 'cf11', line: 'Share buybacks',               current: -80,  prior: -60, variance: -20, variancePct: 33.3,  material: true,  status: 'reviewed',    owner: 'Treasury', driver: 'Accelerated buyback',      section: 'Financing' },
  { id: 'cf12', line: 'Dividends',                    current: -14,  prior: -14, variance: 0,   variancePct: 0,     material: false, status: 'auto-closed', owner: 'Treasury',                                     section: 'Financing' },
  { id: 'cf13', line: 'Debt repayment',               current: -13,  prior: -12, variance: -1,  variancePct: 8.3,   material: false, status: 'auto-closed', owner: 'Treasury',                                     section: 'Financing' },
  { id: 'cf14', line: 'Cash from Financing',          current: -107, prior: -86, variance: -21, variancePct: 24.4,  material: true,  status: 'unreviewed',  owner: 'Treasury',                                     section: 'Financing' },
  { id: 'cf15', line: 'Net Change in Cash',           current: -18,  prior: 34,  variance: -52, variancePct: -152.9,material: true,  status: 'unreviewed',  owner: 'Treasury',                                     section: 'Bridge' },
  { id: 'cf16', line: 'Free Cash Flow',               current: 111,  prior: 158, variance: -47, variancePct: -29.7, material: true,  status: 'unreviewed',  owner: 'Treasury',                                     section: 'Bridge' },
];

export interface ReconItem {
  id: string;
  name: string;
  owner: string;
  gl: number;
  sub: number;
  variance: number;
  status: 'matched' | 'variance' | 'open';
  material: boolean;
}
export const RECONS: ReconItem[] = [
  { id: 'r1', name: 'AR Aging',           owner: 'Maya G.', gl: 3_240_000, sub: 3_382_000, variance: -142_000, status: 'variance', material: true },
  { id: 'r2', name: 'Bank — Operating',   owner: 'Maya G.', gl: 12_500_000, sub: 12_500_000, variance: 0,       status: 'matched',  material: false },
  { id: 'r3', name: 'Bank — Payroll',     owner: 'Raj P.', gl: 2_100_000, sub: 2_100_000, variance: 0,       status: 'matched',  material: false },
  { id: 'r4', name: 'Intercompany',       owner: 'Raj P.', gl: 8_400_000, sub: 8_382_000, variance: 18_000,  status: 'variance', material: false },
  { id: 'r5', name: 'FX Remeasurement',   owner: 'Raj P.', gl: 620_000,   sub: 548_000,  variance: 72_000,  status: 'variance', material: true },
  { id: 'r6', name: 'Accrued Payroll',    owner: 'Nina T.', gl: 4_820_000, sub: 4_820_000, variance: 0,      status: 'matched',  material: false },
  { id: 'r7', name: 'Deferred Revenue',   owner: 'Nina T.', gl: 24_100_000, sub: 24_100_000, variance: 0,    status: 'matched',  material: false },
  { id: 'r8', name: 'Inventory',          owner: 'Kai L.', gl: 18_200_000, sub: 18_145_000, variance: 55_000, status: 'variance', material: true },
];

// ==========================================================================
// PERFORMANCE — per-region data slices
// Each region shows its own KPIs, commentary, and chart on the Analysis tab.
// ==========================================================================
export interface RegionalSlice {
  statusChip: { kind: 'neg' | 'warn' | 'pos' | 'info'; text: string };
  kpis: Kpi[];
  commentary: CommentaryItem[];
  chart: ChartBar[];
  chartTitle: string;
}
export const PERF_REGIONAL: Record<string, RegionalSlice> = {
  global: {
    statusChip: { kind: 'neg', text: 'Variance flagged · action recommended' },
    kpis: [
      { lbl: 'Net Revenue Retention', val: '108%',  delta: '▼ 7pp vs prior Q',    tone: 'neg' },
      { lbl: 'New ARR',                val: '$4.2M', delta: '▲ 12% vs plan',       tone: 'pos' },
      { lbl: 'Gross Margin',           val: '78.4%', delta: '▼ 1.2pp vs prior Q', tone: 'neg' },
    ],
    commentary: PERF_COMMENTARY,
    chart: PERF_CHART,
    chartTitle: 'Weekly Revenue Variance — Global',
  },
  americas: {
    statusChip: { kind: 'neg', text: 'Epicenter · 3 Enterprise churns + CA labor' },
    kpis: [
      { lbl: 'Americas NRR',           val: '104%',   delta: '▼ 9pp vs prior Q', tone: 'neg' },
      { lbl: 'Americas ARR Δ',         val: '-$1.8M', delta: '▼ $1.8M vs plan',  tone: 'neg' },
      { lbl: 'Retail Margin',          val: '75.6%',  delta: '▼ 2.8pp QoQ',       tone: 'neg' },
    ],
    commentary: [
      {
        rank: 1, name: 'California Retail', delta: '-$1.6M vs Plan',
        text: 'Labor-cost surge in LA/SF markets following minimum-wage increase. Overtime hours 18% above plan. Margin compression accelerating — similar pattern to 2024 Q1 NY wage adjustment. Partial offset from productivity automation rollout.',
        tags: [{ t: 'red', l: 'Labor cost surge' }, { t: 'amber', l: 'Historical match NY Q1 2024' }, { t: 'blue', l: 'Predictive flag' }],
      },
      {
        rank: 2, name: 'Enterprise churn cluster', delta: '-$1.35M vs Plan',
        text: 'Acme Corp ($800K) + DataStar ($550K) churned in Q1. Both cited product-fit and pricing. Renewal risk model flags Voltair ($680K) + Parkline ($480K) as next.',
        tags: [{ t: 'red', l: 'Churn spike' }, { t: 'blue', l: 'Predictive flag' }],
      },
      {
        rank: 3, name: 'Texas Energy', delta: '-$0.3M vs Plan',
        text: 'Natural-gas spot price drop 18% WoW. Revenue per unit compressed across Permian Basin operations. Hedging program covered 60% of exposure.',
        tags: [{ t: 'amber', l: 'Commodity exposure' }, { t: 'blue', l: 'Hedge partial cover' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 54, p: 58, tone: 'warn' },
      { w: 'W7',   a: 52, p: 58, tone: 'warn' },
      { w: 'W8',   a: 48, p: 58, tone: 'neg' },
      { w: 'W9',   a: 44, p: 58, tone: 'neg' },
      { w: 'W10',  a: 40, p: 58, tone: 'neg' },
      { w: 'W11▸', a: 38, p: 58, tone: 'neg', forecast: true },
    ],
    chartTitle: 'Weekly Revenue Variance — Americas',
  },
  emea: {
    statusChip: { kind: 'info', text: 'Mixed · GlobalTech churn offset by expansion' },
    kpis: [
      { lbl: 'EMEA NRR',              val: '112%',   delta: '▼ 3pp vs prior Q', tone: 'warn' },
      { lbl: 'EMEA ARR Δ',            val: '+$0.2M', delta: '▲ $0.2M vs plan',  tone: 'pos' },
      { lbl: 'EMEA Gross Margin',     val: '79.8%',  delta: '▲ 0.4pp QoQ',       tone: 'pos' },
    ],
    commentary: [
      {
        rank: 1, name: 'UK Financial Services', delta: '+$0.7M vs Plan',
        text: 'London trading desks captured volatility in W9–W10; Q1 advisory pipeline converting 3 weeks ahead of schedule. Northbridge-style seat expansion playbook working.',
        tags: [{ t: 'green', l: 'Trading outperformance' }, { t: 'green', l: 'Pipeline acceleration' }],
      },
      {
        rank: 2, name: 'GlobalTech churn', delta: '-$0.75M vs Plan',
        text: 'Germany-based Enterprise account cited consolidation of vendor stack. No further at-risk German accounts flagged this quarter.',
        tags: [{ t: 'red', l: 'Churn' }, { t: 'blue', l: 'Isolated' }],
      },
      {
        rank: 3, name: 'Nordics SMB', delta: '+$0.25M vs Plan',
        text: 'Self-serve signups in Sweden and Finland 14% ahead of plan. Free-to-paid conversion steady at 4.4%.',
        tags: [{ t: 'green', l: 'Self-serve' }, { t: 'blue', l: 'Conversion healthy' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 41, p: 40, tone: 'pos' },
      { w: 'W7',   a: 42, p: 40, tone: 'pos' },
      { w: 'W8',   a: 43, p: 40, tone: 'pos' },
      { w: 'W9',   a: 44, p: 40, tone: 'pos' },
      { w: 'W10',  a: 41, p: 40, tone: 'pos' },
      { w: 'W11▸', a: 42, p: 40, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Weekly Revenue Variance — EMEA',
  },
  apac: {
    statusChip: { kind: 'pos', text: 'Expansion momentum · Northbridge leads' },
    kpis: [
      { lbl: 'APAC NRR',              val: '121%',   delta: '▲ 2pp vs prior Q', tone: 'pos' },
      { lbl: 'APAC ARR Δ',            val: '-$0.5M', delta: '▼ $0.5M vs plan',  tone: 'warn' },
      { lbl: 'APAC Gross Margin',     val: '80.1%',  delta: '▲ 1.1pp QoQ',       tone: 'pos' },
    ],
    commentary: [
      {
        rank: 1, name: 'Northbridge expansion', delta: '+$0.18M vs Plan',
        text: 'Seat growth and new-module adoption. Pattern suggests 3 more APAC Enterprise accounts may follow. AM team briefed.',
        tags: [{ t: 'green', l: 'Expansion' }, { t: 'green', l: 'Seat utilization' }],
      },
      {
        rank: 2, name: 'Singapore & Tokyo SaaS', delta: '+$0.32M vs Plan',
        text: 'Regional cohort renewing at 127% NRR — best-performing Enterprise cohort in the portfolio. New-logo pipeline also strong.',
        tags: [{ t: 'green', l: 'Renewal strength' }],
      },
      {
        rank: 3, name: 'APAC Pricing experiment', delta: '+$0.12M vs Plan',
        text: 'SMB free-to-paid conversion in APAC trial at 4.8% (target 4.2%). If trend holds, segment beats plan by $0.3M.',
        tags: [{ t: 'blue', l: 'Pricing test' }, { t: 'green', l: 'Early signal' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 22, p: 21, tone: 'pos' },
      { w: 'W7',   a: 23, p: 21, tone: 'pos' },
      { w: 'W8',   a: 22, p: 21, tone: 'pos' },
      { w: 'W9',   a: 20, p: 21, tone: 'warn' },
      { w: 'W10',  a: 19, p: 21, tone: 'warn' },
      { w: 'W11▸', a: 24, p: 21, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Weekly Revenue Variance — APAC',
  },
  latam: {
    statusChip: { kind: 'warn', text: 'Timing-mixed · FX headwind' },
    kpis: [
      { lbl: 'LATAM NRR',              val: '106%',   delta: '▼ 5pp vs prior Q', tone: 'warn' },
      { lbl: 'LATAM ARR Δ',            val: '-$0.3M', delta: '▼ $0.3M vs plan',  tone: 'warn' },
      { lbl: 'LATAM Gross Margin',     val: '74.2%',  delta: '▼ 0.6pp QoQ',       tone: 'warn' },
    ],
    commentary: [
      {
        rank: 1, name: 'Brazil FX impact', delta: '-$0.2M vs Plan',
        text: 'BRL devalued 6% over the period. USD-reporting revenue compressed despite strong local-currency growth. Hedge program covers 40% of exposure.',
        tags: [{ t: 'amber', l: 'FX' }, { t: 'blue', l: 'Partial hedge' }],
      },
      {
        rank: 2, name: 'Mexico SMB momentum', delta: '+$0.15M vs Plan',
        text: 'Mexican peso stable; self-serve signups up 22% QoQ. Product-market fit strongest in mid-cap retail vertical.',
        tags: [{ t: 'green', l: 'Self-serve' }],
      },
      {
        rank: 3, name: 'Argentina stall', delta: '-$0.1M vs Plan',
        text: 'Macro slowdown affecting enterprise budget approvals. Pipeline conversion from opportunity to closed-won dropped from 24% to 16%.',
        tags: [{ t: 'amber', l: 'Macro' }, { t: 'red', l: 'Conversion drop' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 14, p: 15, tone: 'warn' },
      { w: 'W7',   a: 13, p: 15, tone: 'warn' },
      { w: 'W8',   a: 14, p: 15, tone: 'warn' },
      { w: 'W9',   a: 13, p: 15, tone: 'warn' },
      { w: 'W10',  a: 12, p: 15, tone: 'neg' },
      { w: 'W11▸', a: 13, p: 15, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Revenue Variance — LATAM',
  },
};

// ==========================================================================
// PERFORMANCE — comparison-aware delta labels
// Adjusts only the `delta` string on each KPI based on the compare selection.
// ==========================================================================
const COMPARE_DELTA_MAP: Record<string, (orig: string, kpiLabel: string) => string> = {
  plan:     (orig) => orig, // default phrasing already says "vs plan"/"vs prior Q"
  priorwk:  (_orig, lbl) => lbl.includes('NRR') ? '▲ 0.3pp WoW' : lbl.includes('ARR') ? '▲ 1.2% WoW' : '▼ 0.2pp WoW',
  prioryr:  (_orig, lbl) => lbl.includes('NRR') ? '▼ 9pp YoY' : lbl.includes('ARR') ? '▼ 6% YoY' : '▼ 0.9pp YoY',
  forecast: (_orig, lbl) => lbl.includes('NRR') ? '▲ 1pp vs forecast' : lbl.includes('ARR') ? '▲ $0.1M vs forecast' : 'in line with forecast',
  runrate:  (_orig, lbl) => lbl.includes('NRR') ? '▼ 2pp vs run rate' : lbl.includes('ARR') ? '▼ 3% vs run rate' : '▼ 0.4pp vs run rate',
};
export function adjustKpisByCompare(kpis: Kpi[], compareKey: string): Kpi[] {
  const fn = COMPARE_DELTA_MAP[compareKey] ?? COMPARE_DELTA_MAP.plan;
  return kpis.map(k => ({ ...k, delta: fn(k.delta, k.lbl) }));
}

// ==========================================================================
// PERFORMANCE — driver filter for commentary
// Matches a driver key to a rough keyword search in commentary item names/tags.
// ==========================================================================
const DRIVER_KEYWORDS: Record<string, string[]> = {
  enterprise: ['enterprise', 'churn'],
  midmarket:  ['mid-market', 'midmarket'],
  expansion:  ['expansion', 'northbridge', 'renewal'],
  cloud:      ['cloud', 'infrastructure', 'cloud infrastructure'],
  services:   ['professional services', 'services'],
};
export function filterCommentaryByDriver(items: CommentaryItem[], driverKey: string | null): CommentaryItem[] {
  if (!driverKey) return items;
  const kws = DRIVER_KEYWORDS[driverKey] ?? [driverKey];
  const match = (s: string) => kws.some(kw => s.toLowerCase().includes(kw));
  const filtered = items.filter(it => match(it.name) || match(it.text) || it.tags.some(t => match(t.l)));
  return filtered.length ? filtered : items; // never return empty — fall back to all
}

// ==========================================================================
// MARGIN — per-product data slices
// ==========================================================================
export interface ProductSlice {
  kpis: Kpi[];
  waterfall: WaterfallStep[];
  commentary: CommentaryItem[];
  statusChip: { kind: 'neg' | 'warn' | 'pos' | 'info'; text: string };
}
export const MARGIN_BY_PRODUCT: Record<string, ProductSlice> = {
  all: {
    statusChip: { kind: 'warn', text: 'Mix compression · watch Wearables' },
    kpis: MARGIN_KPIS,
    waterfall: MARGIN_WATERFALL,
    commentary: MARGIN_COMMENTARY,
  },
  iphone: {
    statusChip: { kind: 'warn', text: 'Launch volume ↑ · component cost ↑' },
    kpis: [
      { lbl: 'iPhone Gross Margin',   val: '42.1%', delta: '▼ 0.3pp QoQ',  tone: 'neg' },
      { lbl: 'iPhone Revenue',         val: '$48.6B', delta: '▲ 6.4% QoQ',  tone: 'pos' },
      { lbl: 'iPhone Unit Cost',       val: '$412',  delta: '▲ 2.1% QoQ',  tone: 'neg' },
    ],
    waterfall: [
      { label: 'iPhone GM Q4',          value: 42.4, kind: 'start' },
      { label: 'Volume',                 value: 0.6,  kind: 'positive' },
      { label: 'Component inflation',    value: -0.8, kind: 'negative' },
      { label: 'Launch mix',             value: 0.4,  kind: 'positive' },
      { label: 'Warranty',               value: -0.3, kind: 'negative' },
      { label: 'Scale leverage',         value: 0.3,  kind: 'positive' },
      { label: 'FX',                     value: -0.1, kind: 'negative' },
      { label: 'Mfg efficiency',         value: -0.4, kind: 'negative' },
      { label: 'iPhone GM Q1',           value: 42.1, kind: 'end' },
    ],
    commentary: [
      {
        rank: 1, name: 'Component inflation', delta: '-0.8pp',
        text: 'NAND memory spot pricing up 14% QoQ; OLED panels up 8%. Direct hit to COGS before any mitigation.',
        tags: [{ t: 'red', l: 'Memory' }, { t: 'red', l: 'OLED' }],
      },
      {
        rank: 2, name: 'Launch volume tailwind', delta: '+0.6pp',
        text: 'New model ramp 12% above expectations. Scale leverage partially offsets component headwind.',
        tags: [{ t: 'green', l: 'Ramp ↑' }],
      },
      {
        rank: 3, name: 'Mfg efficiency', delta: '-0.4pp',
        text: 'First-90-day yield on new silicon below target (94% vs 97% goal). Expected recovery in Q2.',
        tags: [{ t: 'amber', l: 'Yield' }, { t: 'blue', l: 'Q2 recovery' }],
      },
    ],
  },
  mac: {
    statusChip: { kind: 'warn', text: 'Silicon ramp + memory pricing' },
    kpis: [
      { lbl: 'Mac Gross Margin',      val: '42.1%',  delta: '▼ 1.4pp QoQ',  tone: 'neg' },
      { lbl: 'Mac Revenue',            val: '$11.2B', delta: '▼ 2.1% QoQ',  tone: 'neg' },
      { lbl: 'Inventory DOH',          val: '31 days', delta: '▲ 4 days',   tone: 'warn' },
    ],
    waterfall: [
      { label: 'Mac GM Q4',             value: 43.5, kind: 'start' },
      { label: 'Memory pricing',         value: -0.9, kind: 'negative' },
      { label: 'Silicon ramp',           value: -0.5, kind: 'negative' },
      { label: 'Mix to Pro',             value: 0.3,  kind: 'positive' },
      { label: 'Freight',                value: 0.2,  kind: 'positive' },
      { label: 'Refresh inventory',      value: -0.4, kind: 'negative' },
      { label: 'FX',                     value: -0.1, kind: 'negative' },
      { label: 'Mac GM Q1',              value: 42.1, kind: 'end' },
    ],
    commentary: [
      {
        rank: 1, name: 'Memory & SSD pricing', delta: '-0.9pp',
        text: 'Elevated NAND/DRAM spot pricing disproportionately hits Mac BOM versus other product lines. No active hedge.',
        tags: [{ t: 'red', l: 'Memory pricing' }, { t: 'amber', l: 'No hedge' }],
      },
      {
        rank: 2, name: 'Silicon transition yields', delta: '-0.5pp',
        text: 'New silicon ramp on schedule; yields below target for first 90 days, expected to normalize in Q2.',
        tags: [{ t: 'amber', l: 'Silicon ramp' }, { t: 'blue', l: 'Q2 recovery' }],
      },
      {
        rank: 3, name: 'Refresh cycle inventory', delta: '-0.4pp',
        text: 'Older-gen inventory requires promotional discounting to clear. DOH up 4 days.',
        tags: [{ t: 'amber', l: 'Inventory' }],
      },
    ],
  },
  services: {
    statusChip: { kind: 'pos', text: 'Mix shift tailwind · subscriptions ↑' },
    kpis: [
      { lbl: 'Services Gross Margin',  val: '72.9%',  delta: '▲ 1.1pp QoQ',  tone: 'pos' },
      { lbl: 'Services Revenue',        val: '$21.4B', delta: '▲ 8.4% QoQ',  tone: 'pos' },
      { lbl: 'Subscription Mix',        val: '68%',    delta: '▲ 3pp QoQ',   tone: 'pos' },
    ],
    waterfall: [
      { label: 'Services GM Q4',        value: 71.8, kind: 'start' },
      { label: 'Subscription mix ↑',    value: 0.9,  kind: 'positive' },
      { label: 'Scale leverage',         value: 0.4,  kind: 'positive' },
      { label: 'App Store rate cut',     value: -0.3, kind: 'negative' },
      { label: 'Cloud COGS',             value: -0.2, kind: 'negative' },
      { label: 'Content rights',         value: 0.1,  kind: 'positive' },
      { label: 'FX',                     value: 0.2,  kind: 'positive' },
      { label: 'Services GM Q1',         value: 72.9, kind: 'end' },
    ],
    commentary: [
      {
        rank: 1, name: 'Higher-tier subscription growth', delta: '+0.9pp',
        text: 'Pro+ and Family tier subscribers growing 22% YoY — rich-mix tailwind compounds quarter over quarter.',
        tags: [{ t: 'green', l: 'Mix shift' }, { t: 'green', l: 'Pro+ tier' }],
      },
      {
        rank: 2, name: 'Cloud infra leverage', delta: '+0.4pp',
        text: 'Unit cloud cost per active user down 11% on scale + reservation mix.',
        tags: [{ t: 'green', l: 'Scale leverage' }],
      },
      {
        rank: 3, name: 'App Store rate reduction', delta: '-0.3pp',
        text: 'Small-developer rate reduced to 15%. Limited blended impact given mix of large vs small devs.',
        tags: [{ t: 'amber', l: 'Rate cut' }],
      },
    ],
  },
  wearables: {
    statusChip: { kind: 'neg', text: 'Margin compression · supplier renegotiation pending' },
    kpis: [
      { lbl: 'Wearables Gross Margin', val: '35.8%', delta: '▼ 2.8pp QoQ',  tone: 'neg' },
      { lbl: 'Wearables Revenue',       val: '$8.4B', delta: '▼ 4.0% QoQ',  tone: 'neg' },
      { lbl: 'Return Rate',             val: '3.8%',  delta: '▲ 0.7pp QoQ',  tone: 'warn' },
    ],
    waterfall: [
      { label: 'Wearables GM Q4',       value: 38.6, kind: 'start' },
      { label: 'Component cost surge',   value: -1.8, kind: 'negative' },
      { label: 'Yield issue',            value: -1.0, kind: 'negative' },
      { label: 'Warranty & returns',     value: -0.6, kind: 'negative' },
      { label: 'Volume',                 value: -0.3, kind: 'negative' },
      { label: 'FX',                     value: -0.1, kind: 'negative' },
      { label: 'Mix',                    value: 1.0,  kind: 'positive' },
      { label: 'Wearables GM Q1',        value: 35.8, kind: 'end' },
    ],
    commentary: [
      {
        rank: 1, name: 'Camera sensor pricing', delta: '-1.8pp',
        text: 'Single-source sensor supplier raised pricing 22%. 3-way bake-off underway; expected 120bps recovery in Q2.',
        tags: [{ t: 'red', l: 'Component cost' }, { t: 'blue', l: 'Q2 recovery' }],
      },
      {
        rank: 2, name: 'Display yield', delta: '-1.0pp',
        text: 'New flagship display panel yielding at 88% (target 94%). Manufacturing partner working on process fix.',
        tags: [{ t: 'amber', l: 'Yield issue' }],
      },
      {
        rank: 3, name: 'First-90-day returns elevated', delta: '-0.6pp',
        text: 'New model return rate at 3.8% (vs historical 3.1%). Primary driver: sizing complaints on flagship band.',
        tags: [{ t: 'amber', l: 'Returns' }, { t: 'red', l: 'Sizing' }],
      },
    ],
  },
  ipad: {
    statusChip: { kind: 'info', text: 'Steady · small FX headwind' },
    kpis: [
      { lbl: 'iPad Gross Margin',     val: '40.5%', delta: '▼ 0.2pp QoQ',  tone: 'warn' },
      { lbl: 'iPad Revenue',           val: '$3.3B', delta: '▼ 1.1% QoQ',  tone: 'warn' },
      { lbl: 'Education Mix',          val: '18%',   delta: '▲ 1pp QoQ',    tone: 'pos' },
    ],
    waterfall: [
      { label: 'iPad GM Q4',            value: 40.7, kind: 'start' },
      { label: 'Education mix ↑',        value: 0.2,  kind: 'positive' },
      { label: 'Component inflation',    value: -0.3, kind: 'negative' },
      { label: 'FX',                     value: -0.2, kind: 'negative' },
      { label: 'Volume',                 value: 0.1,  kind: 'positive' },
      { label: 'iPad GM Q1',             value: 40.5, kind: 'end' },
    ],
    commentary: [
      {
        rank: 1, name: 'Education segment steady', delta: '+0.2pp',
        text: 'K-12 seasonal buying on plan; education mix edged up 1pp, slightly rich to blended margin.',
        tags: [{ t: 'green', l: 'Education' }],
      },
      {
        rank: 2, name: 'FX drag', delta: '-0.2pp',
        text: 'EUR/GBP weakness compressed reported revenue; local-currency demand steady.',
        tags: [{ t: 'amber', l: 'FX' }],
      },
      {
        rank: 3, name: 'Component inflation', delta: '-0.3pp',
        text: 'Memory/display cost pressure mirrors iPhone/Mac; smaller absolute impact given product mix.',
        tags: [{ t: 'amber', l: 'Components' }],
      },
    ],
  },
};

// ==========================================================================
// MARGIN — period modifier (applies a small scalar to KPI deltas)
// ==========================================================================
export function adjustMarginDeltaByPeriod(kpis: Kpi[], periodKey: string): Kpi[] {
  if (periodKey === 'qtd') return kpis; // default
  const map: Record<string, string> = {
    mtd: ' (MTD)',
    ytd: ' (YTD)',
    ltm: ' (LTM)',
  };
  const suffix = map[periodKey] ?? '';
  return kpis.map(k => ({ ...k, delta: k.delta + suffix }));
}

// ==========================================================================
// FLUX — helpers for materiality + owner filtering
// ==========================================================================
const MATERIALITY_THRESHOLD_IN_M: Record<string, number> = {
  '500k': 0.5,
  '1m':   1,
  '5m':   5,
  '10m':  10,
};
const OWNER_KEY_TO_TEAM: Record<string, string | null> = {
  all:      null,
  revenue:  'Revenue',
  opex:     'OpEx',
  treasury: 'Treasury',
  tax:      'Tax',
};
export function filterFluxRows(rows: FluxRow[], materialityKey: string, ownerKey: string): FluxRow[] {
  const threshold = MATERIALITY_THRESHOLD_IN_M[materialityKey] ?? 0;
  const ownerTeam = OWNER_KEY_TO_TEAM[ownerKey] ?? null;
  return rows.filter(r => {
    const materialEnough = Math.abs(r.variance) >= threshold;
    const ownerMatch = ownerTeam === null || r.owner === ownerTeam;
    return materialEnough && ownerMatch;
  });
}

// ==========================================================================
// FLUX — per-comparison title suffix (display-only variation)
// ==========================================================================
export function fluxComparisonLabel(compareKey: string): string {
  return {
    qoq:      'Q1 FY26 vs Q4 FY25',
    yoy:      'Q1 FY26 vs Q1 FY25',
    plan:     'Q1 FY26 vs Plan',
    forecast: 'Q1 FY26 vs Forecast',
  }[compareKey] ?? 'Q1 FY26 vs Q4 FY25';
}
