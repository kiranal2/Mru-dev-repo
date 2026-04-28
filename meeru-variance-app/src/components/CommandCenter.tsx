import { useState, useRef, useEffect, useMemo } from 'react';
import type { ReactNode, ComponentType, SVGProps } from 'react';
import { useChat, useToasts } from '../store';
import type { ChatSession } from '../store';
import { usePersona } from './AppShell';
import { Icon, getActionIcon } from '../icons';
import type { ActionCard, ActionKind, Role, SavedReply } from '../types';

/**
 * CommandCenter — self-contained ask-and-act surface.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Command Center                         [Pin][★][⤢]      │
 *   │  Every answer generates a next best action               │
 *   │                                                          │
 *   │  ( conversation transcript lives here once started )     │
 *   │                                                          │
 *   │  ✎ New Chat                                              │
 *   │  [chip] [chip] [chip]  ← defaults, becomes followUps     │
 *   │                          after the first reply           │
 *   │                                                          │
 *   │  ┌──────────────────────────────────────────────────┐   │
 *   │  │ Ask anything about this view…                    │   │
 *   │  │ [⟲] [★] [💡]                             [ ▶ ]   │   │
 *   │  └──────────────────────────────────────────────────┘   │
 *   └──────────────────────────────────────────────────────────┘
 *
 *   NEXT BEST ACTION · Ranked For You
 *   [▣ tile][▣ tile][▣ tile]   ← derived from useChat().contextual
 *
 * The prompt response *and* the auto-suggestions both render inside the
 * card so the widget is a complete self-contained dialog. The NBA row is
 * rendered underneath the card and updates dynamically when the user's
 * latest prompt produces a fresh `contextual` action list.
 */

// Shared delivery-industry prompts that work for any persona.
const SHARED_PROMPTS = [
  'Why did LATAM underperform this week?',
  'What should we watch before Tuesday?',
  'Which regions are most at risk next week?',
  'What are the most significant exceptions this week?',
  'Why is Mexico Grocery in dampening?',
  'Explain the US Convenience exit rate spike',
  'What is driving EUP Grocery outperformance?',
  'What caused the AU Grocery miss?',
];

// Persona-specific prompt pools — surfaced based on the active persona.
// Persona-tagged CHAT_RESPONSES match these in data.ts.
const PROMPTS_BY_PERSONA: Record<Role, { defaults: string[]; library: string[] }> = {
  CFO: {
    defaults: [
      'Show items needing my approval',
      'Draft a W10 board summary',
      'What is the Q1 cumulative exposure?',
    ],
    library: [
      'Show items needing my approval',
      'Draft a W10 board summary',
      'What is the Q1 cumulative exposure?',
      'What segments are ready for period lock?',
      'Compare W10 to same week last year',
      'Total materiality-exceeding variances this quarter',
      'Publish board pre-read for Friday',
      'Model Q2 recovery if all LATAM interventions land',
    ],
  },
  CONTROLLER: {
    defaults: [
      'Show my review queue',
      'What are the close-day blockers?',
      'Reconciliation status across segments',
    ],
    library: [
      'Show my review queue',
      'What are the close-day blockers?',
      'Reconciliation status across segments',
      'Show the Mexico audit trail',
      'Which staff-prepared items need approval?',
      'Post the Mexico provisional JE',
      'Route Mexico to CFO for sign-off',
      'Day 4 critical-path items',
    ],
  },
  STAFF: {
    defaults: [
      'What are my tasks for today?',
      'How do I prepare the Mexico investigation?',
      'What evidence am I missing?',
    ],
    library: [
      'What are my tasks for today?',
      'How do I prepare the Mexico investigation?',
      'What evidence am I missing?',
      'Submit Mexico for Controller review',
      'Show me a well-documented example',
      'How long does Raj usually take to review?',
      'Prepare the Voltair JE',
      'Upload Bank recon evidence',
    ],
  },
};

// Shared topical buckets — useful for all personas.
const SHARED_SUGGESTION_GROUPS: { label: string; icon: 'Sparkle' | 'Trend' | 'Target' | 'Email'; items: string[] }[] = [
  {
    label: 'Diagnose',
    icon: 'Sparkle',
    items: [
      'Why did LATAM underperform this week?',
      'Why is Mexico Grocery in dampening?',
      'Explain the US Convenience exit rate spike',
      'What caused the AU Grocery miss?',
    ],
  },
  {
    label: 'Compare & Trend',
    icon: 'Trend',
    items: [
      'Compare W10 to W34 2024',
      'Compare W10 to same week last year',
      'Rank exceptions by revenue impact',
      'How does W10 compare to W9?',
    ],
  },
  {
    label: 'Forecast & Model',
    icon: 'Target',
    items: [
      'Which regions are most at risk next week?',
      'Model Mexico supply ceiling +11%',
      'Will NA recover next week?',
      'What should we watch before Tuesday?',
    ],
  },
  {
    label: 'Drafts & Briefs',
    icon: 'Email',
    items: [
      'Draft a W10 summary for the CEO',
      'Summarize the vs Plan view in one sentence',
      'Flag segments approaching supply thresholds',
      'Can we amplify the EUP school holiday effect?',
    ],
  },
];

// Seed history — pre-populated recent queries so the History panel has content
// for demo/first-load. Real user queries from the current session are merged
// in front of these so the panel always has something meaningful to show.
interface HistoryEntry {
  q: string;
  when: string;   // relative label ("2m ago", "Yesterday", etc.)
  scope?: string; // workbench context label
}
const SEED_HISTORY: HistoryEntry[] = [
  { q: 'Why did LATAM underperform this week?',    when: '12m ago',  scope: 'Performance · Global' },
  { q: 'Diagnose the Mexico supply breach',        when: '1h ago',   scope: 'Performance · LATAM' },
  { q: 'Rank exceptions by revenue impact',        when: 'Yesterday',scope: 'Performance · Global' },
  { q: 'Compare W10 to W34 2024',                  when: 'Yesterday',scope: 'Flux' },
  { q: 'Will NA recover next week?',               when: '2d ago',   scope: 'Performance · North America' },
  { q: 'Model 5% price increase on retention',     when: '3d ago',   scope: 'Performance' },
];

/**
 * Rank suggestions against the current input. Simple case-insensitive scoring:
 *  - 3 if the suggestion starts with the query
 *  - 2 if any word starts with the query
 *  - 1 if the query appears anywhere
 *  - 0 otherwise (filtered out)
 */
function rankSuggestions(q: string, pool: string[]): string[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  type Scored = { s: string; score: number };
  const scored: Scored[] = pool.map(s => {
    const t = s.toLowerCase();
    let score = 0;
    if (t.startsWith(query)) score = 3;
    else if (t.split(/\s+/).some(w => w.startsWith(query))) score = 2;
    else if (t.includes(query)) score = 1;
    return { s, score };
  });
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.s);
}

// Demo NBAs shown before the user asks anything — matches the mockup so the
// widget looks complete on first paint.
interface NbaTile {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  idKey: string;
  action?: ActionCard; // present when derived from chat response
}

const DEFAULT_NBAS: NbaTile[] = [
  {
    idKey: 'default-cro',
    icon: Icon.Target,
    title: 'Brief CRO on at-risk accounts',
    subtitle: '3 Enterprise logos · -$2.1M exposure',
    priority: 'HIGH',
  },
  {
    idKey: 'default-whatif',
    icon: Icon.Search,
    title: "Run 'save 2 of 3' what-if",
    subtitle: 'Model retention impact by Friday',
    priority: 'MED',
  },
  {
    idKey: 'default-board',
    icon: Icon.Email,
    title: 'Draft board pre-read',
    subtitle: 'Summarize Q1 miss · ready for review',
    priority: 'LOW',
  },
  {
    idKey: 'default-pin',
    icon: Icon.Pin,
    title: 'Pin quarterly variance view',
    subtitle: 'Workspace · Q1 variance watch',
    priority: 'MED',
  },
  {
    idKey: 'default-slack',
    icon: Icon.Slack,
    title: 'Slack finance leadership',
    subtitle: '#finance-leadership · share snapshot',
    priority: 'MED',
  },
  {
    idKey: 'default-remind',
    icon: Icon.Remind,
    title: 'Set reminder for Thursday review',
    subtitle: 'Calendar · pre-earnings check',
    priority: 'LOW',
  },
];

const PRIORITY_PILL: Record<NbaTile['priority'], string> = {
  HIGH: 'bg-negative-weak text-negative',
  MED: 'bg-warning-weak text-warning',
  LOW: 'bg-brand-tint text-brand',
};

function priorityFor(idx: number): NbaTile['priority'] {
  return idx === 0 ? 'HIGH' : idx === 1 ? 'MED' : 'LOW';
}

/** Convert an ActionCard from the chat store into a display NBA tile. */
function tileFromAction(a: ActionCard, idx: number): NbaTile {
  return {
    idKey: `ctx-${a.kind}-${idx}`,
    icon: getActionIcon(a.kind),
    title: a.label,
    subtitle: a.body,
    priority: priorityFor(idx),
    action: a,
  };
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function UtilityButton({
  label,
  icon,
  onClick,
  active,
  badge,
}: {
  label: string;
  /** Retained in the API for callers, but the button is icon-only now. */
  shortLabel?: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative inline-flex items-center justify-center w-7 h-7 rounded-full border transition-all ${
        active
          ? 'bg-brand text-white border-brand shadow-e1'
          : 'bg-surface-alt text-muted border-rule hover:bg-brand-tint hover:text-brand hover:border-brand'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold leading-none ${
            active
              ? 'bg-white text-brand border border-brand'
              : 'bg-brand text-white'
          }`}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function HeaderIconButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${
        active
          ? 'text-brand bg-brand-tint'
          : 'text-faint hover:text-brand hover:bg-brand-tint'
      }`}
    >
      {icon}
    </button>
  );
}

/** Labeled header button — icon + text pill. Used in the redesigned
 *  Command Center sub-row to match Shawn's reference (Pin / Favorite / Expand). */
function HeaderLabeledButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
        active
          ? 'border-brand bg-brand-tint text-brand'
          : 'border-rule bg-surface text-muted hover:text-ink hover:border-brand hover:bg-brand-tint'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SuggestionChip({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left px-3 py-1.5 rounded-full border border-rule bg-surface text-[11.5px] text-ink hover:bg-brand-tint hover:text-brand hover:border-brand transition-colors whitespace-nowrap"
    >
      {children}
    </button>
  );
}

function NbaCard({
  tile,
  onRun,
  selected,
  completed,
}: {
  tile: NbaTile;
  onRun: (t: NbaTile) => void;
  selected?: boolean;
  completed?: boolean;
}) {
  const IconC = tile.icon;
  return (
    <button
      type="button"
      onClick={() => onRun(tile)}
      aria-pressed={selected}
      className={`group w-full min-w-0 text-left rounded-xl p-3 flex items-center gap-2.5 transition-all ${
        selected
          ? 'bg-brand-tint border-2 border-brand shadow-e2 -translate-y-0.5'
          : 'bg-surface border border-rule shadow-e1 hover:shadow-e2 hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 transition-colors ${
          completed ? 'bg-positive text-white' : 'bg-brand text-white'
        }`}
      >
        {completed ? <Icon.Check className="w-4 h-4" /> : <IconC className="w-4 h-4" />}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-[12px] font-semibold text-ink truncate">
          {tile.title}
        </div>
        <div className="text-[10.5px] text-muted truncate mt-0.5">
          {completed ? 'Completed — click to view plan' : tile.subtitle}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PRIORITY_PILL[tile.priority]}`}
        >
          {tile.priority}
        </span>
        <Icon.ChevRight
          className={`w-3.5 h-3.5 transition-all ${
            selected ? 'text-brand rotate-90' : 'text-faint group-hover:text-brand group-hover:translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Action Plan — concrete steps for each NBA tile
// ---------------------------------------------------------------------------
//
// Each NBA tile opens an inline Action Plan panel showing the exact sequence
// of steps Meeru will execute. Steps are derived from the action `kind` so
// every tile gets a relevant playbook (email flow is different from a
// what-if modeling flow). Users can Run All (the steps animate through a
// pending → running → done sequence to visibly demonstrate the automation)
// or Run Individually (step through one at a time).

// Configuration controls that render inline beneath each step. Each step can
// expose 0+ configs — pills for quick multi-option, select for long lists,
// slider for numeric, toggle for boolean, textarea for editable copy. The
// user tunes these before clicking "Run all steps", so the action feels like
// real configurable automation rather than a fixed script.
type StepConfig =
  | { type: 'select';  id: string; label: string; default: string;  options: string[] }
  | { type: 'pills';   id: string; label: string; default: string;  options: string[] }
  | { type: 'textarea';id: string; label: string; default: string;  rows?: number }
  | { type: 'slider';  id: string; label: string; default: number;  min: number; max: number; step?: number; unit?: string }
  | { type: 'toggle';  id: string; label: string; default: boolean; hint?: string };

/** A compact AI proposal for what an action will do. The shape forces the
 *  modal to stay tight: one summary sentence, a handful of pre-decided facts,
 *  optionally the drafted content (the most-likely-to-be-edited part), and
 *  at most one real override knob. Everything else is AI judgment the human
 *  doesn't need to re-confirm. */
interface ActionPreview {
  /** Natural-language sentence: "Post to #renewal-war-room". */
  summary: string;
  /** AI decisions shown as read-only chips — "12 members", "Chart attached". */
  facts?: string[];
  /** The drafted content the user is most likely to want to tweak. Rendered
   *  as an editable textarea but pre-filled with the AI draft. */
  draft?: { label: string; content: string; rows?: number };
  /** A single meaningful override, if any. Resist the urge to add more. */
  override?: StepConfig;
}

/** Resolve the action kind for a tile — either from the backing ActionCard
 *  or from the tile's idKey (for the default demo tiles). */
function kindFor(tile: NbaTile): ActionKind {
  if (tile.action) return tile.action.kind;
  if (tile.idKey === 'default-cro') return 'share';
  if (tile.idKey === 'default-whatif') return 'whatif';
  if (tile.idKey === 'default-board') return 'email';
  return 'open';
}

/** AI-proposed action preview per kind. Designed so the user can skim + ship
 *  in two seconds: what's happening, what the AI decided, and one knob they
 *  might want to tweak. */
function getActionPreview(kind: ActionKind): ActionPreview {
  switch (kind) {
    case 'email':
      return {
        summary: 'Send 3 personalized emails to at-risk account VPs',
        facts: ['Enterprise segment', 'CS Director reviews before send', 'Tracked in CRM'],
        draft: {
          label: 'Opening line',
          content:
            'Hi {FirstName} — as we approach your renewal window, I wanted to share some concerns the team has been tracking and propose a path forward.',
          rows: 3,
        },
        override: {
          type: 'pills', id: 'tone', label: 'Tone', default: 'Professional',
          options: ['Professional', 'Warm', 'Executive'],
        },
      };
    case 'pin':
      return {
        summary: 'Pin NRR to your Home workspace',
        facts: ['90-day trend + cohort view', 'Auto-refresh every 5 min', 'Slack alert on breach'],
        override: {
          type: 'slider', id: 'threshold', label: 'Alert when NRR drops below',
          default: 110, min: 100, max: 120, unit: '%',
        },
      };
    case 'whatif':
      return {
        summary: 'Simulate renewal outcomes with executive intervention',
        facts: ['Current quarter baseline', 'Monte Carlo · 1,000 sims', 'Executive sponsorship on'],
        override: {
          type: 'slider', id: 'boost', label: 'Renewal program boost',
          default: 15, min: 0, max: 50, unit: '%',
        },
      };
    case 'slack':
    case 'im':
      return {
        summary: 'Post to #renewal-war-room',
        facts: ['12 members', 'NRR trend chart attached', 'Replies tracked in Meeru'],
        draft: {
          label: 'Message',
          content:
            'Quick heads-up: 3 Enterprise accounts flagged renewal risk (-$2.1M exposure). Thread below for context and next steps.',
          rows: 3,
        },
      };
    case 'share':
      return {
        summary: 'Generate a view-only link to this analysis',
        facts: ['Expires in 7 days', 'Filters + period frozen', 'Revocable · audit-logged'],
      };
    case 'approve':
      return {
        summary: 'Approve 3 renewal exceptions',
        facts: ['Risk scores attached', 'Controller sign-off logged', 'Requesters notified via Slack'],
      };
    case 'remind':
      return {
        summary: 'Remind me to check in on these renewals',
        override: {
          type: 'pills', id: 'when', label: 'When', default: '3 days before',
          options: ['24h before', '3 days before', '1 week before'],
        },
        draft: {
          label: 'Note to future me',
          content: 'Check in on at-risk renewals — confirm outreach status and update forecast.',
          rows: 2,
        },
      };
    case 'investigate':
      return {
        summary: 'Start a variance investigation',
        facts: ['Anomaly detection on', 'Brief saved to Notebook'],
        override: {
          type: 'pills', id: 'dim', label: 'Drill by', default: 'Account',
          options: ['Account', 'Region', 'Product', 'Cohort'],
        },
      };
    case 'open':
    default:
      return {
        summary: 'Open the detail view',
        facts: ['Current scope + period preserved'],
      };
  }
}

/** Renders a single configurable control inline under a step. Locked (disabled)
 *  once the step is running or done — values are "committed" at that point. */
function StepConfigControl({
  config,
  value,
  onChange,
  disabled,
}: {
  config: StepConfig;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
  disabled: boolean;
}) {
  if (config.type === 'pills') {
    const v = value as string;
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          {config.label}
        </div>
        <div className="flex flex-wrap gap-1">
          {config.options.map(opt => {
            const active = v === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={`h-6 px-2.5 rounded-full text-[11px] font-medium border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  active
                    ? 'bg-brand text-white border-brand shadow-e1'
                    : 'bg-surface text-muted border-rule hover:bg-brand-tint hover:text-brand hover:border-brand'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (config.type === 'select') {
    const v = value as string;
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
          {config.label}
        </div>
        <select
          value={v}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className="w-full h-7 px-2 rounded-md bg-surface border border-rule text-[11.5px] text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-[color:var(--primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {config.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  if (config.type === 'slider') {
    const v = value as number;
    const unit = config.unit ?? '';
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
            {config.label}
          </div>
          <div className="text-[11px] font-bold text-brand tabular-nums px-1.5 py-0.5 rounded bg-brand-tint">
            {v}{unit}
          </div>
        </div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          value={v}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1 accent-[color:var(--primary)] disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    );
  }
  if (config.type === 'toggle') {
    const v = value as boolean;
    return (
      <label className={`flex items-start gap-2 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <button
          type="button"
          role="switch"
          aria-checked={v}
          disabled={disabled}
          onClick={() => onChange(!v)}
          className={`relative inline-flex shrink-0 h-4 w-7 items-center rounded-full transition-colors mt-0.5 disabled:cursor-not-allowed ${
            v ? 'bg-brand' : 'bg-surface-alt border border-rule'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full bg-white shadow-e1 transition-transform ${
              v ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="flex-1 min-w-0">
          <span className="block text-[11.5px] font-medium text-ink leading-tight">
            {config.label}
          </span>
          {config.hint && (
            <span className="block text-[10.5px] text-faint leading-tight mt-0.5">
              {config.hint}
            </span>
          )}
        </span>
      </label>
    );
  }
  // textarea
  const v = value as string;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
        {config.label}
      </div>
      <textarea
        value={v}
        disabled={disabled}
        rows={config.rows ?? 2}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-md bg-surface border border-rule text-[11.5px] text-ink leading-snug resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-[color:var(--primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      />
    </div>
  );
}

/** Kind-specific primary button label. Reads like a real action verb instead
 *  of the generic "Run all steps" — gives the modal a clear commit moment. */
function actionVerb(kind: ActionKind): { idle: string; running: string; done: string } {
  switch (kind) {
    case 'email':       return { idle: 'Send emails',       running: 'Sending…',     done: 'Sent' };
    case 'pin':         return { idle: 'Pin to Home',       running: 'Pinning…',     done: 'Pinned' };
    case 'whatif':      return { idle: 'Run scenario',      running: 'Simulating…',  done: 'Saved' };
    case 'slack':
    case 'im':          return { idle: 'Post to Slack',     running: 'Posting…',     done: 'Posted' };
    case 'share':       return { idle: 'Generate link',     running: 'Creating…',    done: 'Link ready' };
    case 'approve':     return { idle: 'Approve & notify',  running: 'Approving…',   done: 'Approved' };
    case 'remind':      return { idle: 'Set reminder',      running: 'Scheduling…',  done: 'Scheduled' };
    case 'investigate': return { idle: 'Start investigation', running: 'Analyzing…', done: 'Brief ready' };
    case 'open':
    default:            return { idle: 'Open view',         running: 'Opening…',     done: 'Opened' };
  }
}

function ActionPlanPanel({
  tile,
  onClose,
  onComplete,
}: {
  tile: NbaTile;
  onClose: () => void;
  onComplete: (tile: NbaTile) => void;
}) {
  const kind = kindFor(tile);
  const preview = useMemo(() => getActionPreview(kind), [kind]);
  const verb = actionVerb(kind);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const IconC = tile.icon;

  // Editable draft content — pre-filled with the AI draft so the user can
  // review and tweak before shipping without starting from a blank field.
  const [draftValue, setDraftValue] = useState(preview.draft?.content ?? '');
  // Optional single override value (tone, timing, threshold, etc).
  const [overrideValue, setOverrideValue] = useState<string | number | boolean>(
    preview.override?.default ?? '',
  );

  // Reset state when the tile changes
  useEffect(() => {
    setFinished(false);
    setRunning(false);
    setDraftValue(preview.draft?.content ?? '');
    setOverrideValue(preview.override?.default ?? '');
  }, [tile.idKey, preview]);

  // Lock body scroll + Escape-to-close while the modal is open. Without the
  // scroll lock the page under the backdrop can scroll on wheel/touch which
  // feels broken. Restore on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      // Don't allow closing mid-run — the user would wonder whether their
      // action actually executed. Only allow close when idle or finished.
      if (e.key === 'Escape' && !running) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, running]);

  // Single commit moment. Briefly show a running state so the action feels
  // real (network call / work being done), then mark done. For "open" /
  // "investigate" kinds we also fire a `meeru-navigate` window event so the
  // host page can switch to the relevant detail tab, then auto-close the
  // modal shortly after — otherwise users see "Opened ✓" and nothing visibly
  // happens.
  const execute = () => {
    if (running || finished) return;
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setFinished(true);
      onComplete(tile);
      if (kind === 'open' || kind === 'investigate') {
        const label = tile.action?.label ?? tile.title ?? '';
        const body = tile.action?.body ?? '';
        const who = tile.action?.who ?? '';
        window.dispatchEvent(new CustomEvent('meeru-navigate', {
          detail: { label, body, who, kind },
        }));
        // Brief delay so the user sees the ✓ state before the modal dismisses.
        setTimeout(() => onClose(), 650);
      }
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-plan-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop — dim + blur the page behind the modal. Clicking it closes
          the dialog, unless a run is in progress (we don't want the user to
          dismiss mid-automation and wonder whether their action completed). */}
      <div
        onClick={() => { if (!running) onClose(); }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] anim-fade-up"
        aria-hidden
      />
      {/* Dialog — constrained width, scrollable body if too tall, brand
          ring + shadow-e3 so it reads as a premium focused surface. */}
      <div
        className="relative z-10 w-full max-w-[560px] max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface border border-[color:var(--primary)]/20 rounded-2xl shadow-e3 anim-fade-up"
        style={{
          boxShadow: [
            '0 1px 2px rgba(15,23,42,0.04)',
            '0 12px 28px -6px rgba(15,23,42,0.2)',
            '0 28px 56px -12px rgba(15,23,42,0.28)',
            '0 0 0 1px rgba(182,77,29,0.12)',
          ].join(', '),
        }}
      >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-rule bg-surface-soft/60">
        <div
          className="w-10 h-10 rounded-lg grid place-items-center shrink-0 text-white shadow-e1"
          style={{
            background:
              'linear-gradient(135deg, var(--primary) 0%, rgba(182,77,29,0.8) 100%)',
          }}
        >
          <IconC className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              id="action-plan-title"
              className="text-[14px] font-semibold text-ink truncate"
            >
              {tile.title}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${PRIORITY_PILL[tile.priority]}`}>
              {tile.priority}
            </span>
          </div>
          <div className="text-[11.5px] text-muted mt-0.5 leading-snug">
            {tile.subtitle}
            {tile.action?.who && (
              <>
                <span className="mx-1.5 text-faint">·</span>
                <span className="font-medium text-ink">{tile.action.who}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close action plan"
          className="w-7 h-7 rounded-md grid place-items-center text-faint hover:text-ink hover:bg-surface-alt transition-colors shrink-0"
        >
          <Icon.X className="w-4 h-4" />
        </button>
      </div>

      {/* AI proposal — what's about to happen, in plain language. Shows
          the summary, the key AI decisions as facts, the drafted content
          (editable), and at most one meaningful override knob. */}
      <div className="p-4 space-y-3">
        {/* Proposal summary + AI decision chips */}
        <div className="rounded-xl border border-rule bg-surface-soft/50 px-3.5 py-3">
          <div className="text-[13px] text-ink leading-snug">
            {preview.summary}
          </div>
          {preview.facts && preview.facts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {preview.facts.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10.5px] text-muted bg-surface border border-rule rounded-full px-2 py-0.5"
                >
                  <Icon.Check className="w-2.5 h-2.5 text-positive" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editable draft content */}
        {preview.draft && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-faint mb-1.5">
              {preview.draft.label}
            </div>
            <textarea
              value={draftValue}
              rows={preview.draft.rows ?? 3}
              disabled={running || finished}
              onChange={e => setDraftValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-rule text-[12px] text-ink leading-relaxed resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-[color:var(--primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            />
          </div>
        )}

        {/* Single override knob — e.g. tone, timing, threshold */}
        {preview.override && (
          <StepConfigControl
            config={preview.override}
            value={overrideValue}
            disabled={running || finished}
            onChange={setOverrideValue}
          />
        )}
      </div>

      {/* Footer — single primary action with a kind-specific verb. */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-rule bg-surface-soft/40">
        <button
          type="button"
          onClick={onClose}
          disabled={running}
          className="h-8 px-3 rounded-lg text-[12px] font-medium text-muted hover:text-ink hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={finished ? onClose : execute}
          disabled={running}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-white text-[12px] font-semibold shadow-e1 hover:shadow-e2 disabled:opacity-80 disabled:cursor-not-allowed transition-all"
          style={{
            background: finished
              ? 'linear-gradient(135deg, var(--positive) 0%, rgba(22,163,74,0.85) 100%)'
              : 'linear-gradient(135deg, var(--primary) 0%, rgba(182,77,29,0.85) 100%)',
          }}
        >
          {finished ? (
            <>{verb.done} <Icon.Check className="w-3.5 h-3.5" /></>
          ) : running ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              {verb.running}
            </>
          ) : (
            <>{verb.idle} <Icon.ChevRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>
      {/* /dialog content */}
      </div>
      {/* /modal root */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversation transcript
// ---------------------------------------------------------------------------

function Transcript({ thinking }: { thinking: boolean }) {
  const { msgs } = useChat();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Keep the latest message visible
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, thinking]);

  // Rotating status phrases while the AI is "thinking" — gives the appearance
  // of a multi-stage pipeline (analyzing → ranking → drafting) instead of a
  // single static spinner.
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phases = ['Analyzing context', 'Scanning 14k signals', 'Ranking next best actions', 'Drafting response'];
  useEffect(() => {
    if (!thinking) { setPhaseIdx(0); return; }
    const id = setInterval(() => setPhaseIdx(i => (i + 1) % phases.length), 900);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking]);

  if (msgs.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      className="mb-3 max-h-[280px] overflow-y-auto pr-1 space-y-2"
    >
      {msgs.map((m, i) =>
        m.role === 'user' ? (
          <div key={i} className="flex justify-end anim-fade-up">
            <div className="max-w-[85%] px-3 py-1.5 rounded-xl rounded-br-sm bg-brand text-white text-[12px] leading-relaxed">
              {m.text}
            </div>
          </div>
        ) : (
          <div key={i} className="flex justify-start anim-fade-up">
            <div
              className="max-w-[92%] px-3 py-2 rounded-xl rounded-bl-sm bg-surface-alt border border-rule text-[12px] text-ink leading-relaxed"
              dangerouslySetInnerHTML={{ __html: m.html ?? m.text ?? '' }}
            />
          </div>
        ),
      )}
      {thinking && (
        <div className="flex justify-start anim-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl rounded-bl-sm bg-surface-alt border border-rule text-[11px] text-muted shimmer-bg">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" style={{ animationDelay: '120ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" style={{ animationDelay: '240ms' }} />
            </span>
            <span className="text-ink font-medium">Meeru</span>
            <span className="text-faint">·</span>
            <span key={phaseIdx} className="anim-fade-up">{phases[phaseIdx]}…</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton placeholder tile shown in the NBA row while the AI is still
// computing its response. Visually echoes NbaCard's footprint so the grid
// doesn't reflow when real tiles replace the skeletons.
function NbaSkeleton({ delayMs }: { delayMs: number }) {
  return (
    <div
      className="bg-surface border border-rule rounded-xl p-3 flex items-center gap-2.5 shadow-e1 shimmer-bg anim-fade-up"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="w-9 h-9 rounded-lg bg-surface-soft shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2 rounded bg-surface-soft w-3/4" />
        <div className="h-2 rounded bg-surface-soft w-1/2" />
      </div>
      <div className="w-8 h-3 rounded-full bg-surface-soft shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer popover panels — History / Saved / Suggestions
// ---------------------------------------------------------------------------

function PanelHeader({
  title, count, right,
}: { title: string; count?: number; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-rule bg-surface-soft">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-faint">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] font-medium text-muted">· {count}</span>
        )}
      </div>
      {right}
    </div>
  );
}

function EmptyRow({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <div className="w-8 h-8 mx-auto rounded-full bg-surface-soft text-faint grid place-items-center mb-2">
        {icon}
      </div>
      <div className="text-[12px] font-medium text-ink">{title}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

// Format an updatedAt timestamp into a compact relative label that fits the
// History row footer: "Just now", "12m ago", "Yesterday", "Mar 4".
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = new Date(ts);
  const today = new Date();
  const isYesterday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate() - 1;
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function HistoryPanel({
  sessions, activeSessionId, onLoad, onTogglePin, onDelete, onClear,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoad: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState('');
  // Pinned conversations sort to the top so saved threads are always one tap
  // away. Within each group we sort by updatedAt desc.
  const sorted = useMemo(() => {
    const k = q.trim().toLowerCase();
    const filtered = k
      ? sessions.filter(s =>
          s.title.toLowerCase().includes(k) ||
          (s.scope ?? '').toLowerCase().includes(k))
      : sessions;
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [q, sessions]);
  const hasAny = sessions.length > 0;
  return (
    <div>
      <PanelHeader
        title="Chat history"
        count={sessions.length}
        right={hasAny && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            title="Clear unpinned conversations"
            className="text-[10px] font-medium text-muted hover:text-negative transition-colors"
          >
            Clear unpinned
          </button>
        )}
      />
      {hasAny && (
        <div className="px-3 py-2 border-b border-rule">
          <div className="relative">
            <Icon.Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-faint" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-7 pr-2 py-1.5 text-[12px] bg-surface-alt border border-rule rounded-md outline-none focus:border-brand text-ink placeholder:text-faint"
            />
          </div>
        </div>
      )}
      <ul className="max-h-[320px] overflow-y-auto py-1">
        {!hasAny ? (
          <EmptyRow
            icon={<Icon.History className="w-4 h-4" />}
            title="No conversations yet"
            sub="Ask anything below to start your first chat"
          />
        ) : sorted.length === 0 ? (
          <EmptyRow
            icon={<Icon.Search className="w-4 h-4" />}
            title="No matches"
            sub="Try a different keyword"
          />
        ) : sorted.map(s => {
          const isActive = s.id === activeSessionId;
          const turnCount = Math.floor(s.messages.length / 2);
          return (
            <li
              key={s.id}
              className={`group relative px-3 py-2 cursor-pointer transition-colors ${
                isActive ? 'bg-brand-tint/60' : 'hover:bg-brand-tint'
              }`}
              onMouseDown={(ev) => { ev.preventDefault(); onLoad(s.id); }}
            >
              <div className="flex items-start gap-2 pr-12">
                <Icon.History className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-brand' : 'text-faint group-hover:text-brand'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {s.pinned && <Icon.Pin className="w-3 h-3 text-brand shrink-0" />}
                    <div className={`text-[12.5px] truncate ${isActive ? 'text-brand font-medium' : 'text-ink group-hover:text-brand'}`}>{s.title}</div>
                  </div>
                  <div className="text-[10px] text-faint mt-0.5 flex items-center gap-1.5">
                    <span>{relativeTime(s.updatedAt)}</span>
                    <span>·</span>
                    <span>{turnCount} {turnCount === 1 ? 'turn' : 'turns'}</span>
                    {s.scope && <><span>·</span><span className="truncate">{s.scope}</span></>}
                  </div>
                </div>
              </div>
              {/* Per-row actions: pin + delete. Stop propagation so click
                  doesn't also trigger the load handler on the row. */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title={s.pinned ? 'Unpin' : 'Pin conversation'}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(s.id); }}
                  className="w-6 h-6 rounded grid place-items-center text-faint hover:text-brand hover:bg-surface"
                >
                  <Icon.Pin className={`w-3.5 h-3.5 ${s.pinned ? 'text-brand' : ''}`} />
                </button>
                <button
                  type="button"
                  title="Delete conversation"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(s.id); }}
                  className="w-6 h-6 rounded grid place-items-center text-faint hover:text-negative hover:bg-surface"
                >
                  <Icon.X className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SavedPanel({
  saved, onPick, onRemove,
}: {
  saved: SavedReply[];
  onPick: (q: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <PanelHeader title="Saved prompts" count={saved.length} />
      {saved.length === 0 ? (
        <EmptyRow
          icon={<Icon.Star className="w-4 h-4" />}
          title="Nothing saved yet"
          sub="Star a reply to keep it here for later"
        />
      ) : (
        <ul className="max-h-[260px] overflow-y-auto py-1">
          {saved.map(s => {
            const when = new Date(s.timestamp);
            const whenLabel = isNaN(when.getTime()) ? '' : when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return (
              <li
                key={s.id}
                className="px-3 py-2 hover:bg-brand-tint transition-colors group relative"
              >
                <div
                  onMouseDown={(ev) => { ev.preventDefault(); onPick(s.question); }}
                  className="flex items-start gap-2 cursor-pointer pr-6"
                >
                  <Icon.Star className="w-3.5 h-3.5 text-brand fill-current shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] text-ink truncate group-hover:text-brand">{s.question}</div>
                    <div className="text-[10px] text-faint mt-0.5 flex items-center gap-1.5">
                      {whenLabel && <span>{whenLabel}</span>}
                      {s.scope && <><span>·</span><span className="truncate">{s.scope}</span></>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onMouseDown={(ev) => { ev.preventDefault(); onRemove(s.id); }}
                  title="Remove from saved"
                  aria-label="Remove from saved"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded grid place-items-center text-faint hover:text-negative hover:bg-negative-weak opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Icon.X className="w-3 h-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SuggestionsPanel({ onPick, groups }: { onPick: (q: string) => void; groups: { label: string; icon: 'Sparkle' | 'Trend' | 'Target' | 'Email'; items: string[] }[] }) {
  return (
    <div>
      <PanelHeader
        title="Prompt suggestions"
        count={groups.reduce((n, g) => n + g.items.length, 0)}
      />
      <div className="max-h-[300px] overflow-y-auto">
        {groups.map(group => {
          const Ic = group.icon === 'Sparkle' ? Icon.Sparkle
            : group.icon === 'Trend' ? Icon.Trend
            : group.icon === 'Target' ? Icon.Target
            : Icon.Email;
          return (
            <div key={group.label} className="py-1">
              <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-faint">
                <Ic className="w-3 h-3" />
                {group.label}
              </div>
              <ul>
                {group.items.map(q => (
                  <li
                    key={q}
                    onMouseDown={(ev) => { ev.preventDefault(); onPick(q); }}
                    className="px-3 py-1.5 pl-7 cursor-pointer hover:bg-brand-tint transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[12.5px] text-ink truncate group-hover:text-brand flex-1">{q}</span>
                    <Icon.ChevRight className="w-3 h-3 text-faint opacity-0 group-hover:opacity-100 group-hover:text-brand transition-opacity shrink-0" />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CommandCenter({
  prompts,
}: {
  prompts?: string[];
}) {
  const {
    send, reset, msgs, contextual, followUps, thinking, markSent, sent,
    saved, removeSaved,
    sessions, activeSessionId, loadSession, togglePinSession, deleteSession, clearAllSessions,
  } = useChat();
  // The currently active session (if any) — used to drive the Pin button's
  // visual state and to make Pin actually persist.
  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const persona = usePersona();
  const { push } = useToasts();
  const [input, setInput] = useState('');

  // Persona-specific prompt pools — the 3 default chips and the type-ahead
  // library both pull from here so the user sees prompts that actually match
  // persona-tagged responses in data.ts.
  const personaPrompts = PROMPTS_BY_PERSONA[persona.key];
  const DEFAULT_PROMPTS = prompts ?? personaPrompts.defaults;
  const SUGGESTION_LIBRARY = useMemo(
    () => [...personaPrompts.library, ...SHARED_PROMPTS],
    [personaPrompts],
  );
  const SUGGESTION_GROUPS = useMemo(() => [
    { label: `For ${persona.role.split(/\s|,/)[0]}`, icon: 'Sparkle' as const, items: personaPrompts.library.slice(0, 5) },
    ...SHARED_SUGGESTION_GROUPS,
  ], [personaPrompts, persona.role]);

  // ---------- Composer-icon popovers (History / Saved / Suggestions) ----------
  // A single `openPanel` drives which floating panel renders above the utility
  // icon cluster. Clicking the same icon again toggles it closed; clicking
  // outside the composer also closes (see useEffect below).
  const [openPanel, setOpenPanel] = useState<'history' | 'saved' | 'suggestions' | null>(null);
  const composerWrapRef = useRef<HTMLDivElement>(null);
  // ---------- Type-ahead suggestions ----------
  // Declared up front so `handleInput` below can reset the active index.
  // Fires as the user types: rank the SUGGESTION_LIBRARY against the current
  // input and surface up to 5 matches in a floating list above the composer.
  // When the user commits one (click or Enter-with-active-index), we send it
  // immediately rather than populating the textarea, matching the AI-assistant
  // UX you see in Command-K style palettes.
  const [suggestIdx, setSuggestIdx] = useState(-1);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // ---------- Composer ----------
  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    send(q);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };
  const onSubmit = () => submit(input);
  const onChip = (p: string) => submit(p);

  const handleInput = (v: string) => {
    setInput(v);
    // Reset the suggestion highlight whenever the input changes — the ranked
    // list shifts underneath so a stale index would point to the wrong row.
    setSuggestIdx(-1);
    const el = taRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  const suggestions = useMemo(() => rankSuggestions(input, SUGGESTION_LIBRARY), [input]);
  const showSuggest = suggestions.length > 0 && input.trim().length > 0;

  const pickSuggestion = (s: string) => {
    setSuggestIdx(-1);
    submit(s);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate the suggestion list with Arrow keys; Escape dismisses it.
    if (showSuggest) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Escape') {
        setSuggestIdx(-1);
        setInput('');
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      // If a suggestion is highlighted, commit it; otherwise submit raw input.
      if (showSuggest && suggestIdx >= 0) {
        pickSuggestion(suggestions[suggestIdx]);
      } else {
        onSubmit();
      }
    }
  };

  // ---------- Chips ----------
  // Before any reply: show persona-aware default starter prompts.
  // After a reply: show the follow-ups returned by the response.
  const chipPrompts = useMemo<string[]>(() => {
    if (followUps.length > 0) return followUps.slice(0, 4);
    return DEFAULT_PROMPTS;
  }, [followUps, DEFAULT_PROMPTS]);

  // ---------- NBA row (dynamic) ----------
  const nbaTiles: NbaTile[] = useMemo(() => {
    if (contextual.length === 0) return DEFAULT_NBAS;
    // No slice — show every action the response returned so the user can
    // scroll through all relevant next steps.
    return contextual.map(tileFromAction);
  }, [contextual]);

  // Clicking an NBA tile opens its action plan inline below the grid.
  // Clicking the same tile again closes the plan (toggle behavior).
  const [activeNbaId, setActiveNbaId] = useState<string | null>(null);
  const [completedNbas, setCompletedNbas] = useState<Set<string>>(new Set());

  const runNba = (t: NbaTile) => {
    setActiveNbaId(curr => (curr === t.idKey ? null : t.idKey));
  };

  // Called when the ActionPlanPanel finishes all steps. Marks the tile as
  // sent in the chat store (so the original affordance also reflects it),
  // tracks it locally so the tile shows a ✓, and fires a toast.
  const handlePlanComplete = (t: NbaTile) => {
    if (t.action) markSent(t.idKey);
    setCompletedNbas(prev => {
      const next = new Set(prev);
      next.add(t.idKey);
      return next;
    });
    push({
      kind: 'ok',
      title: `${t.title} — completed`,
      sub: t.action?.who ?? 'All steps executed successfully',
    });
  };

  const activeTile = useMemo(
    () => nbaTiles.find(t => t.idKey === activeNbaId) ?? null,
    [activeNbaId, nbaTiles],
  );

  // ---------- Visibility state ----------
  // Two independent user-controlled visibility modes:
  //  • `minimized` collapses the card body — transcript, chips, NBA row —
  //    down to just the composer. Triggered by the chevron icon.
  //  • `pinned` makes the whole widget stick to the bottom of the scroll
  //    container so it stays reachable while the user scrolls the canvas
  //    above. Triggered by the Pin icon. These combine freely — you can
  //    pin without minimizing, minimize without pinning, or both.
  // NBA row is gated on the user having actually prompted at least once
  // (msgs.length > 0).
  const [minimized, setMinimized] = useState(false);
  // `hidden` collapses the whole card to a small floating "Show" button.
  // Distinct from `minimized` (which keeps the header visible). Lets users
  // fully reclaim the canvas when they don't need the AI surface.
  const [hidden, setHidden] = useState(false);
  // Pin reflects the active session's `pinned` flag (ChatGPT/Claude-style:
  // pin saves the entire conversation thread, not the widget). Pinning before
  // any messages exist is a no-op since there's nothing to save yet.
  const pinned = activeSession?.pinned ?? false;
  // `favorited` marks the current session/thread as a favorite. Locally held
  // (the whole widget is a cross-page surface; a session-scoped bookmark is
  // the right granularity here). Shows a filled star when active.
  const [favorited, setFavorited] = useState(false);
  // `fullscreen` expands the widget out of the sticky bottom slot into a
  // centered modal-style pane. Useful when the user wants to focus on the
  // conversation + action plan and ignore the canvas underneath.
  const [fullscreen, setFullscreen] = useState(false);
  const hasAsked = msgs.length > 0;

  // ---------- Click-outside to close composer popovers ----------
  useEffect(() => {
    if (!openPanel) return;
    const onDocClick = (e: MouseEvent) => {
      const wrap = composerWrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) setOpenPanel(null);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPanel(null); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [openPanel]);

  // ---------- Dynamic scroll-into-view ----------
  // After a response arrives (thinking flips false with at least one message),
  // smoothly scroll the widget itself into the viewport so the user sees the
  // card "move up" and the fresh NBA row materializing below it.
  const widgetRef = useRef<HTMLDivElement>(null);
  const nbaRef = useRef<HTMLDivElement>(null);
  const prevThinking = useRef(thinking);
  useEffect(() => {
    if (prevThinking.current && !thinking && hasAsked) {
      // Response just landed — scroll NBA into view (falls back to widget).
      const target = nbaRef.current ?? widgetRef.current;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    prevThinking.current = thinking;
  }, [thinking, hasAsked]);

  // When hidden, render only a compact floating button at the bottom to restore.
  if (hidden) {
    return (
      <div className={`mt-4 ${pinned ? 'sticky bottom-3 z-30' : ''}`}>
        <button
          onClick={() => setHidden(false)}
          className="inline-flex items-center gap-2 rounded-lg border border-rule bg-surface shadow-e2 px-3.5 py-2 text-[12px] font-medium text-ink hover:border-brand hover:bg-brand-tint hover:text-brand transition-colors"
        >
          <Icon.Sparkle className="w-3.5 h-3.5 text-brand" />
          <span>Show Command Center</span>
          <span className="text-faint">·</span>
          <span className="text-[10px] text-faint">adaptive next best actions</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen backdrop — dim + blur the canvas behind the widget.
          Click-through closes fullscreen. Fades in/out with opacity. */}
      <div
        aria-hidden
        onClick={() => setFullscreen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          fullscreen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
    <div
      ref={widgetRef}
      className={`min-w-0 scroll-mt-6 transition-[top,left,right,bottom,margin,max-width,padding] duration-300 ease-out ${
        fullscreen
          ? 'fixed inset-4 sm:inset-8 md:inset-12 z-50 mt-0 w-auto max-w-none overflow-y-auto overflow-x-hidden bg-surface border border-rule rounded-xl shadow-e3'
          : `w-auto`
      }`}
    >
      {/* ========================================================== */}
      {/* Section 1 — Command Center card                             */}
      {/*                                                              */}
      {/*  Premium treatment to earn its center-stage position:        */}
      {/*   - `shadow-e3` and a 2px brand-tinted ring for depth        */}
      {/*   - top gradient accent bar to brand the widget              */}
      {/*   - backdrop-blur so content behind is gently frosted when   */}
      {/*     pinned and the page scrolls underneath                   */}
      {/* ========================================================== */}
      <div className={`relative bg-surface min-w-0 transition-all duration-300 ${fullscreen ? 'overflow-hidden' : 'border-t border-rule'}`}>
        {/* Row 1 — Title (left) + tagline (right). Flat tinted band per ref. */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-brand-tint/40">
          <span className="text-[14px] font-semibold text-ink tracking-tight">
            Command Center
          </span>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] text-faint truncate">
              Every answer generates a next best action
            </span>
            {/* ✕ button — context-aware:
                • In fullscreen mode → collapses back to the inline view
                • Otherwise → hides the whole Command Center (restore via pill) */}
            <button
              onClick={() => {
                if (fullscreen) {
                  setFullscreen(false);
                  push({ kind: 'info', title: 'Back to inline view' });
                } else {
                  setHidden(true);
                  push({
                    kind: 'info',
                    title: 'Command Center hidden',
                    sub: 'Click the floating pill to show it again',
                  });
                }
              }}
              title={fullscreen ? 'Exit full screen' : 'Hide Command Center'}
              aria-label={fullscreen ? 'Exit full screen' : 'Hide Command Center'}
              className={`rounded grid place-items-center text-faint hover:text-ink hover:bg-surface shrink-0 ${
                fullscreen
                  ? 'inline-flex items-center gap-1 px-2 h-7 text-[11px] font-medium'
                  : 'w-5 h-5'
              }`}
            >
              <Icon.X className={fullscreen ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
              {fullscreen && <span>Close</span>}
            </button>
          </div>
        </div>

        {/* Row 2 — New Chat (left) + Pin / Favorite / Expand (right) per ref */}
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <button
            onClick={() => {
              reset();
              setInput('');
              if (taRef.current) taRef.current.style.height = 'auto';
              push({ kind: 'info', title: 'New chat started' });
            }}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand hover:underline"
          >
            <Icon.Pencil className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <div className="flex items-center gap-1.5">
            <HeaderLabeledButton
              label={minimized ? 'Show' : 'Minimize'}
              active={minimized}
              icon={
                minimized
                  ? <Icon.ChevUp className="w-3.5 h-3.5" />
                  : <Icon.ChevDown className="w-3.5 h-3.5" />
              }
              onClick={() => setMinimized(v => !v)}
            />
            <HeaderLabeledButton
              label="Pin"
              active={pinned}
              icon={<Icon.Pin className="w-3.5 h-3.5" />}
              onClick={() => {
                if (!activeSession) {
                  push({ kind: 'info', title: 'Ask something first', sub: 'Pin saves the whole conversation.' });
                  return;
                }
                const next = !activeSession.pinned;
                togglePinSession(activeSession.id);
                push({
                  kind: 'ok',
                  title: next ? 'Conversation saved' : 'Removed from saved',
                  sub: next ? 'Find it under History · Pinned.' : undefined,
                });
              }}
            />
            <HeaderLabeledButton
              label="Favorite"
              active={favorited}
              icon={
                <Icon.Star
                  className="w-3.5 h-3.5"
                  style={favorited ? { fill: 'currentColor' } : undefined}
                />
              }
              onClick={() => {
                const next = !favorited;
                setFavorited(next);
                push({
                  kind: 'ok',
                  title: next ? 'Added to favorites' : 'Removed from favorites',
                });
              }}
            />
            <HeaderLabeledButton
              label={fullscreen ? 'Collapse' : 'Expand'}
              active={fullscreen}
              icon={<Icon.Open className={`w-3.5 h-3.5 ${fullscreen ? 'rotate-180' : ''}`} />}
              onClick={() => {
                const next = !fullscreen;
                setFullscreen(next);
                if (next) setMinimized(false);
              }}
            />
          </div>
        </div>

        {/* Collapsible body — transcript + suggestion chips collapse together
            when the user minimizes. Uses a CSS-grid row trick
            (`grid-rows-[0fr] → [1fr]`) so the container animates smoothly to
            the content's natural height without needing a JS height probe. */}
        <div
          aria-hidden={minimized}
          className={`grid transition-all duration-300 ease-out ${
            minimized
              ? 'grid-rows-[0fr] opacity-0'
              : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden min-h-0 px-4 pt-3 pb-0">
            {/* Conversation transcript (renders only after first send) */}
            <Transcript thinking={thinking} />

            {/* Suggestion chips — defaults before reply, follow-ups after. */}
            {chipPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chipPrompts.map((p, i) => (
                  <SuggestionChip key={`${p}-${i}`} onClick={() => onChip(p)}>
                    {p}
                  </SuggestionChip>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer — always visible, even in minimized mode.
            `relative z-10` so the type-ahead dropdown and popovers can
            absolutely-position above, and so the composer sits on top of the
            decorative orb. Upgraded to a bolder ask-surface: pure white
            background, heavier border, larger focus halo, bigger textarea. */}
        <div
          ref={composerWrapRef}
          className="relative z-10 mx-4 mt-2 mb-4 bg-surface border border-rule rounded-xl px-3.5 pt-3 pb-2 focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--primary-tint)] transition-all"
        >
          {/* Type-ahead suggestions — floats above the textarea as the user types.
              Uses Sparkle icon + subtle brand tint for the highlighted row. */}
          {showSuggest && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-surface border border-rule rounded-xl shadow-e2 overflow-hidden z-[60] anim-fade-up">
              <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-faint border-b border-rule bg-surface-soft">
                Suggestions
              </div>
              <ul role="listbox" className="max-h-[220px] overflow-y-auto py-1">
                {suggestions.map((s, i) => {
                  const active = i === suggestIdx;
                  return (
                    <li
                      key={s}
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                      onMouseEnter={() => setSuggestIdx(i)}
                      className={`flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer transition-colors ${
                        active ? 'bg-brand-tint text-brand' : 'text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <Icon.Sparkle className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-brand' : 'text-faint'}`} />
                      <span className="truncate">{s}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="px-3 py-1.5 text-[10px] text-faint border-t border-rule bg-surface-soft">
                <span className="font-mono">↑↓</span> navigate · <span className="font-mono">Enter</span> to ask · <span className="font-mono">Esc</span> to clear
              </div>
            </div>
          )}

          {/* Composer utility popover — History / Saved / Suggestions.
              Anchors above the composer, takes over the same floating slot
              as the type-ahead (the two are mutually exclusive since the
              user is either typing or browsing). */}
          {openPanel && !showSuggest && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-surface border border-rule rounded-xl shadow-e2 overflow-hidden z-[60] anim-fade-up">
              {openPanel === 'history' && (
                <HistoryPanel
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onLoad={(id) => { setOpenPanel(null); loadSession(id); }}
                  onTogglePin={(id) => togglePinSession(id)}
                  onDelete={(id) => deleteSession(id)}
                  onClear={() => {
                    clearAllSessions();
                    setOpenPanel(null);
                    push({ kind: 'info', title: 'Cleared unpinned conversations' });
                  }}
                />
              )}
              {openPanel === 'saved' && (
                <SavedPanel
                  saved={saved}
                  onPick={(q) => { setOpenPanel(null); submit(q); }}
                  onRemove={(id) => {
                    removeSaved(id);
                    push({ kind: 'info', title: 'Removed from saved' });
                  }}
                />
              )}
              {openPanel === 'suggestions' && (
                <SuggestionsPanel
                  onPick={(q) => { setOpenPanel(null); submit(q); }}
                  groups={SUGGESTION_GROUPS}
                />
              )}
            </div>
          )}
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={hasAsked ? 'Ask a follow-up…' : 'Ask Meeru anything — e.g. “Why did Enterprise churn spike this quarter?”'}
            className="w-full bg-transparent border-none outline-none text-[14px] text-ink resize-none leading-relaxed py-1 min-h-[48px] max-h-[160px] placeholder:text-faint"
          />
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <UtilityButton
                label="Chat history"
                shortLabel="History"
                icon={<Icon.History className="w-3.5 h-3.5" />}
                active={openPanel === 'history'}
                badge={sessions.length}
                onClick={() => setOpenPanel(p => (p === 'history' ? null : 'history'))}
              />
              <UtilityButton
                label="Saved prompts"
                shortLabel="Saved"
                icon={<Icon.Star className="w-3.5 h-3.5" />}
                active={openPanel === 'saved'}
                badge={saved.length}
                onClick={() => setOpenPanel(p => (p === 'saved' ? null : 'saved'))}
              />
              <UtilityButton
                label="Prompt suggestions"
                shortLabel="Suggestions"
                icon={<Icon.Bulb className="w-3.5 h-3.5" />}
                active={openPanel === 'suggestions'}
                onClick={() => setOpenPanel(p => (p === 'suggestions' ? null : 'suggestions'))}
              />
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() || thinking}
              title="Send (Enter) · Shift+Enter for newline"
              aria-label="Send"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white shadow-e2 hover:shadow-e3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-e1 transition-all shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary) 0%, rgba(182,77,29,0.85) 100%)',
              }}
            >
              <Icon.Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================================
           Section 2 — Dynamic Next Best Action row
           Rendered BELOW the card so the conversation surface stays
           on top and recommended actions follow naturally in the
           reading order. Only visible once the user has prompted.
           `min-w-0` + `overflow-hidden` clip any tile that somehow
           exceeds its column so we never push the parent wider.
           While `thinking` is true we render shimmer skeletons in
           the same grid so the layout doesn't jump when real tiles
           arrive.
           ========================================================== */}
      {hasAsked && (
        <div
          aria-hidden={minimized}
          className={`grid transition-all duration-300 ease-out ${
            minimized
              ? 'grid-rows-[0fr] opacity-0'
              : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden min-h-0">
        <div
          ref={nbaRef}
          className="mt-4 px-4 pb-2 min-w-0 w-full anim-fade-up"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-ink inline-flex items-center gap-1.5">
              {thinking ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" />
                  Preparing Next Best Actions
                </>
              ) : (
                <>Next Best Action</>
              )}
            </div>
          </div>
          {/* Horizontal scroll row — fixed-width cards so users can scroll
              through many NBAs without the layout collapsing to 1 column.
              Each card stays at a readable ~260px, independent of how many
              the response returned. Cards respect the section's horizontal
              padding so they don't hug the card edges. */}
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
            {thinking ? (
              <>
                <div className="shrink-0 w-[260px]"><NbaSkeleton delayMs={0} /></div>
                <div className="shrink-0 w-[260px]"><NbaSkeleton delayMs={80} /></div>
                <div className="shrink-0 w-[260px]"><NbaSkeleton delayMs={160} /></div>
                <div className="shrink-0 w-[260px]"><NbaSkeleton delayMs={240} /></div>
              </>
            ) : (
              nbaTiles.map((tile, idx) => {
                const isSent = sent.has(tile.idKey);
                const isCompleted = completedNbas.has(tile.idKey);
                const isSelected = activeNbaId === tile.idKey;
                return (
                  <div
                    key={tile.idKey}
                    className={`shrink-0 w-[260px] snap-start anim-fade-up ${isSent && !isCompleted ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <NbaCard
                      tile={tile}
                      onRun={runNba}
                      selected={isSelected}
                      completed={isCompleted}
                    />
                  </div>
                );
              })
            )}
          </div>
          {/* Action plan for the selected NBA — renders inline below the grid
              so the user sees the tiles + steps together. A single panel is
              shown at a time; clicking a different tile swaps to that plan. */}
          {activeTile && !thinking && (
            <ActionPlanPanel
              key={activeTile.idKey}
              tile={activeTile}
              onClose={() => setActiveNbaId(null)}
              onComplete={handlePlanComplete}
            />
          )}
        </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
