import type {
  Persona, Role, WorkbenchMeta, WorkbenchKey, LeftItem, Kpi,
  CommentaryItem, ChartBar, ChatResponseDef, ActionCard, Mission,
} from './types';

// ==========================================================
// PERSONAS
// ==========================================================
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
    phone: '+1 (415) 555-0142',
    focusAreas: ['Revenue', 'Margin', 'Board Prep', 'Investor Relations'],
    quickStat: { label: 'Board meeting in', value: '9 days', tone: 'warn' },
    todayAgenda: [
      'Review Q1 variance package',
      '1:1 with VP Sales on churn plan',
      'Board deck finalization — 4 pm',
    ],
    permissions: ['View all workbenches', 'Approve JE > $1M', 'Lock period', 'Publish reports'],
    capabilities: [
      'log_note', 'attach_evidence',
      'prepare_je', 'submit_for_approval', 'review_work',
      'post_je', 'post_je_over_1m', 'approve_recon', 'signoff_close_phase',
      'approve_je_over_1m', 'lock_period', 'publish_reports', 'override_materiality',
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
    phone: '+1 (512) 555-0107',
    focusAreas: ['Close Management', 'Reconciliations', 'Tax', 'Audit'],
    quickStat: { label: 'Close status', value: 'Day 4 / 5', tone: 'warn' },
    todayAgenda: [
      'Unblock AR aging reconciliation',
      'Chase tax team on depreciation schedule',
      'Stand-up with close team — 4 pm',
    ],
    permissions: ['Post JE (< $1M)', 'Approve recons', 'Sign-off close phases', 'Review worklist', 'Route to CFO'],
    capabilities: [
      'log_note', 'attach_evidence',
      'prepare_je', 'submit_for_approval', 'review_work',
      'post_je', 'approve_recon', 'signoff_close_phase',
      // cannot post or approve JE > $1M; must route to CFO
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
    phone: '+1 (312) 555-0188',
    focusAreas: ['AR Reconciliations', 'Evidence Upload', 'Investigations'],
    quickStat: { label: 'Tasks due today', value: '3', tone: 'neg' },
    todayAgenda: [
      'Investigate $142K AR variance',
      'Post Voltair remittance JE',
      'Submit evidence for Bank reconciliation',
    ],
    permissions: ['Prepare JE (review required)', 'Upload evidence', 'Comment on recs', 'Submit for approval'],
    capabilities: [
      'log_note', 'attach_evidence',
      'prepare_je', 'submit_for_approval',
      // cannot post, approve, signoff, or lock
    ],
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
// Uberflux — 5 operating regions (Global rolls up NA/LATAM/EMEA/APAC).
export const PERF_REGIONS: LeftItem[] = [
  { k: 'global',       n: 'Global',        d: '-$4.2M', tone: 'neg'  },
  { k: 'northamerica', n: 'North America', d: '-$1.1M', tone: 'warn' },
  { k: 'latam',        n: 'LATAM',         d: '-$2.4M', tone: 'neg'  },
  { k: 'emea',         n: 'EMEA',          d: '+$0.3M', tone: 'pos'  },
  { k: 'apac',         n: 'APAC',          d: '-$0.9M', tone: 'warn' },
];
export const PERF_COMPARES: LeftItem[] = [
  { k: 'plan',     n: 'vs Plan' },
  { k: 'priorwk',  n: 'vs Prior Week' },
  { k: 'prioryr',  n: 'vs Prior Year' },
  { k: 'forecast', n: 'vs Forecast' },
  { k: 'runrate',  n: 'vs Run Rate' },
];
// Uberflux — 4 category segments (Grocery, Convenience, Alcohol, Pharmacy).
// The variable name stays `PERF_DRIVERS` for compatibility — conceptually these
// are now "segments" per the Uberflux layout; surfaced with label "Segments".
export const PERF_DRIVERS: LeftItem[] = [
  { k: 'grocery',     n: 'Grocery',     d: '-$2.1M', tone: 'neg'  },
  { k: 'convenience', n: 'Convenience', d: '-$0.9M', tone: 'warn' },
  { k: 'alcohol',     n: 'Alcohol',     d: '+$0.4M', tone: 'pos'  },
  { k: 'pharmacy',    n: 'Pharmacy',    d: 'flat' },
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
/** Insights surfaced by the agent over time. The first entry is the newest.
 *  Additional insights rotate in on an interval to give a "live" feel. */
export const NEW_INSIGHTS_POOL: { ico: 'neg' | 'warn' | 'info'; title: string; text: string }[] = [
  { ico: 'warn', title: 'FX drift flagged',              text: 'USD/EUR moved 0.8% in the last hour — re-scoring hedge exposure.' },
  { ico: 'info', title: 'Expansion opportunity · Cinder', text: 'Seat utilization crossed 95% for the 3rd day — candidate for outreach.' },
  { ico: 'neg',  title: 'Cloud egress anomaly',          text: 'Customer data exports up 2.1× vs 14-day baseline — investigating.' },
  { ico: 'warn', title: 'At-risk update · Meridian',     text: 'Competitive RFP extended by 2 weeks — retention score updated to 34%.' },
  { ico: 'info', title: 'NRR forecast refreshed',        text: 'Q2 projection now 110% (was 109%) with updated cohort weights.' },
  { ico: 'neg',  title: 'Threshold breached',            text: 'CA Retail margin now -2.9pp — crossed -2.5pp threshold.' },
  { ico: 'info', title: 'Recon auto-match complete',     text: '27 of 32 reconciliations matched · 5 variances above materiality.' },
];

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
  // ==================================================================
  // Delivery-industry (Uberflux) responses — matched first so prompt
  // chips like "Why did LATAM underperform?" get a substantive answer
  // instead of the generic fallback.
  // ==================================================================
  {
    match: /latam|mexico grocery|brazil convenience/i,
    text: '<strong>LATAM is −$2.4M vs Plan — Mexico Grocery drives 87% of it.</strong><br/><br/>Mexico Grocery is −$2.1M this week. Courier utilization sits at 68% — 5 points above the 63% red line. Trip dampening has been active since Week 8 and the miss is compounding: W8 −$0.6M → W9 −$1.4M → W10 −$2.1M.<br/><br/>Brazil Convenience adds −$0.6M with courier util at 61% (approaching the 63% threshold). Colombia Grocery is the only positive (+$0.3M) — Bogotá expansion tracking 2× launch model.<br/><br/><strong>W11 projection:</strong> −$3.1M to −$5.2M if Mexico supply ceiling isn\'t raised by Tuesday.',
    actions: [
      { kind: 'approve', label: 'Raise Mexico supply ceiling (+11%)', who: 'Ops · MX Lead',      body: 'Approve lift from 1,240 → 1,380 couriers before Tuesday.', requires: 'approve_je_over_1m' },
      { kind: 'slack',   label: 'Slack LATAM ops lead',               who: 'Rafael · LATAM Ops', body: 'Mexico Grocery at 68% courier util 3 weeks running — need supply ceiling raised to 1,380 by Tue.' },
      { kind: 'email',   label: 'Route approval to CFO',              who: 'Mai · CFO',         body: '$2.1M variance exceeds $1M materiality — CFO sign-off required on the supply-ceiling decision.', requires: 'review_work' },
      { kind: 'whatif',  label: 'What-If: 15% Brazil courier incentive', who: 'Forecast · W11',  body: 'Pre-authorize $40K incentive to prevent threshold breach in Brazil · 20× ROI vs letting BR hit dampening.' },
      { kind: 'pin',     label: 'Pin LATAM watch',                    who: 'Workspace · W10',    body: 'Mexico + Brazil supply constraint tracker.' },
      { kind: 'share',   label: 'Share with exec',                    who: 'Exec leadership',    body: 'LATAM variance snapshot + recommended actions.' },
    ],
    followUps: [
      'How bad does the Mexico forecast look for W11?',
      'Compare W10 Mexico to W34 2024 (prior supply event)',
      'What is the ROI on the Brazil incentive?',
    ],
  },
  {
    match: /watch.*tuesday|before tuesday|tuesday|most important/i,
    text: '<strong>One thing to watch before Tuesday: Mexico Grocery supply threshold.</strong><br/><br/>Courier utilization has been above the 63% red line for 3 consecutive weeks (currently 68%). If the supply ceiling isn\'t raised from 1,240 → 1,380 couriers by Tuesday, the ML model projects an <strong>additional −3% to −5% trip loss in W11</strong> on top of the existing −$2.1M hole.<br/><br/>Second priority: <strong>Brazil Convenience</strong> at 61% util — base-case demand forecast crosses the 63% threshold by W11 Day 3 unless we pre-authorize a 15% courier incentive (~$40K spend, protects ~$0.8M revenue).<br/><br/>Everything else is auto-recovering (AU weather, US Super Bowl exit rate) — monitor, no intervention.',
    actions: [
      { kind: 'approve', label: 'Approve Mexico ceiling lift',         who: 'Ops · MX',           body: 'Raise courier ceiling to 1,380 (+11%) effective Tue.', requires: 'approve_je_over_1m' },
      { kind: 'approve', label: 'Pre-authorize Brazil incentive',      who: 'Ops · BR',           body: '15% courier incentive for W11 · $40K budget.',          requires: 'post_je' },
      { kind: 'remind',  label: 'Remind: Tuesday 8am pre-check',       who: 'Calendar · Mon pm',  body: 'Check Mexico courier onboarding status before Tuesday open.' },
      { kind: 'slack',   label: 'Slack CEO briefing',                  who: 'Josh · CEO',         body: 'Two supply calls to make before Tuesday — MX ceiling (critical) + BR incentive (preventive).' },
      { kind: 'pin',     label: 'Pin "Pre-Tuesday" checklist',         who: 'Workspace',          body: 'MX ceiling + BR incentive + W11 monitoring.' },
    ],
    followUps: [
      'What is the risk if we do nothing?',
      'How much does the Brazil incentive cost?',
      'Who owns the Mexico ceiling decision?',
    ],
  },
  {
    match: /regions.*risk|most at risk|next week|w11|risk next/i,
    text: '<strong>W11 risk ranking — 5 regions:</strong><br/><br/>1. <strong class="text-negative">LATAM</strong> — Mexico supply constraint accelerating. W11 projected <strong>−$3.1M to −$5.2M</strong> if Mexico ceiling not raised. Brazil Convenience also at risk of threshold breach mid-week.<br/><br/>2. <strong class="text-warning">APAC</strong> — AU weather event auto-recovering; +15% demand rebound modeled over 2 weeks but timing uncertain. Low intervention cost.<br/><br/>3. <strong class="text-warning">NA</strong> — US Convenience expected to normalize fully post–Super Bowl (87% model confidence). Low risk, but NYC radius-reduction review scheduled for W11.<br/><br/>4. <strong class="text-positive">EMEA</strong> — Holiday demand normalizing as school breaks end. Projection +$0.1M (down from +$0.3M) — still positive.<br/><br/>5. <strong class="text-positive">Global</strong> — If LATAM interventions land, W11 projects −$2.8M (improvement from W10). If not, closer to −$6M.',
    actions: [
      { kind: 'email',   label: 'Escalate LATAM to CEO',            who: 'Josh · CEO',             body: 'W11 LATAM risk could hit −$5.2M without Mexico ceiling lift + Brazil incentive.',      requires: 'review_work' },
      { kind: 'approve', label: 'Approve combined LATAM package',   who: 'Ops · LATAM',            body: 'Mexico ceiling +11% + Brazil 15% incentive. Combined cost ~$40K · protects ~$2.8M.',  requires: 'approve_je_over_1m' },
      { kind: 'whatif',  label: 'Model "do nothing" scenario',      who: 'Forecast · W11',         body: 'Project full W11 impact if no supply actions taken.' },
      { kind: 'remind',  label: 'Set W11 risk-review ping',         who: 'Calendar · Friday',      body: 'Re-review risk ranking Fri pm before W11 opens.' },
      { kind: 'pin',     label: 'Pin risk ranking',                 who: 'Workspace · W11 prep',   body: '5-region W11 risk snapshot.' },
      { kind: 'share',   label: 'Share with exec leadership',       who: 'Mai, Josh, Priya',      body: 'W11 risk ranking + recommended actions.' },
    ],
    followUps: [
      'What is the cost to act on all 5 regions?',
      'Which region has the highest ROI on action?',
      'Compare W11 risk to W10 realized miss',
    ],
  },
  {
    match: /us convenience|exit rate|super bowl/i,
    text: '<strong>US Convenience −$0.9M vs Plan — Super Bowl week effect, explainable.</strong><br/><br/>Exit rate spike at 1.8 std devs above seasonal baseline. NYC radius reduction active since W9. CPP (cost per purchase) seeing 9% trip loss as customers self-select for shorter routes.<br/><br/><strong>Historical comparison:</strong> exact pattern matches W10 2024 and W10 2023 — both showed full recovery within 7 days. Model confidence: 87%.<br/><br/><strong>Not structural.</strong> No intervention needed. The NYC radius reduction review is already scheduled for W11.',
    actions: [
      { kind: 'open',   label: 'Open US Convenience drilldown',   who: 'This workbench',         body: 'Deep-dive metrics + store-level detail.' },
      { kind: 'whatif', label: 'Model W11 recovery curve',        who: 'Forecast · W11',         body: 'Based on 2024/2023 precedent — +6% rebound expected.' },
      { kind: 'remind', label: 'Remind: Review NYC radius W11',   who: 'Calendar',               body: 'Confirm radius-reduction policy review completes on schedule.' },
      { kind: 'pin',    label: 'Pin US W10 context',              who: 'Workspace',              body: 'Super Bowl exit-rate historical pattern.' },
      { kind: 'share',  label: 'Share with US ops',               who: 'NA Ops',                 body: 'Confirming no action required; W11 auto-recovery expected.' },
    ],
    followUps: [
      'When did NYC radius reduction start?',
      'Historical recovery curve for similar events',
      'Will Canada Grocery recover the same way?',
    ],
  },
  {
    match: /eup grocery|school holiday|europe holiday|holiday.*demand/i,
    text: '<strong>EUP Grocery +$1.0M vs Plan — school holiday effect confirmed.</strong><br/><br/>French half-term + UK mid-term align in W10, delivering <strong>+1.8M incremental trips</strong> vs model baseline. France +18%, UK +14%, Benelux +11% vs weekly baseline.<br/><br/>Courier supply healthy at 51% utilization — no strain. Margin intact. No co-funding deployed.<br/><br/><strong>W11 outlook:</strong> Holiday momentum ending — expect pullback to +$0.1M vs Plan (still positive). No structural risks.<br/><br/><strong>Lever for next year:</strong> W25 (late June) is the largest European school holiday period. Last year it drove +$2.8M above plan. Proactive courier supply investment in May could capture +$0.5M–$0.8M more.',
    actions: [
      { kind: 'pin',     label: 'Flag W25 for planning',            who: 'Workspace · H2 planning', body: 'Largest EU school-holiday window · $2.8M upside precedent.' },
      { kind: 'whatif',  label: 'Model W25 supply pre-investment',  who: 'Forecast · May-June',    body: 'Pre-invest courier supply for summer holiday peak.' },
      { kind: 'share',   label: 'Share with EMEA leadership',       who: 'EMEA GM',                 body: 'Holiday uplift confirmed; planning ahead for W25.' },
      { kind: 'slack',   label: 'Slack EMEA planner',               who: 'Sophie · EMEA Planning',  body: 'W25 opportunity — start courier pre-seed in May.' },
      { kind: 'email',   label: 'Brief on EMEA strength',           who: 'Mai · CFO',              body: 'Only positive region this week; no action needed; flagging W25 opportunity.' },
    ],
    followUps: [
      'What drove the +$2.8M last year in W25?',
      'Break down by country (FR/UK/Benelux)',
      'When do the school holidays end?',
    ],
  },
  {
    match: /au grocery|australia|weather|rainfall/i,
    text: '<strong>AU Grocery −$0.7M vs Plan — weather-driven, auto-recovering.</strong><br/><br/>Eastern seaboard rainfall event (100-year intensity in Sydney) suppressed trip demand across Grocery and Convenience. Sydney −21%, Melbourne −18%, Brisbane −15% vs weekly baseline.<br/><br/>Courier supply unaffected (utilization 43% — plenty of headroom). No structural issues.<br/><br/><strong>Historical analysis:</strong> 14 comparable AU weather events show average <strong>+15% demand rebound over the following 2 weeks</strong>. 81% model accuracy.<br/><br/><strong>Recommendation: no action.</strong> Auto-recovery model is incorporated into W11–W12 projections. Promotional spend during a natural rebound typically shows diminishing returns.',
    actions: [
      { kind: 'open',   label: 'Open AU drilldown',              who: 'APAC · AU',           body: 'Store-level demand patterns + weather overlay.' },
      { kind: 'whatif', label: 'Model rebound scenario',         who: 'Forecast · W11-W12',  body: '+15% demand uplift · 2-week window.' },
      { kind: 'remind', label: 'Remind: verify W12 recovery',    who: 'Calendar · W12',      body: 'Check rebound materialized as modeled.' },
      { kind: 'share',  label: 'Share with APAC ops',            who: 'APAC GM',             body: 'Weather event classified as auto-recovering; no intervention required.' },
      { kind: 'pin',    label: 'Pin for W12 verification',       who: 'Workspace',           body: 'AU weather rebound tracker.' },
    ],
    followUps: [
      'Show the 14 comparable weather events',
      'What is the expected Sydney recovery curve?',
      'Any supply risk if rebound overshoots?',
    ],
  },
  {
    match: /exceptions|significant|flagged|critical/i,
    text: '<strong>6 W10 exceptions — 3 critical, 2 warning, 2 positive:</strong><br/><br/><strong class="text-negative">Critical:</strong><br/>1. <strong>Mexico Grocery</strong> (−$2.1M) — supply ceiling breach, 3rd consecutive week<br/>2. <strong>AU Grocery</strong> (−$0.7M) — weather demand suppression, auto-recovering<br/>3. <strong>US Convenience</strong> (−$0.9M) — exit rate spike, Super Bowl effect<br/><br/><strong class="text-warning">Warning:</strong><br/>4. <strong>Brazil Convenience</strong> (−$0.6M) — early warning, util 61% approaching 63% threshold<br/>5. <strong>DACH Pharmacy</strong> (−$0.2M) — regulatory delay, W12 resolution expected<br/><br/><strong class="text-positive">Positive:</strong><br/>6. <strong>EUP Grocery</strong> (+$0.4M) — school holiday outperformance<br/>7. <strong>Colombia Grocery</strong> (+$0.3M) — Bogotá expansion 2× launch model<br/><br/><strong>Action required:</strong> Mexico (supply ceiling) + Brazil (pre-authorize incentive). The rest are explainable/recoverable.',
    actions: [
      { kind: 'open',    label: 'Open Exceptions tab',             who: 'This workbench',        body: 'Full severity-ranked exception list.' },
      { kind: 'approve', label: 'Approve Mexico + Brazil package', who: 'LATAM Ops',             body: 'Combined supply actions for 2 critical/warning exceptions.', requires: 'approve_je_over_1m' },
      { kind: 'pin',     label: 'Pin exception snapshot',          who: 'Workspace · W10',       body: 'Current-week flagged items + owners.' },
      { kind: 'share',   label: 'Share exception list',            who: 'Exec team',             body: 'W10 exception list with ownership + status.' },
      { kind: 'remind',  label: 'Remind: W11 exception review',    who: 'Calendar · Monday',     body: 'Re-rank W11 exceptions Mon pm.' },
    ],
    followUps: [
      'Rank exceptions by revenue impact',
      'Show the audit trail for each critical exception',
      'Compare W10 exception count to W9',
    ],
  },

  // ==================================================================
  // CFO persona-tagged responses — board prep, approvals, exposure,
  // period-lock decisions. Only match when persona.key === 'CFO'.
  // ==================================================================
  {
    persona: 'CFO',
    match: /my approval|needs (?:my |cfo )?approval|approval queue|needs sign.?off|awaiting sign.?off/i,
    text: '<strong>Mai — 3 items awaiting your approval:</strong><br/><br/>1. <strong class="text-negative">Mexico supply ceiling lift</strong> · $2.1M variance / $1M materiality · routed by Raj Patel · <span class="text-muted">aging 4 hrs</span><br/>2. <strong class="text-warning">Q1 period close — Mexico Grocery segment lock</strong> · requires CFO sign-off post supply resolution · <span class="text-muted">aging 1 day</span><br/>3. <strong class="text-warning">Brazil pre-authorization — 15% courier incentive, $40K</strong> · Raj recommends approval; ROI 20× · <span class="text-muted">aging 2 hrs</span><br/><br/><strong>Total exposure if all unapproved through W11:</strong> ~$6M downside risk across LATAM.',
    actions: [
      { kind: 'approve', label: 'Approve Mexico supply ceiling',     who: 'Mai · CFO sign-off',   body: 'Lift from 1,240 → 1,380 couriers (+11%). Unblocks W11 recovery.',           requires: 'approve_je_over_1m' },
      { kind: 'approve', label: 'Approve & Lock Q1 Mexico segment',  who: 'Mai · Period lock',    body: 'Lock Mexico Grocery segment post supply fix. Period-end control.',          requires: 'lock_period' },
      { kind: 'approve', label: 'Approve Brazil $40K incentive',     who: 'Mai · Pre-auth',       body: '15% courier incentive for W11 · protects ~$0.8M revenue.',                  requires: 'approve_je_over_1m' },
      { kind: 'email',   label: 'Reply to Raj with decision',        who: 'Raj · Controller',      body: 'Acknowledged — approving Mexico lift; will review period-lock after supply resolves.' },
      { kind: 'share',   label: 'Share decisions with board',        who: 'Board distribution',    body: 'CFO-approved actions for W10 variance package.' },
    ],
    followUps: [
      'What is the risk if I defer Mexico approval by 24 hrs?',
      'Show the full approval audit trail',
      'Draft the board update summarizing my decisions',
    ],
  },
  {
    persona: 'CFO',
    match: /board|board summary|board prep|board deck|board.?ready/i,
    text: '<strong>Draft W10 board update — CFO voice:</strong><br/><br/>Global variance came in at −$4.2M vs Plan for the week, driven primarily by LATAM supply constraints in Mexico Grocery (−$2.1M, 3rd consecutive week). US Convenience Super Bowl timing (−$0.9M) and AU weather (−$0.7M) are explainable and auto-recovering. EMEA is the only positive region at +$0.3M on confirmed school-holiday uplift.<br/><br/><strong>Q1 cumulative:</strong> −$12.4M vs Plan (primarily February/March · supply-constrained). W11 projects −$2.8M if Mexico interventions land, closer to −$6M if not.<br/><br/><strong>Actions taken this week:</strong> Approved Mexico courier ceiling lift, pre-authorized Brazil incentive, scheduled NYC radius-reduction policy review for W11.',
    actions: [
      { kind: 'pin',     label: 'Pin to Q1 Board Prep folder',     who: 'Workspace · Board',       body: 'W10 variance + actions summary.' },
      { kind: 'email',   label: 'Send to board circulation list',  who: 'Board of Directors',      body: 'W10 summary + Q1 cumulative context.' },
      { kind: 'share',   label: 'Share board snapshot link',       who: 'meeru.ai/s/w10-board',    body: 'Shareable read-only snapshot.' },
      { kind: 'whatif',  label: 'Model Q2 recovery scenario',      who: 'Forecast · Q2',           body: 'What if all LATAM interventions land successfully?' },
      { kind: 'approve', label: 'Publish as board pre-read',       who: 'Board distribution',     body: 'Finalize + publish for Friday board meeting.', requires: 'publish_reports' },
    ],
    followUps: [
      'Add Q1 cumulative variance breakdown',
      'Include the Mexico supply case study',
      'Shorten to 1 paragraph for board email',
    ],
  },
  {
    persona: 'CFO',
    match: /exposure|materiality|cumulative|quarter.?to.?date|qtd/i,
    text: '<strong>Q1 cumulative materiality-exceeding variances:</strong><br/><br/>• <strong>Mexico Grocery</strong> — $2.1M (W10) + $1.4M (W9) + $0.6M (W8) = <strong>$4.1M cumulative</strong> · above $1M threshold, triggers CFO approval<br/>• <strong>AU Grocery</strong> — $0.7M (W10 weather) · below threshold, auto-recovering<br/>• <strong>US Convenience</strong> — $0.9M (W10 seasonal) · below threshold<br/><br/><strong>Aggregate Q1 exposure above materiality:</strong> $4.1M (Mexico only)<br/><strong>Q1 total variance vs Plan:</strong> −$12.4M<br/>The Mexico compound risk is the single item demanding CFO attention. Everything else is within ordinary-course tolerance.',
    actions: [
      { kind: 'open',    label: 'Open Exceptions tab',              who: 'This workbench',         body: 'Severity-ranked exception list.' },
      { kind: 'approve', label: 'Approve materiality override · Q1', who: 'Policy · materiality',  body: 'Temporarily lift threshold for Mexico pending supply resolution.', requires: 'override_materiality' },
      { kind: 'share',   label: 'Share Q1 exposure memo',            who: 'Audit + Controller',    body: 'Cumulative materiality report for sign-off.' },
      { kind: 'pin',     label: 'Pin exposure tracker',               who: 'Workspace · QTD',       body: 'Rolling Q1 materiality-exceeding variances.' },
    ],
    followUps: [
      'Compare Q1 to Q4 materiality exceedances',
      'Show the decision trail on the Mexico $4.1M',
      'What is the audit treatment for compound variance?',
    ],
  },
  {
    persona: 'CFO',
    match: /lock period|period lock|period.?end|close.*lock/i,
    text: '<strong>Segments ready for period lock:</strong><br/><br/>✓ <strong>EMEA Grocery</strong> · +$0.4M, fully reconciled, no pending JEs<br/>✓ <strong>US Alcohol</strong> · +$0.3M, clean close<br/>✓ <strong>APAC Japan Convenience</strong> · +$0.1M, no exceptions<br/><br/>⏳ <strong>Awaiting action:</strong><br/>• Mexico Grocery — $2.1M variance post-approval; supply resolution required first<br/>• AU Grocery — weather recovery still mid-flight; recommend deferring lock 7 days<br/>• Brazil Convenience — early-warning flag; wait for W11 actuals<br/><br/><strong>Recommendation:</strong> Lock the 3 clean segments now; defer the 3 pending until W11 close.',
    actions: [
      { kind: 'approve', label: 'Lock EMEA + US Alcohol + Japan',  who: 'Mai · Period lock',    body: 'Lock 3 clean segments now. 3 others deferred to W11.',  requires: 'lock_period' },
      { kind: 'remind',  label: 'Remind: revisit pending W11',     who: 'Calendar · W11 Monday', body: 'Re-review the 3 deferred segments after W11 actuals land.' },
      { kind: 'email',   label: 'Notify Raj of lock decisions',    who: 'Raj · Controller',      body: 'Locking 3 segments · 3 deferred · audit trail recorded.' },
      { kind: 'pin',     label: 'Pin lock decision log',           who: 'Workspace · Q1 close',  body: 'Segment-by-segment lock decisions.' },
    ],
    followUps: [
      'What are the downstream effects of locking Mexico prematurely?',
      'Audit trail for previous period locks',
      'How long can AU recovery be deferred?',
    ],
  },

  // ==================================================================
  // Controller persona-tagged responses — review queue, close ops,
  // posting, recon status, audit trail.
  // ==================================================================
  {
    persona: 'CONTROLLER',
    match: /review queue|my review|pending.*review|awaiting.*review|staff submission/i,
    text: '<strong>Raj — your review queue (4 items):</strong><br/><br/>1. <strong class="text-negative">Mexico Grocery variance — $2.1M</strong> · prepared by Maya Gonzales · evidence attached (courier-util chart, Cencosud email) · <span class="text-muted">submitted 2 hrs ago</span><br/>2. <strong class="text-warning">AR aging reconciliation — Mexico market</strong> · prepared by Maya · <span class="text-muted">submitted yesterday</span><br/>3. <strong class="text-warning">Voltair remittance JE draft</strong> · prepared by Maya · 3rd-party confirmation pending<br/>4. <strong class="text-muted">Bank reconciliation evidence — Chicago operating</strong> · prepared by Maya · ready for final sign-off<br/><br/><strong>Highest priority:</strong> Mexico Grocery — exceeds $1M materiality, needs your review then CFO routing.',
    actions: [
      { kind: 'approve',     label: 'Post Mexico provisional JE',         who: 'GL · Mexico',          body: 'Post to draft. Routes to CFO for final approval on > $1M amount.', requires: 'post_je' },
      { kind: 'email',       label: 'Route Mexico to CFO',                who: 'Mai · CFO',           body: '$2.1M variance exceeds threshold — request CFO sign-off.',         requires: 'review_work' },
      { kind: 'approve',     label: 'Approve AR reconciliation',          who: 'Mexico market',        body: 'Sign off recon after Maya\'s evidence review.',                    requires: 'approve_recon' },
      { kind: 'approve',     label: 'Approve Bank recon · Chicago',       who: 'Close · Day 4',        body: 'Final sign-off on fully-evidenced recon.',                          requires: 'approve_recon' },
      { kind: 'slack',       label: 'Reply to Maya',                      who: 'Maya · Staff Acct',    body: 'Reviewing Mexico variance now — CFO routing after post.' },
    ],
    followUps: [
      'Show the full audit trail on Mexico',
      'What evidence is Maya missing on Voltair?',
      'Who else is in my review queue this week?',
    ],
  },
  {
    persona: 'CONTROLLER',
    match: /close.*day|close.*blocker|day 4|day 5|close status/i,
    text: '<strong>Close status — Day 4 of 5:</strong><br/><br/><strong class="text-negative">2 blockers open:</strong><br/>• AR aging recon · Maya investigating $142K variance · evidence pending<br/>• Depreciation schedule · tax team 2 days behind · escalation opened<br/><br/><strong class="text-warning">3 reconciliations in review:</strong> Mexico market, Chicago bank, Voltair remittance<br/><br/><strong class="text-positive">Completed today:</strong> EMEA grocery close (Maya), US alcohol close (automated)<br/><br/><strong>Critical path to Day 5 close:</strong> AR aging recon must clear by 4 pm today to unblock Day 5 period-end validation.',
    actions: [
      { kind: 'slack',       label: 'Slack tax team escalation',          who: 'Tax · Lead',           body: 'Depreciation schedule 2 days behind — need by Thu noon to avoid Day 5 delay.' },
      { kind: 'slack',       label: 'Check in with Maya on AR variance',  who: 'Maya · Staff Acct',    body: 'How close are we on the AR $142K variance? Day 4 critical-path item.' },
      { kind: 'approve',     label: 'Sign off Day 4 complete segments',    who: 'Close · phase',        body: 'Flip EMEA + US alcohol to closed. Blockers remain for Day 5.',  requires: 'signoff_close_phase' },
      { kind: 'remind',      label: 'Remind: 4pm critical checkpoint',    who: 'Calendar · today',     body: 'AR recon status check before Day 5 validation.' },
      { kind: 'pin',         label: 'Pin close blockers',                  who: 'Workspace · close',    body: '2 blockers + 3 pending.' },
    ],
    followUps: [
      'What happens if we slip to Day 6?',
      'Show me the full close checklist',
      'Who can I reassign the tax escalation to?',
    ],
  },
  {
    persona: 'CONTROLLER',
    match: /recon|reconciliation|recon status/i,
    text: '<strong>Reconciliation status — 8 items:</strong><br/><br/><strong class="text-negative">Unmatched variance (3):</strong><br/>• AR Aging · −$142K · Maya investigating · <span class="text-muted">3 days</span><br/>• Intercompany · +$18K · materiality borderline · Raj to review<br/>• FX Remeasurement · +$72K · material · awaits evidence<br/><br/><strong class="text-positive">Fully matched (5):</strong><br/>• Bank Operating, Bank Payroll, Accrued Payroll, Deferred Revenue, Inventory<br/><br/><strong>Materiality-exceeding:</strong> AR Aging + FX — both need Raj sign-off this week.',
    actions: [
      { kind: 'approve',     label: 'Approve AR recon (post-evidence)',    who: 'Close · AR',          body: 'Flip to matched once Maya\'s evidence lands.',              requires: 'approve_recon' },
      { kind: 'approve',     label: 'Approve FX Remeasurement',            who: 'Close · FX',          body: 'Sign off after reviewing evidence package.',                requires: 'approve_recon' },
      { kind: 'slack',       label: 'Ping Maya on AR evidence timing',     who: 'Maya · Staff Acct',   body: 'AR recon on Day 4 critical path — ETA on evidence?' },
      { kind: 'open',        label: 'Open Reconciliations workbench',      who: 'Nav · Recons',        body: 'Full recon list with drill-through.' },
      { kind: 'pin',         label: 'Pin recon snapshot',                   who: 'Workspace · Day 4',   body: 'Day 4 recon status.' },
    ],
    followUps: [
      'How many days has the AR variance been open?',
      'Show historical recon close rates',
      'Which recons automatically pass materiality tests?',
    ],
  },
  {
    persona: 'CONTROLLER',
    match: /audit trail|approval chain|who approved|signoff history/i,
    text: '<strong>Audit trail — Mexico Grocery $2.1M variance:</strong><br/><br/>1. <strong>Prepared by</strong> Maya Gonzales · 2026-03-09 10:14 CST · evidence attached (3 files)<br/>2. <strong>Submitted for review</strong> · 2026-03-09 10:17 CST · auto-routed to Raj Patel<br/>3. <strong>Reviewed by</strong> Raj Patel · 2026-03-09 12:34 CST · evidence accepted · notes added<br/>4. <strong>Provisional JE posted</strong> by Raj · 2026-03-09 12:41 CST · amount $2.1M · draft stage<br/>5. <strong>Routed to CFO</strong> · 2026-03-09 12:42 CST · reason: amount exceeds $1M materiality<br/>6. <strong class="text-warning">Awaiting CFO approval</strong> · Mai Lane · open 4 hrs<br/><br/>All signatures recorded. Full evidence bundle attached. Trail meets SOX documentation standard.',
    actions: [
      { kind: 'remind',      label: 'Ping Mai on CFO approval',          who: 'Mai · CFO',           body: 'Mexico approval open 4 hrs — need before Tuesday supply deadline.' },
      { kind: 'share',       label: 'Share audit trail with external audit', who: 'External audit',    body: 'Mexico variance trail for Q1 documentation.' },
      { kind: 'pin',         label: 'Pin to close documentation',          who: 'Workspace · audit',    body: 'Q1 material variance trails.' },
      { kind: 'open',        label: 'View full evidence bundle',           who: 'Mexico case folder',   body: 'All 3 evidence files + notes.' },
    ],
    followUps: [
      'Show all open approval chains',
      'Compare trail completeness to prior quarters',
      'Which items are missing signatures?',
    ],
  },

  // ==================================================================
  // Staff Accountant persona-tagged responses — task queue, preparation,
  // evidence, submission, investigation guidance.
  // ==================================================================
  {
    persona: 'STAFF',
    match: /my task|my queue|my work|todo|what.*today|what.*should.*do/i,
    text: '<strong>Maya — your queue for today (3 due):</strong><br/><br/>1. <strong class="text-negative">Investigate Mexico Grocery $2.1M variance</strong> · <span class="text-muted">due today 4 pm</span> · evidence attached, note draft in progress<br/>2. <strong class="text-warning">Post Voltair remittance JE draft</strong> · <span class="text-muted">due today 5 pm</span> · awaiting 3rd-party confirmation<br/>3. <strong class="text-warning">Submit evidence for Bank reconciliation</strong> · <span class="text-muted">due today EOD</span> · 2 files remaining to upload<br/><br/><strong>In review (3):</strong> Mexico Grocery (Raj reviewing), AR aging Mexico (Raj reviewing), Chicago bank (awaiting Raj sign-off)<br/><br/><strong>Blocker:</strong> AR $142K variance — waiting on Maya-side evidence completion. This is critical-path for Day 5 close.',
    actions: [
      { kind: 'investigate', label: 'Open Mexico investigation',          who: 'Mexico Grocery · W10', body: 'Continue your draft — add supply-constraint context.',           requires: 'attach_evidence' },
      { kind: 'email',       label: 'Submit Mexico for Controller review', who: 'Raj · Controller',    body: 'Mexico Grocery evidence package ready for your review.',         requires: 'submit_for_approval' },
      { kind: 'investigate', label: 'Complete AR $142K evidence',         who: 'AR aging · Mexico',    body: 'Upload remaining evidence to unblock Day 5 close.',              requires: 'attach_evidence' },
      { kind: 'investigate', label: 'Prepare Voltair JE',                 who: 'Voltair · remittance', body: 'Draft JE once 3rd-party confirmation lands.',                    requires: 'prepare_je' },
      { kind: 'remind',      label: 'Remind: 4 pm Mexico deadline',       who: 'Calendar · today',     body: 'Mexico investigation due 4 pm.' },
      { kind: 'slack',       label: 'Slack Raj if blocked',               who: 'Raj · Controller',     body: 'Ping on Voltair 3rd-party confirmation status.' },
    ],
    followUps: [
      'What evidence do I still need for Mexico?',
      'How do I format the AR aging variance note?',
      'Show me the Voltair JE template',
    ],
  },
  {
    persona: 'STAFF',
    match: /how.*prepare|how.*file|how.*submit|how.*write|how.*document/i,
    text: '<strong>Variance preparation playbook — Mexico Grocery $2.1M:</strong><br/><br/><strong>Step 1 — Investigation note (~150 words):</strong> state the variance ($2.1M vs Plan), root cause (courier utilization 68% vs 63% threshold · supply constraint), duration (3 weeks), and any mitigating context (Cencosud co-funding offset).<br/><br/><strong>Step 2 — Evidence (required for SOX materiality):</strong><br/>✓ Courier utilization chart · attached<br/>✓ Cencosud co-funding email · attached<br/>□ Weekly trip dampening model output · <em>still needed</em><br/>□ Supply ceiling historical reference (W34 2024) · <em>still needed</em><br/><br/><strong>Step 3 — Submit to Controller:</strong> click "Submit for approval" — auto-routes to Raj with evidence bundle.<br/><br/><strong>Step 4 — Wait for review.</strong> Raj posts provisional JE; then routes to CFO since the amount exceeds $1M materiality.',
    actions: [
      { kind: 'investigate', label: 'Open Mexico investigation editor',   who: 'Mexico · W10',         body: 'Continue your draft note.',                                       requires: 'attach_evidence' },
      { kind: 'open',        label: 'View investigation template',        who: 'Documentation · template', body: 'Standard note format + example.' },
      { kind: 'email',       label: 'Submit for Controller review',       who: 'Raj · Controller',     body: 'Mexico Grocery investigation ready for review.',                 requires: 'submit_for_approval' },
      { kind: 'pin',         label: 'Pin the playbook',                    who: 'Workspace · guides',  body: 'Variance-prep playbook.' },
      { kind: 'slack',       label: 'Ask Raj for the W34 2024 ref',      who: 'Raj · Controller',     body: 'Do you have the W34 2024 supply event reference I should cite?' },
    ],
    followUps: [
      'What makes an investigation SOX-ready?',
      'Show me a well-documented example',
      'How long does the review step usually take?',
    ],
  },
  {
    persona: 'STAFF',
    match: /evidence|attach|upload|what.*need|missing/i,
    text: '<strong>Evidence status across your 3 open items:</strong><br/><br/><strong class="text-negative">Mexico Grocery (2 of 4 attached):</strong><br/>✓ Courier utilization chart<br/>✓ Cencosud co-funding email<br/>□ Weekly trip dampening model output<br/>□ W34 2024 historical supply-event reference<br/><br/><strong class="text-warning">Voltair JE (1 of 2):</strong><br/>✓ Remittance detail<br/>□ 3rd-party bank confirmation (outstanding)<br/><br/><strong class="text-warning">Bank reconciliation (6 of 8):</strong><br/>✓ 6 files uploaded<br/>□ March statement final page<br/>□ Reconciling item backup for $4,200 timing diff<br/><br/>Mexico is highest priority — the two missing items are what\'s blocking your submission to Raj.',
    actions: [
      { kind: 'investigate', label: 'Upload Mexico missing evidence',     who: 'Mexico · W10',         body: 'Add the two remaining files.',                                   requires: 'attach_evidence' },
      { kind: 'slack',       label: 'Request Voltair bank confirm',       who: 'Bank · ops',           body: 'Need 3rd-party confirmation to finalize JE draft.' },
      { kind: 'investigate', label: 'Upload Bank recon remaining',        who: 'Bank recon · March',   body: '2 files outstanding for Chicago.',                               requires: 'attach_evidence' },
      { kind: 'open',        label: 'Open evidence library',              who: 'Documentation',        body: 'Reference docs + historical examples.' },
      { kind: 'remind',      label: 'Remind: chase bank confirm Tue',     who: 'Calendar · Tuesday',   body: 'Voltair 3rd-party confirmation follow-up.' },
    ],
    followUps: [
      'What happens if I submit without all evidence?',
      'Who can sign off the W34 2024 reference?',
      'How do I tag evidence by type?',
    ],
  },
  {
    persona: 'STAFF',
    match: /submit for|submit.*review|send.*review|push.*controller/i,
    text: '<strong>Ready to submit Mexico Grocery?</strong><br/><br/>You\'re <strong>2 evidence items short</strong> of a complete submission:<br/>□ Weekly trip dampening model output<br/>□ W34 2024 historical supply-event reference<br/><br/><strong>If you submit now:</strong> Raj will accept the note and the 2 attached evidence files, but SOX documentation is incomplete — he\'ll likely request the remaining 2 before posting. That adds a round-trip.<br/><br/><strong>Recommendation:</strong> Complete the 2 missing items first (est. 15 min with the model output export + W34 reference pull from the archive), then submit. Cleaner path to CFO approval.',
    actions: [
      { kind: 'investigate', label: 'Complete remaining evidence first',  who: 'Mexico · W10',         body: 'Upload 2 files, then submit.',                                   requires: 'attach_evidence' },
      { kind: 'email',       label: 'Submit anyway (incomplete evidence)', who: 'Raj · Controller',    body: 'Mexico investigation · 2 evidence items still pending · submitting early for triage.', requires: 'submit_for_approval' },
      { kind: 'slack',       label: 'Ask Raj if partial is acceptable',   who: 'Raj · Controller',     body: 'Okay to submit Mexico with 2 items pending? Or wait for full bundle?' },
      { kind: 'remind',      label: 'Remind: 15-min evidence burst',      who: 'Calendar · 15 min',    body: 'Block 15 min to finish the two evidence files.' },
    ],
    followUps: [
      'How long do Raj\'s reviews typically take?',
      'What happens after Raj approves?',
      'Can I withdraw a submission if I spot an error?',
    ],
  },

  // ==================================================================
  // Legacy / SaaS-industry matchers follow. These still work for
  // prompts that explicitly mention enterprise / churn / NRR / etc.
  // ==================================================================
  {
    match: /enterprise|churn/i,
    text: '<strong>3 logo churns are the driver.</strong> Acme Corp ($800K ARR), GlobalTech ($750K), DataStar ($550K) — all cited pricing and product fit. Our renewal-risk model flags 2 more accounts ($1.1M combined) as high-risk before end of Q2. NRR dropped from 115% to 108%.<br/><br/>Expansion ARR in the installed base partially offset (+$600K), but the trend needs intervention before June renewals.',
    actions: [
      { kind: 'email',  label: 'Email VP Sales',        who: 'Sue Park · VP Sales',       body: 'Flagging 3 enterprise churns ($2.1M ARR) — need renewal strategy for 2 more at-risk accounts before end of Q2.' },
      { kind: 'slack',  label: 'Slack CS Lead',         who: 'Priya · CS Director',       body: 'Can we surface our churn findings at tomorrow\'s QBR? 5 accounts affected.' },
      { kind: 'whatif', label: 'Run Retention What-If', who: 'Forecast · +10% retention', body: 'Model: retention +10% → NRR back to 114%, ARR delta +$1.8M.' },
      { kind: 'pin',    label: 'Pin to Board Deck',     who: 'Workspace · Q1 Board Prep', body: '3 churns + 2 at-risk accounts, NRR trend.' },
      { kind: 'approve', label: 'Approve save plan',    who: 'Finance approval',          body: 'Green-light retention credits up to $400K for the 2 at-risk accounts.' },
      { kind: 'open',   label: 'Open Account Drill',    who: 'Workbench · Accounts',      body: 'Drill into Acme, GlobalTech, DataStar account health scores.' },
      { kind: 'remind', label: 'Remind: Pre-renewal',   who: 'Calendar · 2 weeks out',    body: 'Review at-risk account status 2 weeks before Q2 renewal close.' },
      { kind: 'share',  label: 'Share with CFO',        who: 'CFO exec loop',             body: 'Churn summary + save plan for exec review.' },
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
      { kind: 'slack',  label: 'Slack West Region Ops', who: 'Carlos · West Ops Lead',    body: 'CA Retail labor surge — need to review shift scheduling before Thursday. ML model projecting −2-4% more margin erosion.' },
      { kind: 'email',  label: 'Email Staffing Model',  who: 'Kai · Workforce Planning',  body: 'Pull current CA Retail staffing model and overtime distribution for LA + SF. Need before end of day.' },
      { kind: 'whatif', label: 'What-If: Add 120 FTEs', who: 'Forecast · +120 FTE',       body: 'Model: +120 FTE reduces OT 62%, margin recovery +2.3pp by W13.' },
      { kind: 'remind', label: 'Remind: Thursday Prep', who: 'Calendar · Thu 8am',        body: 'Review West Coast margin before earnings prep meeting.' },
      { kind: 'im',     label: 'IM Store Managers',     who: 'LA + SF Store GMs',         body: 'Flagging OT spike — need store-level overtime review by EOD.' },
      { kind: 'approve', label: 'Approve automation',   who: 'Capex approval',            body: 'Green-light automation rollout acceleration (W14 → W11).' },
      { kind: 'pin',    label: 'Pin margin watch',      who: 'Workspace · W11 prep',      body: 'CA Retail labor + margin compression tracker.' },
      { kind: 'open',   label: 'Open OT Dashboard',     who: 'Workbench · Labor',         body: 'See overtime distribution by store + shift.' },
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
      { kind: 'email',  label: 'Email CTO',             who: 'Jin · CTO',                 body: 'Cloud ratio at 22% — proposing FinOps reservation strategy. Need decision before month-end.' },
      { kind: 'open',   label: 'Open FinOps Workbench', who: 'Workbench · FinOps',        body: 'Review reservation recommendations and commitment model.' },
      { kind: 'share',  label: 'Share with Exec Team',  who: 'Leadership chat',           body: 'Cloud cost summary and FinOps plan.' },
      { kind: 'whatif', label: 'Model 60-day commit',   who: 'Forecast · $180K/mo',       body: 'Projected savings if we commit to reservation strategy now.' },
      { kind: 'slack',  label: 'Slack FinOps',          who: 'Dana · FinOps Lead',        body: 'Kicking off reservation commitment — need utilization data by Friday.' },
      { kind: 'pin',    label: 'Pin cloud ratio',       who: 'Workspace · Watch list',    body: 'Track cloud/revenue ratio weekly against 20% target.' },
      { kind: 'remind', label: 'Remind: month-end',     who: 'Calendar · last day Q1',    body: 'Finalize reservation commitment decision before month-end close.' },
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
      { kind: 'slack',  label: 'Slack CS Leaders',      who: '#cs-leads',                 body: 'Cohort deep-dive needed for 2022 enterprise renewals.' },
      { kind: 'open',   label: 'Open cohort drill',     who: 'Workbench · Cohorts',       body: 'Compare 2021/2022/2023 enterprise cohorts side-by-side.' },
      { kind: 'share',  label: 'Share with board',      who: 'Board prep email list',     body: 'NRR breakpoint + cohort findings snapshot.' },
      { kind: 'remind', label: 'Remind: Friday review', who: 'Calendar · Fri 10am',       body: 'Block time for cohort retention deep-dive outcomes.' },
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
      { kind: 'email',  label: 'Email Account Managers', who: '3 AM leads',               body: 'Top 3 at-risk accounts — need intervention plan before mid-Q2.' },
      { kind: 'share',  label: 'Share with Sales Ops',   who: 'Sales Ops channel',        body: 'Full at-risk list ($3.4M exposure) with retention scores.' },
      { kind: 'remind', label: 'Remind: Mid-Q2 Check',   who: 'Calendar · May 15',        body: 'Retention check-in on 7 flagged accounts.' },
      { kind: 'slack',  label: 'Slack Voltair AM',       who: 'Voltair Account Mgr',      body: 'Voltair silent since W5 — can we schedule a touchpoint this week?' },
      { kind: 'whatif', label: 'What-If: Save all 7',    who: 'Forecast · 100% save',     body: 'Model: all 7 saved → ARR retained $3.4M, NRR +3pp.' },
      { kind: 'open',   label: 'Open Retention Model',   who: 'Workbench · Retention',    body: 'See full at-risk list with probability scores.' },
      { kind: 'pin',    label: 'Pin at-risk list',       who: 'Workspace · Watch list',   body: '7 accounts · $3.4M exposure · weekly review.' },
      { kind: 'approve', label: 'Approve save credits',  who: 'Finance approval',         body: 'Green-light up to $400K in retention credits across top 3.' },
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
      { kind: 'email',  label: 'Email VP Sales Ops',    who: 'Marcus · VP Sales Ops',     body: 'Mid-Market attach gap — need enablement review for platform add-on.' },
      { kind: 'whatif', label: 'What-If: Attach +13pp', who: 'Forecast · 35% attach',     body: 'Model: attach hits 35% → Mid-Market +$0.6M, gap closes.' },
      { kind: 'share',  label: 'Share with exec',       who: 'Exec leadership',           body: 'Expansion gap summary by segment.' },
      { kind: 'remind', label: 'Remind: QBR prep',      who: 'Calendar · QBR week',       body: 'Finalize Mid-Market packaging proposal before QBR.' },
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

  // -----------------------------------------------------------------
  // Approval-gated flow — drives the Staff → Controller → CFO demo.
  // Cards carry `requires` keys so they appear/disappear per persona.
  // -----------------------------------------------------------------
  {
    match: /materiality|supply ceiling|mexico.*11%|approve.*je|post.*je|lock.*period/i,
    text: '<strong>Mexico Grocery variance is -$2.1M — above the $1M materiality ceiling.</strong><br/><br/>That crosses the SOX approval threshold, so any JE tied to this variance needs the three-step path: <strong>Staff prepares</strong> → <strong>Controller reviews & posts (if ≤ $1M)</strong> → <strong>CFO approves & locks (if > $1M)</strong>.<br/><br/>The right next action depends on your role — the cards below only show what you can actually execute.',
    actions: [
      // Staff Accountant path
      { kind: 'investigate', label: 'Open investigation',       who: 'Mexico Grocery · W10',       body: 'Log findings, attach evidence, tag driver.',                 requires: 'attach_evidence' },
      { kind: 'email',       label: 'Submit for approval',      who: 'Raj · Controller',           body: 'Route prepared JE to Controller review queue.',              requires: 'submit_for_approval' },
      // Controller path
      { kind: 'approve',     label: 'Post provisional JE',      who: 'GL · draft stage',           body: 'Post to draft; requires CFO sign-off for > $1M.',            requires: 'post_je' },
      { kind: 'email',       label: 'Route to CFO for sign-off',who: 'Mai · CFO',                 body: 'Large-variance approval request — $2.1M over threshold.',    requires: 'review_work' },
      // CFO path
      { kind: 'approve',     label: 'Approve & Lock Period',    who: 'CFO sign-off · Mexico · W10', body: 'Approve the $2.1M JE and lock the period for Mexico Grocery.', requires: 'approve_je_over_1m' },
      { kind: 'whatif',      label: 'What-If: Raise materiality threshold', who: 'Policy · materiality', body: 'Model impact of lifting threshold from $1M to $2M.',   requires: 'override_materiality' },
      // Universal fallbacks
      { kind: 'pin',         label: 'Pin to my queue',          who: 'Workspace',                  body: 'Save the Mexico Grocery approval flow.' },
      { kind: 'share',       label: 'Share snapshot',           who: 'Team',                       body: 'Export the supply-variance context.' },
    ],
    followUps: [
      'Who has posted the JE?',
      'Show the approval audit trail',
      'What is the current materiality threshold?',
    ],
  },

  // ==================================================================
  // Chart-rendering responses — inline SVG so the chat bubble can show
  // a real visualization. The bubble container is dark/light agnostic,
  // so all SVG color references go through CSS variables.
  // ==================================================================
  {
    // Triggered by the AI Summary's "AI Diagnose" button — surfaces driver
    // decomposition, 10-week trend, and recommended levers in one rich reply
    // so the user stays inside the Command Center instead of bouncing to a
    // modal. Layout: label column 0–150, centerline 160, bars 0–200.
    match: /(?:run an? )?ai diagnos|ai diagnose|diagnose.*workbench|diagnose.*variance/i,
    text: (() => {
      const drivers = [
        { name: 'China macro slowdown',         delta: -22 },
        { name: 'Local competition',             delta: -16 },
        { name: 'Premium soft demand',           delta: -10 },
        { name: 'Channel mix shift',              delta:  -3 },
        { name: 'Other / unexplained',            delta:  -2 },
        { name: 'EUP holiday boost',              delta:   2 },
        { name: 'Germany FX tailwind',            delta:   3 },
      ];
      const maxAbs = Math.max(...drivers.map(d => Math.abs(d.delta)));
      // Geometry: 480 wide. Labels right-align at x=150 with padding to x=158.
      // Centerline at x=160. Negative bars draw left from 160 → 160 - w. Max
      // negative bar width capped so it never crosses the label column.
      const barRange = 220;
      const W = 460, rowH = 22, P = 6;
      const barRows = drivers.map((d, i) => {
        const y = P + i * rowH;
        const w = (Math.abs(d.delta) / maxAbs) * barRange;
        const x = d.delta < 0 ? 160 - w : 160;
        const c = d.delta < 0 ? 'var(--negative)' : 'var(--positive)';
        return (
          `<text x="152" y="${y + 14}" text-anchor="end" font-size="11" fill="var(--text-muted)">${d.name}</text>` +
          `<rect x="${x}" y="${y + 4}" width="${w}" height="14" rx="2" fill="${c}" opacity="0.85"/>` +
          `<text x="${d.delta < 0 ? x - 4 : x + w + 4}" y="${y + 14}" text-anchor="${d.delta < 0 ? 'end' : 'start'}" font-size="11" font-weight="600" fill="${c}">${d.delta > 0 ? '+' : ''}$${d.delta}M</text>`
        );
      }).join('');
      const driverChart =
        `<svg viewBox="0 0 ${W} ${P * 2 + drivers.length * rowH}" width="100%" style="display:block;max-width:520px">` +
        `<line x1="160" y1="${P}" x2="160" y2="${P + drivers.length * rowH}" stroke="var(--rule)" stroke-width="1"/>` +
        barRows +
        `</svg>`;

      const trend = [-8, -12, -10, -15, -18, -22, -28, -32, -35, -38];
      const tW = 460, tH = 150, tP = 24;
      const tMin = Math.min(...trend), tMax = Math.max(...trend);
      const tx = (i: number) => tP + (i / (trend.length - 1)) * (tW - tP * 2);
      const ty = (v: number) => tP + ((tMax - v) / Math.max(tMax - tMin, 1)) * (tH - tP * 2);
      const points = trend.map((v, i) => `${tx(i)},${ty(v)}`).join(' ');
      const dots = trend.map((v, i) => `<circle cx="${tx(i)}" cy="${ty(v)}" r="2.5" fill="var(--negative)"/>`).join('');
      const labels = trend.map((_, i) => `<text x="${tx(i)}" y="${tH - tP + 12}" text-anchor="middle" font-size="9" fill="var(--text-faint)">W${i + 1}</text>`).join('');
      const trendChart =
        `<svg viewBox="0 0 ${tW} ${tH}" width="100%" style="display:block;max-width:520px">` +
        `<line x1="${tP}" y1="${tH - tP}" x2="${tW - tP}" y2="${tH - tP}" stroke="var(--rule)" stroke-width="1"/>` +
        `<polyline points="${points}" fill="none" stroke="var(--negative)" stroke-width="2" stroke-linejoin="round"/>` +
        dots + labels +
        `<text x="${tW - tP}" y="${ty(trend[trend.length - 1]) - 6}" text-anchor="end" font-size="11" font-weight="600" fill="var(--negative)">$${trend[trend.length - 1]}M</text>` +
        `</svg>`;

      return (
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-faint)">AI diagnosis</span><span style="font-size:9px;color:var(--text-faint)">·</span><span style="font-size:9px;color:var(--text-faint)">88% confidence · 4 sources</span></div>` +
        `<strong>Root cause:</strong> the headline gap is dominated by <strong>China macro pressure (−$22M)</strong> + <strong>local competition (−$16M)</strong>, with soft Premium demand (−$10M) compounding it. Germany FX (+$3M) and EUP holiday lift (+$2M) are the only offsets. The trend has compounded for 4 weeks — without intervention, model projects W11 hole at <strong class="text-negative">−$45M to −$52M</strong>.<br/><br/>` +
        `<strong>Driver decomposition</strong> ($M)<br/>` +
        driverChart +
        `<br/><strong>10-week cumulative build</strong><br/>` +
        trendChart +
        `<br/><strong>3 levers</strong> · pick one to model:` +
        `<ul style="margin:6px 0 0 18px;padding:0">` +
        `<li><strong>Pricing:</strong> hold Premium price (no Q1 promo) — model adds back ~+$10M.</li>` +
        `<li><strong>Channel:</strong> reallocate spend from China to EMEA — model adds ~+$6M.</li>` +
        `<li><strong>Supply:</strong> raise LATAM courier ceiling +11% — protects ~+$8M.</li>` +
        `</ul>` +
        `<br/><span style="font-size:10.5px;color:var(--text-faint)"><strong>Sources:</strong> SAP S/4HANA · Anaplan plan baseline · NielsenIQ macro · Salesforce pipeline</span>`
      );
    })(),
    actions: [
      { kind: 'whatif', label: 'Model "Pricing hold" lever',  who: 'Forecast · pricing',     body: 'Adds ~+$10M; tests Premium elasticity assumption.' },
      { kind: 'whatif', label: 'Model "Channel reallocation"', who: 'Forecast · channel',     body: '+$6M expected if EMEA absorbs China spend.' },
      { kind: 'whatif', label: 'Model "Supply lift"',          who: 'Forecast · supply',      body: 'LATAM courier ceiling +11% protects +$8M.' },
      { kind: 'pin',    label: 'Pin diagnosis',                 who: 'Workspace',              body: 'AI diagnosis snapshot.' },
      { kind: 'share',  label: 'Share with Controller',        who: 'Raj · Controller',       body: 'Driver decomposition + recommended levers.' },
    ],
    followUps: [
      'Which lever has the highest ROI?',
      'Show this same breakdown for Q4 2024',
      'What is the cost of the supply lift?',
    ],
  },

  {
    match: /chart.*variance.*region|variance by region|regional breakdown.*chart|bar chart.*region/i,
    text: `<strong>Variance by region — W10 ($M vs Plan):</strong><br/><br/>` +
      `<svg viewBox="0 0 360 180" width="100%" style="display:block;max-width:520px">` +
      `<line x1="100" y1="10" x2="100" y2="160" stroke="var(--rule)" stroke-width="1"/>` +
      [
        { name: 'LATAM',   v: -24 },
        { name: 'NA',       v:  -9 },
        { name: 'APAC',    v:  -7 },
        { name: 'Global',  v:  -2 },
        { name: 'EMEA',    v:   4 },
      ].map((r, i) => {
        const y = 18 + i * 28;
        const max = 30;
        const w = (Math.abs(r.v) / max) * 240;
        const x = r.v < 0 ? 100 - w : 100;
        const c = r.v < 0 ? 'var(--negative)' : 'var(--positive)';
        return (
          `<text x="92" y="${y + 12}" text-anchor="end" font-size="11" fill="var(--text-muted)">${r.name}</text>` +
          `<rect x="${x}" y="${y}" width="${w}" height="16" rx="2" fill="${c}" opacity="0.85"/>` +
          `<text x="${r.v < 0 ? x - 4 : x + w + 4}" y="${y + 12}" text-anchor="${r.v < 0 ? 'end' : 'start'}" font-size="11" font-weight="600" fill="${c}">${r.v > 0 ? '+' : ''}$${r.v}M</text>`
        );
      }).join('') +
      `</svg><br/>` +
      `<strong>Read:</strong> LATAM is 4× the gap of NA. EMEA is the only positive (school holiday lift). Global rolls to <strong class="text-negative">−$38M</strong>.`,
    actions: [
      { kind: 'open',   label: 'Open LATAM drilldown',   who: 'Performance · LATAM',  body: 'Mexico + Brazil supply detail.' },
      { kind: 'whatif', label: 'Model LATAM recovery',    who: 'Forecast · W11',       body: '+15% courier supply scenario.' },
      { kind: 'pin',    label: 'Pin chart to Workspace',  who: 'Workspace',            body: 'W10 regional variance snapshot.' },
      { kind: 'share',  label: 'Share with leadership',   who: 'Exec',                 body: 'Regional variance breakdown.' },
    ],
    followUps: [
      'Why is LATAM so much worse than NA?',
      'Show this trend over the last 10 weeks',
      'Break LATAM into its country drivers',
    ],
  },
  {
    match: /trend.*10.?weeks?|10.?week.?trend|cumulative.*build|line chart.*variance|weekly variance trend/i,
    text: (() => {
      const trend = [-8, -12, -10, -15, -18, -22, -28, -32, -35, -38];
      const W = 520, H = 180, P = 32;
      const min = Math.min(...trend), max = Math.max(...trend);
      const xy = (i: number, v: number) => `${P + (i / (trend.length - 1)) * (W - P * 2)},${P + ((max - v) / Math.max(max - min, 1)) * (H - P * 2)}`;
      const points = trend.map((v, i) => xy(i, v)).join(' ');
      const dots = trend.map((v, i) => `<circle cx="${xy(i, v).split(',')[0]}" cy="${xy(i, v).split(',')[1]}" r="3" fill="var(--negative)"/>`).join('');
      const labels = trend.map((_, i) => `<text x="${xy(i, 0).split(',')[0]}" y="${H - P + 14}" text-anchor="middle" font-size="9" fill="var(--text-faint)">W${i + 1}</text>`).join('');
      return `<strong>Cumulative variance build — last 10 weeks ($M):</strong><br/><br/>` +
        `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:520px">` +
        `<line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--rule)" stroke-width="1"/>` +
        `<line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" stroke="var(--rule)" stroke-width="1"/>` +
        `<polyline points="${points}" fill="none" stroke="var(--negative)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
        dots + labels +
        `</svg><br/>` +
        `<strong>Trough:</strong> W10 at <strong class="text-negative">$${trend[trend.length - 1]}M</strong>. Compounding 4-week negative streak — no auto-recovery signal yet.`;
    })(),
    actions: [
      { kind: 'whatif', label: 'Project W11–W14',         who: 'Forecast',             body: 'Continue trend with current run-rate.' },
      { kind: 'open',   label: 'Open History tab',        who: 'Performance · history',body: 'Full weekly drill.' },
      { kind: 'pin',    label: 'Pin trend',               who: 'Workspace',            body: '10-week build trend.' },
      { kind: 'share',  label: 'Share with CFO',          who: 'Mai · CFO',            body: 'Trend deteriorating week-over-week.' },
    ],
    followUps: [
      'When did the streak start?',
      'How does this compare to last quarter?',
      'What will W11 look like under recovery scenario?',
    ],
  },
  {
    match: /pie chart|donut|driver split|share of variance|composition.*variance/i,
    text: (() => {
      const slices = [
        { name: 'China macro',           v: 22, c: 'var(--negative)' },
        { name: 'Local competition',     v: 16, c: 'var(--negative)' },
        { name: 'Premium soft demand',   v: 10, c: 'var(--negative)' },
        { name: 'Channel mix',            v:  3, c: 'var(--warning)'  },
        { name: 'Other',                   v:  2, c: 'var(--warning)'  },
      ];
      const total = slices.reduce((a, s) => a + s.v, 0);
      const cx = 80, cy = 80, R = 60, r = 36; // donut
      let acc = 0;
      const arc = (start: number, end: number) => {
        const a0 = (start / total) * Math.PI * 2 - Math.PI / 2;
        const a1 = (end   / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > total / 2 ? 1 : 0;
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
        const x3 = cx + r * Math.cos(a0), y3 = cy + r * Math.sin(a0);
        return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
      };
      const paths = slices.map(s => {
        const start = acc;
        acc += s.v;
        return `<path d="${arc(start, acc)}" fill="${s.c}" opacity="0.9"/>`;
      }).join('');
      const legend = slices.map((s, i) => {
        const pct = ((s.v / total) * 100).toFixed(0);
        return `<g transform="translate(180, ${20 + i * 22})">` +
          `<rect x="0" y="2" width="10" height="10" rx="1" fill="${s.c}"/>` +
          `<text x="16" y="11" font-size="11" fill="var(--text-ink)">${s.name}</text>` +
          `<text x="180" y="11" text-anchor="end" font-size="11" font-weight="600" fill="var(--text-muted)">−$${s.v}M · ${pct}%</text>` +
          `</g>`;
      }).join('');
      return `<strong>Variance composition — $${total}M total negative drivers:</strong><br/><br/>` +
        `<svg viewBox="0 0 380 160" width="100%" style="display:block;max-width:520px">` +
        paths + legend +
        `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" fill="var(--text-faint)">Total</text>` +
        `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--negative)">−$${total}M</text>` +
        `</svg><br/>` +
        `<strong>Top 3 drivers</strong> (China macro, local competition, Premium) account for <strong>~88%</strong> of the variance.`;
    })(),
    actions: [
      { kind: 'open',   label: 'Open driver decomposition', who: 'AI Diagnostic',    body: 'Full driver waterfall + lineage.' },
      { kind: 'whatif', label: 'Model "Premium recovers"',  who: 'Forecast',          body: 'If Premium soft demand inflects, what is the gap?' },
      { kind: 'pin',    label: 'Pin composition',           who: 'Workspace',         body: 'W10 driver split.' },
    ],
    followUps: [
      'How fixable is the China macro driver?',
      'Show last 4 weeks of this composition',
      'Which driver is the cheapest to mitigate?',
    ],
  },
  {
    match: /forecast scenarios|w11 scenarios|scenario chart|recovery scenarios/i,
    text: (() => {
      const scenarios = [
        { name: 'Do nothing',           v: -52, c: 'var(--negative)' },
        { name: 'Mexico ceiling lift',   v: -36, c: 'var(--warning)'  },
        { name: '+ Brazil incentive',    v: -28, c: 'var(--warning)'  },
        { name: '+ Premium price hold',  v: -18, c: 'var(--positive)' },
        { name: 'Full recovery package', v:  -8, c: 'var(--positive)' },
      ];
      const max = 60;
      const W = 520, barH = 24, gap = 10, P = 140;
      const H = scenarios.length * (barH + gap) + 12;
      const bars = scenarios.map((s, i) => {
        const y = 8 + i * (barH + gap);
        const w = (Math.abs(s.v) / max) * (W - P - 30);
        return `<text x="${P - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${s.name}</text>` +
          `<rect x="${P}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${s.c}" opacity="0.85"/>` +
          `<text x="${P + w + 6}" y="${y + barH / 2 + 4}" font-size="11" font-weight="600" fill="${s.c}">$${s.v}M</text>`;
      }).join('');
      return `<strong>W11 forecast scenarios — variance vs Plan ($M):</strong><br/><br/>` +
        `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:520px">${bars}</svg><br/>` +
        `<strong>Recommendation:</strong> the combined supply + pricing package gets us within $10M — a defensible miss the CFO can communicate. "Do nothing" is the worst path: −$52M is a disclosure event.`;
    })(),
    actions: [
      { kind: 'approve', label: 'Approve full recovery package', who: 'Mai · CFO',           body: 'Mexico ceiling + BR incentive + Premium price hold.', requires: 'approve_je_over_1m' },
      { kind: 'whatif',  label: 'Add 5th scenario',              who: 'Forecast model',      body: 'Customize variables and re-run.' },
      { kind: 'share',   label: 'Share scenarios with exec',     who: 'Exec leadership',      body: 'W11 forecast options.' },
      { kind: 'pin',     label: 'Pin scenarios',                 who: 'Workspace',            body: 'W11 options analysis.' },
    ],
    followUps: [
      'What is the cost of the full recovery package?',
      'Which scenario has the highest ROI?',
      'How sensitive is the result to Premium pricing?',
    ],
  },
  {
    match: /heatmap|region.*segment.*matrix|cross.*segment|segment heatmap/i,
    text: (() => {
      const segments = ['Grocery', 'Convenience', 'Pharmacy', 'Premium'];
      const regions  = ['NA', 'LATAM', 'EMEA', 'APAC'];
      const cells = [
        [-2, -9, +1, -1],   // Grocery
        [-3, -3, 0,  -1],   // Convenience
        [+1, 0,  -2, 0 ],   // Pharmacy
        [-5, -12, +3, -5],  // Premium
      ];
      const cellW = 80, cellH = 36, leftP = 88, topP = 28;
      const colorFor = (v: number) => {
        if (v <= -8) return 'rgba(239,68,68,0.85)';
        if (v <= -3) return 'rgba(239,68,68,0.45)';
        if (v <   0) return 'rgba(245,158,11,0.45)';
        if (v ===  0) return 'rgba(148,163,184,0.25)';
        return 'rgba(16,185,129,0.6)';
      };
      const W = leftP + cellW * regions.length + 8;
      const H = topP + cellH * segments.length + 8;
      let svg = '';
      // header
      regions.forEach((r, i) => {
        svg += `<text x="${leftP + i * cellW + cellW / 2}" y="${topP - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-ink)">${r}</text>`;
      });
      cells.forEach((row, ri) => {
        svg += `<text x="${leftP - 8}" y="${topP + ri * cellH + cellH / 2 + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${segments[ri]}</text>`;
        row.forEach((v, ci) => {
          svg += `<rect x="${leftP + ci * cellW + 1}" y="${topP + ri * cellH + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="2" fill="${colorFor(v)}"/>`;
          svg += `<text x="${leftP + ci * cellW + cellW / 2}" y="${topP + ri * cellH + cellH / 2 + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${v < -3 ? '#fff' : 'var(--text-ink)'}">${v > 0 ? '+' : ''}${v}</text>`;
        });
      });
      return `<strong>Segment × Region heatmap ($M variance):</strong><br/><br/>` +
        `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-width:520px">${svg}</svg><br/>` +
        `<strong>Hotspot:</strong> Premium × LATAM at <strong class="text-negative">−$12M</strong>. ` +
        `Pharmacy × EMEA is the only meaningful loss outside the obvious LATAM block (Brazilian regulatory delay). ` +
        `EMEA Grocery and Premium are positive — confirms the holiday-tailwind narrative.`;
    })(),
    actions: [
      { kind: 'open',   label: 'Drill into Premium × LATAM', who: 'Performance · LATAM · Premium', body: 'Hotspot: −$12M.' },
      { kind: 'whatif', label: 'Filter heatmap to last 4 weeks', who: 'Time filter',                  body: 'Show 4-week average instead of W10 snapshot.' },
      { kind: 'pin',    label: 'Pin heatmap',                  who: 'Workspace',                     body: 'Segment × Region cross-cut.' },
    ],
    followUps: [
      'Why is Pharmacy × EMEA negative?',
      'Show the same heatmap by margin %',
      'Compare to Q4 2024 heatmap',
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
    id: 'staff-recon',
    label: 'The 3% Discrepancy',
    persona: 'STAFF',
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
  { who: 'Mai Lane', when: '8 min ago', what: 'Pinned CA Retail margin to Board Deck' },
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
  segment: 'Grocery' | 'Convenience' | 'Alcohol' | 'Pharmacy';
  region: string;
  arr: number;          // trip count this week
  deltaArr: number;     // variance vs plan in USD
  nrr: number;          // courier utilization %
  tripsVsPlan: string;  // pre-formatted trip % vs plan (e.g. "-8.3%")
  spark: number[];      // 5-point weekly trend (W6 → W10)
  status: 'Healthy' | 'Expansion' | 'At Risk' | 'Churned';
  lastActivity: string;
}
// Uberflux — segment drill cards (Week 10). Fields adapted to existing DrillRow shape:
//   customer     → segment name (e.g. "Mexico Grocery")
//   segment      → category tag (Grocery / Convenience / Alcohol / Pharmacy)
//   region       → operating region
//   arr          → trip volume this week (count, not dollars)
//   deltaArr     → variance vs Plan in dollars
//   nrr          → courier utilization % (0–100)
//   status       → operational status (Churned ≈ critical miss, At Risk ≈ watch,
//                  Expansion ≈ positive growth, Healthy ≈ on-plan)
//   lastActivity → short operational note
export const PERF_DRILLDOWN: DrillRow[] = [
  { id: 'd1',  customer: 'Mexico Grocery',     segment: 'Grocery',     region: 'LATAM',         arr: 1_240_000, deltaArr: -2_100_000, nrr: 68, tripsVsPlan: '-8.3%',  spark: [55, 50, 45, 42, 40], status: 'Churned',   lastActivity: 'Supply breach · 3 wks' },
  { id: 'd2',  customer: 'US Convenience',     segment: 'Convenience', region: 'North America', arr: 2_100_000, deltaArr:   -900_000, nrr: 74, tripsVsPlan: '-4.2%',  spark: [62, 63, 60, 56, 52], status: 'At Risk',   lastActivity: 'Exit rate spike · W10' },
  { id: 'd3',  customer: 'EUP Grocery',        segment: 'Grocery',     region: 'EMEA',          arr: 3_800_000, deltaArr:    400_000, nrr: 51, tripsVsPlan: '+2.3%',  spark: [52, 53, 54, 55, 58], status: 'Expansion', lastActivity: 'Holiday demand confirmed' },
  { id: 'd4',  customer: 'AU Grocery',         segment: 'Grocery',     region: 'APAC',          arr:   870_000, deltaArr:   -700_000, nrr: 43, tripsVsPlan: '-11.6%', spark: [60, 61, 62, 59, 50], status: 'At Risk',   lastActivity: 'Weather · auto-recovering' },
  { id: 'd5',  customer: 'Brazil Convenience', segment: 'Convenience', region: 'LATAM',         arr: 1_600_000, deltaArr:   -600_000, nrr: 61, tripsVsPlan: '-5.1%',  spark: [58, 57, 56, 55, 54], status: 'At Risk',   lastActivity: 'Approaching threshold' },
  { id: 'd6',  customer: 'UK Convenience',     segment: 'Convenience', region: 'EMEA',          arr: 1_100_000, deltaArr:    100_000, nrr: 49, tripsVsPlan: '+0.9%',  spark: [48, 49, 50, 50, 51], status: 'Healthy',   lastActivity: 'Order freq +3% WoW' },
  { id: 'd7',  customer: 'US Alcohol',         segment: 'Alcohol',     region: 'North America', arr:   620_000, deltaArr:    300_000, nrr: 47, tripsVsPlan: '+6.2%',  spark: [45, 46, 47, 48, 52], status: 'Expansion', lastActivity: 'Super Bowl tailgate spike' },
  { id: 'd8',  customer: 'Colombia Grocery',   segment: 'Grocery',     region: 'LATAM',         arr:   410_000, deltaArr:    300_000, nrr: 54, tripsVsPlan: '+9.1%',  spark: [34, 37, 40, 43, 46], status: 'Expansion', lastActivity: 'Bogotá expansion · +18%' },
  { id: 'd9',  customer: 'Canada Grocery',     segment: 'Grocery',     region: 'North America', arr:   540_000, deltaArr:   -300_000, nrr: 55, tripsVsPlan: '-6.8%',  spark: [58, 57, 56, 55, 51], status: 'At Risk',   lastActivity: 'Toronto cold snap · −7%' },
  { id: 'd10', customer: 'Japan Convenience',  segment: 'Convenience', region: 'APAC',          arr:   820_000, deltaArr:    100_000, nrr: 52, tripsVsPlan: '+1.4%',  spark: [50, 51, 51, 52, 52], status: 'Healthy',   lastActivity: 'Lunch uptick steady' },
  { id: 'd11', customer: 'Taiwan Grocery',     segment: 'Grocery',     region: 'APAC',          arr:   330_000, deltaArr:   -300_000, nrr: 48, tripsVsPlan: '-8.2%',  spark: [40, 38, 35, 34, 33], status: 'At Risk',   lastActivity: 'Lunar NY normalizing' },
  { id: 'd12', customer: 'DACH Pharmacy',      segment: 'Pharmacy',    region: 'EMEA',          arr:   290_000, deltaArr:   -200_000, nrr: 46, tripsVsPlan: '-4.1%',  spark: [32, 31, 30, 29, 29], status: 'At Risk',   lastActivity: 'Regulatory delay · W12 fix' },
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
// Uberflux — 6 week-10 exceptions (3 critical, 2 warning, 2 positive).
export const PERF_EXCEPTIONS: ExceptionItem[] = [
  { id: 'e1', severity: 'critical', title: 'Mexico Grocery — Supply Ceiling Breach', entity: 'LATAM · Grocery',        impact: '-$2.1M', age: 'W8-W10', driver: 'Courier util 68% vs 63% red line · 3rd consecutive week',          owner: 'Ops · MX Lead' },
  { id: 'e2', severity: 'critical', title: 'AU Grocery — Weather Demand Suppression', entity: 'APAC · Grocery',         impact: '-$0.7M', age: 'W10',    driver: 'Eastern seaboard rainfall · Sydney -21%, Melbourne -18%',            owner: 'Ops · APAC' },
  { id: 'e3', severity: 'warning',  title: 'US Convenience — Exit Rate Spike',        entity: 'North America · Conv.',  impact: '-$0.9M', age: 'W10',    driver: '1.8 std devs above seasonal baseline · Super Bowl effect',           owner: 'Demand · US' },
  { id: 'e4', severity: 'warning',  title: 'Brazil Convenience — Supply Early Warning', entity: 'LATAM · Convenience',  impact: '-$0.6M', age: 'W10',    driver: 'Util 61% approaching 63% threshold · Carnival hangover',              owner: 'Ops · BR Lead' },
  { id: 'e5', severity: 'positive', title: 'EUP Grocery — School Holiday Outperformance', entity: 'EMEA · Grocery',     impact: '+$0.4M', age: 'W10',    driver: 'School holidays driving +1.8M incremental trips · FR +18%, UK +14%', owner: 'Demand · EMEA' },
  { id: 'e6', severity: 'positive', title: 'Colombia Grocery — Expansion ROI Positive', entity: 'LATAM · Grocery',      impact: '+$0.3M', age: 'W6-W10', driver: 'Bogotá expansion +18% trips vs baseline · supply healthy 54%',       owner: 'Expansion · LATAM' },
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
// Uberflux — 6 active ML signals (W10).
export const PERF_SIGNALS: SignalItem[] = [
  { id: 's1', title: 'Mexico Supply Ceiling Breach Risk W11',         confidence: 94, horizon: 'W11',       direction: 'down', body: 'Courier utilization trend projects continued breach through W11. Trip dampening cumulative impact accelerating. Model based on 18 comparable historical events.',                suggestedAction: 'Raise supply ceiling to 1,380 couriers (+11%) by Tuesday', model: 'supply-breach-v3' },
  { id: 's2', title: 'Brazil Courier Utilization Approaching Threshold', confidence: 78, horizon: 'W11',    direction: 'down', body: 'Brazil Convenience util at 61%, trajectory crosses 63% by W11 Day 3 under base-case demand forecast. Carnival hangover supply lag is primary driver.',                          suggestedAction: 'Pre-authorize 15% courier incentive this week',            model: 'supply-breach-v3' },
  { id: 's3', title: 'EUP School Holiday Demand Surge Confirmed',     confidence: 96, horizon: 'W10-W11',    direction: 'up',   body: 'French and UK school holidays confirmed driving +1.8M incremental trips vs baseline. Pattern matches W10 2025 and W10 2024 with high fidelity.',                                suggestedAction: 'Hold supply plan · plan W25 amplification',                model: 'demand-holiday-v2' },
  { id: 's4', title: 'AU Eastern Seaboard Rebound — W11 Expected',    confidence: 82, horizon: 'W11-W12',    direction: 'up',   body: 'Post-rainfall rebound modeled at +15% demand uplift over 2 weeks. Historical accuracy on 14 comparable AU weather events: 81%. Supply positioned to absorb.',                   suggestedAction: 'No intervention — monitor auto-recovery',                  model: 'weather-rebound-v1' },
  { id: 's5', title: 'US Convenience Full Recovery Expected W11',     confidence: 87, horizon: 'W11',        direction: 'up',   body: 'Super Bowl exit rate spike resolves in all 3 historical comparisons within 7 days. NYC radius reduction review scheduled for W11. Model confidence high.',                      suggestedAction: 'Review NYC radius reduction W11',                          model: 'seasonal-revert-v2' },
  { id: 's6', title: 'Colombia Expansion: Medellín Readiness Signal', confidence: 71, horizon: 'W12-W14',    direction: 'up',   body: 'Bogotá trajectory at +18% vs plan suggests Medellín expansion (W14 target) feasibility is high. Courier pre-seeding recommended by W12 to hit W14 launch KPIs.',                 suggestedAction: 'Pre-seed Medellín couriers by W12',                        model: 'expansion-readiness-v1' },
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
// Uberflux — 12-week rolling history (Global rollup, W51 2025 → W10 2026).
// Fields adapted: revenue ≈ actual weekly run rate ($M), plan ≈ weekly plan ($M),
// variance = actual - plan, nrr here represents "demand health index", churn =
// count of segments in dampening. Spark is a 4-point trend of the index.
export const PERF_HISTORY: HistoryRow[] = [
  { period: 'W10 · Mar 3–9 2026',    revenue: 38.4, plan: 42.6, variance: -4.2, nrr: 92, churn: 3, spark: [98, 96, 94, 92], annotations: 'Supply breach + weather · 3 critical segments' },
  { period: 'W9 · Feb 24–Mar 2',     revenue: 39.5, plan: 42.6, variance: -3.1, nrr: 94, churn: 2, spark: [99, 97, 95, 94], annotations: 'Supply constraint escalating' },
  { period: 'W8 · Feb 17–23',        revenue: 40.8, plan: 42.6, variance: -1.8, nrr: 96, churn: 1, spark: [100, 99, 97, 96], annotations: 'Supply early warning — MX Grocery threshold crossed' },
  { period: 'W7 · Feb 10–16',        revenue: 43.2, plan: 42.6, variance: +0.6, nrr: 101, churn: 0, spark: [100, 100, 101, 101], annotations: 'On plan' },
  { period: 'W6 · Feb 3–9',          revenue: 43.8, plan: 42.6, variance: +1.2, nrr: 102, churn: 0, spark: [100, 101, 102, 102], annotations: 'Holiday uplift' },
  { period: 'W5 · Jan 27–Feb 2',     revenue: 42.2, plan: 42.6, variance: -0.4, nrr: 99, churn: 0, spark: [100, 100, 99, 99], annotations: 'Minor miss' },
  { period: 'W4 · Jan 20–26',        revenue: 44.7, plan: 42.6, variance: +2.1, nrr: 103, churn: 0, spark: [100, 101, 102, 103], annotations: 'Promo success in LATAM + EMEA' },
  { period: 'W3 · Jan 13–19',        revenue: 43.5, plan: 42.6, variance: +0.9, nrr: 101, churn: 0, spark: [100, 100, 101, 101], annotations: 'On plan' },
  { period: 'W2 · Jan 6–12',         revenue: 41.5, plan: 42.6, variance: -1.1, nrr: 98, churn: 0, spark: [100, 99, 98, 98], annotations: 'Post-holiday normalization' },
  { period: 'W1 · Dec 30–Jan 5',     revenue: 46.4, plan: 42.6, variance: +3.8, nrr: 107, churn: 0, spark: [102, 104, 106, 107], annotations: 'New Year demand surge' },
  { period: 'W52 · Dec 23–29 2025',  revenue: 47.8, plan: 42.6, variance: +5.2, nrr: 110, churn: 0, spark: [104, 106, 108, 110], annotations: 'Christmas peak' },
  { period: 'W51 · Dec 16–22 2025',  revenue: 44.5, plan: 42.6, variance: +1.9, nrr: 104, churn: 0, spark: [101, 102, 103, 104], annotations: 'Pre-holiday ramp' },
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
// Uberflux — 5 operating regions (Global rollup + NA / LATAM / EMEA / APAC).
// Week 10 (Mar 3–9 2026). Data mirrors the Uberflux prototype dataset.
export const PERF_REGIONAL: Record<string, RegionalSlice> = {
  global: {
    statusChip: { kind: 'neg', text: 'Variance flagged · action recommended' },
    kpis: [
      { lbl: 'Total Variance',    val: '-$4.2M',  delta: '▼ vs Plan',   tone: 'neg'  },
      { lbl: 'Segments Flagged',  val: '7',       delta: '3 critical',  tone: 'warn' },
      { lbl: 'Top Driver',        val: 'Supply',  delta: 'Courier util ↑', tone: 'neg' },
      { lbl: 'Commentary',        val: 'Ready',   delta: '08:38 AM ✓',  tone: 'pos'  },
    ],
    commentary: [
      {
        rank: 1, name: 'Mexico Grocery', delta: '−$2.1M vs Plan',
        text: 'Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Supply constraint driving basket-size reduction — similar to W34 2024 storm event. Cencosud co-funding partially offset.',
        tags: [{ t: 'red', l: 'Supply breach' }, { t: 'red', l: '3 wks escalating' }, { t: 'blue', l: 'Predictive flag' }],
      },
      {
        rank: 2, name: 'US Convenience', delta: '−$0.9M vs Plan',
        text: 'CPP 9% trip loss. NYC radius reduction active. Exit rate above seasonal baseline by 1.8 std devs. Super Bowl holiday partially explanatory — pattern consistent with prior 3 Super Bowl weeks.',
        tags: [{ t: 'amber', l: 'Exit rate elevated' }, { t: 'blue', l: 'Seasonal baseline' }],
      },
      {
        rank: 3, name: 'EUP Grocery', delta: '+$1.0M vs Plan',
        text: '+2.3% trips. Courier utilization normalized. School holiday effect confirmed — +1.8M incremental trips vs model baseline. No supply constraints flagged this week.',
        tags: [{ t: 'green', l: 'Above plan' }, { t: 'green', l: 'Holiday confirmed' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 58, p: 62, tone: 'warn' },
      { w: 'W7',   a: 55, p: 62, tone: 'warn' },
      { w: 'W8',   a: 50, p: 62, tone: 'warn' },
      { w: 'W9',   a: 44, p: 62, tone: 'neg'  },
      { w: 'W10',  a: 40, p: 62, tone: 'neg'  },
      { w: 'W11▸', a: 37, p: 62, tone: 'neg', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — Mexico Grocery',
  },
  northamerica: {
    statusChip: { kind: 'warn', text: 'US Convenience exit rate elevated' },
    kpis: [
      { lbl: 'Total Variance',    val: '-$1.1M',   delta: '▼ vs Plan',       tone: 'neg'  },
      { lbl: 'Segments Flagged',  val: '3',        delta: '1 critical',      tone: 'warn' },
      { lbl: 'Top Driver',        val: 'Demand',   delta: 'Exit rate ↑',     tone: 'neg'  },
      { lbl: 'Commentary',        val: 'Ready',    delta: '08:38 AM ✓',      tone: 'pos'  },
    ],
    commentary: [
      {
        rank: 1, name: 'US Convenience', delta: '−$0.9M vs Plan',
        text: 'CPP 9% trip loss. NYC radius reduction active. Exit rate above seasonal baseline by 1.8 std devs. Super Bowl holiday partially explanatory.',
        tags: [{ t: 'amber', l: 'Exit rate elevated' }, { t: 'blue', l: 'Seasonal baseline' }],
      },
      {
        rank: 2, name: 'Canada Grocery', delta: '−$0.3M vs Plan',
        text: 'Cold snap in Toronto reduced orders by 7%. Courier acceptance rate 91% — within normal range. Expected recovery as weather normalizes mid-week.',
        tags: [{ t: 'amber', l: 'Weather impact' }, { t: 'blue', l: 'Auto-recovery likely' }],
      },
      {
        rank: 3, name: 'US Alcohol', delta: '+$0.1M vs Plan',
        text: 'Super Bowl tailgate demand spike. +12% trips Sun–Mon. Margin intact. No supply issues.',
        tags: [{ t: 'green', l: 'Event uplift' }, { t: 'green', l: 'Margin healthy' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 61, p: 64, tone: 'warn' },
      { w: 'W7',   a: 63, p: 64, tone: 'warn' },
      { w: 'W8',   a: 60, p: 64, tone: 'warn' },
      { w: 'W9',   a: 56, p: 64, tone: 'warn' },
      { w: 'W10',  a: 52, p: 64, tone: 'neg'  },
      { w: 'W11▸', a: 58, p: 64, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — US Convenience',
  },
  latam: {
    statusChip: { kind: 'neg', text: 'Critical: LATAM supply constraint — 3rd week' },
    kpis: [
      { lbl: 'Total Variance',    val: '-$2.4M',   delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged',  val: '4',        delta: '3 critical',         tone: 'neg'  },
      { lbl: 'Top Driver',        val: 'Supply',   delta: 'MX courier util',    tone: 'neg'  },
      { lbl: 'Commentary',        val: 'Ready',    delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      {
        rank: 1, name: 'Mexico Grocery', delta: '−$2.1M vs Plan',
        text: 'Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Cencosud co-funding offset −$0.4M. Supply ceiling review overdue.',
        tags: [{ t: 'red', l: 'Supply constraint' }, { t: 'red', l: '3 weeks escalating' }, { t: 'blue', l: 'Predictive: W11 worse' }],
      },
      {
        rank: 2, name: 'Brazil Convenience', delta: '−$0.6M vs Plan',
        text: 'Courier util 61% — approaching red line. São Paulo carnival hangover effect. Trip volume recovering but supply thinning. Early warning flag active.',
        tags: [{ t: 'amber', l: 'Approaching threshold' }, { t: 'amber', l: 'Early warning' }],
      },
      {
        rank: 3, name: 'Colombia Grocery', delta: '+$0.3M vs Plan',
        text: 'Bogotá expansion Week 6 showing returns. Trip volume +18% vs W6 baseline. Courier supply healthy at 54%.',
        tags: [{ t: 'green', l: 'Expansion ROI' }, { t: 'green', l: 'Supply healthy' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 58, p: 62, tone: 'warn' },
      { w: 'W7',   a: 55, p: 62, tone: 'warn' },
      { w: 'W8',   a: 50, p: 62, tone: 'warn' },
      { w: 'W9',   a: 44, p: 62, tone: 'neg'  },
      { w: 'W10',  a: 40, p: 62, tone: 'neg'  },
      { w: 'W11▸', a: 36, p: 62, tone: 'neg', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — Mexico Grocery',
  },
  emea: {
    statusChip: { kind: 'pos', text: 'Beating plan · holiday tailwind' },
    kpis: [
      { lbl: 'Total Variance',    val: '+$0.3M',     delta: '▲ vs Plan',        tone: 'pos'  },
      { lbl: 'Segments Flagged',  val: '2',          delta: '0 critical',       tone: 'pos'  },
      { lbl: 'Top Driver',        val: 'Holiday',    delta: 'School break EU',  tone: 'pos'  },
      { lbl: 'Commentary',        val: 'Ready',      delta: '08:38 AM ✓',       tone: 'pos'  },
    ],
    commentary: [
      {
        rank: 1, name: 'EUP Grocery', delta: '+$0.4M vs Plan',
        text: '+2.3% trips. Courier utilization 51% — healthy. School holiday confirmed driving demand. France +18%, UK +14% vs baseline.',
        tags: [{ t: 'green', l: 'Positive variance' }, { t: 'green', l: 'Holiday confirmed' }],
      },
      {
        rank: 2, name: 'UK Convenience', delta: '+$0.1M vs Plan',
        text: 'Steady week. Order frequency up 3%. No exceptions. Margin expanding slightly due to AOV mix shift.',
        tags: [{ t: 'green', l: 'On track' }, { t: 'green', l: 'Margin expansion' }],
      },
      {
        rank: 3, name: 'DACH Pharmacy', delta: '−$0.2M vs Plan',
        text: 'Germany regulatory delay impacting Rx fulfilment. 3% of SKUs affected. Resolution expected W12. Non-material.',
        tags: [{ t: 'amber', l: 'Regulatory' }, { t: 'blue', l: 'W12 resolution' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 52, p: 54, tone: 'warn' },
      { w: 'W7',   a: 53, p: 54, tone: 'warn' },
      { w: 'W8',   a: 54, p: 54, tone: 'pos'  },
      { w: 'W9',   a: 55, p: 54, tone: 'pos'  },
      { w: 'W10',  a: 58, p: 54, tone: 'pos'  },
      { w: 'W11▸', a: 56, p: 54, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — EUP Grocery',
  },
  apac: {
    statusChip: { kind: 'warn', text: 'AU weather event — auto-recovering' },
    kpis: [
      { lbl: 'Total Variance',    val: '-$0.9M',     delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged',  val: '3',          delta: '1 critical',        tone: 'warn' },
      { lbl: 'Top Driver',        val: 'Demand',     delta: 'AU weather',        tone: 'warn' },
      { lbl: 'Commentary',        val: 'Ready',      delta: '08:38 AM ✓',        tone: 'pos'  },
    ],
    commentary: [
      {
        rank: 1, name: 'AU Grocery', delta: '−$0.7M vs Plan',
        text: 'Eastern seaboard rainfall. Demand suppressed across Grocery and Convenience. Sydney −21%, Melbourne −18% vs weekly baseline. Auto-recovery expected W11–W12.',
        tags: [{ t: 'amber', l: 'Weather impact' }, { t: 'blue', l: 'Auto-recovery W11' }],
      },
      {
        rank: 2, name: 'Japan Convenience', delta: '+$0.1M vs Plan',
        text: 'Steady performance. Convenience segment outperforming on lunch ordering uptick. AOV stable.',
        tags: [{ t: 'green', l: 'On track' }],
      },
      {
        rank: 3, name: 'Taiwan Grocery', delta: '−$0.3M vs Plan',
        text: 'Lunar New Year hangover — demand normalization in progress. Expected back to baseline by W12.',
        tags: [{ t: 'amber', l: 'Seasonal' }, { t: 'blue', l: 'Normalizing' }],
      },
    ],
    chart: [
      { w: 'W6',   a: 60, p: 62, tone: 'warn' },
      { w: 'W7',   a: 61, p: 62, tone: 'warn' },
      { w: 'W8',   a: 62, p: 62, tone: 'pos'  },
      { w: 'W9',   a: 59, p: 62, tone: 'warn' },
      { w: 'W10',  a: 50, p: 62, tone: 'neg'  },
      { w: 'W11▸', a: 57, p: 62, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — AU Grocery',
  },
};

// ==========================================================================
// PERFORMANCE — comparison-aware KPI overrides
// Adjusts `val`, `delta`, and `tone` so changing the Compare dropdown
// produces a clearly visible shift (value changes, color flips, arrows flip).
// ==========================================================================
type CompareOverride = { val?: string; delta: string; tone: 'pos' | 'neg' | 'warn' };
type CompareFn = (orig: Kpi) => CompareOverride;

function matchKpi(lbl: string): 'variance' | 'flagged' | 'driver' | 'commentary' | 'other' {
  const l = lbl.toLowerCase();
  if (l.includes('variance'))   return 'variance';
  if (l.includes('flagged'))    return 'flagged';
  if (l.includes('driver'))     return 'driver';
  if (l.includes('commentary')) return 'commentary';
  return 'other';
}

// Uberflux Global totals per comparison mode (anchor values for the KPI strip).
// Region-level numbers still come from each `RegionalSlice`; these overrides
// flip the Total Variance KPI to reflect the active comparison lens.
const COMPARE_OVERRIDE_MAP: Record<string, CompareFn> = {
  // vs Plan — keep each region's authored values.
  plan: (k) => ({ val: k.val, delta: k.delta, tone: k.tone }),

  // vs Prior Week — every region trended positive WoW.
  priorwk: (k) => {
    switch (matchKpi(k.lbl)) {
      case 'variance':   return { val: '+$0.8M',  delta: '▲ vs Prior Week',  tone: 'pos'  };
      case 'flagged':    return { val: '5',       delta: '2 fewer WoW',      tone: 'pos'  };
      case 'driver':     return { val: 'Holiday', delta: 'EMEA tailwind',    tone: 'pos'  };
      case 'commentary': return { val: 'Ready',   delta: '08:38 AM ✓',       tone: 'pos'  };
      default:           return { delta: k.delta, tone: k.tone };
    }
  },

  // vs Prior Year — strong YoY growth (partly weak comps).
  prioryr: (k) => {
    switch (matchKpi(k.lbl)) {
      case 'variance':   return { val: '+$12.1M', delta: '▲ vs Prior Year',  tone: 'pos'  };
      case 'flagged':    return { val: '2',       delta: '0 critical',       tone: 'pos'  };
      case 'driver':     return { val: 'Growth',  delta: 'Market expansion', tone: 'pos'  };
      case 'commentary': return { val: 'Ready',   delta: '08:38 AM ✓',       tone: 'pos'  };
      default:           return { delta: k.delta, tone: k.tone };
    }
  },

  // vs Forecast — missed internal forecast despite embedded risk.
  forecast: (k) => {
    switch (matchKpi(k.lbl)) {
      case 'variance':   return { val: '-$1.9M',  delta: '▼ vs Forecast',    tone: 'warn' };
      case 'flagged':    return { val: '4',       delta: '2 unforecast',     tone: 'warn' };
      case 'driver':     return { val: 'Weather', delta: 'Unmodeled AU',     tone: 'warn' };
      case 'commentary': return { val: 'Ready',   delta: '08:38 AM ✓',       tone: 'pos'  };
      default:           return { delta: k.delta, tone: k.tone };
    }
  },

  // vs Run Rate — below 8-week trend; LATAM structural drag.
  runrate: (k) => {
    switch (matchKpi(k.lbl)) {
      case 'variance':   return { val: '-$2.8M',  delta: '▼ vs Run Rate',    tone: 'neg'  };
      case 'flagged':    return { val: '6',       delta: 'trend declining',  tone: 'neg'  };
      case 'driver':     return { val: 'Supply',  delta: 'LATAM drag',       tone: 'neg'  };
      case 'commentary': return { val: 'Ready',   delta: '08:38 AM ✓',       tone: 'pos'  };
      default:           return { delta: k.delta, tone: k.tone };
    }
  },
};

export function adjustKpisByCompare(kpis: Kpi[], compareKey: string): Kpi[] {
  const fn = COMPARE_OVERRIDE_MAP[compareKey] ?? COMPARE_OVERRIDE_MAP.plan;
  return kpis.map(k => {
    const o = fn(k);
    return { ...k, val: o.val ?? k.val, delta: o.delta, tone: o.tone };
  });
}

// ==========================================================================
// PERFORMANCE — driver filter for commentary
// Matches a driver key to a rough keyword search in commentary item names/tags.
// ==========================================================================
// Uberflux — map each segment key to a set of name/tag keywords so clicking a
// segment in the left rail filters the commentary (and drill-down events from
// the right-side Variance Deep-Dive panel) down to matching rows.
const DRIVER_KEYWORDS: Record<string, string[]> = {
  grocery:     ['grocery', 'mexico grocery', 'eup grocery', 'au grocery', 'canada grocery', 'taiwan grocery', 'colombia grocery'],
  convenience: ['convenience', 'us convenience', 'uk convenience', 'brazil convenience', 'japan convenience'],
  alcohol:     ['alcohol', 'us alcohol', 'eup alcohol'],
  pharmacy:    ['pharmacy', 'dach pharmacy', 'us pharmacy', 'apac pharmacy', 'rx'],
};
export function filterCommentaryByDriver(
  items: CommentaryItem[],
  driverKey: string | null,
  keywordOverrides?: Record<string, string[]>,
): CommentaryItem[] {
  if (!driverKey) return items;
  const kws = (keywordOverrides?.[driverKey]) ?? DRIVER_KEYWORDS[driverKey] ?? [driverKey];
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
