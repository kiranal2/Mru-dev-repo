/**
 * Industry presets — ported from meeru-variance-app/src/industry-presets.ts.
 *
 * Deviations from web:
 *   - The web `aha` field is JSX; on native we store it as a structured
 *     BridgeTextPart[] so renderers can map each segment to a <Text> node.
 *   - Tablet's existing ExceptionItem/SignalItem/HistoryItem in types.ts have
 *     different shapes than the web preset — the new preset types here are
 *     the web shape, prefixed with `Flux` to avoid clashing. Phase 4 screens
 *     will migrate to these.
 *
 * Switching industries in Settings rebuilds the Performance workbench.
 */
import type { IndustryKey } from './store';
import type { Kpi, CommentaryItem, ChartBar } from './types';

// ----- Shared tokens -----

export type Tone = 'pos' | 'neg' | 'warn' | 'blue';
export type StatusKind = 'pos' | 'neg' | 'warn' | 'info';

export interface LeftItem {
  k: string;
  n: string;
  d?: string;
  tone?: 'pos' | 'neg' | 'warn';
}

export interface BridgeTextPart {
  text: string;
  bold?: boolean;
  tone?: 'pos' | 'neg' | 'warn';
}

export interface RegionBridgeData {
  aha: BridgeTextPart[];
  planM: number;
  actualM: number;
  drivers: { label: string; valueM: number }[];
}

export interface IndustryMeta {
  key: IndustryKey;
  label: string;
  short: string;
  tagline: string;
  periodLabel: string;
  metricLabel: string;
  volumeFormat: 'trips' | 'money' | 'units';
  drillLabels: { primary: string; volume: string; variance: string };
  defaultPrompts: string[];
}

export interface RegionalSlice {
  statusChip: { kind: StatusKind; text: string };
  kpis: Kpi[];
  commentary: CommentaryItem[];
  chart: ChartBar[];
  chartTitle: string;
}

// Drill / Exception / Signal / History rows for the new workbench views.
// Kept distinct from the tablet's legacy types (ExceptionItem, SignalItem,
// HistoryItem in types.ts) — those back the current screens and will be
// migrated in Phase 4.
export interface FluxDrillRow {
  id: string;
  customer: string;
  segment: string;
  region: string;
  arr: number;
  deltaArr: number;
  nrr: number;
  tripsVsPlan: string;
  spark: number[];
  status: 'Expansion' | 'Healthy' | 'At Risk' | 'Churned';
  lastActivity: string;
}

export interface FluxExceptionItem {
  id: string;
  severity: 'critical' | 'warning' | 'positive';
  title: string;
  entity: string;
  impact: string;
  age: string;
  driver: string;
  owner: string;
}

export interface FluxSignalItem {
  id: string;
  title: string;
  confidence: number;
  horizon: string;
  direction: 'up' | 'down';
  body: string;
  suggestedAction: string;
  model: string;
}

export interface FluxHistoryRow {
  period: string;
  revenue: number;
  plan: number;
  variance: number;
  nrr: number;
  churn: number;
  spark: number[];
  annotations: string;
}

export interface IndustryPreset {
  meta: IndustryMeta;
  regions: LeftItem[];
  segments: LeftItem[];
  compares: LeftItem[];
  regional: Record<string, RegionalSlice>;
  drilldown: FluxDrillRow[];
  exceptions: FluxExceptionItem[];
  signals: FluxSignalItem[];
  history: FluxHistoryRow[];
  bridges: Record<string, RegionBridgeData>;
  segmentKeywords: Record<string, string[]>;
  drillKeywordMap: (itemName: string) => string | null;
}

// ==========================================================
// Shared compares — identical across all 3 industries.
// ==========================================================
const COMPARES: LeftItem[] = [
  { k: 'plan',     n: 'vs Plan' },
  { k: 'prior',    n: 'vs Prior Period' },
  { k: 'yoy',      n: 'vs Same Period YoY' },
  { k: 'forecast', n: 'vs Forecast' },
  { k: 'runrate',  n: 'vs Run-Rate' },
];

// ==========================================================
// DELIVERY preset — Uberflux marketplace ops
// ==========================================================
const deliveryRegions: LeftItem[] = [
  { k: 'global',       n: 'Global',        d: '-$4.2M', tone: 'neg' },
  { k: 'northamerica', n: 'North America', d: '-$1.1M', tone: 'neg' },
  { k: 'latam',        n: 'LATAM',         d: '-$2.4M', tone: 'neg' },
  { k: 'emea',         n: 'EMEA',          d: '+$0.3M', tone: 'pos' },
  { k: 'apac',         n: 'APAC',          d: '-$0.9M', tone: 'warn' },
];

const deliverySegments: LeftItem[] = [
  { k: 'grocery',     n: 'Grocery',     d: '-$2.1M', tone: 'neg'  },
  { k: 'convenience', n: 'Convenience', d: '-$0.9M', tone: 'neg'  },
  { k: 'alcohol',     n: 'Alcohol',     d: '+$0.4M', tone: 'pos'  },
  { k: 'pharmacy',    n: 'Pharmacy',    d: 'flat'                 },
];

const deliveryRegional: Record<string, RegionalSlice> = {
  global: {
    statusChip: { kind: 'neg', text: 'Variance flagged · action recommended' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$4.2M', delta: '▼ vs Plan',     tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '7',      delta: '3 critical',     tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Supply', delta: 'Courier util ↑', tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',  delta: '08:38 AM ✓',     tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Mexico Grocery', delta: '−$2.1M vs Plan',
        text: 'Courier utilization 68%, above 63% red line. Trip dampening active since Week 8. Supply constraint driving basket-size reduction — similar to W34 2024 storm event. Cencosud co-funding partially offset.',
        tags: [{ t: 'red', l: 'Supply constraint' }, { t: 'amber', l: 'Monitoring' }, { t: 'blue', l: 'Predictive flag' }] },
      { rank: 2, name: 'EUP Grocery', delta: '+$1.0M vs Plan',
        text: '+2.3% trips. Courier utilization normalized. School holiday effect confirmed — +1.8M incremental trips vs model baseline. No supply constraints flagged this week.',
        tags: [{ t: 'green', l: 'Positive variance' }, { t: 'green', l: 'Holiday lift' }] },
      { rank: 3, name: 'US Convenience', delta: '−$0.9M vs Plan',
        text: 'CPP 9% trip loss. NYC radius reduction active. Exit rate above seasonal baseline by 1.8 std devs. Super Bowl holiday partially explanatory — pattern consistent with prior 3 Super Bowl weeks.',
        tags: [{ t: 'red', l: 'Exit rate' }, { t: 'amber', l: 'Holiday effect' }] },
    ],
    chart: [
      { w: 'W6',   a: 58, p: 58, tone: 'pos'  },
      { w: 'W7',   a: 55, p: 56, tone: 'warn' },
      { w: 'W8',   a: 50, p: 55, tone: 'neg'  },
      { w: 'W9',   a: 44, p: 52, tone: 'neg'  },
      { w: 'W10',  a: 40, p: 50, tone: 'neg'  },
      { w: 'W11▸', a: 37, p: 48, tone: 'neg', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — Mexico Grocery',
  },
  northamerica: {
    statusChip: { kind: 'neg', text: 'US Convenience + Canada weather' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$1.1M', delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',      delta: '1 critical',          tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Exit',   delta: 'Super Bowl effect',  tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',  delta: '08:38 AM ✓',          tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'US Convenience', delta: '−$0.9M vs Plan',
        text: 'CPP 9% trip loss. NYC radius reduction active. Exit rate 1.8 std devs above seasonal baseline. Super Bowl exit effect.',
        tags: [{ t: 'red', l: 'Exit rate' }, { t: 'amber', l: 'Holiday' }] },
      { rank: 2, name: 'Canada Grocery', delta: '−$0.3M vs Plan',
        text: 'Toronto cold snap cut orders 7%. Weather-linked; model projects normalization by W12.',
        tags: [{ t: 'amber', l: 'Weather' }, { t: 'blue', l: 'Recoverable' }] },
      { rank: 3, name: 'US Alcohol', delta: '+$0.1M vs Plan',
        text: 'Super Bowl weekend lift partially offset Convenience miss.',
        tags: [{ t: 'green', l: 'Lift' }] },
    ],
    chart: [
      { w: 'W6',   a: 20, p: 20, tone: 'pos'  },
      { w: 'W7',   a: 19, p: 20, tone: 'warn' },
      { w: 'W8',   a: 18, p: 19, tone: 'warn' },
      { w: 'W9',   a: 17, p: 19, tone: 'neg'  },
      { w: 'W10',  a: 17, p: 19, tone: 'neg'  },
      { w: 'W11▸', a: 18, p: 19, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — North America',
  },
  latam: {
    statusChip: { kind: 'neg', text: 'Mexico supply constraint driving 87% of miss' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$2.4M',      delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '1 critical',          tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Supply',      delta: 'Courier util 68%',   tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',          tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Mexico Grocery',     delta: '−$2.1M vs Plan',
        text: 'Courier utilization 68% for 3 weeks — above 63% red line. Supply ceiling lift pending CFO approval.',
        tags: [{ t: 'red', l: 'Supply' }, { t: 'amber', l: 'Approval' }] },
      { rank: 2, name: 'Brazil Convenience', delta: '−$0.6M vs Plan',
        text: 'Approaching supply threshold. Driver incentive proposal (15%, $40K) pre-approved for W11.',
        tags: [{ t: 'amber', l: 'Pre-auth' }] },
      { rank: 3, name: 'Colombia Grocery',   delta: '+$0.3M vs Plan',
        text: 'New market expansion tracks 2× launch model. Momentum holds through Q2 per pattern match.',
        tags: [{ t: 'green', l: 'Expansion' }] },
    ],
    chart: [
      { w: 'W6',   a: 14, p: 14, tone: 'pos'  },
      { w: 'W7',   a: 13, p: 14, tone: 'warn' },
      { w: 'W8',   a: 12, p: 13, tone: 'neg'  },
      { w: 'W9',   a: 11, p: 13, tone: 'neg'  },
      { w: 'W10',  a: 10, p: 12, tone: 'neg'  },
      { w: 'W11▸', a: 11, p: 13, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — LATAM',
  },
  emea: {
    statusChip: { kind: 'pos', text: 'Only positive region · school holiday lift' },
    kpis: [
      { lbl: 'Total Variance',   val: '+$0.3M',      delta: '▲ vs Plan',          tone: 'pos'  },
      { lbl: 'Segments Flagged', val: '1',           delta: '0 critical',          tone: 'pos'  },
      { lbl: 'Top Driver',       val: 'Holiday',     delta: 'School lift',         tone: 'pos'  },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',          tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'EUP Grocery',     delta: '+$0.4M vs Plan',
        text: 'School holidays added +1.8M incremental trips. Matches prior 3-year holiday pattern.',
        tags: [{ t: 'green', l: 'Holiday' }, { t: 'green', l: 'On model' }] },
      { rank: 2, name: 'UK Convenience',  delta: '+$0.1M vs Plan',
        text: 'AOV mix shift toward alcohol & snacks. +6% basket size on weekends.',
        tags: [{ t: 'green', l: 'Mix' }] },
      { rank: 3, name: 'DACH Pharmacy',   delta: '−$0.2M vs Plan',
        text: 'Regulatory headwind — Germany Rx delivery rule change. Non-material to region total.',
        tags: [{ t: 'amber', l: 'Regulatory' }] },
    ],
    chart: [
      { w: 'W6',   a: 7, p: 6.8, tone: 'pos'  },
      { w: 'W7',   a: 7, p: 6.9, tone: 'pos'  },
      { w: 'W8',   a: 7, p: 6.9, tone: 'pos'  },
      { w: 'W9',   a: 7, p: 7.0, tone: 'pos'  },
      { w: 'W10',  a: 7, p: 7.0, tone: 'pos'  },
      { w: 'W11▸', a: 7, p: 7.1, tone: 'pos', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — EMEA',
  },
  apac: {
    statusChip: { kind: 'warn', text: 'Weather-driven · auto-recovering' },
    kpis: [
      { lbl: 'Total Variance',   val: '-$0.9M',      delta: '▼ vs Plan',          tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '2',           delta: '0 critical',          tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Weather',     delta: 'AU rainfall',         tone: 'warn' },
      { lbl: 'Commentary',       val: 'Ready',       delta: '08:38 AM ✓',          tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'AU Grocery',        delta: '−$0.7M vs Plan',
        text: 'Eastern-seaboard rainfall suppressed Sydney −21%, Melbourne −18%. Historical rebound +15% / 2 weeks — no action needed.',
        tags: [{ t: 'amber', l: 'Weather' }, { t: 'blue', l: 'Auto-recover' }] },
      { rank: 2, name: 'Taiwan Grocery',    delta: '−$0.3M vs Plan',
        text: 'Lunar New Year timing pulled demand forward; W11 rebound expected per model.',
        tags: [{ t: 'amber', l: 'Timing' }] },
      { rank: 3, name: 'Japan Convenience', delta: '+$0.1M vs Plan',
        text: 'Lunch-time uptick in Tokyo & Osaka. Consistent with WFH-reversal pattern.',
        tags: [{ t: 'green', l: 'Mix' }] },
    ],
    chart: [
      { w: 'W6',   a: 5.2, p: 5.2, tone: 'pos'  },
      { w: 'W7',   a: 5.0, p: 5.2, tone: 'warn' },
      { w: 'W8',   a: 4.7, p: 5.1, tone: 'neg'  },
      { w: 'W9',   a: 4.4, p: 5.1, tone: 'neg'  },
      { w: 'W10',  a: 4.3, p: 5.2, tone: 'neg'  },
      { w: 'W11▸', a: 4.8, p: 5.2, tone: 'warn', forecast: true },
    ],
    chartTitle: 'Weekly Trip Variance — APAC',
  },
};

const deliveryDrilldown: FluxDrillRow[] = [
  { id: 'd1',  customer: 'Mexico Grocery',      segment: 'Grocery',     region: 'LATAM',         arr: 8_400_000, deltaArr: -2_100_000, nrr:  68, tripsVsPlan: '-21.0%', spark: [100, 92, 84, 76, 68], status: 'At Risk',   lastActivity: 'Courier util 68% · 3 wks' },
  { id: 'd2',  customer: 'US Convenience',      segment: 'Convenience', region: 'North America', arr: 6_200_000, deltaArr:   -900_000, nrr:  82, tripsVsPlan: '-9.0%',  spark: [100, 96, 92, 87, 82], status: 'At Risk',   lastActivity: 'Super Bowl exit rate' },
  { id: 'd3',  customer: 'AU Grocery',          segment: 'Grocery',     region: 'APAC',          arr: 3_800_000, deltaArr:   -700_000, nrr:  79, tripsVsPlan: '-21.0%', spark: [100, 95, 88, 84, 79], status: 'At Risk',   lastActivity: 'Rainfall · W10' },
  { id: 'd4',  customer: 'Brazil Convenience',  segment: 'Convenience', region: 'LATAM',         arr: 2_100_000, deltaArr:   -600_000, nrr:  81, tripsVsPlan: '-12.0%', spark: [100, 95, 92, 85, 81], status: 'At Risk',   lastActivity: 'Approaching threshold' },
  { id: 'd5',  customer: 'EUP Grocery',         segment: 'Grocery',     region: 'EMEA',          arr: 2_800_000, deltaArr:    400_000, nrr: 108, tripsVsPlan: '+2.3%',  spark: [100, 102, 105, 106, 108], status: 'Expansion', lastActivity: 'School holiday lift' },
  { id: 'd6',  customer: 'US Alcohol',          segment: 'Alcohol',     region: 'North America', arr: 1_900_000, deltaArr:    100_000, nrr: 103, tripsVsPlan: '+0.5%',  spark: [100, 101, 102, 103, 103], status: 'Healthy',   lastActivity: 'SB weekend lift' },
  { id: 'd7',  customer: 'Colombia Grocery',    segment: 'Grocery',     region: 'LATAM',         arr:   600_000, deltaArr:    300_000, nrr: 124, tripsVsPlan: '+24.0%', spark: [100, 108, 115, 120, 124], status: 'Expansion', lastActivity: '2× launch model' },
  { id: 'd8',  customer: 'Japan Convenience',   segment: 'Convenience', region: 'APAC',          arr:   800_000, deltaArr:    100_000, nrr: 105, tripsVsPlan: '+1.2%',  spark: [100, 102, 103, 104, 105], status: 'Healthy',   lastActivity: 'Lunch mix' },
  { id: 'd9',  customer: 'UK Convenience',      segment: 'Convenience', region: 'EMEA',          arr:   900_000, deltaArr:    100_000, nrr: 104, tripsVsPlan: '+1.0%',  spark: [100, 101, 102, 103, 104], status: 'Healthy',   lastActivity: 'AOV mix' },
  { id: 'd10', customer: 'Canada Grocery',      segment: 'Grocery',     region: 'North America', arr:   700_000, deltaArr:   -300_000, nrr:  85, tripsVsPlan: '-7.0%',  spark: [100, 96, 91, 88, 85], status: 'At Risk',   lastActivity: 'Cold snap' },
  { id: 'd11', customer: 'DACH Pharmacy',       segment: 'Pharmacy',    region: 'EMEA',          arr:   500_000, deltaArr:   -200_000, nrr:  89, tripsVsPlan: '-4.0%',  spark: [100, 98, 95, 92, 89], status: 'At Risk',   lastActivity: 'Rx regulation' },
  { id: 'd12', customer: 'Taiwan Grocery',      segment: 'Grocery',     region: 'APAC',          arr:   400_000, deltaArr:   -300_000, nrr:  84, tripsVsPlan: '-6.0%',  spark: [100, 96, 92, 88, 84], status: 'At Risk',   lastActivity: 'LNY timing' },
];

const deliveryExceptions: FluxExceptionItem[] = [
  { id: 'de1', severity: 'critical', title: 'Mexico Grocery supply constraint',          entity: 'LATAM · Grocery',          impact: '-$2.1M', age: '3 wks',  driver: 'Courier util 68% above 63% red line',      owner: 'Raj · Controller' },
  { id: 'de2', severity: 'critical', title: 'US Convenience Super Bowl exit rate',        entity: 'North America · Convenience', impact: '-$0.9M', age: 'W10',    driver: 'Exit rate 1.8 std devs above baseline',     owner: 'Priya · Ops' },
  { id: 'de3', severity: 'critical', title: 'AU Grocery rainfall dampening',              entity: 'APAC · Grocery',           impact: '-$0.7M', age: 'W10',    driver: 'Eastern-seaboard rainfall · Sydney −21%',   owner: 'Hiro · APAC' },
  { id: 'de4', severity: 'warning',  title: 'Brazil Convenience approaching threshold',   entity: 'LATAM · Convenience',      impact: '-$0.6M', age: 'W10',    driver: 'Pre-auth needed for driver incentive',      owner: 'Rafael · LATAM' },
  { id: 'de5', severity: 'warning',  title: 'Canada Grocery cold snap',                   entity: 'North America · Grocery',  impact: '-$0.3M', age: 'W10',    driver: 'Toronto weather · recoverable by W12',      owner: 'Emma · Canada' },
  { id: 'de6', severity: 'positive', title: 'EUP Grocery school holiday lift',            entity: 'EMEA · Grocery',           impact: '+$0.4M', age: 'W10',    driver: '+1.8M incremental trips vs model',          owner: 'Lena · EMEA' },
];

const deliverySignals: FluxSignalItem[] = [
  { id: 'dsig1', title: 'Mexico supply constraint will persist into W11',    confidence: 94, horizon: 'W11',    direction: 'down', body: 'Courier utilization model forecasts no improvement without ceiling lift. Est. W11 impact: -$2.3M.',              suggestedAction: 'Route CFO approval for supply ceiling lift',     model: 'supply-v3' },
  { id: 'dsig2', title: 'AU Grocery to auto-recover +15% by W12',            confidence: 88, horizon: 'W12',    direction: 'up',   body: 'Historical rainfall rebound pattern. No intervention needed — model projects return to baseline.',               suggestedAction: 'Monitor; no action',                              model: 'weather-v2' },
  { id: 'dsig3', title: 'US Convenience exit rate normalizing after W10',    confidence: 81, horizon: 'W11-W12', direction: 'up',   body: 'Super Bowl exit window closing. Prior-year pattern: -5% in SB week, +2% following week.',                         suggestedAction: 'Prepare W11 upside forecast',                     model: 'holiday-v4' },
  { id: 'dsig4', title: 'Brazil Convenience threshold breach imminent',      confidence: 76, horizon: 'W11',    direction: 'down', body: 'Supply model approaching threshold. Without driver incentive, projected -$1.1M in W11.',                        suggestedAction: 'Approve Brazil 15% driver incentive ($40K)',      model: 'supply-v3' },
  { id: 'dsig5', title: 'Colombia expansion to continue 2× launch model',    confidence: 73, horizon: 'Q2 end', direction: 'up',   body: 'New market trajectory matches 2× launch model 4 weeks running. Projected +$1.2M Q2 total.',                      suggestedAction: 'Consider pulling forward incremental hiring',     model: 'expansion-v2' },
];

const deliveryHistory: FluxHistoryRow[] = [
  { period: 'W10 FY26', revenue: 38.4, plan: 42.6, variance: -4.2, nrr:  90, churn: 0, spark: [92, 88, 84, 90], annotations: 'Mexico supply · US SB exit · AU rainfall' },
  { period: 'W9 FY26',  revenue: 39.1, plan: 42.4, variance: -3.3, nrr:  92, churn: 0, spark: [95, 92, 90, 92], annotations: 'Supply persistence week 2' },
  { period: 'W8 FY26',  revenue: 40.2, plan: 42.0, variance: -1.8, nrr:  96, churn: 0, spark: [98, 96, 94, 96], annotations: 'Supply constraint emerged' },
  { period: 'W7 FY26',  revenue: 41.6, plan: 41.4, variance: +0.2, nrr: 100, churn: 0, spark: [99, 100, 100, 100], annotations: 'On plan' },
  { period: 'W6 FY26',  revenue: 41.8, plan: 41.6, variance: +0.2, nrr: 100, churn: 0, spark: [99, 100, 100, 100], annotations: 'On plan' },
  { period: 'W5 FY26',  revenue: 41.2, plan: 40.8, variance: +0.4, nrr: 101, churn: 0, spark: [100, 100, 101, 101], annotations: 'Slight beat' },
];

const deliveryBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: [
      { text: 'Week 10 · Global −$4.2M vs Plan. ', bold: true },
      { text: 'Mexico Grocery supply constraint (' },
      { text: '-$2.1M', bold: true, tone: 'neg' },
      { text: ') is 3rd consecutive week above the 63% courier-util red line. US Convenience Super Bowl exit rate (' },
      { text: '-$0.9M', bold: true, tone: 'neg' },
      { text: ') + AU eastern-seaboard rainfall (' },
      { text: '-$0.7M', bold: true, tone: 'neg' },
      { text: ') stack on top. EUP Grocery school holiday (' },
      { text: '+$1.0M', bold: true, tone: 'pos' },
      { text: ') is the only positive region.' },
    ],
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
    aha: [
      { text: 'North America −$1.1M vs Plan — US Convenience + Canada weather. ', bold: true },
      { text: 'Super Bowl exit-rate spike (' },
      { text: '-$0.9M', bold: true, tone: 'neg' },
      { text: '). Toronto cold snap cut Canada orders 7% (' },
      { text: '-$0.3M', bold: true, tone: 'neg' },
      { text: '). US Alcohol partial offset (' },
      { text: '+$0.1M', bold: true, tone: 'pos' },
      { text: '). W11 projects −$0.4M.' },
    ],
    planM: 18.2, actualM: 17.1,
    drivers: [
      { label: 'US Convenience', valueM: -0.9 },
      { label: 'Canada Grocery', valueM: -0.3 },
      { label: 'US Alcohol',     valueM: +0.1 },
      { label: 'Other',          valueM:  0   },
    ],
  },
  latam: {
    aha: [
      { text: 'LATAM −$2.4M vs Plan — Mexico Grocery drives 87% of the miss. ', bold: true },
      { text: 'Courier util 68% for 3 weeks (' },
      { text: '-$2.1M', bold: true, tone: 'neg' },
      { text: '). Brazil Convenience approaching threshold (' },
      { text: '-$0.6M', bold: true, tone: 'neg' },
      { text: '). Colombia expansion (' },
      { text: '+$0.3M', bold: true, tone: 'pos' },
      { text: ') tracks 2× launch model.' },
    ],
    planM: 12.4, actualM: 10.0,
    drivers: [
      { label: 'Mexico Grocery',     valueM: -2.1 },
      { label: 'Brazil Convenience', valueM: -0.6 },
      { label: 'Colombia Grocery',   valueM: +0.3 },
      { label: 'Other',              valueM:  0   },
    ],
  },
  emea: {
    aha: [
      { text: 'EMEA +$0.3M vs Plan — only positive region this week. ', bold: true },
      { text: 'School holidays add ' },
      { text: '+1.8M incremental trips', bold: true },
      { text: '. EUP Grocery (' },
      { text: '+$0.4M', bold: true, tone: 'pos' },
      { text: '); UK Convenience AOV mix (' },
      { text: '+$0.1M', bold: true, tone: 'pos' },
      { text: '). DACH Pharmacy regulatory (' },
      { text: '-$0.2M', bold: true, tone: 'neg' },
      { text: ') non-material.' },
    ],
    planM: 6.8, actualM: 7.1,
    drivers: [
      { label: 'EUP Grocery',    valueM: +0.4 },
      { label: 'UK Convenience', valueM: +0.1 },
      { label: 'DACH Pharmacy',  valueM: -0.2 },
      { label: 'Other',          valueM:  0   },
    ],
  },
  apac: {
    aha: [
      { text: 'APAC −$0.9M vs Plan — weather-driven, auto-recovering. ', bold: true },
      { text: 'AU rainfall suppressed Sydney −21%, Melbourne −18% (' },
      { text: '-$0.7M', bold: true, tone: 'neg' },
      { text: '). Taiwan Lunar NY (' },
      { text: '-$0.3M', bold: true, tone: 'neg' },
      { text: '). Japan lunch uptick (' },
      { text: '+$0.1M', bold: true, tone: 'pos' },
      { text: '). Historical AU rebound +15% / 2 weeks — no action required.' },
    ],
    planM: 5.2, actualM: 4.3,
    drivers: [
      { label: 'AU Grocery',        valueM: -0.7 },
      { label: 'Taiwan Grocery',    valueM: -0.3 },
      { label: 'Japan Convenience', valueM: +0.1 },
      { label: 'Other',             valueM:  0   },
    ],
  },
};

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
  regions: deliveryRegions,
  segments: deliverySegments,
  compares: COMPARES,
  regional: deliveryRegional,
  drilldown: deliveryDrilldown,
  exceptions: deliveryExceptions,
  signals: deliverySignals,
  history: deliveryHistory,
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
// SAAS preset (trimmed; full data tagged as stubs matching web)
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
      { lbl: 'Total Variance',   val: '-$2.8M',   delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '5',        delta: '2 critical',         tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Churn',    delta: '3 Enterprise logos', tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',    delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Enterprise', delta: '−$2.1M vs Plan',
        text: '3 logo churns — Acme Corp ($800K), GlobalTech ($750K), DataStar ($550K). NRR declined 115% → 108%. 2 additional at-risk accounts on renewal.',
        tags: [{ t: 'red', l: 'Churn spike' }, { t: 'red', l: 'NRR decline' }] },
      { rank: 2, name: 'Mid-Market', delta: '+$0.5M vs Plan',
        text: 'Strong new-logo acquisition — 12 new accounts vs 8 planned. Average deal size $42K, up 15% QoQ.',
        tags: [{ t: 'green', l: 'New logos' }] },
      { rank: 3, name: 'SMB', delta: '−$0.6M vs Plan',
        text: 'Self-serve flat. Free-to-paid conversion 3.2% from 4.1%. APAC pricing experiment signals positive.',
        tags: [{ t: 'amber', l: 'Conversion' }] },
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
};

const saasDrilldown: FluxDrillRow[] = [
  { id: 's1', customer: 'Acme Corp',  segment: 'Alcohol', region: 'North America', arr: 800_000, deltaArr: -800_000, nrr:  0, tripsVsPlan: '-100%', spark: [100, 80, 50, 20, 0], status: 'Churned',   lastActivity: 'Churned · 12d ago' },
  { id: 's2', customer: 'Northbridge',segment: 'Alcohol', region: 'EMEA',          arr: 920_000, deltaArr:  180_000, nrr:124, tripsVsPlan: '+24.3%', spark: [78, 84, 92, 105, 124], status: 'Expansion', lastActivity: 'Seat expansion · 1d' },
];

const saasExceptions: FluxExceptionItem[] = [
  { id: 'se1', severity: 'critical', title: 'Enterprise churn cluster — 3 logos', entity: 'North America · Enterprise', impact: '-$2.1M ARR', age: 'Q1 2026', driver: '2022 cohort renewal', owner: 'Sue · VP Sales' },
];

const saasSignals: FluxSignalItem[] = [
  { id: 'ssig1', title: 'CA Enterprise churn to accelerate', confidence: 94, horizon: 'Q2', direction: 'down', body: 'Retention model flags 2 more CA accounts at >60% risk.', suggestedAction: 'Executive outreach this week', model: 'retention-v5' },
];

const saasHistory: FluxHistoryRow[] = [
  { period: 'Q1 FY26', revenue: 38.4, plan: 41.2, variance: -2.8, nrr: 108, churn: 3, spark: [117, 116, 115, 108], annotations: '3 Enterprise churns' },
];

const saasBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: [
      { text: 'Global −$2.8M vs Plan — Enterprise churn drives the miss. ', bold: true },
      { text: '3 Enterprise logos churned in Q1 (' },
      { text: '-$2.1M', bold: true, tone: 'neg' },
      { text: '). NRR dropped 7pp to 108%. Mid-Market partially offsets (' },
      { text: '+$0.5M', bold: true, tone: 'pos' },
      { text: ') on strong new-logo acquisition in FinServ.' },
    ],
    planM: 41.2, actualM: 38.4,
    drivers: [
      { label: 'Enterprise', valueM: -2.1 },
      { label: 'SMB',        valueM: -0.6 },
      { label: 'Startup',    valueM: -0.6 },
      { label: 'Mid-Market', valueM: +0.5 },
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
  compares: COMPARES,
  regional: saasRegional,
  drilldown: saasDrilldown,
  exceptions: saasExceptions,
  signals: saasSignals,
  history: saasHistory,
  bridges: saasBridges,
  segmentKeywords: {
    enterprise: ['enterprise', 'acme', 'globaltech', 'datastar', 'voltair', 'northbridge'],
    midmarket:  ['mid-market', 'mid market', 'finley'],
    smb:        ['smb', 'lumen', 'kite'],
    startup:    ['startup', 'india'],
  },
  drillKeywordMap: (name: string) => {
    const l = name.toLowerCase();
    if (/acme|globaltech|datastar|voltair|northbridge|enterprise/.test(l)) return 'enterprise';
    if (/finley|reaktor|mid-market|mid market/.test(l)) return 'midmarket';
    if (/lumen|kite|brightridge|smb/.test(l)) return 'smb';
    if (/startup|india/.test(l)) return 'startup';
    return null;
  },
};

// ==========================================================
// RETAIL preset (trimmed)
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
      { lbl: 'Total Variance',   val: '-$38M',     delta: '▼ vs Plan',         tone: 'neg'  },
      { lbl: 'Segments Flagged', val: '6',         delta: '2 critical',         tone: 'warn' },
      { lbl: 'Top Driver',       val: 'Premium',   delta: 'Launch pace',        tone: 'neg'  },
      { lbl: 'Commentary',       val: 'Ready',     delta: '08:38 AM ✓',         tone: 'pos'  },
    ],
    commentary: [
      { rank: 1, name: 'Premium',  delta: '−$22M vs Plan',
        text: 'Flagship launch 18% below plan. China demand soft; Europe FX-neutral but promo response weaker than 2024 Q1 launch.',
        tags: [{ t: 'red', l: 'Launch pace' }, { t: 'amber', l: 'China macro' }] },
      { rank: 2, name: 'Mid-Tier', delta: '−$14M vs Plan',
        text: 'Component cost pass-through limited. Margin compressed 120bps vs plan.',
        tags: [{ t: 'amber', l: 'Margin' }] },
      { rank: 3, name: 'Online',   delta: '−$5M vs Plan',
        text: 'D2C traffic -7% vs plan. Paid CPC up 22%.',
        tags: [{ t: 'amber', l: 'Traffic' }] },
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
};

const retailDrilldown: FluxDrillRow[] = [
  { id: 'r1', customer: 'Flagship Premium', segment: 'Alcohol', region: 'North America', arr: 1_850_000, deltaArr: -8_000_000, nrr: 62, tripsVsPlan: '-14.2%', spark: [82, 78, 70, 66, 62], status: 'Churned',   lastActivity: 'Inventory 14 wks' },
  { id: 'r3', customer: 'Germany Premium',  segment: 'Alcohol', region: 'Europe',        arr:   820_000, deltaArr:  3_000_000, nrr: 72, tripsVsPlan: '+9.8%',  spark: [60, 64, 68, 70, 72], status: 'Expansion', lastActivity: 'Foot traffic +14%' },
];

const retailExceptions: FluxExceptionItem[] = [
  { id: 're1', severity: 'critical', title: 'China Premium ramp — $15M miss', entity: 'Asia · Premium', impact: '-$15M', age: 'Q1', driver: 'Macro + local compete', owner: 'Li · China Sales' },
];

const retailSignals: FluxSignalItem[] = [
  { id: 'rsig1', title: 'China Premium: trade-down accelerating through Q2', confidence: 91, horizon: 'Q2', direction: 'down', body: 'Local compete launching at 70% price point.', suggestedAction: 'Review China pricing strategy', model: 'mix-compete-v2' },
];

const retailHistory: FluxHistoryRow[] = [
  { period: 'Q1 FY26', revenue: 95, plan: 115, variance: -20, nrr: 92, churn: 3, spark: [105, 102, 98, 92], annotations: 'Premium launch soft' },
];

const retailBridges: Record<string, RegionBridgeData> = {
  global: {
    aha: [
      { text: 'Global −$38M vs Plan — Premium launch soft. ', bold: true },
      { text: 'China macro + local competition (' },
      { text: '-$15M', bold: true, tone: 'neg' },
      { text: ') is the largest driver. US channel inventory building (' },
      { text: '-$8M', bold: true, tone: 'neg' },
      { text: ') requires W14 promo plan. Germany FX tailwind (' },
      { text: '+$3M', bold: true, tone: 'pos' },
      { text: ') partial offset.' },
    ],
    planM: 115, actualM: 95,
    drivers: [
      { label: 'China Premium',  valueM: -15 },
      { label: 'US Premium',     valueM:  -8 },
      { label: 'Brazil Premium', valueM:  -8 },
      { label: 'Other',          valueM:  -7 },
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
  compares: COMPARES,
  regional: retailRegional,
  drilldown: retailDrilldown,
  exceptions: retailExceptions,
  signals: retailSignals,
  history: retailHistory,
  bridges: retailBridges,
  segmentKeywords: {
    premium:  ['premium', 'flagship', 'china premium', 'germany premium'],
    midtier:  ['mid-tier', 'mid tier', 'uk mid'],
    value:    ['value', 'africa'],
    online:   ['online', 'd2c', 'direct-to-consumer'],
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

export const INDUSTRY_PRESETS: Record<IndustryKey, IndustryPreset> = {
  delivery: deliveryPreset,
  saas:     saasPreset,
  retail:   retailPreset,
};

export const INDUSTRY_LIST: IndustryKey[] = ['delivery', 'saas', 'retail'];

// ==========================================================
// Helpers (parity with web data.ts)
// ==========================================================
export function filterCommentaryByDriver(
  commentary: CommentaryItem[],
  driver: string | null,
  segmentKeywords: Record<string, string[]>,
): CommentaryItem[] {
  if (!driver) return commentary;
  const keywords = segmentKeywords[driver] ?? [driver.toLowerCase()];
  return commentary.filter((c) => {
    const hay = `${c.name} ${c.text}`.toLowerCase();
    return keywords.some((k) => hay.includes(k));
  });
}
