import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useChat, useSettings, useIndustryData } from '../store';
import type { ChatSession } from '../store';
import { Icon } from '../icons';
import type { CommentaryItem, VarianceStatus } from '../types';

const MIN_W = 320;
const MAX_W = 560;

/**
 * CommentaryPanel — the right-side AI Commentary surface.
 *
 * Matches the existing `Commentary.tsx` aesthetic (circular rank pill, <Badge>
 * tags, muted-weak fills, rule-line separators) — no bright left stripes, no
 * solid brand pills. The panel uses the same design tokens the rest of the app
 * uses so it reads as part of the workbench, not a bolted-on widget.
 */

type SortKey = 'impact' | 'severity' | 'recency';

interface Props {
  items: CommentaryItem[];
  scopeLabel?: string;
  headline?: string;
  subHeadline?: string;
  style?: CSSProperties;
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function parseDelta(delta: string): number {
  const m = delta.match(/([-+])?\$?\s*([\d.]+)\s*([MBK]|bps|pp)?/i);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const val = parseFloat(m[2] || '0');
  const unit = (m[3] || 'M').toUpperCase();
  const mult = unit === 'B' ? 1000 : unit === 'K' ? 0.001 : 1;
  return sign * val * mult;
}

function severityScore(item: CommentaryItem): number {
  let s = 0;
  for (const t of item.tags) {
    if (t.t === 'red') s += 3;
    else if (t.t === 'amber') s += 2;
    else if (t.t === 'blue') s += 1;
  }
  return s;
}

function deltaClass(delta: string): string {
  if (delta.includes('+')) return 'text-positive';
  if (delta.includes('-') || delta.includes('▼')) return 'text-negative';
  return 'text-muted';
}

function variancePrefix(items: CommentaryItem[]): string {
  const negatives = items
    .map(i => parseDelta(i.delta))
    .filter(v => v < 0)
    .reduce((a, b) => a + b, 0);
  if (!negatives) return "this week's variance";
  return `this week's ${negatives.toFixed(1).replace('-', '-$')}M variance`;
}

/* ------------------------------------------------------------------ */
/* Tier-1 row metadata derivation                                     */
/* ------------------------------------------------------------------ */

/** Infer a workflow status from the item's tags + delta when not provided. */
function deriveStatus(item: CommentaryItem): VarianceStatus {
  if (item.status) return item.status;
  const tagText = item.tags.map(t => t.l.toLowerCase()).join(' ');
  const isPositive = item.delta.trim().startsWith('+') || /beat|above plan/i.test(item.delta);
  if (isPositive) return 'monitoring';
  if (/auto-recover|weather|holiday|rebound|w12 resolution/i.test(tagText)) return 'auto-recovering';
  if (/3 wks|critical|breach|red line|supply constraint|escalating/i.test(tagText)) return 'investigating';
  if (/watch|approaching|early warning|threshold/i.test(tagText)) return 'monitoring';
  return 'investigating';
}

function deriveImpactM(item: CommentaryItem): number {
  if (typeof item.impactM === 'number') return item.impactM;
  return parseDelta(item.delta);
}

/** Visual config for each workflow state. */
const STATUS_META: Record<VarianceStatus, { label: string; bg: string; fg: string; dot: string }> = {
  investigating:     { label: 'Investigating',  bg: 'bg-warning-weak',  fg: 'text-warning',  dot: 'bg-warning'  },
  submitted:         { label: 'In review',      bg: 'bg-brand-tint',    fg: 'text-brand',    dot: 'bg-brand'    },
  reviewing:         { label: 'In review',      bg: 'bg-brand-tint',    fg: 'text-brand',    dot: 'bg-brand'    },
  approved:          { label: 'Approved',       bg: 'bg-positive-weak', fg: 'text-positive', dot: 'bg-positive' },
  locked:            { label: 'Period locked',  bg: 'bg-surface-soft',  fg: 'text-muted',    dot: 'bg-muted'    },
  'auto-recovering': { label: 'Auto-recovering',bg: 'bg-positive-weak', fg: 'text-positive', dot: 'bg-positive' },
  monitoring:        { label: 'Monitoring',     bg: 'bg-surface-soft',  fg: 'text-muted',    dot: 'bg-faint'    },
};

function StatusChip({ status }: { status: VarianceStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${m.bg} ${m.fg} shrink-0`}
      title={`Workflow state: ${m.label}`}
    >
      <span className={`w-1 h-1 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Red $ icon flag when variance crosses the $1M SOX materiality threshold. */
function MaterialityFlag({ impactM }: { impactM: number }) {
  if (Math.abs(impactM) < 1) return null;
  return (
    <span
      title={`Materiality ceiling exceeded · ${impactM < 0 ? '−' : '+'}$${Math.abs(impactM).toFixed(1)}M`}
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-negative-weak text-negative text-[8px] font-bold shrink-0"
    >
      $
    </span>
  );
}

/** Compact 5-point bar sparkline. Last bar full opacity (anchors the eye on
 *  the current week); earlier bars muted. Colored by variance direction. */
function MiniSpark({ points, negative }: { points: number[]; negative: boolean }) {
  const W = 48, H = 16;
  const min = Math.min(...points), max = Math.max(...points);
  const slot = W / Math.max(1, points.length);
  const barW = Math.max(2, slot - 1.5);
  const color = negative ? 'var(--negative)' : 'var(--positive)';
  const muted = negative ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)';
  return (
    <svg width={W} height={H} className="shrink-0" aria-hidden>
      {points.map((v, i) => {
        const h = Math.max(2, ((v - min) / Math.max(max - min, 1)) * (H - 2) + 2);
        const x = i * slot + (slot - barW) / 2;
        const y = H - h;
        const isLast = i === points.length - 1;
        return (
          <rect key={i} x={x} y={y} width={barW} height={h} rx={0.5} fill={isLast ? color : muted} />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* presentational pieces                                               */
/* ------------------------------------------------------------------ */

function SortPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
        active
          ? 'bg-brand-tint text-brand border border-brand/30'
          : 'text-muted hover:text-ink hover:bg-surface-soft border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function DriverRow({
  item,
  rank,
  spark,
  onDrill,
  onAsk,
  isLast,
}: {
  item: CommentaryItem;
  rank: number;
  spark?: number[];
  onDrill: () => void;
  onAsk: () => void;
  isLast: boolean;
}) {
  const deltaCls = deltaClass(item.delta);
  const status = deriveStatus(item);
  const impactM = deriveImpactM(item);
  const isNegative = impactM < 0;
  const sparkPoints = spark && spark.length > 1 ? spark : undefined;

  return (
    <div className={`flex gap-2.5 py-2.5 ${isLast ? '' : 'border-b border-rule'}`}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-6 h-6 rounded-full bg-surface-soft grid place-items-center text-[11px] font-semibold text-ink">
          {rank}
        </div>
        <MaterialityFlag impactM={impactM} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-[12px]">
          <span className="font-semibold text-ink truncate">{item.name}</span>
          <span className={`text-[11px] font-medium num shrink-0 ${deltaCls}`}>— {item.delta}</span>
        </div>
        {/* Row meta strip: status chip · sparkline — packs both indicators on
            a single line so the description block below stays clean. */}
        <div className="flex items-center gap-2 mt-1">
          <StatusChip status={status} />
          {sparkPoints && <MiniSpark points={sparkPoints} negative={isNegative} />}
        </div>
        <div className="text-[11.5px] text-muted leading-relaxed mt-1.5">{item.text}</div>
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          <button
            onClick={onDrill}
            className="inline-flex items-center gap-0.5 text-brand hover:underline font-medium"
          >
            Drill down
            <Icon.ChevRight className="w-3 h-3" />
          </button>
          <span className="text-faint">·</span>
          <button
            onClick={onAsk}
            className="inline-flex items-center gap-1 text-muted hover:text-ink"
          >
            <Icon.Sparkle className="w-3 h-3" />
            Ask about this
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* history (session-based)                                              */
/* ------------------------------------------------------------------ */

function formatHistoryWhen(ts: number): string {
  const when = new Date(ts);
  const today = new Date();
  const sameDay =
    when.getFullYear() === today.getFullYear() &&
    when.getMonth() === today.getMonth() &&
    when.getDate() === today.getDate();
  if (sameDay) {
    return when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return when.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function SessionRow({
  session, isActive, onLoad, onTogglePin, onRename, onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onLoad: () => void;
  onTogglePin: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  // Inline rename — pencil item in the dropdown switches the title to a
  // focused text input. Enter / blur commits, Escape cancels.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);
  // Kebab dropdown for row actions. Stays anchored to the row so narrow
  // panels don't push the timestamp under the buttons.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editing) {
      setDraft(session.title);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, session.title]);
  // Close the menu on outside click / Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== session.title) onRename(next);
    setEditing(false);
  };

  // Surface the most recent AI reply as the snippet — that's the content the
  // user is most likely scanning for when they revisit a thread.
  const lastAi = [...session.messages].reverse().find(m => m.role === 'ai');
  const snippet = lastAi?.html ? stripHtml(lastAi.html) : (lastAi?.text ?? '');
  const turnCount = Math.floor(session.messages.length / 2);
  return (
    <div
      onClick={editing ? undefined : onLoad}
      className={`group relative mb-2 px-2.5 py-2 rounded-md border transition-colors ${
        editing ? 'cursor-default' : 'cursor-pointer'
      } ${
        isActive ? 'border-brand bg-brand-tint/60' : 'border-rule bg-surface-soft hover:border-brand-weak hover:bg-brand-tint/40'
      }`}
    >
      {/* `pr-7` reserves space for the kebab button anchored at the row's
          top-right corner — without it the timestamp slides under the menu
          trigger on narrower panels. */}
      <div className="flex items-center justify-between mb-1 gap-2 pr-7">
        <span className="text-[9.5px] font-bold tracking-wider uppercase text-faint truncate min-w-0">
          {session.persona ?? 'You'}
          {session.scope && session.scope !== 'Variance Workbench' ? ` · ${session.scope}` : ''}
          <span className="text-faint ml-1.5">· {turnCount} {turnCount === 1 ? 'turn' : 'turns'}</span>
        </span>
        <span className="text-[10px] text-faint shrink-0">{formatHistoryWhen(session.updatedAt)}</span>
      </div>
      <div className="flex items-start gap-1.5 pr-7">
        {session.pinned && !editing && <Icon.Pin className="w-3 h-3 text-brand shrink-0 mt-0.5" />}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              else if (e.key === 'Escape') { setEditing(false); }
            }}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            maxLength={80}
            className="flex-1 text-[12px] font-semibold text-ink leading-snug bg-surface border border-brand rounded px-1.5 py-0.5 outline-none"
          />
        ) : (
          <div className="text-[12px] font-semibold text-ink line-clamp-2 leading-snug flex-1">
            {session.title}
          </div>
        )}
      </div>
      {snippet && !editing && (
        <div className="text-[11px] text-muted line-clamp-2 mt-1 leading-snug">
          {snippet}
        </div>
      )}
      {/* Kebab menu — single trigger replaces the 3 inline icons so the
          timestamp can never collide with action buttons on narrow panels. */}
      {!editing && (
        <div ref={menuRef} className="absolute right-1 top-1">
          <button
            type="button"
            title="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className={`w-6 h-6 rounded grid place-items-center border transition-colors ${
              menuOpen
                ? 'text-ink bg-surface border-rule'
                : 'text-muted hover:text-ink border-transparent hover:border-rule hover:bg-surface'
            }`}
          >
            {/* Vertical dots glyph (kebab). Inline so we don't add a new icon. */}
            <span aria-hidden className="flex flex-col gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-current" />
              <span className="w-[3px] h-[3px] rounded-full bg-current" />
              <span className="w-[3px] h-[3px] rounded-full bg-current" />
            </span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 z-30 w-40 bg-surface border border-rule rounded-md shadow-e3 overflow-hidden anim-fade-up"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onTogglePin(); }}
                className="w-full px-3 py-1.5 text-[12px] text-ink hover:bg-brand-tint hover:text-brand flex items-center gap-2 text-left"
              >
                <Icon.Pin className={`w-3.5 h-3.5 ${session.pinned ? 'text-brand' : 'text-faint'}`} />
                {session.pinned ? 'Unpin' : 'Pin conversation'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="w-full px-3 py-1.5 text-[12px] text-ink hover:bg-brand-tint hover:text-brand flex items-center gap-2 text-left"
              >
                <Icon.Pencil className="w-3.5 h-3.5 text-faint" />
                Rename
              </button>
              <div className="h-px bg-rule" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full px-3 py-1.5 text-[12px] text-negative hover:bg-negative-weak flex items-center gap-2 text-left"
              >
                <Icon.X className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryView({
  sessions, activeSessionId, onLoad, onTogglePin, onRename, onDelete, onClear,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoad: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  // Sub-filter: All vs Pinned. Pinned counter shown in the chip badge so
  // users see how many saved threads exist at a glance.
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  const pinnedCount = useMemo(() => sessions.filter(s => s.pinned).length, [sessions]);

  const sorted = useMemo(() => {
    const pool = filter === 'pinned' ? sessions.filter(s => s.pinned) : sessions;
    return [...pool].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [sessions, filter]);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-3.5 py-8 text-center">
        <div className="text-[12px] text-faint">
          No conversations yet.
        </div>
        <div className="text-[11px] text-faint mt-1">
          Ask the Command Center anything to start your first chat.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-3">
      {/* Sub-filter chips — All / Pinned. Live counters show what's where. */}
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase transition-colors ${
            filter === 'all' ? 'bg-brand-tint text-brand border border-brand-weak' : 'text-muted hover:text-ink border border-transparent'
          }`}
        >
          All
          <span className={`px-1 rounded-full text-[9.5px] ${filter === 'all' ? 'bg-surface text-brand' : 'bg-surface-soft text-muted'}`}>
            {sessions.length}
          </span>
        </button>
        <button
          onClick={() => setFilter('pinned')}
          disabled={pinnedCount === 0}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            filter === 'pinned' ? 'bg-brand-tint text-brand border border-brand-weak' : 'text-muted hover:text-ink border border-transparent'
          }`}
        >
          <Icon.Pin className="w-2.5 h-2.5" />
          Pinned
          <span className={`px-1 rounded-full text-[9.5px] ${filter === 'pinned' ? 'bg-surface text-brand' : 'bg-surface-soft text-muted'}`}>
            {pinnedCount}
          </span>
        </button>
        <div className="flex-1" />
        {filter === 'all' && (
          <button
            onClick={onClear}
            title="Clear unpinned conversations"
            className="text-[10.5px] text-muted hover:text-ink underline"
          >
            Clear unpinned
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-[12px] text-faint">No pinned conversations.</div>
          <div className="text-[11px] text-faint mt-1">
            Pin a conversation from the Command Center header or open the ⋮ menu on any row.
          </div>
        </div>
      ) : sorted.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          isActive={s.id === activeSessionId}
          onLoad={() => onLoad(s.id)}
          onTogglePin={() => onTogglePin(s.id)}
          onRename={(title) => onRename(s.id, title)}
          onDelete={() => onDelete(s.id)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                                */
/* ------------------------------------------------------------------ */

export function CommentaryPanel({
  items,
  scopeLabel,
  headline,
  subHeadline = 'Ranked by impact · sparkle explanations ready',
  style,
}: Props) {
  const { settings, update } = useSettings();
  const {
    send, sessions, activeSessionId, loadSession, togglePinSession,
    renameSession, deleteSession, clearAllSessions,
  } = useChat();
  const industry = useIndustryData();
  // Tab toggle: Insights (existing ranked drivers) vs. History (persisted
  // conversation log). History stays focused on the user's own asks so the
  // Insights surface remains the agent's authored summary.
  const [tab, setTab] = useState<'insights' | 'history'>('insights');

  // Build a name→sparkline lookup from the active industry's drill rows so the
  // right-nav row sparkline shows the same trend as the Drill-Down card.
  const sparkByName = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of industry.drilldown) {
      map[r.customer.toLowerCase()] = r.spark;
    }
    return map;
  }, [industry]);

  const [sort, setSort] = useState<SortKey>('impact');
  const [expanded, setExpanded] = useState(false);

  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const dx = dragState.current.startX - e.clientX;
      const nextW = Math.max(MIN_W, Math.min(MAX_W, dragState.current.startW + dx));
      update({ chatWidth: nextW });
    };
    const onUp = () => {
      if (dragState.current) {
        dragState.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [update]);

  const onHandleDown = (e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startW: settings.chatWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };
  const onHandleDouble = () => update({ chatWidth: 360 });

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === 'impact') {
      arr.sort((a, b) => Math.abs(parseDelta(b.delta)) - Math.abs(parseDelta(a.delta)));
    } else if (sort === 'severity') {
      arr.sort((a, b) => severityScore(b) - severityScore(a));
    } else {
      arr.sort((a, b) => a.rank - b.rank);
    }
    return arr;
  }, [items, sort]);

  const visible = expanded ? sorted : sorted.slice(0, 3);
  const hiddenCount = Math.max(0, sorted.length - 3);

  const headlineText = headline ?? `Drivers of ${variancePrefix(items)}`;

  const sourceCount = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const t of it.tags) set.add(t.l);
    return Math.max(3, Math.min(9, set.size));
  }, [items]);

  if (settings.chatHidden) return null;

  return (
    <aside
      style={style}
      className="bg-surface border-l border-rule flex flex-col overflow-hidden relative"
    >
      {/* resize handle */}
      <div
        onMouseDown={onHandleDown}
        onDoubleClick={onHandleDouble}
        title="Drag to resize · double-click to reset"
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-weak group z-20"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r bg-rule opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Panel header — tabs are the primary identity now (no redundant "AI
          INSIGHTS" label). Live dot + brand mark anchor the panel; tab toggle
          uses an underline indicator like a typical app sidebar. */}
      <div className="px-3.5 pt-3 pb-0 border-b border-rule bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative inline-flex w-1.5 h-1.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-positive opacity-60 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-positive" />
          </span>
          <Icon.Bulb className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="text-[10.5px] font-bold tracking-wider uppercase text-faint">Assistant</span>
          <div className="flex-1" />
          {tab === 'insights' && (
            <button
              onClick={() => setExpanded(false)}
              title="Refresh — fetch the latest ranked commentary"
              className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
            >
              <Icon.Refresh className="w-3 h-3" />
              New
            </button>
          )}
          <button
            onClick={() => update({ chatHidden: true })}
            title="Hide AI panel"
            className="w-6 h-6 rounded grid place-items-center text-faint hover:text-ink transition-colors"
          >
            <Icon.X className="w-3 h-3" />
          </button>
        </div>
        {/* Underline-style tab toggle. Active tab gets a 2px brand bar — no
            pill chrome — so the panel reads as a single surface with two
            views, not a button row. */}
        <div className="flex">
          <button
            onClick={() => setTab('insights')}
            className={`relative px-3 pb-2 pt-1 text-[12px] font-semibold tracking-wide transition-colors ${
              tab === 'insights' ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Insights
            {tab === 'insights' && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brand rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`relative px-3 pb-2 pt-1 text-[12px] font-semibold tracking-wide transition-colors inline-flex items-center gap-1.5 ${
              tab === 'history' ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Chat History
            {sessions.length > 0 && (
              <span className={`px-1.5 rounded-full text-[10px] font-bold ${tab === 'history' ? 'bg-brand text-white' : 'bg-surface-soft text-muted'}`}>
                {sessions.length}
              </span>
            )}
            {tab === 'history' && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brand rounded-full" />
            )}
          </button>
        </div>
      </div>

      {tab === 'insights' ? (
        <div className="flex-1 overflow-y-auto px-3.5 py-3">
          {/* (The "Drivers of …" headline used to render here, but the
              workbench's top scope row now carries the period + region label,
              so repeating it inside the panel was just visual duplication.) */}

          {/* ranked driver rows — same layout as main Commentary component.
              The AI-conversation card that used to live here was removed so
              this panel stops duplicating the Command Center transcript. */}
          <div>
            {visible.map((it, i) => (
              <DriverRow
                key={`${it.name}-${i}`}
                item={it}
                rank={i + 1}
                spark={it.spark ?? sparkByName[it.name.toLowerCase()]}
                onDrill={() => {
                  // Dispatch to the host page so it can filter/navigate.
                  // Falls back to chat if nothing is listening.
                  const evt = new CustomEvent('meeru-drill', { detail: { itemName: it.name } });
                  window.dispatchEvent(evt);
                }}
                onAsk={() => send(`Tell me more about ${it.name}`)}
                isLast={i === visible.length - 1}
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full mt-2 py-1.5 text-[11.5px] font-medium text-brand hover:underline inline-flex items-center justify-center gap-1"
            >
              {expanded ? 'Show fewer drivers' : `Show ${hiddenCount} more driver${hiddenCount > 1 ? 's' : ''}`}
              <span className="inline-block">{expanded ? '↑' : '↓'}</span>
            </button>
          )}
        </div>
      ) : (
        <HistoryView
          sessions={sessions}
          activeSessionId={activeSessionId}
          onLoad={loadSession}
          onTogglePin={togglePinSession}
          onRename={renameSession}
          onDelete={deleteSession}
          onClear={clearAllSessions}
        />
      )}

      {/* footer meta */}
      <div className="px-3.5 py-2 border-t border-rule text-[11px] text-faint flex items-center justify-end">
        <span>Claims cite <span className="font-medium text-muted">{sourceCount}</span> sources</span>
      </div>
    </aside>
  );
}

export function CommentaryShowButton() {
  const { settings, update } = useSettings();
  if (!settings.chatHidden) return null;
  return (
    <button
      onClick={() => update({ chatHidden: false })}
      title="Show AI Insights"
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-surface border border-rule border-r-0 rounded-l-lg px-1.5 py-2.5 z-40 shadow-e2 hover:bg-brand-tint hover:border-brand text-muted hover:text-brand transition-colors flex flex-col items-center gap-1"
    >
      <Icon.Sparkle className="w-3.5 h-3.5" />
      <span className="text-[9px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180">AI</span>
    </button>
  );
}
