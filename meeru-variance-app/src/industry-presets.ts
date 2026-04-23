/**
 * ==============================================================================
 * INDUSTRY PRESETS
 * ==============================================================================
 * Each preset supplies the full data needed by the Performance workbench:
 *   - meta:      labels, period, metric name
 *   - regions:   left-rail region list (with delta + tone)
 *   - segments:  left-rail "Segments" list (category filter)
 *   - regional:  per-region KPIs + commentary + chart + chart title
 *   - drilldown: segment cards for the Drill-Down tab
 *   - exceptions: Exceptions tab rows
 *   - signals:   ML Signals tab rows
 *   - history:   rolling-period History tab rows
 *   - bridges:   per-region AI summary for the inline AI pill
 *   - segmentKeywords + drillKeywordMap: drive the right-nav drill event
 *
 * Switching industries in Settings rebuilds Performance.tsx from the preset
 * so regions / cards / charts / exceptions / signals / history all change.
 * ==============================================================================
 */

import type {
  IndustryKey, IndustryMeta, LeftItem, CommentaryItem, ChartBar,
} from './types';
import type {
  RegionalSlice, DrillRow, ExceptionItem, SignalItem, HistoryRow,
} from './data';
import {
  PERF_REGIONS, PERF_COMPARES, PERF_DRIVERS,
  PERF_REGIONAL, PERF_DRILLDOWN, PERF_EXCEPTIONS, PERF_SIGNALS, PERF_HISTORY,
} from './data';
import type { ReactNode } from 'react';

// ==========================================================
// Shared types for the preset bundle
// ==========================================================
export interface RegionBridgeData {
  aha: ReactNode;
  planM: number;
  actualM: number;
  drivers: { label: string; valueM: number }[];
}

export interface IndustryPreset {
  meta: IndustryMeta;
  regions: LeftItem[];
  segments: LeftItem[];
  compares: LeftItem[];
  regional: Record<string, RegionalSlice>;
  drilldown: DrillRow[];
  exceptions: ExceptionItem[];
  signals: SignalItem[];
  history: HistoryRow[];
  bridges: Record<string, RegionBridgeData>;
  /** Segment-key → search keywords for commentary driver filter. */
  segmentKeywords: Record<string, string[]>;
  /** Map a drill-event item name (e.g. "Mexico Grocery") → segment-key. */
  drillKeywordMap: (itemName: string) => string | null;
}

// ==========================================================
// Bridge (AI-summary) data for Delivery — kept inline in this module since
// it relies on JSX. Sourced from original PERF_BRIDGE in Performance.tsx.
// ==========================================================
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';

const deliveryBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: _jsxs(_Fragment, { children: [
      _jsxs('b', { children: ['Week 10 · Global −$4.2M vs Plan.'] }),
      ' Mexico Grocery supply constraint (',
      _jsx('b', { className: 'text-negative', children: '-$2.1M' }),
      ') is 3rd consecutive week above the 63% courier-util red line. US Convenience Super Bowl exit rate (',
      _jsx('b', { className: 'text-negative', children: '-$0.9M' }),
      ') + AU eastern-seaboard rainfall (',
      _jsx('b', { className: 'text-negative', children: '-$0.7M' }),
      ') stack on top. EUP Grocery school holiday (',
      _jsx('b', { className: 'text-positive', children: '+$1.0M' }),
      ') is the only positive region.',
    ]}),
    planM: 42.6, actualM: 38.4,
    drivers: [
      { label: 'Mexico Grocery',     valueM: -2.1 },
      { label: 'US Convenience',     valueM: -0.9 },
      { label: 'AU Grocery',         valueM: -0.7 },
      { label: 'Brazil Convenience', valueM: -0.6 },
      { label: 'DACH Pharmacy',      valueM: -0.2 },
      { label: 'EUP Grocery',        valueM: +1.0 },
      { label: 'Other',              valueM: -0.7 },
    ],
  },
  northamerica: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'North America −$1.1M vs Plan — US Convenience + Canada weather.' }),
      ' Super Bowl exit-rate spike (',
      _jsx('b', { className: 'text-negative', children: '-$0.9M' }),
      '). Toronto cold snap cut Canada orders 7% (',
      _jsx('b', { className: 'text-negative', children: '-$0.3M' }),
      '). US Alcohol partial offset (',
      _jsx('b', { className: 'text-positive', children: '+$0.1M' }),
      '). W11 projects −$0.4M.',
    ]}),
    planM: 18.2, actualM: 17.1,
    drivers: [
      { label: 'US Convenience', valueM: -0.9 },
      { label: 'Canada Grocery', valueM: -0.3 },
      { label: 'US Alcohol',     valueM: +0.1 },
      { label: 'Other',          valueM:  0   },
    ],
  },
  latam: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'LATAM −$2.4M vs Plan — Mexico Grocery drives 87% of the miss.' }),
      ' Courier util 68% for 3 weeks (',
      _jsx('b', { className: 'text-negative', children: '-$2.1M' }),
      '). Brazil Convenience approaching threshold (',
      _jsx('b', { className: 'text-negative', children: '-$0.6M' }),
      '). Colombia expansion (',
      _jsx('b', { className: 'text-positive', children: '+$0.3M' }),
      ') tracks 2× launch model.',
    ]}),
    planM: 12.4, actualM: 10.0,
    drivers: [
      { label: 'Mexico Grocery',     valueM: -2.1 },
      { label: 'Brazil Convenience', valueM: -0.6 },
      { label: 'Colombia Grocery',   valueM: +0.3 },
      { label: 'Other',              valueM:  0   },
    ],
  },
  emea: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'EMEA +$0.3M vs Plan — only positive region this week.' }),
      ' School holidays add ',
      _jsx('b', { children: '+1.8M incremental trips' }),
      '. EUP Grocery (',
      _jsx('b', { className: 'text-positive', children: '+$0.4M' }),
      '); UK Convenience AOV mix (',
      _jsx('b', { className: 'text-positive', children: '+$0.1M' }),
      '). DACH Pharmacy regulatory (',
      _jsx('b', { className: 'text-negative', children: '-$0.2M' }),
      ') non-material.',
    ]}),
    planM: 6.8, actualM: 7.1,
    drivers: [
      { label: 'EUP Grocery',    valueM: +0.4 },
      { label: 'UK Convenience', valueM: +0.1 },
      { label: 'DACH Pharmacy',  valueM: -0.2 },
      { label: 'Other',          valueM:  0   },
    ],
  },
  apac: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'APAC −$0.9M vs Plan — weather-driven, auto-recovering.' }),
      ' AU rainfall suppressed Sydney −21%, Melbourne −18% (',
      _jsx('b', { className: 'text-negative', children: '-$0.7M' }),
      '). Taiwan Lunar NY (',
      _jsx('b', { className: 'text-negative', children: '-$0.3M' }),
      '). Japan lunch uptick (',
      _jsx('b', { className: 'text-positive', children: '+$0.1M' }),
      '). Historical AU rebound +15% / 2 weeks — no action required.',
    ]}),
    planM: 5.2, actualM: 4.3,
    drivers: [
      { label: 'AU Grocery',        valueM: -0.7 },
      { label: 'Taiwan Grocery',    valueM: -0.3 },
      { label: 'Japan Convenience', valueM: +0.1 },
      { label: 'Other',              valueM:  0  },
    ],
  },
};

// ==========================================================
// DELIVERY preset — re-exports existing Uberflux data
// ==========================================================
const deliveryPreset: IndustryPreset = {
  meta: {
    key: 'delivery',
    label: 'On-Demand Delivery',
    short: 'Delivery',
    tagline: 'Marketplace ops · grocery, convenience, alcohol, pharmacy',
    periodLabel: 'Week 10 · Mar 3–9 2026',
    metricLabel: 'Trips',
    volumeFormat: 'trips',
    drillLabels: { primary: 'Courier Util', volume: 'Trips W10', variance: 'vs Plan' },
    defaultPrompts: [
      'Why did LATAM underperform this week?',
      'What should we watch before Tuesday?',
      'Which regions are most at risk next week?',
    ],
  },
  regions: PERF_REGIONS,
  segments: PERF_DRIVERS,
  compares: PERF_COMPARES,
  regional: PERF_REGIONAL,
  drilldown: PERF_DRILLDOWN,
  exceptions: PERF_EXCEPTIONS,
  signals: PERF_SIGNALS,
  history: PERF_HISTORY,
  bridges: deliveryBridges,
  segmentKeywords: {
    grocery:     ['grocery', 'mexico grocery', 'eup grocery', 'au grocery', 'canada grocery', 'taiwan grocery', 'colombia grocery'],
    convenience: ['convenience', 'us convenience', 'uk convenience', 'brazil convenience', 'japan convenience'],
    alcohol:     ['alcohol', 'us alcohol', 'eup alcohol'],
    pharmacy:    ['pharmacy', 'dach pharmacy', 'us pharmacy', 'apac pharmacy', 'rx'],
  },
  drillKeywordMap: (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('alcohol')) return 'alcohol';
    if (l.includes('pharmacy') || l.includes('rx')) return 'pharmacy';
    if (l.includes('convenience')) return 'convenience';
    if (l.includes('grocery')) return 'grocery';
    return null;
  },
};

// ==========================================================
// SaaS / Enterprise Software preset
// Period: Q1 FY2026 · Metric: ARR (Annual Recurring Revenue)
// Segments: Enterprise, Mid-Market, SMB, Startup
// ==========================================================
const saasRegions: LeftItem[] = [
  { k: 'global',       n: 'Global',        d: '-$2.8M', tone: 'neg'  },
  { k: 'northamerica', n: 'North America', d: '-$1.4M', tone: 'neg'  },
  { k: 'emea',         n: 'EMEA',          d: '+$0.6M', tone: 'pos'  },
  { k: 'apac',         n: 'APAC',          d: '-$0.5M', tone: 'warn' },
  { k: 'latam',        n: 'LATAM',         d: '-$1.5M', tone: 'neg'  },
];

const saasSegments: LeftItem[] = [
  { k: 'enterprise', n: 'Enterprise', d: '-$2.1M', tone: 'neg'  },
  { k: 'midmarket',  n: 'Mid-Market', d: '+$0.5M', tone: 'pos'  },
  { k: 'smb',        n: 'SMB',        d: '-$0.6M', tone: 'warn' },
  { k: 'startup',    n: 'Startup',    d: '-$0.6M', tone: 'warn' },
];

const saasRegional: Record<string, RegionalSlice> = {
  global: {
    statusChip: { kind: 'neg', text: 'Enterprise churn cluster · action required' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$2.8M',       delta: '▼ vs Plan',        tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '5',            delta: '2 critical',       tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Churn',        delta: '3 Enterprise logos', tone: 'neg' },
      { lbl: 'Commentary',       val: 'Ready',        delta: '08:38 AM ✓',       tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Enterprise', delta: '−$2.1M vs Plan',
        text: '3 logo churns in Q1 — Acme Corp ($800K), GlobalTech ($750K), DataStar ($550K). NRR declined from 115% to 108%. 2 additional at-risk accounts on renewal pipeline. Expansion ARR partially offsets at +$600K.',
        tags: [{ t: 'red', l: 'Churn spike' }, { t: 'red', l: 'NRR decline' }, { t: 'blue', l: 'Predictive flag' }] },
      { rank: 2, name: 'Mid-Market', delta: '+$0.5M vs Plan',
        text: 'Strong new-logo acquisition — 12 new accounts vs 8 planned. Average deal size $42K, up 15% from prior quarter. Land-and-expand motion working well in FinServ vertical.',
        tags: [{ t: 'green', l: 'New logos' }, { t: 'green', l: 'Deal size ↑' }] },
      { rank: 3, name: 'SMB', delta: '−$0.6M vs Plan',
        text: 'Self-serve signups flat. Free-to-paid conversion dropped to 3.2% from 4.1%. APAC pricing experiment showing early positive signals but not yet material.',
        tags: [{ t: 'amber', l: 'Conversion drop' }, { t: 'blue', l: 'Pricing test' }] },
    ],
    chart: [
      { w: 'Nov',  a: 41.2, p: 40.8, tone: 'pos'  },
      { w: 'Dec',  a: 41.8, p: 41.2, tone: 'pos'  },
      { w: 'Jan',  a: 40.9, p: 42.0, tone: 'warn' },
      { w: 'Feb',  a: 39.8, p: 42.4, tone: 'neg'  },
      { w: 'Mar',  a: 38.4, p: 41.2, tone: 'neg'  },
      { w: 'Apr▸', a: 39.1, p: 41.8, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly ARR Variance — Global',
  },
  northamerica: {
    statusChip: { kind: 'neg', text: 'Enterprise cohort renewal risk' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$1.4M',      delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '3',           delta: '2 critical',        tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Churn',       delta: '2022 cohort',       tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',        tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Enterprise West',   delta: '−$1.0M vs Plan',
        text: 'Acme Corp, DataStar, Parkline all on the 2022 renewal cohort. Retention model flags 2 more at >60% risk. Executive outreach in progress.',
        tags: [{ t: 'red', l: 'Churn' }, { t: 'amber', l: '2022 cohort' }] },
      { rank: 2, name: 'Mid-Market East',   delta: '+$0.2M vs Plan',
        text: 'Northeast strong — NY FinServ vertical new logos +28%. Advisory deal cycle pulling forward 3 weeks.',
        tags: [{ t: 'green', l: 'New logos' }] },
      { rank: 3, name: 'SMB',               delta: '−$0.3M vs Plan',
        text: 'Conversion softening; landing page A/B test in flight. Expect stabilization by late Q2.',
        tags: [{ t: 'amber', l: 'Conversion' }, { t: 'blue', l: 'Test active' }] },
    ],
    chart: [
      { w: 'Nov',  a: 18.8, p: 18.6, tone: 'pos'  },
      { w: 'Dec',  a: 18.9, p: 18.7, tone: 'pos'  },
      { w: 'Jan',  a: 18.4, p: 19.0, tone: 'warn' },
      { w: 'Feb',  a: 17.8, p: 19.2, tone: 'neg'  },
      { w: 'Mar',  a: 17.1, p: 18.5, tone: 'neg'  },
      { w: 'Apr▸', a: 17.6, p: 18.8, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly ARR Variance — North America',
  },
  emea: {
    statusChip: { kind: 'pos', text: 'Expansion wave · beating plan' },
    kpis: [
      { lbl: 'Total Variance',   val: '+$0.6M',      delta: '▲ vs Plan',         tone: 'pos'  },
      { lbl: 'Segments Flagged', val: '1',           delta: '0 critical',        tone: 'pos'  },
      { lbl: 'Top Driver',       val: 'Expansion',   delta: 'UK FinServ',        tone: 'pos'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',        tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'UK FinServ',        delta: '+$0.4M vs Plan',
        text: 'Northbridge expansion closed; 3 other accounts in active seat-growth. Compliance module upsell attach hit 64% vs 40% plan.',
        tags: [{ t: 'green', l: 'Seat expansion' }, { t: 'green', l: 'Upsell attach' }] },
      { rank: 2, name: 'DACH Enterprise',   delta: '+$0.2M vs Plan',
        text: 'Steady quarter. Voltair renewal completed on-time. Pipeline +18% vs prior Q.',
        tags: [{ t: 'green', l: 'Renewal' }] },
      { rank: 3, name: 'Nordics SMB',       delta: 'Flat',
        text: 'No material change. Conversion rates holding at Q4 levels.',
        tags: [{ t: 'blue', l: 'On plan' }] },
    ],
    chart: [
      { w: 'Nov',  a: 6.4, p: 6.5, tone: 'warn' },
      { w: 'Dec',  a: 6.6, p: 6.6, tone: 'pos'  },
      { w: 'Jan',  a: 6.8, p: 6.6, tone: 'pos'  },
      { w: 'Feb',  a: 7.0, p: 6.7, tone: 'pos'  },
      { w: 'Mar',  a: 7.1, p: 6.8, tone: 'pos'  },
      { w: 'Apr▸', a: 7.3, p: 7.0, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Monthly ARR Variance — EMEA',
  },
  apac: {
    statusChip: { kind: 'warn', text: 'Renewal timing · auto-recovering' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$0.5M',      delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '0 critical',        tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Timing',      delta: 'JP quarter-end',    tone: 'warn' },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',        tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Japan Enterprise',  delta: '−$0.4M vs Plan',
        text: 'Quarter-end renewal timing pushed 4 deals into Q2. No risk — 100% renewal probability model score.',
        tags: [{ t: 'amber', l: 'Timing' }, { t: 'blue', l: 'Q2 pull-fwd' }] },
      { rank: 2, name: 'AU Mid-Market',     delta: '-$0.1M vs Plan',
        text: 'Minor pipeline slip. No structural concern.',
        tags: [{ t: 'amber', l: 'Slip' }] },
      { rank: 3, name: 'India Startup',     delta: 'Flat',
        text: 'Self-serve steady. Free tier signups +22% WoW.',
        tags: [{ t: 'green', l: 'Free tier ↑' }] },
    ],
    chart: [
      { w: 'Nov',  a: 4.2, p: 4.1, tone: 'pos'  },
      { w: 'Dec',  a: 4.3, p: 4.2, tone: 'pos'  },
      { w: 'Jan',  a: 4.1, p: 4.3, tone: 'warn' },
      { w: 'Feb',  a: 4.0, p: 4.4, tone: 'warn' },
      { w: 'Mar',  a: 3.9, p: 4.4, tone: 'neg'  },
      { w: 'Apr▸', a: 4.4, p: 4.5, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly ARR Variance — APAC',
  },
  latam: {
    statusChip: { kind: 'neg', text: 'New market ramp below plan' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$1.5M',      delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '1 critical',        tone: 'neg'  },
      { lbl: 'Top Driver',       val: 'New market',  delta: 'Brazil ramp',       tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',        tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Brazil Enterprise', delta: '−$1.2M vs Plan',
        text: 'Local partnership ramp slower than modeled. Hiring 4 FTEs to accelerate; revised W20 outlook.',
        tags: [{ t: 'red', l: 'Ramp' }, { t: 'amber', l: 'Hiring' }] },
      { rank: 2, name: 'Mexico Mid-Market', delta: '-$0.4M vs Plan',
        text: 'FX headwind + cycle extension. Deals closing but at 90% of planned ACV.',
        tags: [{ t: 'amber', l: 'FX' }] },
      { rank: 3, name: 'Chile SMB',          delta: '+$0.1M vs Plan',
        text: 'Healthy conversion. Low base but trending up.',
        tags: [{ t: 'green', l: 'Conversion' }] },
    ],
    chart: [
      { w: 'Nov',  a: 1.8, p: 1.9, tone: 'warn' },
      { w: 'Dec',  a: 1.9, p: 2.0, tone: 'warn' },
      { w: 'Jan',  a: 2.0, p: 2.3, tone: 'neg'  },
      { w: 'Feb',  a: 2.0, p: 2.5, tone: 'neg'  },
      { w: 'Mar',  a: 2.3, p: 2.7, tone: 'neg'  },
      { w: 'Apr▸', a: 2.6, p: 2.9, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly ARR Variance — LATAM',
  },
};

const saasDrilldown: DrillRow[] = [
  { id: 's1',  customer: 'Acme Corp',        segment: 'Alcohol',     region: 'North America', arr:   800_000, deltaArr: -800_000, nrr:  0, tripsVsPlan: '-100%', spark: [100, 80, 50, 20, 0],   status: 'Churned',   lastActivity: 'Churned · 12d ago' },
  { id: 's2',  customer: 'GlobalTech',       segment: 'Alcohol',     region: 'North America', arr:   750_000, deltaArr: -750_000, nrr:  0, tripsVsPlan: '-100%', spark: [95, 80, 60, 30, 0],    status: 'Churned',   lastActivity: 'Churned · 9d ago' },
  { id: 's3',  customer: 'Northbridge',      segment: 'Alcohol',     region: 'EMEA',          arr:   920_000, deltaArr:  180_000, nrr: 124, tripsVsPlan: '+24.3%', spark: [78, 84, 92, 105, 124], status: 'Expansion', lastActivity: 'Seat expansion · 1d' },
  { id: 's4',  customer: 'Voltair',          segment: 'Alcohol',     region: 'North America', arr:   680_000, deltaArr:        0, nrr:  95, tripsVsPlan: '-5.0%',  spark: [110, 105, 100, 95, 95],status: 'At Risk',   lastActivity: 'Silent 18d · outreach' },
  { id: 's5',  customer: 'Reaktor',          segment: 'Grocery',     region: 'EMEA',          arr:   260_000, deltaArr:   42_000, nrr: 119, tripsVsPlan: '+18.1%', spark: [92, 100, 108, 115, 119], status: 'Expansion', lastActivity: 'Upsell · 2d ago' },
  { id: 's6',  customer: 'Finley Finance',   segment: 'Grocery',     region: 'North America', arr:   180_000, deltaArr:   35_000, nrr: 122, tripsVsPlan: '+22.0%', spark: [88, 96, 108, 115, 122], status: 'Expansion', lastActivity: 'Compliance add-on' },
  { id: 's7',  customer: 'Wavelength',       segment: 'Grocery',     region: 'APAC',          arr:   145_000, deltaArr:   12_000, nrr: 109, tripsVsPlan: '+9.2%',  spark: [95, 100, 105, 107, 109], status: 'Healthy',   lastActivity: 'Renewal · 6d ago' },
  { id: 's8',  customer: 'BrightRidge',      segment: 'Convenience', region: 'LATAM',         arr:    92_000, deltaArr:   -8_000, nrr:  94, tripsVsPlan: '-8.0%',  spark: [103, 100, 98, 96, 94],  status: 'At Risk',   lastActivity: 'Silent 14d' },
  { id: 's9',  customer: 'Kite Studio',      segment: 'Convenience', region: 'North America', arr:     9_600, deltaArr:    1_200, nrr: 113, tripsVsPlan: '+13.6%', spark: [100, 104, 108, 111, 113], status: 'Healthy',   lastActivity: 'Self-serve upgrade' },
  { id: 's10', customer: 'Lumen SMB',        segment: 'Pharmacy',    region: 'EMEA',          arr:    14_400, deltaArr:     -800, nrr:  95, tripsVsPlan: '-5.2%',  spark: [100, 99, 97, 96, 95],   status: 'Healthy',   lastActivity: 'Renewal on track' },
];

const saasExceptions: ExceptionItem[] = [
  { id: 'se1', severity: 'critical', title: 'Enterprise churn cluster — 3 logos',         entity: 'North America · Enterprise',   impact: '-$2.1M ARR',  age: 'Q1 2026', driver: '2022 cohort renewal · pricing + product fit', owner: 'Sue Park · VP Sales' },
  { id: 'se2', severity: 'critical', title: 'Voltair likely to churn',                    entity: 'North America · Mid-Market',   impact: '-$680K ARR',  age: '18 days', driver: 'Silent since W5; retention model at 28%',      owner: 'Priya · CS' },
  { id: 'se3', severity: 'warning',  title: 'NRR declining 3 quarters in a row',          entity: 'Global',                       impact: '-7pp',        age: '1 quarter', driver: '2022 cohort renewals',                       owner: 'Priya · CS' },
  { id: 'se4', severity: 'warning',  title: 'Mid-Market add-on attach below target',      entity: 'Mid-Market',                   impact: '-$0.7M ARR',  age: '4 weeks', driver: 'Enablement gap',                              owner: 'Nina · Product' },
  { id: 'se5', severity: 'positive', title: 'Northbridge expansion closed',               entity: 'EMEA · UK FinServ',            impact: '+$180K ARR',  age: '1 day',   driver: 'Compliance module attach',                    owner: 'AM · EMEA' },
  { id: 'se6', severity: 'positive', title: 'APAC pricing experiment beating target',     entity: 'APAC · SMB',                   impact: '+3.1pp conv', age: '1 week',  driver: 'Tier repackaging',                            owner: 'Nina · Product' },
];

const saasSignals: SignalItem[] = [
  { id: 'ssig1', title: 'CA Enterprise churn to accelerate',           confidence: 94, horizon: 'Q2',       direction: 'down', body: 'Retention model flags 2 more CA accounts at >60% risk based on usage/sentiment/ticket signals.', suggestedAction: 'Executive outreach this week', model: 'retention-v5' },
  { id: 'ssig2', title: 'EMEA expansion window opens Q2 Week 3',       confidence: 87, horizon: 'Q2 W3-W5', direction: 'up',   body: '4 accounts have seat utilization >95% with budget approval cycle. Pattern matches 2024 Q2 expansion.', suggestedAction: 'Brief AMs before Friday',      model: 'expansion-v2' },
  { id: 'ssig3', title: 'APAC price test beats target by 15%',         confidence: 78, horizon: 'End of Q2', direction: 'up',   body: 'Free-to-paid conversion in APAC repackaging trial at 4.8% (target 4.2%). Extend to LATAM.',        suggestedAction: 'Extend test to LATAM',         model: 'pricing-v1' },
  { id: 'ssig4', title: 'Voltair likely to churn in Q2 renewal',       confidence: 72, horizon: 'Q2',       direction: 'down', body: 'Silent since W5. 3 of 4 indicators flipped negative (usage, sentiment, tickets).',                 suggestedAction: 'Executive save meeting',        model: 'retention-v5' },
  { id: 'ssig5', title: 'Mid-Market new-logo ramp to beat plan by 8%', confidence: 69, horizon: 'Q2 end',   direction: 'up',   body: 'Pipeline conversion above 40% for 3 consecutive weeks; historical pattern supports projection.',  suggestedAction: 'Add 2 AE hires to Mid-Market',  model: 'pipeline-v3' },
];

const saasHistory: HistoryRow[] = [
  { period: 'Q1 FY26',  revenue: 38.4, plan: 41.2, variance: -2.8, nrr: 108, churn: 3, spark: [117, 116, 115, 108], annotations: '3 Enterprise churns · cohort effect' },
  { period: 'Q4 FY25',  revenue: 39.1, plan: 38.7, variance: +0.4, nrr: 115, churn: 1, spark: [114, 115, 115, 115], annotations: 'Solid close' },
  { period: 'Q3 FY25',  revenue: 36.8, plan: 35.9, variance: +0.9, nrr: 116, churn: 1, spark: [115, 116, 116, 116], annotations: 'Steady' },
  { period: 'Q2 FY25',  revenue: 34.5, plan: 34.0, variance: +0.5, nrr: 117, churn: 0, spark: [116, 116, 117, 117], annotations: 'Expansion wave' },
  { period: 'Q1 FY25',  revenue: 32.1, plan: 32.4, variance: -0.3, nrr: 116, churn: 1, spark: [115, 115, 116, 116], annotations: 'Minor miss' },
  { period: 'Q4 FY24',  revenue: 30.8, plan: 29.9, variance: +0.9, nrr: 115, churn: 0, spark: [113, 114, 114, 115], annotations: 'Beat plan' },
];

const saasBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'Global −$2.8M vs Plan — Enterprise churn drives the miss.' }),
      ' 3 Enterprise logos churned in Q1 (',
      _jsx('b', { className: 'text-negative', children: '-$2.1M' }),
      '). NRR dropped 7pp to 108%. Mid-Market partially offsets (',
      _jsx('b', { className: 'text-positive', children: '+$0.5M' }),
      ') on strong new-logo acquisition in FinServ. 2 more at-risk accounts flagged for Q2.',
    ]}),
    planM: 41.2, actualM: 38.4,
    drivers: [
      { label: 'Enterprise',   valueM: -2.1 },
      { label: 'SMB',          valueM: -0.6 },
      { label: 'Startup',      valueM: -0.6 },
      { label: 'Mid-Market',   valueM: +0.5 },
    ],
  },
  northamerica: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'North America −$1.4M vs Plan — 2022 Enterprise cohort renewal risk.' }),
      ' Acme, DataStar, Parkline all on the 2022 cohort. Retention model flags 2 more at >60% risk. Mid-Market East offsetting (',
      _jsx('b', { className: 'text-positive', children: '+$0.2M' }),
      ') on NY FinServ vertical.',
    ]}),
    planM: 18.5, actualM: 17.1,
    drivers: [
      { label: 'Enterprise West', valueM: -1.0 },
      { label: 'SMB',             valueM: -0.3 },
      { label: 'Mid-Market East', valueM: +0.2 },
    ],
  },
  emea: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'EMEA +$0.6M vs Plan — expansion wave in UK FinServ.' }),
      ' Compliance module attach hit 64% vs 40% plan. Northbridge + 3 active seat-growth accounts. DACH renewals on-time.',
    ]}),
    planM: 6.8, actualM: 7.1,
    drivers: [
      { label: 'UK FinServ',      valueM: +0.4 },
      { label: 'DACH Enterprise', valueM: +0.2 },
      { label: 'Nordics SMB',     valueM:  0   },
    ],
  },
  apac: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'APAC −$0.5M vs Plan — renewal timing, auto-recovering.' }),
      ' Japan Q4 renewals pushed 4 deals into Q2 on quarter-end timing. 100% renewal probability — no risk.',
    ]}),
    planM: 4.4, actualM: 3.9,
    drivers: [
      { label: 'Japan Enterprise', valueM: -0.4 },
      { label: 'AU Mid-Market',    valueM: -0.1 },
      { label: 'India Startup',    valueM:  0   },
    ],
  },
  latam: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'LATAM −$1.5M vs Plan — Brazil new-market ramp below plan.' }),
      ' Local partnership slower than modeled (',
      _jsx('b', { className: 'text-negative', children: '-$1.2M' }),
      '). Hiring 4 FTEs to accelerate; revised W20 outlook.',
    ]}),
    planM: 2.7, actualM: 2.3,
    drivers: [
      { label: 'Brazil Enterprise',  valueM: -1.2 },
      { label: 'Mexico Mid-Market',  valueM: -0.4 },
      { label: 'Chile SMB',          valueM: +0.1 },
    ],
  },
};

const saasPreset: IndustryPreset = {
  meta: {
    key: 'saas',
    label: 'SaaS / Enterprise Software',
    short: 'SaaS',
    tagline: 'ARR · NRR · renewals · expansion',
    periodLabel: 'Q1 FY2026',
    metricLabel: 'ARR',
    volumeFormat: 'money',
    drillLabels: { primary: 'NRR', volume: 'ARR', variance: 'vs Plan' },
    defaultPrompts: [
      'Why did Enterprise churn spike this quarter?',
      'What is driving EMEA expansion?',
      'Which accounts are at risk for Q2?',
    ],
  },
  regions: saasRegions,
  segments: saasSegments,
  compares: PERF_COMPARES,
  regional: saasRegional,
  drilldown: saasDrilldown,
  exceptions: saasExceptions,
  signals: saasSignals,
  history: saasHistory,
  bridges: saasBridges,
  segmentKeywords: {
    enterprise: ['enterprise', 'acme', 'globaltech', 'datastar', 'voltair', 'northbridge', 'parkline', 'meridian'],
    midmarket:  ['mid-market', 'mid market', 'finley', 'reaktor'],
    smb:        ['smb', 'lumen', 'kite', 'brightridge'],
    startup:    ['startup', 'india'],
  },
  drillKeywordMap: (name: string) => {
    const l = name.toLowerCase();
    if (/acme|globaltech|datastar|voltair|northbridge|parkline|meridian|enterprise/.test(l)) return 'enterprise';
    if (/finley|reaktor|wavelength|mid-market|mid market/.test(l)) return 'midmarket';
    if (/lumen|kite|brightridge|smb/.test(l)) return 'smb';
    if (/startup|india/.test(l)) return 'startup';
    return null;
  },
};

// ==========================================================
// RETAIL / CPG preset
// Period: Q1 FY2026 · Metric: Units sold
// Segments: Premium, Mid-Tier, Value, Online
// ==========================================================
const retailRegions: LeftItem[] = [
  { k: 'global',       n: 'Global',         d: '-$38M', tone: 'neg'  },
  { k: 'northamerica', n: 'North America',  d: '-$12M', tone: 'neg'  },
  { k: 'europe',       n: 'Europe',         d: '+$4M',  tone: 'pos'  },
  { k: 'asia',         n: 'Asia',           d: '-$18M', tone: 'neg'  },
  { k: 'row',          n: 'Rest of World',  d: '-$12M', tone: 'warn' },
];

const retailSegments: LeftItem[] = [
  { k: 'premium',  n: 'Premium',  d: '-$22M', tone: 'neg'  },
  { k: 'midtier',  n: 'Mid-Tier', d: '-$14M', tone: 'warn' },
  { k: 'value',    n: 'Value',    d: '+$3M',  tone: 'pos'  },
  { k: 'online',   n: 'Online',   d: '-$5M',  tone: 'warn' },
];

const retailRegional: Record<string, RegionalSlice> = {
  global: {
    statusChip: { kind: 'neg', text: 'Premium launch soft · inventory building' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$38M',       delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '6',           delta: '2 critical',         tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Premium',     delta: 'Launch pace',        tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Premium',   delta: '−$22M vs Plan',
        text: 'Flagship launch tracking 18% below plan. China demand soft on macro; Europe FX-neutral but promo response weaker than 2024 Q1 launch.',
        tags: [{ t: 'red', l: 'Launch pace' }, { t: 'amber', l: 'China macro' }, { t: 'blue', l: 'Promo response' }] },
      { rank: 2, name: 'Mid-Tier',  delta: '−$14M vs Plan',
        text: 'Component cost pass-through limited by competitive pricing. Margin compressed 120bps vs plan. US channel inventory at 14 weeks vs 10 target.',
        tags: [{ t: 'amber', l: 'Margin' }, { t: 'amber', l: 'Inventory' }] },
      { rank: 3, name: 'Online',    delta: '−$5M vs Plan',
        text: 'D2C traffic -7% vs plan. Paid search CPC up 22%. Organic improving from SEO refresh.',
        tags: [{ t: 'amber', l: 'Traffic' }, { t: 'blue', l: 'SEO gain' }] },
    ],
    chart: [
      { w: 'Nov',  a: 128, p: 130, tone: 'warn' },
      { w: 'Dec',  a: 142, p: 138, tone: 'pos'  },
      { w: 'Jan',  a: 110, p: 122, tone: 'neg'  },
      { w: 'Feb',  a:  98, p: 118, tone: 'neg'  },
      { w: 'Mar',  a:  95, p: 115, tone: 'neg'  },
      { w: 'Apr▸', a: 102, p: 120, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly Units Variance — Global',
  },
  northamerica: {
    statusChip: { kind: 'neg', text: 'Channel inventory building' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$12M',       delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '3',           delta: '1 critical',         tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Inventory',   delta: 'US channel 14wk',    tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'US Retail Premium', delta: '−$8M vs Plan',
        text: 'Retailer sell-through 9% below plan; 14 weeks of inventory vs 10 target. Promotional window opens W14 but margin impact -180bps.',
        tags: [{ t: 'red', l: 'Sell-through' }, { t: 'amber', l: 'Promo margin' }] },
      { rank: 2, name: 'Canada Mid-Tier',   delta: '−$3M vs Plan',
        text: 'FX headwind + competitive pricing in Vancouver/Toronto. Pipeline stable.',
        tags: [{ t: 'amber', l: 'FX' }] },
      { rank: 3, name: 'US Online',         delta: '−$1M vs Plan',
        text: 'Direct-to-consumer conversion -4%. Product page A/B test in flight.',
        tags: [{ t: 'amber', l: 'Conversion' }, { t: 'blue', l: 'Test active' }] },
    ],
    chart: [
      { w: 'Nov',  a: 54, p: 56, tone: 'warn' },
      { w: 'Dec',  a: 62, p: 60, tone: 'pos'  },
      { w: 'Jan',  a: 48, p: 54, tone: 'neg'  },
      { w: 'Feb',  a: 42, p: 52, tone: 'neg'  },
      { w: 'Mar',  a: 40, p: 50, tone: 'neg'  },
      { w: 'Apr▸', a: 44, p: 52, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly Units Variance — North America',
  },
  europe: {
    statusChip: { kind: 'pos', text: 'FX tailwind · Germany strong' },
    kpis: [
      { lbl: 'Total Variance',   val: '+$4M',        delta: '▲ vs Plan',          tone: 'pos'  },
      { lbl: 'Segments Flagged', val: '1',           delta: '0 critical',         tone: 'pos'  },
      { lbl: 'Top Driver',       val: 'FX',          delta: 'EUR tailwind',       tone: 'pos'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Germany Premium',   delta: '+$3M vs Plan',
        text: 'EUR strength + strong retailer sell-through. Berlin flagship store traffic +14% YoY.',
        tags: [{ t: 'green', l: 'FX' }, { t: 'green', l: 'Foot traffic' }] },
      { rank: 2, name: 'UK Mid-Tier',       delta: '+$1M vs Plan',
        text: 'Stable demand; Oxford Street store expansion pulling in new cohorts.',
        tags: [{ t: 'green', l: 'Expansion' }] },
      { rank: 3, name: 'France Value',      delta: 'Flat',
        text: 'On plan. No material change.',
        tags: [{ t: 'blue', l: 'On plan' }] },
    ],
    chart: [
      { w: 'Nov',  a: 32, p: 31, tone: 'pos'  },
      { w: 'Dec',  a: 38, p: 36, tone: 'pos'  },
      { w: 'Jan',  a: 35, p: 34, tone: 'pos'  },
      { w: 'Feb',  a: 34, p: 33, tone: 'pos'  },
      { w: 'Mar',  a: 35, p: 33, tone: 'pos'  },
      { w: 'Apr▸', a: 36, p: 34, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Monthly Units Variance — Europe',
  },
  asia: {
    statusChip: { kind: 'neg', text: 'China ramp soft · macro headwind' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$18M',       delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '2 critical',         tone: 'neg'  },
      { lbl: 'Top Driver',       val: 'China',       delta: 'Macro + mix',        tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'China Premium',     delta: '−$15M vs Plan',
        text: 'Premium ASP down 12% as consumers trade down. Local competition launching comparable product at 70% price point. Lunar New Year demand peak weaker than prior 2 years.',
        tags: [{ t: 'red', l: 'Trade-down' }, { t: 'red', l: 'Local compete' }, { t: 'amber', l: 'LNY soft' }] },
      { rank: 2, name: 'Japan Mid-Tier',    delta: '−$2M vs Plan',
        text: 'FX headwind continues; pricing passed through only 60%.',
        tags: [{ t: 'amber', l: 'FX' }, { t: 'amber', l: 'Pricing' }] },
      { rank: 3, name: 'Korea Online',      delta: '−$1M vs Plan',
        text: 'Minor conversion slip; local D2C platform launching Q2.',
        tags: [{ t: 'amber', l: 'Slip' }] },
    ],
    chart: [
      { w: 'Nov',  a: 28, p: 30, tone: 'warn' },
      { w: 'Dec',  a: 26, p: 28, tone: 'warn' },
      { w: 'Jan',  a: 20, p: 24, tone: 'neg'  },
      { w: 'Feb',  a: 16, p: 22, tone: 'neg'  },
      { w: 'Mar',  a: 14, p: 20, tone: 'neg'  },
      { w: 'Apr▸', a: 16, p: 22, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly Units Variance — Asia',
  },
  row: {
    statusChip: { kind: 'warn', text: 'Emerging markets mixed' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$12M',       delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '1 critical',         tone: 'warn' },
      { lbl: 'Top Driver',       val: 'LatAm',       delta: 'BRL + local compete', tone: 'warn' },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Brazil Premium',    delta: '−$8M vs Plan',
        text: 'BRL depreciation + local competition. Retailer de-stocking continues through Q2.',
        tags: [{ t: 'red', l: 'FX' }, { t: 'amber', l: 'Destocking' }] },
      { rank: 2, name: 'Middle East Mid',   delta: '−$3M vs Plan',
        text: 'Dubai retail traffic -6%; regional promotional calendar shifted.',
        tags: [{ t: 'amber', l: 'Traffic' }] },
      { rank: 3, name: 'Africa Value',      delta: '-$1M vs Plan',
        text: 'South Africa currency weakness; low base still growing.',
        tags: [{ t: 'amber', l: 'FX' }] },
    ],
    chart: [
      { w: 'Nov',  a: 14, p: 15, tone: 'warn' },
      { w: 'Dec',  a: 16, p: 16, tone: 'pos'  },
      { w: 'Jan',  a: 12, p: 14, tone: 'warn' },
      { w: 'Feb',  a: 10, p: 13, tone: 'neg'  },
      { w: 'Mar',  a:  8, p: 12, tone: 'neg'  },
      { w: 'Apr▸', a: 10, p: 13, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Monthly Units Variance — Rest of World',
  },
};

const retailDrilldown: DrillRow[] = [
  { id: 'r1',  customer: 'Flagship Premium',     segment: 'Alcohol',     region: 'North America', arr: 1_850_000, deltaArr: -8_000_000, nrr: 62, tripsVsPlan: '-14.2%', spark: [82, 78, 70, 66, 62], status: 'Churned',   lastActivity: 'Inventory 14 wks' },
  { id: 'r2',  customer: 'China Premium',        segment: 'Alcohol',     region: 'Asia',          arr: 1_200_000, deltaArr: -15_000_000, nrr: 55, tripsVsPlan: '-22.0%', spark: [88, 78, 68, 60, 55], status: 'Churned',   lastActivity: 'LNY demand soft' },
  { id: 'r3',  customer: 'Germany Premium',      segment: 'Alcohol',     region: 'Europe',        arr:   820_000, deltaArr:  3_000_000, nrr: 72, tripsVsPlan: '+9.8%',  spark: [60, 64, 68, 70, 72], status: 'Expansion', lastActivity: 'Foot traffic +14%' },
  { id: 'r4',  customer: 'UK Mid-Tier',          segment: 'Grocery',     region: 'Europe',        arr:   540_000, deltaArr:  1_000_000, nrr: 68, tripsVsPlan: '+4.1%',  spark: [62, 64, 66, 67, 68], status: 'Expansion', lastActivity: 'Oxford Street +' },
  { id: 'r5',  customer: 'US Online D2C',        segment: 'Convenience', region: 'North America', arr:   420_000, deltaArr: -1_000_000, nrr: 58, tripsVsPlan: '-7.0%',  spark: [66, 64, 62, 60, 58], status: 'At Risk',   lastActivity: 'CPC +22%' },
  { id: 'r6',  customer: 'Japan Mid-Tier',       segment: 'Grocery',     region: 'Asia',          arr:   280_000, deltaArr: -2_000_000, nrr: 54, tripsVsPlan: '-8.6%',  spark: [60, 58, 56, 55, 54], status: 'At Risk',   lastActivity: 'FX pass-thru 60%' },
  { id: 'r7',  customer: 'Brazil Premium',       segment: 'Alcohol',     region: 'LATAM',         arr:   240_000, deltaArr: -8_000_000, nrr: 48, tripsVsPlan: '-18.4%', spark: [65, 60, 55, 50, 48], status: 'Churned',   lastActivity: 'BRL destock' },
  { id: 'r8',  customer: 'Dubai Retail',         segment: 'Grocery',     region: 'EMEA',          arr:   180_000, deltaArr:   -3_000_000, nrr: 56, tripsVsPlan: '-6.2%',  spark: [62, 60, 58, 57, 56], status: 'At Risk',   lastActivity: 'Traffic -6%' },
];

const retailExceptions: ExceptionItem[] = [
  { id: 're1', severity: 'critical', title: 'China Premium ramp — $15M miss',              entity: 'Asia · Premium',          impact: '-$15M', age: 'Q1',    driver: 'Macro + local competition + LNY soft',          owner: 'Li · China Sales' },
  { id: 're2', severity: 'critical', title: 'US Premium channel inventory build',          entity: 'North America · Premium', impact: '-$8M',  age: 'W8-W10', driver: '14 wks inventory vs 10 target · slow sell-thru', owner: 'Sarah · US Retail' },
  { id: 're3', severity: 'critical', title: 'Brazil Premium destocking',                   entity: 'RoW · Premium',           impact: '-$8M',  age: 'Q1',    driver: 'BRL depreciation + retailer destock',           owner: 'Rafael · LATAM' },
  { id: 're4', severity: 'warning',  title: 'Japan Mid-Tier FX margin compression',        entity: 'Asia · Mid-Tier',         impact: '-$2M',  age: 'Q1',    driver: '60% pricing pass-thru · margin -180bps',         owner: 'Tanaka · Japan' },
  { id: 're5', severity: 'positive', title: 'Germany Premium outperformance',              entity: 'Europe · Premium',        impact: '+$3M',  age: 'Q1',    driver: 'EUR tailwind + retailer sell-through',           owner: 'Lena · DACH' },
  { id: 're6', severity: 'positive', title: 'UK Mid-Tier Oxford Street expansion',         entity: 'Europe · Mid-Tier',       impact: '+$1M',  age: 'Q1',    driver: 'New store cohort acquisition',                   owner: 'James · UK' },
];

const retailSignals: SignalItem[] = [
  { id: 'rsig1', title: 'China Premium: trade-down accelerating through Q2',   confidence: 91, horizon: 'Q2',     direction: 'down', body: 'Local compete launching at 70% price point. Model projects additional -$8M if pricing unchanged.',                        suggestedAction: 'Review China pricing strategy',   model: 'mix-compete-v2' },
  { id: 'rsig2', title: 'US Premium promo window opens W14 — margin risk',      confidence: 87, horizon: 'W14',    direction: 'down', body: 'Required to clear 14-wk channel inventory. Historical promo cycles compress margin -180bps for 6 weeks.',                suggestedAction: 'Pre-approve promo plan with Controller', model: 'promo-margin-v3' },
  { id: 'rsig3', title: 'Germany Premium momentum to continue through Q2',     confidence: 83, horizon: 'Q2',     direction: 'up',   body: 'EUR strength + traffic momentum. +14% YoY foot traffic holds through May in historical pattern.',                   suggestedAction: 'Allocate +8% inventory to Berlin', model: 'demand-lift-v2' },
  { id: 'rsig4', title: 'Brazil BRL recovery may pull demand W18+',            confidence: 72, horizon: 'W18+',   direction: 'up',   body: 'BRL FX curve suggests 8% recovery by W18. Would enable retailer re-stocking cycle.',                              suggestedAction: 'Preserve Brazil SKU allocation',    model: 'fx-demand-v1' },
  { id: 'rsig5', title: 'US Online SEO refresh: traffic uplift +6% by Q2 end', confidence: 69, horizon: 'Q2 end', direction: 'up',   body: 'Organic traffic up 4% in 2 weeks post-refresh. Historical pattern supports +6% by end of quarter.',                 suggestedAction: 'Double down on organic content',    model: 'seo-lift-v1' },
];

const retailHistory: HistoryRow[] = [
  { period: 'Q1 FY26',  revenue: 95,  plan: 115, variance: -20, nrr:  92, churn: 3, spark: [105, 102, 98, 92], annotations: 'Premium launch soft · China macro' },
  { period: 'Q4 FY25',  revenue: 142, plan: 138, variance: +4,  nrr: 108, churn: 0, spark: [105, 106, 107, 108], annotations: 'Holiday beat' },
  { period: 'Q3 FY25',  revenue: 118, plan: 115, variance: +3,  nrr: 106, churn: 0, spark: [104, 105, 105, 106], annotations: 'Back-to-school strong' },
  { period: 'Q2 FY25',  revenue: 108, plan: 106, variance: +2,  nrr: 104, churn: 0, spark: [102, 103, 103, 104], annotations: 'Steady' },
  { period: 'Q1 FY25',  revenue:  98, plan:  99, variance: -1,  nrr: 102, churn: 0, spark: [101, 101, 102, 102], annotations: 'On plan' },
  { period: 'Q4 FY24',  revenue: 135, plan: 130, variance: +5,  nrr: 105, churn: 0, spark: [102, 103, 104, 105], annotations: 'Holiday strong' },
];

const retailBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'Global −$38M vs Plan — Premium launch soft.' }),
      ' China macro + local competition (',
      _jsx('b', { className: 'text-negative', children: '-$15M' }),
      ') is the largest driver. US channel inventory building (',
      _jsx('b', { className: 'text-negative', children: '-$8M' }),
      ') requires W14 promo plan. Germany FX tailwind (',
      _jsx('b', { className: 'text-positive', children: '+$3M' }),
      ') partial offset.',
    ]}),
    planM: 115, actualM: 95,
    drivers: [
      { label: 'China Premium',  valueM: -15 },
      { label: 'US Premium',     valueM:  -8 },
      { label: 'Brazil Premium', valueM:  -8 },
      { label: 'Other',          valueM:  -7 },
    ],
  },
  northamerica: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'North America −$12M vs Plan — channel inventory.' }),
      ' US Premium retailers holding 14 wks inventory vs 10 target. W14 promo margin hit -180bps. Canada FX soft (',
      _jsx('b', { className: 'text-negative', children: '-$3M' }),
      ').',
    ]}),
    planM: 50, actualM: 40,
    drivers: [
      { label: 'US Premium',      valueM: -8 },
      { label: 'Canada Mid-Tier', valueM: -3 },
      { label: 'US Online',       valueM: -1 },
    ],
  },
  europe: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'Europe +$4M vs Plan — Germany Premium strong.' }),
      ' EUR tailwind + retailer sell-through. Berlin flagship traffic +14% YoY. UK Mid-Tier Oxford Street expansion contributing.',
    ]}),
    planM: 33, actualM: 35,
    drivers: [
      { label: 'Germany Premium', valueM: +3 },
      { label: 'UK Mid-Tier',     valueM: +1 },
      { label: 'France Value',    valueM:  0 },
    ],
  },
  asia: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'Asia −$18M vs Plan — China trade-down accelerating.' }),
      ' Premium ASP -12% (',
      _jsx('b', { className: 'text-negative', children: '-$15M' }),
      '). Local competition at 70% price point. Japan FX 60% pass-through only.',
    ]}),
    planM: 20, actualM: 14,
    drivers: [
      { label: 'China Premium',  valueM: -15 },
      { label: 'Japan Mid-Tier', valueM:  -2 },
      { label: 'Korea Online',   valueM:  -1 },
    ],
  },
  row: {
    aha: _jsxs(_Fragment, { children: [
      _jsx('b', { children: 'Rest of World −$12M vs Plan — Brazil destock.' }),
      ' BRL depreciation + retailer destocking (',
      _jsx('b', { className: 'text-negative', children: '-$8M' }),
      '). Middle East traffic soft. Africa low base holding.',
    ]}),
    planM: 12, actualM: 8,
    drivers: [
      { label: 'Brazil Premium',  valueM: -8 },
      { label: 'Middle East Mid', valueM: -3 },
      { label: 'Africa Value',    valueM: -1 },
    ],
  },
};

const retailPreset: IndustryPreset = {
  meta: {
    key: 'retail',
    label: 'Retail / CPG',
    short: 'Retail',
    tagline: 'Units sold · channel inventory · regional mix',
    periodLabel: 'Q1 FY2026',
    metricLabel: 'Units',
    volumeFormat: 'units',
    drillLabels: { primary: 'Sell-thru', volume: 'Units Q1', variance: 'vs Plan' },
    defaultPrompts: [
      'Why is the Premium launch underperforming?',
      'How bad is the US channel inventory build?',
      'Which regions are offsetting the miss?',
    ],
  },
  regions: retailRegions,
  segments: retailSegments,
  compares: PERF_COMPARES,
  regional: retailRegional,
  drilldown: retailDrilldown,
  exceptions: retailExceptions,
  signals: retailSignals,
  history: retailHistory,
  bridges: retailBridges,
  segmentKeywords: {
    premium:  ['premium', 'flagship', 'china premium', 'germany premium', 'us premium', 'brazil premium'],
    midtier:  ['mid-tier', 'mid tier', 'uk mid', 'japan mid', 'canada mid'],
    value:    ['value', 'africa', 'france value'],
    online:   ['online', 'd2c', 'direct-to-consumer', 'korea online'],
  },
  drillKeywordMap: (name: string) => {
    const l = name.toLowerCase();
    if (/online|d2c|direct/.test(l)) return 'online';
    if (/value|africa/.test(l)) return 'value';
    if (/mid-tier|mid tier/.test(l)) return 'midtier';
    if (/premium|flagship/.test(l)) return 'premium';
    return null;
  },
};

// ==========================================================
// Exported map
// ==========================================================
export const INDUSTRY_PRESETS: Record<IndustryKey, IndustryPreset> = {
  delivery: deliveryPreset,
  saas:     saasPreset,
  retail:   retailPreset,
};

export const INDUSTRY_LIST: IndustryKey[] = ['delivery', 'saas', 'retail'];
