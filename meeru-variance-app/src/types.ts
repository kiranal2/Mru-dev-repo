// ==========================================
// Core types for the Meeru Variance app
// ==========================================

export type Role = 'CFO' | 'CONTROLLER' | 'STAFF';

/**
 * Industry presets. Each preset bundles the region list, segment list,
 * per-region data slices, drill rows, exceptions, signals, history, and AI
 * bridges so the whole Performance workbench reskins when the user switches.
 * Wired through Settings → useIndustryData().
 */
export type IndustryKey = 'delivery' | 'saas' | 'retail';

export interface IndustryMeta {
  key: IndustryKey;
  label: string;
  short: string;
  tagline: string;
  /** Period label shown in the scope bar (e.g. "Week 10 · Mar 3–9 2026"). */
  periodLabel: string;
  /** Volume-metric short label (e.g. "Trips", "ARR", "Units"). */
  metricLabel: string;
  /** Format of the `arr` field in DrillRow — drives how it's rendered. */
  volumeFormat: 'trips' | 'money' | 'units';
  /** Column headers for the Drill-Down cards/table. */
  drillLabels: { primary: string; volume: string; variance: string };
  /** Three default prompt chips shown in Command Center before typing. */
  defaultPrompts: string[];
}

/**
 * Fine-grained capability keys. Each persona declares the set it holds.
 * Code calls `hasPermission(persona, key)` to gate UI (hide buttons, disable
 * modals, filter action cards). Keep the list short and semantically
 * meaningful rather than a 1:1 map of every button.
 */
export type Permission =
  | 'log_note'               // any role can add commentary
  | 'attach_evidence'        // upload supporting docs to a variance/recon
  | 'prepare_je'             // draft a JE (review required before post)
  | 'submit_for_approval'    // push a prepared JE into the review queue
  | 'review_work'            // reviewer approves/rejects staff work
  | 'post_je'                // post JE to GL (any amount within materiality)
  | 'post_je_over_1m'        // post JE above $1M materiality ceiling
  | 'approve_recon'          // sign off reconciliations
  | 'signoff_close_phase'    // flip a close phase Day/stage to complete
  | 'approve_je_over_1m'     // final CFO approval gate for large JEs
  | 'lock_period'            // lock the period for a segment / entity
  | 'publish_reports'        // publish board-level reports externally
  | 'override_materiality';  // change threshold settings

export interface Persona {
  key: Role;
  name: string;
  init: string;
  role: string;
  email: string;
  order: ActionKind[]; // preferred action-kind order
  /** Extended profile fields — used in the header profile menu */
  department?: string;
  reportsTo?: string;
  teamSize?: number;
  location?: string;
  timezone?: string;
  phone?: string;
  focusAreas?: string[];
  quickStat?: { label: string; value: string; tone?: 'pos' | 'neg' | 'warn' };
  todayAgenda?: string[];
  /** Human-readable labels for the profile menu. */
  permissions?: string[];
  /** Machine-checkable capability keys used by `hasPermission()`. */
  capabilities?: Permission[];
}

export type WorkbenchKey = 'performance' | 'margin' | 'flux';

export interface WorkbenchMeta {
  key: WorkbenchKey;
  label: string;
  short: string;
  path: string;
  icon: 'bars' | 'trend' | 'sheet';
  topTabs: string[];
}

export interface LeftItem {
  k: string;
  n: string;
  d?: string;
  tone?: 'pos' | 'neg' | 'warn';
}

export interface Kpi {
  lbl: string;
  val: string;
  delta: string;
  tone: 'pos' | 'neg' | 'warn';
}

/** Workflow state for a variance. Surfaced as a status chip in the right-nav
 *  driver row so the user can see at a glance where each item sits in the
 *  SOX approval chain, or whether it's auto-recovering without intervention. */
export type VarianceStatus =
  | 'investigating'    // staff is drafting a note / gathering evidence
  | 'submitted'        // staff has submitted to controller review
  | 'reviewing'        // controller has it
  | 'approved'         // controller/CFO has signed off; JE posted to draft
  | 'locked'           // period locked · immutable
  | 'auto-recovering'  // no action required · historical pattern supports rebound
  | 'monitoring';      // watch-only · no intervention planned

export interface CommentaryItem {
  rank: number;
  name: string;
  delta: string;
  text: string;
  tags: { t: 'red' | 'green' | 'amber' | 'blue'; l: string }[];
  /** Current workflow state — drives the status chip in the right-nav. */
  status?: VarianceStatus;
  /** 5-point weekly trend (W6 → W10) for the inline sparkline. Units are
   *  abstract — just used for shape; the bars auto-scale. */
  spark?: number[];
  /** Dollar impact in millions. Used for the materiality flag: if `abs(impactM)
   *  >= 1`, the row renders a red $-icon marking it as materiality-exceeding. */
  impactM?: number;
}

export interface ChartBar {
  w: string;
  a: number;
  p: number;
  tone: 'pos' | 'neg' | 'warn' | 'blue';
  forecast?: boolean;
}

export type ActionKind =
  | 'slack' | 'email' | 'im' | 'pin' | 'remind' | 'share'
  | 'approve' | 'whatif' | 'open' | 'investigate';

export interface ActionCard {
  kind: ActionKind;
  label: string;
  who: string;
  body: string;
  /** Optional capability gate. If set, the card is filtered out when the
   *  active persona does not hold this permission. */
  requires?: Permission;
}

export interface ChatResponseDef {
  match: RegExp;
  text: string;
  actions: ActionCard[];
  /** Suggested follow-up prompts shown after this reply */
  followUps?: string[];
  /** If set, this response only fires when the active persona matches.
   *  Persona-tagged matchers take priority over generic ones. */
  persona?: Role;
}

export interface ChatMsg {
  role: 'user' | 'ai';
  text?: string;
  html?: string;
}

/** A pinned or saved AI reply. Same shape for both lists. */
export interface SavedReply {
  id: string;
  question: string;   // the user query that produced this reply
  answerText: string; // plain-text version of the reply
  answerHtml: string; // original HTML
  scope: string;      // workbench context at the time
  persona: string;    // persona role
  timestamp: string;  // ISO string
}

export interface SourceCitation {
  title: string;
  source: 'GL' | 'Report' | 'ERP' | 'Dashboard' | 'Prior Quarter' | 'ML Model';
  detail: string;
  confidence: number; // 0-100
  asOf: string;
}

export interface Toast {
  id: number;
  kind: 'ok' | 'warn' | 'info';
  title: string;
  sub?: string;
}

export interface MissionBeat {
  body: string;
  glow?: string; // CSS selector(s) to highlight
  final?: boolean;
}

export interface Mission {
  id: string;
  label: string;
  persona: Role;
  beats: MissionBeat[];
  startWorkbench?: WorkbenchKey;
  startPath?: string;
}
