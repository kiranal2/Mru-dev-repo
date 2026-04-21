/**
 * Core types — ported from the web app at Mru-dev-repo/meeru-variance-app/src/types.ts.
 * Kept identical so data.ts can be shared across both codebases.
 */

export type Role = 'CFO' | 'CONTROLLER' | 'PREPARER';

export type ActionKind =
  | 'slack' | 'email' | 'im' | 'pin' | 'remind' | 'share'
  | 'approve' | 'whatif' | 'open' | 'investigate';

export interface Persona {
  key: Role;
  name: string;
  init: string;
  role: string;
  email: string;
  order: ActionKind[];
  department?: string;
  reportsTo?: string;
  teamSize?: number;
  location?: string;
  timezone?: string;
  focusAreas?: string[];
  quickStat?: { label: string; value: string; tone?: 'pos' | 'neg' | 'warn' };
  todayAgenda?: string[];
}

export interface Kpi {
  lbl: string;
  val: string;
  delta: string;
  tone: 'pos' | 'neg' | 'warn';
}

export interface CommentaryItem {
  rank: number;
  name: string;
  delta: string;
  text: string;
  tags: { t: 'red' | 'green' | 'amber' | 'blue'; l: string }[];
}

export interface ChartBar {
  w: string;
  a: number;
  p: number;
  tone: 'pos' | 'neg' | 'warn' | 'blue';
  forecast?: boolean;
}

export interface ActionCard {
  kind: ActionKind;
  label: string;
  who: string;
  body: string;
}

export interface ChatResponseDef {
  match: RegExp;
  text: string;
  actions: ActionCard[];
  followUps?: string[];
}

export interface ChatMsg {
  role: 'user' | 'ai';
  text?: string;
  html?: string;
}

export interface LivePin {
  label: string;
  value: string;
  delta: string;
  tone: 'pos' | 'neg' | 'warn';
  sparkline: number[];
}

// -------- Drill / Exceptions / Signals / History (Variance tab content) --------

export type TagTone = 'red' | 'green' | 'amber' | 'blue';

export interface DrillSegment {
  id: string;
  name: string;
  region: string;
  variance: string;
  varTone: 'pos' | 'neg' | 'warn';
  spark: number[];
  util: string;
  utilTone: 'pos' | 'neg' | 'warn' | 'blue';
  trips: string;
  tripsVsPlan: string;
  aiQ: string;
}

export interface ExceptionItem {
  id: string;
  severity: 'critical' | 'warning' | 'positive';
  name: string;
  detail: string;
  tags: { t: TagTone; l: string }[];
  value: string;
  week: string;
  aiQ: string;
}

export interface SignalItem {
  name: string;
  type: string;
  typeTone: TagTone;
  confidence: number;
  body: string;
}

export interface HistoryItem {
  week: string;
  dates: string;
  variance: string;
  varTone: 'pos' | 'neg' | 'warn';
  tags: { t: TagTone; l: string }[];
  current?: boolean;
  aiQ?: string;
}

// -------- Margin Intelligence --------

export interface WaterfallStep {
  label: string;
  value: number;         // delta in percentage points (pp). 0 = anchor bar.
  kind: 'start' | 'pos' | 'neg' | 'end';
}

export interface ProductMixItem {
  name: string;
  revShare: string;        // e.g. "42%"
  revShareNum: number;     // for bar rendering
  margin: string;          // e.g. "82.4%"
  marginTone: 'pos' | 'neg' | 'warn';
  marginDelta: string;     // e.g. "+0.8pp vs plan"
  deltaTone: 'pos' | 'neg' | 'warn';
  aiQ: string;
}

export interface CostDriver {
  name: string;
  category: string;
  categoryTone: TagTone;
  impact: string;          // e.g. "−120 bps"
  impactTone: 'pos' | 'neg' | 'warn';
  body: string;
  trend: number[];
}

export interface SensitivityScenario {
  name: string;
  driver: string;          // e.g. "Wage +5%"
  marginImpact: string;    // e.g. "-0.9pp"
  marginTone: 'pos' | 'neg' | 'warn';
  arrImpact: string;       // e.g. "-$2.1M"
  arrTone: 'pos' | 'neg' | 'warn';
  probability: number;     // 0-100
}

// -------- Flux Intelligence --------

export type FluxView = 'is' | 'bs' | 'cf';

export interface FluxRow {
  id: string;
  account: string;
  curr: string;            // current period value (formatted)
  prior: string;           // prior period value (formatted)
  variance: string;        // e.g. "+$1.2M" or "−$420K"
  variancePct: string;     // e.g. "+12.4%"
  varTone: 'pos' | 'neg' | 'warn';
  material: boolean;       // above materiality threshold
  driver: string;          // short explanation
  aiQ: string;
}

// -------- Notebook --------

export type NotebookKind = 'pinned' | 'saved';

export interface NotebookEntry {
  id: string;
  kind: NotebookKind;
  title: string;
  summary: string;
  source: string;          // e.g. "Performance · California Retail"
  date: string;            // display date
  tags: { t: TagTone; l: string }[];
}
