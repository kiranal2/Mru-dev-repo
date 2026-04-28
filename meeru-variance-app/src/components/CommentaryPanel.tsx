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
  session, isActive, onLoad, onTogglePin, onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onLoad: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  // Surface the most recent AI reply as the snippet — that's the content the
  // user is most likely scanning for when they revisit a thread.
  const lastAi = [...session.messages].reverse().find(m => m.role === 'ai');
  const snippet = lastAi?.html ? stripHtml(lastAi.html) : (lastAi?.text ?? '');
  const turnCount = Math.floor(session.messages.length / 2);
  return (
    <div
      onClick={onLoad}
      className={`group relative mb-2 px-2.5 py-2 rounded-md border cursor-pointer transition-colors ${
        isActive ? 'border-brand bg-brand-tint/60' : 'border-rule bg-surface-soft hover:border-brand-weak hover:bg-brand-tint/40'
      }`}
    >
      <div className="flex items-center justify-between mb-1 pr-12">
        <span className="text-[9.5px] font-bold tracking-wider uppercase text-faint truncate">
          {session.persona ?? 'You'}
          {session.scope && session.scope !== 'Variance Workbench' ? ` · ${session.scope}` : ''}
          <span className="text-faint ml-1.5">· {turnCount} {turnCount === 1 ? 'turn' : 'turns'}</span>
        </span>
        <span className="text-[10px] text-faint shrink-0">{formatHistoryWhen(session.updatedAt)}</span>
      </div>
      <div className="flex items-start gap-1.5 pr-12">
        {session.pinned && <Icon.Pin className="w-3 h-3 text-brand shrink-0 mt-0.5" />}
        <div className="text-[12px] font-semibold text-ink line-clamp-2 leading-snug flex-1">
          {session.title}
        </div>
      </div>
      {snippet && (
        <div className="text-[11px] text-muted line-clamp-2 mt-1 leading-snug">
          {snippet}
        </div>
      )}
      {/* Per-row actions (pin, delete) — appear on hover so the row stays clean. */}
      <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          title={session.pinned ? 'Unpin' : 'Pin conversation'}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className="w-6 h-6 rounded grid place-items-center text-faint hover:text-brand hover:bg-surface"
        >
          <Icon.Pin className={`w-3.5 h-3.5 ${session.pinned ? 'text-brand' : ''}`} />
        </button>
        <button
          type="button"
          title="Delete conversation"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-6 h-6 rounded grid place-items-center text-faint hover:text-negative hover:bg-surface"
        >
          <Icon.X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function HistoryView({
  sessions, activeSessionId, onLoad, onTogglePin, onDelete, onClear,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoad: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  // Pinned sessions float to the top so saved threads are always one tap away.
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    }),
    [sessions],
  );
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
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-faint">
          Recent · newest first
        </span>
        <button
          onClick={onClear}
          title="Clear unpinned conversations"
          className="text-[10.5px] text-muted hover:text-ink underline"
        >
          Clear unpinned
        </button>
      </div>
      {sorted.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          isActive={s.id === activeSessionId}
          onLoad={() => onLoad(s.id)}
          onTogglePin={() => onTogglePin(s.id)}
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
    deleteSession, clearAllSessions,
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

      {/* header — same visual weight as CardHeader elsewhere */}
      <div className="px-3.5 pt-3 pb-2 border-b border-rule bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex w-1.5 h-1.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-positive opacity-60 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-positive" />
          </span>
          <Icon.Bars className="w-3 h-3 text-brand shrink-0" />
          <div className="text-[10.5px] font-bold tracking-wider uppercase text-ink">AI Insights</div>
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(false)}
            title="Refresh — fetch the latest ranked commentary"
            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
          >
            <Icon.Refresh className="w-3 h-3" />
            New
          </button>
          <button
            onClick={() => update({ chatHidden: true })}
            title="Hide AI panel"
            className="w-6 h-6 rounded grid place-items-center text-faint hover:text-ink transition-colors"
          >
            <Icon.X className="w-3 h-3" />
          </button>
        </div>
        {/* Tab switcher — Insights vs History */}
        <div className="flex gap-1 mt-2 -mb-0.5">
          <button
            onClick={() => setTab('insights')}
            className={`flex-1 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase transition-colors ${
              tab === 'insights' ? 'bg-brand-tint text-brand border border-brand-weak' : 'text-muted hover:text-ink'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase transition-colors inline-flex items-center justify-center gap-1.5 ${
              tab === 'history' ? 'bg-brand-tint text-brand border border-brand-weak' : 'text-muted hover:text-ink'
            }`}
          >
            History
            {sessions.length > 0 && (
              <span className={`px-1 rounded-full text-[10px] font-bold ${tab === 'history' ? 'bg-surface text-brand' : 'bg-surface-soft text-muted'}`}>
                {sessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'insights' ? (
        <div className="flex-1 overflow-y-auto px-3.5 py-3">
          {/* headline — concise, single line */}
          <div className="text-[12px] font-semibold text-ink leading-tight mb-3">
            {headlineText}
          </div>

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
