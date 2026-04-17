// ==========================================
// Core types for the Meeru Variance app
// ==========================================

export type Role = 'CFO' | 'CONTROLLER' | 'PREPARER';

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
  permissions?: string[];
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

export type ActionKind =
  | 'slack' | 'email' | 'im' | 'pin' | 'remind' | 'share'
  | 'approve' | 'whatif' | 'open' | 'investigate';

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
  /** Suggested follow-up prompts shown after this reply */
  followUps?: string[];
}

export interface ChatMsg {
  role: 'user' | 'ai';
  text?: string;
  html?: string;
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
